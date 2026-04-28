/**
 * Monster definitions
 * @module engine/types/monsters
 */

/**
 * Monster definition (data-driven)
 * Matches the simplified format from Diablo2TextGame.md §7.2
 */
export interface MonsterDef {
  readonly id: string;
  readonly name: string;
  
  /** Base life at level 1 [min, max] */
  readonly life: readonly [number, number];
  
  /** Life growth per level [min, max] */
  readonly lifeGrowth: readonly [number, number];
  
  /** Skill IDs this monster can use */
  readonly skills: readonly string[];
  
  /** Base attack speed */
  readonly attackSpeed?: number;
  
  /** Base defense */
  readonly defense?: number;
  
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
