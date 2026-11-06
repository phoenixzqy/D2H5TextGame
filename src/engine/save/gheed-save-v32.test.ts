/** Constructed finite authority; no claim of an owner-earned salvage commission. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type QuestItemLedger } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV31Save, validateSave } from './validate';

const quest = 'quests/side-act1-gheeds-gamble', objective = 'obj-gamble-5';
const sources = Array.from({ length: 5 }, (_, i) => `${quest}#objective:${objective}:source:lot-${String(i + 1)}`);
function sample(completed = false, claimed = false) {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Gheed save contract', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { opaque: 7, gold: 93 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [],
      questProgress: { [quest]: { id: quest, status: completed ? 'completed' : 'inProgress',
        rewardClaimed: claimed, objectives: { [objective]: completed } } } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function recovered(count: number, consumed = false) {
  const save = sample(count === 5, consumed);
  const questItems: QuestItemLedger = Object.fromEntries(sources.slice(0, count)
    .map(source => [source, { itemId: 'quest/gheed_salvage_lot', state: consumed ? 'consumed' : 'owned' }]));
  return { ...save, inventory: { ...save.inventory, questItems } };
}
describe('unpublished32 Gheed source admission', () => {
  it.each([[1, false], [4, false], [5, false], [5, true]] as const)(
    'roundtrips %s actual lots consumed=%s without changing actors or wallet', (count, consumed) => {
      const save = recovered(count, consumed), before = structuredClone(save);
      expect(validateSave(save)).toEqual(toJsonSafe(save));
      expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
      expect(buildSave(save).inventory.questItems).toEqual(save.inventory.questItems);
      expect(save).toEqual(before);
    });
  it.each([false, true])('preserves inert source-free completed history claimed=%s', claimed => {
    const save = sample(true, claimed), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save)).inventory.questItems).toEqual({});
    expect(save).toEqual(before);
  });
  it.each(['missing-row', 'wrong-objective', 'incomplete-full', 'claimed-owned', 'partial-consumed',
    'mixed', 'wrong-item', 'sixth-source'] as const)('rejects %s graph without repairing it', fault => {
    const save = recovered(5), entry = save.inventory.questItems[sources[0] ?? ''];
    if (!entry) throw new Error('Missing first lot');
    if (fault === 'missing-row') Reflect.deleteProperty(save.map.questProgress, quest);
    if (fault === 'wrong-objective') Reflect.set(save.map.questProgress[quest] ?? {}, 'objectives', { forged: true });
    if (fault === 'incomplete-full') Reflect.set(save.map.questProgress[quest] ?? {}, 'status', 'inProgress');
    if (fault === 'claimed-owned') Reflect.set(save.map.questProgress[quest] ?? {}, 'rewardClaimed', true);
    if (fault === 'partial-consumed') {
      for (const source of sources.slice(1)) Reflect.deleteProperty(save.inventory.questItems, source);
      Reflect.set(entry, 'state', 'consumed');
    }
    if (fault === 'mixed') Reflect.set(entry, 'state', 'consumed');
    if (fault === 'wrong-item') Reflect.set(entry, 'itemId', 'quest/spider_venom_gland');
    if (fault === 'sixth-source') Reflect.set(save.inventory.questItems,
      `${quest}#objective:${objective}:source:lot-6`, { ...entry });
    const before = structuredClone(save);
    expect(() => validateSave(save)).toThrow('Invalid');
    expect(() => buildSave(save)).toThrow('Invalid');
    expect(() => decodeSave(toJsonSafe(save))).toThrow('Invalid');
    expect(save).toEqual(before);
  });
  it('refuses lot entry getters before evaluation at raw and builder boundaries', () => {
    const save = recovered(1); let reads = 0;
    Object.defineProperty(save.inventory.questItems, sources[0] ?? '', { enumerable: true,
      get() { reads++; return { itemId: 'quest/gheed_salvage_lot', state: 'owned' }; } });
    expect(() => validateSave(save)).toThrow('Invalid');
    expect(() => buildSave(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
    expect(reads).toBe(0);
  });
  it.each([1, 5])('literal31 and migration reject %s future lots under the old tag', count => {
    const save = recovered(count), map = { ...save.map }; Reflect.deleteProperty(map, 'bounties');
    const old = { ...save, version: 31 as const, map }, before = structuredClone(old);
    expect(() => validateFrozenV31Save(old)).toThrow('Invalid');
    expect(() => decodeSave(toJsonSafe(old))).toThrow('Invalid');
    expect(() => MIGRATIONS[CURRENT_SAVE_VERSION]?.(old)).toThrow('Invalid');
    expect(old).toEqual(before);
  });
});
