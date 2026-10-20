/** Real persistence and adapter, with only the IndexedDB boundary faked. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveCurrent } from '@/engine/types/save';
import type { SaveRecord } from './save-adapter';

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

import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import {
  __resetPersistenceForTests, snapshotStores, hydrateFromSave, importIntoStores,
  deleteCurrentSave, initPersistence, startAutoSave, stopAutoSave,
  useHydrationStore, useSaveStatusStore
} from './persistence';

const NOW = 1_792_454_400_000;
const domains = [usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, useFormationStore] as const;

function required<T>(value: T | null | undefined): T {
  if (value === undefined || value === null) throw new Error('Missing fixture');
  return value;
}
function saved(): SaveCurrent {
  return required(disk.state.record).data as SaveCurrent;
}
function deferred() {
  let resolve: (() => void) | undefined;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, release: () => { required(resolve)(); } };
}
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}
async function loadBonus(): Promise<SaveCurrent> {
  usePlayerStore.getState().setPlayer(createMockPlayer('Checkpoint', 'sorceress'));
  const source = required(snapshotStores());
  const data: SaveCurrent = { ...source, timestamp: NOW,
    meta: { ...source.meta, idleState: { lastOnline: NOW,
      offlineTime: 123, activeMultiplier: 1.32, multiplierSecondsRemaining: 4800,
      idleTarget: 'den' } } };
  disk.state.record = { id: 'current', version: 7, timestamp: data.timestamp, data };
  await hydrateFromSave();
  return data;
}
function event(kind: 'hidden' | 'visible' | 'pagehide'): void {
  if (kind === 'pagehide') window.dispatchEvent(new Event('pagehide'));
  else {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(kind);
    document.dispatchEvent(new Event('visibilitychange'));
  }
}

beforeEach(() => {
  __resetPersistenceForTests();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  for (const store of domains) store.getState().reset();
  disk.state.record = undefined;
  disk.get.mockReset().mockImplementation(() => Promise.resolve(disk.state.record));
  disk.put.mockReset().mockImplementation(record => {
    disk.state.record = structuredClone(record);
    return Promise.resolve();
  });
  disk.delete.mockReset().mockImplementation(() => {
    disk.state.record = undefined;
    return Promise.resolve();
  });
});
afterEach(() => {
  __resetPersistenceForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('periodic and page lifecycle checkpoints', () => {
  it('checkpoints a quiet online session every30seconds without changing raw domain state', async () => {
    const original = await loadBonus();
    const raw = useMetaStore.getState();
    const published = vi.fn();
    const unsubscribe = useMetaStore.subscribe(published);
    startAutoSave();
    try {
      await vi.advanceTimersByTimeAsync(29_999);
      expect(disk.put).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(disk.put).toHaveBeenCalledTimes(1);
      expect(saved().timestamp).toBe(NOW + 30_000);
      expect(saved().meta.idleState).toEqual({ ...original.meta.idleState,
        lastOnline: NOW + 30_000, activeMultiplier: 1.318,
        multiplierSecondsRemaining: 4770 });
      await vi.advanceTimersByTimeAsync(570_000);
      expect(disk.put).toHaveBeenCalledTimes(20);
      expect(saved().meta.idleState).toEqual({ ...original.meta.idleState,
        lastOnline: NOW + 600_000, activeMultiplier: 1.28,
        multiplierSecondsRemaining: 4200 });
      expect(useMetaStore.getState()).toBe(raw);
      expect(published).not.toHaveBeenCalled();
    } finally { unsubscribe(); }
  });

  it.each(['hidden', 'visible', 'pagehide'] as const)('projects a %s checkpoint immediately using the current clock', async kind => {
    const original = await loadBonus();
    const raw = useMetaStore.getState();
    startAutoSave();
    vi.setSystemTime(NOW + 600_000);
    event(kind);
    await settle();
    expect(disk.put).toHaveBeenCalledTimes(1);
    expect(saved()).toEqual({ ...original, timestamp: NOW + 600_000,
      meta: { ...original.meta, idleState: { ...original.meta.idleState,
        lastOnline: NOW + 600_000, activeMultiplier: 1.28,
        multiplierSecondsRemaining: 4200 } } });
    expect(useMetaStore.getState()).toBe(raw);
  });

  it('treats a throttled hidden page as online and does not grant bonus on return', async () => {
    await loadBonus();
    const raw = useMetaStore.getState();
    startAutoSave();
    event('hidden');
    await settle();
    // Jump wall time without running timer callbacks, as a throttled page may do.
    vi.setSystemTime(NOW + 600_000);
    event('visible');
    await settle();
    expect(saved().meta.idleState).toMatchObject({ offlineTime: 123,
      activeMultiplier: 1.28, multiplierSecondsRemaining: 4200 });
    vi.setSystemTime(NOW + 4_800_000);
    event('visible');
    await settle();
    expect(saved().meta.idleState).toMatchObject({ offlineTime: 123,
      activeMultiplier: 1, multiplierSecondsRemaining: 0 });
    expect(useMetaStore.getState()).toBe(raw);
  });

  it('owns one set of callbacks and completely stops future writes before restarting', async () => {
    await loadBonus();
    startAutoSave();
    startAutoSave();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(disk.put).toHaveBeenCalledTimes(1);
    event('hidden');
    await settle();
    expect(disk.put).toHaveBeenCalledTimes(2);
    useInventoryStore.getState().addCurrency('rune-shard', 1);
    stopAutoSave();
    stopAutoSave();
    event('hidden'); event('visible'); event('pagehide');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(disk.put).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
    startAutoSave();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(disk.put).toHaveBeenCalledTimes(3);
    expect(saved().inventory.currencies['rune-shard']).toBe(1);
  });

  it('does not write before start or without a character', async () => {
    await loadBonus();
    event('pagehide');
    await vi.advanceTimersByTimeAsync(30_000);
    expect(disk.put).not.toHaveBeenCalled();
    usePlayerStore.getState().reset();
    startAutoSave();
    event('hidden'); event('visible'); event('pagehide');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(disk.put).not.toHaveBeenCalled();
  });

  it.each(['storage', 'projection'] as const)('contains background %s failure and retries the current projection', async failure => {
    await loadBonus();
    const raw = useMetaStore.getState();
    const before = structuredClone(disk.state.record);
    startAutoSave();
    if (failure === 'storage') disk.put.mockRejectedValueOnce(new Error('Checkpoint quota'));
    else vi.spyOn(Date, 'now').mockReturnValue(Infinity);
    event('pagehide');
    await settle();
    expect(useSaveStatusStore.getState().error).toMatch(failure === 'storage' ? /quota/ : /finite/);
    expect(disk.state.record).toEqual(before);
    expect(useMetaStore.getState()).toBe(raw);
    vi.restoreAllMocks();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(saved().timestamp).toBe(NOW + 30_000);
    expect(saved().meta.idleState.multiplierSecondsRemaining).toBe(4770);
    expect(useSaveStatusStore.getState().error).toBeNull();
  });

  it('keeps checkpoints blocked after a failed startup load', async () => {
    await loadBonus();
    disk.get.mockRejectedValueOnce(new Error('Read unavailable'));
    await initPersistence();
    event('pagehide');
    await vi.advanceTimersByTimeAsync(30_000);
    expect(disk.put).not.toHaveBeenCalled();
    expect(useHydrationStore.getState().status).toBe('error');
    expect(useSaveStatusStore.getState().error).toBe('Read unavailable');
  });

  it.each(['hydrate', 'startup'] as const)('suppresses callbacks during delayed %s and resumes after publication', async operation => {
    await loadBonus();
    const gate = deferred();
    disk.get.mockImplementationOnce(async () => { await gate.promise; return disk.state.record; });
    startAutoSave();
    const pending = operation === 'hydrate' ? hydrateFromSave() : initPersistence();
    await settle();
    try {
      event('pagehide');
      await vi.advanceTimersByTimeAsync(30_000);
      expect(disk.put).not.toHaveBeenCalled();
    } finally { gate.release(); await pending; }
    disk.put.mockClear();
    event('pagehide');
    await settle();
    expect(disk.put).toHaveBeenCalledTimes(1);
    expect(saved().timestamp).toBe(NOW + 30_000);
  });

  it.each(['import', 'delete'] as const)('suppresses callbacks throughout a delayed %s', async operation => {
    const original = await loadBonus();
    const gate = deferred();
    const imported = { ...original, player: { ...original.player, name: 'Replacement' } };
    if (operation === 'import') disk.put.mockImplementationOnce(async record => {
      await gate.promise; disk.state.record = structuredClone(record);
    });
    else disk.delete.mockImplementationOnce(async () => {
      await gate.promise; disk.state.record = undefined;
    });
    startAutoSave();
    const pending = operation === 'import' ? importIntoStores(JSON.stringify(imported)) : deleteCurrentSave();
    await settle();
    const initialWrites = disk.put.mock.calls.length;
    try {
      event('hidden'); event('visible'); event('pagehide');
      await vi.advanceTimersByTimeAsync(60_000);
      expect(disk.put).toHaveBeenCalledTimes(initialWrites);
    } finally { gate.release(); await pending; }
    await vi.advanceTimersByTimeAsync(30_000);
    if (operation === 'import') {
      expect(saved().player.name).toBe('Replacement');
      expect(saved().meta.idleState.multiplierSecondsRemaining).toBe(4770);
    } else {
      expect(disk.state.record).toBeUndefined();
      expect(disk.put).not.toHaveBeenCalled();
    }
  });

  it('blocks a lifecycle callback between raw hydration and an already queued import', async () => {
    const original = await loadBonus();
    const gate = deferred();
    disk.get.mockImplementationOnce(async () => { await gate.promise; return disk.state.record; });
    startAutoSave();
    const hydration = hydrateFromSave();
    await settle();
    const imported = { ...original, player: { ...original.player, name: 'Queued' } };
    const replacement = importIntoStores(JSON.stringify(imported));
    const unsubscribe = useHydrationStore.subscribe(state => {
      if (state.status === 'ready') event('pagehide');
    });
    try {
      gate.release();
      await hydration;
      await replacement;
      await settle();
      expect(disk.put).toHaveBeenCalledTimes(1);
      expect(saved().player.name).toBe('Queued');
    } finally { unsubscribe(); }
  });

  it('allows an already submitted write to finish after stop without starting another', async () => {
    await loadBonus();
    const gate = deferred();
    disk.put.mockImplementationOnce(async record => {
      await gate.promise; disk.state.record = structuredClone(record);
    });
    startAutoSave();
    vi.setSystemTime(NOW + 600_000);
    event('pagehide');
    await settle();
    stopAutoSave();
    gate.release();
    await settle();
    event('pagehide');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(disk.put).toHaveBeenCalledTimes(1);
    expect(saved().meta.idleState.multiplierSecondsRemaining).toBe(4200);
    expect(vi.getTimerCount()).toBe(0);
  });
});
