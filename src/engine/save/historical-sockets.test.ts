import { describe, expect, it, vi } from 'vitest';
import { validateNativeItemState } from './service-item-state';
import { migrateSaveV17 } from './migrate-v17';
import { buildSave } from './serialize';
import { deriveStats } from '../progression/stats';
import type { SaveV16 } from '../types/save';
import type { Item } from '../types/items';

// Future live restrictions must never become historical import restrictions.
vi.mock('../items/socket-capacity', () => ({
  validateItemServiceFields: () => { throw new Error('Live rules cannot validate historical gear'); },
  migrateLegacyItemSocketState: () => { throw new Error('Live rules cannot migrate historical gear'); }
}));

function sample() {
  const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
  return buildSave({ timestamp: 1000,
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
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}

const lore: Item = { id: 'historical-lore', baseId: 'items/base/armor-quilted',
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
});
