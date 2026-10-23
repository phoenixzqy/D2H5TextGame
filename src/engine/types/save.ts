import type { HistoricalItem } from '../save/historical-items';
/**
 * Save system types
 * @module engine/types/save
 */

import type { QuestServiceLedger } from '../services/quest-services';
import { migrateSaveV19 } from '../save/migrate-v19';
import { migrateSaveV17 } from '../save/migrate-v17';
import { migrateLegacyStarter } from '../save/legacyStarter';
import type { Player, Mercenary } from './entities';
import type { DerivedStats } from './attributes';
import type { EquipmentSlot, Inventory } from './items';
import type { MapProgress } from './maps';
import type { GridPosition } from '../combat/types';
import type { MaterialLedger } from '../loot/materials';
import type { CanonicalSocketItem } from '../items/socket-contents';
import type { MaterialActionReceipt } from '../crafting/action-state';
import type { MaterialRecoveryEntry } from '../crafting/material-actions';

/**
 * Current save format version. Bump this and add an entry to {@link MIGRATIONS}
 * whenever the on-disk shape changes.
 */
export const CURRENT_SAVE_VERSION = 19;

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

/** Historical derived stats permit a validated MR extension but never require it. */
export type LegacyDerivedStats = Omit<DerivedStats, 'magicResist'> & {
  readonly magicResist?: number;
};
export type LegacyPlayer = Omit<Player, 'derivedStats' | 'selectedAuraId' | 'equipment'> & {
  readonly derivedStats: LegacyDerivedStats;
  readonly equipment: readonly HistoricalItem[];
};
export type LegacyMercenary = Omit<Mercenary, 'derivedStats' | 'equipment'> & {
  readonly derivedStats: LegacyDerivedStats;
  readonly equipment: readonly HistoricalItem[];
};

/** Actor payloads retain the historical equipment contract through v18. */
export type HistoricalPlayer = Omit<Player, 'equipment'> & { readonly equipment: readonly HistoricalItem[] };
export type HistoricalMercenary = Omit<Mercenary, 'equipment'> & { readonly equipment: readonly HistoricalItem[] };

/**
 * Save file v1 (legacy — engine-shape, never deployed to users).
 *
 * Retained for migration only. New code should target {@link SaveV2}.
 */
export interface SaveV1 {
  readonly version: 1;
  readonly player: LegacyPlayer;
  readonly inventory: Omit<Inventory, 'backpack' | 'stash' | 'equipment'> & {
    readonly backpack: readonly HistoricalItem[]; readonly stash: readonly HistoricalItem[];
    readonly equipment: ReadonlyMap<EquipmentSlot, HistoricalItem>;
  };
  readonly mercenaries: readonly LegacyMercenary[];
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
  readonly backpack: readonly HistoricalItem[];
  readonly stash: readonly HistoricalItem[];
  readonly equipped: Readonly<Record<string, HistoricalItem | null>>;
  readonly currencies: Readonly<Record<string, number>>;
}

/** One source-bound entitlement or its durable consumed receipt; never equippable gear. */
export interface QuestItemEntry {
  readonly itemId: string;
  readonly state: 'owned' | 'consumed';
}
/** Keys are canonical authored reward/objective sources, not generated item instance IDs. */
export type QuestItemLedger = Readonly<Record<string, QuestItemEntry>>;

/** Finite source-bound action proofs; canonical sources are validated at the save boundary. */
export type QuestActionReceipts = Readonly<Record<string, true>>;

/** Current inventory; the historical v2–v11 inventory shape above stays frozen. */
export interface QuestInventorySaveData extends InventorySaveData {
  readonly questItems: QuestItemLedger;
}

/** Persisted mercenary progression snapshot. */
export interface MercProgressSaveData {
  readonly experience: number;
  readonly experienceToNextLevel: number;
  readonly level?: number;
}

/** Persisted mercenary snapshot. */
export interface MercSaveData {
  readonly ownedMercs: readonly HistoricalMercenary[];
  readonly fieldedMercId: string | null;
  readonly mercEquipment: Readonly<Record<string, Partial<Record<EquipmentSlot, HistoricalItem | null>>>>;
  readonly mercProgress: Readonly<Record<string, MercProgressSaveData>>;
}

/** Historical roster shape; current entities require the MR field. */
export interface LegacyMercSaveData extends Omit<MercSaveData, 'ownedMercs'> {
  readonly ownedMercs: readonly LegacyMercenary[];
}

/** Persisted map snapshot. */
export interface MapSaveData {
  readonly currentAct: number;
  readonly currentSubAreaId: string | null;
  readonly discoveredAreas: readonly string[];
  readonly clearedSubAreas: readonly string[];
  readonly questProgress: Readonly<Record<string, QuestProgressData>>;
}

/** Current map snapshot; historical v2–v14 map shapes remain unchanged. */
export interface QuestMapSaveData extends MapSaveData {
  readonly questReceipts: QuestActionReceipts;
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
  readonly player: LegacyPlayer;
  readonly inventory: InventorySaveData;
  readonly mercs: Omit<LegacyMercSaveData, 'mercEquipment' | 'mercProgress'>;
  readonly map: Omit<MapSaveData, 'clearedSubAreas'>;
  readonly meta: MetaSaveData;
}

/** Save file v3 — folds legacy gold into rune-shards. */
export interface SaveV3 {
  readonly version: 3;
  readonly timestamp: number;
  readonly player: LegacyPlayer;
  readonly inventory: InventorySaveData;
  readonly mercs: Omit<LegacyMercSaveData, 'mercEquipment' | 'mercProgress'>;
  readonly map: Omit<MapSaveData, 'clearedSubAreas'>;
  readonly meta: MetaSaveData;
}

/** Save file v4 — persists map clears and merc equipment/progression. */
export interface SaveV4 {
  readonly version: 4;
  readonly timestamp: number;
  readonly player: LegacyPlayer;
  readonly inventory: InventorySaveData;
  readonly mercs: LegacyMercSaveData;
  readonly map: MapSaveData;
  readonly meta: MetaSaveData;
}

/** Alias to whichever version is current; bump along with {@link CURRENT_SAVE_VERSION}. */
export interface SaveV5 {
  readonly version: 5;
  readonly timestamp: number;
  readonly player: LegacyPlayer;
  readonly inventory: InventorySaveData;
  readonly mercs: LegacyMercSaveData;
  readonly map: MapSaveData;
  readonly meta: MetaSaveData;
}

/** Save file v6 — persists definition-backed item stat rolls and set-piece ids. */
export interface SaveV6 {
  readonly version: 6;
  readonly timestamp: number;
  readonly player: LegacyPlayer;
  readonly inventory: InventorySaveData;
  readonly mercs: LegacyMercSaveData;
  readonly map: MapSaveData;
  readonly meta: MetaSaveData;
}

/** Persisted player-side battle formation. */
export interface FormationPreferences {
  readonly playerPosition: GridPosition;
  readonly mercPosition: GridPosition;
  readonly summonPositions: readonly GridPosition[];
}

/** Save file v7 - persists player-side battle formation preferences. */
export interface SaveV7 {
  readonly version: 7;
  readonly timestamp: number;
  readonly player: LegacyPlayer;
  readonly inventory: InventorySaveData;
  readonly mercs: LegacyMercSaveData;
  readonly map: MapSaveData;
  readonly meta: MetaSaveData;
  readonly formation: FormationPreferences;
}

/** Save file v8 — canonical ownership of the two proven legacy Amazon starters. */
export interface SaveV8 extends Omit<SaveV7, 'version'> {
  readonly version: 8;
}

/** Save file v9 — explicit independent magical mitigation for every saved actor. */
export interface SaveV9 extends Omit<SaveV8, 'version' | 'player' | 'mercs'> {
  readonly version: 9;
  readonly player: Omit<HistoricalPlayer, 'selectedAuraId'>;
  readonly mercs: MercSaveData;
}

/** Frozen v10 selection: widening live Player must never widen historical saves. */
export type SaveV10Player = Omit<HistoricalPlayer, 'selectedAuraId'> & {
  readonly selectedAuraId?: 'paladin.might';
};

/** Save file v10 — optional explicit canonical player aura selection; absent means None. */
export interface SaveV10 extends Omit<SaveV9, 'version' | 'player'> {
  readonly version: 10;
  readonly player: SaveV10Player;
}

/** Save file v11 — exclusive canonical Might or Meditation selection; absent means None. */
export interface SaveV11 extends Omit<SaveV10, 'version' | 'player'> {
  readonly version: 11;
  readonly player: Omit<HistoricalPlayer, 'selectedAuraId'> & {
    readonly selectedAuraId?: 'paladin.might' | 'paladin.meditation';
  };
}

/** Save file v12 — source-bound quest items and durable consumed receipts. */
export interface SaveV12 extends Omit<SaveV11, 'version' | 'inventory' | 'player'> {
  readonly version: 12;
  readonly inventory: QuestInventorySaveData;
  readonly player: HistoricalPlayer;
}

/** Save file v13 — objective-bound retained tools alongside unchanged reward receipts. */
export interface SaveV13 extends Omit<SaveV12, 'version'> {
  readonly version: 13;
}

/** Save file v14 — reciprocal component, assembled output and insertion receipts. */
export interface SaveV14 extends Omit<SaveV13, 'version'> {
  readonly version: 14;
}

/** Save file v15 — explicit source-bound action receipts, never inferred from quest flags. */
export interface SaveV15 extends Omit<SaveV14, 'version' | 'map'> {
  readonly version: 15;
  readonly map: QuestMapSaveData;
}

/** Save v16 adds qualified Act IV victory and exact two-input Forge receipts. */
export interface SaveV16 extends Omit<SaveV15, 'version'> { readonly version: 16 }
export type ReplayProfileId = 'normal' | 'nightmare';
export interface CampaignMapSaveData extends QuestMapSaveData {
  readonly questTitles: Readonly<Record<string, true>>;
  readonly questDifficulties: Readonly<Record<string, true>>;
  readonly selectedTitle: 'titles/slayer_of_baal' | null;
  readonly selectedDifficulty: ReplayProfileId;
  readonly nightmareClearedSubAreas: readonly string[];
  readonly challengeOrdinals: Readonly<Record<ReplayProfileId, number>>;
}
export type LegacyGearOrigin = { readonly container: 'backpack' | 'stash'; readonly index: number }
  | { readonly container: 'equipped'; readonly slot: EquipmentSlot }
  | { readonly container: 'mercEquipment'; readonly mercId: string; readonly slot: EquipmentSlot };
export interface LegacyGearQuarantineEntry {
  readonly item: HistoricalItem;
  readonly origin: LegacyGearOrigin;
}
export interface ServiceInventorySaveData extends QuestInventorySaveData {
  readonly questServices: QuestServiceLedger;
  readonly legacyGearQuarantine: readonly LegacyGearQuarantineEntry[];
}
/** Native v17: actual Act V sources, services, titles and difficulty-scoped replay state. */
export interface SaveV17 extends Omit<SaveV16, 'version' | 'inventory' | 'map'> {
  readonly version: 17;
  readonly inventory: ServiceInventorySaveData;
  readonly map: CampaignMapSaveData;
}
/** Native v18 owns concrete materials independently of conserved legacy currencies. */
export interface MaterialInventorySaveData extends ServiceInventorySaveData {
  readonly materials: MaterialLedger;
}
export interface SaveV18 extends Omit<SaveV17, 'version' | 'inventory'> {
  readonly version: 18;
  readonly inventory: MaterialInventorySaveData;
}
/** Connected socket/action target; not registered until runtime/UI/persistence rollout. */
export interface SocketInventorySaveData extends Omit<MaterialInventorySaveData, 'backpack' | 'stash' | 'equipped'> {
  readonly backpack: readonly CanonicalSocketItem[];
  readonly stash: readonly CanonicalSocketItem[];
  readonly equipped: Readonly<Record<string, CanonicalSocketItem | null>>;
  readonly socketQuarantine: readonly MaterialRecoveryEntry[];
  readonly materialActionOrdinal: number;
  readonly latestMaterialAction?: MaterialActionReceipt;
}
export interface SaveV19 extends Omit<SaveV18, 'version' | 'inventory' | 'player' | 'mercs'> {
  readonly version: 19;
  readonly inventory: SocketInventorySaveData;
  readonly player: Omit<HistoricalPlayer, 'equipment'> & { readonly equipment: readonly CanonicalSocketItem[] };
  readonly mercs: Omit<MercSaveData, 'mercEquipment' | 'ownedMercs'> & {
    readonly mercEquipment: Readonly<Record<string, Partial<Record<EquipmentSlot, CanonicalSocketItem | null>>>>;
    readonly ownedMercs: readonly (Omit<HistoricalMercenary, 'equipment'> & { readonly equipment: readonly CanonicalSocketItem[] })[];
  };
}
export type SaveCurrent = SaveV19;

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
    const equipped: Record<string, HistoricalItem | null> = {};
    const eq: unknown = v1.inventory.equipment;
    if (eq instanceof Map) {
      for (const [slot, item] of eq) equipped[slot as string] = item as HistoricalItem;
    } else if (Array.isArray(eq)) {
      // Already JSON-serialized via toJsonSafe: [[slot, item], ...]
      for (const entry of eq as readonly (readonly [string, HistoricalItem])[]) {
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
  },
  /** v4 to v5: ensure legacy items have rolled-instance containers. */
  5: (raw: unknown): SaveV5 => {
    const v4 = raw as SaveV4;
    const migrateItem = (item: HistoricalItem): HistoricalItem => ({
      ...item,
      ilvl: item.ilvl ?? item.level,
      baseRolls: item.baseRolls ?? {},
      affixes: item.affixes ?? []
    });
    const migrateItemOrNull = (item: HistoricalItem | null): HistoricalItem | null => item ? migrateItem(item) : null;
    return {
      ...v4,
      version: 5,
      inventory: {
        ...v4.inventory,
        backpack: v4.inventory.backpack.map(migrateItem),
        stash: v4.inventory.stash.map(migrateItem),
        equipped: Object.fromEntries(Object.entries(v4.inventory.equipped).map(([slot, item]) => [slot, migrateItemOrNull(item)]))
      },
      mercs: {
        ...v4.mercs,
        mercEquipment: Object.fromEntries(Object.entries(v4.mercs.mercEquipment).map(([mercId, equipment]) => [mercId, Object.fromEntries(Object.entries(equipment).map(([slot, item]) => [slot, migrateItemOrNull(item ?? null)]))]))
      }
    };
  },
  /** v5 to v6: ensure definition-backed item fields have JSON-safe defaults. */
  6: (raw: unknown): SaveV6 => {
    const v5 = raw as SaveV5;
    const migrateItem = (item: HistoricalItem): HistoricalItem => ({
      ...item,
      statRolls: item.statRolls ?? {},
      affixes: item.affixes ?? []
    });
    const migrateItemOrNull = (item: HistoricalItem | null): HistoricalItem | null => item ? migrateItem(item) : null;
    return {
      ...v5,
      version: 6,
      inventory: {
        ...v5.inventory,
        backpack: v5.inventory.backpack.map(migrateItem),
        stash: v5.inventory.stash.map(migrateItem),
        equipped: Object.fromEntries(Object.entries(v5.inventory.equipped).map(([slot, item]) => [slot, migrateItemOrNull(item)]))
      },
      mercs: {
        ...v5.mercs,
        mercEquipment: Object.fromEntries(Object.entries(v5.mercs.mercEquipment).map(([mercId, equipment]) => [mercId, Object.fromEntries(Object.entries(equipment).map(([slot, item]) => [slot, migrateItemOrNull(item ?? null)]))]))
      }
    };
  },
  /** v6 to v7: add persistent player-side battle formation preferences. */
  7: (raw: unknown): SaveV7 => {
    const v6 = raw as SaveV6;
    return {
      ...v6,
      version: 7,
      formation: {
        playerPosition: { row: 1, col: 1 },
        mercPosition: { row: 0, col: 0 },
        summonPositions: [
          { row: 2, col: 0 },
          { row: 2, col: 1 },
          { row: 2, col: 2 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 1, col: 0 },
          { row: 1, col: 2 },
          { row: 0, col: 0 }
        ]
      }
    };
  },
  /** v7 to v8: conservatively transfer a proven legacy starter to canonical gear. */
  8: (raw: unknown): SaveV8 => migrateLegacyStarter(raw as SaveV7),
  /** v8 to v9: add only missing MR; decode validates historical fields first. */
  9: (raw: unknown): SaveV9 => {
    const v8 = raw as SaveV8;
    const addMagicResist = <T extends LegacyPlayer | LegacyMercenary>(unit: T) => ({
      ...unit,
      derivedStats: { ...unit.derivedStats, magicResist: unit.derivedStats.magicResist ?? 0 }
    });
    return {
      ...v8,
      version: 9,
      player: addMagicResist(v8.player),
      mercs: { ...v8.mercs, ownedMercs: v8.mercs.ownedMercs.map(addMagicResist) }
    };
  },
  /** v9 to v10: preserve all data; absent selection remains None. Decode validates both versions. */
  10: (raw: unknown): SaveV10 => ({ ...(raw as SaveV9), version: 10 }),
  /** v10 to v11: widen selection only; frozen v10 is validated before this migration. */
  11: (raw: unknown): SaveV11 => ({ ...(raw as SaveV10), version: 11 }),
  /** v11 to v12: never infer an entitlement or point from historical claimed flags. */
  12: (raw: unknown): SaveV12 => {
    const v11 = raw as SaveV11;
    return { ...v11, version: 12, inventory: { ...v11.inventory, questItems: {} } };
  },
  /** v12 to v13: widen supported sources without inferring or changing any entitlement. */
  13: (raw: unknown): SaveV13 => ({ ...(raw as SaveV12), version: 13 }),
  14: (raw: unknown): SaveV14 => ({ ...(raw as SaveV13), version: 14 }),
  /** v14 to v15: decode validates frozen v14 first; legacy flags grant no action proof. */
  15: (raw: unknown): SaveV15 => {
    const v14 = raw as SaveV14;
    return { ...v14, version: 15, map: { ...v14.map, questReceipts: {} } };
  },
  /** Widen the domain only; flags create no item, proof, consumption, or reward. */
  16: (raw: unknown): SaveV16 => ({ ...(raw as SaveV15), version: 16 }),
  /** Lossless predecessor migration: no proof or reward is inferred from history. */
  17: (raw: unknown): SaveV17 => migrateSaveV17(raw as SaveV16),
  /** Frozen v17 is validated before adding empty ownership; old shards mint no identities. */
  18: (raw: unknown): SaveV18 => {
    const v17 = raw as SaveV17;
    return { ...v17, version: 18, inventory: { ...v17.inventory, materials: {} } };
  },
  /** Decode validates frozen18 before the lossless canonical conversion. */
  19: (raw: unknown): SaveV19 => migrateSaveV19(raw as SaveV18)
};
