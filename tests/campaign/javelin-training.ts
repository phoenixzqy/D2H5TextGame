import assert from 'node:assert/strict';
import { MAX_SIM_MS } from '@/engine/combat/combat';
import { levelForXp, xpTotal } from '@/engine/progression/xp';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { equipCampaignGear, type CampaignRecord } from './actions';
import type { CampaignProfile, CampaignWave } from './policy';
import { CampaignStop } from './route';
import type { CampaignPreparation } from './preparation';
import { trainCampaignBuild, type CampaignTrainingProgress } from './training';
import { auditCampaignTraining } from './training-audit';
import { javelinTrainingRequest, javelinTrainingStages, javelinAcquisitionRequest } from './javelin-progression';

export interface JavelinTrainingCheckpoint extends Omit<CampaignPreparation, 'nextAct' | 'request'> {
  readonly entryAct: number;
  readonly entryArea: string;
  readonly request: NonNullable<ReturnType<typeof javelinTrainingRequest>>;
  readonly startCombatMs: number;
  terminalCombatMs: number;
}

/** Native earned training; entry-owned gear skips only redundant post-attempt selection. */
export function prepareJavelinTraining(profile: CampaignProfile, act: number, area: string,
  record: CampaignRecord, enter: (act: number, area: string, phase: 'farm') => void,
  retain: (checkpoint: JavelinTrainingCheckpoint) => void, combatMs: () => number,
  gearPreparedOnEntry = false): void {
  const request = javelinTrainingRequest(act, area);
  if (!request) return;
  runJavelinTraining(profile, act, area, request, record, enter, retain, combatMs, gearPreparedOnEntry);
}

/** Continue an authenticated settled stage using its original counters, request and combat-clock origin. */
export function resumeJavelinTraining(profile: CampaignProfile, previous: JavelinTrainingCheckpoint,
  waves: readonly CampaignWave[], record: CampaignRecord,
  enter: (act: number, area: string, phase: 'farm') => void,
  retain: (checkpoint: JavelinTrainingCheckpoint) => void, combatMs: () => number,
  gearPreparedOnEntry = false): void {
  assert.deepEqual(previous.request, javelinTrainingRequest(previous.entryAct, previous.entryArea),
    'Resume training policy mismatch');
  assert.ok(previous.failureStatus !== null, 'Resume requires an interrupted training checkpoint');
  const audit = auditJavelinInterval(previous, waves);
  let consecutiveNonwins = 0;
  for (let ordinal = previous.nextOrdinal - 1; ordinal >= previous.startOrdinal; ordinal--) {
    const last = waves.filter(row => row.ordinal === ordinal).at(-1); assert.ok(last);
    assert.ok(last.advance === 'victory' || last.advance === 'defeat', 'Resume requires settled historical admissions');
    if (last.outcome === 'victory') break;
    consecutiveNonwins++;
  }
  // Every earlier admission must also be terminal, including one before the trailing streak.
  for (let ordinal = previous.startOrdinal; ordinal < previous.nextOrdinal; ordinal++) {
    const last = waves.filter(row => row.ordinal === ordinal).at(-1); assert.ok(last);
    assert.ok(last.advance === 'victory' || last.advance === 'defeat', 'Resume requires settled historical admissions');
  }
  const map = useMapStore.getState(), player = usePlayerStore.getState().player; assert.ok(player);
  assert.equal(map.challengeOrdinals.normal, previous.nextOrdinal, 'Resume training ordinal mismatch');
  assert.equal(xpTotal(player.level) + player.experience, previous.terminalXp, 'Resume training XP mismatch');
  assert.ok(Math.abs(combatMs() - previous.terminalCombatMs) <= 1e-6, 'Resume training clock mismatch');
  assert.ok(map.clearedSubAreas.includes(previous.request.area), 'Resume requires an actually cleared farm');
  const progress: CampaignTrainingProgress = { fromLevel: levelForXp(previous.fromXp), admissions: audit.admissions,
    nonwins: audit.nonwinOrdinals.length, wins: audit.admissions - audit.nonwinOrdinals.length,
    consecutiveNonwins, lastAttempt: audit.admissions === 0 ? null : consecutiveNonwins ? 'nonwin' : 'victory' };
  runJavelinTraining(profile, previous.entryAct, previous.entryArea, previous.request, record, enter, retain,
    combatMs, gearPreparedOnEntry, { checkpoint: previous, progress });
}

/** Separate opening custody keeps later-stage order and failed farm admissions observable. */
export function prepareJavelinAcquisition(profile: CampaignProfile, record: CampaignRecord,
  enter: (act: number, area: string, phase: 'farm') => void,
  retain: (checkpoint: JavelinTrainingCheckpoint) => void, combatMs: () => number): void {
  const map = useMapStore.getState();
  assert.equal(map.questProgress['quests/act1-den-of-evil']?.rewardClaimed, true,
    'Javelin acquisition requires the claimed Den');
  assert.ok(map.clearedSubAreas.includes('areas/act1-blood-moor'), 'Javelin acquisition requires cleared Blood Moor');
  runJavelinTraining(profile, 1, 'areas/act1-den-of-evil', javelinAcquisitionRequest(),
    record, enter, retain, combatMs);
}

function runJavelinTraining(profile: CampaignProfile, act: number, area: string,
  request: JavelinTrainingCheckpoint['request'], record: CampaignRecord,
  enter: (act: number, area: string, phase: 'farm') => void,
  retain: (checkpoint: JavelinTrainingCheckpoint) => void, combatMs: () => number,
  gearPreparedOnEntry = false,
  resumed?: { checkpoint: JavelinTrainingCheckpoint; progress: CampaignTrainingProgress }): void {
  assert.equal(profile.progressionPolicy, 'javelin-earned-v1');
  const map = useMapStore.getState(), player = usePlayerStore.getState().player; assert.ok(player);
  assert.ok(map.isActUnlocked(act) && map.isActUnlocked(request.act), 'Javelin training act locked');
  const trainingArea = resolveSubArea(request.act, request.area);
  assert.ok(trainingArea?.actId === `acts/act${String(request.act)}` && trainingArea.waves.length > 0);
  if (request.act === 3) assert.ok(map.clearedSubAreas.includes(request.area),
    'Javelin preparation requires a cleared farm');
  // Ordinary manual planning uses authored templates (or at most five fallback
  // templates), then at most one boss. None of the training areas is the
  // special quest-projected Throne. Reserve the conservative upper bound.
  const reserveMs = (Math.max(5, trainingArea.waves.length) + 1) * MAX_SIM_MS;
  const checkpoint: JavelinTrainingCheckpoint = { ...(resumed?.checkpoint ?? { entryAct: act, entryArea: area, request,
    startOrdinal: map.challengeOrdinals.normal, nextOrdinal: map.challengeOrdinals.normal,
    fromXp: xpTotal(player.level) + player.experience, terminalXp: xpTotal(player.level) + player.experience,
    startCombatMs: combatMs(), terminalCombatMs: combatMs() }), result: null, failure: null, failureStatus: null };
  retain(checkpoint);
  try {
    record({ kind: 'javelin-training-boundary', act, area, request, reserveMs, gearPreparedOnEntry,
      startOrdinal: checkpoint.startOrdinal, startCombatMs: checkpoint.startCombatMs });
    checkpoint.result = trainCampaignBuild(profile, request, record, (training, phase) => {
      const consumed = combatMs() - checkpoint.startCombatMs;
      assert.ok(Number.isFinite(consumed) && consumed >= 0, 'Invalid Javelin training clock');
      if (consumed + reserveMs > request.maxCombatMs)
        throw new CampaignStop('budget', 'Javelin training whole-area combat budget reached');
      enter(request.act, training, phase);
      assert.ok(combatMs() - checkpoint.startCombatMs <= request.maxCombatMs, 'Javelin combat budget exceeded');
    }, gearPreparedOnEntry ? undefined : () => { equipCampaignGear(record, profile); }, resumed?.progress);
    if (checkpoint.result.status !== 'target-earned')
      throw new CampaignStop(checkpoint.result.status === 'retry-limit' ? 'nonwin' : 'budget',
        `Javelin training ${checkpoint.result.status} before ${area}`);
    equipCampaignGear(record, profile);
  } catch (error) {
    checkpoint.failure = String(error);
    checkpoint.failureStatus = error instanceof CampaignStop ? error.status : 'technical';
    throw error;
  } finally {
    checkpoint.nextOrdinal = useMapStore.getState().challengeOrdinals.normal;
    const terminal = usePlayerStore.getState().player; assert.ok(terminal);
    checkpoint.terminalXp = xpTotal(terminal.level) + terminal.experience;
    checkpoint.terminalCombatMs = combatMs();
  }
}

function auditJavelinInterval(checkpoint: JavelinTrainingCheckpoint, waves: readonly CampaignWave[]) {
  const interval = auditCampaignTraining(checkpoint, waves);
  const observedMs = waves.filter(row => row.ordinal >= checkpoint.startOrdinal && row.ordinal < checkpoint.nextOrdinal)
    .reduce((sum, row) => sum + row.logicalMs, 0);
  assert.ok(Number.isFinite(checkpoint.startCombatMs) && checkpoint.startCombatMs >= 0);
  assert.ok(Number.isFinite(observedMs) && observedMs >= 0 && observedMs <= checkpoint.request.maxCombatMs,
    'Javelin training combat budget exceeded');
  // Cumulative subtraction and per-stage summation round differently. Allow
  // at most one nanosecond; the admission and combat-budget bounds stay exact.
  assert.ok(Math.abs(checkpoint.terminalCombatMs - checkpoint.startCombatMs - observedMs) <= 1e-6,
    'Javelin training time mismatch');
  return { ...interval, combatMs: observedMs };
}

/** Opening acquisition is audited separately from the ordered later stages. */
export function auditJavelinAcquisition(checkpoints: readonly JavelinTrainingCheckpoint[], waves: readonly CampaignWave[]) {
  assert.ok(checkpoints.length <= 1, 'Repeated Javelin opening acquisition');
  const checkpoint = checkpoints[0];
  if (!checkpoint) return { stages: 0, admissions: 0, xp: 0, combatMs: 0, nonwinOrdinals: [] as number[] };
  assert.deepEqual([checkpoint.entryAct, checkpoint.entryArea], [1, 'areas/act1-den-of-evil']);
  assert.deepEqual(checkpoint.request, javelinAcquisitionRequest());
  return { stages: 1, ...auditJavelinInterval(checkpoint, waves) };
}

/** Reconcile declared stages, every admitted wave, earned XP, losses and the strict combat bounds. */
export function auditJavelinTraining(checkpoints: readonly JavelinTrainingCheckpoint[], waves: readonly CampaignWave[]) {
  assert.ok(checkpoints.length <= javelinTrainingStages.length, 'Too many Javelin training stages');
  let admissions = 0, xp = 0, combatMs = 0, previousEnd = -1;
  const nonwinOrdinals: number[] = [];
  for (const [index, checkpoint] of checkpoints.entries()) {
    const stage = javelinTrainingStages[index]; assert.ok(stage);
    assert.deepEqual([checkpoint.entryAct, checkpoint.entryArea], [stage.entryAct, stage.entry], 'Skipped Javelin training stage');
    assert.deepEqual(checkpoint.request, javelinTrainingRequest(stage.entryAct, stage.entry));
    assert.ok(checkpoint.startOrdinal >= previousEnd, 'Overlapping Javelin training');
    previousEnd = checkpoint.nextOrdinal;
    if (checkpoint.failureStatus !== null) assert.equal(index, checkpoints.length - 1, 'Continuation after training failure');
    const interval = auditJavelinInterval(checkpoint, waves);
    admissions += interval.admissions; xp += interval.xp; combatMs += interval.combatMs;
    nonwinOrdinals.push(...interval.nonwinOrdinals);
  }
  return { stages: checkpoints.length, admissions, xp, combatMs, nonwinOrdinals };
}
