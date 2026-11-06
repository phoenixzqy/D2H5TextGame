import { ANYA } from '@/engine/map/anya-quest';
import { hasAnyaClaimCompletion, publishAnyaClaim } from './anyaClaim';
import { act2CacheKeyForQuest } from '@/engine/map/act2-cache-quests';
import { FARA } from '@/engine/map/fara-quest';
import { COW } from '@/engine/map/cow-quest';
import { findRegionalBounty } from '@/engine/map/regional-bounties';
import { hasRegionalBountyClaimCompletion, publishRegionalBountyClaim } from './bountyClaim';
import { hasCowClaimCompletion, publishCowClaim } from './cowClaim';
import { hasFaraClaimCompletion, publishFaraClaim } from './faraClaim';
import { hasAct2CacheClaimCompletion, publishAct2CacheClaim } from './act2CacheClaim';
import { QUEST_SERVICE_SOURCES, validateQuestServiceLedger, type QuestServiceLedger } from '@/engine/services/quest-services';
import { hasAct5Completion, READ_PROOF, SCROLL_SOURCE } from '@/engine/save/act5-state';
import { hasQuestServiceSourceGraph, BAAL_TITLE, NIGHTMARE_UNLOCK } from '@/engine/save/act5-campaign';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
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
import { isQuestTableRewardInput, rollQuestTableRewards, type KillRewards, type QuestTableRewardInput } from '@/engine/loot/award';
import { mergeRewards, planRewardGrant } from '@/engine/loot/reward-plan';
import { createRng, hashSeed } from '@/engine/rng';
import type { Item } from '@/engine/types/items';
import { publishQuestItemChange, questActionPreflight, withQuestTransaction } from './questTransaction';
import { hasQuestDeliveryCompletion, questDeliveryCompletions } from './questDelivery';
import { hasQuestAssemblyCompletion } from './questCrafting';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { awardXp, LEVEL_CAP, xpTotal } from '@/engine/progression/xp';
import type { Mercenary, Player } from '@/engine/types/entities';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import type { QuestItemLedger } from '@/engine/types/save';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { hasTaintedSunCompletion, isQuestResistanceReward, TAINTED_SUN_QUEST_ID } from '@/engine/progression/quest-resistance';
import { CAIN_QUEST, CAIN_SIDE_QUEST } from '@/engine/map/cain-quest';
import { hasCainClaimCompletion, publishCainClaim } from './cainClaim';
import { COUNTESS, hasCountessCompletion } from '@/engine/map/countess-admission';
import { MALUS_QUEST, MALUS_SIDE_QUEST } from '@/engine/map/malus-quest';
import { hasImbueClaimCompletion, publishImbueClaim } from './imbueClaim';
import { LARZUK } from '@/engine/map/larzuk-quest';
import { hasLarzukClaimCompletion, publishLarzukClaim } from './larzukClaim';
import { ORMUS } from '@/engine/map/ormus-quest';
import { hasOrmusClaimCompletion, publishOrmusClaim } from './ormusClaim';
import { WARBAND } from '@/engine/map/warband-quest';
import { hasWarbandClaimCompletion, publishWarbandClaim } from './warbandClaim';
import { DROGNAN } from '@/engine/map/drognan-quest';
import { hasDrognanClaimCompletion, publishDrognanClaim } from './drognanClaim';
import { NIHLATHAK } from '@/engine/map/nihlathak-quest';
import { captureNihlathakClaimWitness, hasNihlathakClaimCompletion, publishNihlathakClaim } from './nihlathakClaim';
import { hasTownEnlistmentClaimCompletion, publishTownEnlistmentClaim, townEnlistmentKeyForQuest } from './townEnlistmentClaim';
import { sameCountedData } from './countedQuestContract';
import { countedQuestKeyForQuest, hasCountedSourceClaimCompletion, publishCountedSourceClaim } from './countedQuestClaim';

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

function currencyKey(kind: NumericReward): string {
  return kind === 'gemShards' ? 'gem-shard' : kind === 'wishstones' ? 'wishstone' : kind;
}

function findQuest(questId: string): QuestDef | undefined {
  return loadQuests().find((q) => q.id === questId);
}

function hasCountessClaimCompletion(questId: string): boolean {
  const map = useMapStore.getState();
  return questId !== COUNTESS.quest || hasCountessCompletion(map.questProgress, map.questReceipts);
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
  if (questId === ANYA.quest) return hasAnyaClaimCompletion(questId);
  if (findRegionalBounty(questId)) return hasRegionalBountyClaimCompletion(questId);
  if (questId === COW.quest) return hasCowClaimCompletion(questId);
  if (questId === FARA.quest) return hasFaraClaimCompletion(questId);
  const cacheKey = act2CacheKeyForQuest(questId);
  if (cacheKey !== undefined) return hasAct2CacheClaimCompletion(cacheKey);
  if (countedQuestKeyForQuest(questId) !== undefined) return hasCountedSourceClaimCompletion(questId);
  const progress = useMapStore.getState().questProgress[questId];
  if (!progress) return false;
  if (progress.status !== 'completed') return false;
  if (questId === TAINTED_SUN_QUEST_ID && !hasTaintedSunCompletion(useMapStore.getState().questProgress)) return false;
  if (progress.rewardClaimed) return false;
  if (!hasCainClaimCompletion(questId) || !hasCountessClaimCompletion(questId) || !hasImbueClaimCompletion(questId) || !hasOrmusClaimCompletion(questId) || !hasLarzukClaimCompletion(questId) || !hasWarbandClaimCompletion(questId) || !hasDrognanClaimCompletion(questId) || !hasNihlathakClaimCompletion(questId) || !hasTownEnlistmentClaimCompletion(questId)) return false;
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
    const balance = currencies[currencyKey(grant.kind)] ?? 0;
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
    if (questId === ANYA.quest) return publishAnyaClaim();
    if (findRegionalBounty(questId)) return publishRegionalBountyClaim(questId);
    if (questId === COW.quest) return publishCowClaim();
    if (questId === FARA.quest) return publishFaraClaim();
    const cacheKey = act2CacheKeyForQuest(questId);
    if (cacheKey !== undefined) return publishAct2CacheClaim(cacheKey);
    const countedKey = countedQuestKeyForQuest(questId);
    if (countedKey !== undefined) return publishCountedSourceClaim(countedKey);
    const progress = useMapStore.getState().questProgress[questId];
    if (!progress || progress.status !== 'completed') return 'not-completed';
    if (questId === TAINTED_SUN_QUEST_ID && !hasTaintedSunCompletion(useMapStore.getState().questProgress)) return 'not-completed';
    if (progress.rewardClaimed) return 'already-claimed';
    if (!hasCainClaimCompletion(questId) || !hasCountessClaimCompletion(questId) || !hasImbueClaimCompletion(questId) || !hasOrmusClaimCompletion(questId) || !hasLarzukClaimCompletion(questId) || !hasWarbandClaimCompletion(questId) || !hasDrognanClaimCompletion(questId) || !hasNihlathakClaimCompletion(questId) || !hasTownEnlistmentClaimCompletion(questId)) return 'not-completed';
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

    if (questId === WARBAND.quest) return publishWarbandClaim();
    const townEnlistmentKey = townEnlistmentKeyForQuest(questId);
    if (townEnlistmentKey !== undefined) return publishTownEnlistmentClaim(townEnlistmentKey);

    if (questId === LARZUK.quest) {
      return sameCountedData(rewards, { service: 'socket_item', wishstones: 10 })
        ? publishLarzukClaim() : 'unsupported-rewards';
    }

    const grants: { kind: NumericReward; amount: number }[] = [];
    let uniqueReward: RollUniqueItemInput | undefined;
    let uniqueProfileReward = false;
    let tableReward: QuestTableRewardInput | undefined;
    let questItems: QuestItemLedger | undefined;
    let resistanceReward = false;
    let questServices: QuestServiceLedger | undefined;
    let campaignReward = false;
    let mercenaryUnlock = false;
    let permanentIdentify = false;
    let recruit: Mercenary | undefined;
    const serviceSource = `${questId}#reward:service`;
    for (const [kind, amount] of Object.entries(rewards)) {
      // Gold has no executable economy; authored zero is a harmless no-op.
      if (kind === 'gold' && amount === 0) continue;
      if (kind === 'mercenaryUnlock') {
        if (questId !== 'quests/act1-sisters-burial-grounds' || amount !== 'mercs/act1-rogue-trainee') return 'unsupported-rewards';
        try {
          const definition = loadMercPool().pool.find(row => row.id === amount);
          if (!definition) return 'unsupported-rewards';
          mercenaryUnlock = true;
          if (!useMercStore.getState().ownedMercs.some(row => row.id.split('#')[0] === definition.id)) {
            recruit = createMercFromDef(definition);
          }
        } catch { return 'unsupported-rewards'; }
        continue;
      }
      if (kind === 'stat') {
        if (!(questId === TAINTED_SUN_QUEST_ID && isQuestResistanceReward(amount)) &&
          !(questId === RESCUE_QUEST && amount !== null && typeof amount === 'object' && Object.keys(amount).length === 1 &&
            Object.hasOwn(amount, 'all_resist') && Reflect.get(amount, 'all_resist') === 5)) return 'unsupported-rewards';
        resistanceReward = true;
        continue;
      }
      if (kind === 'service') {
        if (amount === 'identify_free' && (questId === CAIN_QUEST || questId === CAIN_SIDE_QUEST)) {
          permanentIdentify = true;
          continue;
        }
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
    // Refuse the exact Imbue bundle before any profile lookup or item allocation.
    if (questId === MALUS_QUEST || questId === MALUS_SIDE_QUEST) {
      if (questServices?.[serviceSource]?.serviceId !== 'imbue_item' ||
        grants.some(grant => grant.kind !== 'xp' && grant.kind !== 'wishstones') ||
        (grants.find(grant => grant.kind === 'xp')?.amount ?? 0) !== (questId === MALUS_QUEST ? 3500 : 0) ||
        grants.find(grant => grant.kind === 'wishstones')?.amount !== (questId === MALUS_QUEST ? 15 : 10) ||
        uniqueReward !== undefined || uniqueProfileReward || tableReward !== undefined || questItems !== undefined ||
        resistanceReward || campaignReward || mercenaryUnlock || permanentIdentify) return 'unsupported-rewards';
    }
    if (questId === ORMUS.quest && (grants.length !== 2 || grants.find(grant => grant.kind === 'xp')?.amount !== 5000 ||
      grants.find(grant => grant.kind === 'wishstones')?.amount !== 10 ||
      uniqueReward?.uniqueId !== 'items/unique/ormus-charm' || uniqueReward.ilvl !== 32 || uniqueProfileReward || tableReward !== undefined ||
      questItems !== undefined || resistanceReward || questServices !== undefined || campaignReward || mercenaryUnlock || permanentIdentify)) return 'unsupported-rewards';
    if (grants.length === 0 && !uniqueReward && !uniqueProfileReward && !tableReward && !questItems && !resistanceReward && !questServices && !campaignReward && !mercenaryUnlock && !permanentIdentify) return 'no-rewards';
    if (!safeGrants(player, grants)) return 'unsupported-rewards';
    if (questId === DROGNAN.quest) return publishDrognanClaim();
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
    try { validateNative24CurrentCampaignRewards({ ...mapBefore, ...campaignFields, questProgress: claimedContext },
      questItems ?? inventory.questItems, questServices ?? inventory.questServices, mapBefore.endgame); }
    catch { return 'unsupported-rewards'; }

    const nihlathakWitness = questId === NIHLATHAK.quest ? captureNihlathakClaimWitness() : undefined;
    // Preparation is private: failure here must not publish rollback writes.
    const items: Item[] = [];
    let cacheRewards: KillRewards = mergeRewards();
    const currencyGrants = new Map<string, number>();
    for (const { kind, amount } of grants) {
      if (kind !== 'xp' && kind !== 'skillPoints' && kind !== 'statPoints') {
        const target = currencyKey(kind);
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
        cacheRewards = cache;
        items.push(...cache.items);
      }
    } catch {
      return 'grant-failed';
    }
    for (const [target, amount] of [['rune-shard', cacheRewards.runeShards], ['wishstone', cacheRewards.wishstones]] as const) {
      if (amount > 0) currencyGrants.set(target, (currencyGrants.get(target) ?? 0) + amount);
    }
    const pendingCurrencies = new Map(currencyGrants);
    let pendingItems = items;
    const verifyCurrencyBalances = (): void => {
      const current = useInventoryStore.getState().currencies;
      for (const target of currencyGrants.keys()) {
        if (!safeCount(current[target] ?? 0)) throw new Error('Invalid participating quest currency');
      }
    };
    // Observers can change inventory during XP or an earlier grant. Recheck the
    // remaining exact bag at each add boundary without rerolling or losing writes.
    const preflightInventory = (): void => {
      verifyCurrencyBalances();
      const destination = useInventoryStore.getState();
      const currencies = { ...destination.currencies };
      for (const [target, amount] of pendingCurrencies) {
        const balance = destination.currencies[target] ?? 0;
        if (!safeCount(amount) || !safeCount(balance) || !safeCount(balance + amount)) {
          throw new Error('Quest currency destination overflow');
        }
        currencies[target] = balance + amount;
      }
      planRewardGrant({ ...cacheRewards, items: pendingItems, runeShards: 0, wishstones: 0 },
        { ...destination, currencies, mercEquipment: useMercStore.getState().mercEquipment });
    };
    try { preflightInventory(); }
    catch { return 'unsupported-rewards'; }

    if (permanentIdentify) {
      // Exact authored wishes plus main XP and permanent Identify; no finite charge.
      // They use no selected-item charge and no other reward publication.
      if (grants.some(grant => grant.kind !== 'xp' && grant.kind !== 'wishstones') ||
        (grants.find(grant => grant.kind === 'xp')?.amount ?? 0) !== (questId === CAIN_SIDE_QUEST ? 0 : 2500) ||
        grants.find(grant => grant.kind === 'wishstones')?.amount !== (questId === CAIN_SIDE_QUEST ? 10 : 20) ||
        uniqueReward !== undefined || uniqueProfileReward || tableReward !== undefined || questItems !== undefined || resistanceReward || questServices !== undefined ||
        campaignReward || mercenaryUnlock) return 'unsupported-rewards';
      return publishCainClaim(questId, grants.find(grant => grant.kind === 'xp')?.amount ?? 0,
        grants.find(grant => grant.kind === 'wishstones')?.amount ?? 0);
    }

    if (questId === MALUS_QUEST || questId === MALUS_SIDE_QUEST) {
      return publishImbueClaim(questId, grants.find(grant => grant.kind === 'xp')?.amount ?? 0,
        grants.find(grant => grant.kind === 'wishstones')?.amount ?? 0);
    }

    if (questId === ORMUS.quest) {
      const item = items[0];
      return item && items.length === 1 ? publishOrmusClaim(item, preflightInventory) : 'unsupported-rewards';
    }

    if (questId === NIHLATHAK.quest) {
      const item = items[0];
      return item && items.length === 1 && nihlathakWitness
        ? publishNihlathakClaim(item, preflightInventory, nihlathakWitness) : 'unsupported-rewards';
    }

    const serviceEntry = questServices?.[serviceSource];
    if (questServices && !serviceEntry) return 'unsupported-rewards';
    const previousServiceEntry = inventory.questServices[serviceSource];
    const changesPlayer = resistanceReward || grants.some(({ kind }) =>
      kind === 'xp' || kind === 'skillPoints' || kind === 'statPoints');
    const sharesXp = grants.some(({ kind }) => kind === 'xp');
    const changesCurrency = currencyGrants.size > 0;
    const changesMaterials = Object.keys(cacheRewards.materials).length > 0;
    const { ownedMercs, mercProgress, mercEquipment, fieldedMercId } = useMercStore.getState();
    const inventorySnapshot = {
      ...(changesCurrency ? { currencies: inventory.currencies } : {}),
      ...(items.length > 0 ? { backpack: inventory.backpack } : {}),
      ...(changesMaterials ? { materials: inventory.materials } : {}),
      ...(questItems ? { questItems: inventory.questItems } : {})
    };

    try {
      for (const { kind, amount } of grants) {
        if (kind === 'xp') {
          usePlayerStore.getState().gainExperience(amount);
          // This quest rewards the recipient fielded before any grant publication.
          useMercStore.getState().shareExperienceWithFielded(amount, fieldedMercId);
        } else if (kind === 'skillPoints' || kind === 'statPoints') {
          usePlayerStore.setState((state) => state.player
            ? { player: { ...state.player, [kind]: state.player[kind] + amount } }
            : state);
        }
      }
      if (recruit) useMercStore.getState().addMerc(recruit);
      for (const [target, amount] of currencyGrants) {
        preflightInventory();
        useInventoryStore.getState().addCurrency(target, amount);
        pendingCurrencies.delete(target);
      }
      for (const item of items) {
        preflightInventory();
        useInventoryStore.getState().addItem(item);
        pendingItems = pendingItems.slice(1);
      }
      if (changesMaterials) {
        preflightInventory();
        useInventoryStore.getState().addMaterials(cacheRewards.materials);
      }
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
      verifyCurrencyBalances();
      useMapStore.getState().markQuestRewardClaimed(questId);
      verifyCurrencyBalances();
      const claimed = useMapStore.getState().questProgress[questId];
      if (claimed?.id !== questId || claimed.status !== 'completed' || claimed.rewardClaimed !== true) {
        throw new Error('Quest reward claimed publication was not retained');
      }
      return 'ok';
    } catch (cause) {
      // Partial updates retain actions and unrelated data. Attempt every restore
      // even if an observer/setState throws, keeping the guard until finally.
      const restoreErrors: unknown[] = [];
      const restore = (operation: () => void): void => {
        try { operation(); } catch (error) { restoreErrors.push(error); }
      };
      if (changesPlayer) restore(() => { usePlayerStore.setState({ player }); });
      if (sharesXp || recruit) restore(() => { useMercStore.setState({ ownedMercs, mercProgress,
        ...(recruit ? { mercEquipment, fieldedMercId } : {}) }); });
      if (changesCurrency || changesMaterials || items.length > 0 || questItems !== undefined) {
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
  return questRewardItemRecoveryStatuses([questId]).get(questId) ?? 'unavailable';
}

/** Resolve a visible reward list with fresh authored data and one delivery-ledger check. */
export function questRewardItemRecoveryStatuses(questIds: readonly string[]): ReadonlyMap<string, QuestRewardItemRecoveryStatus> {
  const statuses = new Map<string, QuestRewardItemRecoveryStatus>(questIds.map(id => [id, 'unavailable']));
  if (statuses.size === 0) return statuses;
  const progress = useMapStore.getState().questProgress;
  const quests = loadQuests().filter(quest => statuses.has(quest.id) &&
    progress[quest.id]?.status === 'completed' && progress[quest.id]?.rewardClaimed === true &&
    quest.objectives.some(objective => objective.type === 'give'));
  const completed = questDeliveryCompletions(quests);
  if (completed.size === 0) return statuses;
  const definitions = loadQuestItems();
  const ledger = useInventoryStore.getState().questItems;
  for (const quest of quests) {
    if (!completed.has(quest.id)) continue;
    const definition = definitions.find(item => item.kind === undefined &&
      item.sourceQuestId === quest.id && item.id === quest.rewards?.questItem);
    if (!definition) continue;
    const source = questItemSource(definition);
    statuses.set(quest.id, !Object.hasOwn(ledger, source) ? 'ready'
      : ledger[source]?.state === 'consumed' ? 'consumed' : 'owned');
  }
  return statuses;
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
