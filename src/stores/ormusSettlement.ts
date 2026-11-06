import { ORMUS, hasOrmusClear } from '@/engine/map/ormus-quest';
import { validateQuestActionReceipts } from '@/engine/save/validate';
import { pick, replace, sameCainData as sameData } from '@/features/quests/cainPublication';
import { captureOrmusAuthorityRollback, prepareOrmusAdvance } from './ormusRunAuthority';
import { combatRunLifecycle, type ActiveRun } from './combatRunLifecycle';
import type { RecordedWaveBinding } from './recordedWaveReceipt';
import { useMapStore } from './mapStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useCombatStore } from './combatStore';
import { useHydrationStore } from './hydrationStore';

/** Own participating values before callbacks; unrelated journal writes survive restoration. */
export function captureOrmusSettlementRollback(run: ActiveRun, binding: RecordedWaveBinding): () => void {
  if (!binding.ormusWitness) return () => undefined;
  const map = useMapStore.getState(), original = map.questProgress[ORMUS.quest];
  const before = structuredClone({ rows: pick(map.questProgress, [ORMUS.quest]), proofs: pick(map.questReceipts, [ORMUS.proof]) });
  const restoreAuthority = captureOrmusAuthorityRollback(run);
  return () => {
    const errors: unknown[] = [];
    const attempt = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
    attempt(restoreAuthority);
    // Keep the issued row identity when an observer has mutated its owned values.
    attempt(() => {
      const saved = before.rows[ORMUS.quest];
      if (!original || !saved || sameData(original, saved)) return;
      for (const key of Reflect.ownKeys(original)) {
        if (!Object.hasOwn(saved, key) && !Reflect.deleteProperty(original, key)) throw new Error('Ormus row restoration failed');
      }
      Object.defineProperties(original, Object.getOwnPropertyDescriptors(structuredClone(saved)));
    });
    attempt(() => {
      const current = useMapStore.getState();
      const rows = original && sameData(original, before.rows[ORMUS.quest]) ? { [ORMUS.quest]: original } : structuredClone(before.rows);
      useMapStore.setState({ questProgress: replace(current.questProgress, rows, [ORMUS.quest]),
        questReceipts: replace(current.questReceipts, structuredClone(before.proofs), [ORMUS.proof]) });
    });
    attempt(() => {
      const current = useMapStore.getState();
      if (!sameData(pick(current.questProgress, [ORMUS.quest]), before.rows) ||
        !sameData(pick(current.questReceipts, [ORMUS.proof]), before.proofs)) throw new Error('Ormus restoration postcondition failed');
    });
    if (errors.length) throw new AggregateError(errors, 'Ormus settlement restoration failed');
  };
}

/** Prepare before income; the accepted settlement alone advances the consecutive native sequence. */
export function prepareOrmusSettlement(binding: RecordedWaveBinding): { readonly publishVictory: () => void } | undefined {
  const map = useMapStore.getState(), advance = prepareOrmusAdvance(binding, map.questProgress, map.questReceipts);
  if (!advance) return undefined;
  const run = binding.candidateRun;
  const checkContext = () => {
    const combat = useCombatStore.getState();
    if (useHydrationStore.getState().status !== 'ready' || combatRunLifecycle.activeRun !== run ||
      usePlayerStore.getState().player?.id !== binding.heroId || run.origin !== binding.origin ||
      run.playerUnit.id !== binding.heroId || run.waveIdx !== binding.targetWaveIdx || run.recording !== binding.recording ||
      combat.outcome !== binding.recording.outcome || combat.recordedEvents !== binding.recording.events ||
      combat.currentWave !== binding.publication.currentWave || combat.totalWaves !== binding.publication.totalWaves ||
      combat.subAreaRunId !== binding.publication.subAreaRunId || !combat.playbackComplete) {
      throw new Error('Ormus settlement authority changed');
    }
  };
  return { publishVictory: () => {
    checkContext();
    const live = useMapStore.getState();
    if (!prepareOrmusAdvance(binding, live.questProgress, live.questReceipts)) throw new Error('Ormus quest changed during settlement');
    const row = { ...structuredClone(advance.row), status: 'inProgress' as const,
      objectives: { ...structuredClone(advance.row.objectives), [ORMUS.first]: true, [ORMUS.talk]: false } };
    if (advance.final) validateQuestActionReceipts({ ...live.questReceipts, [ORMUS.proof]: true },
      { ...live.questProgress, [ORMUS.quest]: row }, useInventoryStore.getState().questItems);
    advance.commit();
    if (!advance.final) return;
    useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [ORMUS.quest]: structuredClone(row) },
      questReceipts: { ...state.questReceipts, [ORMUS.proof]: true } }));
    checkContext();
    advance.checkCommitted();
    const published = useMapStore.getState();
    if (!Object.hasOwn(published.questProgress, ORMUS.quest) || !sameData(published.questProgress[ORMUS.quest], row) ||
      !hasOrmusClear(published.questProgress, published.questReceipts)) throw new Error('Ormus publication postcondition failed');
    validateQuestActionReceipts(published.questReceipts, published.questProgress, useInventoryStore.getState().questItems);
  } };
}
