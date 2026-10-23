/** Frozen v17/v18 semantics. Never import live item rules or catalogs here. */
import frozen from './frozen-v18-sockets.json';
import type { HistoricalItem as Item } from './historical-items';

export interface HistoricalSocketBase {
  readonly id: string;
  readonly type: string;
  readonly sockets?: number;
  readonly maxSockets?: number;
}
export const historicalSocketBases: readonly HistoricalSocketBase[] = frozen.bases;
const knownRuneIds = new Set(frozen.runeIds);


/** Read only own enumerable data fields; never evaluate an imported accessor. */
function ownField(value: object, key: string): unknown {
  const property = Object.getOwnPropertyDescriptor(value, key);
  if (!property) {
    if (key in value) throw new Error(`Inherited item service field: ${key}`);
    return undefined;
  }
  if (!property.enumerable || !Object.hasOwn(property, 'value')) {
    throw new Error(`Invalid item service field: ${key}`);
  }
  return property.value as unknown;
}

function isGear(base: HistoricalSocketBase): boolean {
  return base.type === 'weapon' || base.type === 'armor';
}

/**
 * Resolve native capacity without the historical template fallback. Weapon/armor
 * must carry their own finite safe integer in the reviewed base bounds. Other
 * item types may omit capacity or carry zero. Invalid native state throws.
 * This resolves capacity only; rune/runeword and cosmetic validation is separate.
 */
export function effectiveSocketCapacity(item: Item, base: HistoricalSocketBase): number {
  if (item.baseId !== base.id || !Number.isSafeInteger(base.maxSockets)
    || typeof base.maxSockets !== 'number' || base.maxSockets < 0 || base.maxSockets > 6) {
    throw new Error('Invalid item socket base or reviewed maximum');
  }
  const capacity = ownField(item, 'socketCapacity');
  if (!isGear(base) && !Object.hasOwn(item, 'socketCapacity')) return 0;
  if (typeof capacity !== 'number' || !Number.isSafeInteger(capacity) || capacity < 0
    || capacity > (isGear(base) ? base.maxSockets : 0)) {
    throw new Error('Invalid native item socket capacity');
  }
  return capacity;
}

function validateSocketState(item: Item, base: HistoricalSocketBase): void {
  const capacity = effectiveSocketCapacity(item, base);
  const runes = ownField(item, 'runes');
  const runewordId = ownField(item, 'runewordId');
  if (!isGear(base)) {
    if (Object.hasOwn(item, 'runes') || Object.hasOwn(item, 'runewordId') || item.rarity === 'runeword') {
      throw new Error('Non-gear cannot contain runes or a runeword');
    }
    return;
  }
  const runeIds: string[] = [];
  if (Object.hasOwn(item, 'runes')) {
    if (!Array.isArray(runes) || runes.length > capacity
      || Reflect.ownKeys(runes).length !== runes.length + 1) throw new Error('Invalid socketed rune array');
    for (let index = 0; index < runes.length; index++) {
      const rune = ownField(runes, String(index));
      if (typeof rune !== 'string' || !knownRuneIds.has(rune)) throw new Error('Invalid socketed rune ID');
      runeIds.push(rune);
    }
  }
  if (Object.hasOwn(item, 'runewordId') || item.rarity === 'runeword') {
    const match = (item.rarity === 'normal' || item.rarity === 'runeword')
      ? frozen.runewords.find(word => word.sockets === capacity && word.runes.length === runeIds.length
        && word.allowedBases.includes(base.type) && word.runes.every((id, index) => id === runeIds[index]))?.id
      : undefined;
    if (typeof runewordId !== 'string' || runewordId !== match) throw new Error('Invalid item runeword');
  }
}

/** Check native capacity, real rune IDs and exact data-backed runeword semantics. */
export function isItemSocketStateValid(item: Item, base: HistoricalSocketBase): boolean {
  try {
    validateSocketState(item, base);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate native socket state and the closed persisted cosmetic identity shape.
 * Live ownership, source receipts and equality with current player.id remain the
 * service caller's authority; persisted historical identity is not a live player.
 */
export function validateItemServiceFields(item: Item, base: HistoricalSocketBase): void {
  validateSocketState(item, base);
  const identity = ownField(item, 'personalizedBy');
  if (!Object.hasOwn(item, 'personalizedBy')) return;
  if (identity === null || typeof identity !== 'object') throw new Error('Invalid personalized identity');
  const prototype: unknown = Object.getPrototypeOf(identity);
  if ((prototype !== Object.prototype && prototype !== null)
    || Reflect.ownKeys(identity).length !== 2
    || !Object.hasOwn(identity, 'characterId') || !Object.hasOwn(identity, 'name')) {
    throw new Error('Invalid personalized identity shape');
  }
  const characterId = ownField(identity, 'characterId');
  const name = ownField(identity, 'name');
  if (typeof characterId !== 'string' || characterId.length === 0 || typeof name !== 'string'
    || name !== name.trim() || name.length < 1 || name.length > 16) {
    throw new Error('Invalid personalized character identity or name');
  }
}

/**
 * Project a predecessor-validated item into native active ownership without RNG
 * or mutation. Only migration may use the previous base.sockets ?? 0 capacity.
 * Return null when that exact state cannot become legal active gear; callers
 * quarantine the untouched original payload and origin, and handle missing bases
 * and colliding ownership IDs before using this per-item projection.
 */
export function migrateLegacyItemSocketState(item: Item, base: HistoricalSocketBase): Item | null {
  if ('socketCapacity' in item || 'personalizedBy' in item) return null;
  const migrated = isGear(base) ? { ...item, socketCapacity: base.sockets ?? 0 } : { ...item };
  return isItemSocketStateValid(migrated, base) ? migrated : null;
}
