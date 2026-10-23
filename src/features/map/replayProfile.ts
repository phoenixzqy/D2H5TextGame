import { NIGHTMARE_UNLOCK, validateAct5CampaignRewards } from '@/engine/save/act5-campaign';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { questActionPreflight, withQuestTransaction } from '@/features/quests/questTransaction';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { WaveGuardError } from '@/stores/waveTransitionGuard';

export type ReplayProfileResult = 'ok' | 'not-owned' | 'not-ready' | 'no-player'
  | 'combat-active' | 'claim-in-progress' | 'grant-failed';

/**
 * Select Normal freely or an actually earned Nightmare entitlement between runs.
 * Snapshot/restore exclusion spans publication and every rollback attempt. Only
 * the selected profile participates, so unrelated observer writes are preserved.
 */
export function selectReplayProfile(profile: 'normal' | 'nightmare'): ReplayProfileResult {
  try {
    const refusal = questActionPreflight();
    if (refusal) return refusal;
    const recording = inspectRecordedWaves();
    if (recording.pending) return 'combat-active';
    if (recording.currentPublished &&
      recording.currentPublished.installation?.settlement.progress.phase !== 'settled') return 'combat-active';
    return withQuestTransaction<ReplayProfileResult>(() => {
      // The exported TS union is not a runtime trust boundary.
      const candidate: unknown = profile;
      if (candidate !== 'normal' && candidate !== 'nightmare') return 'not-owned';
      const map = useMapStore.getState(), inventory = useInventoryStore.getState();
      try {
        validateQuestItemLedger(inventory.questItems, map.questProgress, map.questReceipts);
        validateAct5CampaignRewards(map, inventory.questItems, inventory.questServices);
        validateAct5CampaignRewards({ ...map, selectedDifficulty: profile }, inventory.questItems, inventory.questServices);
      } catch { return 'not-owned'; }
      if (profile === 'nightmare' && (!Object.hasOwn(map.questDifficulties, NIGHTMARE_UNLOCK) ||
        map.questDifficulties[NIGHTMARE_UNLOCK] !== true)) return 'not-owned';
      if (profile === map.selectedDifficulty) return 'ok';
      try {
        useMapStore.setState({ selectedDifficulty: profile });
        return 'ok';
      } catch (cause) {
        try { useMapStore.setState({ selectedDifficulty: map.selectedDifficulty }); }
        catch (error) { throw new AggregateError([error], 'Replay profile restoration failed', { cause }); }
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
