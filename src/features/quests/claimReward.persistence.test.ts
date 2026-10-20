/** Real claim, persistence and save adapter; only IndexedDB IO is faked. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveCurrent } from '@/engine/types/save';
import type { SaveRecord } from '@/stores/save-adapter';
const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined; writes: SaveRecord[] } = { record: undefined, writes: [] };
  const commit = (record: SaveRecord) => {
    const copy = structuredClone(record);
    state.record = copy;
    state.writes.push(copy);
  };
  return {
    state, commit,
    get: vi.fn(() => Promise.resolve(state.record)),
    put: vi.fn((record: SaveRecord) => { commit(record); return Promise.resolve(); }),
    delete: vi.fn(() => { state.record = undefined; return Promise.resolve(); })
  };
});
vi.mock('dexie', () => ({ default: class {
  version() {
    return { stores: () => Object.assign(this, {
      saves: { get: disk.get, put: disk.put, delete: disk.delete }
    }) };
  }
} }));

import { createMockPlayer } from '@/features/character/createMockPlayer';
import { toJsonSafe } from '@/engine/save';
import { loadMercPool } from '@/data/loaders/mercs';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { saveSave, loadSave } from '@/stores/save-adapter';
import {
  __resetPersistenceForTests, AUTO_SAVE_DEBOUNCE_MS, snapshotStores, hydrateFromSave,
  importIntoStores, isReplacingSave, startAutoSave, stopAutoSave, useHydrationStore
} from '@/stores/persistence';
import { claimQuestReward } from './claimReward';

const DEN = 'quests/act1-den-of-evil';
const NOW = 1_792_454_400_000;
function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing claim persistence fixture');
  return value;
}
function deferred() {
  let done: (() => void) | undefined;
  const promise = new Promise<void>(resolve => { done = resolve; });
  return { promise, release: () => { required(done)(); } };
}
function snapshot(): SaveCurrent { return required(snapshotStores()); }
// Zero-bonus fixture: autosave projects both clocks at the flush boundary.
function flushed(save: SaveCurrent): SaveCurrent {
  const at = NOW + AUTO_SAVE_DEBOUNCE_MS;
  return { ...save, timestamp: at, meta: { ...save.meta,
    idleState: { ...save.meta.idleState, lastOnline: at } } };
}
function setup(): void {
  usePlayerStore.getState().setPlayer(createMockPlayer('Saved claim', 'sorceress'));
  const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight'));
  const hire = useMercStore.getState().hireMerc(def);
  expect(hire.ok).toBe(true);
  useMercStore.getState().setFieldedMerc(required(hire.mercId));
  useMapStore.getState().updateQuestProgress(DEN, { status: 'completed',
    objectives: { 'obj-clear-den': true, 'obj-return': true } });
  useHydrationStore.getState().setStatus('ready');
}
beforeEach(() => {
  __resetPersistenceForTests();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
    useMetaStore, useFormationStore]) store.getState().reset();
  disk.state.record = undefined;
  disk.state.writes = [];
  disk.get.mockClear(); disk.put.mockClear(); disk.delete.mockClear();
  setup();
});
afterEach(() => {
  stopAutoSave();
  __resetPersistenceForTests();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('claim settlement at real persistence boundaries', () => {
  it('debounces the complete paid Den payload and preserves once-only safety through real hydration', async () => {
    startAutoSave();
    try {
      expect(claimQuestReward(DEN)).toBe('ok');
      const paid = snapshot();
      expect(paid.player.level).toBe(2);
      expect(paid.player.experience).toBe(400);
      expect(paid.player.skillPoints).toBe(3);
      expect(paid.map.questProgress[DEN]?.rewardClaimed).toBe(true);
      expect(disk.state.writes).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.state.writes).toHaveLength(1);
      for (const record of disk.state.writes) {
        expect(record.data).toEqual(flushed(paid));
      }
      const saved = required(await loadSave());
      stopAutoSave();
      usePlayerStore.getState().reset();
      useMapStore.getState().reset();
      await hydrateFromSave();
      const restored = snapshot();
      expect(restored.player).toEqual(saved.player);
      expect(restored.inventory).toEqual(saved.inventory);
      expect(restored.mercs).toEqual(saved.mercs);
      expect(restored.map).toEqual(saved.map);
      expect(claimQuestReward(DEN)).toBe('already-claimed');
      expect(snapshot()).toEqual(restored);
      expect(disk.state.writes).toHaveLength(1);
    } finally { stopAutoSave(); }
  });

  it('debounces only restored data after a controlled real merc mutation then throw', async () => {
    const before = snapshot();
    const share = useMercStore.getState().shareExperienceWithFielded;
    useMercStore.setState({ shareExperienceWithFielded: amount => {
      share(amount); throw new Error('Controlled post-mutation merc failure');
    } });
    startAutoSave();
    try {
      let result = '';
      expect(() => { result = claimQuestReward(DEN); }).not.toThrow();
      expect(result).toBe('grant-failed');
      expect(snapshot()).toEqual(before);
      expect(disk.state.writes).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.state.writes).toHaveLength(1);
      for (const record of disk.state.writes) {
        expect(record.data).toEqual(flushed(before));
      }
      expect(required(await loadSave()).map.questProgress[DEN]?.rewardClaimed).not.toBe(true);
    } finally {
      stopAutoSave();
      useMercStore.setState({ shareExperienceWithFielded: share });
    }
  });

  it('refuses while a real import is pending with ready hydration, then claims only the imported character', async () => {
    const old = snapshot();
    await saveSave(old);
    const incoming: SaveCurrent = { ...old,
      player: { ...old.player, id: 'incoming-claim', name: 'Imported claim' } };
    const gate = deferred();
    disk.put.mockImplementationOnce(async record => {
      await gate.promise;
      disk.commit(record);
    });
    startAutoSave();
    const pending = importIntoStores(JSON.stringify(toJsonSafe(incoming)));
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(isReplacingSave()).toBe(true);
      expect(useHydrationStore.getState().status).toBe('ready');
      expect(claimQuestReward(DEN)).toBe('not-ready');
      expect(snapshot()).toEqual(old);
      expect(disk.state.writes).toHaveLength(1);
      expect(disk.state.writes[0]?.data).toEqual(old);
      gate.release();
      await pending;
      expect(isReplacingSave()).toBe(false);
      expect(snapshot()).toEqual(incoming);
      expect(disk.state.writes).toHaveLength(2);
      expect(disk.state.writes[1]?.data).toEqual(incoming);
      expect(required(await loadSave())).toEqual(incoming);
      expect(claimQuestReward(DEN)).toBe('ok');
      const paid = snapshot();
      expect(paid.player.id).toBe('incoming-claim');
      expect(paid.player.experience).toBe(400);
      expect(paid.map.questProgress[DEN]?.rewardClaimed).toBe(true);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.state.writes).toHaveLength(3);
      const expected = [old, incoming, flushed(paid)];
      disk.state.writes.forEach((record, index) => { expect(record.data).toEqual(expected[index]); });
    } finally {
      gate.release();
      await pending;
      stopAutoSave();
    }
  });
});
