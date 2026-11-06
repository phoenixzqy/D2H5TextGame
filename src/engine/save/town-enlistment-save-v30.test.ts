import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
/** Constructed admission/migration controls; no earned enlistment or reward credit. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '../types/items';
import type { Mercenary } from '../types/entities';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type QuestProgressData } from '../types/save';
import { TOWN_ENLISTMENTS, type TownEnlistmentMetadata } from '../map/town-enlistment-quest';
import { FROZEN_V29 } from './frozen-v29';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateSave, validateFrozenV29Save, validateQuestItemLedger } from './validate';

const domains = Object.values(TOWN_ENLISTMENTS);
function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Captain save contract', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function enlisted(domain: TownEnlistmentMetadata, claimed = false) {
  const save = sample(), questProgress: Record<string, QuestProgressData> = { [domain.quest]: {
    id: domain.quest, status: 'completed', rewardClaimed: claimed, objectives: { [domain.objective]: true } } };
  if (domain.prerequisite) questProgress[domain.prerequisite.quest] = { id: domain.prerequisite.quest,
    status: 'completed', rewardClaimed: false,
    objectives: Object.fromEntries(domain.prerequisite.objectiveIds.map(id => [id, true])) };
  return { ...save, map: { ...save.map, questProgress, questReceipts: { [domain.proof]: true as const } } };
}
describe.each(domains)('native30 captain graph $quest', domain => {
  it.each([false, true])('admits retained proof before/after Claim with no merc ownership (%s)', claimed => {
    const save = enlisted(domain, claimed), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
    expect(toJsonSafe(buildSave(save))).toEqual(toJsonSafe(save));
    expect(validateQuestItemLedger({}, save.map.questProgress, save.map.questReceipts)).toEqual({});
    expect(save).toEqual(before);
  });
  it.each(['missing-row', 'wrong-id', 'in-progress', 'false-objective', 'missing-objective', 'extra-objective',
    'false-proof', 'unknown-proof', 'invalid-claimed', 'missing-main', 'main-in-progress', 'main-false'] as const)(
    'rejects contradictory %s at native and prospective boundaries', fault => {
      if (!domain.prerequisite && fault.startsWith('main-') || !domain.prerequisite && fault === 'missing-main') return;
      const save = enlisted(domain), row = save.map.questProgress[domain.quest]; if (!row) throw new Error('Missing fixture');
      if (fault === 'missing-row') Reflect.deleteProperty(save.map.questProgress, domain.quest);
      if (fault === 'wrong-id') Reflect.set(row, 'id', 'foreign');
      if (fault === 'in-progress') Reflect.set(row, 'status', 'inProgress');
      if (fault === 'false-objective') Reflect.set(row.objectives, domain.objective, false);
      if (fault === 'missing-objective') Reflect.deleteProperty(row.objectives, domain.objective);
      if (fault === 'extra-objective') Reflect.set(row.objectives, 'future', true);
      if (fault === 'false-proof') Reflect.set(save.map.questReceipts, domain.proof, false);
      if (fault === 'unknown-proof') Reflect.set(save.map.questReceipts, domain.proof + '-future', true);
      if (fault === 'invalid-claimed') Reflect.set(row, 'rewardClaimed', undefined);
      if (domain.prerequisite) {
        const main = save.map.questProgress[domain.prerequisite.quest]; if (!main) throw new Error('Missing main');
        if (fault === 'missing-main') Reflect.deleteProperty(save.map.questProgress, domain.prerequisite.quest);
        if (fault === 'main-in-progress') Reflect.set(main, 'status', 'inProgress');
        if (fault === 'main-false') for (const id of domain.prerequisite.objectiveIds) Reflect.set(main.objectives, id, false);
      }
      expect(() => validateSave(save)).toThrow('Invalid');
      expect(() => decodeSave(save)).toThrow('Invalid');
      expect(() => validateQuestItemLedger({}, save.map.questProgress, save.map.questReceipts)).toThrow('Invalid');
    });
  it.each(['proof', 'row', 'objectives', 'objective', 'status', 'main-row', 'main-objective'] as const)(
    'rejects malformed raw %s descriptors before normalization', field => {
      if (!domain.prerequisite && field.startsWith('main-')) return;
      for (const fault of ['getter', 'hidden', 'symbol', 'inherited']) {
        const save = enlisted(domain), row = save.map.questProgress[domain.quest]; let reads = 0;
        if (!row) throw new Error('Missing fixture');
        const target = field === 'proof' ? save.map.questReceipts : field === 'row' || field === 'main-row'
          ? save.map.questProgress : field === 'objective' ? row.objectives : field === 'main-objective'
            ? save.map.questProgress[domain.prerequisite?.quest ?? '']?.objectives : row;
        const key = field === 'proof' ? domain.proof : field === 'row' ? domain.quest : field === 'main-row'
          ? domain.prerequisite?.quest : field === 'objective' ? domain.objective : field === 'main-objective'
            ? domain.prerequisite?.objectiveIds[0] : field;
        if (!target || !key) throw new Error('Missing descriptor fixture');
        const value: unknown = Reflect.get(target, key);
        if (fault === 'getter') Object.defineProperty(target, key, { configurable: true, enumerable: true,
          get() { reads++; return value; } });
        if (fault === 'hidden') Object.defineProperty(target, key, { enumerable: false });
        if (fault === 'symbol') Reflect.set(target, Symbol('extra'), true);
        if (fault === 'inherited') { Reflect.deleteProperty(target, key); Object.setPrototypeOf(target, { [key]: value }); }
        expect(() => validateSave(save)).toThrow('Invalid');
        expect(() => decodeSave(save)).toThrow('Invalid');
        expect(() => validateQuestItemLedger({}, save.map.questProgress, save.map.questReceipts)).toThrow('Invalid');
        expect(reads).toBe(0);
      }
    });
  it('literal29 rejects the new proof before direct migration or decode', () => {
    const input = { ...withoutV32Fields(enlisted(domain)), version: 29 as const };
    expect(() => validateFrozenV29Save(input)).toThrow('Invalid');
    expect(() => MIGRATIONS[30]?.(input)).toThrow('Invalid');
    expect(() => decodeSave(input)).toThrow('Invalid');
  });
  it.each([false, true])('version-only migration preserves proofless legacy history and absent recruit (%s)', claimed => {
    const source = enlisted(domain, claimed), input = { ...withoutV32Fields(source), version: 29 as const,
      map: { ...withoutV32Fields(source).map, questReceipts: {} }, historical: { keep: [7] } }, before = structuredClone(input);
    const migrate = MIGRATIONS[30]; if (!migrate) throw new Error('Missing30 migration');
    expect(validateFrozenV29Save(input)).toEqual(toJsonSafe(input));
    expect(migrate(input)).toEqual({ ...withoutV32Fields(input), version: 30 });
    expect(toJsonSafe(decodeSave(input))).toEqual(toJsonSafe(withV32Defaults(input)));
    expect(input).toEqual(before);
  });
});
describe('current31 captain preservation and direct30 migration', () => {
  it('registers31 and rejects malformed actual29 before version-only migration', () => {
    expect(CURRENT_SAVE_VERSION).toBe(33);
    expect(() => MIGRATIONS[30]?.({ ...withoutV32Fields(sample()), version: 29, timestamp: 'invalid' })).toThrow('Invalid');
  });
  it('the supplied literal29 domain omits future family authority and preserves sparse legacy rows', () => {
    const save = sample(), domain = TOWN_ENLISTMENTS.kashya;
    const input = { ...withoutV32Fields(save), version: 29 as const, map: { ...withoutV32Fields(save).map,
      questProgress: { [domain.quest]: { id: domain.quest, status: 'completed', objectives: {} } } } };
    expect(validateFrozenV29Save(input)).toEqual(toJsonSafe(input));
    expect(() => validateFrozenV29Save({ ...input, map: { ...input.map,
      questReceipts: { [domain.proof]: true } } })).toThrow('Invalid');
  });
  it('preserves all proofs, invested suffixed mercs, equipment Maps, resources and independent sources', () => {
    const base = sample(), questProgress: Record<string, QuestProgressData> = {}, questReceipts: Record<string, true> = {};
    for (const domain of domains) {
      Object.assign(questProgress, enlisted(domain, true).map.questProgress); questReceipts[domain.proof] = true;
    }
    const cain = FROZEN_V29.act1.cain;
    questProgress[cain.quest] = { id: cain.quest, status: 'inProgress', rewardClaimed: false,
      objectives: { [cain.treeObjective]: true } };
    const gear: Item = { id: 'preserved-sword', baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1,
      socketCapacity: 2, socketContents: [{ kind: 'rune', id: 'runes/eld' }], identified: true, equipped: true,
      affixes: [{ affixId: 'preserved-map', values: new Map([['statMods.strength', 2]]) }] };
    const mercs: Mercenary[] = ['one', 'two'].map(suffix => ({ ...base.player, type: 'mercenary' as const,
      id: `${TOWN_ENLISTMENTS.greiz.mercId}#${suffix}`, archetype: 'desert-merc', classId: 'desert-merc', rarity: 'R' as const,
      level: 22, equipment: suffix === 'one' ? [gear] : [], derivedStats: { ...base.player.derivedStats, life: 19, mana: 7 } }));
    const input = { ...base, preservedExtension: { counter: 23 }, inventory: { ...base.inventory,
      questItems: { [cain.source]: { itemId: cain.itemId, state: 'owned' as const } } },
      mercs: { ownedMercs: mercs, fieldedMercId: mercs[1]?.id ?? null,
        mercEquipment: { [mercs[0]?.id ?? '']: { weapon: gear } },
        mercProgress: Object.fromEntries(mercs.map(merc => [merc.id, { experience: 987, experienceToNextLevel: 1234, level: 22 }])) },
      map: { ...base.map, currentAct: 5, currentSubAreaId: 'areas/act5-crystalline-passage', questProgress, questReceipts } };
    const before = structuredClone(input);
    const legacy = { ...withoutV32Fields(input), version: 29 as const, map: { ...withoutV32Fields(input).map, questReceipts: {} } };
    const migrate = MIGRATIONS[30]; if (!migrate) throw new Error('Missing30 migration');
    expect(migrate(legacy)).toEqual({ ...legacy, version: 30 });
    expect(toJsonSafe(decodeSave(legacy))).toEqual(toJsonSafe(withV32Defaults(legacy)));
    expect(validateSave(input)).toEqual(toJsonSafe(input));
    const decoded = decodeSave(toJsonSafe(input));
    expect(toJsonSafe(decoded)).toEqual(toJsonSafe(input));
    const restoredAffix = decoded.mercs.mercEquipment[mercs[0]?.id ?? '']?.weapon?.affixes?.[0];
    if (!restoredAffix || !('values' in restoredAffix)) throw new Error('Missing preserved affix Map');
    expect(restoredAffix.values).toBeInstanceOf(Map);
    expect(toJsonSafe(buildSave(decoded))).toEqual(toJsonSafe({ ...input, preservedExtension: undefined }));
    expect(input).toEqual(before);
  });
});
