import assert from 'node:assert/strict';
import { RESPEC_POLICY } from '@/data/loaders/respec';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { snapshotStores } from '@/stores/persistence';
import { prepareTownRespec, executeTownRespec } from '@/stores/respecActions';
import type { CampaignProfile } from './policy';
import type { CampaignRecord } from './actions';
import growth from './intended-growth-v1.json';

const target = (id: string, rank: number, level: number) => ({ id: `barbarian.${id}`, rank, level });
const foundation = [target('bash', 1, 1), target('howl', 1, 1), target('find_potion', 1, 1),
  target('double_swing', 1, 6), target('shout', 1, 6)];

/** Preserve final targets; pay for the early bridge, then recover its surplus through town. */
export function earnedDoubleThrowProfile(initial: CampaignProfile, level: number): CampaignProfile {
  assert.equal(initial.classId, 'barbarian');
  const remaining = growth.profiles['barbarian-double-throw-intended-v1'].targets.filter(row =>
    !(row.rank === 1 && (foundation.some(base => base.id === row.id) || row.id === 'barbarian.throwing_mastery')));
  return { ...initial,
    targets: level < 12 ? [...foundation, target('double_throw', 1, 12), target('double_swing', 5, 6),
      target('throwing_mastery', 1, 13), ...remaining.filter(row => !(row.id === 'barbarian.double_throw' && row.rank === 1))]
      : [...foundation, target('throwing_mastery', 1, 6), ...remaining],
    priority: ['barbarian.battle_command', 'barbarian.battle_orders', 'barbarian.shout', 'barbarian.double_throw',
      'barbarian.find_potion', 'barbarian.double_swing', 'barbarian.bash', 'barbarian.howl'] };
}

/** Refund actual bridge ranks once on ordinary growth; a committed empty reset resumes for free. */
export function prepareEarnedDoubleThrowProfile(initial: CampaignProfile, record: CampaignRecord): CampaignProfile {
  const player = usePlayerStore.getState().player; assert.ok(player && player.class === 'barbarian');
  const profile = earnedDoubleThrowProfile(initial, player.level), ranks = player.skillLevels ?? {};
  if (player.level < 12 || !((ranks['barbarian.double_swing'] ?? 0) > 1 ||
    ((ranks['barbarian.bash'] ?? 0) > 1 && (ranks['barbarian.double_throw'] ?? 0) < 20))) return profile;
  assert.ok(player.respecsRemaining && player.respecsRemaining.skill > 0,
    'Double Throw policy requires an unused free skill reset');
  const before = snapshotStores(); assert.ok(before);
  const key = String(useMapStore.getState().currentAct) as keyof typeof RESPEC_POLICY.townNpcs;
  const npcId = RESPEC_POLICY.townNpcs[key]; assert.ok(npcId);
  const quote = prepareTownRespec(npcId, 'skill');
  assert.equal(quote.kind, 'ok', 'Double Throw native skill reset refused');
  assert.equal(quote.cost, 0);
  assert.equal(executeTownRespec(quote.request), 'ok');
  const after = snapshotStores(); assert.ok(after);
  record({ kind: 'double-throw-native-skill-reset', level: player.level, npcId,
    refund: quote.refund, before, after, profile });
  assert.equal(after.player.skillPoints, before.player.skillPoints + quote.refund);
  assert.deepEqual(after.player.skillLevels, {});
  assert.equal(after.player.respecsRemaining.skill, before.player.respecsRemaining.skill - 1);
  for (const key of ['coreStats', 'statPoints'] as const) assert.deepEqual(after.player[key], before.player[key]);
  for (const key of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    assert.deepEqual(after[key], before[key]);
  return profile;
}
