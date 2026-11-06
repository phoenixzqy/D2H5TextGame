import assert from 'node:assert/strict';
import { campaignPreparationRequest, type CampaignExecution } from './execution';
import type { CampaignPreparation } from './preparation';
import type { CampaignWave } from './policy';
import { auditCampaignTraining } from './training-audit';

/** Reconcile each declared training interval with original observed waves and cumulative XP. */
export function auditCampaignPreparations(execution: CampaignExecution,
  checkpoints: readonly CampaignPreparation[], waves: readonly CampaignWave[]) {
  if (execution.mode === 'screen') assert.equal(checkpoints.length, 0, 'Original screen cannot contain preparation');
  if (execution.mode === 'route-first-campaign-v1')
    assert.equal(checkpoints.length, 0, 'Route-first campaign cannot contain generic preparation');
  assert.ok(checkpoints.length <= 4, 'Too many campaign preparation stages');
  let admissions = 0, xp = 0, previousEnd = -1;
  const nonwinOrdinals: number[] = [];
  for (const [index, checkpoint] of checkpoints.entries()) {
    assert.equal(checkpoint.nextAct, index + 2, 'Skipped preparation stage');
    assert.deepEqual(checkpoint.request, campaignPreparationRequest(index + 2, execution.mode), 'Undeclared preparation request');
    assert.ok(checkpoint.startOrdinal >= previousEnd, 'Overlapping preparation admissions');
    previousEnd = checkpoint.nextOrdinal;
    if (checkpoint.failureStatus !== null)
      assert.equal(index, checkpoints.length - 1, 'Continuation after preparation failure');
    const interval = auditCampaignTraining(checkpoint, waves);
    admissions += interval.admissions; xp += interval.xp; nonwinOrdinals.push(...interval.nonwinOrdinals);
  }
  return { stages: checkpoints.length, admissions, xp, nonwinOrdinals };
}
