/**
 * Independent secondary drops: rune-shards, wishstones, runes, gems; no gold per GDD §8.
 *
 * Source: docs/design/drop-tables.md §7–§10.
 *
 * @module engine/loot/orbs-and-currency
 */

import type { Rng } from '../rng';
import type { MonsterTier } from '../combat/types';
import { materialEconomy, type MaterialRewardBundle } from '../../data/loaders/materials';
import { sampleMaterial, type MaterialLedger } from './materials';

/** Difficulty enum used for drop multipliers. */
export type Difficulty = 'normal' | 'nightmare' | 'hell';

/** Rune-shard drop calculation (replaces gold). */
export function rollRuneShards(
  monsterLevel: number,
  tier: MonsterTier,
  currencyFindPct: number,
  rng: Rng
): number {
  const rules = materialEconomy.currencyRewards.runeShards;
  const variance = rules.varianceMin + rng.next() * rules.varianceSpan;
  return Math.floor(
    rules.basePerLevel * monsterLevel * rules.tierMultipliers[tier] * (1 + currencyFindPct / 100) * variance
  );
}

/** Currency drop bundle from a single kill (no items, only "currency"). */
export interface CurrencyDrops {
  /** Universal per-kill currency (replaces gold). */
  readonly runeShards: number;
  readonly wishstones: number;
  readonly runes: number;
  readonly gems: number;
  /** Concrete owned identities; numeric rune/gem counts are summaries only. */
  readonly materials: MaterialLedger;
}

/** Independent drops; a live special-reward policy replaces its material quantities. */
export function rollCurrencyDrops(
  monsterLevel: number,
  tier: MonsterTier,
  act: 1 | 2 | 3 | 4 | 5,
  difficulty: Difficulty,
  currencyFindPct: number,
  rng: Rng,
  bundle?: MaterialRewardBundle
): CurrencyDrops {
  const rules = materialEconomy.currencyRewards.wishstones;
  const wishstoneBase = rules.byTierAndAct[tier][act - 1] ?? 0;
  let wishstones = 0;
  if (tier === 'champion') {
    if (rng.chance(rules.championChance)) wishstones = wishstoneBase;
  } else {
    wishstones = Math.floor(wishstoneBase *
      (tier === 'boss' || tier === 'chapter-boss' ? rules.bossDifficultyMultipliers[difficulty] : 1));
  }

  const runeUnit = rng.next(), gemUnit = rng.next();
  if (bundle) {
    // Keep shard variance before the new quantity/additional-identity draws.
    const runeShards = rollRuneShards(monsterLevel, tier, currencyFindPct, rng);
    const runes = bundle.runeQuantityMin === bundle.runeQuantityMax
      ? bundle.runeQuantityMin : rng.nextInt(bundle.runeQuantityMin, bundle.runeQuantityMax);
    const gems = bundle.gemQuantityMax === undefined || bundle.gemQuantityMax === bundle.gemQuantity
      ? bundle.gemQuantity : rng.nextInt(bundle.gemQuantity, bundle.gemQuantityMax);
    const materials: Record<string, number> = {};
    for (let index = 0; index < runes; index++) {
      const id = sampleMaterial('rune', { act: bundle.runePoolAct, difficulty, tier },
        index === 0 ? runeUnit : rng.next(), { minimum: bundle.runeMinOrdinal, maximum: bundle.runeMaxOrdinal });
      materials[id] = (materials[id] ?? 0) + 1;
    }
    for (let index = 0; index < gems; index++) {
      const id = sampleMaterial('gem', { act, difficulty, tier }, index === 0 ? gemUnit : rng.next());
      materials[id] = (materials[id] ?? 0) + 1;
    }
    return { runeShards, wishstones, runes, gems, materials };
  }
  const { rune: runeChance, gem: gemChance } = materialEconomy.independentDropChances[tier];
  const runes = runeUnit < runeChance ? 1 : 0;
  const gems = gemUnit < gemChance ? 1 : 0;
  const materials: Record<string, number> = {};
  const context = { act, difficulty, tier };
  if (runes) materials[sampleMaterial('rune', context, runeUnit / runeChance)] = 1;
  if (gems) materials[sampleMaterial('gem', context, gemUnit / gemChance)] = 1;
  const runeShards = rollRuneShards(monsterLevel, tier, currencyFindPct, rng);
  return { runeShards, wishstones, runes, gems, materials };
}
