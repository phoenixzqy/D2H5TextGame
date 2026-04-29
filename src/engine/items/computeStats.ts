import type { Item, ItemBase, Affix, ItemStatKey, LegacyAffixRoll } from '../types/items';
export type ItemStatBlock = Readonly<Record<ItemStatKey, number>>;
const ZERO_STATS: Record<ItemStatKey, number> = { attack: 0, life: 0, mana: 0, defense: 0, critChance: 0, critDamage: 0, physDodge: 0, magicDodge: 0, fireRes: 0, coldRes: 0, lightningRes: 0, poisonRes: 0, arcaneRes: 0, physicalRes: 0 };
function isLegacy(roll: NonNullable<Item['affixes']>[number]): roll is LegacyAffixRoll { return 'values' in roll; }
function legacyPath(path: string): ItemStatKey | undefined { return ({ 'statMods.attack':'attack','statMods.life':'life','statMods.mana':'mana','statMods.defense':'defense','statMods.critChance':'critChance','statMods.critDamage':'critDamage','statMods.physDodge':'physDodge','statMods.magicDodge':'magicDodge','resistances.fire':'fireRes','resistances.cold':'coldRes','resistances.lightning':'lightningRes','resistances.poison':'poisonRes','resistances.arcane':'arcaneRes','resistances.physical':'physicalRes','damageBonus.value':'attack' } as Record<string, ItemStatKey>)[path]; }
export function computeStats(item: Item, base: ItemBase | undefined, affixes: ReadonlyMap<string, Affix>): ItemStatBlock {
  const stats = { ...ZERO_STATS };
  if (base?.baseDamage) stats.attack += item.baseRolls?.attack ?? base.baseDamage.max;
  if (typeof base?.baseDefense === 'number') stats.defense += item.baseRolls?.defense ?? base.baseDefense;
  for (const roll of item.affixes ?? []) {
    if (isLegacy(roll)) { for (const [path, value] of roll.values.entries()) { const stat = legacyPath(path); if (stat) stats[stat] += value; } continue; }
    const def = affixes.get(roll.id); if (def) stats[def.stat] += roll.rolledValue;
  }
  return stats;
}
