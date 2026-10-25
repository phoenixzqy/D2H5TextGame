/**
 * Damage pipeline.
 *
 * Source: docs/design/combat-formulas.md §6 (8-step) and §8 (penetration).
 *
 *  1. base = skill.damage OR attacker.attack
 *  2. +flat (gear/buff bonuses)
 *  3. ×(1 + sum(%inc))
 *  4. ×combo (from combo matrix)
 *  5. ×crit (if rolled)
 *  6. ×(1 - clamp(targetResist - actPenalty, -100, 75)/100)
 *  7. - mitigation (defense for phys/fire/poison; magicResist for cold/ltn/arcane)
 *  8. final = max(1, floor(...))
 *
 * Dodge is rolled BEFORE the pipeline; if dodged, returns a "dodge" outcome.
 *
 * @module engine/combat/damage
 */

import type { Rng } from '../rng';
import type { DamageType, Resistances } from '../types/attributes';

/** Inputs to the damage pipeline. */
export interface DamageInput {
  /** Base min/max damage (from skill or attacker.attack). */
  readonly baseMin: number;
  readonly baseMax: number;
  /** Flat additions from gear/buffs. */
  readonly flatBonus: number;
  /** Multiplicative %inc total (e.g. 0.5 = +50%). */
  readonly increasedPct: number;
  /** Combo multiplier (1 = none). */
  readonly comboMult: number;
  /** Independent direct Arcane multiplier for an active Mana Burn target at zero MP. */
  readonly manaBurnMult?: number;
  /** Damage type. */
  readonly type: DamageType;
  /** Attacker crit chance & damage multiplier. */
  readonly critChance: number;
  readonly critMult: number;
  /** Defender stats. */
  readonly defenderResistances: Resistances;
  readonly defenderArmor: number;
  readonly defenderMagicResist: number;
  /** Defender dodge chance for the relevant dodge pool (0..1). */
  readonly defenderDodge: number;
  /** Hit chance (default 0.85). Spectral/thorns ignore dodge — set ignoreDodge=true. */
  readonly hitChance?: number;
  /** Additive hit-probability penalty, applied before the ordinary dodge/minimum floor. */
  readonly hitChancePenalty?: number;
  readonly ignoreDodge?: boolean;
  /** Act IV/V resistance pierce (subtracted from defender resist before clamp). */
  readonly resistPenalty?: number;
  /** Resistance cap (default 75). Bumped by uniques. */
  readonly resistCap?: number;
}

/** Outcome of a single damage resolution. */
export interface DamageOutcome {
  readonly hit: boolean;
  readonly dodged: boolean;
  readonly crit: boolean;
  readonly raw: number;
  readonly mitigated: number;
  readonly final: number;
  readonly effectiveResistPct: number;
}

/** One immutable hit/base/crit decision, reusable across a strike's typed components. */
export type DamageRoll =
  | { readonly hit: false; readonly dodged: true; readonly crit: false }
  | {
      readonly hit: true;
      readonly dodged: false;
      readonly crit: boolean;
      readonly base: number;
      readonly critMultiplier: number;
    };

/** A "miss" outcome shorthand. */
const MISS: DamageOutcome = {
  hit: false,
  dodged: true,
  crit: false,
  raw: 0,
  mitigated: 0,
  final: 0,
  effectiveResistPct: 0
};

/**
 * Map damage type → which mitigation stat applies.
 *  physical / fire / poison / thorns → armor (defense)
 *  cold / lightning / arcane          → magic resist
 */
function mitigationFor(type: DamageType, armor: number, mr: number): number {
  switch (type) {
    case 'cold':
    case 'lightning':
    case 'arcane':
      return mr;
    default:
      return armor;
  }
}

/** Lookup the resist value from a {@link Resistances} block. */
function resistOf(res: Resistances, type: DamageType): number {
  switch (type) {
    case 'physical':
    case 'thorns':
      return res.physical;
    case 'fire':
      return res.fire;
    case 'cold':
      return res.cold;
    case 'lightning':
      return res.lightning;
    case 'poison':
      return res.poison;
    case 'arcane':
      return res.arcane;
  }
}

/**
 * Resolve one damage application. Deterministic given `rng`.
 *
 * Pipeline order is exactly per combat-formulas.md §6.1 — do not reorder.
 */
export function resolveDamage(input: DamageInput, rng: Rng): DamageOutcome {
  return resolveRolledDamage(input, rollDamage(input, rng));
}

/** Draw hit, inclusive base and crit once, preserving the scalar pipeline's RNG order. */
export function rollDamage(input: DamageInput, rng: Rng): DamageRoll {
  const hitChance = input.hitChance ?? 0.85;

  // 1) Dodge / hit roll
  if (!input.ignoreDodge) {
    const effectiveHit = Math.max(
      0.05,
      hitChance - (input.hitChancePenalty ?? 0) - input.defenderDodge
    );
    if (!rng.chance(effectiveHit)) {
      return Object.freeze({ hit: false, dodged: true, crit: false });
    }
  }

  // 2) Base damage roll
  const baseLo = Math.min(input.baseMin, input.baseMax);
  const baseHi = Math.max(input.baseMin, input.baseMax);
  const baseRoll = baseLo === baseHi ? baseLo : rng.nextInt(Math.floor(baseLo), Math.floor(baseHi));

  // Step 5: crit (with overflow conversion at 1:2 ratio)
  let critChance = input.critChance;
  let critMult = input.critMult;
  if (critChance > 1) {
    const excessPct = (critChance - 1) * 100;
    critMult = critMult + excessPct / 2 / 100;
    critChance = 1;
  }
  const crit = rng.chance(critChance);
  return Object.freeze({
    hit: true,
    dodged: false,
    crit,
    base: baseRoll,
    critMultiplier: crit ? critMult : 1
  });
}

/** Resolve one typed share without drawing RNG; only rolled base is weighted before modifiers. */
export function resolveRolledDamage(
  input: DamageInput,
  roll: DamageRoll,
  baseShare = 1
): DamageOutcome {
  if (!roll.hit) return MISS;
  // Preserve scalar arithmetic order; component shares remain unrounded until mitigation.
  let dmg = roll.base * baseShare;
  dmg = dmg + input.flatBonus;
  dmg = dmg * (1 + input.increasedPct);
  dmg = dmg * input.comboMult;
  if (input.manaBurnMult !== undefined) dmg = dmg * input.manaBurnMult;
  if (roll.crit) dmg = dmg * roll.critMultiplier;
  return { hit: true, dodged: false, crit: roll.crit, ...mitigateDamage(dmg, input) };
}

/** Deterministic post-roll mitigation shared by ordinary hits and RNG-free reflection. */
export function mitigateDamage(
  rawDamage: number,
  input: Pick<
    DamageInput,
    | 'type'
    | 'defenderResistances'
    | 'defenderArmor'
    | 'defenderMagicResist'
    | 'resistPenalty'
    | 'resistCap'
  >
): Pick<DamageOutcome, 'raw' | 'mitigated' | 'final' | 'effectiveResistPct'> {
  // Step 6: resistance
  const cap = input.resistCap ?? 75;
  const rawResist = resistOf(input.defenderResistances, input.type);
  const effective = Math.max(-100, Math.min(cap, rawResist - (input.resistPenalty ?? 0)));
  let dmg = rawDamage * (1 - effective / 100);

  // Step 7: flat mitigation
  const mitigation = mitigationFor(input.type, input.defenderArmor, input.defenderMagicResist);
  const beforeMitigation = dmg;
  dmg = dmg - mitigation;

  // Step 8: floor & min 1
  const final = Math.max(1, Math.floor(dmg));

  return {
    raw: Math.floor(beforeMitigation),
    mitigated: Math.max(0, Math.floor(beforeMitigation) - final),
    final,
    effectiveResistPct: effective
  };
}
