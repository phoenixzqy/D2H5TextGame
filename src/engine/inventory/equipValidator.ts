/**
 * Equip validator — pure helpers for inventory rules.
 *
 * Owns the single source of truth for:
 *  - "is this base two-handed?" (driving the 2H ↔ offhand mutex)
 *  - "may a weapon-typed item be placed into the offhand slot?" (no, in
 *    v1; dual-wield ships in a follow-up branch)
 *
 * The Zustand inventory store calls these helpers; they intentionally
 * have no I/O so they're trivial to unit-test.
 *
 * @module engine/inventory/equipValidator
 */

import type { Item, ItemBase } from '../types/items';

/**
 * Whether a base item is a two-handed weapon.
 *
 * Authoritative source: `base.handedness === 'twoHanded'` (set in
 * `bases.json`, enforced by `item-base.schema.json`). A legacy id-based
 * fallback is retained for safety while content-designer's full
 * backfill lands; new code should rely on the field.
 */
export function isTwoHanded(base: ItemBase | undefined): boolean {
  if (!base || base.slot !== 'weapon') return false;
  if (base.handedness === 'twoHanded') return true;
  if (base.handedness === 'oneHanded') return false;
  // Legacy fallback — id naming convention.
  return (
    base.id.includes('/wp2h-') ||
    base.id === 'items/base/weapon-bow' ||
    base.id === 'items/base/weapon-crossbow' ||
    base.id === 'items/base/weapon-polearm'
  );
}

/** Reasons an offhand equip can be rejected. */
export type OffhandRejection =
  /** A weapon-typed base cannot occupy the offhand slot in v1. */
  | 'offhand-weapon-not-supported';

/** Result of {@link validateOffhandEquip}. */
export type OffhandEquipResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: OffhandRejection };

/**
 * Whether an item base may be placed into the offhand slot.
 *
 * In v1 only items with `slot === 'offhand'` (shields) are allowed.
 * Dual-wielding (two 1H weapons) is **deferred** — attempting to put a
 * weapon-typed base into the offhand slot is rejected with
 * `'offhand-weapon-not-supported'`.
 */
export function validateOffhandEquip(base: ItemBase): OffhandEquipResult {
  if (base.type === 'weapon' || base.slot === 'weapon') {
    return { ok: false, reason: 'offhand-weapon-not-supported' };
  }
  return { ok: true };
}

/** A snapshot of the relevant equipped slots for {@link planEquipMutex}. */
export interface EquipMutexSlots {
  readonly weapon: Item | null;
  readonly offhand: Item | null;
}

/** Output of {@link planEquipMutex}. */
export interface EquipMutexPlan {
  /** Items that must be displaced (returned to inventory). */
  readonly displaced: readonly Item[];
  /** Slots that must be cleared as part of the equip. */
  readonly clear: readonly ('weapon' | 'offhand')[];
}

/**
 * Compute which currently-equipped items are displaced when an item is
 * routed into `targetSlot`. Pure, no side effects.
 *
 * Mutex rules (v1):
 *  - Equipping into `weapon` with a 2H base ⇒ offhand is cleared.
 *  - Equipping into `offhand` while a 2H weapon is held ⇒ weapon is
 *    cleared.
 *  - Other slots ⇒ no cross-slot displacement.
 */
export function planEquipMutex(
  targetSlot: string,
  incomingBase: ItemBase,
  current: EquipMutexSlots,
  bases: ReadonlyMap<string, ItemBase>
): EquipMutexPlan {
  const displaced: Item[] = [];
  const clear: ('weapon' | 'offhand')[] = [];

  if (targetSlot === 'weapon' && isTwoHanded(incomingBase)) {
    if (current.offhand) {
      displaced.push(current.offhand);
      clear.push('offhand');
    }
  } else if (targetSlot === 'offhand') {
    const weapon = current.weapon;
    const weaponBase = weapon ? bases.get(weapon.baseId) : undefined;
    if (weapon && isTwoHanded(weaponBase)) {
      displaced.push(weapon);
      clear.push('weapon');
    }
  }

  return { displaced, clear };
}
