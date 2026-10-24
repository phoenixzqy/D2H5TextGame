/**
 * Skill system types for the game engine
 * @module engine/types/skills
 */

import type { DamageType, DamageInfo } from './attributes';
import type { WeaponType, Handedness } from './items';
import type { AoeShape } from '../combat/grid';

/** Fraction of current health and maximum-health floors for the exact Static Field skill. */
export interface StaticFieldTuning {
  readonly currentHealthFraction: number;
  readonly normalFloorFraction: number;
  readonly nightmareFloorFraction: number;
}

/** Personal cold-resistance reduction in percentage points, with rank-one base. */
export interface ColdMasteryTuning {
  readonly resistanceReductionPct: number;
  readonly resistanceReductionPerRankPct: number;
}

/**
 * Skill target type
 */
export type SkillTarget =
  | 'self'           // Buffs, self-heal
  | 'single-enemy'   // Single target attack
  | 'all-enemies'    // AOE on all enemies
  | 'area-enemies'   // AOE on subset of enemies (based on threshold or selection)
  | 'single-ally'    // Heal or buff a single ally
  | 'all-allies'     // Buff or heal all allies
  | 'summon';        // Summon a creature

/**
 * Skill trigger type - when does this skill fire?
 */
export type SkillTrigger =
  | 'active'         // Player/monster actively uses (main combo skills)
  | 'passive'        // Always-on bonuses (e.g. masteries)
  | 'on-hit'         // Triggers when landing an attack
  | 'on-kill'        // Triggers when killing an enemy
  | 'on-damaged'     // Triggers when taking damage
  | 'on-dodge';      // Triggers when dodging

/**
 * Combo tag for skill synergy
 * Skills can tag targets/context; next skill in combo checks tags for bonuses
 */
export type ComboTag =
  | 'cold'
  | 'fire'
  | 'lightning'
  | 'poison'
  | 'physical'
  | 'arcane'
  | 'chill'
  | 'burn'
  | 'shock'
  | 'bleed'
  | 'amp-damage';

/**
 * Status effect - debuff, buff, or DoT
 */
export interface StatusEffect {
  readonly id: string;
  readonly name: string;
  
  /** Type of status (buff=positive, debuff=negative, dot=damage over time) */
  readonly type: 'buff' | 'debuff' | 'dot';
  
  /** Duration in turns (0 = instant, -1 = permanent until dispelled) */
  readonly duration: number;
  
  /** Number of times this effect can stack */
  readonly maxStacks: number;
  
  /** Current stack count */
  readonly stacks: number;
  
  /** Remaining duration in turns */
  readonly remaining: number;
  
  /** Damage per turn (for DoT effects) */
  readonly damagePerTurn?: DamageInfo;
  
  /** Stat modifiers (additive) */
  readonly statMods?: {
    readonly attackSpeed?: number;
    readonly defense?: number;
    readonly attack?: number;
    readonly critChance?: number;
    readonly physDodge?: number;
    readonly magicDodge?: number;
  };
  
  /** Resistance modifiers (additive, in percentage points) */
  readonly resistMods?: {
    readonly fire?: number;
    readonly cold?: number;
    readonly lightning?: number;
    readonly poison?: number;
    readonly physical?: number;
    readonly arcane?: number;
  };
  
  /** Tags for combo synergies */
  readonly tags?: readonly ComboTag[];
}

/**
 * Buff - positive status effect
 */
export interface Buff extends StatusEffect {
  readonly type: 'buff';
}

/**
 * Skill cost
 */
export interface SkillCost {
  readonly mana?: number;
  readonly life?: number;
}

/**
 * Equipment requirements that gate skill use.
 *
 * Each named field is a *whitelist*: when present, the equipped weapon
 * must satisfy at least one entry. When absent, that dimension is
 * unconstrained. An empty `requires` object (or no `requires` at all)
 * means the skill is always usable.
 *
 * @see {@link import('../skills/eligibility').canCastSkill}
 */
export interface SkillRequirement {
  readonly weaponType?: readonly WeaponType[];
  readonly handedness?: readonly Handedness[];
}

/** JSON-authored runtime metadata for the first applied status. */
export interface SkillStatusEffectMetadata {
  readonly chance?: number;
  readonly stacksOnApply?: number;
  readonly dotPctOfDamage?: number;
  /** Base duration in simulation milliseconds for authored timed debuffs. */
  readonly durationMs?: number;
  /** Nonnegative percentage-point reduction; production Amplify Damage only. */
  readonly physicalResistReductionPct?: number;
  /** Ordinary-defense reduction percent in [0,100]; mercenary Inner Sight only. */
  readonly defenseReductionPct?: number;
}

/** Explicit secondary on-hit metadata; chance is required to avoid implicit procs. */
export interface SkillSecondaryStatusEffectMetadata {
  readonly chance: number;
  readonly stacksOnApply?: number;
  readonly dotPctOfDamage?: number;
}

/** Currently supported authored secondary statuses, validated by the skill schema. */
export type SkillAdditionalStatusEffects =
  | { readonly freeze: SkillSecondaryStatusEffectMetadata; readonly 'armor-melt'?: never }
  | { readonly freeze?: never; readonly 'armor-melt': SkillArmorMeltMetadata };

/** Exact Meteor secondary metadata; distinct from primary Burn's DoT payload. */
export interface SkillArmorMeltMetadata {
  readonly chance: 1;
  readonly defenseReductionPct: number;
  readonly durationMs: number;
}

/**
 * Skill definition
 * This is the immutable template for a skill
 */
export interface SkillDef {
  /** JSON-owned nonlethal current-health damage; exact player Static Field only. */
  readonly staticField?: StaticFieldTuning;
  /** JSON-owned personal cold penetration; exact player Cold Mastery only. */
  readonly coldMastery?: ColdMasteryTuning;
  /** Native mercenary aura party cold increase, in percentage points. */
  readonly holyFreeze?: { readonly coldDamagePct: number };
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  /** Icon identifier for UI */
  readonly icon?: string;
  
  /** Skill trigger type */
  readonly trigger: SkillTrigger;
  
  /** Target type */
  readonly target: SkillTarget;

  /** Optional 3-column battle-grid AOE shape for area skills. */
  readonly aoeShape?: AoeShape;
  
  /** Cooldown in turns */
  readonly cooldown: number;
  
  /** Resource cost */
  readonly cost: SkillCost;
  
  /** Base damage (if any) */
  readonly damage?: DamageInfo;
  /** Finite nonnegative snapshot Attack percentage; exact Basic/Pierce mercenary rows only. */
  readonly attackDamagePct?: number;
  
  /** Damage type (primary) */
  readonly damageType?: DamageType;
  
  /** Exact Venom-only basic-hit coating; strict JSON schema guards its owner and tuning. */
  readonly venomOnBasicHit?: { readonly attackPct: number; readonly durationMs: number };

  /** Status effects applied by this skill */
  readonly appliesStatus?: readonly string[]; // status IDs
  /** Runtime metadata for the first applied status, such as DoT strength or stacks. */
  readonly statusEffect?: SkillStatusEffectMetadata;
  /** Opt-in metadata for a reviewed secondary status after the primary status. */
  readonly additionalStatusEffects?: SkillAdditionalStatusEffects;
  
  /** Healing amount (if any) */
  readonly heal?: { readonly target: 'self' | 'ally' } & (
    | { readonly min: number; readonly max: number; readonly pctOfMaxLife?: never }
    | { readonly pctOfMaxLife: number; readonly min?: never; readonly max?: never }
  );
  
  /** Combo tags this skill applies to targets */
  readonly appliesTags?: readonly ComboTag[];
 
  /** Summon template id when this skill spawns a creature. */
  readonly summonId?: string;
  /** Reviewed ordinary-action monster summon batch. */
  readonly monsterSummon?: {
    readonly archetypeId: string;
    readonly count: number;
    readonly maxCount: number;
    readonly refundOnDeath: boolean;
  };

  /** Authored fresh-batch basic element cycle; permitted only on the exact Mage skill row. */
  readonly summonBasicAttackElements?: readonly ('fire' | 'cold' | 'lightning' | 'poison')[];
  
  /** Combo tags this skill benefits from (and how much) */
  readonly synergies?: ReadonlyMap<ComboTag, number>; // tag -> damage multiplier
  
  /** Min level required */
  readonly minLevel: number;
  
  /** Skill level (for scaling) */
  readonly level: number;
  
  /** Max skill level */
  readonly maxLevel: number;
  
  /** Scaling per level */
  readonly scaling?: {
    /** Exact Act I Lightning affix min/max growth per effective monster level above one. */
    readonly monsterLevelDamageGrowth?: readonly [number, number];
    readonly damagePerLevel?: number;
    readonly cooldownPerLevel?: number; // negative = reduces CD
    readonly costPerLevel?: number;
    readonly summonMaxCount?: {
      readonly kind: 'first-three-then-every-three' | 'raise-skeleton-1-6-12-cap-3';
    };
    readonly summonStatsPerLevel?: {
      readonly lifeMax?: number;
      readonly attack?: number;
      readonly defense?: number;
      readonly attackSpeed?: number;
      readonly physDodge?: number;
      readonly magicDodge?: number;
    };
    readonly passiveStatsPerLevel?: {
      readonly summonLifePct?: number;
      readonly summonAttackPct?: number;
      readonly summonDefensePct?: number;
      readonly summonResistAllPct?: number;
      readonly fireDamagePct?: number;
      readonly coldDamagePct?: number;
      readonly lightningDamagePct?: number;
      readonly poisonDamagePct?: number;
      readonly arcaneDamagePct?: number;
      readonly physicalDamagePct?: number;
      readonly elementalDamagePct?: number;
      readonly attackPct?: number;
      readonly attackSpeedPct?: number;
      readonly critChancePct?: number;
      readonly lifePct?: number;
      readonly lifeRegenPct?: number;
      readonly resistAllPct?: number;
      readonly thornsPct?: number;
      readonly defensePct?: number;
      readonly physDodgePct?: number;
      readonly magicDodgePct?: number;
      readonly manaRegenPct?: number;
      readonly magicFindPct?: number;
      readonly shieldAbsorbPct?: number;
      readonly boneArmorAbsorb?: number;
      readonly golemLifePct?: number;
      readonly golemAttackSpeed?: number;
    };
  };

  /**
   * Equipment gating. When present, the player's currently equipped
   * weapon must satisfy these requirements for the skill to be usable.
   * If absent, the skill is always available.
   */
  readonly requires?: SkillRequirement;
}

/**
 * Cooldown state for a single skill
 */
export interface CooldownState {
  readonly skillId: string;
  readonly remaining: number;
  readonly total: number;
}
