/**
 * Gacha roller — pure, deterministic weighted rarity picker with pity guard.
 *
 * Tiny by design: takes a {@link Rng}, current pity counter, and the configured
 * rarity rates + pity threshold, and returns the picked rarity. Caller maps
 * rarity → concrete merc id from the pool. No I/O, no globals, no Math.random.
 *
 * @module engine/gacha/roller
 */

import type { Rng } from '../rng';

/** Rarity tiers exposed by the gacha banner. */
export type GachaRarity = 'R' | 'SR' | 'SSR';

/** Rate weights summing to ≤ 1. Anything left over rolls into R. */
export interface GachaRates {
  readonly SSR: number;
  readonly SR: number;
  readonly R: number;
}

/** Result of a single roll. */
export interface RollResult {
  readonly rarity: GachaRarity;
  /** Pity counter AFTER this roll (0 if SSR was rolled, else +1). */
  readonly nextPity: number;
}

/**
 * Roll a single gacha pick.
 *
 * Pity guard: when `pity + 1 >= pityThreshold` and rates didn't already roll
 * SSR, the rarity is upgraded to SSR. Pity resets to 0 on SSR, otherwise
 * increments by 1.
 */
export function rollOne(
  rng: Rng,
  rates: GachaRates,
  pity: number,
  pityThreshold: number
): RollResult {
  const r = rng.next();
  let rarity: GachaRarity;
  if (r < rates.SSR) rarity = 'SSR';
  else if (r < rates.SSR + rates.SR) rarity = 'SR';
  else rarity = 'R';

  if (pity + 1 >= pityThreshold && rarity !== 'SSR') {
    rarity = 'SSR';
  }

  const nextPity = rarity === 'SSR' ? 0 : pity + 1;
  return { rarity, nextPity };
}

/**
 * Roll N picks, threading pity across rolls.
 */
export function rollMany(
  rng: Rng,
  rates: GachaRates,
  startingPity: number,
  pityThreshold: number,
  count: number
): { readonly results: readonly RollResult[]; readonly finalPity: number } {
  const results: RollResult[] = [];
  let pity = startingPity;
  for (let i = 0; i < count; i++) {
    const r = rollOne(rng, rates, pity, pityThreshold);
    results.push(r);
    pity = r.nextPity;
  }
  return { results, finalPity: pity };
}

/**
 * Pick a random merc id from a rarity-bucketed pool.
 * Falls back to any other tier if the requested tier is empty.
 */
export function pickFromPool(
  rng: Rng,
  pool: {
    readonly SSR: readonly string[];
    readonly SR: readonly string[];
    readonly R: readonly string[];
  },
  rarity: GachaRarity
): string {
  const bucket = pool[rarity];
  if (bucket.length > 0) return rng.pick(bucket);
  const all = [...pool.SSR, ...pool.SR, ...pool.R];
  if (all.length === 0) throw new Error('Gacha pool is empty');
  return rng.pick(all);
}
