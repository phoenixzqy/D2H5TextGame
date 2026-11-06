import { WARBAND } from '@/engine/map/warband-quest';
import { loadQuests } from '@/data/loaders/quests';
import { loadMercPool } from '@/data/loaders/mercs';
import { LIVE_ACT5_DOMAIN } from '@/engine/save/act5-state';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import type { Mercenary } from '@/engine/types/entities';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { pick, replace, sameCainData as sameData } from './cainPublication';
import { verifyQuestCurrencyPublication, type QuestCurrencyPublication } from '@/stores/questCurrencyJournal';
import { captureWarbandMercParticipants, restoreWarbandMercParticipants } from './warbandMercRollback';

const QUESTS = [WARBAND.quest, WARBAND.prerequisite];
const PROOFS = [WARBAND.proof, ...LIVE_ACT5_DOMAIN.cageProofs];
/** Enlist and new Claim issuance retain the exact approved authored action and reward. */
export function hasCanonicalWarbandDefinition(): boolean {
  const row = loadQuests().find(quest => quest.id === WARBAND.quest), objective = row?.objectives[0];
  const rewards = row?.rewards, merc = rewards && Object.getOwnPropertyDescriptor(rewards, 'mercenaryUnlock');
  const wishes = rewards && Object.getOwnPropertyDescriptor(rewards, 'wishstones');
  return loadMercPool().pool.some(merc => merc.id === WARBAND.mercId) && row?.type === 'side'
    && row.actId === WARBAND.actId && row.giver === WARBAND.npc
    && row.prerequisites?.length === 1 && row.prerequisites[0] === WARBAND.prerequisite
    && row.objectives.length === 1 && objective?.id === WARBAND.objective && objective.type === 'hire-mercenary'
    && objective.mercId === WARBAND.mercId && !!rewards && Reflect.ownKeys(rewards).length === 2
    && merc?.enumerable === true && Object.hasOwn(merc, 'value') && merc.value === WARBAND.mercId
    && wishes?.enumerable === true && Object.hasOwn(wishes, 'value') && wishes.value === 10;
}
/** Enlist and Claim share source validation without granting generic recruitment authority. */
export function validWarbandSource(): boolean {
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  try {
    validateQuestItemLedger(inv.questItems, map.questProgress, map.questReceipts);
    validateNative24CurrentCampaignRewards(map, inv.questItems, inv.questServices, map.endgame);
    return true;
  } catch { return false; }
}
interface WarbandPublication {
  readonly kind: 'enlist' | 'claim';
  readonly currencyOwner?: QuestCurrencyPublication;
  readonly recruit: Mercenary | null;
  readonly fieldedId: string | null;
  readonly context: () => boolean;
}
/**
 * Called only under the shared quest lease. Verify roster/fielding before publishing
 * completion, or mark Claim last. Restore deep scoped source and physical ownership
 * after synchronous faults; restoration failure is explicit, never crash atomicity.
 */
export function publishWarbandChange(input: WarbandPublication): 'ok' | 'grant-failed' {
  const currencyOwner = input.currencyOwner;
  if ((input.kind === 'claim') !== (currencyOwner !== undefined)) return 'grant-failed';
  let currencyGranted = false;
  const map = useMapStore.getState(), mercs = useMercStore.getState(), hero = usePlayerStore.getState().player;
  const before = structuredClone({ hero, roster: mercs.ownedMercs, equipment: mercs.mercEquipment, progress: mercs.mercProgress,
    field: mercs.fieldedMercId, rows: pick(map.questProgress, QUESTS), proofs: pick(map.questReceipts, PROOFS),
    location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty } });
  const row = before.rows[WARBAND.quest];
  if (!row || !hero) return 'grant-failed';
  const ids = [...new Set([...mercs.ownedMercs.filter(merc => merc.id.split('#')[0] === WARBAND.mercId).map(merc => merc.id),
    ...(input.recruit ? [input.recruit.id] : []), ...(before.field ? [before.field] : [])])];
  const participants = captureWarbandMercParticipants(ids, input.recruit);
  const expectedReferences = input.recruit ? [...mercs.ownedMercs, input.recruit] : mercs.ownedMercs;
  const physicalIds = new Set([
    ...participants.ownedMercs.filter(merc => ids.includes(merc.id)).flatMap(merc => merc.equipment),
    ...Object.entries(participants.mercEquipment).filter(([id]) => ids.includes(id)).flatMap(([, gear]) => Object.values(gear))
  ].filter(item => item != null).map(item => item.id));
  const physicalView = (snapshot: typeof participants) => {
    const gear = (item: { id: string } | null | undefined) => !!item && physicalIds.has(item.id);
    const slots = (equipment: typeof snapshot.inventory.equipped) => Object.fromEntries(Object.entries(equipment).filter(([, item]) => gear(item)));
    return { backpack: snapshot.inventory.backpack.filter(gear), stash: snapshot.inventory.stash.filter(gear),
      equipped: slots(snapshot.inventory.equipped), legacy: snapshot.inventory.legacyGearQuarantine.filter(row => gear(row.item)),
      socket: snapshot.inventory.socketQuarantine.filter(row => gear(row.item)), hero: snapshot.hero?.equipment.filter(gear) ?? [],
      mercs: snapshot.ownedMercs.map(merc => ({ id: merc.id, equipment: merc.equipment.filter(gear) })).filter(merc => merc.equipment.length > 0),
      mercEquipment: Object.fromEntries(Object.entries(snapshot.mercEquipment).map(([id, equipment]) => [id, slots(equipment)] as const)
        .filter(([, equipment]) => Object.keys(equipment).length > 0)) };
  };
  const beforePhysical = physicalView(participants);
  const expectedRows: typeof before.rows = { ...before.rows, [WARBAND.quest]: input.kind === 'enlist'
    ? { ...row, status: 'completed', objectives: { [WARBAND.objective]: true } } : { ...row, rewardClaimed: true } };
  const expected = structuredClone({ roster: input.recruit ? [...before.roster, input.recruit] : before.roster,
    equipment: input.recruit ? { ...before.equipment, [input.recruit.id]: {} } : before.equipment,
    progress: input.recruit ? { ...before.progress, [input.recruit.id]: { experience: 0, experienceToNextLevel: mercXpForLevel(input.recruit.level) } } : before.progress,
    field: input.fieldedId,
    rows: expectedRows,
    proofs: input.kind === 'enlist' ? { ...before.proofs, [WARBAND.proof]: true as const } : before.proofs });
  function check(mercPublished: boolean, sourcePublished: boolean): void {
    const live = useMapStore.getState(), current = useMercStore.getState();
    if (currencyOwner) verifyQuestCurrencyPublication(currencyOwner, useInventoryStore.getState().currencies, currencyGranted);
    if (!input.context() || usePlayerStore.getState().player !== hero || !sameData(hero, before.hero)
      || !sameData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location)
      || !sameData(current.ownedMercs, mercPublished ? expected.roster : before.roster)
      || current.ownedMercs.some((merc, index) => merc !== (mercPublished ? expectedReferences : mercs.ownedMercs)[index])
      || !sameData(current.mercEquipment, mercPublished ? expected.equipment : before.equipment)
      || !sameData(current.mercProgress, mercPublished ? expected.progress : before.progress)
      || current.fieldedMercId !== (mercPublished ? expected.field : before.field)
      || !sameData(physicalView(captureWarbandMercParticipants(ids)), beforePhysical)
      || !sameData(pick(live.questProgress, QUESTS), sourcePublished ? expected.rows : before.rows)
      || !sameData(pick(live.questReceipts, PROOFS), sourcePublished ? expected.proofs : before.proofs)
      || !validWarbandSource()) throw new Error('Warband publication postcondition failed');
  }
  try {
    check(false, false);
    if (input.recruit !== null || input.kind === 'enlist') {
      useMercStore.setState(state => ({
        ...(input.recruit ? { ownedMercs: [...state.ownedMercs, input.recruit],
          mercEquipment: { ...state.mercEquipment, [input.recruit.id]: {} },
          mercProgress: { ...state.mercProgress, [input.recruit.id]: { experience: 0, experienceToNextLevel: mercXpForLevel(input.recruit.level) } } } : {}),
        ...(input.kind === 'enlist' ? { fieldedMercId: input.fieldedId } : {})
      }));
    }
    check(true, false);
    if (currencyOwner) {
      useInventoryStore.getState().addQuestCurrency(currencyOwner); currencyGranted = true;
      check(true, false);
    }
    useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(expected.rows), QUESTS),
      questReceipts: replace(state.questReceipts, structuredClone(expected.proofs), PROOFS) }));
    check(true, true);
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
    // Currency rollback observers run before source/physical restoration and its final checks.
    if (currencyOwner) attempt(() => { useInventoryStore.getState().restoreQuestCurrency(currencyOwner); });
    attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), QUESTS),
      questReceipts: replace(state.questReceipts, structuredClone(before.proofs), PROOFS), ...before.location })); });
    attempt(() => { restoreWarbandMercParticipants(participants); });
    attempt(() => {
      const live = useMapStore.getState();
      if (!sameData(pick(live.questProgress, QUESTS), before.rows) || !sameData(pick(live.questReceipts, PROOFS), before.proofs)
        || !sameData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location)
        || !validWarbandSource()) throw new Error('Warband source restoration failed');
    });
    if (currencyOwner) attempt(() => { verifyQuestCurrencyPublication(currencyOwner, useInventoryStore.getState().currencies, false); });
    if (errors.length > 0) throw new AggregateError(errors, 'Warband restoration failed', { cause });
    return 'grant-failed';
  }
}
