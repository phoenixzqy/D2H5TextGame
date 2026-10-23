import { describe, expect, it } from 'vitest';
import { loadSets, loadUniques } from '@/data/loaders/loot';
import { aggregateEquipmentMods } from './equipment-mods';
import type { Item } from '../types/items';

function unique(slug: string): Item {
  const def = loadUniques().find(row => row.id === `items/unique/${slug}`);
  if (!def) throw new Error(`missing real unique ${slug}`);
  return { id: slug, baseId: def.baseId, uniqueId: def.id, rarity: 'unique',
    level: def.reqLevel, identified: true, equipped: true };
}
function setItems(id: string, count: number): Record<string, Item> {
  const def = loadSets().find(row => row.id === id);
  if (!def?.pieces || def.pieces.length !== count) throw new Error(`missing real set ${id}`);
  return Object.fromEntries(def.pieces.map(piece => [piece.id, {
    id: piece.id, baseId: piece.baseId, setId: id, setPieceId: piece.id,
    rarity: 'set' as const, level: piece.reqLevel, identified: true, equipped: true
  }]));
}

describe('gear unit composition across real source representations', () => {
  it('adds modern rolled percentages to canonical unique, set and legacy fractions exactly once', () => {
    const gear = {
      ...setItems('sets/cleglaw-brace', 3),
      boots: unique('silkweave'), ring: unique('carrion-wind'),
      amulet: {
        id: 'mixed-rates', baseId: 'items/base/amu-tin', rarity: 'rare' as const,
        level: 9, identified: true, equipped: true, affixes: [
          { id: 'affix.precise.crit-chance', tier: 0, rolledValue: 2 },
          { id: 'affix.savage.crit-damage', tier: 0, rolledValue: 5 },
          { id: 'affix.nimble.phys-dodge', tier: 0, rolledValue: 2 },
          { affixId: 'legacy-rates', values: new Map([
            ['statMods.critChance', .10], ['statMods.critDamage', .25], ['statMods.magicDodge', .02]
          ]) }
        ]
      },
      magicRing: {
        id: 'magic-rate', baseId: 'items/base/ring-iron', rarity: 'magic' as const,
        level: 9, identified: true, equipped: true,
        affixes: [{ id: 'affix.ethereal.magic-dodge', tier: 0, rolledValue: 1 }]
      }
    };
    const before = structuredClone(gear);
    const mods = aggregateEquipmentMods(gear);
    expect(mods.critChance).toBeCloseTo(.12, 12);
    expect(mods.critDamage).toBeCloseTo(.30, 12);
    expect(mods.physDodge).toBeCloseTo(.27, 12);
    expect(mods.magicDodge).toBeCloseTo(.23, 12);
    expect(aggregateEquipmentMods(gear)).toEqual(mods);
    expect(gear).toEqual(before);
  });

  it('projects actual Natalya thresholds and its already-fractional boots together', () => {
    expect(aggregateEquipmentMods(setItems('sets/natalyas-odium', 4))).toMatchObject({
      critChance: .15, critDamage: .50, physDodge: .05
    });
  });
});
