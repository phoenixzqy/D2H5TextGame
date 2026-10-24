import { withoutV17Fields } from '../../../tests/helpers/save-fixtures';
import { describe, expect, it } from 'vitest';
import { deriveStats } from '../progression/stats';
import { buildSave } from './serialize';
import { decodeSave } from './validate';
import type { SaveV16, SaveCurrent, QuestProgressData } from '../types/save';
import type { HistoricalItem } from './historical-items';
import { BAAL_TITLE, NIGHTMARE_UNLOCK } from './act5-campaign';
import { loadQuests } from '@/data/loaders/quests';
import { ACT5_ENCOUNTERS, PRISON_QUEST } from '../map/act5-admission';
import { INSPECT_PROOF, POTION_SOURCE, THAW_PROOF } from './act5-state';

const sideServices = [
  ['quests/side-act5-larzuks-sockets', 'quests/act5-siege-on-harrogath', 'socket_item'],
  ['quests/side-act5-anyas-gift', 'quests/act5-prison-of-ice', 'personalize_item'],
  ['quests/side-act4-halbus-soul', 'quests/act4-hellforge', 'socket_armor']
] as const;
function completed(id: string): QuestProgressData {
  const quest = loadQuests().find(row => row.id === id);
  if (!quest) throw new Error('Missing service quest fixture');
  return { id, status: 'completed', rewardClaimed: true,
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true])) };
}

function sample(): SaveCurrent {
  const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
  return buildSave({ timestamp: 1000,
    player: { id: 'hero', name: 'Hero', type: 'player', team: 'player', class: 'sorceress',
      level: 1, coreStats, derivedStats: deriveStats(coreStats, 1),
      statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true, turnOrder: 0,
      experience: 0, experienceToNextLevel: 100, statPoints: 0, skillPoints: 7, equipment: [] },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { 'rune-shard': 42 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 5, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function old16(): SaveV16 {
  return { ...withoutV17Fields(sample()), version: 16 };
}
function item(id: string, extra: Partial<HistoricalItem> = {}): HistoricalItem {
  return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1, identified: true, equipped: false, ...extra };
}

describe('native17 finite campaign save state', () => {
  it.each(sideServices)('rejects %s service backed only by historical prerequisite flags', (side, main, serviceId) => {
    const save = sample();
    const forged = { ...save, map: { ...save.map, questProgress: { [side]: completed(side), [main]: completed(main) } },
      inventory: { ...save.inventory, questServices: { [`${side}#reward:service`]: { serviceId, state: 'available' } } } };
    expect(() => decodeSave(forged)).toThrow();
  });
  it.each(sideServices)('preserves historical claimed %s without inferring a charge or prerequisite graph', (side, main) => {
    const old = old16();
    const history = { ...old, map: { ...old.map, questProgress: { [side]: completed(side), [main]: completed(main) } } };
    const migrated = decodeSave(history);
    expect(migrated.map.questProgress).toEqual(history.map.questProgress);
    expect(migrated.inventory.questServices).toEqual({});
    expect(migrated.inventory.questItems).toEqual({});
    expect(migrated.map.questReceipts).toEqual({});
  });
  it.each(sideServices.slice(0, 2))('accepts %s with actual completed but unclaimed prerequisite and requires every source edge',
    (side, main, serviceId) => {
      const save = sample(), encounter = ACT5_ENCOUNTERS.find(row => row.questId === main);
      if (!encounter) throw new Error('Missing service victory fixture');
      const questReceipts = { [encounter.proof]: true as const, ...(main === PRISON_QUEST
        ? { [INSPECT_PROOF]: true as const, [POTION_SOURCE]: true as const, [THAW_PROOF]: true as const } : {}) };
      const questItems = main === PRISON_QUEST
        ? { [POTION_SOURCE]: { itemId: 'quest/malahs_potion', state: 'consumed' as const } } : {};
      const valid = { ...save, map: { ...save.map, questProgress: { [side]: completed(side),
        [main]: { ...completed(main), rewardClaimed: false } }, questReceipts }, inventory: { ...save.inventory,
        questItems, questServices: { [`${side}#reward:service`]: { serviceId, state: 'available' as const } } } };
      expect(decodeSave(valid)).toEqual(valid);
      for (const source of Object.keys(questReceipts)) {
        const missing = { ...questReceipts }; Reflect.deleteProperty(missing, source);
        expect(() => decodeSave({ ...valid, map: { ...valid.map, questReceipts: missing } })).toThrow();
      }
      if (main === PRISON_QUEST) {
        expect(() => decodeSave({ ...valid, inventory: { ...valid.inventory, questItems: {} } })).toThrow();
      }
    });
  it('round trips explicit empty defaults and migrates16 without inferring rewards from history', () => {
    expect(decodeSave(sample())).toEqual(sample());
    const old = old16(), before = structuredClone(old);
    const migrated = decodeSave({ ...old, map: { ...old.map, questProgress: {
      'quests/act5-eve-of-destruction': { id: 'quests/act5-eve-of-destruction', status: 'completed', rewardClaimed: true,
        objectives: { 'obj-throne-waves': true, 'obj-kill-baal': true } } } } });
    expect(migrated.version).toBe(21); expect(migrated.inventory.questServices).toEqual({});
    expect(migrated.map).toMatchObject({ questTitles: {}, questDifficulties: {}, selectedTitle: null,
      selectedDifficulty: 'normal', nightmareClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0 } });
    expect(migrated.map.questReceipts).toEqual({}); expect(migrated.inventory.questItems).toEqual({});
    expect(migrated.player).toEqual({ ...old.player, respecsRemaining: { stat: 3, skill: 3 } }); expect(old).toEqual(before);
  });
  it.each(['questTitles', 'questDifficulties', 'selectedTitle', 'selectedDifficulty', 'nightmareClearedSubAreas', 'challengeOrdinals'])(
    'rejects raw historical own reserved map field %s even undefined', key => {
      const old = old16(); expect(() => decodeSave({ ...old, map: { ...old.map, [key]: undefined } })).toThrow('reserved v17');
    });
  it.each(['questServices', 'legacyGearQuarantine'])('rejects historical own inventory field %s', key => {
    const old = old16(); expect(() => decodeSave({ ...old, inventory: { ...old.inventory, [key]: undefined } })).toThrow('reserved v17');
  });
  it.each(['socketCapacity', 'personalizedBy'])('rejects historical own reserved item field %s before normalization', key => {
    const old = old16(); expect(() => decodeSave({ ...old, inventory: { ...old.inventory, backpack: [{ ...item('old'), [key]: undefined }] } }))
      .toThrow('reserved v17');
  });
  it('rejects new action proof and new quest potion carried under16', () => {
    const old = old16(); expect(() => decodeSave({ ...old, map: { ...old.map,
      questReceipts: { 'quests/act5-prison-of-ice#action:inspect-anya': true } } })).toThrow();
    expect(() => decodeSave({ ...old, inventory: { ...old.inventory,
      questItems: { 'quests/act5-prison-of-ice#action:receive-potion': { itemId: 'quest/malahs_potion', state: 'owned' } } } })).toThrow();
  });
  it.each([
    { questTitles: { [BAAL_TITLE]: true } }, { questDifficulties: { [NIGHTMARE_UNLOCK]: true } },
    { questTitles: { unknown: true } }, { selectedTitle: BAAL_TITLE }, { selectedDifficulty: 'nightmare' },
    { nightmareClearedSubAreas: ['areas/act5-frigid-highlands'] },
    { challengeOrdinals: { normal: 0, nightmare: 1 } }, { challengeOrdinals: { normal: 360360, nightmare: 0 } }
  ])('rejects unearned or unknown campaign state %j', patch => {
    const save = sample(); expect(() => decodeSave({ ...save, map: { ...save.map, ...patch } })).toThrow();
  });
});

describe('lossless frozen16 gear quarantine', () => {
  it('adds only historical capacity to valid gear and preserves every incompatible literal payload and origin', () => {
    const old = old16(), good = item('good'), bad = item('bad', { rarity: 'runeword', runewordId: 'unknown', runes: ['unknown'],
      statRolls: { attack: 99 }, baseRolls: { defense: 77 } });
    const input = { ...old, inventory: { ...old.inventory, backpack: [good, bad] } }, before = structuredClone(input);
    const migrated = decodeSave(input);
    expect(migrated.inventory.backpack).toEqual([{ ...good, socketCapacity: 2 }]);
    expect(migrated.inventory.legacyGearQuarantine).toEqual([{ item: bad, origin: { container: 'backpack', index: 1 } }]);
    expect(input).toEqual(before); expect(decodeSave(migrated).inventory).toEqual(migrated.inventory);
  });
  it('quarantines all duplicate ownership instances across bags/hero/merc and removes actor mirror effects', () => {
    const old = old16(), duplicate = item('same', { equipped: true, equipSlot: 'weapon', baseRolls: { attack: 999 } });
    const merc = { ...old.player, id: 'merc', type: 'mercenary' as const, archetype: 'rogue', rarity: 'common', equipment: [duplicate] };
    const input = { ...old, player: { ...old.player, equipment: [duplicate], derivedStats: { ...old.player.derivedStats, attack: 10000 } },
      inventory: { ...old.inventory, backpack: [duplicate], stash: [duplicate], equipped: { weapon: duplicate } },
      mercs: { ...old.mercs, ownedMercs: [merc], mercEquipment: { merc: { weapon: duplicate } } } };
    const migrated = decodeSave(input);
    expect(migrated.inventory.backpack).toEqual([]); expect(migrated.inventory.stash).toEqual([]);
    expect(migrated.inventory.equipped.weapon).toBeNull(); expect(migrated.mercs.mercEquipment.merc?.weapon).toBeNull();
    expect(migrated.player.equipment).toEqual([]); expect(migrated.mercs.ownedMercs[0]?.equipment).toEqual([]);
    expect(migrated.player.derivedStats.attack).toBeLessThan(10000);
    expect(migrated.inventory.legacyGearQuarantine).toEqual([
      { item: duplicate, origin: { container: 'backpack', index: 0 } }, { item: duplicate, origin: { container: 'stash', index: 0 } },
      { item: duplicate, origin: { container: 'equipped', slot: 'weapon' } },
      { item: duplicate, origin: { container: 'mercEquipment', mercId: 'merc', slot: 'weapon' } } ]);
  });
  it('rejects native duplicate IDs, active quarantine IDs, duplicate origins and rewritten predecessor fields', () => {
    const save = sample(), old = item('same'), gear = { ...old, socketCapacity: 0 };
    expect(() => decodeSave({ ...save, inventory: { ...save.inventory, backpack: [gear], stash: [gear] } })).toThrow('duplicate active');
    const entry = { item: old, origin: { container: 'backpack', index: 0 } };
    expect(() => decodeSave({ ...save, inventory: { ...save.inventory, backpack: [gear], legacyGearQuarantine: [entry] } })).toThrow('remains active');
    expect(() => decodeSave({ ...save, inventory: { ...save.inventory, legacyGearQuarantine: [entry, entry] } })).toThrow('duplicate quarantine origin');
    expect(() => decodeSave({ ...save, inventory: { ...save.inventory, legacyGearQuarantine: [{ ...entry,
      item: { ...old, socketCapacity: undefined } }] } })).toThrow('literal predecessor');
  });
  it('rejects raw native own undefined personalization before normalization', () => {
    const save = sample(); expect(() => decodeSave({ ...save, inventory: { ...save.inventory,
      backpack: [{ ...item('raw'), socketCapacity: 0, personalizedBy: undefined }] } })).toThrow();
  });
});
