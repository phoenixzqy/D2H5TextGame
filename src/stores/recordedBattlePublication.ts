import type { WavePresentation } from '@/engine/combat';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import { withDefaultGridPositions } from '@/engine/combat/grid';
import type { CombatUnit } from '@/engine/combat/types';
import type { KillRewards } from '@/engine/loot/award';
import type { CombatLogEntry, RecordedBattleOutcome, UnitNameMap } from './combatStore';

/** Existing recorded-battle input; omitted wave/run values retain captured defaults. */
export interface RecordedBattleInput {
  readonly initialPlayerTeam: readonly CombatUnit[];
  readonly initialEnemyTeam: readonly CombatUnit[];
  readonly events: readonly RecordedBattleEvent[];
  readonly unitNameMap: UnitNameMap;
  readonly outcome: RecordedBattleOutcome;
  /** 1-based wave index; defaults to the current value at staging. */
  readonly currentWave?: number;
  /** Total wave count; defaults to the current value at staging. */
  readonly totalWaves?: number;
  /** Omission retains the current run; explicit null clears it. */
  readonly subAreaRunId?: string | null;
  readonly wavePresentation?: WavePresentation;
  /** Captured once for this recording; omission starts an unlocked recording. */
  readonly ironGolemReplayLocked?: boolean;
  /** Stage new empty run rewards for the same atomic recording publication. */
  readonly resetRunRewards?: boolean;
}

/** The only existing state values consulted when staging a recording. */
export interface RecordedBattleDefaults {
  readonly currentWave: number;
  readonly totalWaves: number;
  readonly subAreaRunId: string | null;
  readonly runRewards: KillRewards;
}

/**
 * Complete publication fields, ready for one store update without allocation.
 * Owned team/log arrays follow the store's immutable-update convention. Caller
 * units, events, names and outcome are shared, never frozen or mutated by staging.
 * Lock and reward baseline are captured here; receipt/run ownership and stale
 * publication prevention remain the installer's caller obligations.
 */
export interface RecordedBattlePublication {
  readonly inCombat: true;
  readonly playerTeam: CombatUnit[];
  readonly enemyTeam: CombatUnit[];
  readonly recordedEvents: readonly RecordedBattleEvent[];
  readonly eventCursor: 0;
  readonly playbackComplete: boolean;
  readonly log: CombatLogEntry[];
  readonly currentTurn: 0;
  readonly isPaused: false;
  readonly unitNameMap: UnitNameMap;
  readonly outcome: RecordedBattleOutcome;
  readonly currentWave: number;
  readonly totalWaves: number;
  readonly currentWavePresentation: WavePresentation | null;
  readonly subAreaRunId: string | null;
  readonly runVictory: false;
  readonly runDefeat: false;
  readonly ironGolemReplayLocked: boolean;
  readonly runRewards: KillRewards;
}

/**
 * Normalize initial teams and capture defaults before any publication side effect.
 * May throw during normalization; it performs no store writes. The resulting
 * wrapper is frozen, while shared caller data retains its original ownership.
 */
export function stageRecordedBattle(
  input: RecordedBattleInput,
  defaults: RecordedBattleDefaults
): RecordedBattlePublication {
  return Object.freeze({
    inCombat: true,
    playerTeam: withDefaultGridPositions(input.initialPlayerTeam),
    enemyTeam: withDefaultGridPositions(input.initialEnemyTeam),
    recordedEvents: input.events,
    eventCursor: 0,
    playbackComplete: input.events.length === 0,
    log: [],
    currentTurn: 0,
    isPaused: false,
    unitNameMap: input.unitNameMap,
    outcome: input.outcome,
    currentWave: input.currentWave ?? defaults.currentWave,
    totalWaves: input.totalWaves ?? defaults.totalWaves,
    currentWavePresentation: input.wavePresentation ?? null,
    subAreaRunId: input.subAreaRunId === undefined ? defaults.subAreaRunId : input.subAreaRunId,
    runVictory: false,
    runDefeat: false,
    ironGolemReplayLocked: input.ironGolemReplayLocked ?? false,
    runRewards: input.resetRunRewards
      ? { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0 }
      : defaults.runRewards
  });
}
