import { loadItemBases } from '../../data/loaders/loot';
import { isOneHandedWeapon } from '../inventory/equipValidator';
import type { Handedness, Item, WeaponType } from '../types/items';

/** Resolve eligibility from the canonical weapon slot; missing/unknown bases are explicitly unarmed. */
export function resolveEquippedWeapon(
  equipped: Readonly<Record<string, Item | null>>
): { weaponType?: WeaponType; handedness?: Handedness } {
  const weapon = equipped.weapon;
  const base = weapon ? loadItemBases().get(weapon.baseId) : undefined;
  if (!base) return {};
  return {
    ...(base.weaponType !== undefined ? { weaponType: base.weaponType } : {}),
    ...(base.handedness !== undefined ? { handedness: base.handedness } : {})
  };
}

/** Two distinct canonical one-handed weapon instances; shields/unknown/2H bases are excluded. */
export function isDualWielding(equipped: Readonly<Record<string, Item | null>>): boolean {
  const main = equipped.weapon, offhand = equipped.offhand;
  const bases = loadItemBases();
  return !!main && !!offhand && main.id !== offhand.id &&
    isOneHandedWeapon(bases.get(main.baseId)) && isOneHandedWeapon(bases.get(offhand.baseId));
}
