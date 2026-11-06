import assert from 'node:assert/strict';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { growCampaignBuild, type CampaignRecord } from './actions';
import { resetCampaignPoints } from './caster-preparation';
import type { CampaignProfile } from './policy';

/** Reallocate the same earned points before Chaos; no farming, stat reset or grants. */
export function prepareNovaChaos(initial: CampaignProfile, record: CampaignRecord): CampaignProfile {
  const before = usePlayerStore.getState().player; assert.ok(before);
  assert.equal(initial.classId, 'sorceress'); assert.ok(before.level >= 40 && useMapStore.getState().isActUnlocked(4));
  const points = before.skillPoints + Object.values(before.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0);
  assert.ok(points >= 45, 'Chaos preparation requires earned mastery and Blizzard points');
  const profile = { ...initial, targets: [{ id: 'sorceress.cold_mastery', rank: 20, level: 30 },
    ...initial.targets.filter(target => target.id !== 'sorceress.cold_mastery')] };
  resetCampaignPoints('skill', record); growCampaignBuild(profile, record);
  const after = usePlayerStore.getState().player; assert.ok(after);
  assert.equal(after.skillPoints + Object.values(after.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0), points);
  const levels = after.skillLevels; assert.ok(levels);
  assert.equal(levels['sorceress.cold_mastery'], 20); assert.equal(levels['sorceress.blizzard'], 20);
  assert.deepEqual(after.coreStats, before.coreStats); assert.deepEqual(after.comboOrder, profile.priority);
  record({ kind: 'nova-act4-earned-preparation', profile, points });
  return profile;
}
