/** Constructed real-pool reward contracts; no earned campaign/balance credit. */
import { afterEach, describe, expect, it } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { materialEconomy, validateMaterialDefinitions } from '@/data/loaders/materials';
import catalog from '@/data/items/materials.json';
import economy from '@/data/loot/material-economy.json';
import { createRng, type Rng } from '../rng';
import { rollBatchRewards, rollKillRewards, rollQuestTableRewards } from './award';
import { __resetRollItemSeqForTests } from './rollItem';

const pools = loadAwardPools();
const input = { act: 1, tier: 'elite', monsterLevel: 20, treasureClassId: 'loot/treasure-goblin',
  magicFind: 0, goldFind: 0 } as const;
const last = 1 - Number.EPSILON / 2;
function units(values: readonly number[]) {
  let draws = 0;
  const next = () => {
    const unit = values[draws++];
    if (unit === undefined) throw new Error('Unexpected wishstone draw');
    return unit;
  };
  const rng: Rng = { next, nextInt: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: probability => next() < probability,
    pick: () => { throw new Error('Unexpected wishstone pick'); },
    fork: () => { throw new Error('Unexpected wishstone fork'); } };
  return { rng, draws: () => draws };
}
afterEach(__resetRollItemSeqForTests);

describe('goblin wishstones', () => {
  it.each([1, 2, 3, 4, 5] as const)('Act%i awards exactly 1–3 gated wishes in every difficulty', act => {
    for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
      for (const [unit, expected] of [[0, 1], [.5, 2], [last, 3]] as const) {
        const wishes = units([0, unit]);
        expect(rollKillRewards({ ...input, act, difficulty }, pools, createRng(7), wishes.rng).wishstones).toBe(expected);
        expect(wishes.draws()).toBe(2);
      }
    }
  });

  it('uses the exact 2.5% boundary and draws a quantity only on success', () => {
    expect(materialEconomy.currencyRewards.wishstones.killChance).toBe(.025);
    const hit = units([.025 - Number.EPSILON, last]), miss = units([.025]);
    expect(rollKillRewards(input, pools, createRng(7), hit.rng).wishstones).toBe(3);
    expect(rollKillRewards(input, pools, createRng(7), miss.rng).wishstones).toBe(0);
    expect(hit.draws()).toBe(2); expect(miss.draws()).toBe(1);
  });

  it('preserves equipment, materials and following loot RNG across wish hits, misses and quantities', () => {
    const run = (values: readonly number[]) => {
      __resetRollItemSeqForTests();
      const rng = createRng(7), wishes = units(values);
      const rewards = rollKillRewards(input, pools, rng, wishes.rng);
      return { rewards: { ...rewards, wishstones: 0 }, following: rng.next() };
    };
    expect(run([0, 0])).toEqual(run([1]));
    expect(run([0, last])).toEqual(run([1]));
  });

  it('advances one wishstone stream across batches, including no quantity draw for a miss', () => {
    const wishes = units([0, 0, .025, 0, last]), rng = createRng(7);
    expect(rollBatchRewards([input, input], pools, rng, wishes.rng).wishstones).toBe(1);
    expect(wishes.draws()).toBe(3);
    expect(rollBatchRewards([input], pools, rng, wishes.rng).wishstones).toBe(3);
    expect(wishes.draws()).toBe(5);
  });

  it('repeats seeded hit quantities, whole rewards and following states with shared or separate RNGs', () => {
    const run = (separate: boolean) => {
      __resetRollItemSeqForTests();
      const rng = createRng(7), wishes = separate ? createRng(7) : rng;
      const rewards = rollBatchRewards([input, input], pools, rng, wishes);
      return { rewards, lootNext: rng.next(), wishNext: wishes.next() };
    };
    expect(run(true).rewards.wishstones).toBe(1);
    expect(run(true)).toEqual(run(true));
    expect(run(false)).toEqual(run(false));
  });

  it('retains the raw goblin wishstone row for explicit caches without a kill gate', () => {
    const id = input.treasureClassId;
    const treasureClasses = new Map([[id, { id, numPicks: 1, noDropChance: 0, picks: [
      { type: 'currency' as const, itemId: 'currency/wishstone', weight: 1, quantityMin: 7,
        quantityMax: 7, qlvlMin: 1, qlvlMax: 99 }
    ] }]]);
    expect(rollQuestTableRewards({ tableId: id, ilvl: 20, picks: 2 }, { ...pools, treasureClasses }, createRng(7)))
      .toMatchObject({ items: [], wishstones: 14, runes: 0, gems: 0 });
  });

  it('refuses a missing configured goblin source before either RNG consumes entropy', () => {
    const loot = units([]), wishes = units([]);
    expect(() => rollKillRewards(input, { ...pools, treasureClasses: new Map() }, loot.rng, wishes.rng))
      .toThrow('Missing treasure-goblin equipment source');
    expect(loot.draws()).toBe(0); expect(wishes.draws()).toBe(0);
  });

  it('rejects missing, invalid, extra and reversed goblin wishstone policy fields', () => {
    const policy = { ...economy.treasureGoblin, wishstoneQuantityMin: 1, wishstoneQuantityMax: 3 };
    expect(() => validateMaterialDefinitions(catalog, { ...economy, treasureGoblin: policy })).not.toThrow();
    for (const field of ['wishstoneQuantityMin', 'wishstoneQuantityMax'] as const) {
      for (const value of [undefined, 0, 4, 1.5, Infinity, NaN, '1']) {
        expect(() => validateMaterialDefinitions(catalog, { ...economy,
          treasureGoblin: { ...policy, [field]: value } })).toThrow('Invalid material definitions');
      }
    }
    expect(() => validateMaterialDefinitions(catalog, { ...economy, treasureGoblin: { ...policy, wishstoneChance: 1 } }))
      .toThrow('Invalid material definitions');
    expect(() => validateMaterialDefinitions(catalog, { ...economy,
      treasureGoblin: { ...policy, wishstoneQuantityMin: 3, wishstoneQuantityMax: 1 } }))
      .toThrow('Inconsistent treasure-goblin wishstone range');
  });
});
