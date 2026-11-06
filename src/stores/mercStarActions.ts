import { loadMercPool } from '@/data/loaders/mercs';
import { planStarUpgrade } from '@/engine/gacha/recruitment-state';
import { useMercStore } from './mercStore';
import { usePlayerStore } from './playerStore';
import { useCombatStore } from './combatStore';
import { useHydrationStore } from './hydrationStore';
import { hasActiveSubAreaRun } from './combatHelpers';
import { assertRecordedWaveNewTransitionAllowed } from './recordedWaveAccess';
import { beginMaterialTransaction, endMaterialTransaction, WaveGuardError } from './waveTransitionGuard';
import { blockSavesForRecovery, isReplacingSave, resumeWaveDeferredSave } from './persistence';

/** Spend one canonical shard balance under the material lease; natural actors remain unchanged. */
export function executeMercStarUpgrade(mercId: string): boolean {
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave() ||
    !usePlayerStore.getState().player || useCombatStore.getState().inCombat || hasActiveSubAreaRun()) return false;
  let lease: ReturnType<typeof beginMaterialTransaction>;
  try { assertRecordedWaveNewTransitionAllowed(); lease = beginMaterialTransaction(true); }
  catch (error) { if (error instanceof WaveGuardError) return false; throw error; }
  try {
    const before = useMercStore.getState();
    const merc = before.ownedMercs.find(candidate => candidate.id === mercId);
    if (!merc) return false;
    const recruitmentProgress = planStarUpgrade(loadMercPool().banner, before.recruitmentProgress, merc.id.split('#')[0] ?? merc.id);
    if (!recruitmentProgress) return false;
    const unchanged = (state: typeof before): boolean => Object.keys(before).every(key =>
      key === 'recruitmentProgress' || state[key as keyof typeof before] === before[key as keyof typeof before]);
    try {
      useMercStore.setState({ recruitmentProgress });
      const after = useMercStore.getState();
      if (after.recruitmentProgress !== recruitmentProgress || !unchanged(after)) throw new Error('Incomplete star publication');
      return true;
    } catch (cause) {
      const errors: unknown[] = [];
      try { useMercStore.setState(before); } catch (error) { errors.push(error); }
      const restored = useMercStore.getState();
      if (restored.recruitmentProgress !== before.recruitmentProgress || !unchanged(restored)) errors.push(new Error('Incomplete star rollback'));
      if (errors.length) { blockSavesForRecovery(); throw new AggregateError(errors, 'Star restoration failed', { cause }); }
      return false;
    }
  } finally { if (endMaterialTransaction(lease)) resumeWaveDeferredSave(); }
}
