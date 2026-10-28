import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveRecord } from './save-adapter';
import type { SaveCurrent } from '@/engine/types/save';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { emptyEndgameState } from '@/engine/endgame/state';

const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined } = { record: undefined };
  return { state, get: vi.fn(() => Promise.resolve(state.record)),
    put: vi.fn((record: SaveRecord) => { state.record = structuredClone(record); return Promise.resolve(); }),
    delete: vi.fn(() => { state.record = undefined; return Promise.resolve(); }) };
});
vi.mock('dexie', () => ({ default: class {
  version() { return { stores: () => {
    Object.assign(this, { saves: { get: disk.get, put: disk.put, delete: disk.delete } });
  } }; }
} }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { __resetPersistenceForTests, exportCurrentSave, flushSave, hydrateFromSave,
  importIntoStores, snapshotStores, useHydrationStore, startAutoSave, deleteCurrentSave,
  AUTO_SAVE_DEBOUNCE_MS } from './persistence';

const progress = { attemptOrdinal: 8, clearCounts: { ashen: 2, glacial: 3 }, achievementRewardClaimed: true };
function snapshot(): SaveCurrent {
  const save = snapshotStores();
  if (!save) throw new Error('Missing test save');
  return save;
}
function prepare() {
  const campaign = campaignEvidence();
  useMapStore.setState({ questProgress: campaign.questProgress, questReceipts: campaign.questReceipts,
    endgame: progress } as Parameters<typeof useMapStore.setState>[0]);
  useInventoryStore.getState().addMaterials({ 'gems/ruby/perfect': 2 });
}
beforeEach(() => {
  __resetPersistenceForTests();
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
    useMetaStore, useFormationStore]) store.getState().reset();
  disk.state.record = undefined; vi.clearAllMocks();
  usePlayerStore.getState().setPlayer(createMockPlayer('Endgame owner', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { __resetPersistenceForTests(); vi.useRealTimers(); });

describe('endgame durable store ownership', () => {
  it('saves root state and restores it through reset/Continue and repeated imports', async () => {
    prepare(); const before = snapshot();
    expect(before).toMatchObject({ version: 24, endgame: progress });
    expect(before.map).not.toHaveProperty('endgame');
    const exported = exportCurrentSave();
    if (!exported) throw new Error('Missing export');
    expect((JSON.parse(exported) as SaveCurrent).endgame).toEqual(progress);
    await flushSave();
    useMapStore.getState().reset(); useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
    expect(snapshotStores()).toBeNull();
    expect(await hydrateFromSave()).toBe(true);
    expect(snapshot().endgame).toEqual(progress);
    expect(snapshot().inventory).toEqual(before.inventory);
    for (let repeat = 0; repeat < 2; repeat++) {
      useMapStore.getState().reset();
      await importIntoStores(exported);
      expect(snapshot().endgame).toEqual(progress);
      expect(snapshot().map).toEqual(before.map);
      expect(snapshot().inventory).toEqual(before.inventory);
    }
    useMapStore.getState().reset();
    expect(snapshot().endgame).toEqual(emptyEndgameState());
  });
  it.each([undefined, { ...progress, attemptOrdinal: 1 }, { ...progress, clearCounts: { ashen: 0, glacial: 1 } }])(
    'refuses corrupt imports without disk writes or any live domain changes: %j', async endgame => {
      prepare(); const before = snapshot(), puts = disk.put.mock.calls.length;
      await expect(importIntoStores(JSON.stringify({ ...before, endgame }))).rejects.toThrow();
      expect(disk.put).toHaveBeenCalledTimes(puts);
      expect({ ...snapshot(), timestamp: before.timestamp }).toEqual(before);
    });
  it('preserves existing ownership when persisting a valid replacement fails', async () => {
    prepare(); await flushSave(); const before = snapshot(), stored = structuredClone(disk.state.record);
    const replacement = { ...before, endgame: { ...progress, attemptOrdinal: 9 } };
    disk.put.mockRejectedValueOnce(new Error('task quota failure'));
    await expect(importIntoStores(JSON.stringify(replacement))).rejects.toThrow('task quota failure');
    expect({ ...snapshot(), timestamp: before.timestamp }).toEqual(before);
    expect(disk.state.record).toEqual(stored);
  });
  it('autosaves a durable map-store change at the canonical root', async () => {
    vi.useFakeTimers(); prepare(); startAutoSave();
    const next = { ...progress, attemptOrdinal: 9 };
    useMapStore.setState({ endgame: next });
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
    expect((disk.state.record?.data as SaveCurrent).endgame).toEqual(next);
    expect((disk.state.record?.data as SaveCurrent).map).not.toHaveProperty('endgame');
  });
  it('deletes durable progress along with the character and resets the live domain', async () => {
    prepare(); await flushSave();
    expect(disk.state.record).toBeDefined();
    await deleteCurrentSave();
    expect(disk.state.record).toBeUndefined();
    expect(snapshotStores()).toBeNull();
    expect(useMapStore.getState().endgame).toEqual(emptyEndgameState());
  });
});
