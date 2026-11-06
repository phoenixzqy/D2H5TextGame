import { expect, it, vi } from 'vitest';
import { createRng, type Rng } from '../rng';
import { rollCurrencyDrops, rollRuneShards } from './orbs-and-currency';

vi.mock('@/data/loaders/materials', async importOriginal => {
  const original = await importOriginal<typeof import('@/data/loaders/materials')>();
  return { ...original, materialEconomy: { ...original.materialEconomy, currencyRewards: {
    runeShards: { basePerLevel: 7, varianceMin: 1, varianceSpan: 0,
      tierMultipliers: { trash: 2, elite: 2, 'rare-minion': 2, champion: 2, 'rare-elite': 2, boss: 5, 'chapter-boss': 5 } },
    wishstones: { firstClearAmount: 5, killChance: 1, championChance: .75, bossDifficultyMultipliers: { normal: 1, nightmare: 2, hell: 3 },
      byTierAndAct: { trash: [0,0,0,0,0], elite: [2,3,4,5,6], 'rare-minion': [2,3,4,5,6],
        champion: [3,3,3,3,3], 'rare-elite': [4,5,6,7,8], boss: [10,11,12,13,14], 'chapter-boss': [20,21,22,23,24] } }
  } } };
});

function scripted(values: number[]) {
  const rng = createRng(1); let count = 0;
  const next = () => { const value = values[count++]; if (value === undefined) throw new Error('Unexpected RNG draw'); return value; };
  const source: Rng = { ...rng, next, chance: probability => next() < probability };
  return { rng: source, count: () => count };
}

it('uses authored shard base, tier and variance while retaining currency-find scaling and one draw', () => {
  const source = scripted([.1]);
  expect(rollRuneShards(10, 'boss', 50, source.rng)).toBe(525);
  expect(source.count()).toBe(1);
});

it('uses authored champion probability and act quantity with the original four-draw order', () => {
  const source = scripted([.6,.99,.99,.1]);
  expect(rollCurrencyDrops(10, 'champion', 1, 'normal', 0, source.rng))
    .toMatchObject({ wishstones: 3, runeShards: 140, runes: 0, gems: 0 });
  expect(source.count()).toBe(4);
});

it.each([['boss',42], ['chapter-boss',72], ['elite',6]] as const)(
  'uses authored act amounts and boss-only difficulty scaling for %s', (tier, expected) => {
    const source = scripted([.99,.99,.1]);
    expect(rollCurrencyDrops(10, tier, 5, 'hell', 0, source.rng).wishstones).toBe(expected);
    expect(source.count()).toBe(3);
  });
