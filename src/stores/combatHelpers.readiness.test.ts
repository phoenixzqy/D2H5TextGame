/** Synthetic lifecycle fixtures exercise real production staging and playback. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, startSubAreaRun } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { armIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { getIdleEliteMisses, setIdleEliteMisses } from './idleElitePity';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore,
  WaveGuardError, type WaveGuardRefusal } from './waveTransitionGuard';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
  useMapStore, useFormationStore, useMetaStore, useIronGolemSelectionStore, useHydrationStore] as const;
const start = (options: Parameters<typeof startSubAreaRun>[0] = {}) =>
  startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7, ...options });

function refusesWithoutMutation(action: () => unknown, code: WaveGuardRefusal) {
  const before = stores.map(store => store.getState());
  const run = combatRunLifecycle.activeRun;
  const runData = structuredClone(run);
  const pity = getIdleEliteMisses();
  const notified = vi.fn();
  const stops = stores.map(store => store.subscribe(notified));
  try {
    let caught: unknown;
    try { action(); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(WaveGuardError);
    expect((caught as WaveGuardError).code).toBe(code);
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(combatRunLifecycle.activeRun).toBe(run);
    expect(combatRunLifecycle.activeRun).toEqual(runData);
    expect(getIdleEliteMisses()).toBe(pity);
    expect(notified).not.toHaveBeenCalled();
  } finally { stops.forEach(stop => { stop(); }); }
}

beforeEach(() => {
  abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useMapStore, useFormationStore, useMetaStore]) store.getState().reset();
  loadDefaultSkills();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Readiness', 'sorceress'));
  setIdleEliteMisses(9);
});
afterEach(() => {
  abortSubAreaRun();
  useHydrationStore.getState().setStatus('idle');
  setIdleEliteMisses(0);
  resetRegistry();
  vi.restoreAllMocks();
});

describe.each(['idle', 'loading', 'error'] as const)('wave readiness during %s', status => {
  it.each([false, true])('rejects start and advance with an existing run=%s', active => {
    if (active) start();
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing guard fixture');
    armIronGolemSelection(player.id, 'guard-selection', true);
    useHydrationStore.getState().setStatus(status, 'readiness-marker');
    refusesWithoutMutation(() => start(), 'hydrationNotReady');
    refusesWithoutMutation(advanceWaveOrFinish, 'hydrationNotReady');
    expect(hasActiveSubAreaRun()).toBe(active);
  });
});

it.each(['wave', 'restore'] as const)('preserves %s ownership and its refusal precedence', owner => {
  start();
  const wave = owner === 'wave' ? beginWaveTransition(true) : undefined;
  const restore = owner === 'restore' ? reserveWaveRestore() : undefined;
  useHydrationStore.getState().setStatus('error', 'owned-not-ready');
  try {
    const code = owner === 'wave' ? 'waveBusy' : 'restorePending';
    refusesWithoutMutation(() => start(), code);
    refusesWithoutMutation(advanceWaveOrFinish, code);
    expect(() => start({ runSeed: -1 })).toThrow(RangeError);
    expect(() => start({ challengeOrdinal: 360360 })).toThrow(RangeError);
  } finally {
    if (wave) expect(endWaveTransition(wave)).toBe(false);
    if (restore) releaseWaveRestore(restore);
  }
});

it('retains ready no-player/no-run controls and validates replay arguments first', () => {
  usePlayerStore.getState().reset();
  expect(start()).toBeNull();
  expect(advanceWaveOrFinish()).toBe('idle');
  useHydrationStore.getState().setStatus('loading');
  expect(() => start({ runSeed: NaN })).toThrow(RangeError);
  expect(() => start({ challengeOrdinal: -1 })).toThrow(RangeError);
  refusesWithoutMutation(() => start(), 'hydrationNotReady');
  refusesWithoutMutation(advanceWaveOrFinish, 'hydrationNotReady');
});

it('does not spend a default ordinal on refusal or an accepted explicit ordinal', () => {
  const first = start();
  if (!first) throw new Error('Missing first ordinal control');
  useHydrationStore.getState().setStatus('error');
  refusesWithoutMutation(() => start(), 'hydrationNotReady');
  refusesWithoutMutation(() => start({ challengeOrdinal: 23 }), 'hydrationNotReady');
  useHydrationStore.getState().setStatus('ready');
  expect(start({ challengeOrdinal: 23 })?.challengeOrdinal).toBe(23);
  expect(start()?.challengeOrdinal).toBe((first.challengeOrdinal + 1) % 360360);
});

it.each(['idle', 'loading', 'error'] as const)('refuses completed playback during %s then settles once', status => {
  // Controlled damage only; plan, simulation, terminal event, playback and awards are real.
  registerSkill({ id: 'fixture.readiness-finisher', archetype: 'fixture', target: 'all-enemies',
    cooldown: 1, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000] }] });
  const player = createMockPlayer('Ready playback', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: ['fixture.readiness-finisher'] });
  start({ mode: 'idle', challengeOrdinal: 0 });
  const opening = useCombatStore.getState();
  expect(opening.outcome?.winner).toBe('player');
  const length = opening.recordedEvents.length;
  for (let i = 0; i < length; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
  const mercXp = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
  const clear = vi.spyOn(useMapStore.getState(), 'markCleared');
  useHydrationStore.getState().setStatus(status, 'completed-marker');
  refusesWithoutMutation(advanceWaveOrFinish, 'hydrationNotReady');
  expect(xp).not.toHaveBeenCalled();
  expect(mercXp).not.toHaveBeenCalled();
  expect(clear).not.toHaveBeenCalled();
  useHydrationStore.getState().setStatus('ready');
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(xp).toHaveBeenCalledTimes(1);
  expect(mercXp).toHaveBeenCalledTimes(1);
  const after = stores.map(store => store.getState());
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(xp).toHaveBeenCalledTimes(1);
  expect(mercXp).toHaveBeenCalledTimes(1);
  expect(clear).not.toHaveBeenCalled();
  stores.forEach((store, i) => { expect(store.getState()).toBe(after[i]); });
});
