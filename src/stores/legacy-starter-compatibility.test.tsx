/** Real adapter/decoder/persistence. Only Dexie storage IO is substituted. */
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { SkillsScreen } from '@/features/skills/SkillsScreen';
import i18n from '@/i18n';
import type { SaveRecord } from './save-adapter';
import type { SaveV7 } from '@/engine/types/save';

const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined } = { record: undefined };
  return {
    state,
    get: vi.fn(() => Promise.resolve(state.record)),
    put: vi.fn((record: SaveRecord): Promise<void> => {
      state.record = structuredClone(record);
      return Promise.resolve();
    }),
    delete: vi.fn(() => Promise.resolve())
  };
});
vi.mock('dexie', () => ({
  default: class {
    version() {
      return { stores: () => {
        Object.assign(this, { saves: { get: disk.get, put: disk.put, delete: disk.delete } });
      } };
    }
  }
}));

import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { exportSave, importSave, loadSave, saveSave } from './save-adapter';
import {
  __resetPersistenceForTests, exportCurrentSave, flushSave, hydrateFromSave,
  importIntoStores, snapshotStores, useHydrationStore
} from './persistence';

const id = 'starter-amazon-bow-1792497600123';
function oldSave(intermediate = false): SaveV7 {
  const player = createMockPlayer('Saved Amazon', 'amazon');
  const starter = {
    id, baseId: intermediate ? 'items/base/weapon-bow-training' : 'items/base/weapon-bow',
    rarity: 'normal' as const, level: 1, identified: true, equipped: true, equipSlot: 'weapon' as const,
    ...(intermediate ? { ilvl: 1, baseRolls: { attack: 13 } } : {})
  };
  usePlayerStore.getState().setPlayer({ ...player, equipment: [starter] });
  const save = snapshotStores();
  assert(save);
  usePlayerStore.getState().setPlayer(createMockPlayer('Current', 'sorceress'));
  const { magicResist: _mr, ...oldStats } = save.player.derivedStats;
  return { ...save, version: 7, player: { ...save.player, derivedStats: oldStats }, inventory: { ...save.inventory, currencies: { 'rune-shard': 41 } } };
}
function seedDisk(data: SaveV7) {
  disk.state.record = { id: 'current', data: structuredClone(data), version: 7, timestamp: data.timestamp };
}
function assertLiveCanonical() {
  expect(usePlayerStore.getState().player?.equipment).toEqual([]);
  expect(usePlayerStore.getState().player?.derivedStats.attack).toBe(35);
  expect(useInventoryStore.getState().equipped.weapon).toMatchObject({
    id, baseId: 'items/base/weapon-bow-training', baseRolls: { attack: 13 }
  });
  expect(useInventoryStore.getState().backpack).toEqual([]);
  expect(useInventoryStore.getState().stash).toEqual([]);
  expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': 41 });
}

beforeEach(() => {
  __resetPersistenceForTests();
  for (const store of [usePlayerStore, useInventoryStore, useMercStore, useMapStore, useMetaStore, useFormationStore]) {
    store.getState().reset();
  }
  disk.state.record = undefined;
  disk.get.mockClear();
  disk.put.mockClear();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); __resetPersistenceForTests(); });

describe('legacy starter actual persistence paths', () => {
  it.each([false, true])('decodes disk signature intermediate=%s before live hydration and keeps raw diagnostic export', async (intermediate) => {
    const legacy = oldSave(intermediate);
    const original = structuredClone(legacy);
    seedDisk(legacy);
    const decoded = await loadSave();
    expect(decoded?.inventory.equipped.weapon?.id).toBe(id);
    expect(decoded?.player.equipment).toEqual([]);
    expect(decoded?.player.derivedStats.attack).toBe(35);
    expect(decoded?.version).toBe(9);
    // Raw disk export deliberately remains diagnostic, until an ordinary save writes normalized data.
    expect(JSON.parse((await exportSave()) ?? 'null')).toEqual(legacy);
    const publications: unknown[] = [];
    const stop = usePlayerStore.subscribe((state) => {
      if (state.player?.name === 'Saved Amazon') publications.push(structuredClone(state.player));
    });
    try {
      expect(await hydrateFromSave()).toBe(true);
      assertLiveCanonical();
      expect(publications).toHaveLength(1);
      expect(publications[0]).toMatchObject({ equipment: [], derivedStats: { attack: 35 } });
      expect(await hydrateFromSave()).toBe(true);
      assertLiveCanonical();
      await flushSave();
      expect((await loadSave())?.version).toBe(9);
      expect((await loadSave())?.inventory.equipped.weapon?.id).toBe(id);
      expect(legacy).toEqual(original);
    } finally { stop(); }
  });

  it.each([false, true])('adapter and live import repeatedly normalize signature intermediate=%s with one instance', async (intermediate) => {
    const legacy = oldSave(intermediate);
    const json = JSON.stringify(legacy);
    await importSave(json);
    expect(disk.state.record?.version).toBe(9);
    expect((await loadSave())?.player.equipment).toEqual([]);
    expect((await loadSave())?.inventory.equipped.weapon?.id).toBe(id);
    await importIntoStores(json);
    assertLiveCanonical();
    const exported = exportCurrentSave();
    assert(exported);
    for (const input of [exported, json, exported, json]) {
      await importIntoStores(input);
      assertLiveCanonical();
      const save = snapshotStores();
      assert(save);
      expect(Object.values(save.inventory.equipped).filter(Boolean)).toHaveLength(1);
      expect(save.version).toBe(9);
      expect((await loadSave())?.inventory.equipped.weapon?.id).toBe(id);
    }
  });

  it.each(['corrupt-stats', 'corrupt-map', 'future'] as const)('rejects %s before writes or live publication', async (kind) => {
    const input = oldSave();
    const valid = snapshotStores();
    assert(valid);
    await saveSave(valid);
    const currentDisk = structuredClone(disk.state.record);
    const player = usePlayerStore.getState().player;
    const inventory = useInventoryStore.getState();
    const malformed = kind === 'future' ? { ...input, version: 99 }
      : kind === 'corrupt-stats' ? { ...input, player: { ...input.player, derivedStats: { ...input.player.derivedStats, lifeMax: 'bad' } } }
      : { ...input, inventory: { ...input.inventory, equipped: { head: {
        ...input.player.equipment[0], id: 'bad-affix', affixes: [{ affixId: 'legacy', values: [['statMods.life', 'bad']] }]
      } } } };
    disk.put.mockClear();
    await expect(importSave(JSON.stringify(malformed))).rejects.toThrow();
    await expect(importIntoStores(JSON.stringify(malformed))).rejects.toThrow();
    expect(disk.put).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().player).toBe(player);
    expect(useInventoryStore.getState().equipped).toBe(inventory.equipped);
    expect(useInventoryStore.getState().backpack).toBe(inventory.backpack);
    expect(disk.state.record).toEqual(currentDisk);
  });

  it('failed normalized import writes preserve exact current state and allow clean retry', async () => {
    const input = oldSave();
    const valid = snapshotStores();
    assert(valid);
    await saveSave(valid);
    const currentDisk = structuredClone(disk.state.record);
    const player = usePlayerStore.getState().player;
    const inventory = useInventoryStore.getState();
    disk.put.mockRejectedValueOnce(new Error('owned test write failure'));
    await expect(importIntoStores(JSON.stringify(input))).rejects.toThrow('owned test write failure');
    expect(usePlayerStore.getState().player).toBe(player);
    expect(useInventoryStore.getState().equipped).toBe(inventory.equipped);
    expect(useInventoryStore.getState().backpack).toBe(inventory.backpack);
    expect(useInventoryStore.getState().stash).toBe(inventory.stash);
    expect(useInventoryStore.getState().currencies).toBe(inventory.currencies);
    expect(disk.state.record).toEqual(currentDisk);
    await importIntoStores(JSON.stringify(input));
    assertLiveCanonical();
    expect((await loadSave())?.player.equipment).toEqual([]);
  });
});


function mountSkills() {
  render(<I18nextProvider i18n={i18n}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </I18nextProvider>);
  const active = document.querySelector<HTMLButtonElement>('button[role="tab"][aria-controls="tabpanel-active"]');
  assert(active);
  fireEvent.click(active);
}
function arrowOptionPresent() {
  const first = document.querySelector<HTMLSelectElement>('select');
  assert(first);
  return Array.from(first.options).some((option) => option.value === 'skills-amazon-magic-arrow');
}

describe('canonical weapon authority through mounted save replacement', () => {
  it.each(['load', 'import'] as const)('repairs v7 before mounted Skills sanitizes during %s', async (path) => {
    const legacy = oldSave();
    mountSkills();
    if (path === 'load') {
      seedDisk(legacy);
      await act(async () => { expect(await hydrateFromSave()).toBe(true); });
    } else {
      await act(async () => { await importIntoStores(JSON.stringify(legacy)); });
    }
    assertLiveCanonical();
    expect(arrowOptionPresent()).toBe(true);
    expect(usePlayerStore.getState().player?.comboOrder).toEqual(['skills-amazon-magic-arrow']);
    expect(usePlayerStore.getState().player?.skillLevels).toEqual({ 'amazon.magic_arrow': 1 });
    const exported = exportCurrentSave();
    assert(exported);
    await act(async () => { await importIntoStores(exported); });
    expect(arrowOptionPresent()).toBe(true);
    expect(usePlayerStore.getState().player?.comboOrder).toEqual(['skills-amazon-magic-arrow']);
    expect(useInventoryStore.getState().equipped.weapon?.id).toBe(id);
  });

  it.each(['bow', 'sword', 'null'] as const)('current canonical %s wins contradictory saved legacy across import/export/hydration', async (kind) => {
    const legacy = oldSave();
    const weapon = kind === 'null' ? null : {
      ...legacy.player.equipment[0], id: 'current-weapon',
      baseId: kind === 'bow' ? 'items/base/weapon-bow-training' : 'items/base/wp1h-short-sword',
      baseRolls: { attack: kind === 'bow' ? 13 : 8 }
    };
    const input = {
      ...legacy, version: 8,
      player: { ...legacy.player, equipment: kind === 'bow' ? [] : legacy.player.equipment },
      inventory: { ...legacy.inventory, equipped: { weapon } }
    };
    mountSkills();
    await act(async () => { await importIntoStores(JSON.stringify(input)); });
    expect(arrowOptionPresent()).toBe(kind === 'bow');
    expect(usePlayerStore.getState().player?.comboOrder).toEqual(kind === 'bow' ? ['skills-amazon-magic-arrow'] : []);
    expect(usePlayerStore.getState().player?.equipment).toEqual(input.player.equipment);
    expect(usePlayerStore.getState().player?.skillLevels).toEqual({ 'amazon.magic_arrow': 1 });
    const exported = exportCurrentSave();
    assert(exported);
    await act(async () => { await importIntoStores(exported); });
    await act(async () => { expect(await hydrateFromSave()).toBe(true); });
    expect(arrowOptionPresent()).toBe(kind === 'bow');
    expect(usePlayerStore.getState().player?.comboOrder).toEqual(kind === 'bow' ? ['skills-amazon-magic-arrow'] : []);
    expect(useInventoryStore.getState().equipped.weapon).toEqual(weapon);
  });
});
