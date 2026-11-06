/** Constructed authority admission; no earned Fara/Radament campaign claim. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CURRENT_SAVE_VERSION, MIGRATIONS } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV31Save, validateQuestActionReceipts, validateSave } from './validate';

const quest = 'quests/side-act2-fara-favored', objective = 'obj-talk';
const prerequisite = 'quests/act2-radaments-lair', proof = `${quest}#action:talk-fara`;
function sample(claimed = false) {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Fara save contract', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { opaque: 7, gold: 93 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 2, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: ['areas/act1-catacombs'],
      questProgress: {
        [prerequisite]: { id: prerequisite, status: 'completed', rewardClaimed: false, objectives: { 'obj-kill-radament': true } },
        [quest]: { id: quest, status: 'completed', rewardClaimed: claimed, objectives: { [objective]: true } }
      } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function earned(claimed = false) {
  const save = sample(claimed);
  return { ...save, map: { ...save.map, questReceipts: { [proof]: true as const } } };
}
function historical() {
  const save = sample(), map = { ...save.map };
  Reflect.deleteProperty(map, 'bounties');
  return { ...save, version: 31 as const, map };
}
describe('unpublished32 Fara finite Talk receipt admission', () => {
  it.each([false, true])('roundtrips actual Talk with claimed=%s and leaves actors/wallet unchanged', claimed => {
    const save = earned(claimed), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
    expect(buildSave(save).map.questReceipts).toEqual({ [proof]: true });
    expect(save).toEqual(before);
  });
  it.each([false, true])('preserves inert source-free legacy history claimed=%s without fabricating a catalyst', claimed => {
    const save = sample(claimed), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save)).map.questReceipts).toEqual({});
    expect(decodeSave(toJsonSafe(save)).inventory.currencies).toEqual({ opaque: 7, gold: 93 });
    expect(save).toEqual(before);
  });
  it.each(['missing-side', 'incomplete-side', 'wrong-objective', 'missing-prerequisite', 'incomplete-prerequisite', 'false-receipt'] as const)(
    'rejects %s graph across raw/builder/decoder without erasing its receipt', fault => {
      const save = earned();
      if (fault === 'missing-side') Reflect.deleteProperty(save.map.questProgress, quest);
      if (fault === 'incomplete-side') Reflect.set(save.map.questProgress[quest] ?? {}, 'status', 'inProgress');
      if (fault === 'wrong-objective') Reflect.set(save.map.questProgress[quest] ?? {}, 'objectives', { forged: true });
      if (fault === 'missing-prerequisite') Reflect.deleteProperty(save.map.questProgress, prerequisite);
      if (fault === 'incomplete-prerequisite') Reflect.set(save.map.questProgress[prerequisite] ?? {}, 'objectives', { 'obj-kill-radament': false });
      if (fault === 'false-receipt') Reflect.set(save.map.questReceipts, proof, false);
      const before = structuredClone(save);
      expect(() => validateSave(save)).toThrow('Invalid');
      expect(() => buildSave(save)).toThrow('Invalid');
      expect(() => decodeSave(toJsonSafe(save))).toThrow('Invalid');
      expect(save).toEqual(before);
    });
  it('refuses receipt getters before evaluation at every raw boundary', () => {
    const save = earned(); let reads = 0;
    Object.defineProperty(save.map.questReceipts, proof, { enumerable: true, get() { reads++; return true; } });
    expect(() => validateSave(save)).toThrow('Invalid');
    expect(() => buildSave(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
    expect(() => validateQuestActionReceipts(save.map.questReceipts, save.map.questProgress)).toThrow('Invalid');
    expect(reads).toBe(0);
  });
  it('refuses actual future Talk source tagged31 without widening the literal reader or migration', () => {
    const old = historical(), save = { ...old, map: { ...old.map, questReceipts: { [proof]: true as const } } };
    const before = structuredClone(save);
    expect(() => validateFrozenV31Save(save)).toThrow('Invalid');
    expect(() => validateFrozenV31Save(toJsonSafe(save))).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
    expect(() => MIGRATIONS[CURRENT_SAVE_VERSION]?.(save)).toThrow('Invalid');
    expect(save).toEqual(before);
  });
});
