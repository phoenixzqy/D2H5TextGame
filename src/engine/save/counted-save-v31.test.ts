import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
/** Constructed admission/migration controls; no earned recovery or reward credit. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadCountedQuestItems } from '@/data/loaders/counted-quest-items';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type QuestItemLedger, type QuestProgressData } from '../types/save';
import { TOWN_ENLISTMENTS } from '../map/town-enlistment-quest';
import { deriveEquippedPlayerStats } from '../progression/equipped-stats';
import type { Item } from '../types/items';
import type { Mercenary } from '../types/entities';
import { FROZEN_V30 } from './frozen-v30';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV30Save, validateQuestItemLedger, validateSave } from './validate';

const domains = loadCountedQuestItems();
function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Counted save contract', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17, gold: 93, runeShards: 23, 'rune-shard': 11, opaque: 7 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
describe.each(domains)('native31 finite counted $key', domain => {
  function fixture(count: number, consumed = false, claimed = false, terminal = consumed) {
    const save = sample(), questItems: QuestItemLedger = Object.fromEntries(domain.sources.slice(0, count).map(source =>
      [source, { itemId: domain.itemId, state: consumed ? 'consumed' : 'owned' }]));
    const questProgress: Record<string, QuestProgressData> = { [domain.quest]: { id: domain.quest,
      status: terminal ? 'completed' : 'inProgress', rewardClaimed: claimed, objectives: { [domain.objective]: terminal } } };
    return { ...save, inventory: { ...save.inventory, questItems }, map: { ...save.map, questProgress } };
  }
  it('roundtrips every legal partial/terminal owned graph and compatible legacy repair', () => {
    for (let count = 0; count <= domain.sources.length; count++) {
      for (const terminal of [false, true]) {
        if (count === domain.sources.length && domain.sink === 'claim' && !terminal) continue;
        const input = fixture(count, false, false, terminal), before = structuredClone(input);
        expect(validateSave(input)).toEqual(toJsonSafe(input));
        expect(toJsonSafe(decodeSave(toJsonSafe(input)))).toEqual(toJsonSafe(input));
        expect(validateQuestItemLedger(input.inventory.questItems, input.map.questProgress)).toEqual(input.inventory.questItems);
        expect(input).toEqual(before);
      }
    }
  });
  it.each([false, true])('admits only qualified full consumed graphs (claimed=%s)', claimed => {
    const input = fixture(domain.sources.length, true, claimed);
    if (domain.sink === 'claim' && !claimed) expect(() => validateSave(input)).toThrow('Invalid');
    else {
      expect(validateSave(input)).toEqual(toJsonSafe(input));
      expect(decodeSave(input).inventory.questItems).toEqual(input.inventory.questItems);
    }
  });
  it.each(['unknown', 'N+1', 'cross-family', 'wrong-item', 'partial-consumed', 'mixed', 'claimed-owned', 'claimed-partial'] as const)(
    'rejects %s at raw, JSON, decode and prospective boundaries', fault => {
      const input = fixture(domain.sources.length, false, false, true), source = domain.sources[0];
      if (!source) throw new Error('Missing source');
      if (fault === 'unknown' || fault === 'N+1') Reflect.set(input.inventory.questItems,
        fault === 'unknown' ? 'unknown' : `${source}-extra`, { itemId: domain.itemId, state: 'owned' });
      if (fault === 'cross-family') Reflect.set(input.inventory.questItems, source,
        { itemId: domains.find(row => row.key !== domain.key)?.itemId, state: 'owned' });
      if (fault === 'wrong-item') Reflect.set(input.inventory.questItems[source] ?? {}, 'itemId', 'quest/foreign');
      if (fault === 'partial-consumed' || fault === 'mixed') {
        Reflect.set(input.inventory.questItems[source] ?? {}, 'state', 'consumed');
        if (fault === 'partial-consumed') for (const key of domain.sources.slice(1)) Reflect.deleteProperty(input.inventory.questItems, key);
      }
      if (fault === 'claimed-owned' || fault === 'claimed-partial') {
        Reflect.set(input.map.questProgress[domain.quest] ?? {}, 'rewardClaimed', true);
        if (fault === 'claimed-partial') for (const key of domain.sources.slice(1)) Reflect.deleteProperty(input.inventory.questItems, key);
      }
      expect(() => validateSave(input)).toThrow('Invalid');
      expect(() => validateSave(toJsonSafe(input))).toThrow('Invalid');
      expect(() => decodeSave(input)).toThrow('Invalid');
      expect(() => validateQuestItemLedger(input.inventory.questItems, input.map.questProgress)).toThrow('Invalid');
    });
  it.each(['source', 'state', 'row', 'objectives', 'objective', 'claimed'] as const)(
    'rejects raw %s getter without executing before normalization', field => {
      const input = fixture(domain.sources.length, true, true), source = domain.sources[0], row = input.map.questProgress[domain.quest];
      if (!source || !row) throw new Error('Missing fixture');
      const target = field === 'source' ? input.inventory.questItems : field === 'state' ? input.inventory.questItems[source]
        : field === 'row' ? input.map.questProgress : field === 'objective' ? row.objectives : row;
      const key = field === 'source' ? source : field === 'row' ? domain.quest : field === 'objective' ? domain.objective
        : field === 'claimed' ? 'rewardClaimed' : field;
      if (!target) throw new Error('Missing target');
      const value: unknown = Reflect.get(target, key); let reads = 0;
      Object.defineProperty(target, key, { enumerable: true, get() { reads++; return value; } });
      expect(() => validateSave(input)).toThrow('Invalid');
      expect(() => decodeSave(input)).toThrow('Invalid');
      expect(() => validateQuestItemLedger(input.inventory.questItems, input.map.questProgress)).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it.each(domain.sources)('literal30 and migration reject future source %s', source => {
    const input = { ...withoutV32Fields(fixture(0)), version: 30 as const };
    Reflect.set(input.inventory.questItems, source, { itemId: domain.itemId, state: 'owned' });
    expect(() => validateFrozenV30Save(input)).toThrow('Invalid');
    expect(() => MIGRATIONS[31]?.(input)).toThrow('Invalid');
    expect(() => decodeSave(input)).toThrow('Invalid');
    let reads = 0;
    Object.defineProperty(input.inventory.questItems, source, { enumerable: true, get() { reads++; return { itemId: domain.itemId, state: 'owned' }; } });
    expect(() => validateFrozenV30Save(input)).toThrow('Invalid');
    expect(() => MIGRATIONS[31]?.(input)).toThrow('Invalid');
    expect(reads).toBe(0);
  });
});

describe('version31 preservation', () => {
  it('rejects malformed actual30 before the version-only migration', () => {
    expect(() => MIGRATIONS[31]?.({ ...withoutV32Fields(sample()), version: 30, timestamp: 'invalid' })).toThrow('Invalid');
  });
  it.each([false, true])('version-only migration preserves source-free historical flags and opaque state (%s)', claimed => {
    const base = sample(), questProgress = Object.fromEntries(domains.map(domain => [domain.quest,
      { id: domain.quest, status: 'completed', rewardClaimed: claimed, objectives: { [domain.objective]: true } }]));
    const input = { ...withoutV32Fields(base), version: 30 as const, preservedExtension: { counter: 23 },
      map: { ...withoutV32Fields(base).map, questProgress }, player: { ...base.player, coreStats: { ...base.player.coreStats, vitality: 43 } } };
    const before = structuredClone(input), migrate = MIGRATIONS[31]; if (!migrate) throw new Error('Missing migration');
    expect(CURRENT_SAVE_VERSION).toBe(33);
    expect(migrate(input)).toEqual({ ...withoutV32Fields(input), version: 31 });
    expect(toJsonSafe(decodeSave(input))).toEqual(toJsonSafe(withV32Defaults(input)));
    expect(input).toEqual(before);
  });
  it('retains accepted30 captain proofs without ownership and unclaimed main history', () => {
    const input = { ...withoutV32Fields(sample()), version: 30 as const }, questProgress: Record<string, QuestProgressData> = {}, receipts: Record<string, true> = {};
    for (const domain of FROZEN_V30.townEnlistments ?? []) {
      questProgress[domain.quest] = { id: domain.quest, status: 'completed', rewardClaimed: true, objectives: { [domain.objective]: true } };
      if (domain.prerequisite) questProgress[domain.prerequisite.quest] = { id: domain.prerequisite.quest, status: 'completed', rewardClaimed: false,
        objectives: Object.fromEntries(domain.prerequisite.objectiveIds.map(id => [id, true])) };
      receipts[domain.proof] = true;
    }
    const save = { ...input, map: { ...input.map, currentAct: 5, questProgress, questReceipts: receipts } };
    expect(validateFrozenV30Save(save)).toEqual(toJsonSafe(save));
    expect(toJsonSafe(decodeSave(save))).toEqual(toJsonSafe(withV32Defaults(save)));
    expect(save.mercs.ownedMercs).toEqual([]);
    expect(TOWN_ENLISTMENTS.kashya.proof in receipts).toBe(true);
  });
  it('conserves concurrent family graphs, invested mercs, affix Maps, concrete materials, opaque wallets and damaged resources', () => {
    const base = sample(), questItems: Record<string, { itemId: string; state: 'owned' | 'consumed' }> = {};
    const questProgress: Record<string, QuestProgressData> = {}, questReceipts: Record<string, true> = {};
    for (const domain of domains) {
      const consumed = domain.key === 'jade' || domain.key === 'malah';
      for (const source of domain.sources) questItems[source] = { itemId: domain.itemId, state: consumed ? 'consumed' : 'owned' };
      questProgress[domain.quest] = { id: domain.quest, status: 'completed', rewardClaimed: domain.key === 'malah',
        objectives: { [domain.objective]: true } };
    }
    const cain = FROZEN_V30.act1.cain;
    questItems[cain.source] = { itemId: cain.itemId, state: 'owned' };
    questProgress[cain.quest] = { id: cain.quest, status: 'inProgress', rewardClaimed: false, objectives: { [cain.treeObjective]: true } };
    for (const domain of FROZEN_V30.townEnlistments ?? []) {
      questProgress[domain.quest] = { id: domain.quest, status: 'completed', rewardClaimed: true, objectives: { [domain.objective]: true } };
      if (domain.prerequisite) questProgress[domain.prerequisite.quest] = { id: domain.prerequisite.quest, status: 'completed',
        rewardClaimed: false, objectives: Object.fromEntries(domain.prerequisite.objectiveIds.map(id => [id, true])) };
      questReceipts[domain.proof] = true;
    }
    const gear: Item = { id: 'preserved-sword', baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1,
      socketCapacity: 2, socketContents: [{ kind: 'rune', id: 'runes/eld' }], identified: true, equipped: true,
      affixes: [{ affixId: 'preserved-map', values: new Map([['statMods.strength', 2]]) }] };
    const mercs: Mercenary[] = ['one', 'two'].map(suffix => ({ ...base.player, type: 'mercenary' as const,
      id: `${TOWN_ENLISTMENTS.greiz.mercId}#${suffix}`, archetype: 'desert-merc', classId: 'desert-merc', rarity: 'R' as const,
      level: 22, equipment: suffix === 'one' ? [gear] : [], derivedStats: { ...base.player.derivedStats, life: 19, mana: 7 } }));
    const damaged = { ...base.player, statPoints: 17, derivedStats: { ...base.player.derivedStats, life: 19, mana: 7 } };
    const player = { ...damaged, derivedStats: deriveEquippedPlayerStats(damaged, damaged.level, {}, questProgress, questItems, questReceipts) };
    const input = { ...base, preservedExtension: { counter: 23 }, player,
      inventory: { ...base.inventory, materials: { 'gems/amethyst/perfect': 2 }, questItems },
      mercs: { ownedMercs: mercs, fieldedMercId: mercs[1]?.id ?? null,
        mercEquipment: { [mercs[0]?.id ?? '']: { weapon: gear } },
        mercProgress: Object.fromEntries(mercs.map(merc => [merc.id, { experience: 987, experienceToNextLevel: 1234, level: 22 }])) },
      map: { ...base.map, currentAct: 5, questProgress, questReceipts } };
    const before = structuredClone(input), decoded = decodeSave(toJsonSafe(input));
    expect(validateSave(input)).toEqual(toJsonSafe(input));
    expect(toJsonSafe(decoded)).toEqual(toJsonSafe(input));
    expect(toJsonSafe(buildSave(decoded))).toEqual(toJsonSafe({ ...input, preservedExtension: undefined }));
    const affix = decoded.mercs.mercEquipment[mercs[0]?.id ?? '']?.weapon?.affixes?.[0];
    if (!affix || !('values' in affix)) throw new Error('Missing preserved affix');
    expect(affix.values).toBeInstanceOf(Map);
    expect(decoded.player.derivedStats.life).toBe(19); expect(decoded.player.derivedStats.mana).toBe(7);
    expect(input).toEqual(before);
  });
});
