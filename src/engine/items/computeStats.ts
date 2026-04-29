import type { Item, ItemBase, Affix, ItemStatKey } from '../types/items';
export type ItemStatBlock = Readonly<Record<ItemStatKey, number>>;
const ZERO_STATS: Record<ItemStatKey, number> = { attack: 0, life: 0, mana: 0, defense: 0, critChance: 0, critDamage: 0, physDodge: 0, magicDodge: 0, fireRes: 0, coldRes: 0, lightningRes: 0, poisonRes: 0, arcaneRes: 0, physicalRes: 0 };
export function computeStats(item: Item, base: ItemBase | undefined, affixes: ReadonlyMap<string, Affix>): ItemStatBlock {
  const stats = { ...ZERO_STATS };
  if (base?.baseDamage) stats.attack += item.baseRolls?.attack ?? base.baseDamage.max;
  if (typeof base?.baseDefense === 'number') stats.defense += item.baseRolls?.defense ?? base.baseDefense;
  for (const roll of item.affixes ?? []) {
    if ('values' in roll) continue;
    const def = affixes.get(roll.id);
    if (def) stats[def.stat] += roll.rolledValue;
  }
  return stats;
}
