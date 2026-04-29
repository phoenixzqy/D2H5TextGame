import { describe, expect, it } from 'vitest';
import type { Item, ItemBase } from '@/engine/types/items';
import { isProtected, selectByRarity, selectBelowEquippedTier } from './bulkDiscard';

function mkItem(overrides: Partial<Item> & Pick<Item, 'id'>): Item {
  const { id, baseId, rarity, level, ilvl, ...rest } = overrides;
  const base: Item = {
    id,
    baseId: baseId ?? 'items/base/helm-cap',
    rarity: rarity ?? 'normal',
    level: level ?? 1,
    identified: true,
    equipped: false,
    ...rest
  };
  return ilvl === undefined ? base : { ...base, ilvl };
}

const HELM_BASE: ItemBase = {
  id: 'items/base/helm-cap',
  name: 'Cap',
  type: 'armor',
  slot: 'head',
  reqLevel: 1,
  canHaveAffixes: true
};
const RING_BASE: ItemBase = {
  id: 'items/base/ring',
  name: 'Ring',
  type: 'jewelry',
  slot: 'ring-left',
  reqLevel: 1,
  canHaveAffixes: true
};
const CHARM_BASE: ItemBase = {
  id: 'items/base/charm-small',
  name: 'Small Charm',
  type: 'charm',
  slot: null,
  reqLevel: 1,
  canHaveAffixes: false
};
const BASES = new Map<string, ItemBase>([
  [HELM_BASE.id, HELM_BASE],
  [RING_BASE.id, RING_BASE],
  [CHARM_BASE.id, CHARM_BASE]
]);

describe('isProtected', () => {
  it('protects unique and set items', () => {
    expect(isProtected(mkItem({ id: 'u', rarity: 'unique' }))).toBe(true);
    expect(isProtected(mkItem({ id: 's', rarity: 'set' }))).toBe(true);
  });

  it('does not protect normal/magic/rare/runeword', () => {
    for (const r of ['normal', 'magic', 'rare', 'runeword'] as const) {
      expect(isProtected(mkItem({ id: r, rarity: r }))).toBe(false);
    }
  });
});

describe('selectByRarity', () => {
  const items = [
    mkItem({ id: 'n1', rarity: 'normal' }),
    mkItem({ id: 'n2', rarity: 'normal' }),
    mkItem({ id: 'm1', rarity: 'magic' }),
    mkItem({ id: 'r1', rarity: 'rare' }),
    mkItem({ id: 'u1', rarity: 'unique' }),
    mkItem({ id: 's1', rarity: 'set' })
  ];

  it('returns only items matching the requested rarities', () => {
    expect(selectByRarity(items, ['magic']).map((i) => i.id)).toEqual(['m1']);
    expect(selectByRarity(items, ['normal']).map((i) => i.id)).toEqual(['n1', 'n2']);
    expect(selectByRarity(items, ['rare']).map((i) => i.id)).toEqual(['r1']);
  });

  it('always excludes unique and set even when explicitly requested', () => {
    const out = selectByRarity(items, ['unique', 'set', 'magic']);
    expect(out.map((i) => i.id)).toEqual(['m1']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(selectByRarity(items, ['runeword'])).toEqual([]);
  });
});

describe('selectBelowEquippedTier', () => {
  it('selects gear with ilvl strictly less than the equipped item in the same slot', () => {
    const equipped = { head: mkItem({ id: 'eq-helm', baseId: HELM_BASE.id, ilvl: 20 }) };
    const backpack = [
      mkItem({ id: 'low', baseId: HELM_BASE.id, ilvl: 5 }),
      mkItem({ id: 'same', baseId: HELM_BASE.id, ilvl: 20 }),
      mkItem({ id: 'higher', baseId: HELM_BASE.id, ilvl: 30 })
    ];
    expect(
      selectBelowEquippedTier(backpack, equipped, BASES).map((i) => i.id)
    ).toEqual(['low']);
  });

  it('skips slots with no equipped item (player may still want to wear them)', () => {
    const backpack = [mkItem({ id: 'low', baseId: HELM_BASE.id, ilvl: 5 })];
    expect(selectBelowEquippedTier(backpack, {}, BASES)).toEqual([]);
  });

  it('always excludes unique and set even when below equipped tier', () => {
    const equipped = { head: mkItem({ id: 'eq', baseId: HELM_BASE.id, ilvl: 30 }) };
    const backpack = [
      mkItem({ id: 'u', baseId: HELM_BASE.id, ilvl: 5, rarity: 'unique' }),
      mkItem({ id: 's', baseId: HELM_BASE.id, ilvl: 5, rarity: 'set' }),
      mkItem({ id: 'n', baseId: HELM_BASE.id, ilvl: 5, rarity: 'normal' })
    ];
    expect(
      selectBelowEquippedTier(backpack, equipped, BASES).map((i) => i.id)
    ).toEqual(['n']);
  });

  it('falls back to item.level when ilvl is undefined', () => {
    const equipped = { head: mkItem({ id: 'eq', baseId: HELM_BASE.id, level: 25 }) };
    const backpack = [mkItem({ id: 'low', baseId: HELM_BASE.id, level: 10 })];
    expect(
      selectBelowEquippedTier(backpack, equipped, BASES).map((i) => i.id)
    ).toEqual(['low']);
  });

  it('skips items whose base has no slot (charms, gems, runes)', () => {
    const backpack = [mkItem({ id: 'c', baseId: CHARM_BASE.id, ilvl: 1 })];
    expect(selectBelowEquippedTier(backpack, {}, BASES)).toEqual([]);
  });

  it('rings: only marks below-tier when BOTH ring slots are filled with higher-ilvl rings', () => {
    const lowRing = mkItem({ id: 'low', baseId: RING_BASE.id, ilvl: 5 });
    const oneOnly = {
      'ring-left': mkItem({ id: 'eqL', baseId: RING_BASE.id, ilvl: 30 })
    };
    expect(selectBelowEquippedTier([lowRing], oneOnly, BASES)).toEqual([]);

    const both = {
      'ring-left': mkItem({ id: 'eqL', baseId: RING_BASE.id, ilvl: 30 }),
      'ring-right': mkItem({ id: 'eqR', baseId: RING_BASE.id, ilvl: 25 })
    };
    expect(
      selectBelowEquippedTier([lowRing], both, BASES).map((i) => i.id)
    ).toEqual(['low']);
  });

  it('skips items whose base is missing from the catalog (corrupt save)', () => {
    const backpack = [mkItem({ id: 'orphan', baseId: 'items/base/not-real', ilvl: 1 })];
    expect(selectBelowEquippedTier(backpack, {}, BASES)).toEqual([]);
  });
});
