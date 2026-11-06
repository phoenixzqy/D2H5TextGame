/** Real adapter/decoder with only IndexedDB IO substituted. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveRecord } from './save-adapter';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { buildSave, toJsonSafe } from '@/engine/save/serialize';
import { emptyEndgameState } from '@/engine/endgame/state';

const disk = vi.hoisted(() => ({
  record: undefined as unknown,
  get: vi.fn<[], Promise<unknown>>(),
  put: vi.fn<[SaveRecord], Promise<void>>(),
  delete: vi.fn<[], Promise<void>>()
}));
vi.mock('dexie', () => ({ default: class {
  version() { return { stores: () => Object.assign(this, {
    saves: { get: disk.get, put: disk.put, delete: disk.delete }
  }) }; }
} }));

import { deleteSave, exportSave, importSave, loadSave, saveSave } from './save-adapter';

function fixture() {
  return buildSave({
    endgame: emptyEndgameState(),
    player: createMockPlayer('Storage owner', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: {
      settings: { locale: 'zh-CN', stealthMode: false, soundEnabled: true, musicEnabled: true, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, activeMultiplier: 1, multiplierSecondsRemaining: 0 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 }
    },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] },
    timestamp: 1000
  });
}

beforeEach(() => {
  disk.record = undefined;
  disk.get.mockReset().mockImplementation(() => Promise.resolve(structuredClone(disk.record)));
  disk.put.mockReset().mockImplementation(record => {
    disk.record = structuredClone(record);
    return Promise.resolve();
  });
  disk.delete.mockReset().mockImplementation(() => { disk.record = undefined; return Promise.resolve(); });
});

describe('versioned JSON save storage', () => {
  it('stores an explicit immutable JSON payload and round-trips the complete logical save', async () => {
    const save = fixture();
    await saveSave(save);
    expect(disk.record).toMatchObject({ id: 'current', version: save.version,
      encoding: 'json-v1', data: JSON.stringify(toJsonSafe(save)) });
    expect(disk.record).toHaveProperty('timestamp', expect.any(Number));
    expect(await loadSave()).toEqual(save);
    expect(JSON.parse((await exportSave()) ?? 'null')).toEqual(toJsonSafe(save));
  });

  it('loads legacy object records and leaves their raw diagnostic export unchanged', async () => {
    const save = fixture();
    disk.record = { id: 'current', version: save.version, timestamp: 1000, data: save };
    expect(await loadSave()).toEqual(save);
    expect(JSON.parse((await exportSave()) ?? 'null')).toEqual(toJsonSafe(save));
    expect(disk.put).not.toHaveBeenCalled();
  });

  it('keeps queued writes isolated from caller mutations and deletes after earlier writes', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let releaseNext!: () => void;
    const nextGate = new Promise<void>(resolve => { releaseNext = resolve; });
    disk.put.mockImplementationOnce(async record => { await gate; disk.record = structuredClone(record); });
    disk.put.mockImplementationOnce(async record => { await nextGate; disk.record = structuredClone(record); });
    const source = fixture();
    const first = { ...source, inventory: { ...source.inventory, currencies: { wishstone: 17 } } };
    const original = structuredClone(first);
    const pending = saveSave(first);
    first.inventory.currencies.wishstone = 999;
    const second = { ...fixture(), player: { ...fixture().player, name: 'Second' } };
    const next = saveSave(second);
    release();
    await pending;
    expect(JSON.parse((await exportSave()) ?? 'null')).toEqual(toJsonSafe(original));
    releaseNext();
    await next;
    expect(await loadSave()).toEqual(second);
    const lastWrite = saveSave(first);
    const deletion = deleteSave();
    await Promise.all([lastWrite, deletion]);
    expect(await loadSave()).toBeNull();
  });

  it('preserves native affix Maps in both new and legacy storage', async () => {
    const source = fixture();
    const item = { id: 'map-affix', baseId: 'items/base/wp1h-short-sword', rarity: 'magic' as const,
      level: 20, socketCapacity: 0, identified: true, equipped: false,
      affixes: [{ affixId: 'legacy', values: new Map([['statMods.mana', 20]]) }] };
    const save = { ...source, inventory: { ...source.inventory, backpack: [item] } };
    for (const legacy of [true, false]) {
      if (legacy) disk.record = { id: 'current', version: save.version, timestamp: 1000, data: save };
      else await saveSave(save);
      const loaded = await loadSave();
      expect(loaded).toEqual(save);
      const affix = loaded?.inventory.backpack[0]?.affixes?.[0];
      expect(affix && 'values' in affix && affix.values).toBeInstanceOf(Map);
      expect(JSON.parse((await exportSave()) ?? 'null')).toEqual(toJsonSafe(save));
    }
  });

  it('leaves prior data and the write queue usable when snapshot serialization fails', async () => {
    const save = fixture();
    await saveSave(save);
    const before = structuredClone(disk.record);
    const cyclic = fixture();
    Object.defineProperty(cyclic, 'self', { value: cyclic, enumerable: true });
    expect(() => saveSave(cyclic)).toThrow();
    expect(disk.record).toEqual(before);
    await saveSave({ ...save, timestamp: 2000 });
    expect((await loadSave())?.timestamp).toBe(2000);
  });

  it('propagates write failure, preserves the prior record and allows a later retry', async () => {
    const save = fixture();
    await saveSave(save);
    const before = structuredClone(disk.record);
    disk.put.mockRejectedValueOnce(new Error('Quota exhausted'));
    await expect(saveSave({ ...save, timestamp: 2000 })).rejects.toThrow('Quota exhausted');
    expect(disk.record).toEqual(before);
    await saveSave({ ...save, timestamp: 3000 });
    expect((await loadSave())?.timestamp).toBe(3000);
  });

  it.each([
    { encoding: 'json-v2', data: '{}' },
    { encoding: 'json-v1', data: '{' },
    { encoding: 'json-v1', data: {} },
    { encoding: 'json-v1', data: '{"version":999}' }
  ])('refuses unsupported or corrupt encoded saves without changing disk: %j', async fields => {
    disk.record = { id: 'current', version: 33, timestamp: 1000, ...fields };
    const before = structuredClone(disk.record);
    await expect(loadSave()).rejects.toThrow();
    expect(disk.record).toEqual(before);
    expect(disk.put).not.toHaveBeenCalled();
  });

  it('validates imports before replacing an encoded save', async () => {
    const save = fixture();
    await importSave(JSON.stringify(toJsonSafe(save)));
    const before = structuredClone(disk.record);
    await expect(importSave('{"version":999}')).rejects.toThrow();
    expect(disk.record).toEqual(before);
    expect(await loadSave()).toEqual(save);
  });
});
