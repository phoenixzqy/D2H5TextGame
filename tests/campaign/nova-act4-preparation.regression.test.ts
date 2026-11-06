/** Constructed points prove preparation conservation, not earned campaign viability. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import { novaActTwoProfile } from './caster-preparation';
import { growCampaignBuild } from './actions';
import { prepareNovaChaos } from './nova-act4-preparation';

let restores: (() => void)[];
const hero = () => { const value = usePlayerStore.getState().player; assert.ok(value); return value; };
const save = () => { const value = snapshotStores(); assert.ok(value); return value; };
const initial = { ...novaActTwoProfile(campaignProfiles['sorceress-cold-nova-focus'], true),
  priority: ['sorceress.static_field', 'sorceress.blizzard', 'sorceress.ice_blast'] };
const profile = { ...initial, targets: [{ id: 'sorceress.cold_mastery', rank: 6, level: 30 }, ...initial.targets] };
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Chaos QA', 'sorceress').ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(40));
  // Constructed five quest skill points; native continuation audits own their acquisition.
  usePlayerStore.setState({ player: { ...hero(), skillPoints: hero().skillPoints + 5 } });
  growCampaignBuild(profile, () => undefined);
  for (const area of ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-durance-of-hate'])
    useMapStore.getState().markCleared(area);
  useMapStore.getState().setCurrentLocation(4, 'a4-chaos-sanctuary');
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

it('moves earned points into mastery20, spends one free reset and preserves ownership', () => {
  const before = save(); expect(before.player.skillLevels?.['sorceress.frost_nova']).toBe(19);
  const prepared = prepareNovaChaos(profile, () => undefined), after = save();
  expect(after.player.skillLevels).toMatchObject({ 'sorceress.cold_mastery': 20,
    'sorceress.blizzard': 20, 'sorceress.frost_nova': 5 });
  expect(Object.values(after.player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0)).toBe(50);
  expect(after.player.skillPoints).toBe(0); expect(after.player.coreStats).toEqual(before.player.coreStats);
  expect(after.player.respecsRemaining.skill).toBe(before.player.respecsRemaining.skill - 1);
  expect(after.player.respecsRemaining.stat).toBe(before.player.respecsRemaining.stat);
  expect(after.player.comboOrder).toEqual(profile.priority); expect(prepared.priority).toEqual(profile.priority);
  for (const domain of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    expect(after[domain]).toEqual(before[domain]);
});

it('refuses without a free reset before changing native state', () => {
  const player = hero(), respecs = player.respecsRemaining; assert.ok(respecs);
  usePlayerStore.setState({ player: { ...player, respecsRemaining: { ...respecs, skill: 0 } } });
  const before = save(); expect(() => prepareNovaChaos(profile, () => undefined)).toThrow(); expect(save()).toEqual(before);
});
