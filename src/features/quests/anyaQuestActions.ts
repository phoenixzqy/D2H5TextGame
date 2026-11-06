import { ANYA, ANYA_DOMAIN, hasAnyaTalkEligibility, hasAnyaTalkProof } from '@/engine/map/anya-quest';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { pick } from './cainPublication';
import { replaceCountedDataKeys as replace, sameCountedData as sameData, snapshotCountedData } from './countedQuestContract';
import { anyaTownReady, captureAnyaAuthority, sameAnyaActor, sameAnyaAuthority, validateAnyaState, validateLiveAnyaGraph } from './anyaContract';
import { questActionPreflight, withQuestTransaction } from './questTransaction';

export type AnyaTalkResult = 'ok' | 'already-talked' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress' | 'grant-failed';
/** Actual Anya Talk owns only its completed side row and exact retained receipt; it pays nothing. */
export function talkToAnya(): AnyaTalkResult {
  const refusal = questActionPreflight(); if (refusal) return refusal;
  return withQuestTransaction<AnyaTalkResult>(() => {
    let authority: ReturnType<typeof captureAnyaAuthority>;
    try { authority = captureAnyaAuthority(); validateLiveAnyaGraph(); } catch { return 'not-eligible'; }
    if (!anyaTownReady()) return 'not-eligible';
    const map = useMapStore.getState(), inv = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
    if (!hero) return 'no-player';
    if (hasAnyaTalkProof(map.questProgress, inv.questItems, map.questReceipts, ANYA_DOMAIN)) return 'already-talked';
    if (!hasAnyaTalkEligibility(map.questProgress, inv.questItems, map.questReceipts, ANYA_DOMAIN)) return 'not-eligible';
    const actor = { hero, id: hero.id }, before = snapshotCountedData({ rows: pick(map.questProgress, [ANYA.quest]), receipts: pick(map.questReceipts, [ANYA.proof]) });
    const row = before.rows[ANYA.quest]; if (!row) return 'not-eligible';
    const next = { rows: { [ANYA.quest]: { ...row, status: 'completed' as const, objectives: { [ANYA.objective]: true } } }, receipts: { [ANYA.proof]: true as const } };
    const context = () => anyaTownReady() && sameAnyaActor(actor) && sameAnyaAuthority(authority);
    const exact = (state: typeof before) => sameData(pick(useMapStore.getState().questProgress, [ANYA.quest]), state.rows) &&
      sameData(pick(useMapStore.getState().questReceipts, [ANYA.proof]), state.receipts);
    const shadow = () => {
      const current = useMapStore.getState(), inventory = useInventoryStore.getState();
      validateAnyaState(replace(current.questProgress, next.rows, [ANYA.quest]), inventory.questItems,
        replace(current.questReceipts, next.receipts, [ANYA.proof]), inventory.questServices);
    };
    try { if (!context()) return 'not-eligible'; shadow(); } catch { return 'not-eligible'; }
    try {
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(next.rows), [ANYA.quest]),
        questReceipts: replace(state.questReceipts, next.receipts, [ANYA.proof]) }));
      if (!context() || !exact(next)) throw new Error('Anya Talk publication changed');
      validateLiveAnyaGraph(); return 'ok';
    } catch (cause) {
      const failures: unknown[] = [];
      try { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(before.rows), [ANYA.quest]),
        questReceipts: replace(state.questReceipts, snapshotCountedData(before.receipts), [ANYA.proof]) })); } catch (error) { failures.push(error); }
      try { if (!exact(before)) throw new Error('Anya Talk restoration changed'); validateLiveAnyaGraph(); } catch (error) { failures.push(error); }
      if (failures.length) throw new AggregateError(failures, 'Anya Talk scoped restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
