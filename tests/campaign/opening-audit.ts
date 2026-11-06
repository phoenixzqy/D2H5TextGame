import assert from 'node:assert/strict';
import { levelForXp } from '@/engine/progression/xp';
import type { CampaignOpeningCycle, CampaignOpeningRecovery } from './opening-recovery';
import type { CampaignWave } from './policy';
import { auditCampaignTraining } from './training-audit';

/** Independently bind opening Den losses, finite training intervals and actual whole-run retries. */
export function auditCampaignOpening(opening: CampaignOpeningRecovery | undefined, waves: readonly CampaignWave[]) {
  const failureOrdinals: number[] = [], trainingNonwinOrdinals: number[] = [];
  let trainingAdmissions = 0, trainingXp = 0;
  if (opening) {
    assert.equal(opening.mode, 'den-training-v1', 'Invalid opening audit mode');
    assert.ok(opening.cycles.length <= 2, 'Opening recovery cycle limit');
    for (const [index, cycle] of opening.cycles.entries()) {
      assert.ok(cycle.resolution !== null, 'Unresolved opening cycle');
      assert.equal(failureOrdinals.includes(cycle.failure.ordinal), false, 'Repeated opening failure');
      const rows = waves.filter(row => row.ordinal === cycle.failure.ordinal);
      assert.ok(rows.length && rows.every(row => row.area === 'areas/act1-den-of-evil' && row.phase === 'route'),
        'Opening failure requires original Den admission');
      assert.deepEqual(rows.map(row => row.index), rows.map((_row, waveIndex) => waveIndex), 'Opening failure wave gap');
      assert.ok(rows.slice(0, -1).every(row => row.outcome === 'victory' && row.heroLife > 0 && row.advance === 'next-wave'));
      const failure = rows.at(-1); assert.ok(failure && failure.outcome !== 'victory' && failure.advance === 'defeat');
      assert.deepEqual(cycle.failure, { area: failure.area, phase: failure.phase,
        ordinal: failure.ordinal, index: failure.index, outcome: failure.outcome });
      assert.equal(failure.xp, 0); assert.equal(failure.items, 0);
      failureOrdinals.push(failure.ordinal);
      assert.equal(cycle.fromLevel, levelForXp(cycle.fromXp));
      assert.equal(cycle.targetLevel, cycle.fromLevel + 1); assert.ok(cycle.targetLevel <= 14);
      assert.equal(cycle.trainingStartOrdinal, cycle.failure.ordinal + 1);
      assert.deepEqual(cycle.trainingRequest, { act: 1, area: 'areas/act1-blood-moor',
        targetLevel: cycle.targetLevel, maxAdmissions: 40, maxConsecutiveNonwins: 1, maxTotalNonwins: 1 });
      const previous: CampaignOpeningCycle | undefined = opening.cycles[index - 1];
      if (previous) {
        assert.equal(previous.resolution, 'retry-nonwin', 'Continuation after a resolved opening');
        assert.equal(previous.retryOrdinal, cycle.failure.ordinal, 'New opening cycle lost its failed retry');
      }
      const training = auditCampaignTraining({ request: cycle.trainingRequest,
        startOrdinal: cycle.trainingStartOrdinal, nextOrdinal: cycle.trainingNextOrdinal,
        fromXp: cycle.fromXp, terminalXp: cycle.trainingTerminalXp, result: cycle.trainingResult,
        failure: cycle.resolution === 'stopped' ? cycle.reason : null,
        failureStatus: cycle.resolution === 'stopped' ? cycle.stopStatus : null }, waves);
      trainingAdmissions += training.admissions; trainingXp += training.xp;
      trainingNonwinOrdinals.push(...training.nonwinOrdinals);
      if (cycle.resolution === 'stopped') {
        assert.equal(index, opening.cycles.length - 1, 'Continuation after opening stop');
        assert.ok(cycle.reason && cycle.stopStatus !== null);
      } else if (cycle.resolution === 'retry-nonwin') assert.equal(cycle.stopStatus, 'nonwin');
      else { assert.equal(cycle.reason, null); assert.equal(cycle.stopStatus, null); }
      if (cycle.retryOrdinal === null) {
        assert.equal(cycle.resolution, 'stopped', 'Opening retry missing'); continue;
      }
      assert.equal(cycle.retryOrdinal, cycle.trainingNextOrdinal, 'Opening retry ordinal mismatch');
      assert.equal(cycle.trainingResult?.status, 'target-earned', 'Opening retry without earned level');
      const retry = waves.filter(row => row.ordinal === cycle.retryOrdinal);
      assert.ok(retry.length && retry.every(row => row.area === 'areas/act1-den-of-evil' && row.phase === 'route'),
        'Unobserved or wrong opening retry');
      assert.deepEqual(retry.map(row => row.index), retry.map((_row, waveIndex) => waveIndex), 'Opening retry wave gap');
      assert.ok(retry.slice(0, -1).every(row => row.outcome === 'victory' && row.heroLife > 0 && row.advance === 'next-wave'));
      const last = retry.at(-1); assert.ok(last);
      if (cycle.resolution === 'retry-won')
        assert.ok(last.outcome === 'victory' && last.heroLife > 0 && last.advance === 'victory', 'Opening retry did not win');
      else if (cycle.resolution === 'retry-nonwin')
        assert.ok(last.outcome !== 'victory' && last.advance === 'defeat', 'Opening retry did not lose');
    }
  }
  return { cycles: opening?.cycles.length ?? 0, trainingAdmissions, trainingXp, failureOrdinals, trainingNonwinOrdinals };
}
