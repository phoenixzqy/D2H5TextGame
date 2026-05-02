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
  
  /** Weighted monster archetype pool available to this area. */
  readonly monsterPool?: readonly MonsterPoolEntry[];
  
  /** Waves in this sub-area */
  readonly waves: readonly WaveDef[];
  
  /** Does this area have a boss? */
  readonly hasBoss: boolean;
  
  /** Boss encounter (if any) */
  readonly bossEncounter?: Encounter;

  /** Chapter-ending act boss gate. Replaces the final wave when present. */
  readonly chapterBoss?: ChapterBossDef;

  /** Manual challenge wave-generation rules. */
  readonly challenge?: SubAreaChallengeConfig;

  /** Lightweight difficulty tuning for this sub-area. */
  readonly difficulty?: SubAreaDifficultyProfile;
  
  /** Loot table ID */
  readonly lootTable: string;
}

/**
 * Wave definition (roguelike structure)
 */
export interface ChapterBossDef {
  readonly archetypeId: string;
  readonly hp: number;
  readonly atk: number;
  readonly def: number;
  readonly skills: readonly string[];
  readonly dropTable: string;
}

export type WaveKind = 'trash' | 'elite' | 'boss' | 'treasure' | 'shrine';

export interface SubAreaChallengeConfig {
  readonly monsterCount: {
    readonly min: number;
    readonly max: number;
  };
  readonly rotation: readonly WaveKind[];
  readonly manualFinalEliteWaves: number;
  readonly appendChapterBoss?: boolean;
}

export interface SubAreaDifficultyProfile {
  readonly finaleBand?: 'none' | 'penultimate' | 'final';
  readonly monsterLevelBonus?: number;
}

/** Weighted monster-pool entry for a sub-area. */
export interface MonsterPoolEntry {
  readonly archetypeId: string;
  readonly weight: number;
}

export interface WaveDef {
  readonly id: string;
  readonly type: WaveKind;
  
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
    /**
     * Fixed count. Mutually exclusive with `countMin`/`countMax`.
     * Optional — when omitted, the per-tier default range applies
     * (see engine/combat/sub-area-run.ts → defaultCountRange).
     */
    readonly count?: number;
    /** Inclusive lower bound for a randomized count roll. */
    readonly countMin?: number;
    /** Inclusive upper bound for a randomized count roll. */
    readonly countMax?: number;
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
