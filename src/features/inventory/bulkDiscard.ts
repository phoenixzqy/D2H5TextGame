/**
 * bulkDiscard — pure predicates for the inventory "Discard all …" toolbar.
 *
 * No React, no stores. Each `selectXxx` returns the subset of `items` the
 * bulk action would target. Special gear and inserted rune/gem investments
 * are preserved by the shared engine rule, also used at deletion time and
 * communicated to the player in the confirm dialog.
 *
 * TODO(game-designer): replace with salvage→materials when crafting ships.
 *
 * @module features/inventory/bulkDiscard
 */
import type { Item, ItemBase, Rarity } from '@/engine/types/items';
import { isBulkDiscardProtected } from '@/engine/inventory/discard-protection';

/** Items the toolbar must never touch, regardless of rarity selection. */
export const isProtected = isBulkDiscardProtected;

/**
 * Items with rarity in `rarities`, excluding special gear and socket investments.
 *
 * Note: passing 'unique', 'set' or 'runeword' in `rarities` is a no-op — protection
 * always wins. This keeps the predicate safe for any caller wiring.
 */
export function selectByRarity(
  items: readonly Item[],
  rarities: readonly Rarity[]
): Item[] {
  const set = new Set(rarities);
  return items.filter((it) => !isProtected(it) && set.has(it.rarity));
}

/** `item.ilvl ?? item.level` — what the panel and tooltip display. */
function effectiveIlvl(item: Item): number {
  return item.ilvl ?? item.level;
}

/** Count-only summary; an item can match both its rarity and below-tier action. */
export interface BulkDiscardCounts {
  readonly normal: number;
  readonly magic: number;
  readonly rare: number;
  readonly belowTier: number;
}

/** Summarize all toolbar actions in one pass without allocating candidate lists. */
export function countBulkDiscardCandidates(
  items: readonly Item[],
  equipped: Readonly<Record<string, Item | null>>,
  bases: ReadonlyMap<string, ItemBase>
): BulkDiscardCounts {
  const counts = { normal: 0, magic: 0, rare: 0, belowTier: 0 };
  for (const item of items) {
    if (isProtected(item)) continue;
    switch (item.rarity) {
      case 'normal': counts.normal++; break;
      case 'magic': counts.magic++; break;
      case 'rare': counts.rare++; break;
    }
    if (isBelowEquippedTier(item, equipped, bases)) counts.belowTier++;
  }
  return counts;
}

function isBelowEquippedTier(
  item: Item,
  equipped: Readonly<Record<string, Item | null>>,
  bases: ReadonlyMap<string, ItemBase>
): boolean {
  if (isProtected(item)) return false;
  const base = bases.get(item.baseId);
  if (!base?.slot) return false;
  // Both ring slots must be filled with higher-ilvl gear before a ring is outgrown.
  if (base.slot === 'ring-left' || base.slot === 'ring-right') {
    const left = equipped['ring-left'];
    const right = equipped['ring-right'];
    return !!left && !!right && effectiveIlvl(item) < Math.min(effectiveIlvl(left), effectiveIlvl(right));
  }
  const current = equipped[base.slot];
  return !!current && effectiveIlvl(item) < effectiveIlvl(current);
}

/**
 * Items the player has clearly outgrown: their effective ilvl is **strictly
 * less than** the ilvl of the gear currently equipped in the same slot. If
 * no item is equipped in that slot, the candidate is *not* selected — the
 * player might still want to wear it.
 *
 * Items whose base has no slot (charms, gems, runes, materials) and items
 * whose base is not in `bases` (corrupted save / missing data) are skipped.
 * Special gear and inserted rune/gem investments are always preserved.
 */
export function selectBelowEquippedTier(
  items: readonly Item[],
  equipped: Readonly<Record<string, Item | null>>,
  bases: ReadonlyMap<string, ItemBase>
): Item[] {
  const out: Item[] = [];
  for (const it of items) {
    if (isBelowEquippedTier(it, equipped, bases)) out.push(it);
  }
  return out;
}
