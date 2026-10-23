import type { Item, ItemBase, Affix, ItemStatKey } from '../types/items';
export type ItemStatBlock = Readonly<Record<ItemStatKey, number>>;
const ZERO_STATS: Record<ItemStatKey, number> = { attack: 0, life: 0, mana: 0, defense: 0, magicResist: 0, critChance: 0, critDamage: 0, physDodge: 0, magicDodge: 0, fireRes: 0, coldRes: 0, lightningRes: 0, poisonRes: 0, arcaneRes: 0, physicalRes: 0 };
const FRACTIONAL_ROLLED_STATS: ReadonlySet<ItemStatKey> = new Set([
  'critChance', 'critDamage', 'physDodge', 'magicDodge'
]);

/**
 * Project base stats and modern affixes without changing saved rolls.
 * Critical/dodge rolls use authored percentage points; derived stats consume
 * fractions and additive critical multipliers. Flat stats and resistance
 * points retain their units. Legacy maps are projected by the gear aggregator.
 */
export function computeStats(item: Pick<Item, 'baseRolls' | 'affixes'>, base: ItemBase | undefined, affixes: ReadonlyMap<string, Affix>): ItemStatBlock {
  const stats = { ...ZERO_STATS };
  if (base?.baseDamage) stats.attack += item.baseRolls?.attack ?? base.baseDamage.max;
  if (typeof base?.baseDefense === 'number') stats.defense += item.baseRolls?.defense ?? base.baseDefense;
  for (const roll of item.affixes ?? []) {
    if ('values' in roll) continue;
    const def = affixes.get(roll.id);
    if (def) stats[def.stat] += FRACTIONAL_ROLLED_STATS.has(def.stat)
      ? roll.rolledValue / 100
      : roll.rolledValue;
  }
  return stats;
}
