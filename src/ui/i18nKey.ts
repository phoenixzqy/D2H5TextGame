/**
 * Helpers for resolving raw "data keys" into localized strings.
 *
 * Game data files store i18n references in *dotted* form
 * (e.g. `skills.necromancer.skeleton-mastery.name` or
 * `map.subArea.a1-cold-plains`) where the first segment is the i18next
 * namespace. Calling `t()` directly on those strings looks up the entire
 * dotted path inside the *current* namespace and falls through to the
 * raw key on miss — which is what produced the bug where users saw
 * `skills.necromancer.skeleton-mastery.name` rendered verbatim.
 *
 * `tDataKey()` rewrites the leading `<ns>.` to i18next's namespace
 * separator `<ns>:` so the lookup hits the right resource bundle.
 *
 * For item displays, `tItemName()` resolves an item to its localized base
 * name from the `items` namespace, mirroring `<ItemTooltip>`'s logic so
 * inventory grids, equipment lists, drop rolls, and merc-equipment
 * dropdowns all show the same human-readable name.
 */
import type { TFunction } from 'i18next';
import { loadSetPieces, loadUniques } from '@/data/loaders/loot';
import type { Item } from '@/engine/types/items';

/** Namespaces declared in {@link src/i18n/index.ts}. Keep in sync. */
const KNOWN_NAMESPACES: ReadonlySet<string> = new Set([
  'common',
  'character',
  'combat',
  'inventory',
  'skills',
  'settings',
  'town',
  'map',
  'mercs',
  'gacha',
  'quests',
  'monsters',
  'items',
  'maps',
  'rarity',
  'damage-types',
  'card',
  'affixes'
]);

/**
 * Translate a dotted data-key like `skills.necromancer.skeleton-mastery.name`
 * by routing the leading segment to the matching i18next namespace. If the
 * leading segment is not a known namespace, falls back to a plain `t(key)`.
 */
export function tDataKey(t: TFunction, key: string): string {
  if (!key) return key;
  if (key.includes(':')) return t(key);
  const dot = key.indexOf('.');
  if (dot <= 0) return t(key);
  const ns = key.slice(0, dot);
  if (!KNOWN_NAMESPACES.has(ns)) return t(key);
  return t(`${ns}:${key.slice(dot + 1)}`);
}

/** Pull the trailing slug from `items/base/<slug>` for `items:base.<slug>` lookup. */
export function itemBaseSlug(baseId: string): string {
  return baseId.split('/').pop() ?? baseId;
}

/**
 * Resolve an item to its localized base name (e.g. "短剑" / "Short Sword").
 * Uses the same `items:base.<slug>` key as {@link ItemTooltip}.
 */
export function tItemBaseName(t: TFunction, item: Pick<Item, 'baseId'>): string {
  return t(`items:base.${itemBaseSlug(item.baseId)}`);
}

export function tItemName(
  t: TFunction,
  item: Pick<Item, 'baseId'> & Partial<Pick<Item, 'uniqueId' | 'setPieceId' | 'generatedName'>>
): string {
  const unique = item.uniqueId ? loadUniques().find((entry) => entry.id === item.uniqueId) : undefined;
  if (unique) return tDataKey(t, unique.name);
  const setPiece = item.setPieceId ? loadSetPieces().find((entry) => entry.id === item.setPieceId) : undefined;
  if (setPiece) return tDataKey(t, setPiece.name);
  const baseName = tItemBaseName(t, item);
  const prefix = item.generatedName?.prefix?.trim();
  const suffix = item.generatedName?.suffix?.trim();
  return [prefix, baseName, suffix].filter(Boolean).join(' ');
}
