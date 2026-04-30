/**
 * Tests for {@link planEquipMutex}, {@link isTwoHanded}, and
 * {@link validateOffhandEquip}.
 */

import { describe, it, expect } from 'vitest';
import {
  isTwoHanded,
  validateOffhandEquip,
  planEquipMutex
} from './equipValidator';
import type { Item, ItemBase } from '../types/items';

function makeBase(overrides: Partial<ItemBase> & Pick<ItemBase, 'id'>): ItemBase {
  return {
    name: 'fixture',
    type: 'weapon',
    slot: 'weapon',
    reqLevel: 1,
    canHaveAffixes: false,
    ...overrides
  } as ItemBase;
}

function makeItem(baseId: string, overrides: Partial<Item> = {}): Item {
  return {
    id: `inst-${baseId}`,
    baseId,
    rarity: 'normal',
    level: 1,
    identified: true,
    equipped: true,
    ...overrides
  } as Item;
}

const sword1H = makeBase({
  id: 'items/base/wp1h-short-sword',
  weaponType: 'sword',
  handedness: 'oneHanded'
});
const sword2H = makeBase({
  id: 'items/base/wp2h-two-handed-sword',
  weaponType: 'sword',
  handedness: 'twoHanded'
});
const shield = makeBase({
  id: 'items/base/sh-buckler',
  type: 'armor',
  slot: 'offhand'
});

describe('isTwoHanded', () => {
  it('returns true for weapons with handedness: twoHanded', () => {
    expect(isTwoHanded(sword2H)).toBe(true);
  });

  it('returns false for weapons with handedness: oneHanded', () => {
    expect(isTwoHanded(sword1H)).toBe(false);
  });

  it('returns false for non-weapons', () => {
    expect(isTwoHanded(shield)).toBe(false);
    expect(isTwoHanded(undefined)).toBe(false);
  });

  it('falls back to legacy id heuristic when handedness is missing', () => {
    const legacy2h = makeBase({ id: 'items/base/wp2h-mystery' });
    expect(isTwoHanded(legacy2h)).toBe(true);
    const legacyBow = makeBase({ id: 'items/base/weapon-bow' });
    expect(isTwoHanded(legacyBow)).toBe(true);
    const legacy1h = makeBase({ id: 'items/base/wp1h-mystery' });
    expect(isTwoHanded(legacy1h)).toBe(false);
  });
});

describe('validateOffhandEquip', () => {
  it('accepts shields (armor with offhand slot)', () => {
    expect(validateOffhandEquip(shield)).toEqual({ ok: true });
  });

  it('rejects weapon-typed bases — dual-wield deferred', () => {
    expect(validateOffhandEquip(sword1H)).toEqual({
      ok: false,
      reason: 'offhand-weapon-not-supported'
    });
    expect(validateOffhandEquip(sword2H)).toEqual({
      ok: false,
      reason: 'offhand-weapon-not-supported'
    });
  });
});

describe('planEquipMutex (2H ↔ offhand)', () => {
  const bases = new Map<string, ItemBase>([
    [sword1H.id, sword1H],
    [sword2H.id, sword2H],
    [shield.id, shield]
  ]);

  it('equipping a 2H weapon clears the offhand', () => {
    const offhandItem = makeItem(shield.id);
    const plan = planEquipMutex(
      'weapon',
      sword2H,
      { weapon: null, offhand: offhandItem },
      bases
    );
    expect(plan.clear).toEqual(['offhand']);
    expect(plan.displaced).toEqual([offhandItem]);
  });

  it('equipping an offhand item clears a 2H weapon currently in the weapon slot', () => {
    const heldGreatsword = makeItem(sword2H.id);
    const plan = planEquipMutex(
      'offhand',
      shield,
      { weapon: heldGreatsword, offhand: null },
      bases
    );
    expect(plan.clear).toEqual(['weapon']);
    expect(plan.displaced).toEqual([heldGreatsword]);
  });

  it('equipping a shield with a 1H weapon held — no displacement', () => {
    const heldShortSword = makeItem(sword1H.id);
    const plan = planEquipMutex(
      'offhand',
      shield,
      { weapon: heldShortSword, offhand: null },
      bases
    );
    expect(plan.clear).toEqual([]);
    expect(plan.displaced).toEqual([]);
  });

  it('equipping a 1H weapon with a shield held — no displacement', () => {
    const heldShield = makeItem(shield.id);
    const plan = planEquipMutex(
      'weapon',
      sword1H,
      { weapon: null, offhand: heldShield },
      bases
    );
    expect(plan.clear).toEqual([]);
    expect(plan.displaced).toEqual([]);
  });

  it('equipping a 2H weapon with empty offhand — nothing displaced', () => {
    const plan = planEquipMutex(
      'weapon',
      sword2H,
      { weapon: null, offhand: null },
      bases
    );
    expect(plan.clear).toEqual([]);
    expect(plan.displaced).toEqual([]);
  });
});
