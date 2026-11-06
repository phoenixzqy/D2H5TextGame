import assert from 'node:assert/strict';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { snapshotStores } from '@/stores/persistence';
import type { CampaignProfile } from './policy';
import type { CampaignRecord } from './actions';

/** Select a native recruit without changing earned levels, old custody or other domains. */
export function prepareIntendedCompanion(profile: CampaignProfile, record: CampaignRecord): void {
  if (!profile.companionPolicy) return;
  assert.ok(!useCombatStore.getState().inCombat && !hasActiveSubAreaRun(),
    'Intended companion requires an idle boundary');
  const hero = usePlayerStore.getState().player;
  const roster = loadMercHireRoster().find(row => row.act === 2); assert.ok(roster);
  assert.ok(hero && hero.level >= roster.unlockReqLevel && useMapStore.getState().isActUnlocked(2),
    'Intended companion requires earned level and Act II access');
  const definition = roster.mercs.find(row => row.id === 'mercs/act2-prayer'); assert.ok(definition);
  const state = useMercStore.getState();
  const owned = state.ownedMercs.filter(row => row.id.split('#')[0] === definition.id)
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)[0];
  if (owned && state.fieldedMercId === owned.id) return;
  const before = snapshotStores(); assert.ok(before);
  if (owned) state.setFieldedMerc(owned.id);
  else assert.equal(state.hireMerc(definition).ok, true, 'Native Prayer hire refused');
  const after = snapshotStores(); assert.ok(after);
  const mercId = after.mercs.fieldedMercId; assert.ok(mercId);
  record({ kind: 'intended-act2-companion', policy: profile.companionPolicy,
    mercId, reused: !!owned, before, after });
  for (const key of ['player', 'inventory', 'map', 'formation', 'meta', 'endgame'] as const)
    assert.deepEqual(after[key], before[key]);
  if (owned) assert.deepEqual(after.mercs, { ...before.mercs, fieldedMercId: owned.id });
  else {
    assert.deepEqual(after.mercs.ownedMercs.slice(0, -1), before.mercs.ownedMercs);
    assert.equal(after.mercs.ownedMercs.at(-1)?.level, definition.reqLevel);
    assert.deepEqual(after.mercs.mercEquipment, { ...before.mercs.mercEquipment, [mercId]: {} });
    for (const [id, progress] of Object.entries(before.mercs.mercProgress))
      assert.deepEqual(after.mercs.mercProgress[id], progress);
    assert.deepEqual(after.mercs.recruitmentProgress, before.mercs.recruitmentProgress);
  }
}
