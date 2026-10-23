import { loadItemBases } from '@/data/loaders/loot';
import { socketRunewords } from '@/data/loaders/socket-effects';
import type { EquipmentSlot, Item, RunewordGrant } from '../types/items';
import { validateCanonicalSocketItem } from './socket-contents';

/** Stable source ordering, also used when later grants append missing active skills. */
export const GRANT_EQUIPMENT_SLOT_ORDER: readonly EquipmentSlot[] = Object.freeze([
  'head', 'amulet', 'chest', 'gloves', 'belt', 'boots', 'ring-left', 'ring-right', 'weapon', 'offhand'
]);

/** Resolve a completed word's reviewed adaptations only after canonical socket validation. */
export function resolveItemRunewordGrants(item: Item): readonly RunewordGrant[] {
  if (!item.runewordId) return [];
  const base = loadItemBases().get(item.baseId);
  if (!base) throw new Error('Unknown runeword grant base');
  validateCanonicalSocketItem(item, base);
  return socketRunewords.find(word => word.id === item.runewordId)?.grants ?? [];
}

/** Highest named grant from real equipped slots; item flags and actor mirrors confer no ownership. */
export function resolveEquippedRunewordGrants(
  equipped: Readonly<Record<string, Item | null>>
): readonly RunewordGrant[] {
  const grants = new Map<RunewordGrant['id'], RunewordGrant>();
  const bases = loadItemBases();
  for (const slot of GRANT_EQUIPMENT_SLOT_ORDER) {
    const item = equipped[slot];
    if (!item) continue;
    const baseSlot = bases.get(item.baseId)?.slot;
    const rings = (slot === 'ring-left' || slot === 'ring-right') &&
      (baseSlot === 'ring-left' || baseSlot === 'ring-right');
    if (baseSlot !== slot && !rings) continue;
    for (const grant of resolveItemRunewordGrants(item)) {
      const previous = grants.get(grant.id);
      if (!previous || grant.rank > previous.rank) grants.set(grant.id, grant);
    }
  }
  return Object.freeze([...grants.values()].map(grant => Object.freeze({ ...grant })));
}
