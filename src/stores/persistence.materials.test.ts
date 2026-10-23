import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveRecord } from './save-adapter';
import type { SaveCurrent, SaveV17 } from '@/engine/types/save';

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
import { exportSave, loadSave } from './save-adapter';
import { __resetPersistenceForTests, exportCurrentSave, flushSave, hydrateFromSave,
  importIntoStores, snapshotStores, useHydrationStore } from './persistence';

function snapshot(): SaveCurrent {
  const save = snapshotStores();
  if (!save) throw new Error('Missing test save');
  return save;
}

beforeEach(() => {
  __resetPersistenceForTests();
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
    useMetaStore, useFormationStore]) store.getState().reset();
  disk.state.record = undefined;
  vi.clearAllMocks();
  usePlayerStore.getState().setPlayer(createMockPlayer('Material owner', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { __resetPersistenceForTests(); });

describe('native v18 material persistence', () => {
  it.each([17, 18])('raw disk export preserves affix Map entries and stored version %i', async version => {
    const values = new Map([['coreStats.energy', 5], ['statMods.mana', 20]]);
    useInventoryStore.getState().addItem({ id: 'caster-map', baseId: 'items/base/amu-tin',
      rarity: 'rare', level: 20, identified: true, equipped: false,
      affixes: [{ affixId: 'recipes/caster-fixed', values }] });
    await flushSave();
    const record = disk.state.record;
    if (!record) throw new Error('Missing saved record');
    const saved = snapshot();
    const { materials: _materials, ...oldInventory } = saved.inventory;
    const historical: SaveV17 = { ...saved, version: 17, inventory: oldInventory };
    disk.state.record = { ...record, version, data: version === 17 ? historical : saved };
    const before = structuredClone(disk.state.record);
    const raw = await exportSave();
    if (!raw) throw new Error('Missing raw disk export');
    const parsed = JSON.parse(raw) as SaveCurrent;
    expect(parsed.version).toBe(version);
    expect(parsed.inventory.backpack[0]?.affixes).toEqual([
      { affixId: 'recipes/caster-fixed', values: [...values] }
    ]);
    expect(disk.state.record).toEqual(before);
    await importIntoStores(raw);
    expect(snapshot().inventory.backpack[0]?.affixes).toEqual([{ affixId: 'recipes/caster-fixed', values }]);
  });
  it('preserves typed holdings through snapshot/export/Save/reset/Continue and repeated import', async () => {
    const materials = { 'runes/ral': 3, 'gems/ruby/chipped': 5, 'materials/scrap': Number.MAX_SAFE_INTEGER };
    useInventoryStore.getState().addMaterials(materials);
    useInventoryStore.getState().addCurrency('rune-shard', 99);
    const before = snapshot();
    expect(before.version).toBe(18);
    expect(before.inventory.materials).toEqual(materials);
    const exported = exportCurrentSave();
    if (!exported) throw new Error('Missing export');
    expect((JSON.parse(exported) as SaveCurrent).inventory.materials).toEqual(materials);
    await flushSave();
    expect((await loadSave())?.inventory.materials).toEqual(materials);
    useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
    expect(useInventoryStore.getState().materials).toEqual({});
    expect(await hydrateFromSave()).toBe(true);
    expect(snapshot().inventory).toEqual(before.inventory);
    for (let repeat = 0; repeat < 2; repeat++) {
      useInventoryStore.getState().addMaterials({ 'runes/el': 1 });
      await importIntoStores(exported);
      expect(snapshot().inventory).toEqual(before.inventory);
      expect(snapshot().player).toEqual(before.player);
    }
  });

  it('migrates an actual exported v17 shape to empty typed ownership and conserves legacy balances', async () => {
    useInventoryStore.getState().addCurrency('gem-shard', 41);
    useInventoryStore.getState().addCurrency('historical-token', 8);
    const current = snapshot();
    const { materials: _materials, ...inventory } = current.inventory;
    const old = { ...current, version: 17, inventory };
    useInventoryStore.getState().addMaterials({ 'runes/ral': 1 });
    await importIntoStores(JSON.stringify(old));
    expect(snapshot().inventory).toEqual({ ...inventory, materials: {} });
    expect((await loadSave())?.version).toBe(18);
  });

  it.each([undefined, { 'runes/ral': 0 }, { 'runes/unknown': 1 }, { 'runes/ral': Number.MAX_SAFE_INTEGER + 1 }])(
    'refuses malformed imports before disk or live ownership changes: %j', async materials => {
      useInventoryStore.getState().addMaterials({ 'runes/ral': 4 });
      const before = snapshot(), puts = disk.put.mock.calls.length;
      await expect(importIntoStores(JSON.stringify({ ...before, inventory: { ...before.inventory, materials } })))
        .rejects.toThrow(/material/i);
      expect(disk.put).toHaveBeenCalledTimes(puts);
      expect(snapshot().inventory).toEqual(before.inventory);
      expect(snapshot().player).toEqual(before.player);
    });
});
