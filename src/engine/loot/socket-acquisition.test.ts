import { beforeEach, describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import type { Item, ItemBase, Rarity, SetPieceDef, UniqueItemDef } from '../types/items';
import { __resetRollItemSeqForTests, rollItem, rollUniqueItem, seedItemSeqFromIds } from './rollItem';

const base: ItemBase = {
  id: 'items/base/test-socket-sword', name: 'Test sword', type: 'weapon', slot: 'weapon',
  baseDamage: { min: 4, max: 8, breakdown: { physical: 8 } },
  reqLevel: 1, canHaveAffixes: true, sockets: 4, maxSockets: 4
};
const unique: UniqueItemDef = { id: 'items/unique/test-socket-sword', name: 'Test unique', baseId: base.id, reqLevel: 1 };
const piece: SetPieceDef = { id: 'sets/test/sword', setId: 'sets/test', name: 'Test set', baseId: base.id, reqLevel: 1 };
const pools = { bases: new Map([[base.id, base]]), affixes: [], uniques: [unique], setPieces: [piece] };

function rolled(rarity: Rarity, seed: number): Item {
  const item = rollItem({ baseId: base.id, rarity, ilvl: 82 }, pools, createRng(seed));
  if (!item) throw new Error('Expected materialized gear');
  return item;
}

describe('native item socket acquisition', () => {
  beforeEach(__resetRollItemSeqForTests);

  it('makes positive-maximum normal bases reachable both unsocketed and at every legal capacity', () => {
    const capacities = new Set(Array.from({ length: 128 }, (_, seed) => rolled('normal', seed).socketCapacity));
    expect([...capacities].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it.each(['magic', 'rare'] as const)('caps new %s gear at two sockets and preserves zero as a service candidate', rarity => {
    const capacities = new Set(Array.from({ length: 128 }, (_, seed) => rolled(rarity, seed).socketCapacity));
    expect([...capacities].sort()).toEqual([0, 1, 2]);
  });

  it.each(['unique', 'set'] as const)('retains the fixed authored capacity on %s templates', rarity => {
    for (let seed = 0; seed < 16; seed++) expect(rolled(rarity, seed).socketCapacity).toBe(4);
    expect(rollUniqueItem({ uniqueId: unique.id, ilvl: 82 }, pools, createRng(7))?.socketCapacity).toBe(4);
  });

  it('preserves parent loot RNG: the capacity roll consumes no additional draw', () => {
    const rng = createRng(123), expected = createRng(123);
    const item = rollItem({ baseId: base.id, rarity: 'normal', ilvl: 82 }, pools, rng);
    expect(item?.socketCapacity).toBeTypeOf('number');
    expected.next(); // Existing generated ID entropy.
    expected.next(); // Existing base attack roll.
    expect(rng.next()).toBe(expected.next());
  });

  it.each(['normal', 'magic', 'rare', 'unique', 'set'] as const)('keeps %s capacity and rolled properties stable across failed-claim allocator gaps', rarity => {
    const first = rolled(rarity, 91);
    seedItemSeqFromIds(['it-0-zzzz']);
    const retry = rolled(rarity, 91);
    expect(retry.id).not.toBe(first.id);
    expect(retry.socketCapacity).toBeTypeOf('number');
    expect({ ...retry, id: first.id }).toEqual(first);
  });

  it.each([undefined, -1, 7, 1.5, NaN])('refuses an unreviewed or invalid maximum before RNG or allocation: %s', maxSockets => {
    const rng = createRng(3), expected = createRng(3);
    const invalidBase = { ...base, maxSockets } as unknown as ItemBase;
    expect(rollItem({ baseId: base.id, rarity: 'normal', ilvl: 82 },
      { ...pools, bases: new Map([[base.id, invalidBase]]) }, rng)).toBeUndefined();
    expect(rng.next()).toBe(expected.next());
    expect(rolled('normal', 3).id.endsWith('-1')).toBe(true);
  });
});
