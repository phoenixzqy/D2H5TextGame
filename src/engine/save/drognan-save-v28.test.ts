import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
/** Constructed admission/migration evidence; no earned recovery or reward credit. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CURRENT_SAVE_VERSION, MIGRATIONS } from '../types/save';
import { DROGNAN } from '../map/drognan-quest';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateSave } from './validate';

function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Drognan compatibility', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 2, currentSubAreaId: DROGNAN.areaId, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function recovered(rewardClaimed = false) {
  const save = sample();
  return { ...save, inventory: { ...save.inventory,
    questItems: { [DROGNAN.source]: { itemId: DROGNAN.itemId, state: 'owned' as const } } },
    map: { ...save.map, questProgress: { [DROGNAN.quest]: { id: DROGNAN.quest,
      status: 'completed' as const, rewardClaimed, objectives: { [DROGNAN.objective]: true } } } } };
}
describe('current30 physical Drognan receipt authority', () => {
  it.each([false, true])('admits exact owned source before/after Claim (claimed=%s)', claimed => {
    const save = recovered(claimed), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
    expect(save).toEqual(before);
  });
  it.each(['missing-row', 'wrong-id', 'in-progress', 'false-objective', 'missing-objective', 'extra-objective',
    'wrong-source', 'wrong-item', 'consumed'] as const)('rejects contradictory %s source', fault => {
      const save = recovered(), row = save.map.questProgress[DROGNAN.quest];
      if (fault === 'missing-row') Reflect.deleteProperty(save.map.questProgress, DROGNAN.quest);
      if (fault === 'wrong-id') Reflect.set(row, 'id', 'foreign');
      if (fault === 'in-progress') Reflect.set(row, 'status', 'inProgress');
      if (fault === 'false-objective') row.objectives[DROGNAN.objective] = false;
      if (fault === 'missing-objective') Reflect.deleteProperty(row.objectives, DROGNAN.objective);
      if (fault === 'extra-objective') Reflect.set(row.objectives, 'future', true);
      if (fault === 'wrong-source') { Reflect.deleteProperty(save.inventory.questItems, DROGNAN.source);
        Reflect.set(save.inventory.questItems, DROGNAN.source + '-future', { itemId: DROGNAN.itemId, state: 'owned' }); }
      if (fault === 'wrong-item') Reflect.set(save.inventory.questItems[DROGNAN.source], 'itemId', 'foreign');
      if (fault === 'consumed') Reflect.set(save.inventory.questItems[DROGNAN.source], 'state', 'consumed');
      expect(() => validateSave(save)).toThrow('Invalid');
      expect(() => decodeSave(save)).toThrow('Invalid');
    });
  it.each(['source', 'item', 'row', 'objectives', 'objective'] as const)(
    'rejects own %s getter before reading it at either save boundary', field => {
      const save = recovered(); let reads = 0;
      const row = save.map.questProgress[DROGNAN.quest];
      const target = field === 'source' ? save.inventory.questItems : field === 'item' ? save.inventory.questItems[DROGNAN.source]
        : field === 'row' ? save.map.questProgress : field === 'objectives' ? row : row.objectives;
      const key = field === 'source' ? DROGNAN.source : field === 'item' ? 'itemId'
        : field === 'row' ? DROGNAN.quest : field === 'objectives' ? 'objectives' : DROGNAN.objective;
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get() { reads++; return true; } });
      expect(() => validateSave(save)).toThrow('Invalid');
      expect(() => decodeSave(save)).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it.each(['hidden', 'symbol', 'inherited'] as const)('rejects %s source without normalization loss', fault => {
    const save = recovered(), items = save.inventory.questItems;
    if (fault === 'hidden') Object.defineProperty(items, DROGNAN.source, { enumerable: false });
    if (fault === 'symbol') Reflect.set(items, Symbol('source'), true);
    if (fault === 'inherited') { Reflect.deleteProperty(items, DROGNAN.source);
      Object.setPrototypeOf(items, { [DROGNAN.source]: { itemId: DROGNAN.itemId, state: 'owned' } }); }
    expect(() => validateSave(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
  });
});
describe('version-only27→28 preserves history without inference', () => {
  it('registers28 and validates actual27 before changing only the version', () => {
    expect(CURRENT_SAVE_VERSION).toBe(33);
    const migrate = MIGRATIONS[28]; if (!migrate) throw new Error('Missing28 migration');
    const input = { ...withoutV32Fields(sample()), version: 27 as const, historical: { keep: [7] } }, before = structuredClone(input);
    expect(migrate(input)).toEqual({ ...withoutV32Fields(input), version: 28 });
    expect(input).toEqual(before);
    expect(() => migrate({ ...input, timestamp: 'invalid' })).toThrow('Invalid');
    expect(() => migrate({ ...withoutV32Fields(recovered()), version: 27 })).toThrow('Invalid');
  });
  it.each([false, true])('preserves proofless completed historical row (claimed=%s)', claimed => {
    const base = recovered(claimed), input = { ...withoutV32Fields(base), version: 27 as const,
      inventory: { ...base.inventory, questItems: {} } }, before = structuredClone(input);
    const output = decodeSave(input);
    expect(toJsonSafe(output)).toEqual(toJsonSafe(withV32Defaults(input)));
    expect(output.inventory.questItems).toEqual({});
    expect(input).toEqual(before);
  });
});
