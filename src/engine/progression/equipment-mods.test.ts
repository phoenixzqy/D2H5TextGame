import { describe, expect, it } from 'vitest';
import type { AffixRoll, Item } from '../types/items';
import { aggregateEquipmentMods, applyEquipmentCoreMods, equipmentModsToDerivedModifiers } from './equipment-mods';

function item(id: string, baseId: string, affixes: AffixRoll[] = []): Item {
  return { id, baseId, rarity: 'magic', level: 1, identified: true, equipped: false, affixes };
}

function affix(values: readonly (readonly [string, number])[]): AffixRoll {
  return { affixId: 'test-affix', values: new Map(values) };
}

describe('aggregateEquipmentMods', () => {
  it('sums base implicit defense and rolled affix values', () => {
    const mods = aggregateEquipmentMods({
      head: item('helm', 'items/base/helm-cap', [
        affix([
          ['coreStats.vitality', 3],
          ['statMods.life', 12],
          ['resistances.fire', 7]
        ])
      ]),
      boots: null
    });

    expect(mods).toEqual({ vitality: 3, life: 12, defense: 7, fireRes: 7 });
  });

  it('adapts equipment mods to existing derived-stat formulas', () => {
    const mods = aggregateEquipmentMods({
      weapon: item('sword', 'items/base/wp1h-short-sword', [affix([['statMods.attackSpeed', 5]])])
    });

    expect(applyEquipmentCoreMods({ strength: 1, dexterity: 2, vitality: 3, energy: 4 }, mods)).toEqual({
      strength: 1,
      dexterity: 2,
      vitality: 3,
      energy: 4
    });
    expect(equipmentModsToDerivedModifiers(mods)).toMatchObject({ flatAttack: 8, attackSpeedBonus: 5 });
  });
});
