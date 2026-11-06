import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { selectReplayProfile } from '@/features/map/replayProfile';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { __resetPersistenceForTests, useHydrationStore } from './persistence';

const AREA = 'areas/act1-blood-moor';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore];
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function drain() {
  for (const _event of useCombatStore.getState().recordedEvents) useCombatStore.getState().advanceEvent();
}
function start() {
  const handle = startSubAreaRun({ act: 1, subAreaId: AREA, runSeed: 7, challengeOrdinal: 0 });
  if (!handle) throw new Error('Missing native first-clear fixture');
  return handle.totalWaves;
}
function clear(beforeSettlement?: () => void) {
  const count = start(), deltas: number[] = [];
  beforeSettlement?.();
  for (let wave = 0; wave < count; wave++) {
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    const before = useInventoryStore.getState().currencies.wishstone ?? 0;
    drain();
    expect(advanceWaveOrFinish()).toBe(wave === count - 1 ? 'victory' : 'next-wave');
    deltas.push((useInventoryStore.getState().currencies.wishstone ?? 0) - before);
  }
  return deltas;
}
function finalAmount(deltas: number[]): number {
  const amount = deltas.at(-1);
  if (amount === undefined) throw new Error('Missing terminal reward');
  return amount;
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  // Constructed high power isolates settlement; this is not an earned/balance run.
  registerSkill({ id: 'fixture.first-clear-finisher', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100000,100000], alwaysHits: true }] });
  const hero = createMockPlayer('First clear fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, comboOrder: ['fixture.first-clear-finisher'],
    coreStats: { ...hero.coreStats, vitality: 10000 } });
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it('adds exactly five only on the first terminal victory, preserving every repeat-run kill reward', () => {
  const first = clear(), before = useInventoryStore.getState().currencies.wishstone;
  expect(useMapStore.getState().clearedSubAreas).toEqual([AREA]);
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(useInventoryStore.getState().currencies.wishstone).toBe(before);
  const second = clear();
  expect(first.slice(0,-1)).toEqual(second.slice(0,-1));
  expect(finalAmount(first) - finalAmount(second)).toBe(5);
});

it('does not retroactively grant for a loaded clear flag, and direct clear writes grant no currency', () => {
  useMapStore.getState().markCleared(AREA);
  expect(useInventoryStore.getState().currencies.wishstone ?? 0).toBe(0);
  const first = clear(), second = clear();
  expect(first).toEqual(second);
});

it.each(['nightmare', 'hell'] as const)('pays five once to the frozen %s ledger despite UI changes', profile => {
  const proof = campaignEvidence();
  useMapStore.setState({ ...proof, questDifficulties: { 'difficulty/nightmare': true },
    clearedSubAreas: [AREA, 'areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
      'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] });
  useInventoryStore.setState({ questItems: proof.questItems });
  expect(selectReplayProfile(profile)).toBe('ok');
  const first = clear(() => { useMapStore.setState({ selectedDifficulty: 'normal',
    currentSubAreaId: 'areas/act1-den-of-evil' }); });
  const key = profile === 'hell' ? 'hellClearedSubAreas' : 'nightmareClearedSubAreas';
  const otherKey = profile === 'hell' ? 'nightmareClearedSubAreas' : 'hellClearedSubAreas';
  expect(useMapStore.getState()[key]).toEqual([AREA]);
  expect(useMapStore.getState()[otherKey]).toEqual([]);
  useCombatStore.getState().endCombat();
  expect(selectReplayProfile(profile)).toBe('ok');
  const second = clear();
  expect(first.slice(0, -1)).toEqual(second.slice(0, -1));
  expect(finalAmount(first) - finalAmount(second)).toBe(5);
});

it('gives no first-clear reward or clear flag on an actual defeat', () => {
  usePlayerStore.getState().setPlayer(createMockPlayer('Defeat fixture', 'sorceress'));
  start();
  expect(useCombatStore.getState().outcome?.winner).not.toBe('player');
  const inventory = useInventoryStore.getState();
  drain();
  expect(advanceWaveOrFinish()).toBe('defeat');
  expect(useInventoryStore.getState()).toBe(inventory);
  expect(useMapStore.getState().clearedSubAreas).toEqual([]);
});

it('restores first-clear currency and its flag when the final clear publication throws', () => {
  const count = start();
  for (let wave = 0; wave < count - 1; wave++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
  const before = useInventoryStore.getState(), map = useMapStore.getState();
  const mark = map.markCleared;
  vi.spyOn(map, 'markCleared').mockImplementation(area => { mark(area); throw new Error('first-clear observer'); });
  drain();
  expect(advanceWaveOrFinish).toThrow('first-clear observer');
  expect(useInventoryStore.getState()).toEqual(before);
  expect(useMapStore.getState().clearedSubAreas).toEqual([]);
  expect(advanceWaveOrFinish).toThrow('settlementFailed');
});

it('refuses an unsafe first-clear currency sum before XP, inventory or clear publication', () => {
  const count = start();
  for (let wave = 0; wave < count - 1; wave++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
  useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER - 4 } });
  const before = useInventoryStore.getState();
  const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
  drain();
  expect(advanceWaveOrFinish).toThrow('Invalid reward count');
  expect(xp).not.toHaveBeenCalled();
  expect(useInventoryStore.getState()).toBe(before);
  expect(useMapStore.getState().clearedSubAreas).toEqual([]);
});
