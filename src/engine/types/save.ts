/**
 * Save system types
 * @module engine/types/save
 */

import type { Player, Mercenary } from './entities';
import type { EquipmentSlot, Inventory, Item } from './items';
import type { MapProgress } from './maps';

/**
 * Current save format version. Bump this and add an entry to {@link MIGRATIONS}
 * whenever the on-disk shape changes.
 */
export const CURRENT_SAVE_VERSION = 4;

/**
 * Save file version (most recent).
 */
export type SaveVersion = typeof CURRENT_SAVE_VERSION;

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
 * Quest progress entry (persisted in {@link SaveV2.map}).
 */
export interface QuestProgressData {
  readonly id: string;
  readonly status: 'locked' | 'available' | 'inProgress' | 'completed';
  readonly objectives: Readonly<Record<string, boolean>>;
  readonly rewardClaimed?: boolean;
}

/**
 * Save file v1 (legacy — engine-shape, never deployed to users).
 *
 * Retained for migration only. New code should target {@link SaveV2}.
 */
export interface SaveV1 {
  readonly version: 1;
  readonly player: Player;
  readonly inventory: Inventory;
  readonly mercenaries: readonly Mercenary[];
  readonly activeMercId?: string;
  readonly mapProgress: MapProgress;
  readonly idleState: IdleState;
  readonly gachaState: GachaState;
  readonly settings: Settings;
  readonly timestamp: number;
}

/**
 * Persisted inventory snapshot. Mirrors `useInventoryStore` shape so save/load
 * is a near-direct copy with no lossy conversion.
 */
export interface InventorySaveData {
  readonly backpack: readonly Item[];
  readonly stash: readonly Item[];
  readonly equipped: Readonly<Record<string, Item | null>>;
  readonly currencies: Readonly<Record<string, number>>;
}

/** Persisted mercenary progression snapshot. */
export interface MercProgressSaveData {
  readonly experience: number;
  readonly experienceToNextLevel: number;
  readonly level?: number;
}

/** Persisted mercenary snapshot. */
export interface MercSaveData {
  readonly ownedMercs: readonly Mercenary[];
  readonly fieldedMercId: string | null;
  readonly mercEquipment: Readonly<Record<string, Partial<Record<EquipmentSlot, Item | null>>>>;
  readonly mercProgress: Readonly<Record<string, MercProgressSaveData>>;
}

/** Persisted map snapshot. */
export interface MapSaveData {
  readonly currentAct: number;
  readonly currentSubAreaId: string | null;
  readonly discoveredAreas: readonly string[];
  readonly clearedSubAreas: readonly string[];
  readonly questProgress: Readonly<Record<string, QuestProgressData>>;
}

/** Persisted meta (settings + idle + gacha) snapshot. */
export interface MetaSaveData {
  readonly settings: Settings;
  readonly idleState: IdleState;
  readonly gachaState: GachaState;
}

/**
 * Save file v2. Slices map 1:1 to Zustand stores
 * to avoid translation logic on every mutation.
 */
export interface SaveV2 {
  readonly version: 2;
  readonly timestamp: number;
  readonly player: Player;
  readonly inventory: InventorySaveData;
  readonly mercs: Omit<MercSaveData, 'mercEquipment' | 'mercProgress'>;
  readonly map: Omit<MapSaveData, 'clearedSubAreas'>;
  readonly meta: MetaSaveData;
}

/** Save file v3 — folds legacy gold into rune-shards. */
export interface SaveV3 {
  readonly version: 3;
  readonly timestamp: number;
  readonly player: Player;
  readonly inventory: InventorySaveData;
  readonly mercs: Omit<MercSaveData, 'mercEquipment' | 'mercProgress'>;
  readonly map: Omit<MapSaveData, 'clearedSubAreas'>;
  readonly meta: MetaSaveData;
}

/** Save file v4 — persists map clears and merc equipment/progression. */
export interface SaveV4 {
  readonly version: 4;
  readonly timestamp: number;
  readonly player: Player;
  readonly inventory: InventorySaveData;
  readonly mercs: MercSaveData;
  readonly map: MapSaveData;
  readonly meta: MetaSaveData;
}

/** Alias to whichever version is current; bump along with {@link CURRENT_SAVE_VERSION}. */
export type SaveCurrent = SaveV4;

/**
 * Migration function type. Each entry receives the previous version's shape
 * (typed `unknown` because old data may be arbitrary JSON) and returns the next.
 */
export type Migration<From = unknown, To = unknown> = (oldSave: From) => To;

/**
 * Migrations keyed by **target** version. To upgrade an N-versioned save to
 * N+1, call `MIGRATIONS[N+1](save)`. {@link runMigrations} handles chaining.
 */
export const MIGRATIONS: Record<number, Migration> = {
  /** v1 (legacy engine-shape) → v2 (store-shape). */
  2: (raw: unknown): SaveV2 => {
    const v1 = raw as SaveV1;
    const equipped: Record<string, Item | null> = {};
    const eq: unknown = v1.inventory.equipment;
    if (eq instanceof Map) {
      for (const [slot, item] of eq) equipped[slot as string] = item as Item;
    } else if (Array.isArray(eq)) {
      // Already JSON-serialized via toJsonSafe: [[slot, item], ...]
      for (const entry of eq as readonly (readonly [string, Item])[]) {
        equipped[entry[0]] = entry[1];
      }
    }
    return {
      version: 2,
      timestamp: v1.timestamp,
      player: v1.player,
      inventory: {
        backpack: v1.inventory.backpack,
        stash: v1.inventory.stash,
        equipped,
        currencies: {}
      },
      mercs: {
        ownedMercs: v1.mercenaries,
        fieldedMercId: v1.activeMercId ?? null
      },
      map: {
        currentAct: v1.mapProgress.currentAct,
        currentSubAreaId: v1.mapProgress.currentSubArea,
        discoveredAreas: v1.mapProgress.completedSubAreas,
        questProgress: {}
      },
      meta: {
        settings: v1.settings,
        idleState: v1.idleState,
        gachaState: v1.gachaState
      }
    };
  },
  /** v2 → v3: fold legacy gold into rune-shards. */
  3: (raw: unknown): SaveV3 => {
    const v2 = raw as SaveV2;
    const { gold, ...restCurrencies } = v2.inventory.currencies;
    const runeShardTotal = (restCurrencies['rune-shard'] ?? 0) + (gold ?? 0);
    return {
      ...v2,
      version: 3,
      inventory: {
        ...v2.inventory,
        currencies: {
          ...restCurrencies,
          ...(runeShardTotal > 0 ? { 'rune-shard': runeShardTotal } : {})
        }
      }
    };
  },
  /** v3 → v4: add newly persisted map and merc slices with safe defaults. */
  4: (raw: unknown): SaveV4 => {
    const v3 = raw as SaveV3;
    const questProgress = Object.fromEntries(
      Object.entries(v3.map.questProgress).map(([id, progress]) => [
        id,
        { ...progress, rewardClaimed: progress.rewardClaimed ?? false }
      ])
    );
    return {
      ...v3,
      version: 4,
      mercs: {
        ...v3.mercs,
        mercEquipment: {},
        mercProgress: {}
      },
      map: {
        ...v3.map,
        clearedSubAreas: [],
        questProgress
      }
    };
  }
};
