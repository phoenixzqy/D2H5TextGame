import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
/** Constructed cache graphs; these controls confer no earned campaign credit. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { ACT2_CACHES, type Act2CacheKey } from '../map/act2-cache-quests';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type QuestItemLedger, type QuestProgressData } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV30Save, validateFrozenV31Save, validateQuestItemLedger, validateSave } from './validate';

function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Cache save contract', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17, gold: 93, opaque: 7 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function fixture(keys: readonly Act2CacheKey[], claimed = false) {
  const save = sample(), questItems: QuestItemLedger = {}, questProgress: Record<string, QuestProgressData> = {};
  for (const key of keys) {
    const cache = ACT2_CACHES[key];
    Reflect.set(questItems, cache.source, { itemId: cache.itemId, state: 'owned' });
    questProgress[cache.quest] = { id: cache.quest, status: 'completed', rewardClaimed: claimed,
      objectives: { [cache.objective]: true } };
  }
  return { ...save, inventory: { ...save.inventory, questItems }, map: { ...save.map, questProgress } };
}
const subsets: readonly (readonly Act2CacheKey[])[] = [[], ['horazon'], ['elzix'], ['horazon', 'elzix']];

describe('unpublished32 exact retained cache union', () => {
  it.each(subsets.map(keys => [keys] as const))('roundtrips legal independent subset %j before and after Claim', keys => {
    for (const claimed of [false, true]) {
      const input = fixture(keys, claimed), before = structuredClone(input);
      expect(validateSave(input)).toEqual(toJsonSafe(input));
      expect(toJsonSafe(decodeSave(toJsonSafe(input)))).toEqual(toJsonSafe(input));
      expect(buildSave(input).inventory.questItems).toEqual(input.inventory.questItems);
      expect(input).toEqual(before);
    }
  });
  it.each(['horazon', 'elzix'] as const)('leaves source-free %s legacy flags and opaque balances unchanged', key => {
    const cache = ACT2_CACHES[key], input = fixture([], true);
    Reflect.set(input.map.questProgress, cache.quest, { id: cache.quest, status: 'completed',
      rewardClaimed: true, objectives: { [cache.objective]: true } });
    const old = { ...withoutV32Fields(input), version: 31 as const }, before = structuredClone(old);
    const migrated = MIGRATIONS[CURRENT_SAVE_VERSION]?.(old);
    expect(migrated).toEqual(withV32Defaults(old));
    expect(decodeSave(old).inventory.questItems).toEqual({});
    expect(decodeSave(old).inventory.currencies).toEqual(old.inventory.currencies);
    expect(old).toEqual(before);
  });
  it.each(['consumed', 'swapped-item', 'wrong-objective', 'uncompleted', 'unknown-source', 'extra-item-field'] as const)(
    'refuses a %s graph without dropping the other valid cache', fault => {
      const input = fixture(['horazon', 'elzix']), cache = ACT2_CACHES.horazon;
      if (fault === 'consumed') Reflect.set(input.inventory.questItems[cache.source] ?? {}, 'state', 'consumed');
      if (fault === 'swapped-item') Reflect.set(input.inventory.questItems[cache.source] ?? {}, 'itemId', ACT2_CACHES.elzix.itemId);
      if (fault === 'wrong-objective') Reflect.set(input.map.questProgress[cache.quest] ?? {}, 'objectives', { 'obj-forged': true });
      if (fault === 'uncompleted') Reflect.set(input.map.questProgress[cache.quest] ?? {}, 'status', 'inProgress');
      if (fault === 'unknown-source') Reflect.set(input.inventory.questItems, `${cache.source}-extra`, { itemId: cache.itemId, state: 'owned' });
      if (fault === 'extra-item-field') Reflect.set(input.inventory.questItems[cache.source] ?? {}, 'extra', 1);
      const before = structuredClone(input);
      expect(() => validateSave(input)).toThrow('Invalid');
      expect(() => decodeSave(toJsonSafe(input))).toThrow('Invalid');
      expect(() => validateQuestItemLedger(input.inventory.questItems, input.map.questProgress)).toThrow('Invalid');
      expect(() => buildSave(input)).toThrow('Invalid');
      expect(input).toEqual(before);
    });
  it.each(['source', 'state', 'row', 'objectives', 'objective', 'claimed'] as const)(
    'refuses %s getter before any raw/build/decode property evaluation', field => {
      const input = fixture(['horazon', 'elzix']), cache = ACT2_CACHES.horazon;
      const row = input.map.questProgress[cache.quest];
      if (!row) throw new Error('Missing fixture');
      const target = field === 'source' ? input.inventory.questItems : field === 'state' ? input.inventory.questItems[cache.source]
        : field === 'row' ? input.map.questProgress : field === 'objective' ? row.objectives : row;
      const key = field === 'source' ? cache.source : field === 'row' ? cache.quest : field === 'objective' ? cache.objective
        : field === 'claimed' ? 'rewardClaimed' : field;
      if (!target) throw new Error('Missing target');
      const value: unknown = Reflect.get(target, key); let reads = 0;
      Object.defineProperty(target, key, { enumerable: true, get() { reads++; return value; } });
      expect(() => validateSave(input)).toThrow('Invalid');
      expect(() => buildSave(input)).toThrow('Invalid');
      expect(() => decodeSave(input)).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it.each(['horazon', 'elzix'] as const)('rejects successor %s proof tagged31 or30 across historical ingress', key => {
    for (const version of [30, 31] as const) {
      const input = { ...fixture([key]), version }, before = structuredClone(input);
      const read = version === 31 ? validateFrozenV31Save : validateFrozenV30Save;
      expect(() => read(input)).toThrow('Invalid');
      expect(() => read(toJsonSafe(input))).toThrow('Invalid');
      expect(() => decodeSave(input)).toThrow('Invalid');
      expect(() => MIGRATIONS[version + 1]?.(input)).toThrow('Invalid');
      expect(input).toEqual(before);
    }
  });
});
