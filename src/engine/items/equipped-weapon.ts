import { loadItemBases } from '../../data/loaders/loot';
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
