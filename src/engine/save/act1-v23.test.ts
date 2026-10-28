import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as questLoader from '@/data/loaders/quests';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type SaveCurrent, type SaveV22 } from '../types/save';
import { ACT1_IMBUE_SOURCES, ACT1_QUEST_RECEIPTS } from '../map/act1-quest-sources';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV22Save, validateSave } from './validate';
import { runMigrations } from './migrate';
import { withoutV20Fields, withoutV24Fields, withV24Defaults } from '../../../tests/helpers/save-fixtures';

const reservedReceipts = [
  'quests/act1-search-for-cain#action:rescue-cain',
  'quests/side-act1-cains-favor#action:cain-talk',
  'quests/act1-forgotten-tower#action:countess-victory',
  'quests/side-act1-charsis-imbue#action:present-item'
] as const;
const reservedServices = [
  'quests/act1-tools-of-the-trade#reward:service',
  'quests/side-act1-charsis-imbue#reward:service'
] as const;
afterEach(() => { vi.restoreAllMocks(); });

function predecessor() {
  const save = buildSave({ timestamp: 1000, player: createMockPlayer('Literal23', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
  return { ...withoutV24Fields(save), version: 22 as const, inventory: { ...save.inventory, questServices: {} } };
}

describe('v23 current authority registration before Act I activation', () => {
  it('reserves the exact finite contract while preserving historical service types', () => {
    expect(Object.values(ACT1_QUEST_RECEIPTS)).toEqual(reservedReceipts);
    expect(Object.values(ACT1_IMBUE_SOURCES)).toEqual(reservedServices);
    expect(Object.isFrozen(ACT1_QUEST_RECEIPTS)).toBe(true);
    expect(Object.isFrozen(ACT1_IMBUE_SOURCES)).toBe(true);
    type HistoricalService = 'socket_item' | 'socket_armor' | 'personalize_item';
    expectTypeOf<SaveV22['inventory']['questServices'][string]['serviceId']>().toEqualTypeOf<HistoricalService>();
    expectTypeOf<SaveCurrent['inventory']['questServices'][string]['serviceId']>().toEqualTypeOf<HistoricalService | 'imbue_item'>();
  });

  it('registers the distinct current version', () => {
    expect(CURRENT_SAVE_VERSION).toBe(24);
    expect(MIGRATIONS[23]).toBeTypeOf('function');
    expect(runMigrations(predecessor(), 23).version).toBe(23);
  });

  it('refuses to manufacture a historical fixture from a reserved current imbue', () => {
    const save = predecessor();
    const current = { ...save, version: 23 as const, inventory: { ...save.inventory,
      questServices: { [reservedServices[0]]: { serviceId: 'imbue_item' as const, state: 'available' as const } }
    } };
    expect(() => withoutV20Fields(current)).toThrow('Service has no historical representation');
  });

  it('preserves historical service payloads when constructing predecessor fixtures', () => {
    const save = predecessor();
    const questServices = {
      'quests/act5-siege-on-harrogath#reward:service': { serviceId: 'socket_item' as const, state: 'available' as const },
      'quests/side-act5-anyas-gift#reward:service': { serviceId: 'personalize_item' as const,
        state: 'consumed' as const, targetItemId: 'already-salvaged' }
    };
    const current = { ...save, inventory: { ...save.inventory, questServices } };
    const before = structuredClone(current);
    expect(withoutV20Fields(current).inventory.questServices).toEqual(questServices);
    expect(current).toEqual(before);
  });

  it.each([false, true])('preserves partial legacy journals with claimed=%s by changing only version', rewardClaimed => {
    const save = predecessor();
    const old = { ...save, map: { ...save.map, questProgress: {
      'quests/act1-search-for-cain': { id: 'quests/act1-search-for-cain', status: 'completed' as const,
        rewardClaimed, objectives: { 'obj-inifuss-tree': true, 'obj-decode': false } },
      'quests/act1-tools-of-the-trade': { id: 'quests/act1-tools-of-the-trade', status: 'completed' as const,
        rewardClaimed, objectives: {} }
    } } };
    const before = structuredClone(old), expected = { ...old, version: 23 };
    expect(validateFrozenV22Save(old)).toEqual(toJsonSafe(old));
    const migrated = runMigrations(old, 23);
    expect(migrated).toEqual(expected);
    expect(migrated).not.toBe(old);
    for (const key of ['player', 'inventory', 'map', 'endgame', 'meta', 'mercs', 'formation'] as const) {
      expect(Reflect.get(migrated, key)).toBe(old[key]);
    }
    expect(decodeSave(toJsonSafe(old))).toEqual(withV24Defaults(expected));
    expect(validateSave(toJsonSafe(withV24Defaults(expected)))).toEqual(toJsonSafe(withV24Defaults(expected)));
    expect(old).toEqual(before);
  });

  it.each(reservedReceipts)('refuses reserved %s in both history and current until its graph is implemented', source => {
    const save = predecessor(), old = { ...save, map: { ...save.map, questReceipts: { [source]: true as const } } };
    const before = structuredClone(old);
    expect(() => validateFrozenV22Save(old)).toThrow('Invalid save');
    expect(() => runMigrations(old, 23)).toThrow('Invalid save');
    expect(() => decodeSave(old)).toThrow('Invalid save');
    expect(() => validateSave(withV24Defaults(old))).toThrow('Invalid save');
    expect(old).toEqual(before);
  });

  it.each(reservedServices)('refuses claimed flag-only reserved imbues from %s', source => {
    const save = predecessor(), id = source.split('#')[0];
    const quest = questLoader.loadQuests().find(row => row.id === id);
    if (!quest) throw new Error('Missing Act I service fixture');
    for (const state of ['available', 'consumed'] as const) {
      const old = { ...save, map: { ...save.map, questProgress: { [quest.id]: {
        id: quest.id, status: 'completed' as const, rewardClaimed: true,
        objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true]))
      } } }, inventory: { ...save.inventory, questServices: { [source]: state === 'available'
        ? { serviceId: 'imbue_item', state } : { serviceId: 'imbue_item', state, targetItemId: 'salvaged' } } } };
      const before = structuredClone(old);
      expect(() => runMigrations(old, 23)).toThrow('Invalid');
      expect(() => decodeSave(old)).toThrow('Invalid');
      expect(() => validateSave(withV24Defaults(old))).toThrow('Invalid');
      expect(old).toEqual(before);
    }
  });

  it('checks the raw frozen predecessor before normalization can erase a descriptor', () => {
    const save = predecessor(), old = { ...save, inventory: { ...save.inventory } };
    let reads = 0;
    Object.defineProperty(old.inventory, 'questServices', { enumerable: true, get: () => { reads++; return {}; } });
    expect(() => runMigrations(old, 23)).toThrow('Invalid save');
    expect(() => decodeSave(old)).toThrow('Invalid save');
    expect(reads).toBe(0);
  });

  it('binds current raw and normalized quest checks to live definitions while keeping literal22 frozen', () => {
    const save = predecessor(), id = 'quests/act2-radaments-lair';
    const quests = questLoader.loadQuests(), quest = quests.find(row => row.id === id);
    if (!quest) throw new Error('Missing Radament fixture');
    const old = { ...save, map: { ...save.map, questProgress: { [id]: {
      id, status: 'completed' as const, rewardClaimed: true,
      objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true]))
    } } }, inventory: { ...save.inventory, questItems: { [`${id}#reward:questItem`]:
      { itemId: 'items/book_of_skill', state: 'owned' as const } } } };
    expect(validateFrozenV22Save(old)).toEqual(toJsonSafe(old));
    expect(decodeSave(old)).toEqual(withV24Defaults(old));
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(quests.map(row => row.id === id ? {
      ...row, objectives: [...row.objectives, { id: 'future-objective', type: 'talk', description: 'Future' }]
    } : row));
    expect(validateFrozenV22Save(old)).toEqual(toJsonSafe(old));
    expect(runMigrations(old, 23)).toEqual({ ...old, version: 23 });
    expect(() => validateSave(withV24Defaults(old))).toThrow('Invalid save');
    expect(() => decodeSave(old)).toThrow('Invalid save');
  });
});
