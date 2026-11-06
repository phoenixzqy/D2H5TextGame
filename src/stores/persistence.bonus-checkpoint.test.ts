import { readStoredSaveJson } from '../../tests/helpers/stored-save';
/** Real store/orchestration/adapter; fake only the IndexedDB boundary. */
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
  __resetPersistenceForTests, snapshotStores, flushSave, exportCurrentSave,
  hydrateFromSave, importIntoStores, initPersistence, startAutoSave,
  useSaveStatusStore, AUTO_SAVE_DEBOUNCE_MS
} from './persistence';

const NOW = 1_792_454_400_000;
const TEN_MINUTES = 600_000;
const domains = [usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, useFormationStore] as const;

function required<T>(value: T | null | undefined): T {
  if (value === undefined || value === null) throw new Error('Missing fixture');
  return value;
}

function savedData(): SaveCurrent {
  return readStoredSaveJson(disk.state.record) as SaveCurrent;
}

function exportedData(): SaveCurrent {
  return JSON.parse(required(exportCurrentSave())) as SaveCurrent;
}

async function loadBonus(): Promise<SaveCurrent> {
  usePlayerStore.getState().setPlayer(createMockPlayer('Bonus', 'sorceress'));
  const source = required(snapshotStores());
  const data: SaveCurrent = { ...source, timestamp: NOW - 86_400_000,
    meta: { ...source.meta, idleState: { lastOnline: NOW - 86_400_000,
      offlineTime: 123, activeMultiplier: 1.32, multiplierSecondsRemaining: 4800,
      idleTarget: 'den' } } };
  disk.state.record = { id: 'current', version: 7, timestamp: data.timestamp, data };
  await hydrateFromSave();
  return data;
}

beforeEach(() => {
  __resetPersistenceForTests();
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  for (const store of domains) store.getState().reset();
  disk.state.record = undefined;
  disk.get.mockReset().mockImplementation(() => Promise.resolve(disk.state.record));
  disk.put.mockReset().mockImplementation(record => {
    disk.state.record = structuredClone(record);
    return Promise.resolve();
  });
});

afterEach(() => {
  __resetPersistenceForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('online bonus save checkpoints', () => {
  it('saves elapsed bonus using one timestamp while raw restored fields remain exact', async () => {
    const before = await loadBonus();
    const raw = useMetaStore.getState().idleState;
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    await flushSave();
    const saved = savedData();
    expect(saved.meta.idleState).toEqual({ ...before.meta.idleState,
      lastOnline: NOW + TEN_MINUTES, activeMultiplier: 1.28, multiplierSecondsRemaining: 4200 });
    expect(saved.timestamp).toBe(NOW + TEN_MINUTES);
    expect(saved).toEqual({ ...before, timestamp: saved.timestamp,
      meta: { ...before.meta, idleState: saved.meta.idleState } });
    expect(useMetaStore.getState().idleState).toBe(raw);
    expect(required(snapshotStores()).meta.idleState).toBe(raw);
  });

  it('exports the same projected window without writing or extending it on repeated exports', async () => {
    await loadBonus();
    const diskBefore = structuredClone(disk.state.record);
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    expect(exportedData().meta.idleState.activeMultiplier).toBeCloseTo(1.28, 12);
    vi.mocked(Date.now).mockReturnValue(NOW + 2 * TEN_MINUTES);
    expect(exportedData().meta.idleState).toMatchObject({
      lastOnline: NOW + 2 * TEN_MINUTES, activeMultiplier: 1.24, multiplierSecondsRemaining: 3600 });
    expect(disk.state.record).toEqual(diskBefore);
    expect(disk.put).not.toHaveBeenCalled();
  });

  it('keeps an exact imported old timestamp but starts its online decay at successful publication', async () => {
    const data = await loadBonus();
    await importIntoStores(JSON.stringify(data));
    expect(useMetaStore.getState().idleState).toEqual(data.meta.idleState);
    expect(savedData()).toEqual(data);
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    await flushSave();
    expect(savedData().meta.idleState).toMatchObject({
      activeMultiplier: 1.28, multiplierSecondsRemaining: 4200 });
  });

  it('does not refresh or double-consume after repeated successful saves', async () => {
    await loadBonus();
    const before = useMetaStore.getState();
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    await flushSave();
    vi.mocked(Date.now).mockReturnValue(NOW + 2 * TEN_MINUTES);
    await flushSave();
    expect(savedData().meta.idleState).toMatchObject({
      activeMultiplier: 1.24, multiplierSecondsRemaining: 3600 });
    expect(useMetaStore.getState()).toBe(before);
    expect(exportedData().meta.idleState).toEqual(savedData().meta.idleState);
  });

  it('samples the projected snapshot timestamp once', async () => {
    await loadBonus();
    vi.mocked(Date.now).mockReturnValueOnce(NOW + TEN_MINUTES).mockReturnValue(NOW + 2 * TEN_MINUTES);
    await flushSave();
    expect(savedData().timestamp).toBe(NOW + TEN_MINUTES);
    expect(savedData().meta.idleState).toMatchObject({
      lastOnline: NOW + TEN_MINUTES, activeMultiplier: 1.28, multiplierSecondsRemaining: 4200 });
  });

  it('keeps the raw tuple/basis and disk on write failure, then retries without refresh', async () => {
    await loadBonus();
    const before = useMetaStore.getState();
    const diskBefore = structuredClone(disk.state.record);
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    disk.put.mockRejectedValueOnce(new Error('Checkpoint quota'));
    await expect(flushSave()).rejects.toThrow('Checkpoint quota');
    expect(useSaveStatusStore.getState().error).toBe('Checkpoint quota');
    expect(disk.state.record).toEqual(diskBefore);
    expect(useMetaStore.getState()).toBe(before);
    vi.mocked(Date.now).mockReturnValue(NOW + 2 * TEN_MINUTES);
    await flushSave();
    expect(savedData().meta.idleState).toMatchObject({
      activeMultiplier: 1.24, multiplierSecondsRemaining: 3600 });
    expect(useMetaStore.getState()).toBe(before);
    expect(useSaveStatusStore.getState().error).toBeNull();
  });

  it.each(['explicit', 'background'] as const)('contains %s projection failure and supports a later save', async mode => {
    await loadBonus();
    const before = useMetaStore.getState();
    const diskBefore = structuredClone(disk.state.record);
    vi.mocked(Date.now).mockReturnValue(Infinity);
    if (mode === 'explicit') {
      const pending = flushSave(); // Must return a rejected Promise, never throw synchronously.
      await expect(pending).rejects.toThrow(/finite/);
    } else {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      startAutoSave();
      useInventoryStore.getState().addCurrency('rune-shard', 1);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
    }
    expect(useSaveStatusStore.getState().error).toMatch(/finite/);
    expect(disk.put).not.toHaveBeenCalled();
    expect(disk.state.record).toEqual(diskBefore);
    expect(useMetaStore.getState()).toBe(before);
    expect(() => exportCurrentSave()).toThrow(/finite/);
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    await flushSave();
    expect(savedData().meta.idleState).toMatchObject({
      activeMultiplier: 1.28, multiplierSecondsRemaining: 4200 });
    expect(useSaveStatusStore.getState().error).toBeNull();
  });

  it('anchors exact import at publication after delayed storage succeeds', async () => {
    const data = await loadBonus();
    const before = useMetaStore.getState();
    let release: (() => void) | undefined;
    const gate = new Promise<void>(resolve => { release = resolve; });
    disk.put.mockImplementationOnce(async record => {
      await gate;
      disk.state.record = structuredClone(record);
    });
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    const pending = importIntoStores(JSON.stringify(data));
    try {
      await vi.waitFor(() => { expect(disk.put).toHaveBeenCalledTimes(1); });
      expect(useMetaStore.getState()).toBe(before);
      vi.mocked(Date.now).mockReturnValue(NOW + 2 * TEN_MINUTES);
    } finally {
      required(release)();
      await pending;
    }
    expect(useMetaStore.getState().idleState).toEqual(data.meta.idleState);
    expect(useMetaStore.getState().readIdleBonus(NOW + 3 * TEN_MINUTES)).toMatchObject({
      activeMultiplier: 1.28, multiplierSecondsRemaining: 4200 });
  });

  it('keeps the prior clock basis on failed import and failed raw hydration', async () => {
    const data = await loadBonus();
    const before = useMetaStore.getState();
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    disk.put.mockRejectedValueOnce(new Error('Restore quota'));
    await expect(importIntoStores(JSON.stringify(data))).rejects.toThrow('Restore quota');
    disk.get.mockRejectedValueOnce(new Error('Read unavailable'));
    expect(await hydrateFromSave()).toBe(false);
    expect(useMetaStore.getState()).toBe(before);
    expect(useMetaStore.getState().readIdleBonus(NOW + 2 * TEN_MINUTES)).toMatchObject({
      activeMultiplier: 1.24, multiplierSecondsRemaining: 3600 });
  });

  it('starts startup consumption at reconciliation rather than after its delayed write', async () => {
    await loadBonus();
    __resetPersistenceForTests();
    for (const store of domains) store.getState().reset();
    let release: (() => void) | undefined;
    const gate = new Promise<void>(resolve => { release = resolve; });
    disk.put.mockImplementationOnce(async record => {
      await gate;
      disk.state.record = structuredClone(record);
    });
    const pending = initPersistence();
    try {
      await vi.waitFor(() => { expect(disk.put).toHaveBeenCalledTimes(1); });
      vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    } finally {
      required(release)();
      await pending;
    }
    // The 24-hour gap grants the capped1.5/7200 tuple at NOW, then600s online pass.
    expect(useMetaStore.getState().readIdleBonus(NOW + TEN_MINUTES)).toMatchObject({
      multiplierSecondsRemaining: 6600 });
    expect(useMetaStore.getState().readIdleBonus(NOW + TEN_MINUTES).activeMultiplier)
      .toBeCloseTo(1 + 0.5 * 6600 / 7200, 12);
  });
});

describe('shared online bonus clock and partial updates', () => {
  it('projects without publication, normalizes expiry and clamps rollback without changing the basis', async () => {
    await loadBonus();
    const before = useMetaStore.getState();
    const published = vi.fn();
    const stop = useMetaStore.subscribe(published);
    try {
      expect(before.readIdleBonus(NOW - TEN_MINUTES)).toMatchObject({
        activeMultiplier: 1.32, multiplierSecondsRemaining: 4800 });
      expect(before.readIdleBonus(NOW + TEN_MINUTES)).toMatchObject({
        activeMultiplier: 1.28, multiplierSecondsRemaining: 4200 });
      expect(before.readIdleBonus(NOW + 4_800_000)).toMatchObject({
        activeMultiplier: 1, multiplierSecondsRemaining: 0, offlineTime: 123, idleTarget: 'den' });
      expect(useMetaStore.getState()).toBe(before);
      expect(published).not.toHaveBeenCalled();
    } finally { stop(); }
  });

  it('preserves the bonus basis for target/counter changes and clearing the target', async () => {
    await loadBonus();
    const raw = useMetaStore.getState().idleState;
    const anchor = useMetaStore.getState().idleBonusAnchor;
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    useMetaStore.getState().setIdleTarget('blood-moor');
    useMetaStore.getState().updateIdleState({ offlineTime: 456 });
    useMetaStore.getState().updateIdleState({ idleTarget: 'den' });
    useMetaStore.getState().setIdleTarget(undefined);
    expect(useMetaStore.getState().idleBonusAnchor).toBe(anchor);
    expect(useMetaStore.getState().idleState).toEqual({
      lastOnline: raw.lastOnline, offlineTime: 456,
      activeMultiplier: 1.32, multiplierSecondsRemaining: 4800 });
    expect(useMetaStore.getState().readIdleBonus(NOW + 2 * TEN_MINUTES)).toEqual({
      lastOnline: NOW + 2 * TEN_MINUTES, offlineTime: 456,
      activeMultiplier: 1.24, multiplierSecondsRemaining: 3600 });
  });

  it('keeps empty and identical patches as no-ops without publication or reanchoring', async () => {
    await loadBonus();
    const before = useMetaStore.getState();
    const published = vi.fn();
    const stop = useMetaStore.subscribe(published);
    try {
      vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
      before.updateIdleState({});
      before.updateIdleState({ ...before.idleState });
      before.setIdleTarget('den');
      expect(useMetaStore.getState()).toBe(before);
      expect(published).not.toHaveBeenCalled();
      expect(before.readIdleBonus(NOW + 2 * TEN_MINUTES).multiplierSecondsRemaining).toBe(3600);
    } finally { stop(); }
  });

  it.each(['multiplier', 'remaining'] as const)('projects before applying a partial %s patch', async field => {
    await loadBonus();
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    useMetaStore.getState().updateIdleState(field === 'multiplier'
      ? { activeMultiplier: 1.4 } : { multiplierSecondsRemaining: 2400 });
    const state = useMetaStore.getState();
    expect(state.idleBonusAnchor).toBe(NOW + TEN_MINUTES);
    expect(state.idleState).toMatchObject({ lastOnline: NOW + TEN_MINUTES,
      activeMultiplier: field === 'multiplier' ? 1.4 : 1.28,
      multiplierSecondsRemaining: field === 'multiplier' ? 4200 : 2400,
      offlineTime: 123, idleTarget: 'den' });
    const projected = state.readIdleBonus(NOW + 2 * TEN_MINUTES);
    expect(projected.multiplierSecondsRemaining).toBe(field === 'multiplier' ? 3600 : 1800);
    expect(projected.activeMultiplier).toBeCloseTo(field === 'multiplier' ? 1 + 0.4 * 3600 / 4200 : 1.21, 12);
  });

  it('accepts an explicit supplied tuple basis and normalizes finite legacy values', async () => {
    await loadBonus();
    useMetaStore.getState().updateIdleState({ lastOnline: NOW - TEN_MINUTES,
      activeMultiplier: 1.32, multiplierSecondsRemaining: 4800 });
    expect(useMetaStore.getState().idleBonusAnchor).toBe(NOW - TEN_MINUTES);
    expect(useMetaStore.getState().readIdleBonus(NOW)).toMatchObject({
      activeMultiplier: 1.28, multiplierSecondsRemaining: 4200 });
    useMetaStore.getState().updateIdleState({ lastOnline: NOW,
      activeMultiplier: 2, multiplierSecondsRemaining: 10_000, offlineTime: -1 });
    expect(useMetaStore.getState().idleState).toMatchObject({
      activeMultiplier: 1.5, multiplierSecondsRemaining: 7200, offlineTime: 0 });
  });

  it('treats an explicit numeric field in a changed mixed patch as a deliberate replacement', async () => {
    await loadBonus();
    const raw = useMetaStore.getState().idleState;
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    useMetaStore.getState().updateIdleState({ activeMultiplier: raw.activeMultiplier, offlineTime: 456 });
    expect(useMetaStore.getState().idleState).toEqual({ ...raw,
      lastOnline: NOW + TEN_MINUTES, multiplierSecondsRemaining: 4200, offlineTime: 456 });
    expect(useMetaStore.getState().idleBonusAnchor).toBe(NOW + TEN_MINUTES);
  });

  it('treats an explicit historical basis in a changed mixed patch as deliberately supplied', async () => {
    await loadBonus();
    const raw = useMetaStore.getState().idleState;
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    useMetaStore.getState().updateIdleState({ lastOnline: raw.lastOnline, offlineTime: 456 });
    expect(useMetaStore.getState().idleState).toEqual({ ...raw, offlineTime: 456 });
    expect(useMetaStore.getState().idleBonusAnchor).toBe(raw.lastOnline);
    expect(useMetaStore.getState().readIdleBonus(NOW + TEN_MINUTES)).toMatchObject({
      activeMultiplier: 1, multiplierSecondsRemaining: 0, offlineTime: 456 });
  });

  it.each(['lastOnline', 'offlineTime', 'activeMultiplier', 'multiplierSecondsRemaining'] as const)(
    'rejects nonfinite %s patches before publication', async field => {
      await loadBonus();
      const before = useMetaStore.getState();
      expect(() => { before.updateIdleState({ [field]: Infinity }); }).toThrow(/finite/);
      expect(useMetaStore.getState()).toBe(before);
    });

  it('resets raw idle state and transient basis together at the current clock', async () => {
    await loadBonus();
    vi.mocked(Date.now).mockReturnValue(NOW + TEN_MINUTES);
    useMetaStore.getState().reset();
    const state = useMetaStore.getState();
    expect(state.idleBonusAnchor).toBe(NOW + TEN_MINUTES);
    expect(state.idleState).toEqual({ lastOnline: NOW + TEN_MINUTES, offlineTime: 0,
      activeMultiplier: 1, multiplierSecondsRemaining: 0 });
    expect(state.readIdleBonus(NOW + 2 * TEN_MINUTES)).toEqual({
      ...state.idleState, lastOnline: NOW + 2 * TEN_MINUTES });
  });
});
