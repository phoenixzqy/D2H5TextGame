/** Supplied XP/unlocks isolate native hiring policy, not earned viability. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { xpTotal } from '@/engine/progression/xp';
import { useHydrationStore } from '@/stores/hydrationStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import { intendedCampaignProfiles } from './intended-profiles';
import { prepareIntendedCompanion } from './intended-companion';

const profile = intendedCampaignProfiles['necromancer-bone-intended-v1'];
const save = () => { const result = snapshotStores(); assert.ok(result); return result; };
const definition = (act: number, id: string) => {
  const result = loadMercHireRoster().find(row => row.act === act)?.mercs.find(row => row.id === id);
  assert.ok(result); return result;
};
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Companion policy', 'necromancer').ok).toBe(true);
  expect(useMercStore.getState().hireMerc(definition(1, 'mercs/act1-rogue-inner-sight')).ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(14));
  useMapStore.getState().markCleared('areas/act1-catacombs');
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

it('hires native Prayer at its own level while retaining every old companion domain and all resources', () => {
  const before = save(), records: Readonly<Record<string, unknown>>[] = [];
  expect(useMapStore.getState().isActUnlocked(2)).toBe(true);
  prepareIntendedCompanion(profile, row => { records.push(row); });
  const after = save(), fielded = useMercStore.getState().getFieldedMerc(); assert.ok(fielded);
  expect(fielded.id).toBe('mercs/act2-prayer'); expect(fielded.level).toBe(12);
  expect(after.mercs.ownedMercs.slice(0, -1)).toEqual(before.mercs.ownedMercs);
  expect(after.mercs.mercEquipment).toEqual({ ...before.mercs.mercEquipment, [fielded.id]: {} });
  for (const [id, progress] of Object.entries(before.mercs.mercProgress))
    expect(after.mercs.mercProgress[id]).toEqual(progress);
  for (const key of ['player', 'inventory', 'map', 'formation', 'meta', 'endgame'] as const)
    expect(after[key]).toEqual(before[key]);
  expect(records).toEqual([expect.objectContaining({ kind: 'intended-act2-companion',
    policy: 'act2-prayer-v1', reused: false, mercId: fielded.id, before, after })]);
  prepareIntendedCompanion(profile, () => { throw new Error('Already prepared'); });
  expect(save()).toEqual(after);
});

it('reuses the stable first suffixed instance without replacing owned progress or equipment', () => {
  const state = useMercStore.getState();
  expect(state.hireMerc(definition(2, 'mercs/act2-prayer')).ok).toBe(true);
  const prayer = state.getFieldedMerc(); assert.ok(prayer);
  state.removeMerc(prayer.id);
  state.addMerc({ ...prayer, id: `${prayer.id}#z` });
  state.addMerc({ ...prayer, id: `${prayer.id}#a` });
  state.setFieldedMerc('mercs/act1-rogue-inner-sight');
  const before = save();
  prepareIntendedCompanion(profile, () => undefined);
  expect(save()).toEqual({ ...before, mercs: { ...before.mercs, fieldedMercId: `${prayer.id}#a` } });
});

it.each(['level', 'act', 'combat'] as const)('refuses an ineligible %s boundary before any mutation', boundary => {
  if (boundary === 'level') {
    const hero = usePlayerStore.getState().player; assert.ok(hero);
    usePlayerStore.setState({ player: { ...hero, level: 11 } });
  } else if (boundary === 'act') useMapStore.setState({ clearedSubAreas: [] });
  else useCombatStore.setState({ inCombat: true });
  const before = save(), record = vi.fn();
  expect(() => { prepareIntendedCompanion(profile, record); }).toThrow();
  expect(save()).toEqual(before); expect(record).not.toHaveBeenCalled();
});

it('resumes a committed native hire after recorder failure without a second recruit', () => {
  expect(() => { prepareIntendedCompanion(profile, () => { throw new Error('Recorder failed'); }); })
    .toThrow('Recorder failed');
  const committed = save();
  expect(committed.mercs.ownedMercs).toHaveLength(2);
  prepareIntendedCompanion(profile, () => undefined);
  expect(save()).toEqual(committed);
});

it('opts in all fourteen intended profiles and leaves historical selections untouched', () => {
  expect(Object.values(intendedCampaignProfiles)).toHaveLength(14);
  for (const candidate of Object.values(intendedCampaignProfiles))
    expect(candidate).toMatchObject({ companionPolicy: 'act2-prayer-v1' });
  const before = save();
  prepareIntendedCompanion(campaignProfiles['amazon-bow'], () => { throw new Error('Historical mutation'); });
  expect(save()).toEqual(before);
});
