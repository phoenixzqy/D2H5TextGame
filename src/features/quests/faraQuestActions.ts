import { FARA, FARA_DOMAIN, hasFaraTalkEligibility, hasFaraTalkProof } from '@/engine/map/fara-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { pick } from './cainPublication';
import { replaceCountedDataKeys as replace, sameCountedData as sameData, snapshotCountedData } from './countedQuestContract';
import { captureFaraAuthority, faraOrdinaryReady, sameFaraActor, sameFaraAuthority, validateLiveFaraGraph } from './faraContract';
import { questActionPreflight, withQuestTransaction } from './questTransaction';

export type FaraTalkResult = 'ok' | 'already-talked' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress' | 'grant-failed';
function townReady(): boolean {
  const map = useMapStore.getState();
  return faraOrdinaryReady() && map.currentAct === 2 && map.isActUnlocked(2);
}
/** Only explicit actual Fara Talk publishes this side row and its retained true receipt together. */
export function talkToFara(): FaraTalkResult {
  const refusal = questActionPreflight(); if (refusal) return refusal;
  return withQuestTransaction<FaraTalkResult>(() => {
    let authority: ReturnType<typeof captureFaraAuthority>;
    try { authority = captureFaraAuthority(); validateLiveFaraGraph(); } catch { return 'not-eligible'; }
    if (!townReady()) return 'not-eligible';
    const map = useMapStore.getState(), hero = usePlayerStore.getState().player;
    if (!hero) return 'no-player';
    if (hasFaraTalkProof(map.questProgress, map.questReceipts, FARA_DOMAIN)) return 'already-talked';
    if (!hasFaraTalkEligibility(map.questProgress, FARA_DOMAIN)) return 'not-eligible';
    const actor = { hero, id: hero.id }, before = snapshotCountedData({ rows: pick(map.questProgress, [FARA.quest]), receipts: pick(map.questReceipts, [FARA.proof]) });
    const row = before.rows[FARA.quest]; if (!row) return 'not-eligible';
    const next = { rows: { [FARA.quest]: { ...row, status: 'completed' as const, objectives: { [FARA.objective]: true } } }, receipts: { [FARA.proof]: true as const } };
    const context = () => townReady() && sameFaraActor(actor) && sameFaraAuthority(authority);
    const exact = (state: typeof before) => sameData(pick(useMapStore.getState().questProgress, [FARA.quest]), state.rows) &&
      sameData(pick(useMapStore.getState().questReceipts, [FARA.proof]), state.receipts);
    try {
      if (!context()) return 'not-eligible';
      validateQuestItemLedger(useInventoryStore.getState().questItems, replace(map.questProgress, next.rows, [FARA.quest]), replace(map.questReceipts, next.receipts, [FARA.proof]));
    } catch { return 'not-eligible'; }
    try {
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(next.rows), [FARA.quest]),
        questReceipts: replace(state.questReceipts, next.receipts, [FARA.proof]) }));
      if (!context() || !exact(next)) throw new Error('Fara Talk publication changed');
      validateLiveFaraGraph(); return 'ok';
    } catch (cause) {
      const failures: unknown[] = [];
      try { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(before.rows), [FARA.quest]),
        questReceipts: replace(state.questReceipts, snapshotCountedData(before.receipts), [FARA.proof]) })); } catch (error) { failures.push(error); }
      try { if (!exact(before)) throw new Error('Fara Talk restoration changed'); validateLiveFaraGraph(); } catch (error) { failures.push(error); }
      if (failures.length) throw new AggregateError(failures, 'Fara Talk scoped restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
