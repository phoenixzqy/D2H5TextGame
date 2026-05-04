/**
 * Declarative skill-scaling helpers.
 *
 * These functions evaluate data-authored scaling shapes without coupling UI or
 * stores into the pure combat engine.
 *
 * @module engine/skills/scaling
 */

import type { DerivedStats } from '../types/attributes';
import type { SummonEffect, SummonStatScaling } from './effects';

/** Legacy summon scaling: +1 max summon for levels 1-3, then +1 every 3 levels. */
export function maxFirstThreeThenEveryThreeForLevel(level: number): number {
  const effective = Math.max(0, Math.floor(level));
  if (effective <= 0) return 0;
  if (effective <= 3) return effective;
  return 3 + Math.floor((effective - 3) / 3);
}

/** Raise Skeleton: 1 skeleton at level 1, 2 at level 6, 3 at level 12. */
export function maxSkeletonsForLevel(level: number): number {
  const effective = Math.max(0, Math.floor(level));
  if (effective <= 0) return 0;
  if (effective < 6) return 1;
  if (effective < 12) return 2;
  return 3;
}

/** Evaluate the max active summons for a summon effect at a skill level. */
export function resolveSummonMaxCount(effect: SummonEffect, skillLevel: number): number {
  if (effect.maxCountScaling?.kind === 'first-three-then-every-three') {
    return maxFirstThreeThenEveryThreeForLevel(skillLevel);
  }
  if (effect.maxCountScaling?.kind === 'raise-skeleton-1-6-12-cap-3') {
    return maxSkeletonsForLevel(skillLevel);
  }
  return effect.maxCount > 0 ? effect.maxCount : 5;
}

/** Scale a flat per-rank value from skill rank 1. */
export function scalePerRank(base: number, perRank: number | undefined, skillLevel: number): number {
  return Math.round(base + (perRank ?? 0) * Math.max(0, Math.floor(skillLevel) - 1));
}

function scaleOptionalPerRank(base: number, perRank: number | undefined, skillLevel: number): number {
  return perRank === undefined ? base : scalePerRank(base, perRank, skillLevel);
}

function scaleOptionalFractionPerRank(base: number, perRank: number | undefined, skillLevel: number): number {
  return perRank === undefined
    ? base
    : Number((base + perRank * Math.max(0, Math.floor(skillLevel) - 1)).toFixed(4));
}

/** Apply data-authored summon stat growth to a summon template's base stats. */
export function scaleSummonStats(
  base: DerivedStats,
  scaling: SummonStatScaling | undefined,
  skillLevel: number
): DerivedStats {
  if (!scaling) return base;
  const rank = Math.max(1, Math.floor(skillLevel));
  const scaledLifeMax = scalePerRank(base.lifeMax, scaling.lifeMax, rank);
  return {
    ...base,
    lifeMax: scaledLifeMax,
    life: scaledLifeMax,
    attack: scaleOptionalPerRank(base.attack, scaling.attack, rank),
    defense: scaleOptionalPerRank(base.defense, scaling.defense, rank),
    attackSpeed: scaleOptionalPerRank(base.attackSpeed, scaling.attackSpeed, rank),
    physDodge: scaleOptionalFractionPerRank(base.physDodge, scaling.physDodge, rank),
    magicDodge: scaleOptionalFractionPerRank(base.magicDodge, scaling.magicDodge, rank)
  };
}
