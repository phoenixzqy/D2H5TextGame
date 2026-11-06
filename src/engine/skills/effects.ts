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

import type { ComboTag, SkillTarget, SkillRequirement, OnHitBoltsTuning, OnHitRecoveryTuning, OnHitSelfDamageTuning, SkillHitSequence, MercElementalArrowTuning } from '../types/skills';
import type { DamageType } from '../types/attributes';
import type { AoeShape } from '../combat/grid';

export type SummonStatScaling = Partial<Record<
  'lifeMax' | 'attack' | 'defense' | 'attackSpeed' | 'physDodge' | 'magicDodge',
  number
>>;

/** One ordered status application after a successful damage hit. */
export interface OnHitStatus {
  readonly id: string;
  /** Explicit DoT type when a physical carrier applies a different elemental payload. */
  readonly damageType?: DamageType;
  /** Base simulation milliseconds, before canonical status/boss-duration resolution. */
  readonly durationMs?: number;
  readonly chance?: number; // 0..1, default 1
  readonly stacksOnApply?: number; // default 1
  readonly dotPctOfDamage?: number; // for DoTs, fraction of dealt damage per tick
}

/** One ordered share of a single rolled base; modifiers and mitigation remain type-specific. */
export interface WeightedDamageComponent {
  readonly damageType: DamageType;
  /** Positive authored weight; mercElementalArrow alone uses explicit whole-budget fractions. */
  readonly weight: number;
}

interface DamageEffectBase {
  /** Only this adapter treats component weights as whole-budget fractions, including Attack. */
  readonly mercElementalArrow?: MercElementalArrowTuning;
  /** Positive normal travel time; delayed impacts use the ordinary damage pipeline. */
  readonly projectileFlightMs?: number;
  /** Exact paid Conversion hit; bare converted statuses never confer allegiance. */
  readonly conversion?: true;
  /** Opt-in shares of one hit/base/crit roll, settled before one death/retaliation closure. */
  readonly components?: readonly [WeightedDamageComponent, ...WeightedDamageComponent[]];
  /** Bypass only the target's flat magic-resist stat, never percentage resistance or absorption. */
  readonly ignoresMagicResist?: true;
  /** Bypass ordinary hit/accuracy/dodge checks; retain mitigation, criticals and absorption. */
  readonly alwaysHits?: true;
  /** Bypass only this hit's ordinary Defense input; never mutate target stats. */
  readonly ignoresDefense?: true;
  /** One bounded sequence of ordinary attempts, rotating within the original target pool. */
  readonly hitSequence?: SkillHitSequence;
  readonly onHitBolts?: OnHitBoltsTuning;
  /** Additive critical chance for this direct damage effect; ordinary overflow applies. */
  readonly critChanceBonus?: number;
  /** Explicit direct-hit recovery only; never inherited by ordinary/basic/periodic damage. */
  readonly onHitRecovery?: OnHitRecoveryTuning;
  /** Explicit life debit after a real enemy HP loss; independent of personal shields. */
  readonly onHitSelfDamage?: OnHitSelfDamageTuning;
  /** Exact Feral Rage opts into independently authenticated self speed stacks. */
  readonly feralRage?: true;
  /** Exact Frenzy opts into its independently authorized finite speed stacks. */
  readonly frenzy?: true;
  readonly kind: 'damage';
  readonly damageType: DamageType;
  /** [min, max] base at skill rank 1. */
  readonly base: readonly [number, number];
  /** Opt-in percentage of snapshot Attack added before damage multipliers and mitigation. */
  readonly attackDamagePct?: number;
  /** Additional percentage points of snapshot Attack per rank above one. */
  readonly attackDamagePctPerRank?: number;
  /** Additive increased damage fraction for this direct effect only (0.5 = +50%). */
  readonly increasedDamagePct?: number;
  /** Per-rank growth [min, max]. */
  readonly perRank?: readonly [number, number];
  /** Opt-in damage growth per monster level above one; independent of skill rank. */
  readonly perMonsterLevel?: readonly [number, number];
  /** Tags the hit applies (combo synergies). */
  readonly tags?: readonly ComboTag[];
}

/** Damage primitive with either a legacy scalar status or a full ordered list. */
export type DamageEffect = DamageEffectBase & (
  | { readonly applyStatus?: OnHitStatus; readonly applyStatuses?: never }
  | { readonly applyStatus?: never; readonly applyStatuses: readonly [OnHitStatus, ...OnHitStatus[]] }
);

/** Heal primitive. */
export interface HealEffect {
  readonly kind: 'heal';
  /** Flat amount; takes precedence over amountRange and pctOfMaxLife. */
  readonly amount?: number;
  /** Inclusive seeded integer range; takes precedence over pctOfMaxLife. */
  readonly amountRange?: readonly [number, number];
  readonly pctOfMaxLife?: number;
  readonly target: 'self' | 'ally' | 'all-allies';
}

/** Buff primitive. */
export interface BuffEffect {
  /** Exact paid finite personal Teleport/Enchant consumer. */
  readonly sorceressBuff?: import('./sorceress-buffs').SorceressBuffId;
  /** Exact paid Cyclone Armor consumer; bare buff markers confer no defensive power. */
  readonly cycloneArmor?: true;
  /** Exact paid Holy Shield consumer; markers alone grant no power. */
  readonly holyShield?: true;
  /** Exact paid finite personal Bone Wall consumer; presentation markers grant no power. */
  readonly boneWall?: true;
  readonly kind: 'buff';
  readonly id: string;
  readonly duration: number;
  readonly statMods?: Record<string, number>;
  /** Exact player Frozen Armor opts into an independently tuned paid combat snapshot. */
  readonly frozenArmor?: true;
  /** Exact paid mercenary Frozen Armor; independent of the player's percentage buff. */
  readonly mercFrozenArmor?: true;
  /** Exact paid Shiver/Chilling Armor consumer; markers alone grant no effects. */
  readonly coldArmor?: import('./cold-armors').ColdArmorId;
  /** Exact paid finite stat-buff consumer; bare markers never establish potency. */
  readonly timedStatBuff?: 'burst-of-speed' | 'cloak-of-shadows' | 'leap' | 'concentrate';
  /** Paid mutually exclusive native Druid transformation. */
  readonly druidForm?: import('./druid-shapeshifting').DruidForm;
}

/** Debuff primitive (applies a status to enemies, no damage). */
export interface DebuffEffect {
  /** Exact paid finite projectile-speed consumer; markers alone confer no slowing. */
  readonly slowMissiles?: true;
  /** Complete authored target curse, captured under its own finite status on payment. */
  readonly targetCurse?: 'confuse' | 'attract';
  /** Complete authored finite blindness, captured only when the action pays. */
  readonly dimVision?: true;
  /** Complete authored finite fear, captured only at actual payment. */
  readonly terror?: true;
  /** Complete authored player action trap, granted only at actual payment. */
  readonly bonePrison?: true;
  /** Complete authored damage curse; copied into a finite status only on payment. */
  readonly damageCurse?: 'iron-maiden' | 'life-tap' | 'lower-resist';
  readonly kind: 'debuff';
  readonly statusId: string;
  readonly duration?: number;
  /** Base simulation milliseconds; takes precedence over legacy duration when consumed. */
  readonly durationMs?: number;
  /** Nonnegative physical resistance reduction in percentage points. */
  readonly physicalResistReductionPct?: number;
  /** Capture the authored finite Decrepify speed/damage packet on payment. */
  readonly decrepify?: true;
  /** Complete authored Weaken, captured only when the eligible action pays. */
  readonly weaken?: true;
  /** Complete authored Amazon Defense reduction, captured only on payment. */
  readonly innerSight?: true;
  /** Capture authored rank-scaled damage/Defense reduction on payment. */
  readonly battleCry?: true;
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
  /** Number created per ordinary cast, clipped to the missing living capacity. */
  readonly count?: number;
  /** Validated archetype for real monster summons instead of a generic template. */
  readonly monsterDef?: import('../types/monsters').MonsterDef;
  readonly refundOnDeath?: boolean;
  readonly maxCountScaling?: SummonMaxCountScaling;
  readonly statScaling?: SummonStatScaling;
}

/** Union of effect primitives. */
export type SkillEffect =
  | { readonly kind: 'monster-panic-flee' }
  | { readonly kind: 'monster-resurrection' }
  | { readonly kind: 'decoy' }
  | { readonly kind: 'party-skill-ranks' }
  | { readonly kind: 'corpse-ward' }
  | { readonly kind: 'corpse-search' }
  | { readonly kind: 'corpse-recovery' }
  | { readonly kind: 'hydra' }
  | { readonly kind: 'periodic-spell'; readonly spell: import('./periodic-spells').PeriodicSpellId }
  | { readonly kind: 'static-field' }
  | DamageEffect
  | HealEffect
  | BuffEffect
  | DebuffEffect
  | SummonEffect;

/** A registered skill (engine-side). */
export interface RegisteredSkill {
  readonly id: string;
  readonly archetype: string;
  readonly trigger?: 'active' | 'passive' | 'aura' | 'on-death';
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
  /** Per-rank mana cost growth from rank 1. Negative values reduce cost. */
  readonly manaCostPerRank?: number;
  /** Per-rank cooldown growth from rank 1. Negative values reduce cooldown. */
  readonly cooldownPerRank?: number;
  readonly effects: readonly SkillEffect[];
  /** Optional grid shape used when target is `area-enemies`. */
  readonly aoeShape?: AoeShape;
  /** Authored cap after shaped area selection; absent preserves all resolved targets. */
  readonly maxTargets?: number;
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
