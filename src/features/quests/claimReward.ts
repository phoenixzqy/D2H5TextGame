/** Shared synchronous quest reward boundary; completion and claim stay separate. */
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { loadQuests, type QuestDef } from '@/data/loaders/quests';

export type ClaimResult =
  | 'ok'
  | 'unknown-quest'
  | 'not-completed'
  | 'already-claimed'
  | 'no-rewards'
  | 'no-player'
  | 'not-ready'
  | 'unsupported-rewards'
  | 'claim-in-progress'
  | 'grant-failed';

type NumericReward = 'xp' | 'skillPoints' | 'statPoints'
  | 'runes' | 'runeShards' | 'gems' | 'wishstones';

function isNumericReward(key: string): key is NumericReward {
  return key === 'xp' || key === 'skillPoints' || key === 'statPoints'
    || key === 'runes' || key === 'runeShards' || key === 'gems' || key === 'wishstones';
}

function findQuest(questId: string): QuestDef | undefined {
  return loadQuests().find((q) => q.id === questId);
}

/** Basic action availability; execution can still refuse with a retryable reason. */
export function canClaim(questId: string): boolean {
  const progress = useMapStore.getState().questProgress[questId];
  if (!progress) return false;
  if (progress.status !== 'completed') return false;
  if (progress.rewardClaimed) return false;
  const quest = findQuest(questId);
  return Boolean(quest?.rewards && Object.keys(quest.rewards).length > 0);
}

// Global across quests: a nested second claim must not be erased by rollback.
let claimInProgress = false;

/**
 * Preflight the whole bundle before writes, then settle grants and claimed flag.
 * Synchronous grant failures restore participating data before returning. Stores
 * may publish intermediate states; this is not observer-wide or crash atomicity.
 * Failed restoration throws explicitly instead of reporting unchanged data.
 */
export function claimQuestReward(questId: string): ClaimResult {
  if (claimInProgress) return 'claim-in-progress';
  claimInProgress = true;
  try {
    const progress = useMapStore.getState().questProgress[questId];
    if (!progress || progress.status !== 'completed') return 'not-completed';
    if (progress.rewardClaimed) return 'already-claimed';
    const quest = findQuest(questId);
    if (!quest) return 'unknown-quest';
    const rewards = quest.rewards;
    if (!rewards || Object.keys(rewards).length === 0) return 'no-rewards';
    if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
    const player = usePlayerStore.getState().player;
    if (!player) return 'no-player';

    const grants: { kind: NumericReward; amount: number }[] = [];
    for (const [kind, amount] of Object.entries(rewards)) {
      // Gold has no executable economy; authored zero is a harmless no-op.
      if (kind === 'gold' && amount === 0) continue;
      if (!isNumericReward(kind) || typeof amount !== 'number'
        || !Number.isInteger(amount) || amount < 0) return 'unsupported-rewards';
      if (amount > 0) grants.push({ kind, amount });
    }
    if (grants.length === 0) return 'no-rewards';

    const changesPlayer = grants.some(({ kind }) =>
      kind === 'xp' || kind === 'skillPoints' || kind === 'statPoints');
    const sharesXp = grants.some(({ kind }) => kind === 'xp');
    const changesCurrency = grants.some(({ kind }) =>
      kind !== 'xp' && kind !== 'skillPoints' && kind !== 'statPoints');
    const { ownedMercs, mercProgress } = useMercStore.getState();
    const { currencies } = useInventoryStore.getState();

    try {
      for (const { kind, amount } of grants) {
        if (kind === 'xp') {
          usePlayerStore.getState().gainExperience(amount);
          useMercStore.getState().shareExperienceWithFielded(amount);
        } else if (kind === 'skillPoints' || kind === 'statPoints') {
          usePlayerStore.setState((state) => state.player
            ? { player: { ...state.player, [kind]: state.player[kind] + amount } }
            : state);
        } else {
          useInventoryStore.getState().addCurrency(kind, amount);
        }
      }
      useMapStore.getState().markQuestRewardClaimed(questId);
      return 'ok';
    } catch (cause) {
      // Partial updates retain actions and unrelated data. Attempt every restore
      // even if an observer/setState throws, keeping the guard until finally.
      const restoreErrors: unknown[] = [];
      const restore = (operation: () => void): void => {
        try { operation(); } catch (error) { restoreErrors.push(error); }
      };
      if (changesPlayer) restore(() => { usePlayerStore.setState({ player }); });
      if (sharesXp) restore(() => { useMercStore.setState({ ownedMercs, mercProgress }); });
      if (changesCurrency) restore(() => { useInventoryStore.setState({ currencies }); });
      restore(() => { useMapStore.setState((state) => ({
        questProgress: { ...state.questProgress, [questId]: progress }
      })); });
      if (restoreErrors.length > 0) {
        throw new AggregateError(restoreErrors, 'Quest reward restoration failed', { cause });
      }
      return 'grant-failed';
    }
  } finally {
    claimInProgress = false;
  }
}
