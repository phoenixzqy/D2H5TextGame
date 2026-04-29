/**
 * bulkDiscard — pure predicates for the inventory "Discard all …" toolbar.
 *
 * No React, no stores. Each `selectXxx` returns the subset of `items` the
 * bulk action would target. Uniques and set items are *always* preserved
 * by every selector — that rule is shared across the toolbar and is
 * communicated to the player in the confirm dialog.
 *
 * TODO(game-designer): replace with salvage→materials when crafting ships.
 *
 * @module features/inventory/bulkDiscard
 */
import type { Item, ItemBase, Rarity } from '@/engine/types/items';

/** Items the toolbar must never touch, regardless of rarity selection. */
export function isProtected(item: Item): boolean {
  return item.rarity === 'unique' || item.rarity === 'set';
}

/**
 * Items with rarity in `rarities`, excluding protected (unique/set).
 *
 * Note: passing 'unique' or 'set' in `rarities` is a no-op — protection
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

/**
 * Items the player has clearly outgrown: their effective ilvl is **strictly
 * less than** the ilvl of the gear currently equipped in the same slot. If
 * no item is equipped in that slot, the candidate is *not* selected — the
 * player might still want to wear it.
 *
 * Items whose base has no slot (charms, gems, runes, materials) and items
 * whose base is not in `bases` (corrupted save / missing data) are skipped.
 * Uniques and sets are always preserved.
 */
export function selectBelowEquippedTier(
  items: readonly Item[],
  equipped: Readonly<Record<string, Item | null>>,
  bases: ReadonlyMap<string, ItemBase>
): Item[] {
  const out: Item[] = [];
  for (const it of items) {
    if (isProtected(it)) continue;
    const base = bases.get(it.baseId);
    if (!base?.slot) continue;
    const slotKey = base.slot === 'ring-left' || base.slot === 'ring-right' ? null : base.slot;
    // Rings have two slots; consider "outgrown" only if BOTH ring slots have
    // higher-ilvl rings equipped. This avoids deleting a ring the player
    // intends to put in their empty second slot.
    if (slotKey === null) {
      const left = equipped['ring-left'];
      const right = equipped['ring-right'];
      if (!left || !right) continue;
      const leftI = effectiveIlvl(left);
      const rightI = effectiveIlvl(right);
      if (effectiveIlvl(it) < Math.min(leftI, rightI)) out.push(it);
      continue;
    }
    const eq = equipped[slotKey];
    if (!eq) continue;
    if (effectiveIlvl(it) < effectiveIlvl(eq)) out.push(it);
  }
  return out;
}
