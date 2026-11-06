/**
 * Monster definitions
 * @module engine/types/monsters
 */

/** Complete authored status immunities supported by the monster data schema. */
export type MonsterStatusImmunity = 'freeze' | 'poison' | 'plague' | 'all-except-stun';

/**
 * Monster definition (data-driven)
 * Matches the simplified format from Diablo2TextGame.md §7.2
 */
export interface MonsterDef {
  readonly id: string;
  readonly name: string;
  /** Explicit authored undead identity; absent legacy definitions remain unclassified. */
  readonly undead?: boolean;
  /** Complete status rejection, independent of elemental damage resistance. */
  readonly statusImmunities?: readonly MonsterStatusImmunity[];
  /** Complete typed damage rejection, independent of resistance and status immunity. */
  readonly damageImmunities?: readonly import('./attributes').DamageType[];
  /** Additional typed damage immunity only for the resolved champion tier. */
  readonly championDamageImmunities?: readonly import('./attributes').DamageType[];
  /** Boss Stun duration coefficient, replacing the generic boss reduction once. */
  readonly stunDurationMultiplier?: number;
  /** Finite critical damage multiplier >=1; absent preserves the tier default. */
  readonly critDamage?: number;
  /** Passive wave-local cold/Chill pulse, independent of active skill cooldowns. */
  readonly frostAura?: {
    readonly damage: number;
    readonly intervalMs: number;
    readonly chillDurationMs: number;
  };
  
  /** Base life at level 1 [min, max] */
  readonly life: readonly [number, number];
  
  /** Life growth per level [min, max] */
  readonly lifeGrowth: readonly [number, number];

  /** Ordinary attack at level one; must be paired with attackGrowth. */
  readonly attack?: readonly [number, number];
  /** Ordinary attack growth per level; finite, nonnegative, ordered endpoints. */
  readonly attackGrowth?: readonly [number, number];
  
  /** Skill IDs this monster can use */
  readonly skills: readonly string[];
  /** Cooldown seconds >=1 by canonical monster.* ID; absent keys retain shared skill timing. */
  readonly skillCooldownOverrides?: Readonly<Record<string, number>>;
  
  /** Base attack speed */
  readonly attackSpeed?: number;
  /** Optional authored ordinary attack; does not consume a skill cooldown. */
  readonly basicAttack?: { readonly damage: readonly [number, number]; readonly damageType: import('./attributes').DamageType };
  /** Optional sticky low-life bonuses; base stats remain unchanged. */
  readonly enrage?: {
    readonly lifeFraction: number;
    readonly attackSpeedMultiplier: number;
    /** Additive direct-damage increase in percent; absent means zero. Excludes thorns. */
    readonly damagePct?: number;
  };
  
  /** Base defense */
  readonly defense?: number;
  /** Independent flat magical mitigation before level growth and tier scaling. */
  readonly magicResist?: number;
  readonly magicResistGrowth?: number;
  
  /** Base resistances */
  readonly resistances?: {
    readonly fire?: number;
    readonly cold?: number;
    readonly lightning?: number;
    readonly poison?: number;
    readonly arcane?: number;
    readonly physical?: number;
  };
  
  /** Experience reward at level 1 */
  readonly baseExperience: number;
  
  /** Can this monster be an elite? */
  readonly canBeElite: boolean;
  
  /** Can this monster be a boss? */
  readonly canBeBoss: boolean;
  
  /** Elite affixes pool (if canBeElite) */
  readonly eliteAffixes?: readonly string[];
}

/**
 * Elite affix definition
 */
export interface EliteAffixDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  /** Stat multipliers */
  readonly multipliers?: {
    readonly life?: number;
    readonly damage?: number;
    readonly speed?: number;
  };
  
  /** Granted skill IDs */
  readonly grantsSkills?: readonly string[];
  
  /** Resistances */
  readonly resistances?: {
    readonly fire?: number;
    readonly cold?: number;
    readonly lightning?: number;
    readonly poison?: number;
    readonly arcane?: number;
    readonly physical?: number;
  };
}
