import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveRecord } from './save-adapter';
import type { SaveCurrent } from '@/engine/types/save';

const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined } = { record: undefined };
  return { state, get: vi.fn(() => Promise.resolve(state.record)),
    put: vi.fn((record: SaveRecord) => {
      state.record = structuredClone(record);
      return Promise.resolve();
    }), delete: vi.fn(() => { state.record = undefined; return Promise.resolve(); }) };
});
vi.mock('dexie', () => ({ default: class {
  version() { return { stores: () => {
    Object.assign(this, { saves: { get: disk.get, put: disk.put, delete: disk.delete } });
  } }; }
} }));

import { createMockPlayer } from '@/features/character/createMockPlayer';
import { claimQuestReward, readQuestItem } from '@/features/quests/claimReward';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { loadSave } from './save-adapter';
import { __resetPersistenceForTests, exportCurrentSave, flushSave, hydrateFromSave,
  importIntoStores, snapshotStores, useHydrationStore } from './persistence';

const questId = 'quests/act2-radaments-lair';
const source = `${questId}#reward:questItem`;

beforeEach(() => {
  __resetPersistenceForTests();
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
    useMetaStore, useFormationStore]) store.getState().reset();
  disk.state.record = undefined;
  vi.clearAllMocks();
  usePlayerStore.getState().setPlayer(createMockPlayer('Book reader', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  useMapStore.setState({ questProgress: { [questId]: { id: questId, status: 'completed',
    objectives: { 'obj-kill-radament': true }, rewardClaimed: true } } });
});
afterEach(() => { __resetPersistenceForTests(); });

describe('persisted bound quest items', () => {
  it('round-trips actual Claim and Read with no repeated XP or point grant on Continue/import', async () => {
    useMapStore.getState().updateQuestProgress(questId, { rewardClaimed: false });
    expect(claimQuestReward(questId)).toBe('ok');
    const claimed = snapshotStores();
    if (!claimed) throw new Error('Missing claimed book save');
    const unreadJson = exportCurrentSave();
    if (!unreadJson) throw new Error('Missing unread export');
    await flushSave();
    for (const store of [usePlayerStore, useInventoryStore, useMapStore]) store.getState().reset();
    expect(await hydrateFromSave()).toBe(true);
    expect(snapshotStores()?.inventory).toEqual(claimed.inventory);
    expect(usePlayerStore.getState().player).toEqual(claimed.player);
    await importIntoStores(unreadJson);
    expect(usePlayerStore.getState().player).toEqual(claimed.player);
    expect(claimQuestReward(questId)).toBe('already-claimed');
    expect(readQuestItem(source)).toBe('ok');
    const consumed = snapshotStores();
    if (!consumed) throw new Error('Missing consumed book save');
    expect(consumed.player).toEqual({ ...claimed.player, skillPoints: claimed.player.skillPoints + 1 });
    expect(consumed.inventory.questItems[source]).toEqual({ itemId: 'items/book_of_skill', state: 'consumed' });
    const consumedJson = exportCurrentSave();
    if (!consumedJson) throw new Error('Missing consumed export');
    await flushSave();
    for (const store of [usePlayerStore, useInventoryStore, useMapStore]) store.getState().reset();
    expect(await hydrateFromSave()).toBe(true);
    for (let repeat = 0; repeat < 2; repeat++) {
      await importIntoStores(consumedJson);
      expect(readQuestItem(source)).toBe('already-consumed');
      expect(usePlayerStore.getState().player).toEqual(consumed.player);
      expect(snapshotStores()?.inventory).toEqual(consumed.inventory);
    }
  });
  it.each(['owned', 'consumed'] as const)('preserves %s across snapshot, Save, reset, Continue and repeated import', async state => {
    const questItems = { [source]: { itemId: 'items/book_of_skill', state } };
    useInventoryStore.setState({ questItems });
    const before = snapshotStores();
    expect(before?.inventory).toHaveProperty('questItems', questItems);
    const exported = exportCurrentSave();
    if (!exported || !before) throw new Error('Missing book save');
    expect((JSON.parse(exported) as SaveCurrent).inventory.questItems).toEqual(questItems);
    await flushSave();
    expect((await loadSave())?.inventory.questItems).toEqual(questItems);
    useInventoryStore.getState().reset();
    expect(useInventoryStore.getState().questItems).toEqual({});
    usePlayerStore.getState().reset();
    expect(await hydrateFromSave()).toBe(true);
    expect(snapshotStores()?.inventory).toEqual(before.inventory);
    for (let repeat = 0; repeat < 2; repeat++) {
      await importIntoStores(exported);
      expect(snapshotStores()?.inventory).toEqual(before.inventory);
      expect(usePlayerStore.getState().player?.skillPoints).toBe(before.player.skillPoints);
    }
  });

  it('refuses a malformed import before writing disk or replacing live ownership', async () => {
    const before = snapshotStores();
    if (!before) throw new Error('Missing live save');
    const invalid = { ...before, inventory: { ...before.inventory,
      questItems: { [source]: { itemId: 'items/book_of_skill', state: 'owned', consumed: true } } } };
    await expect(importIntoStores(JSON.stringify(invalid))).rejects.toThrow('Invalid save');
    expect(disk.put).not.toHaveBeenCalled();
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(usePlayerStore.getState().player).toEqual(before.player);
  });
});
