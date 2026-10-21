/** Real persistence/controller/stores; only IndexedDB IO is controlled. */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '@/engine/types/entities';
import type { CoreStats } from '@/engine/types/attributes';
import { toJsonSafe } from '@/engine/save';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import type { SaveRecord } from '@/stores/save-adapter';
const disk = vi.hoisted(() => ({
  get: vi.fn(() => Promise.resolve(undefined)),
  put: vi.fn((_record: SaveRecord) => Promise.resolve()),
  delete: vi.fn(() => Promise.resolve())
}));
vi.mock('dexie', () => ({ default: class {
  version() {
    return { stores: () => Object.assign(this, {
      saves: { get: disk.get, put: disk.put, delete: disk.delete }
    }) };
  }
} }));

import { createMockPlayer } from './createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import {
  __resetPersistenceForTests, snapshotStores, importIntoStores,
  deleteCurrentSave, isReplacingSave, useHydrationStore
} from '@/stores/persistence';

const empty: CoreStats = { strength: 0, dexterity: 0, vitality: 0, energy: 0 };
type Apply = (deltas: CoreStats, expectedPlayer: Player) => string;
let boundary: Apply | undefined;
let loadError: unknown;
beforeAll(async () => {
  // Explicit missing-feature RED per case, without a runtime stub or skipped cases.
  const path = './applyStatDraft';
  try {
    const module: unknown = await import(path);
    boundary = (module as { applyStatDraft: Apply }).applyStatDraft;
  } catch (error) { loadError = error; }
});
function apply(deltas: CoreStats, expectedPlayer: Player): string {
  expect(loadError, 'New Apply controller must exist').toBeUndefined();
  expect(boundary).toBeTypeOf('function');
  if (!boundary) throw new Error('Missing Apply boundary');
  return boundary(deltas, expectedPlayer);
}

function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing lifecycle fixture');
  return current;
}

function deferred() {
  let resolve: (() => void) | undefined;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, release: () => {
    if (!resolve) throw new Error('Missing IO release');
    resolve();
  } };
}

function expectRefusal(basis: Player, code: string, deltas = { ...empty, energy: 1 }): void {
  const before = usePlayerStore.getState();
  const domains = [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
    useMetaStore, useFormationStore] as const;
  const states = domains.map(store => store.getState());
  const snapshot = isReplacingSave() ? null : structuredClone(snapshotStores());
  if (isReplacingSave()) expect(() => snapshotStores()).toThrow(WaveGuardError);
  const published: unknown[] = [];
  const stop = usePlayerStore.subscribe(state => { published.push(structuredClone(state.player)); });
  try { expect(apply(deltas, basis)).toBe(code); } finally { stop(); }
  expect(usePlayerStore.getState()).toBe(before);
  domains.forEach((store, index) => { expect(store.getState()).toBe(states[index]); });
  if (isReplacingSave()) expect(() => snapshotStores()).toThrow(WaveGuardError);
  else expect(snapshotStores()).toEqual(snapshot);
  expect(published).toEqual([]);
}

beforeEach(() => {
  __resetPersistenceForTests();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-20T12:00:00.000Z'));
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
    useMetaStore, useFormationStore]) store.getState().reset();
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Draft lifecycle', 'sorceress'), statPoints: 5 });
  useHydrationStore.getState().setStatus('ready');
  disk.get.mockReset(); disk.put.mockReset(); disk.delete.mockReset();
  disk.get.mockResolvedValue(undefined); disk.put.mockResolvedValue(); disk.delete.mockResolvedValue();
});
afterEach(() => {
  __resetPersistenceForTests();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('attribute draft Apply lifecycle', () => {
  it('synchronously publishes one complete mixed draft without refilling current pools', () => {
    const basis = player();
    const before = structuredClone(basis);
    const published: unknown[] = [];
    const stop = usePlayerStore.subscribe(state => { published.push(structuredClone(state.player)); });
    let result: string;
    try { result = apply({ ...empty, vitality: 1, energy: 1 }, basis); }
    finally { stop(); }
    const expected = { ...before, statPoints: 3,
      coreStats: { strength: 10, dexterity: 25, vitality: 11, energy: 36 },
      derivedStats: { ...before.derivedStats, lifeMax: 122, manaMax: 104 } };
    expect(result).toBe('ok');
    expect(player()).toEqual(expected);
    expect(published).toEqual([expected]);
    expect(basis).toEqual(before);
  });

  it.each(['no-player', 'stale-player', 'invalid-deltas', 'empty-draft',
    'insufficient-points', 'stat-cap'] as const)('preserves store refusal %s when ready', code => {
    let basis = player();
    let deltas = { ...empty, energy: 1 };
    if (code === 'no-player') usePlayerStore.getState().reset();
    if (code === 'stale-player') usePlayerStore.getState().setPlayer({ ...basis });
    if (code === 'invalid-deltas') deltas.energy = -1;
    if (code === 'empty-draft') deltas = { ...empty };
    if (code === 'insufficient-points') {
      usePlayerStore.getState().setPlayer({ ...basis, statPoints: 0 }); basis = player();
    }
    if (code === 'stat-cap') {
      usePlayerStore.getState().setPlayer({ ...basis, coreStats: { ...basis.coreStats, energy: 500 } });
      basis = player();
    }
    expectRefusal(basis, code, deltas);
  });

  it.each(['idle', 'loading', 'error'] as const)('refuses %s hydration before draft validation', status => {
    const basis = player();
    useHydrationStore.getState().setStatus(status);
    expectRefusal(basis, 'not-ready', null as unknown as CoreStats);
  });


  it.each([
    ['import', false], ['import', true], ['delete', false], ['delete', true]
  ] as const)('fences pending real %s with IO failure=%s, then resumes', async (operation, fails) => {
    const basis = player();
    const old = structuredClone(snapshotStores());
    const domains = [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
      useMetaStore, useFormationStore] as const;
    const states = domains.map(store => store.getState());
    if (!old) throw new Error('Missing import payload');
    const incoming = { ...old, player: { ...old.player, name: 'Incoming draft', id: 'incoming-draft' } };
    const gate = deferred();
    const failure = new Error(`Controlled ${operation} disk failure`);
    const io = async () => { await gate.promise; if (fails) throw failure; };
    if (operation === 'import') disk.put.mockImplementationOnce(io);
    else disk.delete.mockImplementationOnce(io);
    const pending = operation === 'import'
      ? importIntoStores(JSON.stringify(toJsonSafe(incoming))) : deleteCurrentSave();
    // Attach rejection handling immediately; every path awaits the queued restore.
    const settled = pending.then(() => null, (error: unknown) => error);
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(isReplacingSave()).toBe(true);
      expect(useHydrationStore.getState().status).toBe('ready');
      expect(player()).toBe(basis);
      expect(() => snapshotStores()).toThrow(WaveGuardError);
      domains.forEach((store, index) => { expect(store.getState()).toBe(states[index]); });
      expectRefusal(basis, 'not-ready', null as unknown as CoreStats);
      expectRefusal(basis, 'not-ready');
      gate.release();
      expect(await settled).toBe(fails ? failure : null);
      expect(isReplacingSave()).toBe(false);
      if (fails) {
        expect(player()).toBe(basis);
        expect(snapshotStores()).toEqual(old);
        expect(apply({ ...empty, energy: 1 }, basis)).toBe('ok');
      } else if (operation === 'import') {
        expect(snapshotStores()).toEqual(incoming);
        expectRefusal(basis, 'stale-player');
        expect(apply({ ...empty, energy: 1 }, player())).toBe('ok');
      } else {
        expectRefusal(basis, 'no-player');
        usePlayerStore.getState().setPlayer({ ...createMockPlayer('New draft', 'sorceress'), statPoints: 5 });
        expect(apply({ ...empty, energy: 1 }, player())).toBe('ok');
      }
      expect(player()).toMatchObject({ statPoints: 4, coreStats: { energy: 36 },
        derivedStats: { life: 120, mana: 102, manaMax: 104 } });
    } finally { gate.release(); await settled; }
  });
});
