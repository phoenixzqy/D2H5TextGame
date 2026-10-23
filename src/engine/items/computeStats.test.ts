import { describe, expect, it } from 'vitest';
import { loadAffixPool, loadItemBases } from '@/data/loaders/loot';
import type { Item, ItemStatKey } from '../types/items';
import { computeStats } from './computeStats';

const definitions = new Map(loadAffixPool().map(affix => [affix.id, affix]));
function item(affixes: NonNullable<Item['affixes']>): Item {
  return { id: 'unit-regression', baseId: 'items/base/wp1h-short-sword', rarity: 'rare',
    level: 9, identified: true, equipped: false, baseRolls: { attack: 7 }, affixes };
}
const cases: readonly [string, ItemStatKey, number, number][] = [
  ['affix.precise.crit-chance', 'critChance', 2, .02],
  ['affix.savage.crit-damage', 'critDamage', 5, .05],
  ['affix.nimble.phys-dodge', 'physDodge', 2, .02],
  ['affix.ethereal.magic-dodge', 'magicDodge', 1, .01]
];

describe('modern rolled affix percentage-point units', () => {
  it.each(cases)('%s contributes canonical fractions', (id, key, raw, expected) => {
    const gear = item([{ id, tier: 0, rolledValue: raw }]);
    const before = structuredClone(gear);
    const definitionBefore = structuredClone(definitions.get(id));
    expect(definitions.get(id)?.stat).toBe(key);
    expect(computeStats(gear, undefined, definitions)[key]).toBe(expected);
    expect(gear).toEqual(before);
    expect(definitions.get(id)).toEqual(definitionBefore);
  });

  it.each(cases)('%s converts even a one-point roll and preserves zero', (id, key) => {
    expect(computeStats(item([{ id, tier: 0, rolledValue: 1 }]), undefined, definitions)[key]).toBe(.01);
    expect(computeStats(item([{ id, tier: 0, rolledValue: 0 }]), undefined, definitions)[key]).toBe(0);
  });

  it('adds multiple rolls without clamping their final probability or multiplier', () => {
    const gear = item([
      { id: 'affix.precise.crit-chance', tier: 2, rolledValue: 10 },
      { id: 'affix.precise.crit-chance', tier: 2, rolledValue: 10 },
      { id: 'affix.savage.crit-damage', tier: 2, rolledValue: 55 }
    ]);
    expect(computeStats(gear, undefined, definitions)).toMatchObject({ critChance: .2, critDamage: .55 });
  });

  it('preserves base rolls, flat stats and every resistance in whole points', () => {
    const flat: readonly [string, ItemStatKey, number][] = [
      ['affix.weapon.attack.flat', 'attack', 3], ['affix.armor.defense.flat', 'defense', 4],
      ['affix.vital.life.flat', 'life', 12], ['affix.mystic.mana.flat', 'mana', 7],
      ['affix.fire.resistance', 'fireRes', 5], ['affix.cold.resistance', 'coldRes', 6],
      ['affix.lightning.resistance', 'lightningRes', 7], ['affix.poison.resistance', 'poisonRes', 8],
      ['affix.arcane.resistance', 'arcaneRes', 9], ['affix.physical.resistance', 'physicalRes', 4]
    ];
    const gear = item(flat.map(([id, , rolledValue]) => ({ id, tier: 0, rolledValue })));
    expect(computeStats(gear, loadItemBases().get(gear.baseId), definitions)).toEqual({
      attack: 10, defense: 4, life: 12, mana: 7, magicResist: 0,
      critChance: 0, critDamage: 0, physDodge: 0, magicDodge: 0,
      fireRes: 5, coldRes: 6, lightningRes: 7, poisonRes: 8, arcaneRes: 9, physicalRes: 4
    });
  });

  it('leaves legacy maps to their separate canonical projection and ignores unknown IDs', () => {
    const gear = item([
      { affixId: 'legacy', values: new Map([['statMods.critChance', .1]]) },
      { id: 'unknown-affix', tier: 0, rolledValue: 50 }
    ]);
    expect(computeStats(gear, undefined, definitions).critChance).toBe(0);
    expect(gear.affixes?.[0]).toEqual({ affixId: 'legacy', values: new Map([['statMods.critChance', .1]]) });
  });
});
