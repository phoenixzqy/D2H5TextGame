/** Constructed historical31 controls; no live builder or earned-save input. */
import { describe, expect, it, vi } from 'vitest';
import { withV32Defaults } from '../../../tests/helpers/save-fixtures';
import type { SaveV31 } from '../types/save';
import { migrateSaveV32 } from './migrate-v32';
import { FROZEN_V31 } from './frozen-v31';
import { validateFrozenV31Save } from './validate';

vi.mock('@/data/loaders/counted-quest-items', () => ({ loadCountedQuestItems: () => {
  throw new Error('Historical reader consulted future counted registry');
} }));
vi.mock('@/data/loaders/quests', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/quests')>();
  return { ...actual, loadQuests: () => actual.loadQuests().map(row => ({ ...row,
    objectives: [...row.objectives, { id: 'obj-future', type: 'talk' as const, description: 'Future obligation' }] })) };
});
vi.mock('@/data/loaders/quest-items', () => ({ loadQuestItems: () => [], questItemSource: () => 'future-source' }));
vi.mock('@/data/loaders/quest-actions', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/quest-actions')>();
  return { ...actual, loadQuestActions: () => [] };
});
vi.mock('@/data/index', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/index')>();
  return { ...actual, subAreas: [] };
});
vi.mock('@/data/loaders/loot', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/loot')>();
  return { ...actual, loadItemBases: () => new Map() };
});

function sample(): SaveV31 {
  return {
    version: 31,
    timestamp: 1000,
    endgame: { attemptOrdinal: 0, clearCounts: { ashen: 0, glacial: 0 }, achievementRewardClaimed: false },
    player: {
      id: 'literal-31-player', name: 'Literal31', type: 'player', team: 'player', class: 'sorceress',
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

describe('literal31 independent of successor authoring', () => {
  it('retains the unchanged complete empty save and actor caches through validation/migration', () => {
    const input = sample(), before = structuredClone(input);
    expect(validateFrozenV31Save(input)).toEqual(input);
    expect(migrateSaveV32(input)).toEqual(withV32Defaults(input));
    expect(input).toEqual(before);
  });
  it.each(FROZEN_V31.countedSources ?? [])('admits accepted counted $key without any live counted registry', domain => {
    const input = sample();
    Reflect.set(input.map.questProgress, domain.quest, { id: domain.quest, status: 'completed',
      rewardClaimed: true, objectives: { [domain.objective]: true } });
    for (const source of domain.sources) Reflect.set(input.inventory.questItems, source,
      { itemId: domain.itemId, state: 'consumed' });
    const before = structuredClone(input);
    expect(validateFrozenV31Save(input)).toEqual(input);
    expect(migrateSaveV32(input)).toEqual(withV32Defaults(input));
    expect(input).toEqual(before);
  });
  it.each(['quest/horazon_lockbox', 'quest/elzix_strongbox'])('refuses successor-only physical item %s', itemId => {
    const input = sample();
    const quest = itemId === 'quest/horazon_lockbox' ? 'quests/side-act2-summoners-secret' : 'quests/side-act2-lost-caravan';
    const objective = itemId === 'quest/horazon_lockbox' ? 'obj-find' : 'obj-find-box';
    Reflect.set(input.map.questProgress, quest, { id: quest, status: 'completed', rewardClaimed: false,
      objectives: { [objective]: true } });
    Reflect.set(input.inventory.questItems, `${quest}#objective:${objective}`, { itemId, state: 'owned' });
    const before = structuredClone(input);
    expect(() => validateFrozenV31Save(input)).toThrow('Invalid save');
    expect(() => migrateSaveV32(input)).toThrow('Invalid save');
    expect(input).toEqual(before);
  });
  it('does not execute a counted source getter during historical admission', () => {
    const input = sample(), domain = FROZEN_V31.countedSources?.[0], source = domain?.sources[0];
    if (!domain || !source) throw new Error('Missing accepted literal domain');
    let reads = 0;
    Object.defineProperty(input.inventory.questItems, source, { enumerable: true, get() {
      reads++; return { itemId: domain.itemId, state: 'owned' };
    } });
    expect(() => validateFrozenV31Save(input)).toThrow('Invalid save');
    expect(() => migrateSaveV32(input)).toThrow('Invalid save');
    expect(reads).toBe(0);
  });
});
