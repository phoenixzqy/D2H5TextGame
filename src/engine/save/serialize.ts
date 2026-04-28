/**
 * Save serialization helpers (engine-side, no IO).
 *
 * The engine never touches IndexedDB / localStorage. Persistence is delegated
 * to `src/stores/save-adapter.ts` which calls these functions.
 *
 * @module engine/save/serialize
 */

import {
  CURRENT_SAVE_VERSION,
  type SaveCurrent,
  type InventorySaveData,
  type MercSaveData,
  type MapSaveData,
  type MetaSaveData
} from '../types/save';
import type { Player } from '../types/entities';

/** Inputs required to assemble a {@link SaveCurrent}. */
export interface BuildSaveInput {
  readonly player: Player;
  readonly inventory: InventorySaveData;
  readonly mercs: MercSaveData;
  readonly map: MapSaveData;
  readonly meta: MetaSaveData;
  readonly timestamp?: number;
}

/** Build a {@link SaveCurrent} blob from in-memory state. Pure. */
export function buildSave(input: BuildSaveInput): SaveCurrent {
  return {
    version: CURRENT_SAVE_VERSION,
    timestamp: input.timestamp ?? Date.now(),
    player: input.player,
    inventory: input.inventory,
    mercs: input.mercs,
    map: input.map,
    meta: input.meta
  };
}

/**
 * Convert a save to a JSON-safe plain object. Strips Map/Set instances by
 * walking known fields and converting them to plain arrays.
 *
 * Caller is responsible for any final `JSON.stringify`.
 */
export function toJsonSafe(save: SaveCurrent): unknown {
  return JSON.parse(
    JSON.stringify(save, (_key, value: unknown): unknown => {
      if (value instanceof Map) return [...value.entries()];
      if (value instanceof Set) return [...value.values()];
      return value;
    })
  );
}
