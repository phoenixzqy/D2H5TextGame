/**
 * Entity types (player, monsters, mercenaries, summons)
 * @module engine/types/entities
 */

import type { CoreStats, DerivedStats } from './attributes';
import type { StatusEffect, CooldownState, SkillDef } from './skills';
import type { Item } from './items';

/**
 * Team enumeration
 */
export type Team = 'player' | 'enemy';

/**
 * Unit type
 */
export type UnitType = 'player' | 'mercenary' | 'monster' | 'summon';

/**
 * Base unit - common fields for all combat entities
 */
export interface Unit {
  readonly id: string;
  readonly name: string;
  readonly type: UnitType;
  readonly team: Team;
  readonly level: number;
  
  /** Core stats */
  readonly coreStats: CoreStats;
  
  /** Derived stats */
  readonly derivedStats: DerivedStats;
  
  /** Active status effects */
  readonly statusEffects: readonly StatusEffect[];
  
  /** Skill cooldowns */
  readonly cooldowns: readonly CooldownState[];
  
  /** Available skills */
  readonly skills: readonly SkillDef[];
  
  /** Skill combo order (for active skills) */
  readonly comboOrder: readonly string[]; // skill IDs in priority order
  
  /** Is this unit alive? */
  readonly alive: boolean;
  
  /** Current position in turn order */
  readonly turnOrder: number;
}

/**
 * Player character
 */
export interface Player extends Unit {
  readonly type: 'player';
  readonly team: 'player';
  
  /** Character class */
  readonly class: string;
  
  /** Total experience */
  readonly experience: number;
  
  /** Experience needed for next level */
  readonly experienceToNextLevel: number;
  
  /** Available stat points */
  readonly statPoints: number;
  
  /** Available skill points */
  readonly skillPoints: number;
  
  /**
   * Allocated skill levels keyed by skill id. When a skill point is spent
   * via `usePlayerStore.allocateSkillPoint`, the matching entry is
   * incremented. Absent entries are treated as level 0 (unallocated).
   */
  readonly skillLevels?: Readonly<Record<string, number>>;
  
  /** Equipped items */
  readonly equipment: readonly Item[];
}

/**
 * Mercenary
 */
export interface Mercenary extends Unit {
  readonly type: 'mercenary';
  readonly team: 'player';
  
  /** Mercenary archetype/class */
  readonly archetype: string;
  
  /** Rarity tier (for gacha mercs) */
  readonly rarity: 'R' | 'SR' | 'SSR';
  
  /** Equipped items (mercs can equip gear) */
  readonly equipment: readonly Item[];
}

/**
 * Monster
 */
export interface Monster extends Unit {
  readonly type: 'monster';
  readonly team: 'enemy';
  
  /** Monster archetype ID */
  readonly archetypeId: string;
  
  /** Is this an elite? */
  readonly elite: boolean;
  
  /** Is this a boss? */
  readonly boss: boolean;
  
  /** Affixes (for elite/champion packs) */
  readonly affixes?: readonly string[];
}

/**
 * Summon (player or enemy summon)
 */
export interface Summon extends Unit {
  readonly type: 'summon';
  
  /** Owner unit ID */
  readonly ownerId: string;
  
  /** Summon duration remaining (-1 = permanent) */
  readonly duration: number;
}

/**
 * Battle snapshot - immutable state of a battle at a point in time
 */
export interface BattleSnapshot {
  readonly turn: number;
  readonly playerUnits: readonly Unit[];
  readonly enemyUnits: readonly Unit[];
  readonly turnOrder: readonly string[]; // unit IDs in order of action
}
