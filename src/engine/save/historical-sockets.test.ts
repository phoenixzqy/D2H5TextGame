import { withoutV19Fields } from '../../../tests/helpers/save-fixtures';
import { describe, expect, it, vi } from 'vitest';
import { validateNativeItemState } from './service-item-state';
import { migrateSaveV17 } from './migrate-v17';
import { buildSave } from './serialize';
import { deriveStats } from '../progression/stats';
import type { SaveV16 } from '../types/save';
import type { HistoricalItem } from './historical-items';

// Future live restrictions must never become historical import restrictions.
vi.mock('../items/socket-capacity', () => ({
  validateItemServiceFields: () => { throw new Error('Live rules cannot validate historical gear'); },
  migrateLegacyItemSocketState: () => { throw new Error('Live rules cannot migrate historical gear'); }
}));
vi.mock('../progression/equipment-mods', async importOriginal => {
  const actual = await importOriginal<typeof import('../progression/equipment-mods')>();
  return { ...actual, aggregateEquipmentMods: () => { throw new Error('Live socket effects cannot recompose historical gear'); } };
});

function sample() {
  const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
  return { ...withoutV19Fields(buildSave({ timestamp: 1000,
    player: { id: 'hero', name: 'Hero', type: 'player', team: 'player', class: 'sorceress',
      level: 1, coreStats, derivedStats: deriveStats(coreStats, 1), statusEffects: [], cooldowns: [],
      skills: [], comboOrder: [], alive: true, turnOrder: 0, experience: 0,
      experienceToNextLevel: 100, statPoints: 0, skillPoints: 0, equipment: [] },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false },
    idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
    gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } })), version: 18 as const };
}

const lore: HistoricalItem = { id: 'historical-lore', baseId: 'items/base/armor-quilted',
  rarity: 'runeword', runewordId: 'runewords/lore', runes: ['runes/ort', 'runes/sol'],
  level: 27, socketCapacity: 2, identified: true, equipped: false };

describe('frozen pre-v19 socket semantics', () => {
  it.each(['backpack', 'stash', 'equipped', 'mercEquipment'] as const)(
    'accepts historical Lore on chest in %s independently of live rules', container => {
      const save = sample();
      const owned = container === 'equipped' || container === 'mercEquipment'
        ? { ...lore, equipped: true, equipSlot: 'chest' as const } : lore;
      const input = { ...save, player: { ...save.player, equipment: container === 'equipped' ? [owned] : [] },
        inventory: { ...save.inventory,
          backpack: container === 'backpack' ? [owned] : [], stash: container === 'stash' ? [owned] : [],
          equipped: container === 'equipped' ? { chest: owned } : {} },
        mercs: { ...save.mercs, mercEquipment: container === 'mercEquipment' ? { merc: { chest: owned } } : {} } };
      const before = structuredClone(input);
      expect(() => { validateNativeItemState(input); }).not.toThrow();
      expect(input).toEqual(before);
      expect(() => { validateNativeItemState({ ...input, inventory: { ...input.inventory,
        [container === 'stash' ? 'stash' : 'backpack']: [{ ...lore, id: 'wrong-order', runes: ['runes/sol', 'runes/ort'] }] } }); })
        .toThrow('Invalid item runeword');
    });

  it('preserves v16→17 capacity and loose word semantics without consulting live migration', () => {
    const save = sample();
    const { socketCapacity: _capacity, ...oldLore } = lore;
    const { materials: _materials, questServices: _services, legacyGearQuarantine: _quarantine, ...inventory } = save.inventory;
    const { questTitles: _titles, questDifficulties: _difficulties, selectedTitle: _title,
      selectedDifficulty: _difficulty, nightmareClearedSubAreas: _clears, challengeOrdinals: _ordinals, ...map } = save.map;
    const input: SaveV16 = { ...save, version: 16, inventory: { ...inventory, backpack: [oldLore] }, map };
    const before = structuredClone(input);
    const migrated = migrateSaveV17(input);
    expect(migrated.inventory.backpack).toEqual([lore]);
    expect(migrated.inventory.legacyGearQuarantine).toEqual([]);
    expect(input).toEqual(before);
  });
  it('recomposes retained historical word gear beside quarantined equipment without live socket effects or healing', () => {
    const save = sample();
    const { socketCapacity: _capacity, ...oldLore } = lore;
    const retained = { ...oldLore, equipped: true, equipSlot: 'chest' as const, baseRolls: { defense: 12 },
      affixes: [{ affixId: 'historical-fixed', values: new Map([
        ['coreStats.energy', 5], ['statMods.life', 15], ['statMods.mana', 20]
      ]) }] };
    const bad = { ...oldLore, id: 'bad-word', baseId: 'items/base/wp1h-short-sword', equipped: true,
      equipSlot: 'weapon' as const, runewordId: 'unknown', runes: ['unknown'] };
    const { materials: _materials, questServices: _services, legacyGearQuarantine: _quarantine, ...inventory } = save.inventory;
    const { questTitles: _titles, questDifficulties: _difficulties, selectedTitle: _title,
      selectedDifficulty: _difficulty, nightmareClearedSubAreas: _clears, challengeOrdinals: _ordinals, ...map } = save.map;
    const input: SaveV16 = { ...save, version: 16, player: { ...save.player, equipment: [retained, bad],
      derivedStats: { ...save.player.derivedStats, life: 7, mana: 9 } },
      inventory: { ...inventory, equipped: { chest: retained, weapon: bad } },
      map: { ...map, questProgress: { 'quests/act2-tainted-sun': { id: 'quests/act2-tainted-sun',
        status: 'completed', rewardClaimed: true, objectives: { 'obj-destroy-altar': true } } } } };
    const before = structuredClone(input);
    const expected = deriveStats({ ...input.player.coreStats, energy: input.player.coreStats.energy + 5 }, 1,
      { flatDefense: 12, flatLife: 15, flatMana: 20, resistances: { fire: 30, cold: 30 } });
    const migrated = migrateSaveV17(input);
    expect(migrated.inventory.legacyGearQuarantine).toEqual([{ item: bad, origin: { container: 'equipped', slot: 'weapon' } }]);
    expect(migrated.inventory.equipped.chest).toEqual({ ...retained, socketCapacity: 2 });
    expect(migrated.player.equipment).toEqual([{ ...retained, socketCapacity: 2 }]);
    expect(migrated.player.derivedStats).toEqual({ ...expected, life: 7, mana: 9 });
    expect(input).toEqual(before);
  });
});
