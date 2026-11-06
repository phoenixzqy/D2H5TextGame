import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { loadTownNpcs } from '@/data/loaders/towns';
import { hasLarzukPresentation, LARZUK } from '@/engine/map/larzuk-quest';
import { hasAct5Completion } from '@/engine/save/act5-state';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { Item } from '@/engine/types/items';
import { pick, replace, sameCainData as sameData } from '@/features/quests/cainPublication';
import { questActionPreflight, withQuestTransaction } from '@/features/quests/questTransaction';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { socketItemCandidate } from './questServices';

type Hero = NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>;
const QUESTS = [LARZUK.prerequisite, LARZUK.quest];
const SERVICES = QUESTS.map(id => `${id}#reward:service`);
// Siege's finite victory receipt is the only prerequisite proof for this action.
const PROOFS = [LARZUK.proof, ...ACT5_ENCOUNTERS.filter(row => row.questId === LARZUK.prerequisite).map(row => row.proof)];
/** Retained actual references plus deep preimages; selection grants no durable authority. */
export interface LarzukPresentSelection {
  readonly hero: Hero;
  readonly heroBefore: Hero;
  readonly item: Item;
  readonly itemBefore: Item;
}
/** Verified rollback failure throws AggregateError instead of returning a safe refusal. */
export type LarzukPresentResult = 'ok' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active'
  | 'claim-in-progress' | 'grant-failed';
function readiness(): 'not-ready' | 'no-player' | 'combat-active' | null {
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
  if (!usePlayerStore.getState().player) return 'no-player';
  return hasActiveSubAreaRun() || useCombatStore.getState().inCombat ? 'combat-active' : null;
}
function atLarzuk(): boolean {
  const map = useMapStore.getState();
  return map.currentAct === 5 && map.selectedDifficulty === 'normal' && map.isActUnlocked(5)
    && loadTownNpcs(5).some(npc => npc.id === 'npc/larzuk');
}
function graph(): boolean {
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  try {
    validateQuestItemLedger(inv.questItems, map.questProgress, map.questReceipts);
    validateNative24CurrentCampaignRewards(map, inv.questItems, inv.questServices, map.endgame);
    return true;
  } catch { return false; }
}
/** Real qualified Siege and a tracked unclaimed side row; existing charges are irrelevant. */
export function canPresentLarzukItem(): boolean {
  if (readiness() !== null || !atLarzuk() || !graph()) return false;
  const map = useMapStore.getState(), row = Object.hasOwn(map.questProgress, LARZUK.quest) ? map.questProgress[LARZUK.quest] : undefined;
  return !!row && Object.hasOwn(row, 'id') && row.id === LARZUK.quest && Object.hasOwn(row, 'status')
    && Object.hasOwn(row, 'objectives') && Object.keys(row.objectives).length === 1
    && Object.hasOwn(row.objectives, LARZUK.objective) && typeof row.objectives[LARZUK.objective] === 'boolean'
    && row.rewardClaimed !== true && (row.status === 'inProgress' || row.status === 'completed' && row.objectives[LARZUK.objective] === true)
    && !Object.hasOwn(map.questReceipts, LARZUK.proof)
    && hasAct5Completion(LARZUK.prerequisite, map.questProgress, map.questReceipts, useInventoryStore.getState().questItems);
}
/** Actual eligible gear shares the charge-free socket consumer rule. */
export function larzukPresentCandidates(): readonly Item[] {
  return canPresentLarzukItem() ? useInventoryStore.getState().backpack.filter(item => socketItemCandidate(item.id) === item) : [];
}
/** Capture actual hero/item references and deep payloads at the player's selection. */
export function selectLarzukPresentItem(item: Item): LarzukPresentSelection | null {
  const hero = usePlayerStore.getState().player;
  return hero && canPresentLarzukItem() && socketItemCandidate(item.id) === item
    ? { hero, heroBefore: structuredClone(hero), item, itemBefore: structuredClone(item) } : null;
}
/** Resolve the retained witness without refreshing a moved, replaced or mutated instance. */
export function currentLarzukPresentItem(selection: LarzukPresentSelection | null): Item | null {
  return selection && canPresentLarzukItem() && usePlayerStore.getState().player === selection.hero
    && sameData(selection.hero, selection.heroBefore) && socketItemCandidate(selection.item.id) === selection.item
    && sameData(selection.item, selection.itemBefore) ? selection.item : null;
}
function locations(): readonly (Item | null | undefined)[] {
  const inv = useInventoryStore.getState(), mercs = useMercStore.getState();
  return [...inv.backpack, ...inv.stash, ...Object.values(inv.equipped), ...inv.legacyGearQuarantine.map(row => row.item),
    ...inv.socketQuarantine.map(row => row.item), ...Object.values(mercs.mercEquipment).flatMap(gear => Object.values(gear)),
    ...mercs.ownedMercs.flatMap(merc => merc.equipment), ...(usePlayerStore.getState().player?.equipment ?? [])];
}
/** Present only publishes one completed side objective/proof; never transfers or transforms the item. */
export function presentLarzukItem(selection: LarzukPresentSelection | null): LarzukPresentResult {
  const refusal = questActionPreflight(); if (refusal) return refusal;
  return withQuestTransaction<LarzukPresentResult>(() => {
    const refusal = readiness(); if (refusal) return refusal;
    const target = currentLarzukPresentItem(selection); if (!target || !selection) return 'not-eligible';
    const map = useMapStore.getState(), inv = useInventoryStore.getState(), row = map.questProgress[LARZUK.quest];
    if (!row) return 'not-eligible';
    const before = structuredClone({ hero: selection.hero, equipped: inv.equipped, item: target, rows: pick(map.questProgress, QUESTS),
      proofs: pick(map.questReceipts, PROOFS), services: pick(inv.questServices, SERVICES),
      location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty } });
    const index = inv.backpack.indexOf(target);
    let restoredHero = before.hero;
    const restorationHero = (): Hero => {
      const current = useInventoryStore.getState(), live = useMapStore.getState();
      return sameData(current.equipped, before.equipped) ? structuredClone(before.hero) : { ...structuredClone(before.hero),
        derivedStats: deriveEquippedPlayerStats(before.hero, before.hero.level, current.equipped,
          live.questProgress, current.questItems, live.questReceipts) };
    };
    const expectedRows: typeof before.rows = { ...before.rows, [LARZUK.quest]: { ...row, status: 'completed' as const, objectives: { [LARZUK.objective]: true } } };
    const expectedProofs = { ...before.proofs, [LARZUK.proof]: true as const };
    const check = (published: boolean, restoring = false): void => {
      const live = useMapStore.getState(), current = useInventoryStore.getState();
      const item = socketItemCandidate(before.item.id);
      if ((!restoring && (readiness() !== null || !atLarzuk() || usePlayerStore.getState().player !== selection.hero))
        || !sameData(usePlayerStore.getState().player, restoring ? restoredHero : before.hero)
        || restoring && !sameData(restoredHero, restorationHero())
        || !sameData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location)
        || !sameData(pick(live.questProgress, QUESTS), published ? expectedRows : before.rows)
        || !sameData(pick(live.questReceipts, PROOFS), published ? expectedProofs : before.proofs)
        || !sameData(pick(current.questServices, SERVICES), before.services)
        || !item || !sameData(item, before.item) || !restoring && item !== target
        || locations().filter(row => row === item).length !== 1 || !graph()
        || published && !hasLarzukPresentation(live.questProgress, live.questReceipts, current.questItems)) {
        throw new Error('Larzuk Present publication postcondition failed');
      }
    };
    try {
      check(false);
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(expectedRows), QUESTS),
        questReceipts: replace(state.questReceipts, structuredClone(expectedProofs), PROOFS) }));
      check(true);
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
      const isTarget = (item: Item | null | undefined): boolean => item === target || item?.id === before.item.id;
      attempt(() => { useInventoryStore.setState(state => {
        const backpack = state.backpack.filter(item => !isTarget(item));
        backpack.splice(Math.min(index, backpack.length), 0, structuredClone(before.item));
        return { backpack, stash: state.stash.filter(item => !isTarget(item)),
          equipped: Object.fromEntries(Object.entries(state.equipped).map(([slot, item]) => [slot, isTarget(item) ? null : item])),
          legacyGearQuarantine: state.legacyGearQuarantine.filter(row => !isTarget(row.item)),
          socketQuarantine: state.socketQuarantine.filter(row => !isTarget(row.item)),
          questServices: replace(state.questServices, structuredClone(before.services), SERVICES) };
      }); });
      attempt(() => {
        const mercs = useMercStore.getState();
        if (!Object.values(mercs.mercEquipment).some(gear => Object.values(gear).some(isTarget))
          && !mercs.ownedMercs.some(merc => merc.equipment.some(isTarget))) return;
        useMercStore.setState(state => ({ mercEquipment: Object.fromEntries(Object.entries(state.mercEquipment).map(([id, gear]) => [id,
          Object.fromEntries(Object.entries(gear).map(([slot, item]) => [slot, isTarget(item) ? null : item]))])),
          ownedMercs: state.ownedMercs.map(merc => ({ ...merc, equipment: merc.equipment.filter(item => !isTarget(item)) })) }));
      });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), QUESTS),
        questReceipts: replace(state.questReceipts, structuredClone(before.proofs), PROOFS), ...before.location })); });
      attempt(() => { restoredHero = restorationHero(); usePlayerStore.setState({ player: structuredClone(restoredHero) }); });
      attempt(() => { check(false, true); if (locations().includes(target)) throw new Error('Stale Present target retained after restoration'); });
      if (errors.length > 0) throw new AggregateError(errors, 'Larzuk Present restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
