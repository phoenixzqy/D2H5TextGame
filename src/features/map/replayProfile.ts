import type { ReplayProfileId } from '@/engine/map/replay-profile';
import { hasReplayProfileAuthority } from '@/engine/map/replay-profile-authority';
import { questActionPreflight, withQuestTransaction } from '@/features/quests/questTransaction';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { blockSavesForRecovery } from '@/stores/persistence';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { WaveGuardError } from '@/stores/waveTransitionGuard';

export type ReplayProfileResult = 'ok' | 'not-owned' | 'not-ready' | 'no-player'
  | 'combat-active' | 'claim-in-progress' | 'grant-failed';

/** Advisory source authority only; the selecting transaction rechecks live readiness and ownership. */
export function canSelectReplayProfile(profile: ReplayProfileId): boolean {
  const map = useMapStore.getState(), inventory = useInventoryStore.getState();
  return hasReplayProfileAuthority(profile, map, inventory.questItems, inventory.questServices, map.endgame);
}

/**
 * Select an authorized replay profile between runs without granting rewards.
 * Snapshot/restore exclusion spans publication and every rollback attempt. Only
 * the selected profile participates, so unrelated observer writes are preserved.
 */
export function selectReplayProfile(profile: ReplayProfileId): ReplayProfileResult {
  try {
    const refusal = questActionPreflight();
    if (refusal) return refusal;
    const recording = inspectRecordedWaves();
    if (recording.pending) return 'combat-active';
    if (recording.currentPublished &&
      recording.currentPublished.installation?.settlement.progress.phase !== 'settled') return 'combat-active';
    return withQuestTransaction<ReplayProfileResult>(() => {
      // The shared authority rejects foreign runtime input and validates both current and candidate graphs.
      const map = useMapStore.getState(), inventory = useInventoryStore.getState();
      if (!hasReplayProfileAuthority(profile, map, inventory.questItems, inventory.questServices, map.endgame)) return 'not-owned';
      const previous = map.selectedDifficulty;
      if (profile === previous) return 'ok';
      try {
        useMapStore.setState({ selectedDifficulty: profile });
        if (useMapStore.getState().selectedDifficulty !== profile || !canSelectReplayProfile(profile)) {
          throw new Error('Replay profile publication could not be verified');
        }
        return 'ok';
      } catch (cause) {
        const errors: unknown[] = [];
        try { useMapStore.setState({ selectedDifficulty: previous }); }
        catch (error) { errors.push(error); }
        try {
          if (useMapStore.getState().selectedDifficulty !== previous || !canSelectReplayProfile(previous)) {
            throw new Error('Replay profile restoration could not be verified');
          }
        } catch (error) { errors.push(error); }
        if (errors.length > 0) {
          // Block before the transaction finally can resume a deferred save.
          try { blockSavesForRecovery(); } catch (error) { errors.push(error); }
          throw new AggregateError(errors, 'Replay profile restoration failed', { cause });
        }
        return 'grant-failed';
      }
    });
  } catch (error) {
    if (error instanceof RecordedWaveAccessError) return 'combat-active';
    if (error instanceof WaveGuardError) {
      if (error.code === 'questBusy') return 'claim-in-progress';
      if (error.code === 'restorePending' || error.code === 'hydrationNotReady') return 'not-ready';
      return 'combat-active';
    }
    throw error;
  }
}
