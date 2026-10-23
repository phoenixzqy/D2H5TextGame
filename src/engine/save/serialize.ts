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
  type SocketInventorySaveData,
  type QuestActionReceipts,
  type CampaignMapSaveData,

  type MapSaveData,
  type MetaSaveData,
  type FormationPreferences
} from '../types/save';
import type { Player } from '../types/entities';
import { readMaterialActionState, type MaterialActionReceipt } from '../crafting/action-state';
import { readMaterialLedger } from './material-state';

/** Inputs required to assemble a {@link SaveCurrent}. */
export interface BuildSaveInput {
  readonly player: Player;
  readonly inventory: Pick<SocketInventorySaveData, 'backpack' | 'stash' | 'equipped' | 'currencies'> & Partial<Omit<SocketInventorySaveData, 'backpack' | 'stash' | 'equipped' | 'currencies' | 'latestMaterialAction'>> & { readonly latestMaterialAction?: MaterialActionReceipt | null };
  readonly mercs: SaveCurrent['mercs'];
  readonly map: MapSaveData & { readonly questReceipts?: QuestActionReceipts } & Partial<Pick<CampaignMapSaveData, 'questTitles' | 'questDifficulties' | 'selectedTitle' | 'selectedDifficulty' | 'nightmareClearedSubAreas' | 'challengeOrdinals'>>;
  readonly meta: MetaSaveData;
  readonly formation: FormationPreferences;
  readonly timestamp?: number;
}

/** Build a {@link SaveCurrent} blob from in-memory state. Pure. */
export function buildSave(input: BuildSaveInput): SaveCurrent {
  // Only truly absent trusted legacy input defaults; present corruption is never erased.
  const materials = readMaterialLedger(input.inventory, true);
  const questItems = Object.hasOwn(input.inventory, 'questItems') ? input.inventory.questItems : {};
  if (questItems === undefined) throw new Error('Invalid save: present questItems must be a ledger');
  const questReceipts = Object.hasOwn(input.map, 'questReceipts') ? input.map.questReceipts : {};
  if (questReceipts === undefined) throw new Error('Invalid save: present questReceipts must be a receipt map');
  const { latestMaterialAction, ...owned } = input.inventory;
  if (Object.hasOwn(input.inventory, 'latestMaterialAction') && latestMaterialAction === undefined) {
    throw new Error('Invalid save: present material receipt is undefined');
  }
  const inventory: SocketInventorySaveData = { questServices: {}, legacyGearQuarantine: [], socketQuarantine: [],
    materialActionOrdinal: 0, ...owned, questItems, materials,
    ...(latestMaterialAction == null ? {} : { latestMaterialAction }) };
  readMaterialActionState(inventory);
  return {
    version: CURRENT_SAVE_VERSION,
    timestamp: input.timestamp ?? Date.now(),
    player: { ...input.player, equipment: Object.values(input.inventory.equipped).filter(item => item !== null) },
    inventory,
    mercs: { ...input.mercs, ownedMercs: input.mercs.ownedMercs.map(merc => ({ ...merc,
      equipment: Object.values(input.mercs.mercEquipment[merc.id] ?? {}).filter((item): item is NonNullable<typeof item> => item != null) })) },
    map: { questTitles: {}, questDifficulties: {}, selectedTitle: null, selectedDifficulty: 'normal',
      nightmareClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0 }, ...input.map, questReceipts },
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
export function toJsonSafe(save: unknown): unknown {
  return JSON.parse(
    JSON.stringify(save, (_key, value: unknown): unknown => {
      if (value instanceof Map) return [...value.entries()];
      if (value instanceof Set) return [...value.values()];
      return value;
    })
  );
}
