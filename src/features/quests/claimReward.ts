/** Shared synchronous quest reward boundary; completion and claim stay separate. */
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, MERC_XP_SHARE, mercXpForLevel } from '@/stores/mercStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { loadQuests, type QuestDef } from '@/data/loaders/quests';
import { loadAwardPools } from '@/data/loaders/loot';
import { rollUniqueItem, type RollUniqueItemInput } from '@/engine/loot/rollItem';
import { createRng, hashSeed } from '@/engine/rng';
import type { Item } from '@/engine/types/items';
import { withQuestTransaction } from './questTransaction';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { awardXp, LEVEL_CAP, xpTotal } from '@/engine/progression/xp';
import type { Player } from '@/engine/types/entities';
import type { QuestItemLedger } from '@/engine/types/save';

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

function safeCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Use production progression to preflight every participating integer before publication. */
function safeGrants(player: Player, grants: readonly { kind: NumericReward; amount: number }[]): boolean {
  const amount = (kind: NumericReward): number => grants.find(grant => grant.kind === kind)?.amount ?? 0;
  if (!Number.isInteger(player.level) || player.level < 1 || player.level > LEVEL_CAP ||
    !safeCount(player.experience) || !safeCount(player.skillPoints) || !safeCount(player.statPoints)) return false;
  const cumulative = xpTotal(player.level) + player.experience;
  if (!safeCount(cumulative) || !safeCount(cumulative + amount('xp'))) return false;
  const growth = awardXp(cumulative, amount('xp'));
  if (!safeCount(player.skillPoints + growth.skillPointsGranted + amount('skillPoints')) ||
    !safeCount(player.statPoints + growth.statPointsGranted + amount('statPoints'))) return false;
  const currencies = useInventoryStore.getState().currencies;
  for (const grant of grants) {
    if (grant.kind === 'xp' || grant.kind === 'skillPoints' || grant.kind === 'statPoints') continue;
    const balance = currencies[grant.kind] ?? 0;
    if (!safeCount(balance) || !safeCount(balance + grant.amount)) return false;
  }
  const mercs = useMercStore.getState();
  const merc = mercs.ownedMercs.find(row => row.id === mercs.fieldedMercId);
  if (amount('xp') > 0 && merc) {
    if (!Number.isSafeInteger(merc.level) || merc.level < 1) return false;
    const progress = mercs.getMercProgress(merc.id);
    let xp = progress.experience + Math.floor(amount('xp') * MERC_XP_SHARE);
    let threshold = progress.experienceToNextLevel;
    let level = merc.level;
    if (!safeCount(progress.experience) || !safeCount(xp) ||
      !Number.isSafeInteger(threshold) || threshold <= 0) return false;
    while (xp >= threshold) {
      xp -= threshold;
      level++;
      threshold = mercXpForLevel(level);
      if (!Number.isSafeInteger(threshold) || threshold <= 0) return false;
    }
  }
  return true;
}

/**
 * Preflight the whole bundle before writes, then settle grants and claimed flag.
 * Synchronous grant failures restore participating data before returning. Stores
 * may publish intermediate states; this is not observer-wide or crash atomicity.
 * Failed restoration throws explicitly instead of reporting unchanged data.
 * Throws WaveGuardError before reads or claim ownership during an exact Iron debit.
 */
export function claimQuestReward(questId: string): ClaimResult {
  return withQuestTransaction<ClaimResult>(() => {
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
    const inventory = useInventoryStore.getState();
    const questProgress = useMapStore.getState().questProgress;
    try { validateQuestItemLedger(inventory.questItems, questProgress); }
    catch { return 'unsupported-rewards'; }

    const grants: { kind: NumericReward; amount: number }[] = [];
    let uniqueReward: RollUniqueItemInput | undefined;
    let questItems: QuestItemLedger | undefined;
    for (const [kind, amount] of Object.entries(rewards)) {
      // Gold has no executable economy; authored zero is a harmless no-op.
      if (kind === 'gold' && amount === 0) continue;
      if (kind === 'questItem') {
        try {
          const definition = loadQuestItems().find(row => row.id === amount && row.sourceQuestId === questId);
          if (!definition || definition.kind !== undefined || !Object.hasOwn(questProgress, questId)) return 'unsupported-rewards';
          const source = questItemSource(definition);
          if (Object.hasOwn(inventory.questItems, source)) return 'unsupported-rewards';
          questItems = validateQuestItemLedger({ ...inventory.questItems,
            [source]: { itemId: definition.id, state: 'owned' } },
          { ...questProgress, [questId]: { ...progress, rewardClaimed: true } });
        } catch { return 'unsupported-rewards'; }
        continue;
      }
      if (kind === 'itemDrop') {
        if (typeof amount !== 'object' || amount === null
          || !('uniqueId' in amount) || typeof amount.uniqueId !== 'string'
          || !('ilvl' in amount) || typeof amount.ilvl !== 'number'
          || !Number.isInteger(amount.ilvl) || amount.ilvl < 1) return 'unsupported-rewards';
        uniqueReward = { uniqueId: amount.uniqueId, ilvl: amount.ilvl };
        continue;
      }
      if (!isNumericReward(kind) || typeof amount !== 'number'
        || !safeCount(amount)) return 'unsupported-rewards';
      if (amount > 0) grants.push({ kind, amount });
    }
    if (grants.length === 0 && !uniqueReward && !questItems) return 'no-rewards';
    if (!safeGrants(player, grants)) return 'unsupported-rewards';

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
    const inventorySnapshot = {
      ...(changesCurrency ? { currencies: inventory.currencies } : {}),
      ...(item ? { backpack: inventory.backpack } : {}),
      ...(questItems ? { questItems: inventory.questItems } : {})
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
      if (questItems) useInventoryStore.setState({ questItems });
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
      if (changesCurrency || item !== undefined || questItems !== undefined) {
        restore(() => { useInventoryStore.setState(inventorySnapshot); });
      }
      restore(() => { useMapStore.setState((state) => ({
        questProgress: { ...state.questProgress, [questId]: progress }
      })); });
      if (restoreErrors.length > 0) {
        throw new AggregateError(restoreErrors, 'Quest reward restoration failed', { cause });
      }
      return 'grant-failed';
    }
  });
}

export type ReadQuestItemResult = 'ok' | 'not-ready' | 'no-player' | 'not-owned'
  | 'already-consumed' | 'unsupported-rewards' | 'claim-in-progress' | 'grant-failed';

/** Read one exact authored source; grant its JSON effect once and retain a consumed receipt.
 * Shares Claim's synchronous lock and Iron debit guard through all restoration attempts.
 * Restoration failures throw AggregateError; this is not observer-wide or crash atomicity.
 */
export function readQuestItem(source: string): ReadQuestItemResult {
  return withQuestTransaction<ReadQuestItemResult>(() => {
    if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
    const player = usePlayerStore.getState().player;
    if (!player) return 'no-player';
    const questItems = useInventoryStore.getState().questItems;
    let points: number;
    let itemId: string;
    try {
      validateQuestItemLedger(questItems, useMapStore.getState().questProgress);
      const definition = loadQuestItems().find(row => questItemSource(row) === source);
      if (!definition || definition.kind !== undefined) return 'unsupported-rewards';
      if (!Object.hasOwn(questItems, source)) return 'not-owned';
      if (questItems[source]?.state === 'consumed') return 'already-consumed';
      points = definition.effect.skillPoints;
      itemId = definition.id;
      if (!safeCount(player.skillPoints) || !safeCount(points) || points <= 0 ||
        !safeCount(player.skillPoints + points)) return 'unsupported-rewards';
    } catch { return 'unsupported-rewards'; }
    try {
      usePlayerStore.setState({ player: { ...player, skillPoints: player.skillPoints + points } });
      useInventoryStore.setState({ questItems: { ...questItems,
        [source]: { itemId, state: 'consumed' } } });
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      try { usePlayerStore.setState({ player }); } catch (error) { errors.push(error); }
      try { useInventoryStore.setState({ questItems }); } catch (error) { errors.push(error); }
      if (errors.length > 0) throw new AggregateError(errors, 'Quest item restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
