import type { ReplayProfileId } from '@/engine/map/replay-profile';
import { MAX_SIM_MS, runBattleRecorded, type BattleCommandCarry, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { WaveSpec, WavePresentation } from '@/engine/combat';
import type { IronGolemPreparationAttestation } from '@/engine/skills/iron-golem';
import { copyFindItemFinds, type FindItemFind } from '@/engine/skills/find-item';
import type { ActiveRun } from './combatRunLifecycle';
import { stageRecordedBattle, type RecordedBattleDefaults, type RecordedBattlePublication } from './recordedBattlePublication';
import { rememberBattleCommandResult } from './battleCommandCarry';
import { captureOrmusNativeWitness, bindOrmusWitness, type OrmusNativeWitness } from './ormusRunAuthority';
import { captureBountyNativeWitness, bindBountyWitness, type BountyNativeWitness } from './bountyRunAuthority';
import { captureCowNativeWitness, bindCowNativeWitness, type CowNativeWitness } from './cowNativeWitness';

/** Already-composed wave input; run/selection/ownership authority remains with the caller. */
export interface RecordedWaveStagingInput {
  /** Cow native result authority is captured before public callbacks. */
  readonly cowRun?: ActiveRun;
  /** Issued ordinary run; native witness capture remains outside the engine DTO. */
  readonly ormusRun?: ActiveRun;
  /** Accepted bounty run; private proof is captured before display callbacks. */
  readonly bountyRun?: ActiveRun;
  /** Native paid proof stays outside the serializable/cloned engine snapshot. */
  readonly battleCommandCarry?: BattleCommandCarry;
  readonly replayProfileId?: ReplayProfileId;
  readonly snapshot: CombatSnapshot;
  readonly waveIdx: number;
  readonly totalWaves: number;
  readonly subAreaRunId: string;
  readonly defaults: RecordedBattleDefaults;
  readonly chapterBoss?: { readonly unitId: string; readonly archetypeId: string };
  readonly bossIntro?: WaveSpec['bossIntro'];
  readonly wavePresentation?: WavePresentation;
  readonly ironGolemReplayLocked?: boolean;
  readonly resetRunRewards?: boolean;
  readonly resolveDisplayName: (unit: CombatUnit) => string;
}

/** Complete staged result; an attestation alone never authorizes an inventory debit. */
export interface StagedRecordedWave {
  readonly cowNativeWitness?: CowNativeWitness;
  readonly ormusWitness?: OrmusNativeWitness;
  readonly bountyWitness?: BountyNativeWitness;
  readonly engineInput: CombatSnapshot;
  readonly attestation: IronGolemPreparationAttestation | null;
  readonly findItemFinds?: readonly FindItemFind[];
  /** Captured numeric engine result, excluded from public playback. */
  readonly mercPilferGoldFind?: number;
  readonly waveIdx: number;
  readonly elapsedMs: number;
  readonly recording: NonNullable<ActiveRun['recording']>;
  readonly publication: RecordedBattlePublication;
}

/** The combat snapshot is a DTO tree; freeze only its privately cloned objects. */
function freezeOwnedInput(value: unknown): void {
  if (typeof value !== 'object' || value === null) return;
  for (const child of Object.values(value)) freezeOwnedInput(child);
  Object.freeze(value);
}

/**
 * Simulate and normalize one complete wave without store reads or writes.
 * Retain the exact deeply frozen private snapshot supplied to the engine.
 * Structured cloning preserves optional/undefined and nonfinite values; caller
 * units, carry, stats and formation are neither shared nor frozen.
 * The naming callback runs after simulation so newly spawned summons are named;
 * it is not retained. Any simulation, clock, naming or normalization failure
 * reaches the caller before run installation, ordinal changes or item payment.
 */
export function stageRecordedWave(input: RecordedWaveStagingInput): StagedRecordedWave {
  const difficulty = input.replayProfileId ?? 'normal';
  if ((difficulty as unknown) !== 'normal' && (difficulty as unknown) !== 'nightmare' && (difficulty as unknown) !== 'hell') {
    throw new Error('Invalid recorded wave difficulty');
  }
  // The caller's immutable run profile owns gameplay difficulty, never a selected map or supplied snapshot.
  const engineInput = structuredClone({ ...input.snapshot,
    ...(difficulty !== 'normal' || input.snapshot.difficulty !== undefined ? { difficulty } : {}) });
  freezeOwnedInput(engineInput);
  const { events, result, battleCommandCarry } = runBattleRecorded(engineInput, input.battleCommandCarry);
  const cowNativeWitness = input.cowRun ? captureCowNativeWitness(input.cowRun, input.waveIdx, engineInput, result) : undefined;
  const ormusWitness = input.ormusRun ? captureOrmusNativeWitness(input.ormusRun, input.waveIdx, engineInput, result) : undefined;
  const bountyWitness = input.bountyRun ? captureBountyNativeWitness(input.bountyRun, input.waveIdx, engineInput, result) : undefined;
  // Own successful searches before naming callbacks or public playback can observe the result.
  const { findItemFinds: recordedFinds = [] } = result;
  const findItemFinds = copyFindItemFinds(recordedFinds);
  const { mercPilferGoldFind } = result;
  if (mercPilferGoldFind !== undefined && (!Number.isFinite(mercPilferGoldFind) || mercPilferGoldFind < 0)) {
    throw new Error('Invalid native Pilfer find');
  }
  const terminal = events.at(-1);
  if (terminal?.kind !== 'end' || !Number.isFinite(terminal.simClockMs) ||
    terminal.simClockMs < 0 || terminal.simClockMs > MAX_SIM_MS) {
    throw new Error('Recorded battle must end with a valid terminal simulation clock');
  }
  rememberBattleCommandResult(result.playerTeam, terminal.simClockMs, battleCommandCarry);
  const unitMap = new Map<string, string>();
  for (const unit of [...result.playerTeam, ...result.enemyTeam]) {
    unitMap.set(unit.id, input.resolveDisplayName(unit));
  }
  const enemy = engineInput.enemyTeam[0];
  const playbackEvents: readonly RecordedBattleEvent[] = input.bossIntro
    ? [{ kind: 'message', messageKey: 'combat:bossIntro',
        params: { boss: unitMap.get(enemy?.id ?? '') ?? enemy?.name ?? input.bossIntro.bossArchetypeId },
        simClockMs: 0, uiDelayMs: 1200 }, ...events]
    : events;
  const outcome = { winner: result.winner,
    finalPlayerTeam: result.playerTeam, finalEnemyTeam: result.enemyTeam };
  const publication = stageRecordedBattle({
    initialPlayerTeam: engineInput.playerTeam,
    initialEnemyTeam: engineInput.enemyTeam,
    events: playbackEvents, unitNameMap: unitMap, outcome,
    currentWave: input.waveIdx + 1, totalWaves: input.totalWaves, subAreaRunId: input.subAreaRunId,
    ...(input.resetRunRewards !== undefined ? { resetRunRewards: input.resetRunRewards } : {}),
    ...(input.ironGolemReplayLocked !== undefined ? { ironGolemReplayLocked: input.ironGolemReplayLocked } : {}),
    ...(input.wavePresentation ? { wavePresentation: input.wavePresentation } : {})
  }, input.defaults);
  const recording = Object.freeze({ outcome, events: playbackEvents,
    ...(input.replayProfileId ? { replayProfileId: input.replayProfileId } : {}),
    ...(input.chapterBoss ? { chapterBoss: Object.freeze({ ...input.chapterBoss }) } : {}) });
  if (ormusWitness) bindOrmusWitness(ormusWitness, recording);
  if (bountyWitness) bindBountyWitness(bountyWitness, recording);
  if (cowNativeWitness) bindCowNativeWitness(cowNativeWitness, recording);
  return Object.freeze({ engineInput, attestation: result.ironGolemPreparation ?? null,
    ...(cowNativeWitness ? { cowNativeWitness } : {}),
    ...(ormusWitness ? { ormusWitness } : {}),
    ...(bountyWitness ? { bountyWitness } : {}),
    ...(findItemFinds.length > 0 ? { findItemFinds } : {}),
    ...(mercPilferGoldFind !== undefined ? { mercPilferGoldFind } : {}),
    waveIdx: input.waveIdx, elapsedMs: terminal.simClockMs, publication,
    recording });
}
