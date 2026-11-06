import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { ACT2_CACHES, ACT2_CACHE_DOMAINS, hasAct2CacheRetainedProof, type Act2CacheKey } from '@/engine/map/act2-cache-quests';
import { awardXp, LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { mergeRewards, planRewardGrant } from '@/engine/loot/reward-plan';
import { useMercStore, MERC_XP_SHARE } from '@/stores/mercStore';
import { pick } from './cainPublication';
import { assertCountedData, snapshotCountedData, sameCountedData as sameData, replaceCountedDataKeys as replace } from './countedQuestContract';
import { planAct2CacheMercAward } from './act2CacheMercRollback';
import { loadAwardPools } from '@/data/loaders/loot';
import { rollUniqueItem } from '@/engine/loot/rollItem';
import { createRng, hashSeed } from '@/engine/rng';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { captureCountedHeroParticipant } from './countedQuestRollback';
import { captureQuestRewardOwnership } from './questRewardOwnership';
import { captureAct2CacheAuthority, sameAct2CacheAuthority, validateLiveAct2CacheGraphs } from './act2CacheContract';
import { captureAct2CacheMercParticipant } from './act2CacheMercRollback';
import type { ClaimResult } from './claimReward';
import { captureFiniteSideWishParticipant, type FiniteSideWishParticipant } from './finiteSideWishParticipant';

type HeroJournal = ReturnType<typeof captureCountedHeroParticipant>;
type PhysicalJournal = ReturnType<typeof captureQuestRewardOwnership>;
type MercJournal = ReturnType<typeof captureAct2CacheMercParticipant>;

function ordinaryReady(): boolean {
  const hero = usePlayerStore.getState().player;
  return hero !== null && hero.derivedStats.life > 0 && useHydrationStore.getState().status === 'ready' &&
    !isReplacingSave() && !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat;
}
/** Claim uses ordinary readiness; no Recover location/difficulty/main/Talk gate. */
export function hasAct2CacheClaimCompletion(key: Act2CacheKey): boolean {
  try {
    if (!ordinaryReady()) return false;
    captureAct2CacheAuthority(key); validateLiveAct2CacheGraphs();
    const map = useMapStore.getState(), tuple = ACT2_CACHES[key];
    return hasAct2CacheRetainedProof(key, map.questProgress, useInventoryStore.getState().questItems, ACT2_CACHE_DOMAINS) &&
      map.questProgress[tuple.quest]?.rewardClaimed !== true;
  } catch { return false; }
}

/** Prepare exactly the approved real unique; preserve failed unpublished ID gaps. */
export function prepareAct2CacheUniqueReward(key: Act2CacheKey, hero: Player): Item {
  const tuple = captureAct2CacheAuthority(key).tuple;
  const input = { uniqueId: tuple.uniqueId, ilvl: tuple.ilvl };
  const seed = hashSeed(JSON.stringify(['quest-unique-v1', hero.id, tuple.quest, input.uniqueId, input.ilvl]));
  const item = rollUniqueItem(input, loadAwardPools(), createRng(seed));
  if (!item) throw new Error('Incomplete exact cache unique reward');
  return item;
}

/**
 * Compose the unchanged v8 hero and physical ownership journals. Register cleanup's direct
 * actor edge as owned, preserving nested independent realXP edges. If no owned
 * current hero remains, still attempt physical cleanup without resurrecting one.
 */
export function restoreAct2CacheParticipants(hero: HeroJournal, merc: MercJournal | null,
  physical: PhysicalJournal, restoreOwnedQuestGraph: () => void, verifyOwnedQuestGraph: () => void, cause: unknown,
  wishes?: Pick<FiniteSideWishParticipant, 'restore' | 'verifyRestored'>): void {
  const errors: unknown[] = [];
  const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
  if (wishes) attempt(() => { wishes.restore(); });
  attempt(restoreOwnedQuestGraph);
  attempt(() => {
    const current = usePlayerStore.getState().player;
    const cleanup = () => { if (merc) merc.publishPhysicalCleanup(() => { physical.restore(); }); else physical.restore(); };
    if (hero.owns(current)) hero.publish(current, cleanup); else cleanup();
  });
  // Gear cleanup precedes progression restore. Each restoration is attempted.
  if (merc) attempt(() => { merc.restore(); });
  attempt(() => { hero.restore(); });
  attempt(verifyOwnedQuestGraph);
  if (merc) attempt(() => { merc.verifyRestored(); });
  attempt(() => { hero.verifyRestored(); });
  if (wishes) attempt(() => { wishes.verifyRestored(); });
  if (errors.length) throw new AggregateError(errors, 'Cache scoped participant restoration failed', { cause });
}

function safe(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Unsafe cache reward arithmetic');
  return value;
}
function safeNumbers(value: unknown): void {
  if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) {
    throw new Error('Unsafe cache statistic');
  }
  if (value !== null && typeof value === 'object') {
    for (const entry of value instanceof Map ? value.values() : Object.values(value)) safeNumbers(entry);
  }
}
function destination() {
  const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  assertCountedData({ inventory: { backpack: inventory.backpack, stash: inventory.stash, equipped: inventory.equipped,
    legacy: inventory.legacyGearQuarantine, socket: inventory.socketQuarantine, currencies: inventory.currencies,
    materials: inventory.materials }, mercEquipment: mercs.mercEquipment });
  return { backpack: inventory.backpack, stash: inventory.stash, equipped: inventory.equipped,
    currencies: inventory.currencies, materials: inventory.materials, mercEquipment: mercs.mercEquipment };
}

/** Publish one complete finite bag under claimQuestReward's existing quest lease. */
export function publishAct2CacheClaim(key: Act2CacheKey): ClaimResult {
  if (!usePlayerStore.getState().player) return 'no-player';
  if (!ordinaryReady()) return 'not-ready';
  let authority: ReturnType<typeof captureAct2CacheAuthority>;
  try { authority = captureAct2CacheAuthority(key); validateLiveAct2CacheGraphs(); }
  catch { return 'unsupported-rewards'; }
  const tuple = authority.tuple, map = useMapStore.getState(), inv = useInventoryStore.getState();
  const mercs = useMercStore.getState(), hero = usePlayerStore.getState().player;
  if (!hero) return 'no-player';
  if (map.questProgress[tuple.quest]?.rewardClaimed === true) return 'already-claimed';
  if (!hasAct2CacheClaimCompletion(key)) return 'not-completed';
  const prepare = () => {
    const before = snapshotCountedData({ hero, rows: pick(map.questProgress, [tuple.quest]),
      items: pick(inv.questItems, [tuple.source]), equipped: inv.equipped, roster: mercs.ownedMercs,
      field: mercs.fieldedMercId, progress: mercs.mercProgress });
    const row = before.rows[tuple.quest]; if (!row) throw new Error('Missing cache row');
    if (new Set(before.roster.map(actor => actor.id)).size !== before.roster.length) throw new Error('Duplicate cache recipient');
    const recipient = mercs.ownedMercs.find(actor => actor.id === before.field);
    if (before.field !== null && !recipient) throw new Error('Missing actual cache recipient');
    safe(hero.level); if (hero.level < 1 || hero.level > LEVEL_CAP) throw new Error('Invalid cache hero level');
    safe(hero.experience); safe(hero.statPoints); safe(hero.skillPoints);
    const total = safe(xpTotal(hero.level) + hero.experience); safe(total + tuple.xp);
    const growth = awardXp(total, tuple.xp), experience = safe(growth.totalXp - xpTotal(growth.level));
    const expectedHero = { ...before.hero, level: growth.level, experience,
      experienceToNextLevel: growth.level >= LEVEL_CAP ? Math.max(1, experience) : xpRequired(growth.level),
      statPoints: safe(hero.statPoints + growth.statPointsGranted), skillPoints: safe(hero.skillPoints + growth.skillPointsGranted),
      derivedStats: deriveEquippedPlayerStats(before.hero, growth.level, inv.equipped, map.questProgress, inv.questItems, map.questReceipts) };
    safeNumbers(expectedHero);
    const recipientAward = recipient ? planAct2CacheMercAward(recipient, mercs.getMercProgress(recipient.id), tuple.mercXp) : null;
    if (Math.floor(tuple.xp * MERC_XP_SHARE) !== tuple.mercXp) throw new Error('Changed cache merc share');
    safeNumbers(recipientAward);
    const item = prepareAct2CacheUniqueReward(key, hero);
    assertCountedData(item); safeNumbers(item);
    const bag = mergeRewards({ items: [item], runeShards: 0, wishstones: 0, runes: 0, gems: 0, materials: {} });
    planRewardGrant(bag, destination());
    const claimedRows = { [tuple.quest]: { ...row, rewardClaimed: true } };
    return { before, recipient, recipientAward, expectedHero, item, bag, claimedRows };
  };
  let prepared: ReturnType<typeof prepare>;
  try { prepared = prepare(); } catch { return 'unsupported-rewards'; }
  const p = prepared;
  let heroJournal: HeroJournal | undefined, mercJournal: MercJournal | null = null, physical: PhysicalJournal | undefined;
  let wishes: FiniteSideWishParticipant | undefined;
  let xpPublished = false, mercPublished = false, itemPublished = false, claimed = false;
  try {
    try {
      heroJournal = captureCountedHeroParticipant(hero);
      if (p.recipient) mercJournal = captureAct2CacheMercParticipant(p.recipient);
      physical = captureQuestRewardOwnership(p.item);
      physical.preflight();
      wishes = captureFiniteSideWishParticipant(tuple.quest);
    } catch { return 'unsupported-rewards'; }
    const heroParticipant = heroJournal, ownership = physical, wishParticipant = wishes;
    const check = () => {
      const live = useMapStore.getState(), inventory = useInventoryStore.getState(), currentMercs = useMercStore.getState();
      assertCountedData({ rows: live.questProgress, items: inventory.questItems, equipped: inventory.equipped,
        roster: currentMercs.ownedMercs, progress: currentMercs.mercProgress });
      const current = usePlayerStore.getState().player;
      if (!ordinaryReady() || !sameAct2CacheAuthority(authority) || !heroParticipant.owns(current) ||
        !sameData(current, xpPublished ? p.expectedHero : p.before.hero) ||
        !sameData(pick(live.questProgress, [tuple.quest]), claimed ? p.claimedRows : p.before.rows) ||
        !sameData(pick(inventory.questItems, [tuple.source]), p.before.items) ||
        !sameData(inventory.equipped, p.before.equipped) || currentMercs.fieldedMercId !== p.before.field) {
        throw new Error('Cache Claim source/hero publication changed');
      }
      if (xpPublished && !sameData(current.derivedStats, deriveEquippedPlayerStats(current, current.level,
        inventory.equipped, live.questProgress, inventory.questItems, live.questReceipts))) {
        throw new Error('Cache Claim canonical composition changed');
      }
      if (p.recipient) {
        const recipients = currentMercs.ownedMercs.filter(actor => actor.id === p.recipient?.id), currentRecipient = recipients[0];
        if (recipients.length !== 1 || !currentRecipient || !mercJournal?.owns(currentRecipient) ||
          !sameData(currentRecipient, mercPublished ? p.recipientAward?.actor : p.before.roster.find(actor => actor.id === p.recipient?.id)) ||
          !sameData(pick(currentMercs.mercProgress, [p.recipient.id]), mercPublished
            ? { [p.recipient.id]: p.recipientAward?.progress } : pick(p.before.progress, [p.recipient.id]))) {
          throw new Error('Cache Claim actual recipient changed');
        }
      }
      if (itemPublished) ownership.checkPublished(); else ownership.preflight();
      planRewardGrant(itemPublished ? mergeRewards() : p.bag, destination());
      validateLiveAct2CacheGraphs();
      wishParticipant.check();
    };
    try {
      heroParticipant.begin(); check();
      heroParticipant.publish(p.expectedHero, () => { usePlayerStore.getState().gainExperience(tuple.xp); });
      xpPublished = true; check();
      if (p.recipient && p.recipientAward && mercJournal) {
        mercJournal.publish(p.recipientAward, () => { useMercStore.getState().shareExperienceWithFielded(tuple.xp, p.recipient?.id); });
      }
      mercPublished = true; check();
      ownership.preflight(); planRewardGrant(p.bag, destination());
      useInventoryStore.getState().addItem(p.item); itemPublished = true; ownership.checkPublished(); check();
      wishParticipant.publish(); check();
      useMapStore.getState().markQuestRewardClaimed(tuple.quest); claimed = true; check();
      return 'ok';
    } catch (cause) {
      restoreAct2CacheParticipants(heroParticipant, mercJournal, ownership, () => {
        const failures: unknown[] = [];
        try { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(p.before.rows), [tuple.quest]) })); }
        catch (error) { failures.push(error); }
        try { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, snapshotCountedData(p.before.items), [tuple.source]) })); }
        catch (error) { failures.push(error); }
        if (failures.length) throw new AggregateError(failures, 'Cache owned quest graph restoration failed');
      }, () => {
        if (!sameData(pick(useMapStore.getState().questProgress, [tuple.quest]), p.before.rows) ||
          !sameData(pick(useInventoryStore.getState().questItems, [tuple.source]), p.before.items)) {
          throw new Error('Cache Claim deep source restoration changed');
        }
        validateLiveAct2CacheGraphs();
      }, cause, wishParticipant);
      return 'grant-failed';
    }
  } finally {
    try { physical?.dispose(); } finally { try { mercJournal?.dispose(); } finally { try { heroJournal?.dispose(); } finally { wishes?.dispose(); } } }
  }
}
