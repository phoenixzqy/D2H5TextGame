import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import catalog from '@/data/items/materials.json';
import economy from '@/data/loot/material-economy.json';
import { validateMaterialDefinitions } from '@/data/loaders/materials';
import type { MonsterTier } from '../combat/types';
import { createRng } from '../rng';
import { rollCurrencyDrops } from './orbs-and-currency';

it('matches versioned default rewards and following RNG across every tier/act/difficulty', () => {
  const rows: unknown[] = [];
  const tiers: MonsterTier[] = ['trash','elite','rare-minion','champion','rare-elite','boss','chapter-boss'];
  for (const tier of tiers) for (const act of [1,2,3,4,5] as const)
    for (const difficulty of ['normal','nightmare','hell'] as const) for (let seed=0;seed<16;seed++) {
      const rng=createRng(seed), level=[1,25,70][seed%3], find=[0,50,300][seed%3];
      if (level === undefined || find === undefined) throw new Error('Missing fixture');
      rows.push([tier,act,difficulty,seed,level,find,rollCurrencyDrops(level,tier,act,difficulty,find,rng),rng.next()]);
    }
  // Derived before tuning by replacing only ordinary-boss wishstones in the retained matrix.
  expect(rows).toHaveLength(1680);
  expect(createHash('sha256').update(JSON.stringify(rows)).digest('hex'))
    .toBe('e292f053f264d70205d7ec5d2f52f767eecc0b4ef1ee71fdf763b73c7aa0053c');
});

it('loads required currency settings through the production Ajv boundary', () => {
  expect(validateMaterialDefinitions(catalog, economy).economy).toHaveProperty('currencyRewards');
});

it.each([
  ['base', ['currencyRewards','runeShards','basePerLevel'], -1],
  ['tier', ['currencyRewards','runeShards','tierMultipliers','boss'], undefined],
  ['variance', ['currencyRewards','runeShards','varianceSpan'], NaN],
  ['chance', ['currencyRewards','wishstones','championChance'], 1.01],
  ['missing first clear', ['currencyRewards','wishstones','firstClearAmount'], undefined],
  ['negative first clear', ['currencyRewards','wishstones','firstClearAmount'], -1],
  ['fractional first clear', ['currencyRewards','wishstones','firstClearAmount'], 0.5],
  ['unsafe first clear', ['currencyRewards','wishstones','firstClearAmount'], Number.MAX_SAFE_INTEGER + 1],
  ['act length', ['currencyRewards','wishstones','byTierAndAct','boss'], [1,2,3,4]],
  ['fractional quantity', ['currencyRewards','wishstones','byTierAndAct','boss'], [1,2,3,4,.5]],
  ['difficulty', ['currencyRewards','wishstones','bossDifficultyMultipliers','hell'], undefined],
  ['typo', ['currencyRewards','wishstones','championChnce'], .5]
] as const)('rejects invalid authored %s', (_name, keys, value) => {
  const changed: Record<string, unknown> = structuredClone(economy);
  let node = changed;
  for (const key of keys.slice(0,-1)) node = node[key] as Record<string, unknown>;
  const key = keys.at(-1); if (key === undefined) throw new Error('Missing fixture key');
  node[key] = value;
  expect(() => validateMaterialDefinitions(catalog, changed)).toThrow('Invalid material definitions');
});
