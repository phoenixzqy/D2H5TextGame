import assert from 'node:assert/strict';
import { levelForXp } from '@/engine/progression/xp';
import type { CampaignProfile, CampaignWave } from './policy';
import type { CampaignRecovery } from './route';
import { auditCampaignTraining } from './training-audit';

/** Bind the post-quest Den interval before admitting its independently verified losses. */
export function auditCampaignAcquisition(profile: CampaignProfile, recovery: CampaignRecovery,
  waves: readonly CampaignWave[], denClaimed: boolean) {
  const checkpoint = recovery.acquisition;
  const enabled = profile.acquisitionTrainingPolicy === 'den-bounded-v1' && recovery.mode === 'act1-training-v1';
  const firstRoute = waves.find(row => row.phase === 'route' && row.area !== 'areas/act1-den-of-evil');
  const farms = waves.filter(row => row.phase === 'farm' && row.area === 'areas/act1-den-of-evil' &&
    (firstRoute === undefined || row.ordinal < firstRoute.ordinal));
  if (!checkpoint) {
    assert.ok(!enabled || farms.length === 0, 'Missing Den acquisition checkpoint');
    return { admissions: 0, xp: 0, nonwinOrdinals: [] as number[] };
  }
  assert.ok(enabled, 'Den acquisition requires both opt-ins');
  assert.equal(denClaimed, true, 'Den acquisition requires the claimed quest');
  assert.deepEqual(checkpoint.request, { act: 1, area: 'areas/act1-den-of-evil',
    targetLevel: 12, maxAdmissions: 99, maxConsecutiveNonwins: 3, maxTotalNonwins: 10 });
  assert.ok(levelForXp(checkpoint.fromXp) >= 6 && levelForXp(checkpoint.fromXp) < 12,
    'Den acquisition requires the earned opening level');
  assert.ok(waves.some(row => row.area === checkpoint.request.area && row.phase === 'route' &&
    row.ordinal < checkpoint.startOrdinal && row.outcome === 'victory' && row.advance === 'victory' && row.heroLife > 0),
  'Den acquisition requires the original Den clear');
  const interval = waves.filter(row => row.ordinal >= checkpoint.startOrdinal && row.ordinal < checkpoint.nextOrdinal);
  assert.deepEqual(interval, farms, 'Den acquisition interval must cover all initial Den farming');
  let cumulativeXp = checkpoint.fromXp;
  for (let ordinal = checkpoint.startOrdinal; ordinal < checkpoint.nextOrdinal; ordinal++) {
    assert.ok(levelForXp(cumulativeXp) < 12, 'Continuation after Den acquisition target');
    for (const row of interval.filter(row => row.ordinal === ordinal)) {
      if (row.outcome !== 'victory') {
        assert.equal(row.xp, 0, 'Failed Den wave awarded XP');
        assert.equal(row.items, 0, 'Failed Den wave awarded items');
      }
      cumulativeXp += row.xp;
    }
  }
  const audit = auditCampaignTraining(checkpoint, waves);
  if (checkpoint.result?.status === 'target-earned') {
    assert.equal(checkpoint.failure, null); assert.equal(checkpoint.failureStatus, null);
    if (firstRoute) assert.equal(firstRoute.ordinal, checkpoint.nextOrdinal, 'Gap before post-acquisition route');
  } else assert.ok(!waves.some(row => row.ordinal >= checkpoint.nextOrdinal), 'Continuation after Den acquisition stop');
  return audit;
}
