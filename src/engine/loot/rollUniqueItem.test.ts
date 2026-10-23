import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRng, type Rng } from '../rng';
import type { ItemBase, UniqueItemDef } from '../types/items';
import { __resetRollItemSeqForTests, rollItem, rollUniqueItem, type ItemRollPools } from './rollItem';

const sword: ItemBase = {
  id: 'items/base/test-sword', name: 'Test sword', type: 'weapon', slot: 'weapon',
  reqLevel: 40, canHaveAffixes: true, maxSockets: 0,
  baseDamage: { min: 4, max: 8, breakdown: { physical: 8 } }
};
const named: UniqueItemDef = {
  id: 'items/unique/requested', name: 'test.requested', baseId: sword.id,
  reqLevel: 8, qlvl: 4, weight: 1,
  stats: { statMods: {
    life: { roll: 'shared', min: 10, max: 20, step: 2 },
    mana: { roll: 'shared', min: 10, max: 20, step: 2 }, attack: 3
  } }
};
const competitor: UniqueItemDef = { ...named, id: 'items/unique/other', weight: 999 };
const pools: ItemRollPools = {
  bases: new Map([[sword.id, sword]]), affixes: [], uniques: [competitor, named]
};

function traceRng() {
  const unexpected = vi.fn((): never => { throw new Error('Unexpected selection RNG'); });
  const nextInt = vi.fn((min: number, _max: number) => min);
  const rng: Rng = {
    next: unexpected, nextInt, pick: unexpected, chance: unexpected, fork: unexpected
  };
  return { rng, nextInt, unexpected };
}

describe('rollUniqueItem exact named construction', () => {
  beforeEach(() => { __resetRollItemSeqForTests(); });

  it('exposes the new named materialization capability', () => {
    expect(typeof rollUniqueItem).toBe('function');
  });

  it.each([false, true])('chooses the exact ID despite competing weights and reverse=%s', (reverse) => {
    const uniques = reverse ? [named, competitor] : [competitor, named];
    const item = rollUniqueItem({ uniqueId: named.id, ilvl: 4 }, { ...pools, uniques }, createRng(19));
    expect(item).toMatchObject({ uniqueId: named.id, baseId: sword.id, rarity: 'unique' });
  });

  it('uses shared ranged stats then ID then base damage with no selection draw', () => {
    const { rng, nextInt, unexpected } = traceRng();
    const item = rollUniqueItem({ uniqueId: named.id, ilvl: 4 }, pools, rng);
    expect(item).toEqual({
      id: 'it-0-1', baseId: sword.id, uniqueId: named.id, rarity: 'unique', socketCapacity: 0,
      ilvl: 4, level: 8, baseRolls: { attack: 4 }, statRolls: { shared: 10 },
      affixes: [], generatedName: {}, identified: true, equipped: false
    });
    expect(nextInt.mock.calls).toEqual([[5, 10], [0, 0xffffff], [4, 8]]);
    expect(unexpected).not.toHaveBeenCalled();
  });

  it('preserves ordinary unique-to-rare fallback when no template is eligible', () => {
    const item = rollItem({ baseId: sword.id, rarity: 'unique', ilvl: 1 }, pools, createRng(3));
    expect(item).toMatchObject({ baseId: sword.id, rarity: 'rare', ilvl: 1 });
    expect(item?.uniqueId).toBeUndefined();
  });

  const refusals: readonly {
    label: string; uniqueId?: string; ilvl?: number; pools?: ItemRollPools;
  }[] = [
    ...[0, -1, 1.5, NaN, Infinity, -Infinity].map((ilvl) => ({ label: `ilvl ${String(ilvl)}`, ilvl })),
    { label: 'missing catalog', pools: { bases: pools.bases, affixes: [] } },
    { label: 'empty catalog', pools: { ...pools, uniques: [] } },
    ...['items/unique/missing', '', 'requested', 'items/unique/Requested', ' items/unique/requested']
      .map((uniqueId) => ({ label: `exact ID ${uniqueId}`, uniqueId })),
    { label: 'below qlvl', ilvl: 3 },
    { label: 'below reqLevel fallback', ilvl: 7, pools: {
      ...pools, uniques: [{ id: named.id, name: named.name, baseId: sword.id, reqLevel: 8 }]
    } },
    { label: 'duplicate matching IDs including one ineligible', pools: {
      ...pools, uniques: [named, { ...named, qlvl: 99 }]
    } },
    { label: 'missing template base', pools: { ...pools, bases: new Map() } },
    { label: 'base map key disagrees with base identity', pools: {
      ...pools, bases: new Map([[sword.id, { ...sword, id: 'items/base/wrong' }]])
    } }
  ];

  it.each(refusals)('refuses $label without RNG or allocator consumption', (entry) => {
    const control = rollItem({ baseId: sword.id, rarity: 'normal', ilvl: 4 }, pools, createRng(55));
    expect(control).toBeDefined();
    __resetRollItemSeqForTests();
    const { rng, nextInt, unexpected } = traceRng();
    const result = rollUniqueItem(
      { uniqueId: entry.uniqueId ?? named.id, ilvl: entry.ilvl ?? 4 }, entry.pools ?? pools, rng
    );
    expect(result).toBeUndefined();
    expect(nextInt).not.toHaveBeenCalled();
    expect(unexpected).not.toHaveBeenCalled();
    // Deliberately no reset between the refused request and confirmation.
    expect(rollItem({ baseId: sword.id, rarity: 'normal', ilvl: 4 }, pools, createRng(55))).toEqual(control);
  });

  it.each([4, 8, 1000])('retains qlvl precedence over template/base requirements at ilvl %s', (ilvl) => {
    expect(rollUniqueItem({ uniqueId: named.id, ilvl }, pools, createRng(7))).toMatchObject({
      uniqueId: named.id, ilvl, level: Math.max(ilvl, 8)
    });
  });

  it('uses reqLevel when qlvl is absent, including the exact boundary', () => {
    const template: UniqueItemDef = { id: named.id, name: named.name, baseId: sword.id, reqLevel: 8 };
    expect(rollUniqueItem({ uniqueId: named.id, ilvl: 8 }, { ...pools, uniques: [template] }, createRng(1)))
      .toMatchObject({ uniqueId: named.id, ilvl: 8, level: 8, statRolls: {} });
  });

  it('ignores zero selection weight for an exact request (typed engine edge only)', () => {
    // Authored JSON requires positive weights; this does not relax that schema.
    const uniques = [competitor, { ...named, weight: 0 }];
    expect(rollUniqueItem({ uniqueId: named.id, ilvl: 4 }, { ...pools, uniques }, createRng(3)))
      .toMatchObject({ uniqueId: named.id, rarity: 'unique' });
  });

  it('reproduces a full item with the same seed and allocator state', () => {
    const first = rollUniqueItem({ uniqueId: named.id, ilvl: 10 }, pools, createRng(713));
    __resetRollItemSeqForTests();
    const second = rollUniqueItem({ uniqueId: named.id, ilvl: 10 }, pools, createRng(713));
    expect(first).toBeDefined();
    expect(second).toEqual(first);
  });

  it('allocates fresh items with distinct IDs while preserving input and catalog bytes', () => {
    const input = Object.freeze({ uniqueId: named.id, ilvl: 10 });
    const before = JSON.stringify({ input, bases: [...pools.bases], uniques: pools.uniques, affixes: pools.affixes });
    const first = rollUniqueItem(input, pools, createRng(713));
    const second = rollUniqueItem(input, pools, createRng(713));
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(second?.id).not.toBe(first?.id);
    expect(second).toEqual({ ...first, id: second?.id });
    expect(second).not.toBe(first);
    expect(second?.statRolls).not.toBe(first?.statRolls);
    expect(second?.baseRolls).not.toBe(first?.baseRolls);
    expect(second?.affixes).not.toBe(first?.affixes);
    expect(second?.generatedName).not.toBe(first?.generatedName);
    expect(JSON.stringify({ input, bases: [...pools.bases], uniques: pools.uniques, affixes: pools.affixes })).toBe(before);
  });

  it('propagates malformed stat range constructor errors', () => {
    // Typed malformed fixture proves exceptions are visible, not a new validation contract.
    const malformed: UniqueItemDef = { ...named, stats: { statMods: {
      life: { roll: 'bad', min: 20, max: 10 }
    } } };
    expect(() => rollUniqueItem({ uniqueId: named.id, ilvl: 4 }, { ...pools, uniques: [malformed] }, createRng(3)))
      .toThrow('Invalid range: min (20) > max (10)');
  });

  it('propagates RNG exceptions and preserves consumed allocation gaps', () => {
    const failure = new Error('owned RNG failure');
    let calls = 0;
    const rng: Rng = { ...createRng(1), nextInt: (min: number) => {
      calls += 1;
      if (calls === 3) throw failure;
      return min;
    } };
    expect(() => rollUniqueItem({ uniqueId: named.id, ilvl: 4 }, pools, rng)).toThrow(failure);
    expect(calls).toBe(3);
    const next = rollItem({ baseId: sword.id, rarity: 'normal', ilvl: 4 }, pools, createRng(1));
    expect(next?.id).toMatch(/-2$/);
  });
});
