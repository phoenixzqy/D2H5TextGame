import { describe, expect, it } from 'vitest';
import type { Item, ItemBase } from '@/engine/types/items';
import { countBulkDiscardCandidates, isProtected, selectByRarity, selectBelowEquippedTier } from './bulkDiscard';

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

describe('countBulkDiscardCandidates', () => {
  it('counts overlapping rarity and tier actions while preserving unique and set gear', () => {
    const backpack = [
      mkItem({ id: 'normal', ilvl: 1 }),
      mkItem({ id: 'magic', rarity: 'magic', ilvl: 5 }),
      mkItem({ id: 'rare', rarity: 'rare', ilvl: 30 }),
      mkItem({ id: 'runeword', rarity: 'runeword', ilvl: 8 }),
      mkItem({ id: 'unique', rarity: 'unique', ilvl: 1 }),
      mkItem({ id: 'set', rarity: 'set', ilvl: 1 })
    ];
    const equipped = { head: mkItem({ id: 'equipped', ilvl: 20 }) };
    const original = structuredClone({ backpack, equipped });
    expect(countBulkDiscardCandidates(backpack, equipped, BASES))
      .toEqual({ normal: 1, magic: 1, rare: 1, belowTier: 2 });
    expect({ backpack, equipped }).toEqual(original);
  });

  it.each([
    { left: 30, right: null, expected: 0 },
    { left: null, right: 30, expected: 0 },
    { left: 30, right: 20, expected: 1 }
  ])('requires both ring slots above the candidate: %j', ({ left, right, expected }) => {
    const backpack = [
      mkItem({ id: 'lower', baseId: RING_BASE.id, ilvl: 19 }),
      mkItem({ id: 'equal', baseId: RING_BASE.id, ilvl: 20 })
    ];
    const equipped = {
      'ring-left': left === null ? null : mkItem({ id: 'left', ilvl: left }),
      'ring-right': right === null ? null : mkItem({ id: 'right', ilvl: right })
    };
    expect(countBulkDiscardCandidates(backpack, equipped, BASES))
      .toEqual({ normal: 2, magic: 0, rare: 0, belowTier: expected });
  });

  it('uses explicit ilvl ahead of level and skips missing or slotless bases', () => {
    const backpack = [
      mkItem({ id: 'fallback', level: 10 }),
      mkItem({ id: 'explicit', level: 1, ilvl: 30 }),
      mkItem({ id: 'orphan', baseId: 'items/base/missing' }),
      mkItem({ id: 'charm', baseId: CHARM_BASE.id, rarity: 'magic' })
    ];
    expect(countBulkDiscardCandidates(backpack, { head: mkItem({ id: 'head', level: 25 }) }, BASES))
      .toEqual({ normal: 3, magic: 1, rare: 0, belowTier: 1 });
    expect(countBulkDiscardCandidates(backpack, {}, BASES))
      .toEqual({ normal: 3, magic: 1, rare: 0, belowTier: 0 });
    expect(countBulkDiscardCandidates([], {}, BASES))
      .toEqual({ normal: 0, magic: 0, rare: 0, belowTier: 0 });
  });
});

describe('isProtected', () => {
  it('protects unique and set items', () => {
    expect(isProtected(mkItem({ id: 'u', rarity: 'unique' }))).toBe(true);
    expect(isProtected(mkItem({ id: 's', rarity: 'set' }))).toBe(true);
  });

  it('protects runewords and inserted rune or gem investments regardless of rarity', () => {
    expect(isProtected(mkItem({ id: 'word', rarity: 'runeword' }))).toBe(true);
    expect(isProtected(mkItem({ id: 'legacy-word', runewordId: 'runewords/stealth' }))).toBe(true);
    for (const rarity of ['normal', 'magic', 'rare'] as const) {
      for (const content of [{ kind: 'rune', id: 'runes/el' }, { kind: 'gem', id: 'gems/ruby/chipped' }] as const) {
        expect(isProtected(mkItem({ id: rarity, rarity, socketContents: [content] }))).toBe(true);
      }
    }
  });

  it('does not protect ordinary gear or empty socket capacity', () => {
    for (const r of ['normal', 'magic', 'rare'] as const) {
      expect(isProtected(mkItem({ id: r, rarity: r }))).toBe(false);
      expect(isProtected(mkItem({ id: r, rarity: r, socketCapacity: 2, socketContents: [] }))).toBe(false);
    }
  });
});

it('keeps socket investments out of rarity selection, below-tier selection and every count', () => {
  const backpack = [
    mkItem({ id: 'empty', socketCapacity: 2, socketContents: [] }),
    mkItem({ id: 'rune', socketContents: [{ kind: 'rune', id: 'runes/el' }] }),
    mkItem({ id: 'gem', rarity: 'magic', socketContents: [{ kind: 'gem', id: 'gems/ruby/chipped' }] }),
    mkItem({ id: 'rare-gem', rarity: 'rare', socketContents: [{ kind: 'gem', id: 'gems/ruby/chipped' }] }),
    mkItem({ id: 'word', rarity: 'runeword' }),
    mkItem({ id: 'legacy-word', runewordId: 'runewords/stealth' })
  ];
  const before = structuredClone(backpack);
  const equipped = { head: mkItem({ id: 'equipped', ilvl: 20 }) };
  expect(selectByRarity(backpack, ['normal', 'magic', 'rare', 'runeword']).map(i => i.id)).toEqual(['empty']);
  expect(selectBelowEquippedTier(backpack, equipped, BASES).map(i => i.id)).toEqual(['empty']);
  expect(countBulkDiscardCandidates(backpack, equipped, BASES)).toEqual({ normal: 1, magic: 0, rare: 0, belowTier: 1 });
  expect(backpack).toEqual(before);
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
