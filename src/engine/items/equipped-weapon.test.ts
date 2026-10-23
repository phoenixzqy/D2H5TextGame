import { describe, expect, it } from 'vitest';
import { resolveEquippedWeapon } from './equipped-weapon';
import type { Item } from '../types/items';

function weapon(baseId: string): Item {
  return { id: 'weapon', baseId, rarity: 'normal', level: 1, identified: true, equipped: false };
}

describe('canonical equipped weapon metadata', () => {
  it('resolves real staff and sword metadata independently of item flags', () => {
    const staff = weapon('items/base/weapon-staff');
    const before = structuredClone(staff);
    expect(resolveEquippedWeapon({ weapon: staff })).toEqual({ weaponType: 'staff', handedness: 'twoHanded' });
    expect(resolveEquippedWeapon({ weapon: weapon('items/base/wp1h-short-sword') }))
      .toEqual({ weaponType: 'sword', handedness: 'oneHanded' });
    expect(staff).toEqual(before);
  });
  it('returns an explicit unarmed snapshot for missing, unknown or nonweapon slots', () => {
    expect(resolveEquippedWeapon({})).toEqual({});
    expect(resolveEquippedWeapon({ weapon: null })).toEqual({});
    expect(resolveEquippedWeapon({ weapon: weapon('unknown') })).toEqual({});
    expect(resolveEquippedWeapon({ offhand: weapon('items/base/wp1h-short-sword') })).toEqual({});
    expect(resolveEquippedWeapon({ weapon: weapon('items/base/sh-buckler') })).toEqual({});
  });
});
