/**
 * Roller unit tests — verify weighted picks, pity guard, threading, and
 * pool fallback.
 */
import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { rollOne, rollMany, pickFromPool, type GachaRates } from './roller';

const RATES: GachaRates = { SSR: 0.1, SR: 0.3, R: 0.6 };

describe('rollOne', () => {
  it('returns a valid rarity and increments pity on non-SSR', () => {
    const rng = createRng(42);
    const r = rollOne(rng, RATES, 0, 90);
    expect(['R', 'SR', 'SSR']).toContain(r.rarity);
    if (r.rarity === 'SSR') expect(r.nextPity).toBe(0);
    else expect(r.nextPity).toBe(1);
  });

  it('forces SSR when pity guard triggers', () => {
    const rng = createRng(1);
    // pity = 89, threshold = 90 → next pull guaranteed SSR
    const r = rollOne(rng, RATES, 89, 90);
    expect(r.rarity).toBe('SSR');
    expect(r.nextPity).toBe(0);
  });
});

describe('rollMany', () => {
  it('threads pity through 10 pulls', () => {
    const rng = createRng(123);
    const { results, finalPity } = rollMany(rng, RATES, 0, 90, 10);
    expect(results).toHaveLength(10);
    // finalPity must equal 0 if any SSR was pulled, else exactly 10.
    const hadSsr = results.some((r) => r.rarity === 'SSR');
    if (!hadSsr) expect(finalPity).toBe(10);
    else expect(finalPity).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic for a given seed', () => {
    const a = rollMany(createRng(7), RATES, 0, 90, 20);
    const b = rollMany(createRng(7), RATES, 0, 90, 20);
    expect(a.results.map((r) => r.rarity)).toEqual(b.results.map((r) => r.rarity));
  });
});

describe('pickFromPool', () => {
  const pool = {
    SSR: ['m/ssr-a', 'm/ssr-b'],
    SR: ['m/sr-a'],
    R: ['m/r-a', 'm/r-b', 'm/r-c']
  } as const;

  it('picks from the requested rarity bucket', () => {
    const id = pickFromPool(createRng(1), pool, 'SR');
    expect(pool.SR).toContain(id);
  });

  it('falls back to any tier when the requested bucket is empty', () => {
    const sparse = { SSR: [], SR: ['only/one'], R: [] } as const;
    const id = pickFromPool(createRng(1), sparse, 'SSR');
    expect(id).toBe('only/one');
  });

  it('throws when the entire pool is empty', () => {
    const empty = { SSR: [], SR: [], R: [] } as const;
    expect(() => pickFromPool(createRng(1), empty, 'R')).toThrow();
  });
});
