import type { WavePlan } from '@/engine/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import { useCombatStore, type RecordedBattleOutcome } from './combatStore';
import { clearIronGolemSelection, clearIronGolemSelectionAfterRestore } from './ironGolemSelectionStore';
import { assertWaveRestoreOwner, assertWaveSnapshotAllowed, type WaveRestoreLease } from './waveTransitionGuard';
import { abandonRecordedWaves, clearRecordedWavesAfterRestore } from './recordedWaveReceipt';

/** Internal transient run shape; never persisted or exported through a public barrel. */
export interface ActiveRun {
  readonly replayProfileId?: 'normal' | 'nightmare';
  readonly plan: WavePlan;
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly seed: number;
  readonly mode: 'manual' | 'idle';
  /** Explicit new actual encounter for historical Khalim recovery; never inferred from flags. */
  readonly questRecovery?: 'khalims-council';
  /** Exact merc unit constructed at run start; roster changes never retarget this run. */
  readonly fieldedMercCombatId?: string;
  /** Separate bare run-start snapshot, used only if the original roster owner disappears. */
  readonly fieldedMercBareUnit?: Readonly<CombatUnit>;
  playerUnit: CombatUnit;
  /** Index of the wave currently being played (0-based). */
  waveIdx: number;
  /** Ongoing alive player-side units carried between waves. */
  carryPlayerTeam: CombatUnit[];
  /** Actual terminal clock of the current recording, before presentation events. */
  waveElapsedMs: number;
  /** Exact installed recording and original authored boss identity; never persisted. */
  recording?: {
    readonly replayProfileId?: 'normal' | 'nightmare';
    readonly outcome: RecordedBattleOutcome;
    readonly events: readonly RecordedBattleEvent[];
    readonly chapterBoss?: { readonly unitId: string; readonly archetypeId: string };
  };
}

/** Internal single run holder, shared only with combatHelpers for direct lifecycle ownership. */
export const combatRunLifecycle: { activeRun: ActiveRun | null } = { activeRun: null };

/**
 * Discard run, recording and selection before a public hero replacement publishes.
 * Throws WaveGuardError before any change during wave or restore ownership.
 */
export function clearCombatForHeroReplacement(): void {
  assertWaveSnapshotAllowed();
  combatRunLifecycle.activeRun = null;
  abandonRecordedWaves();
  useCombatStore.getState().reset();
  clearIronGolemSelection();
}

/**
 * Abandon process-local combat only after a validated restore/deletion succeeds.
 * The caller retains its restore reservation throughout installation. An invalid
 * or released lease throws WaveGuardError before any transient state changes.
 */
export function clearCombatAfterRestore(lease: WaveRestoreLease): void {
  assertWaveRestoreOwner(lease);
  combatRunLifecycle.activeRun = null;
  clearRecordedWavesAfterRestore(lease);
  useCombatStore.getState().reset();
  clearIronGolemSelectionAfterRestore(lease);
}
