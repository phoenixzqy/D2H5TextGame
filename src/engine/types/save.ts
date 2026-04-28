/**
 * Save system types
 * @module engine/types/save
 */

import type { Player, Mercenary } from './entities';
import type { Inventory } from './items';
import type { MapProgress } from './maps';

/**
 * Save file version
 */
export type SaveVersion = 1;

/**
 * Settings
 */
export interface Settings {
  readonly locale: 'zh-CN' | 'en';
  readonly stealthMode: boolean;
  readonly soundEnabled: boolean;
  readonly musicEnabled: boolean;
  readonly combatSpeed: number; // 1 = normal, 2 = 2x, etc.
  readonly autoCombat: boolean;
}

/**
 * Idle state - tracks offline time and multipliers
 */
export interface IdleState {
  /** Last online timestamp (ms since epoch) */
  readonly lastOnline: number;
  
  /** Offline time accumulated (ms) */
  readonly offlineTime: number;
  
  /** Multiplier pool remaining (in seconds of boosted play) */
  readonly multiplierSecondsRemaining: number;
  
  /** Active multiplier (1.0 = none, 2.0 = 2x XP/MF) */
  readonly activeMultiplier: number;
  
  /** Idle farming target (sub-area ID) */
  readonly idleTarget?: string;
}

/**
 * Gacha state
 */
export interface GachaState {
  /** Gacha currency (e.g. "prayer stones") */
  readonly currency: number;
  
  /** Owned mercenary IDs (before recruiting) */
  readonly ownedMercIds: readonly string[];
  
  /** Pity counter (for SSR mercy) */
  readonly pityCounter: number;
}

/**
 * Save file v1
 */
export interface SaveV1 {
  readonly version: 1;
  
  /** Player character */
  readonly player: Player;
  
  /** Inventory (backpack + stash) */
  readonly inventory: Inventory;
  
  /** Owned mercenaries */
  readonly mercenaries: readonly Mercenary[];
  
  /** Active mercenary ID (if any) */
  readonly activeMercId?: string;
  
  /** Map progress */
  readonly mapProgress: MapProgress;
  
  /** Idle/offline state */
  readonly idleState: IdleState;
  
  /** Gacha state */
  readonly gachaState: GachaState;
  
  /** Settings */
  readonly settings: Settings;
  
  /** Save timestamp */
  readonly timestamp: number;
}

/**
 * Migration function type
 */
export type Migration<From = unknown, To = unknown> = (oldSave: From) => To;

/**
 * Migrations map
 * Keyed by target version
 * 
 * Example:
 * MIGRATIONS[2] = (v1: SaveV1) => SaveV2 { ... }
 */
export const MIGRATIONS: Record<number, Migration> = {
  // Placeholder: Add migrations when bumping save version
  // 2: (v1: SaveV1): SaveV2 => { ... }
};
