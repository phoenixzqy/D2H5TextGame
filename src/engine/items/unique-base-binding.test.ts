/** Constructed ownership and historical recomposition; no earned reward evidence. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as loot from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item, UniqueItemDef } from '../types/items';
import type { SaveV18 } from '../types/save';
import { aggregateCanonicalEquipmentMods, aggregateEquipmentMods, aggregateNonSocketEquipmentMods } from '../progression/equipment-mods';
import { buildSave } from '../save/serialize';
import { migrateSaveV19 } from '../save/migrate-v19';
import { validateFrozenV18Save } from '../save/validate';
import { withoutV19Fields } from '../../../tests/helpers/save-fixtures';

const future: UniqueItemDef = { id: 'items/unique/ormus-charm', name: 'items.unique.ormus-charm.name',
  baseId: 'items/base/small-charm', reqLevel: 1, stats: { statMods: { life: 20, mana: 10 } } };
const originals = loot.loadUniques();
const sword: Item = { id: 'old-inert-sword', baseId: 'items/base/wp1h-short-sword', rarity: 'unique',
  level: 32, identified: true, equipped: true, socketCapacity: 0, uniqueId: future.id,
  affixes: [{ affixId: 'retained', values: new Map([['statMods.mana', 3]]) }] };
afterEach(() => { vi.restoreAllMocks(); });
function introduceCharm() {
  vi.spyOn(loot, 'loadUniques').mockReturnValue([...originals.filter(row => row.id !== future.id), future]);
}
function predecessor(): SaveV18 {
  const player = createMockPlayer('Historical', 'sorceress');
  const save = buildSave({ timestamp: 1000, player: { ...player,
    derivedStats: { ...player.derivedStats, life: 7, mana: 9 } },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
  const old = { ...withoutV19Fields(save), version: 18 as const };
  return { ...old, inventory: { ...old.inventory, equipped: { weapon: sword,
    chest: { id: 'unsupported', baseId: 'items/base/armor-quilted', rarity: 'runeword', level: 32,
      identified: true, equipped: true, socketCapacity: 2, runewordId: 'runewords/lore', runes: ['runes/ort', 'runes/sol'] } } } };
}

describe('concrete current unique binding', () => {
  it('keeps a formerly unknown Ormus string inert on its old sword while retaining real affixes', () => {
    const before = structuredClone(sword), baseline = aggregateEquipmentMods({ weapon: sword });
    introduceCharm();
    expect(aggregateEquipmentMods({ weapon: sword })).toEqual(baseline);
    expect(baseline.mana).toBe(3); expect(baseline.life).toBeUndefined();
    expect(sword).toEqual(before);
  });
  it('keeps a matching definition active and ignores a known mismatched definition', () => {
    const pelta = originals.find(row => row.id === 'items/unique/pelta-lunata');
    if (!pelta) throw new Error('Missing Pelta fixture');
    const mismatched = { ...sword, uniqueId: pelta.id, affixes: [] };
    expect(aggregateEquipmentMods({ weapon: mismatched }).life).toBeUndefined();
    expect(aggregateEquipmentMods({ offhand: { ...mismatched, baseId: pelta.baseId } }).life).toBe(10);
  });
  it('uses the live future package only on its concrete base', () => {
    introduceCharm();
    vi.spyOn(loot, 'loadItemBases').mockReturnValue(new Map([...loot.loadItemBases(),
      [future.baseId, { id: future.baseId, name: 'items.base.small-charm', type: 'charm',
        slot: 'charm', reqLevel: 1, maxSockets: 0, canHaveAffixes: false }]]));
    expect(aggregateEquipmentMods({ charm: { ...sword, baseId: future.baseId, affixes: [] } }))
      .toEqual({ life: 20, mana: 10 });
  });
  it('ignores mismatched unique requirements and retains the strictest valid base requirement', () => {
    const pelta = originals.find(row => row.id === 'items/unique/pelta-lunata');
    if (!pelta) throw new Error('Missing Pelta fixture');
    const mismatched = { ...sword, uniqueId: pelta.id };
    expect(loot.resolveItemReqLevel(mismatched)).toBe(1);
    expect(loot.resolveItemReqLevel({ ...mismatched, baseId: pelta.baseId })).toBe(2);
    const base = loot.loadItemBases().get(pelta.baseId);
    if (!base) throw new Error('Missing Pelta base');
    expect(loot.resolveItemReqLevel({ ...mismatched, baseId: pelta.baseId }, { ...base, reqLevel: 99 })).toBe(99);
  });
});

describe('historical unique authority during migration recomposition', () => {
  it.each([aggregateNonSocketEquipmentMods, aggregateCanonicalEquipmentMods])(
    'does not activate a future definition through historical aggregation %#', aggregate => {
      const before = aggregate({ weapon: sword });
      expect(before.life).toBeUndefined();
      expect(before.mana).toBe(3);
      introduceCharm();
      expect(aggregate({ weapon: sword })).toEqual(before);
      // Old known mismatches retain by-ID historical semantics.
      expect(aggregate({ weapon: { ...sword, uniqueId: 'items/unique/pelta-lunata' } }).life).toBe(10);
    });
  it('preserves actual valid18 ownership and low resources through a forced19 recomposition', () => {
    const input = predecessor(), before = structuredClone(input);
    const expected = migrateSaveV19(validateFrozenV18Save(input));
    expect(expected.inventory.socketQuarantine).toHaveLength(1);
    expect(expected.player.derivedStats.lifeMax).toBe(input.player.derivedStats.lifeMax);
    expect(expected.player.derivedStats.manaMax).toBe(input.player.derivedStats.manaMax + 3);
    introduceCharm();
    const migrated = migrateSaveV19(validateFrozenV18Save(input));
    expect(migrated).toEqual(expected);
    expect(migrated.player.derivedStats.life).toBe(7);
    expect(migrated.player.derivedStats.mana).toBe(9);
    expect(migrated.inventory.equipped.weapon?.uniqueId).toBe(future.id);
    expect(input).toEqual(before);
  });
});
