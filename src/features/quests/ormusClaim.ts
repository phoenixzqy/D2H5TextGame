import { ORMUS, canClaimOrmusCharm, hasOrmusClear } from '@/engine/map/ormus-quest';
import { awardXp, LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { growMercenary, repairMercenaryGrowth } from '@/engine/progression/merc-growth';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { Item } from '@/engine/types/items';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, MERC_XP_SHARE, mercXpForLevel } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { pick, replace, sameCainData as sameData } from './cainPublication';
import { captureFiniteSideWishParticipant, type FiniteSideWishParticipant } from './finiteSideWishParticipant';

/** Preview and execution use the same validated, earned clear and ordered Talk. */
export function hasOrmusClaimCompletion(questId: string): boolean {
  if (questId !== ORMUS.quest) return true;
  const map = useMapStore.getState();
  if (map.selectedDifficulty !== 'normal' || hasActiveSubAreaRun() || useCombatStore.getState().inCombat) return false;
  try {
    validateQuestItemLedger(useInventoryStore.getState().questItems, map.questProgress, map.questReceipts);
    return canClaimOrmusCharm(map.questProgress, map.questReceipts);
  } catch { return false; }
}

/** Settle the privately rolled exact item under Claim's lease, checking each publication and claiming last. */
export function publishOrmusClaim(item: Item, preflightInventory: () => void): 'ok' | 'grant-failed' | 'unsupported-rewards' {
  const hero = usePlayerStore.getState().player, map = useMapStore.getState();
  if (!hero || !hasOrmusClaimCompletion(ORMUS.quest)) return 'unsupported-rewards';
  const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  const recipient = mercs.ownedMercs.find(row => row.id === mercs.fieldedMercId), recipientId = recipient?.id;
  const recipientIndex = mercs.ownedMercs.findIndex(row => row === recipient);
  const recipientReferences = new Set<NonNullable<typeof recipient>>();
  if (recipient) recipientReferences.add(recipient);
  const rewardId = item.id;
  const before = structuredClone({ hero, recipient, rows: pick(map.questProgress, [ORMUS.quest]),
    proofs: pick(map.questReceipts, [ORMUS.proof]), item,
    mercProgress: recipientId === undefined ? {} : pick(mercs.mercProgress, [recipientId]),
    equipped: inventory.equipped, mercEquipment: mercs.mercEquipment,
    location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty } });
  let expectedHero = before.hero, restoredHero = before.hero, expectedRecipient = before.recipient, expectedProgress = before.mercProgress;
  try {
    const growth = awardXp(xpTotal(hero.level) + hero.experience, 5000);
    const intoLevel = Math.max(0, growth.totalXp - xpTotal(growth.level));
    expectedHero = { ...before.hero, level: growth.level, experience: intoLevel,
      experienceToNextLevel: growth.level >= LEVEL_CAP ? Math.max(1, intoLevel) : xpRequired(growth.level),
      statPoints: hero.statPoints + growth.statPointsGranted, skillPoints: hero.skillPoints + growth.skillPointsGranted,
      derivedStats: deriveEquippedPlayerStats(before.hero, growth.level, inventory.equipped,
        map.questProgress, inventory.questItems, map.questReceipts) };
    if (recipient && recipientId !== undefined) {
      let progress = structuredClone(mercs.getMercProgress(recipientId)), level = recipient.level;
      let remaining = progress.experience + Math.floor(5000 * MERC_XP_SHARE);
      while (remaining >= progress.experienceToNextLevel) {
        remaining -= progress.experienceToNextLevel; level++;
        progress = { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
      }
      expectedProgress = { [recipientId]: { experience: remaining, experienceToNextLevel: progress.experienceToNextLevel } };
      expectedRecipient = growMercenary(repairMercenaryGrowth(structuredClone(recipient)), level - recipient.level);
    }
  } catch { return 'unsupported-rewards'; }
  const claimedRows = structuredClone(before.rows), row = claimedRows[ORMUS.quest];
  if (!row) return 'unsupported-rewards';
  claimedRows[ORMUS.quest] = { ...row, rewardClaimed: true };
  const owns = (candidate: Item | null | undefined): boolean => !!candidate && (candidate === item || candidate.id === rewardId);
  const allRewards = () => {
    const current = useInventoryStore.getState();
    return [...current.backpack, ...current.stash, ...Object.values(current.equipped),
      ...Object.values(useMercStore.getState().mercEquipment).flatMap(equipment => Object.values(equipment))].filter(owns);
  };
  const restoredSlots: string[] = [], restoredMercSlots = new Map<string, string[]>();
  let restoredRecipientGear = false;
  let wishes: FiniteSideWishParticipant;
  try { wishes = captureFiniteSideWishParticipant(ORMUS.quest); } catch { return 'unsupported-rewards'; }
  const check = (claimed: boolean, grantedHero: boolean, grantedMerc: boolean, grantedItem: boolean, restoring = false) => {
    const live = useMapStore.getState(), current = useInventoryStore.getState(), currentMercs = useMercStore.getState();
    const rewards = allRewards(), inBag = current.backpack.filter(owns);
    if ((!restoring && (useHydrationStore.getState().status !== 'ready' || isReplacingSave() || hasActiveSubAreaRun() || useCombatStore.getState().inCombat)) ||
      !sameData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location) ||
      !sameData(usePlayerStore.getState().player, grantedHero ? expectedHero : restoring ? restoredHero : before.hero) ||
      !sameData(pick(live.questProgress, [ORMUS.quest]), claimed ? claimedRows : before.rows) ||
      !sameData(pick(live.questReceipts, [ORMUS.proof]), before.proofs) ||
      !sameData(pick(current.equipped, ['charm', ...restoredSlots]), pick(before.equipped, ['charm', ...restoredSlots])) ||
      rewards.length !== (grantedItem ? 1 : 0) || !sameData(inBag, grantedItem ? [before.item] : []) ||
      [...restoredMercSlots].some(([id, slots]) => !sameData(pick(currentMercs.mercEquipment[id] ?? {}, slots), pick(before.mercEquipment[id] ?? {}, slots)))) {
      throw new Error('Ormus Claim context/postcondition changed');
    }
    if (recipient && recipientId !== undefined) {
      const recipients = currentMercs.ownedMercs.filter(candidate => candidate.id === recipientId);
      const references = currentMercs.ownedMercs.filter(candidate => recipientReferences.has(candidate));
      if (recipients.length !== 1 || (!restoring && (references.length !== 1 || references[0] !== recipients[0])) ||
        !sameData(recipients[0], grantedMerc ? expectedRecipient : before.recipient) ||
        !sameData(pick(currentMercs.mercProgress, [recipientId]), grantedMerc ? expectedProgress : before.mercProgress) ||
        (restoring && restoredRecipientGear && !sameData(pick(currentMercs.mercEquipment, [recipientId]), pick(before.mercEquipment, [recipientId])))) throw new Error('Ormus Claim recipient changed');
    }
    validateQuestItemLedger(current.questItems, live.questProgress, live.questReceipts);
    if (!hasOrmusClear(live.questProgress, live.questReceipts)) throw new Error('Ormus Claim source changed');
    if (!restoring) wishes.check();
  };
  try {
    check(false, false, false, false);
    usePlayerStore.getState().gainExperience(5000); check(false, true, false, false);
    if (recipient && recipientId !== undefined && expectedRecipient) {
      const published = structuredClone(expectedRecipient); recipientReferences.add(published);
      useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(candidate => candidate === recipient ? published : candidate),
        mercProgress: replace(state.mercProgress, structuredClone(expectedProgress), [recipientId]) }));
    }
    check(false, true, true, false);
    preflightInventory(); useInventoryStore.getState().addItem(item); check(false, true, true, true);
    wishes.publish(); check(false, true, true, true);
    useMapStore.getState().markQuestRewardClaimed(ORMUS.quest); check(true, true, true, true);
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    const restore = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
    restore(() => { wishes.restore(); });
    // Remove this identity from every ownership location, including subscriber transfers.
    // Restore any replaced slot and remove its displaced copy from bags before returning it.
    const displacedIds = new Set<string>();
    restoredRecipientGear = recipientId !== undefined &&
      (!useMercStore.getState().ownedMercs.some(candidate => candidate.id === recipientId || recipientReferences.has(candidate)) ||
        !Object.hasOwn(useMercStore.getState().mercEquipment, recipientId));
    const recipientGearIds = new Set(restoredRecipientGear && recipientId !== undefined
      ? Object.values(before.mercEquipment[recipientId] ?? {}).filter((candidate): candidate is Item => !!candidate).map(candidate => candidate.id) : []);
    const restoringGear = (candidate: Item | null | undefined) => owns(candidate) || (!!candidate && recipientGearIds.has(candidate.id));
    const restoreGear = (current: Record<string, Item | null>, previous: Record<string, Item | null>, slots: string[], heroGear = false) => {
      const next = { ...current };
      for (const key of new Set([...Object.keys(current), ...(heroGear ? ['charm'] : [])])) {
        if (!restoringGear(current[key]) && !(heroGear && key === 'charm' && !sameData(pick(current, [key]), pick(previous, [key])))) continue;
        slots.push(key);
        const old = previous[key]; if (old) displacedIds.add(old.id);
        if (Object.hasOwn(previous, key)) Reflect.set(next, key, structuredClone(old)); else Reflect.deleteProperty(next, key);
      }
      return next;
    };
    restore(() => { useMercStore.setState(state => {
      const mercEquipment = { ...state.mercEquipment };
      for (const [id, equipment] of Object.entries(state.mercEquipment)) {
        if (restoredRecipientGear && id === recipientId) continue;
        const slots: string[] = [], restored = restoreGear(equipment, before.mercEquipment[id] ?? {}, slots);
        if (slots.length === 0) continue;
        restoredMercSlots.set(id, slots);
        if (Object.keys(restored).length === 0 && !Object.hasOwn(before.mercEquipment, id)) Reflect.deleteProperty(mercEquipment, id);
        else mercEquipment[id] = restored;
      }
      if (restoredRecipientGear && recipientId !== undefined) {
        if (Object.hasOwn(before.mercEquipment, recipientId)) mercEquipment[recipientId] = structuredClone(before.mercEquipment[recipientId] ?? {});
        else Reflect.deleteProperty(mercEquipment, recipientId);
      }
      const ownedMercs = state.ownedMercs.filter(candidate => candidate.id !== recipientId && !recipientReferences.has(candidate));
      if (before.recipient) ownedMercs.splice(Math.min(recipientIndex, ownedMercs.length), 0, structuredClone(before.recipient));
      return { mercEquipment, ...(recipientId === undefined ? {} : { ownedMercs,
        mercProgress: replace(state.mercProgress, structuredClone(before.mercProgress), [recipientId]) }) };
    }); });
    restore(() => { useInventoryStore.setState(state => {
      const equipped = restoreGear(state.equipped, before.equipped, restoredSlots, true);
      return { equipped, backpack: state.backpack.filter(candidate => !restoringGear(candidate) && !displacedIds.has(candidate.id)),
        stash: state.stash.filter(candidate => !restoringGear(candidate) && !displacedIds.has(candidate.id)) };
    }); });
    restore(() => { useMapStore.setState(state => ({ ...before.location,
      questProgress: replace(state.questProgress, structuredClone(before.rows), [ORMUS.quest]),
      questReceipts: replace(state.questReceipts, structuredClone(before.proofs), [ORMUS.proof]) })); });
    restore(() => {
      const current = useInventoryStore.getState(), live = useMapStore.getState();
      restoredHero = structuredClone(before.hero);
      if (!sameData(current.equipped, before.equipped)) restoredHero = { ...restoredHero,
        derivedStats: deriveEquippedPlayerStats(restoredHero, restoredHero.level, current.equipped,
          live.questProgress, current.questItems, live.questReceipts) };
      usePlayerStore.setState({ player: structuredClone(restoredHero) });
    });
    restore(() => { check(false, false, false, false, true); });
    restore(() => { wishes.verifyRestored(); });
    if (errors.length) throw new AggregateError(errors, 'Ormus Claim restoration failed', { cause });
    return 'grant-failed';
  } finally { wishes.dispose(); }
}
