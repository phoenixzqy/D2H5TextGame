/**
 * Save serialization helpers (engine-side, no IO).
 *
 * The engine never touches IndexedDB / localStorage. Persistence is delegated
 * to `src/stores/save-adapter.ts` which calls these functions.
 *
 * @module engine/save/serialize
 */

import type { SaveV1, IdleState, GachaState, Settings } from '../types/save';
import type { Player, Mercenary } from '../types/entities';
import type { Inventory } from '../types/items';
import type { MapProgress } from '../types/maps';

/** Inputs required to assemble a {@link SaveV1}. */
export interface BuildSaveInput {
  readonly player: Player;
  readonly inventory: Inventory;
  readonly mercenaries: readonly Mercenary[];
  readonly activeMercId?: string;
  readonly mapProgress: MapProgress;
  readonly idleState: IdleState;
  readonly gachaState: GachaState;
  readonly settings: Settings;
  readonly timestamp?: number;
}

/** Build a {@link SaveV1} blob from in-memory state. Pure. */
export function buildSave(input: BuildSaveInput): SaveV1 {
  return {
    version: 1,
    player: input.player,
    inventory: input.inventory,
    mercenaries: input.mercenaries,
    ...(input.activeMercId !== undefined ? { activeMercId: input.activeMercId } : {}),
    mapProgress: input.mapProgress,
    idleState: input.idleState,
    gachaState: input.gachaState,
    settings: input.settings,
    timestamp: input.timestamp ?? 0
  };
}

/**
 * Convert a save to a JSON-safe plain object. Strips Map/Set instances by
 * walking known fields and converting them to plain arrays.
 *
 * Caller is responsible for any final `JSON.stringify`.
 */
export function toJsonSafe(save: SaveV1): unknown {
  return JSON.parse(
    JSON.stringify(save, (_key, value: unknown): unknown => {
      if (value instanceof Map) return [...value.entries()];
      if (value instanceof Set) return [...value.values()];
      return value;
    })
  );
}
