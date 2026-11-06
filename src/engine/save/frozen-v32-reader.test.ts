/** Literal32 reader must remain independent of successor authoring. */
import { describe, expect, it, vi } from 'vitest';
import type { SaveV32 } from '../types/save';
import { validateFrozenV32Save } from './validate';
import { migrateSaveV33 } from './migrate-v33';
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

function sample(): SaveV32 {
  return {
    version: 32,
    timestamp: 1000,
    endgame: { attemptOrdinal: 0, clearCounts: { ashen: 0, glacial: 0 }, achievementRewardClaimed: false },
    player: {
      id: 'literal-32-player', name: 'Literal32', type: 'player', team: 'player', class: 'sorceress',
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
    map: { bounties: {}, currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {},
      questReceipts: {}, questTitles: {}, questDifficulties: {}, selectedTitle: null, selectedDifficulty: 'normal',
      nightmareClearedSubAreas: [], hellClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0, hell: 0 } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] }
  };
}

describe('literal32 independent of recruitment and future catalogs', () => {
  it('validates and migrates literal32 without consulting poisoned live loaders', () => {
    const old = sample(), before = structuredClone(old);
    expect(validateFrozenV32Save(old)).toEqual(old);
    expect(migrateSaveV33(old)).toEqual({ ...old, version: 33,
      meta: { ...old.meta, recruitmentState: { srPityCounter: 0, totalPulls: 0, history: [] } },
      mercs: { ...old.mercs, recruitmentProgress: {} } });
    expect(old).toEqual(before);
  });
  it('refuses a reserved recruitment accessor without invoking it', () => {
    const old = sample(); let reads = 0;
    Object.defineProperty(old.meta, 'recruitmentState', { enumerable: true, get() { reads++; return {}; } });
    expect(() => validateFrozenV32Save(old)).toThrow('Invalid');
    expect(() => migrateSaveV33(old)).toThrow('Invalid'); expect(reads).toBe(0);
  });
});
