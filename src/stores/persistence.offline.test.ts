/** Real persistence/adapter; only IndexedDB IO is replaced. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveCurrent } from '@/engine/types/save';
import type { SaveRecord } from './save-adapter';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from './mercFactory';

const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined } = { record: undefined };
  return {
    state,
    get: vi.fn(() => Promise.resolve(state.record)),
    put: vi.fn((record: SaveRecord) => {
      state.record = structuredClone(record);
      return Promise.resolve();
    }),
    delete: vi.fn(() => { state.record = undefined; return Promise.resolve(); })
  };
});
vi.mock('dexie', () => ({
  default: class {
    version() {
      return { stores: () => Object.assign(this, {
        saves: { get: disk.get, put: disk.put, delete: disk.delete }
      }) };
    }
  }
}));

import i18n from '@/i18n';
import { toJsonSafe } from '@/engine/save';
import { useCombatStore } from './combatStore';
import { abortSubAreaRun, clearCombatAfterRestore, hasActiveSubAreaRun, startSubAreaRun } from './combatHelpers';
import { armIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import {
  beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore, WaveGuardError
} from './waveTransitionGuard';
import * as persistence from './persistence';
import { useHydrationStore } from './hydrationStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { createCharacter } from '@/features/character/createCharacter';
import { replacePlayerAfterRestore, usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import {
  __resetPersistenceForTests, initPersistence, importIntoStores,
  deleteCurrentSave, hydrateFromSave, snapshotStores, flushSave,
  useSaveStatusStore, isReplacingSave
} from './persistence';

const HOUR = 3_600_000;
const NOW = 1_792_454_400_000;
const domains = [usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, useFormationStore] as const;

function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing fixture');
  return value;
}

function fixture(): SaveCurrent {
  usePlayerStore.getState().setPlayer(createMockPlayer('Saved', 'sorceress'));
  useMetaStore.getState().setLocale('en');
  useMetaStore.getState().updateIdleState({
    lastOnline: NOW - 4 * HOUR, offlineTime: 123,
    activeMultiplier: 1, multiplierSecondsRemaining: 0, idleTarget: 'den'
  });
  useInventoryStore.getState().addCurrency('rune-shard', 17);
  const data = { ...required(snapshotStores()), timestamp: NOW - 4 * HOUR };
  for (const store of domains) store.getState().reset();
  disk.state.record = { id: 'current', version: 7, timestamp: data.timestamp, data };
  return data;
}

function savedData(): SaveCurrent {
  return required(disk.state.record).data as SaveCurrent;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(async () => {
  __resetPersistenceForTests();
  for (const store of domains) store.getState().reset();
  disk.state.record = undefined;
  vi.clearAllMocks();
  disk.get.mockReset().mockImplementation(() => Promise.resolve(disk.state.record));
  disk.put.mockReset().mockImplementation(record => {
    disk.state.record = structuredClone(record);
    return Promise.resolve();
  });
  disk.delete.mockReset().mockImplementation(() => { disk.state.record = undefined; return Promise.resolve(); });
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  await i18n.changeLanguage('zh-CN');
});

afterEach(() => {
  __resetPersistenceForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('equipment rate cache persistence compatibility', () => {
  function affectedSave() {
    const base = fixture();
    const definition = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
    if (!definition) throw new Error('missing real starter Rogue');
    const merc = createMercFromDef(definition);
    const amulet = { id: 'saved-unit-amulet', baseId: 'items/base/amu-tin',
      rarity: 'rare' as const, level: 9, identified: true, equipped: true, affixes: [
        { id: 'affix.precise.crit-chance', tier: 0, rolledValue: 2 },
        { id: 'affix.savage.crit-damage', tier: 0, rolledValue: 5 },
        { id: 'affix.nimble.phys-dodge', tier: 0, rolledValue: 2 },
        { id: 'affix.ethereal.magic-dodge', tier: 0, rolledValue: 1 },
        { affixId: 'legacy-canonical', values: new Map([['statMods.critDamage', .25]]) }
      ] };
    const input: SaveCurrent = { ...base, player: { ...base.player,
      derivedStats: { ...base.player.derivedStats, life: 53, mana: 47, magicResist: 17,
        critChance: 2.05, critDamage: 7.25, physDodge: 2.1, magicDodge: 1.05 } },
      inventory: { ...base.inventory, equipped: { amulet } },
      mercs: { ...base.mercs, ownedMercs: [merc], fieldedMercId: merc.id,
        mercEquipment: { [merc.id]: { amulet: { ...amulet, id: 'merc-unit-amulet' } } },
        mercProgress: { [merc.id]: { level: 5, experience: 73, experienceToNextLevel: 97 } } } };
    const expected = { ...input, player: { ...input.player,
      derivedStats: { ...input.player.derivedStats,
        critChance: .05 + .02, critDamage: 2 + .05 + .25,
        physDodge: .05 + 25 * .002 + .02, magicDodge: .05 + .01 } } };
    disk.state.record = { id: 'current', version: input.version, timestamp: input.timestamp, data: input };
    return { input, expected };
  }

  it('imports corrected disk/live/export data before exposing it and preserves merc growth', async () => {
    const { input, expected } = affectedSave();
    const before = structuredClone(input);
    await importIntoStores(JSON.stringify(toJsonSafe(input)));
    expect(savedData()).toEqual(expected);
    expect(snapshotStores()).toEqual({ ...expected, timestamp: NOW });
    expect(JSON.parse(required(persistence.exportCurrentSave()))).toEqual(toJsonSafe({ ...expected,
      timestamp: NOW, meta: { ...expected.meta,
        idleState: { ...expected.meta.idleState, lastOnline: NOW } } }));
    expect(input).toEqual(before);
  });

  it('hydrates a native-Map record and persists corrected caches on explicit Save', async () => {
    const { input, expected } = affectedSave();
    expect(await hydrateFromSave()).toBe(true);
    expect(snapshotStores()).toEqual({ ...expected, timestamp: NOW });
    expect(savedData()).toEqual(input);
    await flushSave();
    expect(savedData()).toEqual({ ...expected, timestamp: NOW, meta: { ...expected.meta,
      idleState: { ...expected.meta.idleState, lastOnline: NOW } } });
  });

  it('startup commits normalized caches alongside ordinary offline reconciliation', async () => {
    const { expected } = affectedSave();
    await initPersistence();
    const persisted = savedData();
    expect(persisted.player).toEqual(expected.player);
    expect(persisted.inventory).toEqual(expected.inventory);
    expect(persisted.mercs).toEqual(expected.mercs);
    expect(snapshotStores()).toEqual(persisted);
  });

  it('leaves old disk/live state intact if a corrected import write fails', async () => {
    const { input } = affectedSave();
    const original = fixture();
    disk.put.mockRejectedValueOnce(new Error('Rate-cache quota'));
    await expect(importIntoStores(JSON.stringify(toJsonSafe(input)))).rejects.toThrow('Rate-cache quota');
    expect(savedData()).toEqual(original);
    expect(usePlayerStore.getState().player).toBeNull();
  });
});

describe('persisted bonus startup reconciliation', () => {
  it('persists four-hour accrual before exposing the loaded character without awarding raw rewards', async () => {
    const before = fixture();
    await initPersistence();
    const saved = savedData();
    expect(saved.meta.idleState).toEqual({
      ...before.meta.idleState, lastOnline: NOW, offlineTime: 123 + 4 * HOUR,
      activeMultiplier: 1.32, multiplierSecondsRemaining: 4800
    });
    expect(saved.timestamp).toBe(NOW);
    expect(saved).toEqual({ ...before, timestamp: NOW,
      meta: { ...before.meta, idleState: saved.meta.idleState } });
    expect(required(snapshotStores()).meta.idleState).toEqual(saved.meta.idleState);
    expect(useHydrationStore.getState().status).toBe('ready');
    expect(disk.put).toHaveBeenCalledTimes(1);
    expect(i18n.language).toBe('en');
  });

  it('runs page initialization once across concurrent calls and later remounts', async () => {
    fixture();
    await Promise.all([initPersistence(), initPersistence()]);
    expect(disk.get).toHaveBeenCalledTimes(2); // hasSave and loadSave
    expect(disk.put).toHaveBeenCalledTimes(1);
    useInventoryStore.getState().addCurrency('rune-shard', 9);
    await initPersistence();
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(26);
    expect(disk.get).toHaveBeenCalledTimes(2);
  });

  it('holds domain state and locale until the reconciliation write succeeds', async () => {
    fixture();
    const before = domains.map(store => store.getState());
    const gate = deferred<undefined>();
    disk.put.mockImplementationOnce(async record => {
      await gate.promise;
      disk.state.record = structuredClone(record);
    });
    const pending = initPersistence();
    // Release even if the baseline assertion fails, so no task leaks into teardown.
    try {
      await vi.waitFor(() => { expect(disk.put).toHaveBeenCalledTimes(1); }, { timeout: 250 });
      domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(useHydrationStore.getState().status).toBe('loading');
      expect(i18n.language).toBe('zh-CN');
    } finally {
      gate.resolve(undefined);
      await pending;
    }
    expect(useHydrationStore.getState().status).toBe('ready');
  });

  it('preserves the remaining tuple across same-clock page restarts and legacy timestamp reconciliation', async () => {
    const before = fixture();
    disk.state.record = {
      ...required(disk.state.record),
      data: { ...before, timestamp: NOW - 2 * HOUR,
        meta: { ...before.meta, idleState: { ...before.meta.idleState,
          activeMultiplier: 1.16, multiplierSecondsRemaining: 7 } } }
    };
    await initPersistence();
    const first = structuredClone(savedData());
    expect(first.meta.idleState.activeMultiplier).toBe(1.16);
    expect(first.meta.idleState.multiplierSecondsRemaining).toBe(7);
    expect(first.meta.idleState.offlineTime).toBe(123 + 2 * HOUR);
    __resetPersistenceForTests();
    for (const store of domains) store.getState().reset();
    await initPersistence();
    expect(savedData()).toEqual(first);
    expect(useMetaStore.getState().idleState).toEqual(first.meta.idleState);
  });

  it.each(['storage', 'overflow'] as const)('preserves disk/domain references/locale and blocks writes after %s failure', async failure => {
    const before = fixture();
    if (failure === 'storage') disk.put.mockRejectedValueOnce(new Error('Quota unavailable'));
    else disk.state.record = { ...required(disk.state.record),
      data: { ...before, timestamp: -Number.MAX_VALUE,
        meta: { ...before.meta, idleState: { ...before.meta.idleState,
          lastOnline: -Number.MAX_VALUE, offlineTime: Number.MAX_VALUE } } }
    };
    const originalDisk = structuredClone(disk.state.record);
    const references = domains.map(store => store.getState());
    await initPersistence();
    domains.forEach((store, index) => { expect(store.getState()).toBe(references[index]); });
    expect(disk.state.record).toEqual(originalDisk);
    expect(i18n.language).toBe('zh-CN');
    expect(useHydrationStore.getState().status).toBe('error');
    expect(useSaveStatusStore.getState().error).toMatch(failure === 'storage' ? /Quota/ : /finite/);
    await expect(flushSave()).rejects.toThrow('recovery');
    // Cached initialization doesn't silently retry; exact import is recovery.
    const puts = disk.put.mock.calls.length;
    await initPersistence();
    expect(disk.put).toHaveBeenCalledTimes(puts);
    await importIntoStores(JSON.stringify(before));
    expect(savedData()).toEqual(before);
    expect(useMetaStore.getState().idleState).toEqual(before.meta.idleState);
    expect(useHydrationStore.getState().status).toBe('ready');
    expect(isReplacingSave()).toBe(false);
  });

  it('keeps explicit import and raw hydration exact without away accrual', async () => {
    const before = fixture();
    await importIntoStores(JSON.stringify(before));
    expect(savedData()).toEqual(before);
    expect(useMetaStore.getState().idleState).toEqual(before.meta.idleState);
    for (const store of domains) store.getState().reset();
    const puts = disk.put.mock.calls.length;
    expect(await hydrateFromSave()).toBe(true);
    expect(disk.put).toHaveBeenCalledTimes(puts);
    expect(savedData()).toEqual(before);
    expect(useMetaStore.getState().idleState).toEqual(before.meta.idleState);
  });

  it('initializes without a stored character without writing anything', async () => {
    await initPersistence();
    expect(useHydrationStore.getState().status).toBe('ready');
    expect(disk.put).not.toHaveBeenCalled();
    expect(disk.state.record).toBeUndefined();
    expect(usePlayerStore.getState().player).toBeNull();
  });
});

describe('startup and explicit restore ordering', () => {
  it.each([
    ['read', 'import'], ['read', 'delete'], ['write', 'import'], ['write', 'delete']
  ] as const)('keeps a user %s-delayed %s after startup in disk and live state', async (phase, replacement) => {
    const before = fixture();
    const originalRecord = structuredClone(disk.state.record);
    const gate = deferred<undefined>();
    if (phase === 'read') {
      disk.get.mockResolvedValueOnce(originalRecord).mockImplementationOnce(async () => {
        await gate.promise;
        return originalRecord;
      });
    } else disk.put.mockImplementationOnce(async record => {
      await gate.promise;
      disk.state.record = structuredClone(record);
    });
    const startup = initPersistence();
    let requested: Promise<void> | undefined;
    const imported = { ...before, player: { ...before.player, name: 'User import' } };
    try {
      await vi.waitFor(() => { expect(phase === 'read' ? disk.get : disk.put)
        .toHaveBeenCalledTimes(phase === 'read' ? 2 : 1); }, { timeout: 500 });
      requested = replacement === 'import'
        ? importIntoStores(JSON.stringify(imported)) : deleteCurrentSave();
      expect(isReplacingSave()).toBe(true);
      // Explicit save remains excluded while the user operation is queued.
      await expect(flushSave()).rejects.toMatchObject({ code: 'restorePending' });
    } finally {
      gate.resolve(undefined);
      await startup;
      await requested;
    }
    expect(isReplacingSave()).toBe(false);
    if (replacement === 'import') {
      expect(savedData()).toEqual(imported);
      expect(usePlayerStore.getState().player).toEqual(imported.player);
      expect(useMetaStore.getState().idleState).toEqual(imported.meta.idleState);
    } else {
      expect(disk.state.record).toBeUndefined();
      expect(usePlayerStore.getState().player).toBeNull();
      expect(useInventoryStore.getState().backpack).toEqual([]);
    }
    // Later initialization calls cannot republish the old startup character.
    await initPersistence();
    expect(usePlayerStore.getState().player?.name ?? null)
      .toBe(replacement === 'import' ? imported.player.name : null);
  });

  it('orders a deferred raw restore before a later import and recovers after replacement failure', async () => {
    const before = fixture();
    const gate = deferred<undefined>();
    const original = structuredClone(disk.state.record);
    disk.get.mockImplementationOnce(async () => { await gate.promise; return original; });
    const restore = hydrateFromSave();
    await vi.waitFor(() => { expect(disk.get).toHaveBeenCalledTimes(1); });
    const imported = { ...before, player: { ...before.player, name: 'Import wins' } };
    const request = importIntoStores(JSON.stringify(imported));
    gate.resolve(undefined);
    await restore;
    await request;
    expect(savedData()).toEqual(imported);
    expect(usePlayerStore.getState().player).toEqual(imported.player);
    const references = domains.map(store => store.getState());
    disk.put.mockRejectedValueOnce(new Error('Replacement quota'));
    await expect(importIntoStores(JSON.stringify(before))).rejects.toThrow('Replacement quota');
    domains.forEach((store, index) => { expect(store.getState()).toBe(references[index]); });
    expect(savedData()).toEqual(imported);
    expect(isReplacingSave()).toBe(false);
    await deleteCurrentSave();
    expect(disk.state.record).toBeUndefined();
    expect(usePlayerStore.getState().player).toBeNull();
  });
});


const restores = ['hydrate', 'init', 'import', 'delete'] as const;
type Restore = typeof restores[number];
function payload(): string { return JSON.stringify(toJsonSafe(required(persistence.snapshotStores()))); }
function request(kind: Restore, json: string): Promise<unknown> {
  if (kind === 'hydrate') return persistence.hydrateFromSave();
  if (kind === 'init') return persistence.initPersistence();
  if (kind === 'import') return persistence.importIntoStores(json);
  return persistence.deleteCurrentSave();
}
function gate() {
  let done: (() => void) | undefined;
  const promise = new Promise<void>(resolve => { done = resolve; });
  return { promise, release: () => { required(done)(); } };
}
function expectRestoreReserved(): void {
  let lease: ReturnType<typeof beginWaveTransition> | undefined;
  let failure: unknown;
  try { lease = beginWaveTransition(true); } catch (error) { failure = error; }
  finally { if (lease) endWaveTransition(lease); }
  expect(failure).toBeInstanceOf(WaveGuardError);
  expect(failure).toMatchObject({ code: 'restorePending' });
}
function expectReleased(): void {
  const lease = beginWaveTransition(true);
  expect(endWaveTransition(lease)).toBe(false);
}
describe('persistence at wave transition boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    useCombatStore.getState().reset();
    useIronGolemSelectionStore.setState({ selection: null });
    usePlayerStore.getState().setPlayer(createMockPlayer('Wave persistence', 'sorceress'));
    useHydrationStore.getState().setStatus('ready');
  });
  afterEach(() => { useIronGolemSelectionStore.setState({ selection: null }); });
  it.each(['snapshot', 'export', 'flush', ...restores] as const)(
    'refuses %s before IO, flags, timers or domain publications', async kind => {
      const json = payload();
      persistence.startAutoSave();
      useInventoryStore.getState().addCurrency('wishstone', 1);
      const before = domains.map(store => store.getState());
      const hydration = persistence.useHydrationStore.getState();
      const status = persistence.useSaveStatusStore.getState();
      const notified = vi.fn();
      const stops = domains.map(store => store.subscribe(notified));
      const lease = beginWaveTransition(true);
      let failure: unknown;
      try {
        try {
          if (kind === 'snapshot') persistence.snapshotStores();
          else if (kind === 'export') persistence.exportCurrentSave();
          else if (kind === 'flush') await persistence.flushSave();
          else await request(kind, json);
        } catch (error) { failure = error; }
        expect(failure).toBeInstanceOf(WaveGuardError);
        expect(failure).toMatchObject({ code: 'waveBusy' });
        domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
        expect(persistence.useHydrationStore.getState()).toBe(hydration);
        expect(persistence.useSaveStatusStore.getState()).toBe(status);
        expect(persistence.isReplacingSave()).toBe(false);
        expect(notified).not.toHaveBeenCalled();
        for (const spy of [disk.get, disk.put, disk.delete]) expect(spy).not.toHaveBeenCalled();
      } finally { stops.forEach(stop => { stop(); }); endWaveTransition(lease); }
      // Refused explicit operations must not cancel the pre-existing autosave.
      await vi.advanceTimersByTimeAsync(persistence.AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.put).toHaveBeenCalledTimes(1);
    });

  it.each(restores)('reserves %s synchronously before its first queued await', async kind => {
    const json = payload();
    const wait = gate();
    if (kind === 'hydrate' || kind === 'init') disk.get.mockImplementationOnce(async () => { await wait.promise; return undefined; });
    if (kind === 'import') disk.put.mockImplementationOnce(() => wait.promise);
    if (kind === 'delete') disk.delete.mockImplementationOnce(() => wait.promise);
    const pending = request(kind, json);
    try {
      expectRestoreReserved();
      for (const spy of [disk.get, disk.put, disk.delete]) expect(spy).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(0);
      expectRestoreReserved();
      expect(() => persistence.snapshotStores()).toThrow(WaveGuardError);
      expect(() => persistence.exportCurrentSave()).toThrow(WaveGuardError);
      await expect(persistence.flushSave()).rejects.toMatchObject({ code: 'restorePending' });
    } finally { wait.release(); await pending; }
    expectReleased();
  });

  it('retains a separate reservation through each queued restore, including the queue handoff', async () => {
    const first = gate();
    const second = gate();
    disk.get.mockImplementationOnce(async () => { await first.promise; return undefined; })
      .mockImplementationOnce(async () => { await second.promise; return undefined; });
    const one = persistence.hydrateFromSave();
    const two = persistence.hydrateFromSave();
    try {
      expectRestoreReserved();
      await vi.advanceTimersByTimeAsync(0);
      expect(disk.get).toHaveBeenCalledTimes(1);
      first.release();
      await one;
      expectRestoreReserved();
      expect(() => persistence.snapshotStores()).toThrow(WaveGuardError);
      await vi.advanceTimersByTimeAsync(0);
      expect(disk.get).toHaveBeenCalledTimes(2);
      expectRestoreReserved();
    } finally {
      first.release(); second.release();
      await Promise.all([one, two]);
    }
    expectReleased();
    expect(persistence.snapshotStores()).not.toBeNull();
  });

  it('releases a failed import only after error cleanup and retains selection and recording', async () => {
    const json = payload();
    const selection = armIronGolemSelection(required(usePlayerStore.getState().player).id, 'chosen-metal', true);
    const recording = useCombatStore.getState();
    const before = domains.map(store => store.getState());
    const wait = gate();
    disk.put.mockImplementationOnce(async () => { await wait.promise; throw new Error('Controlled import IO failure'); });
    const pending = persistence.importIntoStores(json);
    const rejected = expect(pending).rejects.toThrow('Controlled import IO failure');
    try {
      expectRestoreReserved();
      await vi.advanceTimersByTimeAsync(0);
      expectRestoreReserved();
      expect(persistence.isReplacingSave()).toBe(true);
    } finally { wait.release(); await rejected; }
    expectReleased();
    expect(persistence.isReplacingSave()).toBe(false);
    expect(persistence.useSaveStatusStore.getState().error).toBe('Controlled import IO failure');
    domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(useCombatStore.getState()).toBe(recording);
    expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
    expect(disk.state.record).toBeUndefined();
    await persistence.importIntoStores(json);
    expectReleased();
    expect(disk.state.record).toBeDefined();
  });

  it('retries initialization after busy refusal and shares the accepted concurrent flight', async () => {
    const lease = beginWaveTransition(true);
    try { expect(() => persistence.initPersistence()).toThrow(WaveGuardError); }
    finally { endWaveTransition(lease); }
    const wait = gate();
    disk.get.mockImplementationOnce(async () => { await wait.promise; return undefined; });
    const one = persistence.initPersistence();
    const two = persistence.initPersistence();
    try {
      expect(two).toBe(one);
      expectRestoreReserved();
      await vi.advanceTimersByTimeAsync(0);
      expect(disk.get).toHaveBeenCalledTimes(1);
    } finally { wait.release(); await one; }
    expectReleased();
    expect(persistence.useHydrationStore.getState().status).toBe('ready');
    expect(persistence.initPersistence()).toBe(one);
  });

  it('refuses every snapshot boundary before the no-player short circuit', async () => {
    usePlayerStore.getState().reset();
    const before = domains.map(store => store.getState());
    const lease = beginWaveTransition(true);
    try {
      expect(() => persistence.snapshotStores()).toThrow(WaveGuardError);
      expect(() => persistence.exportCurrentSave()).toThrow(WaveGuardError);
      await expect(persistence.flushSave()).rejects.toMatchObject({ code: 'waveBusy' });
      domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(disk.put).not.toHaveBeenCalled();
    } finally { endWaveTransition(lease); }
    expect(persistence.snapshotStores()).toBeNull();
    expect(persistence.exportCurrentSave()).toBeNull();
    expect(persistence.flushSave()).toBeNull();
  });

  it('coalesces wave mutations into one normal debounce after the owning transition unwinds', async () => {
    persistence.startAutoSave();
    const lease = beginWaveTransition(true);
    let wake = false;
    try {
      useInventoryStore.getState().addCurrency('wishstone', 1);
      useInventoryStore.getState().addCurrency('wishstone', 2);
      useMetaStore.getState().setLocale('en');
      await vi.advanceTimersByTimeAsync(persistence.AUTO_SAVE_DEBOUNCE_MS * 2);
      expect(disk.put).not.toHaveBeenCalled();
    } finally { wake = endWaveTransition(lease); }
    expect(wake).toBe(true);
    persistence.resumeWaveDeferredSave();
    await vi.advanceTimersByTimeAsync(persistence.AUTO_SAVE_DEBOUNCE_MS - 1);
    expect(disk.put).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(disk.put).toHaveBeenCalledTimes(1);
    expect(savedData().inventory.currencies.wishstone).toBe(3);
    expect(savedData().meta.settings.locale).toBe('en');
    await vi.advanceTimersByTimeAsync(persistence.AUTO_SAVE_DEBOUNCE_MS);
    expect(disk.put).toHaveBeenCalledTimes(1);
    expectReleased();
    useInventoryStore.getState().addCurrency('wishstone', 4);
    await vi.advanceTimersByTimeAsync(persistence.AUTO_SAVE_DEBOUNCE_MS);
    expect(disk.put).toHaveBeenCalledTimes(2);
    expect(savedData().inventory.currencies.wishstone).toBe(7);
  });

  it('saves and exports persistent fields without touching or serializing transient slices', async () => {
    const selection = armIronGolemSelection(required(usePlayerStore.getState().player).id, 'chosen-metal', true);
    useCombatStore.setState({ currentWave: 7, ironGolemReplayLocked: true });
    useMetaStore.getState().updateIdleState({ lastOnline: NOW });
    const recording = useCombatStore.getState();
    const before = domains.map(store => store.getState());
    const expected = required(persistence.snapshotStores());
    const exported = JSON.parse(required(persistence.exportCurrentSave())) as unknown;
    expect(exported).toEqual(toJsonSafe(expected));
    await persistence.flushSave();
    expect(savedData()).toEqual(expected);
    expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
    expect(useCombatStore.getState()).toBe(recording);
    domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  });


  it.each([
    { action: 'set', present: true, owner: 'wave' }, { action: 'reset', present: true, owner: 'wave' },
    { action: 'set', present: false, owner: 'wave' }, { action: 'reset', present: false, owner: 'wave' },
    { action: 'set', present: true, owner: 'restore' }, { action: 'reset', present: true, owner: 'restore' },
    { action: 'set', present: false, owner: 'restore' }, { action: 'reset', present: false, owner: 'restore' }
  ] as const)('refuses public hero $action with player=$present during $owner ownership', async ({ action, present, owner }) => {
    if (!present) usePlayerStore.getState().reset();
    const before = domains.map(store => store.getState());
    const notified = vi.fn();
    const stops = domains.map(store => store.subscribe(notified));
    const read = vi.fn(() => { throw new Error('Player argument must not be read'); });
    const player = createMockPlayer('Replacement', 'amazon');
    Object.defineProperty(player, 'id', { get: read });
    const wait = gate();
    disk.get.mockImplementationOnce(async () => { await wait.promise; return undefined; });
    const lease = owner === 'wave' ? beginWaveTransition(true) : undefined;
    const pending = owner === 'restore' ? persistence.hydrateFromSave() : undefined;
    const check = () => {
      const run = () => {
        if (action === 'set') usePlayerStore.getState().setPlayer(player);
        else usePlayerStore.getState().reset();
      };
      expect(run).toThrow(WaveGuardError);
      expect(run).toThrow(owner === 'wave' ? 'waveBusy' : 'restorePending');
      domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(read).not.toHaveBeenCalled();
      expect(notified).not.toHaveBeenCalled();
    };
    try {
      check(); // Restore is reserved before hydration's loading publication.
      await vi.advanceTimersByTimeAsync(0);
      check();
    } finally {
      stops.forEach(stop => { stop(); });
      if (lease) endWaveTransition(lease);
      wait.release(); await pending;
    }
    if (action === 'set') {
      const next = createMockPlayer('Accepted replacement', 'amazon');
      usePlayerStore.getState().setPlayer(next);
      expect(usePlayerStore.getState().player).toBe(next);
    } else {
      usePlayerStore.getState().reset();
      expect(usePlayerStore.getState().player).toBeNull();
    }
  });

  it.each(['wave', 'restore'] as const)('refuses no-player creation before preparation during %s ownership', async owner => {
    usePlayerStore.getState().reset();
    const before = domains.map(store => store.getState());
    const notified = vi.fn();
    const stops = domains.map(store => store.subscribe(notified));
    const read = vi.fn(() => { throw new Error('Creation name must not be read'); });
    const name = { trim: read } as unknown as string;
    const wait = gate();
    disk.get.mockImplementationOnce(async () => { await wait.promise; return undefined; });
    const lease = owner === 'wave' ? beginWaveTransition(true) : undefined;
    const pending = owner === 'restore' ? persistence.hydrateFromSave() : undefined;
    const check = () => {
      expect(() => createCharacter('Rejected creation', 'amazon')).toThrow(WaveGuardError);
      expect(() => createCharacter(name, 'amazon')).toThrow(owner === 'wave' ? 'waveBusy' : 'restorePending');
      expect(read).not.toHaveBeenCalled();
      domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(notified).not.toHaveBeenCalled();
    };
    try {
      expect(useHydrationStore.getState().status).toBe('ready');
      check();
      await vi.advanceTimersByTimeAsync(0);
      check();
    } finally {
      stops.forEach(stop => { stop(); });
      if (lease) endWaveTransition(lease);
      wait.release(); await pending;
    }
    expect(createCharacter('Accepted hero', 'amazon')).toMatchObject({ ok: true });
    expect(usePlayerStore.getState().player?.name).toBe('Accepted hero');
  });

  it('permits exact restore-owned hero replacement and clearing without publishing other domains', () => {
    const before = domains.map(store => store.getState());
    const notified = vi.fn();
    const stop = usePlayerStore.subscribe(notified);
    const lease = reserveWaveRestore();
    const player = createMockPlayer('Restored hero', 'amazon');
    try {
      replacePlayerAfterRestore(player, lease);
      expect(usePlayerStore.getState().player).toBe(player);
      expect(notified).toHaveBeenCalledTimes(1);
      replacePlayerAfterRestore(null, lease);
      expect(usePlayerStore.getState().player).toBeNull();
      expect(notified).toHaveBeenCalledTimes(2);
      domains.slice(1).forEach((store, index) => { expect(store.getState()).toBe(before[index + 1]); });
      expect(() => { usePlayerStore.getState().setPlayer(player); }).toThrow('restorePending');
      expect(notified).toHaveBeenCalledTimes(2);
    } finally { stop(); releaseWaveRestore(lease); }
    usePlayerStore.getState().setPlayer(player);
    expect(usePlayerStore.getState().player).toBe(player);
    usePlayerStore.getState().reset();
    expect(usePlayerStore.getState().player).toBeNull();
  });

  it.each(['stale', 'fabricated'] as const)('refuses a %s restore lease before any hero publication', kind => {
    const expired = reserveWaveRestore();
    releaseWaveRestore(expired);
    const owner = reserveWaveRestore();
    const refused = kind === 'stale' ? expired : { ...owner };
    const before = domains.map(store => store.getState());
    const notified = vi.fn();
    const stops = domains.map(store => store.subscribe(notified));
    try {
      for (const player of [createMockPlayer('Refused restore', 'amazon'), null]) {
        expect(() => { replacePlayerAfterRestore(player, refused); }).toThrow(WaveGuardError);
        expect(() => { replacePlayerAfterRestore(player, refused); }).toThrow('invalidLease');
      }
      domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(notified).not.toHaveBeenCalled();
      expect(() => { usePlayerStore.getState().reset(); }).toThrow('restorePending');
      replacePlayerAfterRestore(null, owner);
      expect(usePlayerStore.getState().player).toBeNull();
      expect(notified).toHaveBeenCalledTimes(1);
    } finally { stops.forEach(stop => { stop(); }); releaseWaveRestore(owner); }
    const player = createMockPlayer('After release', 'amazon');
    usePlayerStore.getState().setPlayer(player);
    expect(usePlayerStore.getState().player).toBe(player);
  });

});


describe('successful restore transient combat cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    abortSubAreaRun();
    useCombatStore.getState().reset();
    useIronGolemSelectionStore.setState({ selection: null });
  });
  afterEach(() => {
    abortSubAreaRun();
    useCombatStore.getState().reset();
    useIronGolemSelectionStore.setState({ selection: null });
  });

  function startTransientCombat() {
    usePlayerStore.getState().setPlayer(createMockPlayer('Live hero', 'sorceress'));
    useHydrationStore.getState().setStatus('ready');
    const run = startSubAreaRun({ runSeed: 123, challengeOrdinal: 0 });
    expect(run).not.toBeNull();
    expect(hasActiveSubAreaRun()).toBe(true);
    expect(useCombatStore.getState().recordedEvents.length).toBeGreaterThan(0);
    const selection = armIronGolemSelection(required(usePlayerStore.getState().player).id, 'chosen-metal', true);
    return { recording: useCombatStore.getState(), selection };
  }

  it.each(restores)('clears run, recording and selection only after successful %s IO', async kind => {
    const data = fixture();
    const emptyCombat = useCombatStore.getState();
    const transient = startTransientCombat();
    const before = domains.map(store => store.getState());
    const wait = gate();
    if (kind === 'hydrate' || kind === 'init') {
      disk.get.mockImplementationOnce(async () => { await wait.promise; return disk.state.record; });
    } else if (kind === 'import') {
      disk.put.mockImplementationOnce(async record => { await wait.promise; disk.state.record = structuredClone(record); });
    } else {
      disk.delete.mockImplementationOnce(async () => { await wait.promise; disk.state.record = undefined; });
    }
    persistence.startAutoSave();
    const notified = vi.fn();
    const stops = [useCombatStore.subscribe(notified), useIronGolemSelectionStore.subscribe(notified)];
    const pending = request(kind, JSON.stringify(toJsonSafe(data)));
    try {
      expectRestoreReserved();
      await vi.advanceTimersByTimeAsync(0);
      expect(hasActiveSubAreaRun()).toBe(true);
      expect(useCombatStore.getState()).toBe(transient.recording);
      expect(useIronGolemSelectionStore.getState().selection).toBe(transient.selection);
      domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(notified).not.toHaveBeenCalled();
    } finally {
      wait.release();
      try { await pending; }
      finally { stops.forEach(stop => { stop(); }); }
    }
    expect(hasActiveSubAreaRun()).toBe(false);
    expect(useCombatStore.getState()).toEqual(emptyCombat);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
    expect(usePlayerStore.getState().player?.name ?? null).toBe(kind === 'delete' ? null : 'Saved');
    expectReleased();
    if (kind === 'hydrate' || kind === 'init') {
      await vi.advanceTimersByTimeAsync(persistence.AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.put).toHaveBeenCalledTimes(kind === 'init' ? 1 : 0);
    }
    startTransientCombat(); // New wave/selection work normally after the reservation releases.
  });

  it.each(['hydrate', 'init'] as const)('retains transients when %s finds no save', async kind => {
    const transient = startTransientCombat();
    const before = domains.map(store => store.getState());
    await request(kind, '');
    expect(hasActiveSubAreaRun()).toBe(true);
    expect(useCombatStore.getState()).toBe(transient.recording);
    expect(useIronGolemSelectionStore.getState().selection).toBe(transient.selection);
    domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(disk.put).not.toHaveBeenCalled();
    expectReleased();
  });

  it.each(['hydrate-read', 'hydrate-validation', 'init-read', 'init-write', 'import-validation', 'import-write', 'delete'] as const)(
    'retains exact transient and domain references after %s failure', async failure => {
      const data = fixture();
      const transient = startTransientCombat();
      const before = domains.map(store => store.getState());
      const originalDisk = disk.state.record;
      const notified = vi.fn();
      const stops = [useCombatStore.subscribe(notified), useIronGolemSelectionStore.subscribe(notified)];
      if (failure.endsWith('-read')) disk.get.mockRejectedValueOnce(new Error('Read unavailable'));
      if (failure.endsWith('-write')) disk.put.mockRejectedValueOnce(new Error('Write unavailable'));
      if (failure === 'delete') disk.delete.mockRejectedValueOnce(new Error('Delete unavailable'));
      if (failure === 'hydrate-validation') {
        disk.state.record = { ...required(originalDisk), data: { ...data, player: { ...data.player, level: -1 } } };
      }
      try {
        const kind = failure.split('-')[0] as Restore;
        const json = failure === 'import-validation' ? '{}' : JSON.stringify(toJsonSafe(data));
        const result = await request(kind, json).then(() => null, error => error as unknown);
        if (kind === 'import' || kind === 'delete') expect(result).toBeInstanceOf(Error);
        else expect(useHydrationStore.getState().status).toBe('error');
        expect(hasActiveSubAreaRun()).toBe(true);
        expect(useCombatStore.getState()).toBe(transient.recording);
        expect(useIronGolemSelectionStore.getState().selection).toBe(transient.selection);
        domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
        expect(notified).not.toHaveBeenCalled();
        if (failure !== 'hydrate-validation') expect(disk.state.record).toBe(originalDisk);
        expectReleased();
      } finally { stops.forEach(stop => { stop(); }); }
      // A real retry installs the save and cleans up after the failure releases ownership.
      await importIntoStores(JSON.stringify(toJsonSafe(data)));
      expect(hasActiveSubAreaRun()).toBe(false);
      expect(useIronGolemSelectionStore.getState().selection).toBeNull();
      expect(useCombatStore.getState().recordedEvents).toEqual([]);
    }
  );


  it.each(['released', 'copied'] as const)('refuses a %s lease without changing transients or the live owner', kind => {
    const transient = startTransientCombat();
    const before = domains.map(store => store.getState());
    const old = reserveWaveRestore();
    releaseWaveRestore(old);
    const owner = reserveWaveRestore();
    const invalid = kind === 'released' ? old : { ...owner };
    const notified = vi.fn();
    const stops = [useCombatStore.subscribe(notified), useIronGolemSelectionStore.subscribe(notified)];
    try {
      expect(() => { clearCombatAfterRestore(invalid); }).toThrow(WaveGuardError);
      expect(() => { clearCombatAfterRestore(invalid); }).toThrow('invalidLease');
      expect(hasActiveSubAreaRun()).toBe(true);
      expect(useCombatStore.getState()).toBe(transient.recording);
      expect(useIronGolemSelectionStore.getState().selection).toBe(transient.selection);
      expect(notified).not.toHaveBeenCalled();
      expectRestoreReserved();
      clearCombatAfterRestore(owner);
      expect(hasActiveSubAreaRun()).toBe(false);
      expect(useCombatStore.getState()).toMatchObject({
        inCombat: false, recordedEvents: [], outcome: null, subAreaRunId: null,
        ironGolemReplayLocked: false, runVictory: false, runDefeat: false
      });
      expect(useIronGolemSelectionStore.getState().selection).toBeNull();
      domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expectRestoreReserved(); // Cleanup does not release another caller's ownership.
    } finally {
      stops.forEach(stop => { stop(); });
      releaseWaveRestore(owner);
    }
    expectReleased();
    startTransientCombat();
  });

});
