import type { WavePlan } from '@/engine/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import { useCombatStore, type RecordedBattleOutcome } from './combatStore';
import { clearIronGolemSelection } from './ironGolemSelectionStore';
import { assertWaveSnapshotAllowed } from './waveTransitionGuard';

/** Internal transient run shape; never persisted or exported through a public barrel. */
export interface ActiveRun {
  readonly plan: WavePlan;
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly seed: number;
  readonly mode: 'manual' | 'idle';
  /** Exact merc unit constructed at run start; roster changes never retarget this run. */
  readonly fieldedMercCombatId?: string;
  playerUnit: CombatUnit;
  /** Index of the wave currently being played (0-based). */
  waveIdx: number;
  /** Ongoing alive player-side units carried between waves. */
  carryPlayerTeam: CombatUnit[];
  /** Actual terminal clock of the current recording, before presentation events. */
  waveElapsedMs: number;
  /** Exact installed recording and original authored boss identity; never persisted. */
  recording?: {
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
  useCombatStore.getState().reset();
  clearIronGolemSelection();
}
