import type { Item } from '../types/items';

/**
 * Preserve special gear and inserted rune/gem investments during bulk discard.
 * Empty socket capacity alone does not protect an item. Individual discard
 * remains a separate, explicitly confirmed action.
 */
export function isBulkDiscardProtected(item: Item): boolean {
  return item.rarity === 'unique' || item.rarity === 'set' ||
    item.rarity === 'runeword' || item.runewordId !== undefined ||
    (item.socketContents?.length ?? 0) > 0;
}
