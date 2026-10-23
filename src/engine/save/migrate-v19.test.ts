import { withoutV19Fields } from '../../../tests/helpers/save-fixtures';
import { describe, expect, it } from 'vitest';
import { buildSave, toJsonSafe } from './serialize';
import { validateFrozenV18Save, validateSocketSave } from './validate';
import { deriveStats } from '../progression/stats';
import type { HistoricalItem } from './historical-items';
import type { SaveV18 } from '../types/save';
import { migrateSaveV19 } from './migrate-v19';

function sample(): SaveV18 {
  const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
  return { ...withoutV19Fields(buildSave({ timestamp: 1000,
    player: { id: 'hero', name: 'Hero', type: 'player', team: 'player', class: 'sorceress',
      level: 30, coreStats, derivedStats: { ...deriveStats(coreStats, 30), life: 7, mana: 9 }, statusEffects: [], cooldowns: [],
      skills: [], comboOrder: [], alive: true, turnOrder: 0, experience: 0,
      experienceToNextLevel: 100, statPoints: 0, skillPoints: 0, equipment: [] },
    inventory: { backpack: [], stash: [], equipped: {}, materials: { 'runes/ral': 4 }, currencies: { 'old-token': 9 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } })), version: 18 as const };
}
function sword(id = 'steel'): HistoricalItem {
  return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'runeword', level: 13,
    runewordId: 'runewords/steel', runes: ['runes/tir', 'runes/el'], socketCapacity: 2,
    identified: true, equipped: false, baseRolls: { attack: 12 },
    personalizedBy: { characterId: 'hero', name: 'Hero' },
    affixes: [{ affixId: 'fixed', values: new Map([['coreStats.energy', 5], ['statMods.mana', 20]]) }] };
}
function lore(): HistoricalItem {
  return { ...sword('unsupported-lore'), baseId: 'items/base/armor-quilted', rarity: 'runeword',
    runewordId: 'runewords/lore', runes: ['runes/ort', 'runes/sol'] };
}

describe('complete v18 ownership migration for connected v19 rollout', () => {
  it('converts every actual owner once, rebuilds mirrors and preserves every unrelated field', () => {
    const save = sample();
    const weapon = { ...sword('hero-steel'), equipped: true, equipSlot: 'weapon' as const };
    const mercWeapon = { ...sword('merc-steel'), equipped: true, equipSlot: 'weapon' as const };
    const { class: _class, experience: _xp, experienceToNextLevel: _threshold,
      statPoints: _statPoints, skillPoints: _skillPoints, ...unit } = save.player;
    const merc = { ...unit, id: 'merc', type: 'mercenary' as const, archetype: 'rogue', rarity: 'R' as const,
      equipment: [sword('stale-mirror-only')] };
    const input: SaveV18 = { ...save,
      player: { ...save.player, equipment: [lore()] },
      inventory: { ...save.inventory, backpack: [sword('bag')], stash: [sword('stash')], equipped: { weapon } },
      mercs: { ...save.mercs, ownedMercs: [merc], fieldedMercId: 'merc', mercEquipment: { merc: { weapon: mercWeapon } } } };
    const before = structuredClone(input);
    const result = migrateSaveV19(input);
    expect(result.version).toBe(19);
    const convert = (item: HistoricalItem) => {
      const { runes, ...rest } = item;
      return { ...rest, socketContents: runes?.map(id => ({ kind: 'rune', id })) };
    };
    expect(result.inventory.backpack).toEqual([convert(sword('bag'))]);
    expect(result.inventory.stash).toEqual([convert(sword('stash'))]);
    expect(result.inventory.equipped).toEqual({ weapon: convert(weapon) });
    expect(result.player.equipment).toEqual([convert(weapon)]);
    expect(result.mercs.mercEquipment).toEqual({ merc: { weapon: convert(mercWeapon) } });
    expect(result.mercs.ownedMercs).toEqual([{ ...merc, equipment: [convert(mercWeapon)] }]);
    expect(result.inventory.socketQuarantine).toEqual([]);
    expect(result.inventory.materials).toEqual(save.inventory.materials);
    expect(result.inventory.currencies).toEqual(save.inventory.currencies);
    expect(result.inventory.materialActionOrdinal).toBe(0);
    expect(Object.hasOwn(result.inventory, 'latestMaterialAction')).toBe(false);
    expect(result.map).toEqual(save.map);
    expect(result.meta).toEqual(save.meta);
    expect(result.formation).toEqual(save.formation);
    expect(result.timestamp).toBe(save.timestamp);
    expect(input).toEqual(before);
  });

  it.each(['backpack', 'stash', 'equipped', 'mercEquipment'] as const)(
    'preserves incompatible %s gear exactly once with its original finite location', container => {
      const save = sample(), item = lore();
      const input: SaveV18 = { ...save, player: { ...save.player, equipment: [item] },
        inventory: { ...save.inventory, backpack: container === 'backpack' ? [item] : [],
          stash: container === 'stash' ? [item] : [], equipped: container === 'equipped' ? { chest: item } : {} },
        mercs: { ...save.mercs, mercEquipment: container === 'mercEquipment' ? { merc: { chest: item } } : {} } };
      const before = structuredClone(input);
      const result = migrateSaveV19(input);
      const origin = container === 'backpack' || container === 'stash' ? { container, index: 0 }
        : container === 'equipped' ? { container, slot: 'chest' }
          : { container, mercId: 'merc', slot: 'chest' };
      expect(result.inventory.socketQuarantine).toEqual([{ sourceVersion: 18, item, origin }]);
      expect(result.inventory.backpack).toEqual([]);
      expect(result.inventory.stash).toEqual([]);
      expect(result.inventory.equipped).toEqual(container === 'equipped' ? { chest: null } : {});
      expect(result.mercs.mercEquipment).toEqual(container === 'mercEquipment' ? { merc: { chest: null } } : {});
      expect(result.player.equipment).toEqual([]);
      expect(result.inventory.materials).toEqual(input.inventory.materials);
      expect(input).toEqual(before);
    });

  it('keeps frozen v16 quarantine untouched, including colliding IDs and payloads', () => {
    const save = sample();
    const { socketCapacity: _capacity, personalizedBy: _name, ...old } = lore();
    const entries = [{ item: old, origin: { container: 'backpack' as const, index: 0 } },
      { item: old, origin: { container: 'stash' as const, index: 0 } }];
    const result = migrateSaveV19({ ...save, inventory: { ...save.inventory, legacyGearQuarantine: entries } });
    expect(result.inventory.legacyGearQuarantine).toEqual(entries);
    expect(result.inventory.socketQuarantine).toEqual([]);
  });

  it('composes surviving socket effects once with quest entitlements and preserves current pools', () => {
    const save = sample(), weapon = { ...sword(), equipped: true, equipSlot: 'weapon' as const };
    const input = { ...save, inventory: { ...save.inventory, equipped: { weapon } },
      map: { ...save.map, questProgress: { 'quests/act2-tainted-sun': { id: 'quests/act2-tainted-sun',
        status: 'completed' as const, rewardClaimed: true, objectives: { 'obj-destroy-altar': true } } } } };
    const result = migrateSaveV19(input);
    // Steel: explicit Tir+El packages, plus the completed word; base and Map still contribute.
    const expected = deriveStats({ ...save.player.coreStats, energy: 40 }, 30,
      { flatAttack: 112, flatMana: 24, attackSpeedBonus: 25, resistances: { fire: 30, cold: 30 } });
    expect(result.player.derivedStats).toEqual({ ...expected, life: 7, mana: 9 });
  });

  it('refuses malformed predecessor runes rather than converting or refunding them', () => {
    const save = sample();
    const input = { ...save, inventory: { ...save.inventory, backpack: [{ ...sword(), runes: ['unknown'] }] } };
    const before = structuredClone(input);
    expect(() => migrateSaveV19(input)).toThrow();
    expect(input).toEqual(before);
  });
});


it('composes identical gear stats from native Maps and validated JSON without changing stored payloads', () => {
  const save = sample(), equipped = { weapon: sword('json-steel') };
  const input = { ...save, inventory: { ...save.inventory, equipped } };
  const before = structuredClone(input), json = toJsonSafe(input);
  const normalized = validateFrozenV18Save(json);
  const migrated = migrateSaveV19(normalized), native = migrateSaveV19(input);
  expect(migrated.player.derivedStats).toEqual(native.player.derivedStats);
  expect(migrated.player.derivedStats.manaMax).toBeGreaterThan(save.player.derivedStats.manaMax);
  expect(validateSocketSave(migrated)).toEqual(toJsonSafe(native));
  expect(toJsonSafe(migrated.inventory.equipped.weapon?.affixes)).toEqual(toJsonSafe(equipped.weapon.affixes));
  expect(input).toEqual(before);
  expect(toJsonSafe(normalized)).toEqual(json);
});
