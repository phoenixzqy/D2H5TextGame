import { MALUS_QUEST, MALUS_SIDE_QUEST, MALUS_SOURCE, hasMalusCompletion } from '@/engine/map/malus-quest';
import { ACT1_QUEST_RECEIPTS } from '@/engine/map/act1-quest-sources';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
const MALUS_RECEIPTS = [ACT1_QUEST_RECEIPTS.presentItem];
import { awardXp, LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { growMercenary, repairMercenaryGrowth } from '@/engine/progression/merc-growth';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, MERC_XP_SHARE, mercXpForLevel } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { pick, replace, sameCainData } from './cainPublication';

const QUESTS = [MALUS_QUEST, MALUS_SIDE_QUEST];
const SERVICES = QUESTS.map(id => `${id}#reward:service`);

/** Read-only Claim authority; bare legacy flags supply neither consumed Malus nor Present proof. */
export function hasImbueClaimCompletion(questId: string): boolean {
  if (!QUESTS.includes(questId)) return true;
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  if (map.selectedDifficulty !== 'normal' || hasActiveSubAreaRun() || useCombatStore.getState().inCombat) return false;
  try {
    validateQuestItemLedger(items, map.questProgress, map.questReceipts);
    return hasMalusCompletion(questId, map.questProgress, items, map.questReceipts);
  } catch { return false; }
}

/**
 * Settle a preflighted Malus/Present XP and independent charge under Claim's lease.
 * Capture the recipient before publication, check every boundary, mark claimed
 * last, and restore deep participating values while preserving unrelated writes.
 * Publish the exact source charge before claimed-last. Failed restoration is explicit.
 */
export function publishImbueClaim(questId: string, xp: number): 'ok' | 'grant-failed' | 'unsupported-rewards' {
  const hero = usePlayerStore.getState().player, map = useMapStore.getState();
  if (!hero || !QUESTS.includes(questId) || !hasImbueClaimCompletion(questId)) return 'unsupported-rewards';
  const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  const serviceSource = `${questId}#reward:service`;
  if (Object.hasOwn(inventory.questServices, serviceSource) ||
    xp !== (questId === MALUS_QUEST ? 3500 : 0)) return 'unsupported-rewards';
  const recipient = xp > 0 ? mercs.ownedMercs.find(row => row.id === mercs.fieldedMercId) : undefined;
  const recipientId = recipient?.id;
  const recipientReferences = new Set<NonNullable<typeof recipient>>();
  if (recipient) recipientReferences.add(recipient);
  const recipientIndex = mercs.ownedMercs.findIndex(row => row === recipient);
  const before = structuredClone({ hero, rows: pick(map.questProgress, QUESTS),
    items: pick(inventory.questItems, [MALUS_SOURCE]), receipts: pick(map.questReceipts, MALUS_RECEIPTS),
    services: pick(inventory.questServices, SERVICES), recipient,
    mercProgress: recipientId !== undefined ? pick(mercs.mercProgress, [recipientId]) : {},
    location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty } });
  const expectedServices = { ...before.services, [serviceSource]: { serviceId: 'imbue_item', state: 'available' } };
  let expectedHero = before.hero, expectedRecipient = before.recipient;
  let expectedMercProgress = before.mercProgress;
  try {
    if (xp > 0) {
      const growth = awardXp(xpTotal(hero.level) + hero.experience, xp);
      const intoLevel = Math.max(0, growth.totalXp - xpTotal(growth.level));
      expectedHero = { ...before.hero, level: growth.level, experience: intoLevel,
        experienceToNextLevel: growth.level >= LEVEL_CAP ? Math.max(1, intoLevel) : xpRequired(growth.level),
        statPoints: hero.statPoints + growth.statPointsGranted, skillPoints: hero.skillPoints + growth.skillPointsGranted,
        derivedStats: deriveEquippedPlayerStats(before.hero, growth.level, inventory.equipped,
          map.questProgress, inventory.questItems, map.questReceipts) };
      if (recipient && recipientId !== undefined) {
        let progress = structuredClone(mercs.getMercProgress(recipientId));
        let remaining = progress.experience + Math.floor(xp * MERC_XP_SHARE), level = recipient.level;
        while (remaining >= progress.experienceToNextLevel) {
          remaining -= progress.experienceToNextLevel; level++;
          progress = { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
        }
        expectedMercProgress = { [recipientId]: { experience: remaining, experienceToNextLevel: progress.experienceToNextLevel } };
        expectedRecipient = growMercenary(repairMercenaryGrowth(structuredClone(recipient)), level - recipient.level);
      }
    }
  } catch { return 'unsupported-rewards'; }
  const claimedRows = structuredClone(before.rows), row = claimedRows[questId];
  if (!row) return 'unsupported-rewards';
  claimedRows[questId] = { ...row, rewardClaimed: true };
  const check = (claimed: boolean, grantedHero: boolean, grantedMerc: boolean, grantedService = false, restoring = false): void => {
    const live = useMapStore.getState(), currentItems = useInventoryStore.getState();
    if ((!restoring && (useHydrationStore.getState().status !== 'ready' || isReplacingSave() || hasActiveSubAreaRun() ||
      useCombatStore.getState().inCombat)) || !sameCainData({ currentAct: live.currentAct,
      currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location) ||
      !sameCainData(usePlayerStore.getState().player, grantedHero ? expectedHero : before.hero) ||
      !sameCainData(pick(live.questProgress, QUESTS), claimed ? claimedRows : before.rows) ||
      !sameCainData(pick(live.questReceipts, MALUS_RECEIPTS), before.receipts) ||
      !sameCainData(pick(currentItems.questItems, [MALUS_SOURCE]), before.items) ||
      !sameCainData(pick(currentItems.questServices, SERVICES), grantedService ? expectedServices : before.services)) throw new Error('Imbue Claim context/postcondition changed');
    if (recipient && recipientId !== undefined) {
      const rows = useMercStore.getState().ownedMercs.filter(candidate => candidate.id === recipientId);
      const references = useMercStore.getState().ownedMercs.filter(candidate => recipientReferences.has(candidate));
      if (rows.length !== 1 || (restoring ? references.length !== 0 : references.length !== 1 || references[0] !== rows[0])
        || !sameCainData(rows[0], grantedMerc ? expectedRecipient : before.recipient) ||
        !sameCainData(pick(useMercStore.getState().mercProgress, [recipientId]), grantedMerc ? expectedMercProgress : before.mercProgress)) {
        throw new Error('Imbue Claim recipient postcondition failed');
      }
    }
    if (!restoring) {
      validateQuestItemLedger(currentItems.questItems, live.questProgress, live.questReceipts);
      if (!hasMalusCompletion(questId, live.questProgress, currentItems.questItems, live.questReceipts)) throw new Error('Imbue Claim graph changed');
    }
  };
  try {
    check(false, false, false);
    if (xp > 0) {
      usePlayerStore.getState().gainExperience(xp); check(false, true, false);
      if (recipient && recipientId !== undefined && expectedRecipient) {
        const publishedRecipient = structuredClone(expectedRecipient);
        recipientReferences.add(publishedRecipient);
        useMercStore.setState(state => ({
          ownedMercs: state.ownedMercs.map(candidate => candidate === recipient ? publishedRecipient : candidate),
          mercProgress: replace(state.mercProgress, structuredClone(expectedMercProgress), [recipientId])
        }));
      }
      check(false, true, true);
    }
    useInventoryStore.setState(state => ({ questServices: { ...state.questServices,
      [serviceSource]: { serviceId: 'imbue_item', state: 'available' } } }));
    check(false, xp > 0, xp > 0, true);
    useMapStore.getState().markQuestRewardClaimed(questId); check(true, xp > 0, xp > 0, true);
    const live = useMapStore.getState(), current = useInventoryStore.getState();
    validateNative24CurrentCampaignRewards(live, current.questItems, current.questServices, live.endgame);
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    const restore = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
    restore(() => { usePlayerStore.setState({ player: structuredClone(before.hero) }); });
    const restoredRecipient = before.recipient;
    if (recipient && recipientId !== undefined && restoredRecipient) {
      restore(() => { useMercStore.setState(state => {
        const ownedMercs = state.ownedMercs.filter(candidate => candidate.id !== recipientId && !recipientReferences.has(candidate));
        ownedMercs.splice(Math.min(recipientIndex, ownedMercs.length), 0, structuredClone(restoredRecipient));
        return { ownedMercs, mercProgress: replace(state.mercProgress, structuredClone(before.mercProgress), [recipientId]) };
      }); });
    }
    restore(() => { useInventoryStore.setState(state => ({
      questItems: replace(state.questItems, structuredClone(before.items), [MALUS_SOURCE]),
      questServices: replace(state.questServices, structuredClone(before.services), SERVICES)
    })); });
    restore(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), QUESTS),
      questReceipts: replace(state.questReceipts, structuredClone(before.receipts), MALUS_RECEIPTS), ...before.location })); });
    restore(() => { check(false, false, false, false, true); });
    restore(() => {
      const live = useMapStore.getState(), current = useInventoryStore.getState();
      validateQuestItemLedger(current.questItems, live.questProgress, live.questReceipts);
      validateNative24CurrentCampaignRewards(live, current.questItems, current.questServices, live.endgame);
    });
    if (errors.length > 0) throw new AggregateError(errors, 'Imbue Claim restoration failed', { cause });
    return 'grant-failed';
  }
}
