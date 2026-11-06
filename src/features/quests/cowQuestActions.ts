import { COW, canEarnCowLeg, hasCowCompletion, isCowAdmissionEligible } from '@/engine/map/cow-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { loadTownNpcs } from '@/data/loaders/towns';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { captureCowAuthority, cowOrdinaryReady, sameCowActor, sameCowAuthority, validateLiveCowGraph } from './cowContract';
import { pick } from './cainPublication';
import { replaceCountedDataKeys as replace, sameCountedData as sameData, snapshotCountedData } from './countedQuestContract';
import { questActionPreflight, withQuestTransaction } from './questTransaction';
import type { RecoverToolResult } from './interactObject';

export type CowActionResult = 'ok' | 'already-owned' | 'already-opened' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress' | 'grant-failed';
export type CowQuestStage = 'unavailable' | 'need-leg' | 'need-tome' | 'need-cube' | 'ready-to-open' | 'portal-open' | 'victorious' | 'claimed';
const sources = [COW.legSource, COW.tomeSource], proofs = [COW.tomeSource, COW.openProof, COW.victoryProof];
function commonLocation(): boolean {
  const map = useMapStore.getState();
  return cowOrdinaryReady() && map.currentAct === 1 && map.selectedDifficulty === 'normal' && map.isActUnlocked(1);
}
function townReady(): boolean { return commonLocation() && loadTownNpcs(useMapStore.getState().currentAct).filter(npc => npc.id === COW.npc).length === 1; }
function fieldReady(): boolean {
  const map = useMapStore.getState();
  return commonLocation() && map.currentSubAreaId === COW.area && map.clearedSubAreas.includes(COW.area);
}
/** Durable physical stage, including the missing source chain of already-claimed legacy rows. */
export function cowQuestStage(): CowQuestStage {
  try {
    captureCowAuthority(); validateLiveCowGraph();
    const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
    if (hasCowCompletion(map.questProgress, items, map.questReceipts)) return map.questProgress[COW.quest]?.rewardClaimed === true ? 'claimed' : 'victorious';
    if (isCowAdmissionEligible(map.questProgress, items, map.questReceipts)) return 'portal-open';
    if (canEarnCowLeg(map.questProgress, items, map.questReceipts)) return 'need-leg';
    if (!Object.hasOwn(items, COW.legSource)) return 'unavailable';
    if (!Object.hasOwn(items, COW.tomeSource)) return 'need-tome';
    return items[COW.cubeSource]?.itemId === COW.cubeItemId && items[COW.cubeSource]?.state === 'owned' ? 'ready-to-open' : 'need-cube';
  } catch { return 'unavailable'; }
}
/** Source predicates perform no publication, allocation, healing or cache normalization. */
export function cowRecoveryStatus(): 'ready' | 'owned' | 'consumed' | 'unavailable' {
  try {
    if (!fieldReady()) return 'unavailable'; captureCowAuthority(); validateLiveCowGraph();
    const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
    if (Object.hasOwn(items, COW.legSource)) return items[COW.legSource]?.state === 'consumed' ? 'consumed' : 'owned';
    return canEarnCowLeg(map.questProgress, items, map.questReceipts) ? 'ready' : 'unavailable';
  } catch { return 'unavailable'; }
}
export function cowTomeStatus(): 'ready' | 'owned' | 'consumed' | 'unavailable' {
  try {
    if (!townReady()) return 'unavailable'; const stage = cowQuestStage(), items = useInventoryStore.getState().questItems;
    if (stage === 'unavailable') return 'unavailable';
    if (Object.hasOwn(items, COW.tomeSource)) return items[COW.tomeSource]?.state === 'consumed' ? 'consumed' : 'owned';
    return stage === 'need-tome' ? 'ready' : 'unavailable';
  } catch { return 'unavailable'; }
}
export function cowTransmuteStatus(): 'ready' | 'opened' | 'unavailable' {
  try {
    if (!townReady()) return 'unavailable'; const stage = cowQuestStage();
    return ['portal-open', 'victorious', 'claimed'].includes(stage) ? 'opened' : stage === 'ready-to-open' ? 'ready' : 'unavailable';
  } catch { return 'unavailable'; }
}
function execute(kind: 'recover' | 'receive' | 'open'): CowActionResult {
  const refusal = questActionPreflight(); if (refusal) return refusal;
  return withQuestTransaction<CowActionResult>(() => {
    const status = kind === 'recover' ? cowRecoveryStatus() : kind === 'receive' ? cowTomeStatus() : cowTransmuteStatus();
    if (status === 'owned' || status === 'consumed') return 'already-owned';
    if (status === 'opened') return 'already-opened'; if (status !== 'ready') return 'not-eligible';
    const authority = captureCowAuthority(), map = useMapStore.getState(), inventory = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
    if (!hero) return 'no-player';
    const actor = { hero, id: hero.id }, before = snapshotCountedData({ rows: pick(map.questProgress, [COW.quest]),
      items: pick(inventory.questItems, sources), receipts: pick(map.questReceipts, proofs), cube: pick(inventory.questItems, [COW.cubeSource]) });
    const row = before.rows[COW.quest]; if (!row) return 'not-eligible';
    const next = snapshotCountedData({ rows: before.rows, items: before.items, receipts: before.receipts });
    if (kind === 'recover') next.items[COW.legSource] = { itemId: COW.legItemId, state: 'owned' };
    if (kind === 'receive') {
      next.items[COW.tomeSource] = { itemId: COW.tomeItemId, state: 'owned' }; next.receipts[COW.tomeSource] = true;
    }
    if (kind === 'open') {
      next.items[COW.legSource] = { itemId: COW.legItemId, state: 'consumed' };
      next.items[COW.tomeSource] = { itemId: COW.tomeItemId, state: 'consumed' }; next.receipts[COW.openProof] = true;
    }
    const objectives = { ...row.objectives, ...(kind === 'recover' ? { [COW.legObjective]: true } : kind === 'open' ? { [COW.portalObjective]: true } : {}) };
    next.rows[COW.quest] = { ...row, objectives, status: row.status === 'completed' || objectives[COW.legObjective] === true && objectives[COW.portalObjective] === true ? 'completed' : 'inProgress' };
    const context = () => (kind === 'recover' ? fieldReady() : townReady()) && sameCowActor(actor) && sameCowAuthority(authority) &&
      (kind !== 'open' || sameData(pick(useInventoryStore.getState().questItems, [COW.cubeSource]), before.cube));
    const exact = (state: typeof next) => sameData(pick(useMapStore.getState().questProgress, [COW.quest]), state.rows) &&
      sameData(pick(useInventoryStore.getState().questItems, sources), state.items) && sameData(pick(useMapStore.getState().questReceipts, proofs), state.receipts);
    try {
      if (!context()) return 'not-eligible';
      validateQuestItemLedger(replace(inventory.questItems, next.items, sources), replace(map.questProgress, next.rows, [COW.quest]), replace(map.questReceipts, next.receipts, proofs));
    } catch { return 'not-eligible'; }
    try {
      useInventoryStore.setState(state => ({ questItems: replace(state.questItems, snapshotCountedData(next.items), sources) }));
      if (!context() || !exact({ ...next, rows: before.rows, receipts: before.receipts })) throw new Error('Cow ingredient publication changed');
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(next.rows), [COW.quest]),
        questReceipts: replace(state.questReceipts, snapshotCountedData(next.receipts), proofs) }));
      if (!context() || !exact(next)) throw new Error('Cow source publication changed');
      validateLiveCowGraph(); return 'ok';
    } catch (cause) {
      const failures: unknown[] = [], attempt = (operation: () => void) => { try { operation(); } catch (error) { failures.push(error); } };
      attempt(() => { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, snapshotCountedData(before.items), sources) })); });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(before.rows), [COW.quest]),
        questReceipts: replace(state.questReceipts, snapshotCountedData(before.receipts), proofs) })); });
      attempt(() => { if (!exact(before)) throw new Error('Cow scoped source restoration changed'); validateLiveCowGraph(); });
      if (failures.length) throw new AggregateError(failures, 'Cow source restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
export function recoverCowLeg(): RecoverToolResult { const result = execute('recover'); return result === 'already-opened' ? 'already-owned' : result; }
export function receiveCowTome(): CowActionResult { return execute('receive'); }
export function transmuteCowPortal(): CowActionResult { return execute('open'); }
/** Map/town portal availability derives only from the complete consumed graph and absent victory. */
export function canSelectCowEncounter(): boolean {
  try {
    if (!commonLocation()) return false; captureCowAuthority(); validateLiveCowGraph();
    const map = useMapStore.getState(); return isCowAdmissionEligible(map.questProgress, useInventoryStore.getState().questItems, map.questReceipts);
  } catch { return false; }
}
export function canStartCowEncounter(): boolean { return canSelectCowEncounter() && useMapStore.getState().currentSubAreaId === COW.area; }
/** Explicit guarded host travel; the UI navigates only on true, and combat revalidates admission. */
export function travelToCowEncounter(): boolean {
  if (questActionPreflight() !== null || !canSelectCowEncounter()) return false;
  return withQuestTransaction(() => { if (!canSelectCowEncounter()) return false; useMapStore.getState().setCurrentLocation(1, COW.area); return canStartCowEncounter(); }) === true;
}
