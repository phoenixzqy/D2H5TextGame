/**
 * Skill system types for the game engine
 * @module engine/types/skills
 */

import type { DamageType, DamageInfo } from './attributes';
import type { WeaponType, Handedness } from './items';
import type { AoeShape } from '../combat/grid';

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

/**
 * Skill definition
 * This is the immutable template for a skill
 */
export interface SkillDef {
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
  
  /** Damage type (primary) */
  readonly damageType?: DamageType;
  
  /** Status effects applied by this skill */
  readonly appliesStatus?: readonly string[]; // status IDs
  
  /** Healing amount (if any) */
  readonly heal?: {
    readonly min: number;
    readonly max: number;
    readonly target: 'self' | 'ally';
  };
  
  /** Combo tags this skill applies to targets */
  readonly appliesTags?: readonly ComboTag[];
  
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
    readonly damagePerLevel?: number;
    readonly cooldownPerLevel?: number; // negative = reduces CD
    readonly costPerLevel?: number;
    readonly summonMaxCount?: {
      readonly kind: 'first-three-then-every-three' | 'raise-skeleton-1-6-12-cap-3';
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
