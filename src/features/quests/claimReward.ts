import { QUEST_SERVICE_SOURCES, validateQuestServiceLedger, type QuestServiceLedger } from '@/engine/services/quest-services';
import { hasAct5Completion, READ_PROOF, SCROLL_SOURCE } from '@/engine/save/act5-state';
import { hasQuestServiceSourceGraph, validateAct5CampaignRewards, BAAL_TITLE, NIGHTMARE_UNLOCK } from '@/engine/save/act5-campaign';
import { EVE_QUEST, RESCUE_QUEST } from '@/engine/map/act5-admission';
import { ACT4_ENCOUNTERS } from '@/engine/map/act4-admission';
/** Shared synchronous quest reward boundary; completion and claim stay separate. */
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, MERC_XP_SHARE, mercXpForLevel } from '@/stores/mercStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { loadQuests, type QuestDef } from '@/data/loaders/quests';
import { loadAwardPools } from '@/data/loaders/loot';
import { loadQuestUniqueProfile } from '@/data/loaders/quest-rewards';
import { rollUniqueItem, type RollUniqueItemInput } from '@/engine/loot/rollItem';
import { isQuestUniqueProfileRewardInput, resolveQuestUniqueProfile } from '@/engine/loot/quest-unique';
import { isQuestTableRewardInput, rollQuestTableRewards, type QuestTableRewardInput } from '@/engine/loot/award';
import { createRng, hashSeed } from '@/engine/rng';
import type { Item } from '@/engine/types/items';
import { publishQuestItemChange, questActionPreflight, withQuestTransaction } from './questTransaction';
import { hasQuestDeliveryCompletion } from './questDelivery';
import { hasQuestAssemblyCompletion } from './questCrafting';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { awardXp, LEVEL_CAP, xpTotal } from '@/engine/progression/xp';
import type { Player } from '@/engine/types/entities';
import type { QuestItemLedger } from '@/engine/types/save';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { hasTaintedSunCompletion, isQuestResistanceReward, TAINTED_SUN_QUEST_ID } from '@/engine/progression/quest-resistance';

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
  | 'runes' | 'runeShards' | 'gems' | 'gemShards' | 'wishstones';

function isNumericReward(key: string): key is NumericReward {
  return key === 'xp' || key === 'skillPoints' || key === 'statPoints'
    || key === 'runes' || key === 'runeShards' || key === 'gems' || key === 'gemShards' || key === 'wishstones';
}

function findQuest(questId: string): QuestDef | undefined {
  return loadQuests().find((q) => q.id === questId);
}

/** Retained rewards require their actual action graph before Claim; legacy flags supply no item or proof. */
function hasRetainedQuestRewardCompletion(quest: QuestDef): boolean {
  try {
    const retained = loadQuestItems().filter(item => item.kind === 'retained' && item.sourceQuestId === quest.id);
    if (retained.length === 0) return true;
    const map = useMapStore.getState();
    validateQuestItemLedger(useInventoryStore.getState().questItems, map.questProgress, map.questReceipts);
    return retained.every(item => item.kind === 'retained' &&
      Object.hasOwn(map.questReceipts, item.requiredActionSource) && map.questReceipts[item.requiredActionSource] === true);
  } catch { return false; }
}

/** New protected rewards require actual source-bound victories; historical flags grant no proof. */
function hasAct4Completion(quest: QuestDef): boolean {
  const contract = ACT4_ENCOUNTERS.find(row => row.questId === quest.id);
  if (!contract) return true;
  const map = useMapStore.getState();
  if (!Object.hasOwn(map.questReceipts, contract.proof)) return false;
  if (quest.id === 'quests/act4-hellforge' && !Object.hasOwn(map.questReceipts,
    'quests/act4-hellforge#action:shatter-soulstone')) return false;
  try { validateQuestItemLedger(useInventoryStore.getState().questItems, map.questProgress, map.questReceipts); return true; }
  catch { return false; }
}

/** Service eligibility uses the same actual source graph as save and service validation. */
function hasQuestServiceCompletion(questId: string): boolean {
  if (!Object.hasOwn(QUEST_SERVICE_SOURCES, `${questId}#reward:service`)) return true;
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  try {
    validateQuestItemLedger(items, map.questProgress, map.questReceipts);
    return hasQuestServiceSourceGraph(questId, map.questProgress, map.questReceipts, items);
  } catch { return false; }
}

/** Basic action availability; execution can still refuse with a retryable reason. */
export function canClaim(questId: string): boolean {
  const progress = useMapStore.getState().questProgress[questId];
  if (!progress) return false;
  if (progress.status !== 'completed') return false;
  if (questId === TAINTED_SUN_QUEST_ID && !hasTaintedSunCompletion(useMapStore.getState().questProgress)) return false;
  if (progress.rewardClaimed) return false;
  const quest = findQuest(questId);
  return Boolean(quest?.rewards && Object.keys(quest.rewards).length > 0 &&
    hasQuestServiceCompletion(quest.id) &&
    hasAct5Completion(quest.id, useMapStore.getState().questProgress, useMapStore.getState().questReceipts, useInventoryStore.getState().questItems) && hasAct4Completion(quest) && hasQuestDeliveryCompletion(quest) && hasQuestAssemblyCompletion(quest) && hasRetainedQuestRewardCompletion(quest));
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
    const balance = currencies[grant.kind === 'gemShards' ? 'gem-shard' : grant.kind] ?? 0;
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
    if (questId === TAINTED_SUN_QUEST_ID && !hasTaintedSunCompletion(useMapStore.getState().questProgress)) return 'not-completed';
    if (progress.rewardClaimed) return 'already-claimed';
    const quest = findQuest(questId);
    if (!quest) return 'unknown-quest';
    if (!hasQuestServiceCompletion(quest.id) || !hasAct5Completion(quest.id, useMapStore.getState().questProgress, useMapStore.getState().questReceipts, useInventoryStore.getState().questItems) || !hasAct4Completion(quest) || !hasQuestDeliveryCompletion(quest) || !hasQuestAssemblyCompletion(quest) ||
      !hasRetainedQuestRewardCompletion(quest)) return 'not-completed';
    const rewards = quest.rewards;
    if (!rewards || Object.keys(rewards).length === 0) return 'no-rewards';
    if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
    const player = usePlayerStore.getState().player;
    if (!player) return 'no-player';
    const inventory = useInventoryStore.getState();
    const questProgress = useMapStore.getState().questProgress;
    try { validateQuestItemLedger(inventory.questItems, questProgress, useMapStore.getState().questReceipts); }
    catch { return 'unsupported-rewards'; }

    const grants: { kind: NumericReward; amount: number }[] = [];
    let uniqueReward: RollUniqueItemInput | undefined;
    let uniqueProfileReward = false;
    let tableReward: QuestTableRewardInput | undefined;
    let questItems: QuestItemLedger | undefined;
    let resistanceReward = false;
    let questServices: QuestServiceLedger | undefined;
    let campaignReward = false;
    const serviceSource = `${questId}#reward:service`;
    for (const [kind, amount] of Object.entries(rewards)) {
      // Gold has no executable economy; authored zero is a harmless no-op.
      if (kind === 'gold' && amount === 0) continue;
      if (kind === 'stat') {
        if (!(questId === TAINTED_SUN_QUEST_ID && isQuestResistanceReward(amount)) &&
          !(questId === RESCUE_QUEST && amount !== null && typeof amount === 'object' && Object.keys(amount).length === 1 &&
            Object.hasOwn(amount, 'all_resist') && Reflect.get(amount, 'all_resist') === 5)) return 'unsupported-rewards';
        resistanceReward = true;
        continue;
      }
      if (kind === 'service') {
        try {
          if (Object.hasOwn(inventory.questServices, serviceSource)) return 'unsupported-rewards';
          questServices = validateQuestServiceLedger({ ...inventory.questServices,
            [serviceSource]: { serviceId: amount, state: 'available' } },
          { ...questProgress, [questId]: { ...progress, rewardClaimed: true } });
        } catch { return 'unsupported-rewards'; }
        continue;
      }
      if (kind === 'title') {
        if (questId !== EVE_QUEST || amount !== BAAL_TITLE || quest.unlocks !== NIGHTMARE_UNLOCK) return 'unsupported-rewards';
        campaignReward = true;
        continue;
      }
      if (kind === 'questItem') {
        try {
          const definition = loadQuestItems().find(row => row.id === amount && row.sourceQuestId === questId);
          if (!definition || (definition.kind !== undefined && definition.kind !== 'retained') ||
            !Object.hasOwn(questProgress, questId)) return 'unsupported-rewards';
          const source = questItemSource(definition);
          if (Object.hasOwn(inventory.questItems, source)) return 'unsupported-rewards';
          questItems = validateQuestItemLedger({ ...inventory.questItems,
            [source]: { itemId: definition.id, state: 'owned' } },
          { ...questProgress, [questId]: { ...progress, rewardClaimed: true } }, useMapStore.getState().questReceipts);
        } catch { return 'unsupported-rewards'; }
        continue;
      }
      if (kind === 'itemDrop') {
        if (isQuestUniqueProfileRewardInput(amount)) {
          uniqueProfileReward = true;
          continue;
        }
        if (typeof amount !== 'object' || amount === null
          || Object.keys(amount).length !== 2
          || !Object.hasOwn(amount, 'uniqueId') || !Object.hasOwn(amount, 'ilvl')
          || !('uniqueId' in amount) || typeof amount.uniqueId !== 'string'
          || !('ilvl' in amount) || typeof amount.ilvl !== 'number'
          || !Number.isInteger(amount.ilvl) || amount.ilvl < 1) return 'unsupported-rewards';
        uniqueReward = { uniqueId: amount.uniqueId, ilvl: amount.ilvl };
        continue;
      }
      if (kind === 'lootTable') {
        if (!isQuestTableRewardInput(amount)) return 'unsupported-rewards';
        tableReward = amount;
        continue;
      }
      if (!isNumericReward(kind) || typeof amount !== 'number'
        || !safeCount(amount) || kind === 'gemShards' && amount <= 0) return 'unsupported-rewards';
      if (amount > 0) grants.push({ kind, amount });
    }
    if (grants.length === 0 && !uniqueReward && !uniqueProfileReward && !tableReward && !questItems && !resistanceReward && !questServices && !campaignReward) return 'no-rewards';
    if (!safeGrants(player, grants)) return 'unsupported-rewards';
    if (uniqueProfileReward) {
      try {
        uniqueReward = resolveQuestUniqueProfile(loadQuestUniqueProfile(), loadAwardPools(), player.id, quest.id);
        if (!uniqueReward) return 'unsupported-rewards';
      } catch { return 'unsupported-rewards'; }
    }

    const claimedContext = { ...questProgress, [questId]: { ...progress, rewardClaimed: true } };
    if (resistanceReward) {
      const xp = grants.find(grant => grant.kind === 'xp')?.amount ?? 0;
      const level = awardXp(xpTotal(player.level) + player.experience, xp).level;
      try { deriveEquippedPlayerStats(player, level, inventory.equipped, claimedContext, questItems ?? inventory.questItems, useMapStore.getState().questReceipts); }
      catch { return 'unsupported-rewards'; }
    }

    const mapBefore = useMapStore.getState();
    const campaignFields = campaignReward ? { questTitles: { ...mapBefore.questTitles, [BAAL_TITLE]: true as const },
      questDifficulties: { ...mapBefore.questDifficulties, [NIGHTMARE_UNLOCK]: true as const } } : {};
    try { validateAct5CampaignRewards({ ...mapBefore, ...campaignFields, questProgress: claimedContext },
      questItems ?? inventory.questItems, questServices ?? inventory.questServices); }
    catch { return 'unsupported-rewards'; }

    // Preparation is private: failure here must not publish rollback writes.
    const items: Item[] = [];
    const currencyGrants = new Map<string, number>();
    for (const { kind, amount } of grants) {
      if (kind !== 'xp' && kind !== 'skillPoints' && kind !== 'statPoints') {
        const target = kind === 'gemShards' ? 'gem-shard' : kind;
        currencyGrants.set(target, (currencyGrants.get(target) ?? 0) + amount);
      }
    }
    try {
      if (uniqueReward) {
        const seed = hashSeed(JSON.stringify([
          'quest-unique-v1', player.id, quest.id, uniqueReward.uniqueId, uniqueReward.ilvl
        ]));
        const item = rollUniqueItem(uniqueReward, loadAwardPools(), createRng(seed));
        if (!item) return 'unsupported-rewards';
        items.push(item);
      }
      if (tableReward) {
        const seed = hashSeed(JSON.stringify([
          'quest-loot-table-v1', player.id, quest.id,
          tableReward.tableId, tableReward.ilvl, tableReward.picks
        ]));
        const cache = rollQuestTableRewards(tableReward, loadAwardPools(), createRng(seed));
        if (!cache) return 'unsupported-rewards';
        items.push(...cache.items);
        for (const [target, amount] of [
          ['rune-shard', cache.runes + cache.runeShards], ['gem-shard', cache.gems], ['wishstone', cache.wishstones]
        ] as const) {
          if (amount > 0) currencyGrants.set(target, (currencyGrants.get(target) ?? 0) + amount);
        }
      }
    } catch {
      return 'grant-failed';
    }
    // Validate the aggregate at each actual destination, including existing funds.
    for (const [target, amount] of currencyGrants) {
      const balance = inventory.currencies[target] ?? 0;
      if (!safeCount(amount) || !safeCount(balance) || !safeCount(balance + amount)) return 'unsupported-rewards';
    }

    const serviceEntry = questServices?.[serviceSource];
    if (questServices && !serviceEntry) return 'unsupported-rewards';
    const previousServiceEntry = inventory.questServices[serviceSource];
    const changesPlayer = resistanceReward || grants.some(({ kind }) =>
      kind === 'xp' || kind === 'skillPoints' || kind === 'statPoints');
    const sharesXp = grants.some(({ kind }) => kind === 'xp');
    const changesCurrency = currencyGrants.size > 0;
    const { ownedMercs, mercProgress } = useMercStore.getState();
    const inventorySnapshot = {
      ...(changesCurrency ? { currencies: inventory.currencies } : {}),
      ...(items.length > 0 ? { backpack: inventory.backpack } : {}),
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
        }
      }
      for (const [target, amount] of currencyGrants) useInventoryStore.getState().addCurrency(target, amount);
      for (const item of items) useInventoryStore.getState().addItem(item);
      if (questItems) useInventoryStore.setState({ questItems });
      if (serviceEntry) useInventoryStore.setState(state => ({ questServices: { ...state.questServices,
        [serviceSource]: serviceEntry } }));
      if (campaignReward) useMapStore.setState(campaignFields);
      if (resistanceReward) {
        usePlayerStore.setState(state => {
          if (!state.player) throw new Error('Player disappeared during quest reward');
          return { player: { ...state.player, derivedStats: deriveEquippedPlayerStats(
            state.player, state.player.level, useInventoryStore.getState().equipped, claimedContext,
            useInventoryStore.getState().questItems, useMapStore.getState().questReceipts
          ) } };
        });
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
      if (changesCurrency || items.length > 0 || questItems !== undefined) {
        restore(() => { useInventoryStore.setState(inventorySnapshot); });
      }
      if (questServices) restore(() => { useInventoryStore.setState(state => {
        const restored = { ...state.questServices };
        if (previousServiceEntry) restored[serviceSource] = previousServiceEntry;
        else Reflect.deleteProperty(restored, serviceSource);
        return { questServices: restored };
      }); });
      if (campaignReward) restore(() => { useMapStore.setState({ questTitles: mapBefore.questTitles, questDifficulties: mapBefore.questDifficulties }); });
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
    let nextPlayer: Player;
    let nextItems: QuestItemLedger;
    const map = useMapStore.getState();
    let nextReceipts = map.questReceipts;
    try {
      validateQuestItemLedger(questItems, useMapStore.getState().questProgress, useMapStore.getState().questReceipts);
      const definition = loadQuestItems().find(row => questItemSource(row) === source);
      if (!definition || definition.kind !== undefined) return 'unsupported-rewards';
      if (!Object.hasOwn(questItems, source)) return 'not-owned';
      if (questItems[source]?.state === 'consumed') return 'already-consumed';
      if (source === SCROLL_SOURCE) nextReceipts = { ...map.questReceipts, [READ_PROOF]: true };
      nextItems = validateQuestItemLedger({ ...questItems,
        [source]: { itemId: definition.id, state: 'consumed' } }, useMapStore.getState().questProgress,
      nextReceipts);
      if (definition.effect.maxLife !== undefined || definition.effect.allResist !== undefined) {
        nextPlayer = { ...player, derivedStats: deriveEquippedPlayerStats(player, player.level,
          useInventoryStore.getState().equipped, map.questProgress, nextItems, nextReceipts) };
      } else {
        const points = definition.effect.skillPoints;
        if (!safeCount(player.skillPoints) || !safeCount(points) || points <= 0 ||
          !safeCount(player.skillPoints + points)) return 'unsupported-rewards';
        nextPlayer = { ...player, skillPoints: player.skillPoints + points };
      }
    } catch { return 'unsupported-rewards'; }
    try {
      usePlayerStore.setState({ player: nextPlayer });
      useInventoryStore.setState({ questItems: nextItems });
      if (nextReceipts !== map.questReceipts) useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts, [READ_PROOF]: true } }));
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      try { usePlayerStore.setState({ player }); } catch (error) { errors.push(error); }
      try { useInventoryStore.setState({ questItems }); } catch (error) { errors.push(error); }
      if (nextReceipts !== map.questReceipts) {
        try { useMapStore.setState(state => {
          const restored = { ...state.questReceipts };
          if (Object.hasOwn(map.questReceipts, READ_PROOF)) restored[READ_PROOF] = true;
          else Reflect.deleteProperty(restored, READ_PROOF);
          return { questReceipts: restored };
        }); } catch (error) { errors.push(error); }
      }
      if (errors.length > 0) throw new AggregateError(errors, 'Quest item restoration failed', { cause });
      return 'grant-failed';
    }
  });
}

export type RecoverClaimedRewardResult = 'ok' | 'not-ready' | 'no-player' | 'combat-active'
  | 'not-eligible' | 'already-owned' | 'already-consumed' | 'claim-in-progress' | 'grant-failed';

export type QuestRewardItemRecoveryStatus = 'ready' | 'owned' | 'consumed' | 'unavailable';

/** Read-only eligibility for explicit recovery after actual hand-ins, never from legacy flags alone. */
export function questRewardItemRecoveryStatus(questId: string): QuestRewardItemRecoveryStatus {
  const quest = findQuest(questId);
  const progress = useMapStore.getState().questProgress[questId];
  if (!quest || progress?.status !== 'completed' || progress.rewardClaimed !== true ||
    !quest.objectives.some(objective => objective.type === 'give') ||
    !hasQuestDeliveryCompletion(quest)) return 'unavailable';
  const definition = loadQuestItems().find(item => item.kind === undefined &&
    item.sourceQuestId === questId && item.id === quest.rewards?.questItem);
  if (!definition) return 'unavailable';
  const source = questItemSource(definition);
  const ledger = useInventoryStore.getState().questItems;
  if (!Object.hasOwn(ledger, source)) return 'ready';
  return ledger[source]?.state === 'consumed' ? 'consumed' : 'owned';
}

/**
 * Explicit legacy repair after real hand-ins. Retains claimed history, grants no
 * XP, and never creates an item from objective/claimed flags alone.
 */
export function recoverClaimedQuestRewardItem(questId: string): RecoverClaimedRewardResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<RecoverClaimedRewardResult>(() => {
    const status = questRewardItemRecoveryStatus(questId);
    if (status === 'unavailable') return 'not-eligible';
    if (status === 'owned') return 'already-owned';
    if (status === 'consumed') return 'already-consumed';
    const quest = findQuest(questId);
    const progress = useMapStore.getState().questProgress[questId];
    if (!quest || !progress) return 'not-eligible';
    const definition = loadQuestItems().find(item => item.kind === undefined &&
      item.sourceQuestId === questId && item.id === quest.rewards?.questItem);
    if (!definition) return 'not-eligible';
    const source = questItemSource(definition);
    const ledger = useInventoryStore.getState().questItems;
    return publishQuestItemChange(questId, progress, {
      ...ledger, [source]: { itemId: definition.id, state: 'owned' }
    });
  });
}
