/** Constructed authority and migration checks, not earned Siege/browser evidence. */
import { describe, expect, it } from 'vitest';
import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type SaveV25 } from '../types/save';
import type { QuestServiceEntry, QuestServiceLedger } from '../services/quest-services';
import { FROZEN_V25 } from './frozen-v25';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateSave, validateFrozenV25Save, validateQuestActionReceipts } from './validate';

const side = 'quests/side-act5-larzuks-sockets', objective = 'obj-bring-item';
const proof = `${side}#action:present-item`, siege = 'quests/act5-siege-on-harrogath';
const siegeSource = FROZEN_V25.act5.encounters.find(row => row.questId === siege);
if (!siegeSource) throw new Error('Missing accepted Siege contract');
const victory = siegeSource.proof, siegeObjective = siegeSource.objectiveId;
function predecessor(): SaveV25 {
  return { ...withoutV32Fields(buildSave({ timestamp: 1000, player: createMockPlayer('Larzuk compatibility', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 5, currentSubAreaId: 'areas/act5-bloody-foothills', discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } })), version: 25 };
}
function qualified(rewardClaimed = false) {
  const save = withV32Defaults(predecessor());
  return { ...save, version: CURRENT_SAVE_VERSION, map: { ...save.map,
    questProgress: { [side]: { id: side, status: 'completed' as const, rewardClaimed, objectives: { [objective]: true } },
      [siege]: { id: siege, status: 'completed' as const, rewardClaimed: false, objectives: { [siegeObjective]: true } } },
    questReceipts: { [victory]: true as const, [proof]: true as const } } };
}
describe('native Larzuk Present receipt', () => {
  it('admits only the qualified new receipt at the shared action boundary', () => {
    const save = qualified();
    expect(validateQuestActionReceipts(save.map.questReceipts, save.map.questProgress)).toEqual(save.map.questReceipts);
  });
  it.each([false, true])('admits exact proof before/after Claim without requiring Siege Claim (claimed=%s)', claimed => {
    const save = qualified(claimed), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save))).toEqual(save);
    expect(validateQuestActionReceipts(save.map.questReceipts, save.map.questProgress)).toEqual(save.map.questReceipts);
    expect(save).toEqual(before);
  });
  it.each(['available', 'consumed'] as const)('preserves new proof with an independent side %s charge and main charge', state => {
    const base = qualified(true);
    const sideEntry: QuestServiceEntry = state === 'consumed'
      ? { serviceId: 'socket_item', state, targetItemId: 'consumed-side-target' }
      : { serviceId: 'socket_item', state };
    const questServices: QuestServiceLedger = { [`${side}#reward:service`]: sideEntry,
      [`${siege}#reward:service`]: { serviceId: 'socket_item', state: 'available' } };
    const save = { ...base, map: { ...base.map, questProgress: { ...base.map.questProgress,
      [siege]: { ...base.map.questProgress[siege], rewardClaimed: true } } }, inventory: { ...base.inventory,
      questServices } };
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
    expect(toJsonSafe(buildSave(save))).toEqual(toJsonSafe(save));
  });
  it.each(['missing-side', 'wrong-id', 'in-progress', 'false-objective', 'missing-objective', 'extra-objective',
    'missing-siege', 'missing-victory', 'incomplete-siege', 'missing-siege-objective'] as const)('rejects %s source graphs', fault => {
      const save = qualified(), progress = save.map.questProgress;
      if (fault === 'missing-side') Reflect.deleteProperty(progress, side);
      if (fault === 'wrong-id') Reflect.set(progress[side], 'id', 'other');
      if (fault === 'in-progress') Reflect.set(progress[side], 'status', 'inProgress');
      if (fault === 'false-objective') Reflect.set(progress[side].objectives, objective, false);
      if (fault === 'missing-objective') Reflect.deleteProperty(progress[side].objectives, objective);
      if (fault === 'extra-objective') Reflect.set(progress[side].objectives, 'future', true);
      if (fault === 'missing-siege') Reflect.deleteProperty(progress, siege);
      if (fault === 'missing-victory') Reflect.deleteProperty(save.map.questReceipts, victory);
      if (fault === 'incomplete-siege') Reflect.set(progress[siege], 'status', 'inProgress');
      if (fault === 'missing-siege-objective') Reflect.deleteProperty(progress[siege].objectives, siegeObjective);
      expect(() => validateSave(save)).toThrow('Invalid');
      expect(() => validateQuestActionReceipts(save.map.questReceipts, progress)).toThrow('Invalid');
    });
  it.each(['false', 'undefined', 'hidden', 'accessor', 'inherited', 'symbol'] as const)('rejects %s receipt without evaluating getters', fault => {
    const save = qualified(); let invoked = false;
    const receipts = fault === 'symbol' ? { [Symbol('proof')]: true, [victory]: true }
      : Object.defineProperty({ [victory]: true }, proof, fault === 'accessor'
        ? { configurable: true, enumerable: true, get: () => { invoked = true; return true; } }
        : { configurable: true, enumerable: fault !== 'hidden', value: fault === 'false' ? false : fault === 'undefined' ? undefined : true });
    if (fault === 'inherited') {
      Reflect.deleteProperty(receipts, proof);
      Object.setPrototypeOf(receipts, { [proof]: true });
    }
    expect(() => validateQuestActionReceipts(receipts, save.map.questProgress)).toThrow('Invalid');
    expect(() => validateSave({ ...save, map: { ...save.map, questReceipts: receipts } })).toThrow('Invalid');
    expect(invoked).toBe(false);
  });
  it('literal25 refuses new proof before any migration can preserve it', () => {
    const save = { ...withoutV32Fields(qualified()), version: 25 }, before = structuredClone(save);
    expect(() => validateFrozenV25Save(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
    expect(save).toEqual(before);
  });
});
describe('version-only25→26 migration preserves legacy history', () => {
  it('registers the new current version and validates the predecessor before spreading it', () => {
    expect(CURRENT_SAVE_VERSION).toBe(33);
    const migrate = MIGRATIONS[26];
    expect(migrate).toBeTypeOf('function');
    if (!migrate) throw new Error('Missing26 migration');
    const save = predecessor(), before = structuredClone(save);
    expect(migrate(save)).toEqual({ ...save, version: 26 });
    expect(save).toEqual(before);
    expect(() => migrate({ ...save, timestamp: 'invalid' })).toThrow('Invalid');
    expect(() => migrate({ ...withoutV32Fields(qualified()), version: 25 })).toThrow('Invalid');
  });
  it.each(['available', 'consumed', 'absent', 'unclaimed'] as const)('retains %s side history without proof/replacement/income', state => {
    const base = qualified(state !== 'unclaimed');
    Reflect.deleteProperty(base.map.questReceipts, proof);
    const services = state === 'available' ? { [`${side}#reward:service`]: { serviceId: 'socket_item', state: 'available' } }
      : state === 'consumed' ? { [`${side}#reward:service`]: { serviceId: 'socket_item', state: 'consumed', targetItemId: 'salvaged-old-item' } } : {};
    const save = { ...withoutV32Fields(base), version: 25, inventory: { ...base.inventory, questServices: services } };
    const before = structuredClone(save), out = decodeSave(save);
    expect(toJsonSafe(out)).toEqual(toJsonSafe(withV32Defaults(save)));
    expect(out.map.questReceipts).not.toHaveProperty(proof);
    expect(save).toEqual(before);
  });
  it('preserves affix Maps, unknown fields and stored resources in the direct migration', () => {
    const save = predecessor(), charm = { id: 'preserved', baseId: 'items/base/small-charm', rarity: 'unique', level: 32,
      uniqueId: 'items/unique/ormus-charm', equipped: true, identified: true, socketCapacity: 0,
      affixes: [{ affixId: 'old', values: new Map([['statMods.life', 7]]) }] };
    const input = { ...save, historical: { keep: [7] }, player: { ...save.player,
      derivedStats: { ...save.player.derivedStats, lifeMax: 999, manaMax: 888, life: 3, mana: 2 } },
      inventory: { ...save.inventory, equipped: { charm } } }, before = structuredClone(input);
    const migrate = MIGRATIONS[26];
    if (!migrate) throw new Error('Missing26 migration');
    const out = migrate(input);
    expect(out).toEqual({ ...input, version: 26 });
    expect(input).toEqual(before);
  });
});
