import { describe, expect, it } from 'vitest';
import { isDualWielding, resolveEquippedWeapon } from './equipped-weapon';
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

it('requires two distinct real one-handed weapons for dual wielding', () => {
  const main = weapon('items/base/wp1h-katar');
  const offhand = { ...weapon('items/base/wp1h-short-sword'), id: 'offhand' };
  expect(isDualWielding({ weapon: main, offhand })).toBe(true);
  expect(resolveEquippedWeapon({ weapon: main, offhand })).toEqual({ weaponType: 'claw', handedness: 'oneHanded' });
  for (const baseId of ['unknown', 'items/base/sh-buckler', 'items/base/weapon-staff']) {
    expect(isDualWielding({ weapon: main, offhand: { ...offhand, baseId } })).toBe(false);
    expect(isDualWielding({ weapon: { ...main, baseId }, offhand })).toBe(false);
  }
  expect(isDualWielding({ weapon: main, offhand: { ...offhand, id: main.id } })).toBe(false);
  expect(isDualWielding({ weapon: main })).toBe(false);
  expect(isDualWielding({ offhand })).toBe(false);
});
