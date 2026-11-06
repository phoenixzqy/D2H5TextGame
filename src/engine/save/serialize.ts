import { ANYA_DOMAIN, validateAnyaQuestGraph } from '../map/anya-quest';
import { ACT2_CACHE_DOMAINS, validateAct2CacheGraphs } from '../map/act2-cache-quests';
import { FARA_DOMAIN, validateFaraQuestGraph } from '../map/fara-quest';
import { COW_DOMAIN, validateCowQuestGraph } from '../map/cow-quest';
import { readBountySaveField } from './bounty-state';
import { readRecruitmentSaveFields, type RecruitmentHistoryState } from './recruitment-state';
import { readRespecsRemaining } from '../progression/respec';
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
  type QuestActionReceipts,
  type Native24MapSaveData,

  type MapSaveData,
  type MetaSaveData,
  type FormationPreferences
} from '../types/save';
import type { Player } from '../types/entities';
import { readMaterialActionState, type MaterialActionReceipt } from '../crafting/action-state';
import { readMaterialLedger } from './material-state';
import type { EndgameState } from '../endgame/types';
import { readEndgameSaveField } from './endgame-state';
import { validateNative24ReplayFields } from './act5-campaign';
import { validateNativeCharmState } from './native-charm-state';
import { repairCharmResourceCache, repairMalahResourceCache } from './equipment-rate-cache';
import { loadCountedQuestItems } from '../../data/loaders/counted-quest-items';
import { validateCountedQuestGraphs } from '../map/counted-quest';

/** Inputs required to assemble a {@link SaveCurrent}. */
export interface BuildSaveInput {
  readonly endgame?: EndgameState;
  readonly player: Player;
  readonly inventory: Pick<SaveCurrent['inventory'], 'backpack' | 'stash' | 'equipped' | 'currencies'> & Partial<Omit<SaveCurrent['inventory'], 'backpack' | 'stash' | 'equipped' | 'currencies' | 'latestMaterialAction'>> & { readonly latestMaterialAction?: MaterialActionReceipt | null };
  readonly mercs: Omit<SaveCurrent['mercs'], 'recruitmentProgress'> & Partial<Pick<SaveCurrent['mercs'], 'recruitmentProgress'>>;
  readonly map: MapSaveData & { readonly questReceipts?: QuestActionReceipts; readonly bounties?: SaveCurrent['map']['bounties'] } & Partial<Pick<Native24MapSaveData, 'questTitles' | 'questDifficulties' | 'selectedTitle' | 'selectedDifficulty' | 'nightmareClearedSubAreas' | 'hellClearedSubAreas' | 'challengeOrdinals'>>;
  readonly meta: MetaSaveData & { readonly recruitmentState?: RecruitmentHistoryState };
  readonly formation: FormationPreferences;
  readonly timestamp?: number;
}

/** Build a {@link SaveCurrent} blob from in-memory state. Pure. */
export function buildSave(input: BuildSaveInput): SaveCurrent {
  const recruitment = readRecruitmentSaveFields(input, true);
  const bounties = readBountySaveField(input.map, true);
  validateNative24ReplayFields(input.map, true);
  // Only truly absent trusted legacy input defaults; present corruption is never erased.
  const materials = readMaterialLedger(input.inventory, true);
  const questItems = Object.hasOwn(input.inventory, 'questItems') ? input.inventory.questItems : {};
  if (questItems === undefined) throw new Error('Invalid save: present questItems must be a ledger');
  const questReceipts = Object.hasOwn(input.map, 'questReceipts') ? input.map.questReceipts : {};
  if (questReceipts === undefined) throw new Error('Invalid save: present questReceipts must be a receipt map');
  const countedSources = loadCountedQuestItems();
  validateCountedQuestGraphs(input.map.questProgress, questItems, countedSources);
  validateAct2CacheGraphs(input.map.questProgress, questItems, ACT2_CACHE_DOMAINS);
  validateFaraQuestGraph(input.map.questProgress, questReceipts, FARA_DOMAIN);
  validateCowQuestGraph(input.map.questProgress, questItems, questReceipts, COW_DOMAIN);
  validateAnyaQuestGraph(input.map.questProgress, questItems, questReceipts, input.inventory.questServices ?? {}, ANYA_DOMAIN);
  const endgame = readEndgameSaveField(input, { questItems, questReceipts, questProgress: input.map.questProgress }, true);
  const { latestMaterialAction, ...owned } = input.inventory;
  if (Object.hasOwn(input.inventory, 'latestMaterialAction') && latestMaterialAction === undefined) {
    throw new Error('Invalid save: present material receipt is undefined');
  }
  const inventory: SaveCurrent['inventory'] = { questServices: {}, legacyGearQuarantine: [], socketQuarantine: [],
    materialActionOrdinal: 0, ...owned, questItems, materials,
    ...(latestMaterialAction == null ? {} : { latestMaterialAction }) };
  readMaterialActionState(inventory);
  const save: SaveCurrent = {
    version: CURRENT_SAVE_VERSION,
    endgame,
    timestamp: input.timestamp ?? Date.now(),
    player: { ...input.player, respecsRemaining: readRespecsRemaining(input.player, true), equipment: Object.values(input.inventory.equipped).filter(item => item !== null) },
    inventory,
    mercs: { ...input.mercs, recruitmentProgress: recruitment.recruitmentProgress, ownedMercs: input.mercs.ownedMercs.map(merc => ({ ...merc,
      equipment: Object.values(input.mercs.mercEquipment[merc.id] ?? {}).filter((item): item is NonNullable<typeof item> => item != null) })) },
    map: { questTitles: {}, questDifficulties: {}, selectedTitle: null, selectedDifficulty: 'normal',
      nightmareClearedSubAreas: [], hellClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0, hell: 0 }, ...input.map, questReceipts, bounties },
    meta: { ...input.meta, recruitmentState: recruitment.recruitmentState },
    formation: input.formation
  };
  validateNativeCharmState(save);
  return repairMalahResourceCache(repairCharmResourceCache(save), { countedSources, anya: ANYA_DOMAIN });
}

/** Serialize a save with Map entries and Set values preserved as JSON arrays. */
export function stringifySave(save: unknown, space?: number): string {
  // JSON.stringify may return undefined for an unsupported root value.
  const json: unknown = JSON.stringify(save, (_key, value: unknown): unknown => {
    if (value instanceof Map) return [...value.entries()];
    if (value instanceof Set) return [...value.values()];
    return value;
  }, space);
  if (typeof json !== 'string') throw new Error('Invalid save: cannot serialize value');
  return json;
}

/** Convert a save to a JSON-safe object, preserving Map/Set contents as arrays. */
export function toJsonSafe(save: unknown): unknown {
  return JSON.parse(stringifySave(save));
}
