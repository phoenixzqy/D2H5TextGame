/** Constructed unlocks/admissions, never earned campaign completion. */
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useCombatStore } from '@/stores/combatStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import * as playback from '../sim/production/earned-playback';
import { startCampaignAdmission } from './admission';

let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Admission', 'sorceress').ok).toBe(true);
});
afterEach(() => { abortSubAreaRun(); vi.restoreAllMocks(); for (const restore of restores) restore(); });

it('uses actual Act II resolution, saved alias, access and native start arguments', () => {
  useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs'] });
  const native = vi.spyOn(playback, 'startEarnedRun');
  const { handle, location } = startCampaignAdmission(2, 'areas/act2-far-oasis');
  expect(location).toBe('a2-far-oasis');
  expect(native).toHaveBeenCalledTimes(1);
  expect(native).toHaveBeenCalledWith({ act: 2, subAreaId: 'a2-far-oasis', mode: 'manual' });
  expect(useMapStore.getState()).toMatchObject({ currentAct: 2, currentSubAreaId: location });
  expect(handle.challengeOrdinal).toBe(0);
  expect(useCombatStore.getState().inCombat).toBe(true);
});

it.each(['great-marsh', 'flayer-jungle', 'kurast-bazaar', 'travincal', 'durance-of-hate'])(
  'uses actual Act III resolution and native arguments for %s with constructed access', suffix => {
    useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'] });
    const native = vi.spyOn(playback, 'startEarnedRun');
    const { handle, location } = startCampaignAdmission(3, `areas/act3-${suffix}`);
    expect(location).toBe(`a3-${suffix}`);
    expect(native).toHaveBeenCalledTimes(1);
    expect(native).toHaveBeenCalledWith({ act: 3, subAreaId: location, mode: 'manual' });
    expect(useMapStore.getState()).toMatchObject({ currentAct: 3, currentSubAreaId: location });
    expect(handle.challengeOrdinal).toBe(0);
    expect(useCombatStore.getState().inCombat).toBe(true);
    expect(useMapStore.getState().questReceipts).toEqual({});
  });

it.each([[2, 'areas/act2-far-oasis'], [1, 'areas/act2-far-oasis'],
  [2, 'areas/act1-blood-moor'], [2, 'areas/act2-unknown']] as const)(
  'refuses locked or mismatched act %s / %s before location or ordinal writes', (act, area) => {
  if (area !== 'areas/act2-far-oasis' || act === 1)
    useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs'] });
  const before = observeEarnedState(), native = vi.spyOn(playback, 'startEarnedRun');
  expect(() => startCampaignAdmission(act, area)).toThrow();
  expect(native).not.toHaveBeenCalled();
  expect(observeEarnedState()).toEqual(before);
});

it.each([[3, 'areas/act3-great-marsh', false], [2, 'areas/act3-travincal', true],
  [3, 'areas/act2-far-oasis', true], [3, 'areas/act3-unknown', true]] as const)(
  'refuses Act III lock/mismatch %s / %s before location or ordinal writes', (act, area, unlocked) => {
    if (unlocked) useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'] });
    expect(useMapStore.getState().isActUnlocked(act)).toBe(unlocked);
    const before = observeEarnedState(), native = vi.spyOn(playback, 'startEarnedRun');
    expect(() => startCampaignAdmission(act, area)).toThrow(unlocked ? 'mismatch' : 'locked');
    expect(native).not.toHaveBeenCalled();
    expect(observeEarnedState()).toEqual(before);
  });

it('keeps one native ordinal stream across the act boundary', () => {
  const first = startCampaignAdmission(1, 'areas/act1-blood-moor');
  expect(first.handle.challengeOrdinal).toBe(0);
  // Constructed abort and unlock isolate admission continuity; no simulated victory.
  abortSubAreaRun(); useCombatStore.getState().endCombat();
  useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs'] });
  const second = startCampaignAdmission(2, 'areas/act2-far-oasis');
  expect(second.handle.challengeOrdinal).toBe(1);
  abortSubAreaRun(); useCombatStore.getState().endCombat();
  useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'] });
  const third = startCampaignAdmission(3, 'areas/act3-great-marsh');
  expect(third.handle.challengeOrdinal).toBe(2);
});


it.each(['outer-steppes', 'plains-of-despair', 'city-of-the-damned', 'river-of-flame', 'chaos-sanctuary'])(
  'uses actual Act IV resolution and native arguments for %s with constructed access', suffix => {
    useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
      'areas/act3-durance-of-hate'] });
    const native = vi.spyOn(playback, 'startEarnedRun');
    const { handle, location } = startCampaignAdmission(4, `areas/act4-${suffix}`);
    expect(location).toBe(`a4-${suffix}`);
    expect(native).toHaveBeenCalledTimes(1);
    expect(native).toHaveBeenCalledWith({ act: 4, subAreaId: location, mode: 'manual' });
    expect(useMapStore.getState()).toMatchObject({ currentAct: 4, currentSubAreaId: location });
    expect(handle.challengeOrdinal).toBe(0);
    expect(useCombatStore.getState().inCombat).toBe(true);
    expect(useMapStore.getState().questReceipts).toEqual({});
  });

it.each([[4, 'areas/act4-plains-of-despair', false], [3, 'areas/act4-river-of-flame', true],
  [4, 'areas/act3-durance-of-hate', true], [4, 'areas/act4-unknown', true]] as const)(
  'refuses Act IV lock/mismatch %s / %s before location or ordinal writes', (act, area, unlocked) => {
    if (unlocked) useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs',
      'areas/act2-tomb-of-tal-rasha', 'areas/act3-durance-of-hate'] });
    expect(useMapStore.getState().isActUnlocked(act)).toBe(unlocked);
    const before = observeEarnedState(), native = vi.spyOn(playback, 'startEarnedRun');
    expect(() => startCampaignAdmission(act, area)).toThrow(unlocked ? 'mismatch' : 'locked');
    expect(native).not.toHaveBeenCalled();
    expect(observeEarnedState()).toEqual(before);
  });

it('keeps the original native ordinal stream through Act IV', () => {
  const clears = ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-durance-of-hate'];
  for (const [index, [act, area]] of ([[1, 'areas/act1-blood-moor'], [2, 'areas/act2-far-oasis'],
    [3, 'areas/act3-great-marsh'], [4, 'areas/act4-plains-of-despair']] as const).entries()) {
    useMapStore.setState({ clearedSubAreas: clears.slice(0, index) });
    expect(startCampaignAdmission(act, area).handle.challengeOrdinal).toBe(index);
    // Constructed aborts and clears prove admission continuity, never earned victories.
    abortSubAreaRun(); useCombatStore.getState().endCombat();
  }
  expect(useMapStore.getState().questReceipts).toEqual({});
});

it('keeps the original native ordinal stream through all five acts without starting optional quests', () => {
  const clears = ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
    'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'];
  for (const [index, [act, area]] of ([[1, 'areas/act1-blood-moor'], [2, 'areas/act2-far-oasis'],
    [3, 'areas/act3-great-marsh'], [4, 'areas/act4-plains-of-despair'],
    [5, 'areas/act5-throne-of-destruction']] as const).entries()) {
    useMapStore.setState({ clearedSubAreas: clears.slice(0, index) });
    expect(startCampaignAdmission(act, area).handle.challengeOrdinal).toBe(index);
    // Test-owned aborts and constructed access establish counters, not earned victories.
    abortSubAreaRun(); useCombatStore.getState().endCombat();
  }
  expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 5, nightmare: 0, hell: 0 });
  expect(useMapStore.getState().questProgress).toEqual({});
  expect(useMapStore.getState().questReceipts).toEqual({});
});
