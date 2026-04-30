/**
 * Combo / synergy multiplier matrix.
 *
 * Source: docs/design/combo-matrix.md §3, §4.
 *
 * Default rule: combos trigger only on direct hits, NOT on DoT ticks.
 * Combo multipliers are looked up by (status-on-target, damage-type-of-incoming-hit).
 *
 * @module engine/combat/combo
 */

import type { DamageType } from '../types/attributes';
import type { CombatUnit } from './types';
import { getStacks, hasStatus } from './status';

/**
 * Compute the cross-element combo multiplier on a single incoming hit.
 *
 * @param target the unit being hit
 * @param incoming the damage type of the next hit
 * @param isBoss whether the target is a boss (boss combo resistance: 50%)
 * @returns the multiplicative bonus (1.0 = no combo)
 */
export function comboMultiplier(
  target: CombatUnit,
  incoming: DamageType
): number {
  const isBoss = target.tier === 'boss' || target.tier === 'chapter-boss';
  let mult = 1;

  // Cold debuffs
  if (hasStatus(target, 'chill')) {
    if (incoming === 'lightning') mult *= 1.3;
    else if (incoming === 'physical') mult *= 1.1;
  }
  if (hasStatus(target, 'freeze')) {
    if (incoming === 'physical') mult *= 1.5; // shatter
  }

  // Fire debuffs
  if (hasStatus(target, 'ignite')) {
    if (incoming === 'physical') mult *= 1.25;
    else if (incoming === 'poison') mult *= 1.15;
  }
  if (hasStatus(target, 'armor-melt')) {
    if (incoming === 'physical') mult *= 1.25;
  }

  // Lightning debuffs
  if (hasStatus(target, 'paralyze')) {
    if (incoming === 'fire') mult *= 1.2;
  }

  // Arcane debuffs
  if (hasStatus(target, 'mana-burn')) {
    if (incoming === 'arcane') mult *= 1.2;
    else if (incoming === 'lightning') mult *= 1.15;
  }

  // Poison: exponential past 2 stacks (×(1 + 0.15 * stacks))
  const poisonStacks = getStacks(target, 'poison');
  if (poisonStacks >= 3) {
    if (incoming === 'poison') mult *= 1 + 0.15 * poisonStacks;
    else if (incoming === 'arcane') mult *= 1.1;
  }

  // Bleed
  if (hasStatus(target, 'bleed')) {
    if (incoming === 'physical') mult *= 1.1;
  }

  // Boss combo resistance: 50% scaling
  if (isBoss && mult > 1) {
    mult = 1 + (mult - 1) * 0.5;
  }

  return mult;
}

/**
 * Whether `incoming` against `target` triggers shatter execute (frozen + physical, target HP <20%).
 * The caller then applies an instant kill OR the ×1.5 already accounted for in {@link comboMultiplier}.
 */
export function shouldShatter(
  target: CombatUnit,
  incoming: DamageType
): boolean {
  return (
    incoming === 'physical' &&
    hasStatus(target, 'freeze') &&
    target.life > 0 &&
    target.life / target.stats.lifeMax < 0.2
  );
}
