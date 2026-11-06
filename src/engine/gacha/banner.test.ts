import { describe, expect, it, vi } from 'vitest';
import banner from '../../data/gacha/banner-config.json';
import { createRng, type Rng } from '../rng';
import { rollBanner, type BannerRules, type BannerState } from './banner';

// Locked GDD parameters; live authoring changes only with the durable integration.
const rules: BannerRules = {
  ...banner,
  rates: { SSR: .02, SR: .13, R: .85 },
  pity: { sr: { threshold: 10 }, ssr: { threshold: 50 } }
};
const fresh: BannerState = { pullsSinceSR: 0, pullsSinceSSR: 0 };

function fixed(value: number) {
  const next = vi.fn(() => value);
  const rng: Rng = {
    ...createRng(1), next,
    pick: <T>(values: readonly T[]): T => {
      const first = values[0];
      if (first === undefined) throw new Error('Empty test pool');
      return first;
    }
  };
  return { rng, next };
}

describe('complete recruitment banner model', () => {
  it.each([[0, 'SSR'], [.019999, 'SSR'], [.02, 'SR'], [.149999, 'SR'], [.15, 'R'], [.999, 'R']] as const)(
    'uses the authored tier boundary at %s', (value, rarity) => {
      const { rng } = fixed(value);
      const result = rollBanner(rng, rules, fresh, new Set(), 1);
      expect(result.results[0]).toEqual({ kind: 'merc', mercId: rules.pool[rarity][0], rarity, isNew: true });
      expect(result.nextState).toEqual({ pullsSinceSR: rarity === 'R' ? 1 : 0,
        pullsSinceSSR: rarity === 'SSR' ? 0 : 1 });
    }
  );

  it('forces SR on the tenth draw and leaves the independent SSR counter running', () => {
    const { rng } = fixed(.999);
    const result = rollBanner(rng, rules, { pullsSinceSR: 9, pullsSinceSSR: 20 }, new Set(), 1);
    expect(result.results[0]?.rarity).toBe('SR');
    expect(result.nextState).toEqual({ pullsSinceSR: 0, pullsSinceSSR: 21 });
  });
  it('keeps the base SSR chance in an SR-guaranteed slot and resets both counters', () => {
    const { rng } = fixed(.019);
    const result = rollBanner(rng, rules, { pullsSinceSR: 9, pullsSinceSSR: 20 }, new Set(), 1);
    expect(result.results[0]?.rarity).toBe('SSR');
    expect(result.nextState).toEqual(fresh);
  });
  it.each([49, 89, Number.MAX_SAFE_INTEGER])('forces the next paid SSR from %s previous misses', misses => {
    const { rng } = fixed(.999);
    const result = rollBanner(rng, rules, { pullsSinceSR: 9, pullsSinceSSR: misses }, new Set(), 1);
    expect(result.results[0]?.rarity).toBe('SSR');
    expect(result.nextState).toEqual(fresh);
  });
  it('does not force either floor one draw early', () => {
    const { rng } = fixed(.999);
    expect(rollBanner(rng, rules, { pullsSinceSR: 8, pullsSinceSSR: 48 }, new Set(), 1).nextState)
      .toEqual({ pullsSinceSR: 9, pullsSinceSSR: 49 });
  });
  it('recognizes the first recruit as owned for the rest of the same ten-pull', () => {
    const { rng } = fixed(.999);
    const owned = new Set<string>();
    const result = rollBanner(rng, rules, fresh, owned, 10);
    const rId = rules.pool.R[0];
    expect(result.results[0]).toEqual({ kind: 'merc', mercId: rId, rarity: 'R', isNew: true });
    expect(result.results.slice(1, 9)).toEqual(Array.from({ length: 8 }, () => ({
      kind: 'shard', mercId: rId, rarity: 'R', isNew: false, shardCount: 2
    })));
    expect(result.results[9]?.rarity).toBe('SR');
    expect(owned.size).toBe(0);
    expect(fresh).toEqual({ pullsSinceSR: 0, pullsSinceSSR: 0 });
  });
  it.each([['SSR', .01, 15], ['SR', .04, 5], ['R', .99, 2]] as const)(
    'returns the authored %s duplicate quantity without another merc', (rarity, value, shardCount) => {
      const { rng } = fixed(value);
      const mercId = rules.pool[rarity][0];
      if (mercId === undefined) throw new Error('Missing authored tier');
      const result = rollBanner(rng, rules, fresh, new Set([mercId]), 1);
      expect(result.results).toEqual([{ kind: 'shard', mercId, rarity, isNew: false, shardCount }]);
    }
  );
  it('threads both pity and ownership across ten singles exactly like one ten-pull', () => {
    const initial = { pullsSinceSR: 8, pullsSinceSSR: 47 };
    const tenRng = createRng(54), singleRng = createRng(54), owned = new Set<string>();
    const ten = rollBanner(tenRng, rules, initial, owned, 10);
    let state: BannerState = initial;
    const singles = [];
    for (let index = 0; index < 10; index++) {
      const single = rollBanner(singleRng, rules, state, owned, 1);
      singles.push(...single.results);
      for (const result of single.results) owned.add(result.mercId);
      state = single.nextState;
    }
    expect(ten.results).toEqual(singles);
    expect(ten.nextState).toEqual(state);
    expect(tenRng.next()).toBe(singleRng.next());
  });
  it.each([0, 2, 9, 11, -1, 1.5, NaN, Infinity])('refuses count %s before consuming randomness', count => {
    const { rng, next } = fixed(.99);
    expect(() => rollBanner(rng, rules, fresh, new Set(), count)).toThrow(RangeError);
    expect(next).not.toHaveBeenCalled();
  });
  it.each([-1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('refuses invalid counter %s before RNG', value => {
    const { rng, next } = fixed(.99);
    expect(() => rollBanner(rng, rules, { ...fresh, pullsSinceSSR: value }, new Set(), 1)).toThrow(RangeError);
    expect(() => rollBanner(rng, rules, { ...fresh, pullsSinceSR: value }, new Set(), 1)).toThrow(RangeError);
    expect(next).not.toHaveBeenCalled();
  });
  it('rejects impossible SR/SSR counter ordering', () => {
    const { rng, next } = fixed(.99);
    expect(() => rollBanner(rng, rules, { pullsSinceSR: 2, pullsSinceSSR: 1 }, new Set(), 1)).toThrow(RangeError);
    expect(next).not.toHaveBeenCalled();
  });
  it('refuses an empty selected tier instead of falling back to another rarity', () => {
    const { rng } = fixed(.01);
    expect(() => rollBanner(rng, { ...rules, pool: { ...rules.pool, SSR: [] } }, fresh, new Set(), 1)).toThrow();
  });
});
