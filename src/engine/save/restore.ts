/** Pure restoration of validated JSON-safe save values. */
import type { HistoricalItem } from './historical-items';
import type { Item } from '../types/items';
import type { Player, Mercenary } from '../types/entities';

/** Restore the two Map fields represented as entry arrays in exported JSON. */
function restoreNumericMap<K extends string>(value: unknown): ReadonlyMap<K, number> {
  if (value instanceof Map) return value as ReadonlyMap<K, number>;
  if (Array.isArray(value)) return new Map(value as [K, number][]);
  return new Map(Object.entries(value as Record<string, number>) as [K, number][]);
}
/** Restore the legacy affix value Maps on a validated item. */
export function restoreItem<T extends Item | HistoricalItem>(item: T): T {
  if (!item.affixes) return item;
  return {
    ...item,
    affixes: item.affixes.map((affix) =>
      'values' in affix ? { ...affix, values: restoreNumericMap(affix.values) } : affix
    )
  };
}
/** Restore item affix Maps without mutating the supplied equipment. */
export function restoreEquipment<T extends Record<string, Item | HistoricalItem | null | undefined>>(equipment: T): T {
  return Object.fromEntries(
    Object.entries(equipment).map(([slot, item]) => [slot, item ? restoreItem(item) : item])
  ) as T;
}
/** Restore legacy item and skill Maps without mutating a saved unit. */
export function restoreUnit<T extends Omit<Player | Mercenary, 'equipment'> & { readonly equipment: readonly (Item | HistoricalItem)[] }>(unit: T): T {
  return {
    ...unit,
    equipment: unit.equipment.map(restoreItem),
    skills: unit.skills.map((skill) =>
      skill.synergies ? { ...skill, synergies: restoreNumericMap(skill.synergies) } : skill
    )
  };
}
