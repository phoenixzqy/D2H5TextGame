/**
 * Declarative skill-scaling helpers.
 *
 * These functions evaluate data-authored scaling shapes without coupling UI or
 * stores into the pure combat engine.
 *
 * @module engine/skills/scaling
 */

import type { SummonEffect } from './effects';

/** Raise Skeleton: +1 max summon for levels 1-3, then +1 every 3 levels. */
export function maxSkeletonsForLevel(level: number): number {
  const effective = Math.max(0, Math.floor(level));
  if (effective <= 0) return 0;
  if (effective <= 3) return effective;
  return 3 + Math.floor((effective - 3) / 3);
}

/** Evaluate the max active summons for a summon effect at a skill level. */
export function resolveSummonMaxCount(effect: SummonEffect, skillLevel: number): number {
  if (effect.maxCountScaling?.kind === 'first-three-then-every-three') {
    return maxSkeletonsForLevel(skillLevel);
  }
  return effect.maxCount > 0 ? effect.maxCount : 5;
}
