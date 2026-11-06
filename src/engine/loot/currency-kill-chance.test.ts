import { expect, it } from 'vitest';
import { createRng, type Rng } from '../rng';
import { rollBatchRewards, rollKillRewards, rollQuestTableRewards, type AwardDataPools } from './award';
import { materialEconomy, validateMaterialDefinitions } from '@/data/loaders/materials';
import catalog from '@/data/items/materials.json';
import economy from '@/data/loot/material-economy.json';

const pools: AwardDataPools = { bases: new Map(), affixes: [], treasureClasses: new Map([
  ['loot/currency-test', { id: 'loot/currency-test', numPicks: 1, noDropChance: 0,
    picks: [{ type: 'currency', itemId: 'currency/wishstone', weight: 1,
      quantityMin: 5, quantityMax: 5, qlvlMin: 1, qlvlMax: 99 }] }]
]) };
const input = { tier: 'boss' as const, monsterLevel: 10, treasureClassId: 'loot/currency-test',
  magicFind: 0, goldFind: 0, act: 1 as const };
function coin(unit: number): Rng {
  const rng = createRng(1);
  return { ...rng, chance: probability => unit < probability };
}

it('gates the combined direct and independent wishstones once, retaining other rewards and parent RNG', () => {
  const hitRng = createRng(3), missRng = createRng(3);
  const hit = rollKillRewards(input, pools, hitRng, coin(0));
  const miss = rollKillRewards(input, pools, missRng, coin(1));
  expect(hit.wishstones).toBe(11); // direct five plus ordinary boss six.
  expect(miss.wishstones).toBe(0);
  expect({ ...miss, wishstones: hit.wishstones }).toEqual(hit);
  expect(missRng.next()).toBe(hitRng.next());
});

it('applies the same coin to secondary-only rewards when no treasure table exists', () => {
  const missing = { ...input, treasureClassId: 'loot/missing' };
  expect(rollKillRewards(missing, pools, createRng(1), coin(0)).wishstones).toBe(6);
  expect(rollKillRewards(missing, pools, createRng(1), coin(1)).wishstones).toBe(0);
});

it('honors the authored probability boundary rather than a hardcoded percent', () => {
  const chance = materialEconomy.currencyRewards.wishstones.killChance;
  expect(chance).toBe(.025);
  expect(rollKillRewards(input, pools, createRng(1), coin(chance - .000001)).wishstones).toBe(11);
  expect(rollKillRewards(input, pools, createRng(1), coin(chance)).wishstones).toBe(0);
});

it('preserves guaranteed non-kill quest-table wishes', () => {
  expect(rollQuestTableRewards({ tableId: 'loot/currency-test', ilvl: 10, picks: 2 }, pools, createRng(3)))
    .toMatchObject({ wishstones: 10 });
});

it('advances one wishstone stream across successive batches without reusing the first kill coin', () => {
  const results = [true, false, true, true];
  let draws = 0;
  const wishstones: Rng = { ...createRng(1), chance: () => {
    const result = results[draws++];
    if (result === undefined) throw new Error('Unexpected extra wishstone coin');
    return result;
  } };
  const missing = { ...input, treasureClassId: 'loot/missing' };
  const loot = createRng(1);
  expect(rollBatchRewards([missing, missing], pools, loot, wishstones).wishstones).toBe(6);
  expect(draws).toBe(2);
  expect(rollBatchRewards([missing, missing], pools, loot, wishstones).wishstones).toBe(12);
  expect(draws).toBe(4);
});

it.each([-0.01, 1.01, NaN, undefined])('rejects invalid kill probability %s at the production data boundary', value => {
  const changed = structuredClone(economy);
  Object.assign(changed.currencyRewards.wishstones, { killChance: value });
  expect(() => validateMaterialDefinitions(catalog, changed)).toThrow('Invalid material definitions');
});
