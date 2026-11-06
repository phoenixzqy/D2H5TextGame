import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
/** Constructed admission/migration evidence; no earned Rescue or recruiting credit. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Mercenary } from '../types/entities';
import type { Item } from '../types/items';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type SaveV26 } from '../types/save';
import { FROZEN_V25 } from './frozen-v25';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateSave, validateFrozenV26Save, validateQuestActionReceipts } from './validate';

const side = 'quests/side-act5-qual-kehk-merc', objective = 'obj-hire';
const proof = `${side}#action:enlist-recruit`, rescue = FROZEN_V25.act5.rescueQuest;
const cages = FROZEN_V25.act5.cageProofs;
function required<T>(value: T | undefined): T { if (value === undefined) throw new Error('Missing Warband save fixture'); return value; }
function predecessor(): SaveV26 {
  return { ...withoutV32Fields(buildSave({ timestamp: 1000, player: createMockPlayer('Warband compatibility', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 5, currentSubAreaId: 'areas/act5-frigid-highlands', discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } })), version: 26 };
}
function qualified(rewardClaimed = false) {
  const save = predecessor();
  return { ...withV32Defaults(save), map: { ...withV32Defaults(save).map,
    questProgress: { [side]: { id: side, status: 'completed' as const, rewardClaimed, objectives: { [objective]: true } },
      [rescue]: { id: rescue, status: 'completed' as const, rewardClaimed: false,
        objectives: { [FROZEN_V25.act5.rescueObjective]: true } } },
    questReceipts: { ...Object.fromEntries(cages.map(source => [source, true as const])), [proof]: true as const } } };
}
function retainedRoster() {
  const save = predecessor(), blade: Item = { id: 'retained-blade', baseId: 'items/base/wp1h-short-sword',
    rarity: 'magic', level: 1, identified: true, equipped: true, socketCapacity: 0,
    affixes: [{ affixId: 'historical-map', values: new Map([['statMods.life', 7]]) }] };
  const merc = (suffix: string): Mercenary => ({ ...save.player, id: `mercs/act5-barbarian-recruit#${suffix}`,
    type: 'mercenary', archetype: 'barbarian', rarity: 'R', level: 22, equipment: suffix === 'a' ? [blade] : [],
    derivedStats: { ...save.player.derivedStats, life: 3, mana: 2 } });
  const a = merc('a'), b = merc('b');
  return { ownedMercs: [a, b], fieldedMercId: b.id, mercEquipment: { [a.id]: { weapon: blade } },
    mercProgress: { [a.id]: { experience: 123, experienceToNextLevel: 777, level: 22 },
      [b.id]: { experience: 1, experienceToNextLevel: 888, level: 22 } } };
}
describe('current30 finite historical Warband enlistment authority', () => {
  it.each([false, true])('admits exact proof before/after Claim, with Rescue still unclaimed (claimed=%s)', claimed => {
    const save = qualified(claimed), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
    expect(validateQuestActionReceipts(save.map.questReceipts, save.map.questProgress)).toEqual(save.map.questReceipts);
    expect(save).toEqual(before);
  });
  it('retains historical proof after dismissal without requiring continued mercenary ownership', () => {
    const save = qualified();
    expect(save.mercs.ownedMercs).toEqual([]);
    expect(decodeSave(save).map).toEqual(save.map);
  });
  it('preserves multiple suffixed recruits, fielding, equipment Maps, XP and resources exactly', () => {
    const save = { ...qualified(), mercs: retainedRoster() }, before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save))).toEqual(save);
    expect(toJsonSafe(buildSave(save))).toEqual(toJsonSafe(save));
    expect(save).toEqual(before);
  });
  it.each(['missing-side', 'wrong-id', 'in-progress', 'false-objective', 'missing-objective', 'extra-objective',
    'missing-rescue', 'incomplete-rescue', 'missing-rescue-objective', ...cages] as const)('rejects contradictory %s source', fault => {
    const save = qualified(), progress = save.map.questProgress;
    if (fault === 'missing-side') Reflect.deleteProperty(progress, side);
    if (fault === 'wrong-id') Reflect.set(progress[side], 'id', 'other');
    if (fault === 'in-progress') Reflect.set(progress[side], 'status', 'inProgress');
    if (fault === 'false-objective') Reflect.set(progress[side].objectives, objective, false);
    if (fault === 'missing-objective') Reflect.deleteProperty(progress[side].objectives, objective);
    if (fault === 'extra-objective') Reflect.set(progress[side].objectives, 'future', true);
    if (fault === 'missing-rescue') Reflect.deleteProperty(progress, rescue);
    if (fault === 'incomplete-rescue') Reflect.set(required(progress[rescue]), 'status', 'inProgress');
    if (fault === 'missing-rescue-objective') Reflect.deleteProperty(required(progress[rescue]).objectives, FROZEN_V25.act5.rescueObjective);
    if (cages.includes(fault)) Reflect.deleteProperty(save.map.questReceipts, fault);
    expect(() => validateSave(save)).toThrow('Invalid');
    expect(() => validateQuestActionReceipts(save.map.questReceipts, progress)).toThrow('Invalid');
  });
  it.each(['false', 'undefined', 'hidden', 'accessor', 'inherited', 'symbol', 'unknown'] as const)(
    'rejects %s proof without invoking accessors', fault => {
      const save = qualified(); let reads = 0;
      const receipts = { ...save.map.questReceipts };
      Reflect.deleteProperty(receipts, proof);
      if (fault === 'symbol') Reflect.set(receipts, Symbol('proof'), true);
      else if (fault === 'unknown') Reflect.set(receipts, `${proof}-unknown`, true);
      else if (fault === 'inherited') Object.setPrototypeOf(receipts, { [proof]: true });
      else Object.defineProperty(receipts, proof, fault === 'accessor'
        ? { configurable: true, enumerable: true, get() { reads++; return true; } }
        : { configurable: true, enumerable: fault !== 'hidden', value: fault === 'false' ? false : fault === 'undefined' ? undefined : true });
      expect(() => validateQuestActionReceipts(receipts, save.map.questProgress)).toThrow('Invalid');
      expect(() => validateSave({ ...save, map: { ...save.map, questReceipts: receipts } })).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it.each(['side-row', 'rescue-row', 'side-objectives', 'rescue-objective'] as const)(
    'rejects own %s getter without executing it at either save boundary', field => {
      const save = qualified(); let reads = 0;
      const target = field === 'side-objectives' ? save.map.questProgress[side]
        : field === 'rescue-objective' ? required(save.map.questProgress[rescue]).objectives : save.map.questProgress;
      const key = field === 'side-objectives' ? 'objectives' : field === 'rescue-objective'
        ? FROZEN_V25.act5.rescueObjective : field === 'side-row' ? side : rescue;
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get() { reads++; return true; } });
      expect(() => validateQuestActionReceipts(save.map.questReceipts, save.map.questProgress)).toThrow('Invalid');
      expect(() => validateSave(save)).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it('literal26 refuses new proof before a migration can preserve it', () => {
    const save = { ...withoutV32Fields(qualified()), version: 26 }, before = structuredClone(save);
    expect(() => validateFrozenV26Save(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
    expect(save).toEqual(before);
  });
});
describe('version-only26→27 retains proofless history and owned investment', () => {
  it('registers27 and validates actual26 before changing only the version', () => {
    expect(CURRENT_SAVE_VERSION).toBe(33);
    const migrate = MIGRATIONS[27];
    if (!migrate) throw new Error('Missing27 migration');
    const input = { ...predecessor(), mercs: retainedRoster(), historical: { keep: [7] } }, before = structuredClone(input);
    expect(migrate(input)).toEqual({ ...withoutV32Fields(input), version: 27 });
    expect(input).toEqual(before);
    expect(() => migrate({ ...input, timestamp: 'invalid' })).toThrow('Invalid');
    expect(() => migrate({ ...withoutV32Fields(qualified()), version: 26 })).toThrow('Invalid');
  });
  it.each(['claimed-absent', 'unclaimed-absent', 'claimed-owned', 'unclaimed-owned'] as const)(
    'preserves %s without inferring proof, recruits, fielding or rewards', history => {
      const base = qualified(history.startsWith('claimed'));
      Reflect.deleteProperty(base.map.questReceipts, proof);
      const input = { ...withoutV32Fields(base), version: 26, mercs: history.endsWith('owned') ? retainedRoster() : base.mercs };
      const before = structuredClone(input), output = decodeSave(input);
      expect(toJsonSafe(output)).toEqual(toJsonSafe(withV32Defaults(input)));
      expect(output.map.questReceipts).not.toHaveProperty(proof);
      expect(input).toEqual(before);
    });
});
