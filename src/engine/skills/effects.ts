/**
 * Skill effect primitives.
 *
 * A "skill effect" describes what a skill DOES when fired. Effects compose:
 * a single skill cast may produce damage + status + buff in one fire call.
 *
 * Concrete effect resolution is performed in {@link import('../combat/combat').runBattle}.
 *
 * @module engine/skills/effects
 */

import type { ComboTag, SkillTarget, SkillRequirement } from '../types/skills';
import type { DamageType } from '../types/attributes';
import type { AoeShape } from '../combat/grid';

/** Damage primitive. */
export interface DamageEffect {
  readonly kind: 'damage';
  readonly damageType: DamageType;
  /** [min, max] base at skill rank 1. */
  readonly base: readonly [number, number];
  /** Per-rank growth [min, max]. */
  readonly perRank?: readonly [number, number];
  /** Tags the hit applies (combo synergies). */
  readonly tags?: readonly ComboTag[];
  /** Status to apply on hit (status-id from combat/status.ts). */
  readonly applyStatus?: {
    readonly id: string;
    readonly chance?: number; // 0..1, default 1
    readonly stacksOnApply?: number; // default 1
    readonly dotPctOfDamage?: number; // for DoTs, fraction of dealt damage per tick
  };
}

/** Heal primitive. */
export interface HealEffect {
  readonly kind: 'heal';
  /** Flat amount or % max (one of). */
  readonly amount?: number;
  readonly pctOfMaxLife?: number;
  readonly target: 'self' | 'ally' | 'all-allies';
}

/** Buff primitive. */
export interface BuffEffect {
  readonly kind: 'buff';
  readonly id: string;
  readonly duration: number;
  readonly statMods?: Record<string, number>;
}

/** Debuff primitive (applies a status to enemies, no damage). */
export interface DebuffEffect {
  readonly kind: 'debuff';
  readonly statusId: string;
  readonly duration?: number;
}

/** Summon primitive. */
export type SummonMaxCountScalingKind =
  | 'first-three-then-every-three'
  | 'raise-skeleton-1-6-12-cap-3';

/** Declarative max-summon-count scaling, evaluated from effective skill level. */
export interface SummonMaxCountScaling {
  readonly kind: SummonMaxCountScalingKind;
}

export interface SummonEffect {
  readonly kind: 'summon';
  readonly summonId: string;
  readonly maxCount: number;
  readonly maxCountScaling?: SummonMaxCountScaling;
}

/** Union of effect primitives. */
export type SkillEffect =
  | DamageEffect
  | HealEffect
  | BuffEffect
  | DebuffEffect
  | SummonEffect;

/** A registered skill (engine-side). */
export interface RegisteredSkill {
  readonly id: string;
  readonly archetype: string;
  readonly target: SkillTarget;
  /**
   * Cooldown in **seconds** (sim-time). The combat engine multiplies this by
   * 1000 and stores `cooldownExpiresAt = simClockMs + cooldown*1000` after
   * each cast. A value of 0 means "no cooldown".
   *
   * @remarks Historically this was "rounds"; with the timeline scheduler the
   * unit is seconds — data values typically remain numerically the same (0,
   * 1, 2, 3, …) but now describe sim-seconds.
   */
  readonly cooldown: number;
  readonly manaCost: number;
  readonly effects: readonly SkillEffect[];
  /** Optional grid shape used when target is `area-enemies`. */
  readonly aoeShape?: AoeShape;
  /** Buff skills are skipped if the buff is already active. */
  readonly isBuff?: boolean;
  /** Summon-on-start (cast once at combat start). */
  readonly summonOnStart?: boolean;
  /** Min level to use. */
  readonly minLevel: number;
  /**
   * Equipment gating. When present, the engine's
   * {@link import('../ai/policy').chooseSkill} skips this skill unless
   * the unit's `equippedWeapon` satisfies the requirement
   * (see {@link import('./eligibility').canCastSkill}).
   * Absent ⇒ always usable.
   */
  readonly requires?: SkillRequirement;
}
