import { findCountedQuestById, loadCountedQuestItems, type CountedQuestKey } from '@/data/loaders/counted-quest-items';
import { loadJamellaQuestAwardPools } from '@/data/loaders/quest-table-rewards';
import { hasCountedQuestClaimCompletion, validateCountedQuestGraphs } from '@/engine/map/counted-quest';
import { rollQuestTableRewards, type KillRewards } from '@/engine/loot/award';
import { mergeRewards, planRewardGrant } from '@/engine/loot/reward-plan';
import { composeEquippedPlayerStats, deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { growMercenary, repairMercenaryGrowth } from '@/engine/progression/merc-growth';
import { awardXp, LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { createRng, hashSeed } from '@/engine/rng';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { MERC_XP_SHARE, mercXpForLevel, useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { beginQuestGemShardPublication, endQuestGemShardPublication, verifyQuestGemShardPublication,
  type QuestGemShardPublication } from '@/stores/questGemShardJournal';
import { beginQuestCurrencyPublication, endQuestCurrencyPublication, verifyQuestCurrencyPublication,
  type QuestCurrencyPublication } from '@/stores/questCurrencyJournal';
import { pick } from './cainPublication';
import { countedOrdinaryRefusal } from './countedQuestActions';
import { assertCountedData, captureCountedQuestAuthority, countedQuestDefinition, countedQuestRewards, replaceCountedDataKeys as replace, sameCountedData, sameCountedQuestAuthority, snapshotCountedData, validateLiveCountedQuestGraphs } from './countedQuestContract';
import { captureCountedHeroParticipant, countedActorContinuity } from './countedQuestRollback';
import { captureTownEnlistmentMercParticipant } from './townEnlistmentMercRollback';
import { captureAct2CacheMercParticipant, planAct2CacheMercAward } from './act2CacheMercRollback';
import type { ClaimResult } from './claimReward';

function safeCount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Unsafe counted reward arithmetic');
  return value;
}
function safeNumbers(value: unknown): void {
  if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) throw new Error('Unsafe counted stat arithmetic');
  if (value !== null && typeof value === 'object') {
    if (value instanceof Map) { for (const entry of value.values()) safeNumbers(entry); }
    else for (const entry of Object.values(value)) safeNumbers(entry);
  }
}

/** Finite dispatch remains available even when live authoring later refuses validation. */
export function countedQuestKeyForQuest(questId: string): CountedQuestKey | undefined {
  // These are routing identities, not reward or source authority. The loader is
  // deliberately consulted only after dispatch, so malformed authoring cannot
  // fall through into the generic reward reader.
  switch (questId) {
    case 'quests/side-act1-gheeds-gamble': return 'gheed';
    case 'quests/side-act3-alkors-experiment': return 'alkor';
    case 'quests/side-act3-jade-statuette': return 'jade';
    case 'quests/side-act4-jamella-trade': return 'jamella';
    case 'quests/side-act5-malahs-elixir': return 'malah';
    default: return undefined;
  }
}

/** Separate Claim has ordinary readiness, without current source area/town/difficulty gates. */
export function hasCountedSourceClaimCompletion(questId: string): boolean {
  const key = countedQuestKeyForQuest(questId); if (key === undefined) return true;
  try {
    if (countedOrdinaryRefusal()) return false;
    const definition = findCountedQuestById(questId); if (!definition || definition.key !== key) return false;
    captureCountedQuestAuthority(key); validateLiveCountedQuestGraphs();
    return hasCountedQuestClaimCompletion(useMapStore.getState().questProgress, useInventoryStore.getState().questItems, definition);
  } catch { return false; }
}

/** Whole-bag material/currency destination, including actual physical gear ownership. */
function destination() {
  const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  const value = { backpack: inventory.backpack, stash: inventory.stash, equipped: inventory.equipped,
    mercEquipment: mercs.mercEquipment, currencies: inventory.currencies, materials: inventory.materials };
  assertCountedData(inventory.legacyGearQuarantine); assertCountedData(inventory.socketQuarantine);
  assertCountedData(value); return value;
}

/** Preflight and publish one complete counted reward under claimQuestReward's existing lease. */
export function publishCountedSourceClaim(key: CountedQuestKey): ClaimResult {
  const ordinary = countedOrdinaryRefusal(); if (ordinary) return ordinary === 'combat-active' ? 'not-ready' : ordinary;
  let authority: ReturnType<typeof captureCountedQuestAuthority>;
  try { authority = captureCountedQuestAuthority(key); validateLiveCountedQuestGraphs(); }
  catch { return 'unsupported-rewards'; }
  const definition = countedQuestDefinition(key); if (!definition) return 'unknown-quest';
  const map = useMapStore.getState(), inv = useInventoryStore.getState(), mercs = useMercStore.getState();
  const row = map.questProgress[definition.quest];
  if (row?.rewardClaimed === true) return 'already-claimed';
  if (!hasCountedQuestClaimCompletion(map.questProgress, inv.questItems, definition)) return 'not-completed';
  const hero = usePlayerStore.getState().player; if (!hero) return 'no-player';
  const prepare = () => {
    if (!row) throw new Error('Missing counted row');
    const before = snapshotCountedData({ hero, rows: pick(map.questProgress, [definition.quest]), items: pick(inv.questItems, definition.sources),
      field: mercs.fieldedMercId, roster: mercs.ownedMercs, mercProgress: mercs.mercProgress, equipped: inv.equipped });
    if (new Set(before.roster.map(actor => actor.id)).size !== before.roster.length) throw new Error('Duplicate counted recipient');
    const recipient = mercs.ownedMercs.find(actor => actor.id === before.field);
    if (before.field !== null && !recipient) throw new Error('Missing counted recipient');
    const xp = countedQuestRewards(key).xp;
    safeCount(hero.level); if (hero.level < 1 || hero.level > LEVEL_CAP) throw new Error('Invalid counted level');
    safeCount(hero.experience); safeCount(hero.statPoints); safeCount(hero.skillPoints);
    const cumulative = safeCount(xpTotal(hero.level) + hero.experience); safeCount(cumulative + xp);
    const growth = awardXp(cumulative, xp), intoLevel = safeCount(growth.totalXp - xpTotal(growth.level));
    const xpHero = { ...before.hero, level: growth.level, experience: intoLevel,
      experienceToNextLevel: growth.level >= LEVEL_CAP ? Math.max(1, intoLevel) : xpRequired(growth.level),
      statPoints: safeCount(hero.statPoints + growth.statPointsGranted), skillPoints: safeCount(hero.skillPoints + growth.skillPointsGranted),
      derivedStats: deriveEquippedPlayerStats(hero, growth.level, inv.equipped, map.questProgress, inv.questItems, map.questReceipts) };
    const rewardHero = key === 'alkor' ? { ...xpHero, statPoints: safeCount(xpHero.statPoints + 5) } : xpHero;
    const consumed = Object.fromEntries(definition.sources.map(source => [source, { itemId: definition.itemId, state: 'consumed' as const }]));
    const finalRows: typeof map.questProgress = { [definition.quest]: { ...row, rewardClaimed: true } };
    const finalProgress = replace(map.questProgress, finalRows, [definition.quest]), finalItems = replace(inv.questItems, consumed, definition.sources);
    validateCountedQuestGraphs(finalProgress, finalItems, loadCountedQuestItems());
    validateQuestItemLedger(finalItems, finalProgress, map.questReceipts);
    const finalHero = key === 'malah' ? { ...rewardHero, derivedStats: composeEquippedPlayerStats(rewardHero, rewardHero.level,
      inv.equipped, finalProgress, finalItems, map.questReceipts).derivedStats } : rewardHero;
    safeNumbers(finalHero.derivedStats);
    let expectedRecipient = recipient && snapshotCountedData(recipient);
    let recipientProgress = recipient ? snapshotCountedData(mercs.getMercProgress(recipient.id)) : undefined;
    if (recipient && recipientProgress && key === 'gheed') {
      const award = planAct2CacheMercAward(recipient, recipientProgress, Math.floor(xp * MERC_XP_SHARE));
      expectedRecipient = award.actor; recipientProgress = award.progress;
    } else if (recipient && recipientProgress) {
      safeCount(recipient.level); if (recipient.level < 1) throw new Error('Invalid counted merc level');
      safeCount(recipientProgress.experience); safeCount(recipientProgress.experienceToNextLevel);
      if (recipientProgress.experienceToNextLevel <= 0) throw new Error('Invalid counted merc threshold');
      let level = recipient.level, remaining = safeCount(recipientProgress.experience + Math.floor(xp * MERC_XP_SHARE));
      let threshold = recipientProgress.experienceToNextLevel;
      while (remaining >= threshold) {
        remaining -= threshold; level = safeCount(level + 1); threshold = safeCount(mercXpForLevel(level));
        if (threshold <= 0) throw new Error('Invalid counted merc threshold');
      }
      recipientProgress = { experience: remaining, experienceToNextLevel: threshold };
      expectedRecipient = growMercenary(repairMercenaryGrowth(snapshotCountedData(recipient)), level - recipient.level);
      safeNumbers(expectedRecipient);
    }
    let bag: KillRewards = mergeRewards({ items: [], runeShards: key === 'jade' ? 1000 : 0, wishstones: 0, runes: 0, gems: 0, materials: {} });
    if (key === 'jamella') {
      const profile = authority.profile; if (!profile) throw new Error('Missing Jamella authority');
      const pools = loadJamellaQuestAwardPools();
      if (pools.treasureClasses.get(profile.input.tableId) !== profile.table) throw new Error('Jamella table injection changed');
      const seed = hashSeed(JSON.stringify(['quest-loot-table-v1', hero.id, definition.quest, profile.input.tableId, profile.input.ilvl, profile.input.picks]));
      const rolled = rollQuestTableRewards(profile.input, pools, createRng(seed));
      if (!rolled) throw new Error('Incomplete Jamella bag');
      assertCountedData(rolled);
      const materials = Object.entries(rolled.materials);
      if (rolled.items.length !== 0 || rolled.runeShards !== 0 || rolled.wishstones !== 0 || rolled.runes !== 0 || rolled.gems !== 1
        || materials.length !== 1 || materials[0]?.[1] !== 1 || !profile.table.picks.some(pick => pick.itemId === materials[0]?.[0])) throw new Error('Unexpected Jamella bag');
      bag = mergeRewards(rolled);
    }
    const grant = planRewardGrant(bag, destination());
    const currencyKeys = key === 'jade' ? ['rune-shard'] : [], materialKeys = Object.keys(bag.materials);
    return { before, recipient, xp, xpHero, rewardHero, finalHero, consumed, finalRows, expectedRecipient, recipientProgress, bag,
      currencyKeys, materialKeys,
      beforeCurrency: snapshotCountedData(pick(inv.currencies, currencyKeys)), afterCurrency: snapshotCountedData(pick(grant.currencies, currencyKeys)),
      beforeMaterials: snapshotCountedData(pick(inv.materials, materialKeys)), afterMaterials: snapshotCountedData(pick(grant.materials, materialKeys)) };
  };
  let prepared: ReturnType<typeof prepare>;
  try { prepared = prepare(); } catch { return 'unsupported-rewards'; }

  const p = prepared, recipient = p.recipient;
  // Reserve numeric participants before XP, without whole-wallet snapshots.
  let preparedShardOwner: QuestGemShardPublication | undefined, wishOwner: QuestCurrencyPublication;
  try {
    if (key === 'gheed') preparedShardOwner = beginQuestGemShardPublication(definition.quest, useInventoryStore.getState().currencies);
    wishOwner = beginQuestCurrencyPublication(definition.quest, 'wishstone', countedQuestRewards(key).wishstones, useInventoryStore.getState().currencies);
  } catch { if (preparedShardOwner) endQuestGemShardPublication(preparedShardOwner); return 'unsupported-rewards'; }
  const shardOwner = preparedShardOwner;
  try {
    // Gheed grants no physical item. Replay the actual XP recipient instead of
    // restoring its whole progress snapshot and erasing independent awards.
    const mercJournal = key === 'gheed' && recipient ? captureAct2CacheMercParticipant(recipient) : null;
    const physical = key !== 'gheed' && recipient ? captureTownEnlistmentMercParticipant(recipient, false) : null;
    const heroJournal = captureCountedHeroParticipant(hero);
    const recipientRefs = new Set(recipient ? [recipient] : []);
    const ownsRecipient = (actor: NonNullable<typeof recipient>) => recipient !== undefined &&
      (recipientRefs.has(actor) || countedActorContinuity(actor, recipient, recipient.id));
    let mercPublishing = false;
    const stopMerc = recipient ? useMercStore.subscribe((next, previous) => {
      if (mercPublishing) for (const actor of [...previous.ownedMercs, ...next.ownedMercs]) if (ownsRecipient(actor)) recipientRefs.add(actor);
    }) : undefined;
    let xpPublished = false, mercPublished = false, rewardPublished = false, wishPublished = false, consumedPublished = key === 'jade', capacityPublished = false, claimed = false;
    const validateShadow = (): void => {
      const live = useMapStore.getState(), inventory = useInventoryStore.getState();
      assertCountedData(live.questProgress); assertCountedData(inventory.questItems);
      const progress = replace(live.questProgress, p.finalRows, [definition.quest]), items = replace(inventory.questItems, p.consumed, definition.sources);
      validateCountedQuestGraphs(progress, items, loadCountedQuestItems()); validateQuestItemLedger(items, progress, live.questReceipts);
    };
    const check = (): void => {
      const live = useMapStore.getState(), inventory = useInventoryStore.getState(), current = useMercStore.getState();
      assertCountedData({ progress: live.questProgress, items: inventory.questItems, currencies: inventory.currencies, materials: inventory.materials,
        roster: current.ownedMercs, progressMerc: current.mercProgress, equipped: inventory.equipped });
      const currentHero = usePlayerStore.getState().player;
      if (countedOrdinaryRefusal() !== null || !sameCountedQuestAuthority(authority) || !heroJournal.owns(currentHero)
        || !sameCountedData(currentHero, capacityPublished ? p.finalHero : rewardPublished ? p.rewardHero : xpPublished ? p.xpHero : p.before.hero)
        || !sameCountedData(pick(live.questProgress, [definition.quest]), claimed ? p.finalRows : p.before.rows)
        || !sameCountedData(pick(inventory.questItems, definition.sources), consumedPublished ? p.consumed : p.before.items)
        || !sameCountedData(pick(inventory.currencies, p.currencyKeys), rewardPublished ? p.afterCurrency : p.beforeCurrency)
        || !sameCountedData(pick(inventory.materials, p.materialKeys), rewardPublished ? p.afterMaterials : p.beforeMaterials)
        || !sameCountedData(inventory.equipped, p.before.equipped)
        || current.fieldedMercId !== p.before.field) throw new Error('Counted Claim publication changed');
      // Accepted saves may retain a derived cache. The exact baseline above is
      // authoritative until real gainExperience performs its normal recomposition.
      if (xpPublished) {
        const expectedHero = capacityPublished ? p.finalHero : rewardPublished ? p.rewardHero : p.xpHero;
        const compositionProgress = capacityPublished && key === 'malah' ? replace(live.questProgress, p.finalRows, [definition.quest]) : live.questProgress;
        const currentComposition = deriveEquippedPlayerStats(expectedHero, expectedHero.level, inventory.equipped, compositionProgress, inventory.questItems, live.questReceipts);
        if (!sameCountedData(currentComposition, expectedHero.derivedStats)) throw new Error('Counted Claim composition authority changed');
      }
      if (recipient) {
        const actors = current.ownedMercs.filter(actor => actor.id === recipient.id), actor = actors[0];
        if (actors.length !== 1 || !actor || !ownsRecipient(actor) || !mercPublished && actor !== recipient
          || !sameCountedData(actor, mercPublished ? p.expectedRecipient : p.before.roster.find(row => row.id === recipient.id))
          || !sameCountedData(pick(current.mercProgress, [recipient.id]), mercPublished ? { [recipient.id]: p.recipientProgress } : pick(p.before.mercProgress, [recipient.id]))) throw new Error('Counted Claim actual recipient changed');
      }
      physical?.checkUnchanged(); validateShadow();
      if (shardOwner) verifyQuestGemShardPublication(shardOwner, inventory.currencies, rewardPublished);
      verifyQuestCurrencyPublication(wishOwner, inventory.currencies, wishPublished);
      planRewardGrant(rewardPublished ? mergeRewards() : p.bag, destination());
      if (claimed) validateQuestItemLedger(inventory.questItems, live.questProgress, live.questReceipts);
    };
    try {
      heroJournal.begin(); check();
      heroJournal.publish(p.xpHero, () => { usePlayerStore.getState().gainExperience(p.xp); }); xpPublished = true; check();
      if (recipient) {
        mercPublishing = true;
        try {
          const publish = () => { useMercStore.getState().shareExperienceWithFielded(p.xp, recipient.id); };
          if (mercJournal && p.expectedRecipient && p.recipientProgress) {
            mercJournal.publish({ actor: p.expectedRecipient, progress: p.recipientProgress }, publish);
          } else publish();
        } finally { mercPublishing = false; }
      }
      mercPublished = true; check();
      if (key === 'alkor') heroJournal.publish(p.rewardHero, () => { usePlayerStore.setState(state => ({ player: state.player && { ...state.player, statPoints: state.player.statPoints + 5 } })); });
      if (key === 'jade') useInventoryStore.getState().addCurrency('rune-shard', 1000);
      if (shardOwner) useInventoryStore.getState().addQuestGemShard(shardOwner);
      if (key === 'jamella') useInventoryStore.getState().addMaterials(p.bag.materials);
      rewardPublished = true; check();
      useInventoryStore.getState().addQuestCurrency(wishOwner); wishPublished = true; check();
      if (key !== 'jade') {
        useInventoryStore.setState(state => ({ questItems: replace(state.questItems, structuredClone(p.consumed), definition.sources) }));
        consumedPublished = true; check();
      }
      if (key === 'malah') heroJournal.publish(p.finalHero, () => { usePlayerStore.setState(state => ({ player: state.player && { ...state.player, derivedStats: structuredClone(p.finalHero.derivedStats) } })); });
      capacityPublished = true; check();
      useMapStore.getState().markQuestRewardClaimed(definition.quest); claimed = true; check();
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      const attempt = (fn: () => void): void => { try { fn(); } catch (error) { errors.push(error); } };
      attempt(() => { useInventoryStore.getState().restoreQuestCurrency(wishOwner); });
      if (shardOwner) attempt(() => { useInventoryStore.getState().restoreQuestGemShard(shardOwner); });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(p.before.rows), [definition.quest]) })); });
      attempt(() => { useInventoryStore.setState(state => ({
        questItems: replace(state.questItems, structuredClone(p.before.items), definition.sources),
        ...(p.currencyKeys.length ? { currencies: replace(state.currencies, structuredClone(p.beforeCurrency), p.currencyKeys) } : {}),
        ...(p.materialKeys.length ? { materials: replace(state.materials, structuredClone(p.beforeMaterials), p.materialKeys) } : {})
      })); });
      if (physical) attempt(() => { physical.restore(); });
      if (mercJournal) attempt(() => { mercJournal.restore(); });
      attempt(() => { heroJournal.restore(); });
      attempt(() => {
        const live = useMapStore.getState(), inventory = useInventoryStore.getState();
        assertCountedData({ progress: live.questProgress, items: inventory.questItems, currencies: inventory.currencies, materials: inventory.materials });
        if (!sameCountedData(pick(live.questProgress, [definition.quest]), p.before.rows)
          || !sameCountedData(pick(inventory.questItems, definition.sources), p.before.items)
          || !sameCountedData(pick(inventory.currencies, p.currencyKeys), p.beforeCurrency)
          || !sameCountedData(pick(inventory.materials, p.materialKeys), p.beforeMaterials)) throw new Error('Counted Claim restoration changed');
        heroJournal.verifyRestored(); validateQuestItemLedger(inventory.questItems, live.questProgress, live.questReceipts);
      });
      if (mercJournal) attempt(() => { mercJournal.verifyRestored(); });
      if (shardOwner) attempt(() => { verifyQuestGemShardPublication(shardOwner, useInventoryStore.getState().currencies, false); });
      attempt(() => { verifyQuestCurrencyPublication(wishOwner, useInventoryStore.getState().currencies, false); });
      if (errors.length) throw new AggregateError(errors, 'Counted Claim restoration failed', { cause });
      return 'grant-failed';
    } finally {
      try { physical?.dispose(); } finally { try { mercJournal?.dispose(); } finally { try { heroJournal.dispose(); } finally { stopMerc?.(); } } }
    }
  } finally { try { endQuestCurrencyPublication(wishOwner); } finally { if (shardOwner) endQuestGemShardPublication(shardOwner); } }
}
