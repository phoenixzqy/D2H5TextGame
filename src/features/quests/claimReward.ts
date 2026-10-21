/** Shared synchronous quest reward boundary; completion and claim stay separate. */
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { loadQuests, type QuestDef } from '@/data/loaders/quests';
import { loadAwardPools } from '@/data/loaders/loot';
import { rollUniqueItem, type RollUniqueItemInput } from '@/engine/loot/rollItem';
import { createRng, hashSeed } from '@/engine/rng';
import type { Item } from '@/engine/types/items';
import { assertIronGolemOwnershipMutationAllowed } from '@/stores/waveTransitionGuard';

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
 * Throws WaveGuardError before reads or claim ownership during an exact Iron debit.
 */
export function claimQuestReward(questId: string): ClaimResult {
  assertIronGolemOwnershipMutationAllowed();
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
    let uniqueReward: RollUniqueItemInput | undefined;
    for (const [kind, amount] of Object.entries(rewards)) {
      // Gold has no executable economy; authored zero is a harmless no-op.
      if (kind === 'gold' && amount === 0) continue;
      if (kind === 'itemDrop') {
        if (typeof amount !== 'object' || amount === null
          || !('uniqueId' in amount) || typeof amount.uniqueId !== 'string'
          || !('ilvl' in amount) || typeof amount.ilvl !== 'number'
          || !Number.isInteger(amount.ilvl) || amount.ilvl < 1) return 'unsupported-rewards';
        uniqueReward = { uniqueId: amount.uniqueId, ilvl: amount.ilvl };
        continue;
      }
      if (!isNumericReward(kind) || typeof amount !== 'number'
        || !Number.isInteger(amount) || amount < 0) return 'unsupported-rewards';
      if (amount > 0) grants.push({ kind, amount });
    }
    if (grants.length === 0 && !uniqueReward) return 'no-rewards';

    // Preparation is private: failure here must not publish rollback writes.
    let item: Item | undefined;
    if (uniqueReward) {
      try {
        const seed = hashSeed(JSON.stringify([
          'quest-unique-v1', player.id, quest.id, uniqueReward.uniqueId, uniqueReward.ilvl
        ]));
        item = rollUniqueItem(uniqueReward, loadAwardPools(), createRng(seed));
      } catch {
        return 'grant-failed';
      }
      if (!item) return 'unsupported-rewards';
    }

    const changesPlayer = grants.some(({ kind }) =>
      kind === 'xp' || kind === 'skillPoints' || kind === 'statPoints');
    const sharesXp = grants.some(({ kind }) => kind === 'xp');
    const changesCurrency = grants.some(({ kind }) =>
      kind !== 'xp' && kind !== 'skillPoints' && kind !== 'statPoints');
    const { ownedMercs, mercProgress } = useMercStore.getState();
    const inventory = useInventoryStore.getState();
    const inventorySnapshot = {
      ...(changesCurrency ? { currencies: inventory.currencies } : {}),
      ...(item ? { backpack: inventory.backpack } : {})
    };

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
      if (item) useInventoryStore.getState().addItem(item);
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
      if (changesCurrency || item) restore(() => { useInventoryStore.setState(inventorySnapshot); });
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
