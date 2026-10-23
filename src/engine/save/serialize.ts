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
  type QuestItemLedger,
  type MercSaveData,
  type MapSaveData,
  type MetaSaveData,
  type FormationPreferences
} from '../types/save';
import type { Player } from '../types/entities';

/** Inputs required to assemble a {@link SaveCurrent}. */
export interface BuildSaveInput {
  readonly player: Player;
  readonly inventory: InventorySaveData & { readonly questItems?: QuestItemLedger };
  readonly mercs: MercSaveData;
  readonly map: MapSaveData;
  readonly meta: MetaSaveData;
  readonly formation: FormationPreferences;
  readonly timestamp?: number;
}

/** Build a {@link SaveCurrent} blob from in-memory state. Pure. */
export function buildSave(input: BuildSaveInput): SaveCurrent {
  // Only truly absent trusted legacy input defaults; present corruption is never erased.
  const questItems = Object.hasOwn(input.inventory, 'questItems') ? input.inventory.questItems : {};
  if (questItems === undefined) throw new Error('Invalid save: present questItems must be a ledger');
  return {
    version: CURRENT_SAVE_VERSION,
    timestamp: input.timestamp ?? Date.now(),
    player: input.player,
    inventory: { ...input.inventory, questItems },
    mercs: input.mercs,
    map: input.map,
    meta: input.meta,
    formation: input.formation
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
