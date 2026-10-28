/** Real transition/persistence integration; only IndexedDB IO is faked. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveRecord } from './save-adapter';
const disk = vi.hoisted(() => ({
  get: vi.fn(() => Promise.resolve(undefined)),
  put: vi.fn((_record: SaveRecord) => Promise.resolve()),
  delete: vi.fn(() => Promise.resolve())
}));
vi.mock('dexie', () => ({ default: class {
  version() { return { stores: () => Object.assign(this,
    { saves: { get: disk.get, put: disk.put, delete: disk.delete } }) }; }
} }));

import * as engine from '@/engine/combat/combat';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { startSubAreaRun, abortSubAreaRun, advanceWaveOrFinish,
  refreshActivePlayerCombatConfig } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { clearCombatForHeroReplacement } from './combatRunLifecycle';
import { clearIronGolemSelection } from './ironGolemSelectionStore';
import { assertWaveSnapshotAllowed, beginWaveTransition, endWaveTransition,
  reserveWaveRestore, WaveGuardError } from './waveTransitionGuard';
import { __resetPersistenceForTests, useHydrationStore, snapshotStores,
  exportCurrentSave, flushSave, hydrateFromSave, importIntoStores, deleteCurrentSave, startAutoSave, stopAutoSave,
  AUTO_SAVE_DEBOUNCE_MS } from './persistence';

const start = () => startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7 });
const replay = () => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); };
const domains = [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
  useMetaStore, useFormationStore] as const;
beforeEach(() => {
  __resetPersistenceForTests();
  abortSubAreaRun();
  useCombatStore.getState().reset();
  domains.forEach(store => { store.getState().reset(); });
  vi.useFakeTimers(); vi.setSystemTime(1_792_627_200_000);
  disk.get.mockClear(); disk.put.mockClear(); disk.delete.mockClear();
  loadDefaultSkills();
  usePlayerStore.getState().setPlayer(createMockPlayer('Lease', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  stopAutoSave();
  abortSubAreaRun();
  __resetPersistenceForTests();
  resetRegistry();
  vi.useRealTimers(); vi.restoreAllMocks();
});

function assertReleased() {
  expect(assertWaveSnapshotAllowed).not.toThrow();
  const lease = beginWaveTransition(true);
  expect(endWaveTransition(lease)).toBe(false);
}

function wonWave() {
  registerSkill({ id: 'fixture.lease-finisher', archetype: 'fixture', target: 'all-enemies',
    cooldown: 1, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000] }] });
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing lease hero fixture');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: ['fixture.lease-finisher'] });
  start();
  const opening = useCombatStore.getState();
  expect(opening.outcome?.winner).toBe('player');
  for (const _event of opening.recordedEvents) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

describe('owned production recording transitions', () => {
  it.each(['start', 'replay'] as const)('holds %s ownership through publication subscribers', async action => {
    if (action === 'replay') start();
    const exported = exportCurrentSave();
    if (!exported) throw new Error('Missing lease export fixture');
    const simulation = vi.spyOn(engine, 'runBattleRecorded');
    const rejected: Promise<unknown>[] = [];
    let notifications = 0;
    const stop = useCombatStore.subscribe(() => {
      notifications++;
      stop();
      const nested = [start, advanceWaveOrFinish, replay, abortSubAreaRun,
        clearCombatForHeroReplacement, clearIronGolemSelection, snapshotStores,
        exportCurrentSave, hydrateFromSave, reserveWaveRestore];
      for (const operation of nested) {
        expect(operation).toThrow(WaveGuardError);
        expect(operation).toThrow('waveBusy');
      }
      expect(() => { refreshActivePlayerCombatConfig(); }).not.toThrow();
      expect(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: false }); }).not.toThrow();
      rejected.push(expect(flushSave()).rejects.toMatchObject({ code: 'waveBusy' }));
      rejected.push(expect(importIntoStores(exported)).rejects.toMatchObject({ code: 'waveBusy' }));
      rejected.push(expect(deleteCurrentSave()).rejects.toMatchObject({ code: 'waveBusy' }));
    });
    try { if (action === 'start') start(); else replay(); } finally { stop(); }
    await Promise.all(rejected);
    expect(notifications).toBe(1);
    expect(simulation).toHaveBeenCalledTimes(1);
    assertReleased();
    expect(disk.get).not.toHaveBeenCalled();
    expect(disk.put).not.toHaveBeenCalled();
    expect(disk.delete).not.toHaveBeenCalled();
  });

  it('holds advancement ownership through reward subscribers before nested payout or simulation', () => {
    wonWave();
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const simulation = vi.spyOn(engine, 'runBattleRecorded');
    let notifications = 0;
    const stop = usePlayerStore.subscribe(() => {
      notifications++;
      stop();
      for (const action of [start, advanceWaveOrFinish, replay]) expect(action).toThrow('waveBusy');
      expect(abortSubAreaRun).toThrow('waveBusy');
      expect(snapshotStores).toThrow('waveBusy');
    });
    try { expect(advanceWaveOrFinish()).toBe('next-wave'); } finally { stop(); }
    expect(notifications).toBe(1);
    expect(xp).toHaveBeenCalledTimes(1);
    expect(simulation).toHaveBeenCalledTimes(1);
    assertReleased();
  });

  it.each(['no-player', 'no-run', 'inactive-replay', 'incomplete'] as const)(
    'releases ownership after the %s control', control => {
      if (control === 'no-player') {
        usePlayerStore.getState().reset(); expect(start()).toBeNull();
      } else if (control === 'no-run') expect(advanceWaveOrFinish()).toBe('idle');
      else if (control === 'inactive-replay') replay();
      else { start(); expect(advanceWaveOrFinish()).toBe('idle'); }
      assertReleased();
    });

  it.each(['start-engine', 'replay-engine', 'advance-engine', 'start-setter', 'replay-subscriber', 'reward-subscriber'] as const)(
    'preserves the original %s failure and releases ownership', fault => {
      const failure = new Error(fault);
      let stop: (() => void) | undefined;
      let action: () => unknown = start;
      if (fault === 'advance-engine' || fault === 'reward-subscriber') { wonWave(); action = advanceWaveOrFinish; }
      else if (fault === 'replay-engine' || fault === 'replay-subscriber') { start(); action = replay; }
      if (fault.endsWith('engine')) vi.spyOn(engine, 'runBattleRecorded').mockImplementationOnce(() => { throw failure; });
      else if (fault === 'start-setter') {
        vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw failure; });
      } else {
        const store = fault === 'reward-subscriber' ? usePlayerStore : useCombatStore;
        stop = store.subscribe(() => { throw failure; });
      }
      try {
        if (fault === 'reward-subscriber') {
          let caught: unknown;
          try { action(); } catch (error) { caught = error; }
          expect(caught).toBeInstanceOf(AggregateError);
          expect(caught).toMatchObject({ cause: failure, errors: [failure] });
        } else expect(action).toThrow(failure);
      } finally { stop?.(); }
      assertReleased();
    });
});

describe('transition deferred-save wake', () => {
  it.each(['start', 'replay', 'advance', 'throwing-subscriber'] as const)(
    'coalesces real autosave notifications during %s and debounces only after release', async action => {
      if (action === 'advance') wonWave();
      else if (action === 'replay') start();
      startAutoSave();
      const failure = new Error('publication observer after mutations');
      let calls = 0;
      const stop = useCombatStore.subscribe(() => {
        calls++;
        stop();
        expect(assertWaveSnapshotAllowed).toThrow('waveBusy');
        useInventoryStore.getState().addCurrency('lease-token', 2);
        useInventoryStore.getState().addCurrency('lease-token', 3);
        usePlayerStore.getState().setComboOrder([]);
        // Only the existing periodic checkpoint exists while the wave is owned.
        expect(vi.getTimerCount()).toBe(1);
        vi.advanceTimersByTime(AUTO_SAVE_DEBOUNCE_MS + 1);
        expect(disk.put).not.toHaveBeenCalled();
        if (action === 'throwing-subscriber') throw failure;
      });
      try {
        if (action === 'replay') replay();
        else if (action === 'advance') expect(advanceWaveOrFinish()).toBe('next-wave');
        else if (action === 'throwing-subscriber') expect(start).toThrow(failure);
        else start();
      } finally { stop(); }
      expect(calls).toBe(1);
      assertReleased();
      expect(disk.put).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(2);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS - 1);
      expect(disk.put).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(disk.put).toHaveBeenCalledTimes(1);
      expect(disk.put.mock.calls[0]?.[0]).toMatchObject({ data: {
        player: { comboOrder: [] }, inventory: { currencies: { 'lease-token': 5 } }
      } });
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.put).toHaveBeenCalledTimes(1);
    });

  it('debounces the newly persisted challenge ordinal after start releases its lease', async () => {
    startAutoSave();
    start();
    assertReleased();
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 1, nightmare: 0, hell: 0 });
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
    expect(disk.put).toHaveBeenCalledTimes(1);
    expect(disk.put.mock.calls[0]?.[0].data).toMatchObject({ map: { challengeOrdinals: { normal: 1, nightmare: 0 } } });
  });

  it('schedules no debounce when replay has no persistent mutation', async () => {
    start();
    const ordinals = useMapStore.getState().challengeOrdinals;
    startAutoSave();
    replay();
    assertReleased();
    expect(useMapStore.getState().challengeOrdinals).toBe(ordinals);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
    expect(disk.put).not.toHaveBeenCalled();
  });

  it('does not restart autosave if a subscriber stops it before the transition unwinds', async () => {
    startAutoSave();
    const stop = useCombatStore.subscribe(() => {
      stop();
      useInventoryStore.getState().addCurrency('lease-token', 5);
      stopAutoSave();
    });
    try { start(); } finally { stop(); }
    assertReleased();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
    expect(disk.put).not.toHaveBeenCalled();
  });
});
