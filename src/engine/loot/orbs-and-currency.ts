/**
 * Independent secondary drops: gold, wishstones, runes, gems.
 *
 * Source: docs/design/drop-tables.md §7–§10.
 *
 * @module engine/loot/orbs-and-currency
 */

import type { Rng } from '../rng';
import type { MonsterTier } from '../combat/types';

/** Difficulty enum used for drop multipliers. */
export type Difficulty = 'normal' | 'nightmare' | 'hell';

/** Per-tier base independent-drop chances (Normal). */
const RUNE_CHANCE: Readonly<Record<MonsterTier, number>> = {
  trash: 0.006,
  elite: 0.05,
  champion: 0.03,
  boss: 1
};
const GEM_CHANCE: Readonly<Record<MonsterTier, number>> = {
  trash: 0.015,
  elite: 0.08,
  champion: 0.04,
  boss: 1
};

/** Wishstone awards (drop-tables §9). */
const WISHSTONE_BY_TIER_AND_ACT: Readonly<Record<MonsterTier, number[]>> = {
  trash: [0, 0, 0, 0, 0],
  elite: [1, 1, 1, 2, 2],
  champion: [0, 0, 1, 1, 1], // expected value 0.4 ≈ 40% chance for 1
  boss: [8, 12, 16, 24, 40]
};

/** Difficulty multipliers from drop-tables §9. */
const DIFFICULTY_MULT: Readonly<Record<Difficulty, number>> = {
  normal: 1,
  nightmare: 1.2,
  hell: 1.5
};

/** Gold drop calculation. */
export function rollGold(
  monsterLevel: number,
  tier: MonsterTier,
  goldFindPct: number,
  rng: Rng
): number {
  const tierMult: Record<MonsterTier, number> = {
    trash: 1,
    elite: 2.5,
    champion: 4,
    boss: 50
  };
  const base = 5;
  const variance = 0.7 + rng.next() * 0.6; // [0.7, 1.3)
  return Math.floor(
    base * monsterLevel * tierMult[tier] * (1 + goldFindPct / 100) * variance
  );
}

/** Currency drop bundle from a single kill (no items, only "currency"). */
export interface CurrencyDrops {
  readonly gold: number;
  readonly wishstones: number;
  readonly runes: number;
  readonly gems: number;
}

/** All independent drops from a kill. */
export function rollCurrencyDrops(
  monsterLevel: number,
  tier: MonsterTier,
  act: 1 | 2 | 3 | 4 | 5,
  difficulty: Difficulty,
  goldFindPct: number,
  rng: Rng
): CurrencyDrops {
  const diff = DIFFICULTY_MULT[difficulty];
  const wishstoneBase = WISHSTONE_BY_TIER_AND_ACT[tier][act - 1] ?? 0;
  // Per spec: champion uses 40% chance for 1 wishstone — treat 0/1 entries as percentages.
  let wishstones = 0;
  if (tier === 'champion') {
    if (rng.chance(0.4)) wishstones = 1;
  } else if (tier === 'boss' || tier === 'elite') {
    wishstones = Math.floor(wishstoneBase * (tier === 'boss' ? diff : 1));
  }

  const runes = rng.chance(RUNE_CHANCE[tier]) ? 1 : 0;
  const gems = rng.chance(GEM_CHANCE[tier]) ? 1 : 0;
  const gold = rollGold(monsterLevel, tier, goldFindPct, rng);
  return { gold, wishstones, runes, gems };
}
