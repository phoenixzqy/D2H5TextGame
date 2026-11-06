import assert from 'node:assert/strict';
import { levelForXp } from '@/engine/progression/xp';
import type { CampaignPreparation } from './preparation';
import type { CampaignWave } from './policy';

/** Exact native training accounting shared by opening retries and later act preparation. */
export function auditCampaignTraining(checkpoint: Pick<CampaignPreparation,
  'request' | 'startOrdinal' | 'nextOrdinal' | 'fromXp' | 'terminalXp' | 'result' | 'failure' | 'failureStatus'>,
waves: readonly CampaignWave[]) {
  const request = checkpoint.request;
  for (const count of [checkpoint.startOrdinal, checkpoint.nextOrdinal, checkpoint.fromXp, checkpoint.terminalXp])
    assert.ok(Number.isSafeInteger(count) && count >= 0, 'Invalid preparation counter');
  assert.ok(checkpoint.nextOrdinal >= checkpoint.startOrdinal &&
    checkpoint.nextOrdinal - checkpoint.startOrdinal <= request.maxAdmissions, 'Preparation admission bound exceeded');
  if (checkpoint.failureStatus !== null) assert.ok(checkpoint.failure, 'Missing preparation failure reason');
  else assert.equal(checkpoint.failure, null);
  let wins = 0, nonwins = 0, consecutiveNonwins = 0, xp = 0;
  let lastAttempt: 'victory' | 'nonwin' | null = null;
  const nonwinOrdinals: number[] = [];
  for (let ordinal = checkpoint.startOrdinal; ordinal < checkpoint.nextOrdinal; ordinal++) {
    const rows = waves.filter(row => row.ordinal === ordinal);
    assert.ok(rows.length, 'Unobserved preparation admission');
    assert.ok(rows.every(row => row.area === request.area && row.phase === 'farm'), 'Preparation area/phase mismatch');
    assert.deepEqual(rows.map(row => row.index), rows.map((_row, index) => index), 'Preparation skipped or repeated waves');
    assert.ok(rows.every(row => Number.isSafeInteger(row.xp) && row.xp >= 0), 'Invalid preparation income');
    for (const row of rows.slice(0, -1))
      assert.ok(row.outcome === 'victory' && row.heroLife > 0 && row.advance === 'next-wave',
        'Continuation after preparation wave nonwin');
    const last = rows.at(-1); assert.ok(last);
    xp += rows.reduce((sum, row) => sum + row.xp, 0);
    if (last.outcome !== 'victory') {
      assert.equal(last.advance, 'defeat', 'Nonwin preparation did not settle');
      nonwins++; consecutiveNonwins++; lastAttempt = 'nonwin'; nonwinOrdinals.push(ordinal);
    } else if (last.advance === 'victory') {
      assert.ok(last.heroLife > 0, 'Preparation victory requires a living hero');
      wins++; consecutiveNonwins = 0; lastAttempt = 'victory';
    } else {
      assert.equal(ordinal, checkpoint.nextOrdinal - 1, 'Continuation after incomplete preparation admission');
      assert.ok(checkpoint.result === null &&
        (checkpoint.failureStatus === 'budget' || checkpoint.failureStatus === 'technical'),
      'Unfinished preparation cannot report success');
    }
    assert.ok(nonwins <= request.maxTotalNonwins && consecutiveNonwins <= request.maxConsecutiveNonwins,
      'Preparation retry bound exceeded');
    if (ordinal < checkpoint.nextOrdinal - 1)
      assert.ok(nonwins < request.maxTotalNonwins && consecutiveNonwins < request.maxConsecutiveNonwins,
        'Continuation after preparation retry bound');
  }
  assert.equal(checkpoint.terminalXp, checkpoint.fromXp + xp, 'Preparation cumulative XP conservation');
  const result = checkpoint.result;
  if (result) {
    assert.deepEqual(result.request, request);
    assert.equal(result.fromLevel, levelForXp(checkpoint.fromXp));
    assert.equal(result.terminalLevel, levelForXp(checkpoint.terminalXp));
    assert.deepEqual([result.admissions, result.wins, result.nonwins, result.consecutiveNonwins, result.lastAttempt],
      [checkpoint.nextOrdinal - checkpoint.startOrdinal, wins, nonwins, consecutiveNonwins, lastAttempt],
      'Preparation result/observed admission mismatch');
    const expected = result.terminalLevel >= request.targetLevel ? 'target-earned'
      : nonwins >= request.maxTotalNonwins || consecutiveNonwins >= request.maxConsecutiveNonwins
        ? 'retry-limit' : 'admission-limit';
    assert.equal(result.status, expected, 'Preparation terminal status mismatch');
    if (expected === 'admission-limit') assert.equal(result.admissions, request.maxAdmissions);
    if (expected !== 'target-earned')
      assert.equal(checkpoint.failureStatus, expected === 'retry-limit' ? 'nonwin' : 'budget');
  } else assert.ok(checkpoint.failureStatus === 'budget' || checkpoint.failureStatus === 'technical',
    'Missing preparation result without interruption');
  return { admissions: checkpoint.nextOrdinal - checkpoint.startOrdinal, xp, nonwinOrdinals };
}
