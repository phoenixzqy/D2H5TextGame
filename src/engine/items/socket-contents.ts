import { gemEffects, runeEffects, socketRunewords } from '@/data/loaders/socket-effects';
import { materialCatalog } from '@/data/loaders/materials';
import { matchRuneword, recipeFromData } from '../loot/runeword';
import type { Item, ItemBase, ItemBonusStats } from '../types/items';
import { effectiveSocketCapacity, validateItemPersonalization } from './socket-capacity';

/** The only v19 socket representation; order is part of item identity. */
export type SocketContent = { readonly kind: 'rune'; readonly id: string }
  | { readonly kind: 'gem'; readonly id: string };
/** Explicit integration boundary while the current save format remains frozen v18. */
export type CanonicalSocketItem = Omit<Item, 'runes'> & {
  readonly runes?: never;
  readonly socketContents?: readonly SocketContent[];
};

const recipes = socketRunewords.map(recipeFromData);
function ownData(value: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) {
    if (key in value) throw new Error(`Inherited socket field: ${key}`);
    return undefined;
  }
  if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) throw new Error(`Invalid socket field: ${key}`);
  return descriptor.value as unknown;
}

function readContents(item: CanonicalSocketItem, capacity: number): readonly SocketContent[] {
  if ('runes' in item) throw new Error('Obsolete rune representation in canonical item');
  const raw = ownData(item, 'socketContents');
  if (!Object.hasOwn(item, 'socketContents')) return [];
  if (!Array.isArray(raw) || raw.length > capacity || Reflect.ownKeys(raw).length !== raw.length + 1) {
    throw new Error('Invalid canonical socket contents');
  }
  const contents: SocketContent[] = [];
  for (let index = 0; index < raw.length; index++) {
    const entry = ownData(raw, String(index));
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
      || (Object.getPrototypeOf(entry) !== Object.prototype && Object.getPrototypeOf(entry) !== null)
      || Reflect.ownKeys(entry).length !== 2) throw new Error('Invalid canonical socket entry');
    const kind = ownData(entry, 'kind'), id = ownData(entry, 'id');
    if ((kind !== 'rune' && kind !== 'gem') || typeof id !== 'string' || materialCatalog.get(id)?.kind !== kind) {
      throw new Error('Unknown canonical socket material');
    }
    contents.push({ kind, id });
  }
  return contents;
}

function matchedWord(item: CanonicalSocketItem, base: ItemBase, contents: readonly SocketContent[]): string | undefined {
  if (contents.some(content => content.kind !== 'rune')) return undefined;
  return matchRuneword({ baseType: base.type, slot: base.slot,
    ...(base.weaponType ? { weaponType: base.weaponType } : {}),
    sockets: effectiveSocketCapacity(item, base), runes: contents.map(content => content.id),
    isWhiteBase: item.rarity === 'normal' || item.rarity === 'runeword' }, recipes);
}

/** Validate capacity, closed material entries, exact word identity and cosmetics without mutation. */
export function validateCanonicalSocketItem(item: CanonicalSocketItem, base: ItemBase): void {
  const capacity = effectiveSocketCapacity(item, base);
  const contents = readContents(item, capacity), wordId = ownData(item, 'runewordId');
  if (base.type !== 'weapon' && base.type !== 'armor'
    && (contents.length > 0 || Object.hasOwn(item, 'runewordId') || item.rarity === 'runeword')) {
    throw new Error('Non-gear cannot contain socket effects');
  }
  const expectedWord = matchedWord(item, base, contents);
  if (expectedWord
    ? item.rarity !== 'runeword' || wordId !== expectedWord
    : Object.hasOwn(item, 'runewordId') || item.rarity === 'runeword') {
    throw new Error('Invalid canonical item runeword');
  }
  validateItemPersonalization(item);
}

/** Resolve each plain insert and the explicit completed-word package exactly once. */
export function socketBonusPackages(item: CanonicalSocketItem, base: ItemBase): readonly ItemBonusStats[] {
  validateCanonicalSocketItem(item, base);
  const context = base.type === 'weapon' ? 'weaponEffect' : base.slot === 'offhand' ? 'shieldEffect' : 'armorEffect';
  const packages = (item.socketContents ?? []).flatMap(content => {
    const effect = (content.kind === 'rune' ? runeEffects.get(content.id) : gemEffects.get(content.id))?.[context];
    return effect ? [effect] : [];
  });
  if (item.runewordId) {
    const word = socketRunewords.find(row => row.id === item.runewordId);
    if (word) packages.push(word.stats);
  }
  return packages;
}

/** Pure next-empty-socket preview. Ownership, costs and atomic publication belong to the action service. */
export function previewSocketInsertion(item: CanonicalSocketItem, base: ItemBase, materialId: string): CanonicalSocketItem {
  validateCanonicalSocketItem(item, base);
  const kind = materialCatalog.get(materialId)?.kind;
  const contents = readContents(item, effectiveSocketCapacity(item, base));
  if ((kind !== 'rune' && kind !== 'gem') || item.equipped || typeof item.equipped !== 'boolean'
    || (base.type !== 'weapon' && base.type !== 'armor') || contents.length >= effectiveSocketCapacity(item, base)) {
    throw new Error('Ineligible socket insertion');
  }
  const socketContents: readonly SocketContent[] = [...contents, { kind, id: materialId }];
  const next = { ...item, socketContents }, word = matchedWord(next, base, socketContents);
  return item.rarity === 'normal' && word ? { ...next, rarity: 'runeword', runewordId: word } : next;
}

/** Pure clearing preview; the transaction spends the recipe cost and destroys inserts without a refund. */
export function previewSocketClearing(item: CanonicalSocketItem, base: ItemBase): CanonicalSocketItem {
  validateCanonicalSocketItem(item, base);
  if (item.equipped || typeof item.equipped !== 'boolean' || (item.socketContents?.length ?? 0) === 0) throw new Error('Ineligible socket clearing');
  const { runewordId: _wordId, ...rest } = item;
  return { ...rest, rarity: item.rarity === 'runeword' ? 'normal' : item.rarity, socketContents: [] };
}
