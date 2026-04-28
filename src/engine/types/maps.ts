/**
 * Map and progression types
 * @module engine/types/maps
 */

/**
 * Act definition
 */
export interface ActDef {
  readonly id: string;
  readonly name: string;
  readonly act: number; // 1-5
  
  /** Town/camp hub name */
  readonly town: string;
  
  /** Sub-areas in this act */
  readonly subAreas: readonly string[]; // sub-area IDs
  
  /** Required level to enter */
  readonly reqLevel: number;
}

/**
 * Sub-area definition
 */
export interface SubAreaDef {
  readonly id: string;
  readonly name: string;
  readonly actId: string;
  
  /** Area level (determines monster level) */
  readonly areaLevel: number;
  
  /** Waves in this sub-area */
  readonly waves: readonly WaveDef[];
  
  /** Does this area have a boss? */
  readonly hasBoss: boolean;
  
  /** Boss encounter (if any) */
  readonly bossEncounter?: Encounter;
  
  /** Loot table ID */
  readonly lootTable: string;
}

/**
 * Wave definition (roguelike structure)
 */
export interface WaveDef {
  readonly id: string;
  readonly type: 'trash' | 'elite' | 'boss' | 'treasure' | 'shrine';
  
  /** Monster encounters */
  readonly encounters?: readonly Encounter[];
  
  /** Loot table override */
  readonly lootTable?: string;
}

/**
 * Encounter - a group of monsters
 */
export interface Encounter {
  readonly id: string;
  
  /** Monster archetype IDs and counts */
  readonly monsters: readonly {
    readonly archetypeId: string;
    readonly count: number;
    readonly elite?: boolean;
    readonly boss?: boolean;
  }[];
  
  /** Monster level */
  readonly level: number;
}

/**
 * Map progress (player state)
 */
export interface MapProgress {
  /** Current act */
  readonly currentAct: number;
  
  /** Current sub-area ID */
  readonly currentSubArea: string;
  
  /** Completed sub-area IDs */
  readonly completedSubAreas: readonly string[];
  
  /** Completed act numbers */
  readonly completedActs: readonly number[];
  
  /** Unlocked waypoints */
  readonly waypoints: readonly string[];
}
