/** Constructed literal27 controls; freeze-equality-green.log records pre-Drognan catalog equality. */
import { describe, expect, it, vi } from 'vitest';
import type { Item } from '../types/items';
import type { SaveV27 } from '../types/save';
import { DROGNAN } from '../map/drognan-quest';
import { FROZEN_V27 } from './frozen-v27';
import { toJsonSafe } from './serialize';
import { validateFrozenV27Save as literal27 } from './validate';

// Drift is installed before validator import: historical authority cannot be a live snapshot.
vi.mock('@/data/loaders/loot', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/loot')>();
  const bases = new Map(actual.loadItemBases());
  bases.delete('items/base/wp1h-short-sword'); bases.delete('items/base/small-charm');
  return { ...actual, loadItemBases: () => bases };
});
vi.mock('@/data/loaders/quests', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/quests')>();
  return { ...actual, loadQuests: () => actual.loadQuests().map(row => ({ ...row,
    objectives: [...row.objectives, { id: 'obj-future', type: 'talk' as const, description: 'Future obligation' }] })) };
});
vi.mock('@/data/loaders/quest-items', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/quest-items')>();
  return { ...actual, loadQuestItems: () => [] };
});
vi.mock('@/data/loaders/quest-actions', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/quest-actions')>();
  return { ...actual, loadQuestActions: () => [] };
});
vi.mock('@/data/loaders/act5-runtime', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/act5-runtime')>();
  const runtime = structuredClone(actual.act5Runtime);
  runtime.encounters = runtime.encounters.map(row => ({ ...row, proof: row.proof + '-future' }));
  return { ...actual, act5Runtime: runtime };
});
vi.mock('../map/warband-quest', async importOriginal => {
  const actual = await importOriginal<typeof import('../map/warband-quest')>();
  return { ...actual, WARBAND: { ...actual.WARBAND, objective: 'obj-future', proof: 'future-warband-proof' } };
});
vi.mock('../map/larzuk-quest', async importOriginal => {
  const actual = await importOriginal<typeof import('../map/larzuk-quest')>();
  return { ...actual, LARZUK: { ...actual.LARZUK, objective: 'obj-future', proof: 'future-larzuk-proof' } };
});
vi.mock('../map/ormus-quest', async importOriginal => {
  const actual = await importOriginal<typeof import('../map/ormus-quest')>();
  return { ...actual, ORMUS: { ...actual.ORMUS, first: 'obj-future', proof: 'future-ormus-proof' } };
});
// Construct historical input without consulting the current builder or live catalogs.
function sample(): SaveV27 {
  return {
    version: 27,
    timestamp: 1000,
    endgame: { attemptOrdinal: 0, clearCounts: { ashen: 0, glacial: 0 }, achievementRewardClaimed: false },
    player: {
      id: 'literal-27-player', name: 'Literal27', type: 'player', team: 'player', class: 'sorceress',
      level: 1, experience: 0, experienceToNextLevel: 100, statPoints: 0, skillPoints: 1,
      coreStats: { strength: 10, dexterity: 25, vitality: 10, energy: 35 },
      derivedStats: { life: 120, lifeMax: 120, mana: 102, manaMax: 102, attack: 22, defense: 20,
        magicResist: 0, attackSpeed: 125, critChance: 0.05, critDamage: 2, physDodge: 0.1,
        magicDodge: 0.05, magicFind: 0, goldFind: 0,
        resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
      statusEffects: [], cooldowns: [], skills: [], comboOrder: ['sorceress.frost_nova', 'sorceress.ice_bolt'],
      skillLevels: { 'sorceress.frost_nova': 1, 'sorceress.ice_bolt': 1 }, alive: true, turnOrder: 0,
      respecsRemaining: { stat: 3, skill: 3 }, equipment: []
    },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 },
      questItems: {}, questServices: {}, materials: {}, legacyGearQuarantine: [], socketQuarantine: [],
      materialActionOrdinal: 0 },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {},
      questReceipts: {}, questTitles: {}, questDifficulties: {}, selectedTitle: null, selectedDifficulty: 'normal',
      nightmareClearedSubAreas: [], hellClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0, hell: 0 } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] }
  };
}
function completed(id: string) {
  const quest = FROZEN_V27.quests.find(row => row.id === id); if (!quest) throw new Error('Missing historical quest');
  return { id, status: 'completed', rewardClaimed: true,
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true])) };
}
function warband() {
  const save = sample(), domain = FROZEN_V27.warband; if (!domain) throw new Error('Missing historical Warband');
  return { ...save, map: { ...save.map,
    questProgress: { [domain.quest]: completed(domain.quest), [domain.prerequisite]: completed(domain.prerequisite) },
    questReceipts: { [domain.proof]: true as const,
      ...Object.fromEntries(FROZEN_V27.act5.cageProofs.map(proof => [proof, true as const])) } } };
}
describe('literal27 immutable admission authority', () => {
  it('retains the corrected actual27 Warband NPC and pre-recovery Drognan catalog', () => {
    expect(FROZEN_V27.quests.find(row => row.id === 'quests/side-act5-qual-kehk-merc')?.giver).toBe('npc/qual-kehk');
    expect(FROZEN_V27.quests.find(row => row.id === DROGNAN.quest)?.objectives).toEqual([
      { id: 'obj-fetch', type: 'fetch', itemId: 'quest/sun_cult_tome', areaId: 'areas/act2_lost_city', description: 'Find the Sun-Cult Tome.' }]);
    expect(FROZEN_V27.items.some(row => row.id === DROGNAN.itemId)).toBe(false);
    expect(FROZEN_V27.drognan).toBeUndefined();
  });
  it('retains accepted Warband proof and objectives after live definitions drift', () => {
    const save = warband(), before = structuredClone(save);
    expect(literal27(save)).toEqual(toJsonSafe(save));
    expect(literal27(toJsonSafe(save))).toEqual(toJsonSafe(save));
    expect(save).toEqual(before);
  });
  it('retains item/action catalog authority after live catalogs are removed', () => {
    const save = sample(), act1 = FROZEN_V27.act1.cain;
    const input = { ...save, inventory: { ...save.inventory,
      questItems: { [act1.source]: { itemId: act1.itemId, state: 'owned' } } },
      map: { ...save.map, questProgress: { [act1.quest]: { id: act1.quest, status: 'inProgress', rewardClaimed: false,
        objectives: { [act1.treeObjective]: true } } } } };
    expect(literal27(input)).toEqual(toJsonSafe(input));
  });
  it.each(['backpack', 'stash', 'hero', 'hero-mirror', 'merc-mirror'] as const)(
    'retains historical charm and affix Maps in %s after live base removal', location => {
      const save = sample(), charm: Item = { id: 'historical-charm', baseId: 'items/base/small-charm',
        uniqueId: 'items/unique/ormus-charm', rarity: 'unique', level: 32, socketCapacity: 0,
        identified: true, equipped: location === 'hero',
        affixes: [{ affixId: 'historical-map', values: new Map([['statMods.life', 7]]) }] };
      const input = { ...save, inventory: { ...save.inventory,
        backpack: location === 'backpack' ? [charm] : [], stash: location === 'stash' ? [charm] : [],
        equipped: location === 'hero' ? { charm } : {} },
        player: { ...save.player, equipment: location === 'hero-mirror' ? [charm] : [] },
        mercs: { ...save.mercs, ownedMercs: location === 'merc-mirror' ? [{ ...save.player,
          id: 'merc', type: 'mercenary' as const, archetype: 'rogue', rarity: 'R' as const, equipment: [charm] }] : [] } };
      const before = structuredClone(input);
      expect(literal27(input)).toEqual(toJsonSafe(input));
      expect(literal27(toJsonSafe(input))).toEqual(toJsonSafe(input));
      expect(input).toEqual(before);
    });
  it('retains socketed historical gear after live base removal', () => {
    const save = sample(), gear: Item = { id: 'historical-socketed-sword', baseId: 'items/base/wp1h-short-sword',
      rarity: 'normal', level: 1, socketCapacity: 2, socketContents: [{ kind: 'rune', id: 'runes/eld' }], identified: true, equipped: false };
    const input = { ...save, inventory: { ...save.inventory, backpack: [gear] } };
    expect(literal27(input)).toEqual(toJsonSafe(input));
    expect(literal27(toJsonSafe(input))).toEqual(toJsonSafe(input));
  });
  it.each(['normal', 'nightmare', 'hell'] as const)('threads literal27 through nested %s and achievement checks', profile => {
    const save = warband(), act5 = FROZEN_V27.act5;
    const encounter = act5.encounters.find(row => row.questId === act5.eveQuest); if (!encounter) throw new Error('Missing Eve');
    const input = { ...save, endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: true },
      map: { ...save.map, questProgress: { ...save.map.questProgress, [act5.eveQuest]: completed(act5.eveQuest) },
        questReceipts: { ...save.map.questReceipts, [encounter.proof]: true as const, [act5.throneProof]: true as const },
        questTitles: { 'titles/slayer_of_baal': true as const }, questDifficulties: { 'difficulty/nightmare': true as const },
        selectedTitle: 'titles/worldstone-adapt', selectedDifficulty: profile,
        nightmareClearedSubAreas: ['areas/act1-blood-moor'], hellClearedSubAreas: ['areas/act1-blood-moor'],
        challengeOrdinals: { normal: 13, nightmare: 2, hell: 3 } } };
    expect(literal27(input)).toEqual(toJsonSafe(input));
    expect(literal27(toJsonSafe(input))).toEqual(toJsonSafe(input));
  });
  it('rejects future Drognan owned source before migration despite completed flags', () => {
    const save = sample(), input = { ...save, inventory: { ...save.inventory,
      questItems: { [DROGNAN.source]: { itemId: DROGNAN.itemId, state: 'owned' } } },
      map: { ...save.map, questProgress: { [DROGNAN.quest]: completed(DROGNAN.quest) } } };
    expect(() => literal27(input)).toThrow('Invalid');
  });
  it('rejects a future source getter before literal27 or migration can read it', () => {
    const save = sample(); let reads = 0;
    Object.defineProperty(save.inventory.questItems, DROGNAN.source,
      { enumerable: true, get() { reads++; return { itemId: DROGNAN.itemId, state: 'owned' }; } });
    expect(() => literal27(save)).toThrow('Invalid');
    expect(reads).toBe(0);
  });
  it('retains historical refusal of orphaned Warband proof', () => {
    const save = warband(), domain = FROZEN_V27.warband; if (!domain) throw new Error('Missing historical Warband');
    Reflect.deleteProperty(save.map.questProgress, domain.prerequisite);
    expect(() => literal27(save)).toThrow('Invalid');
  });
});
