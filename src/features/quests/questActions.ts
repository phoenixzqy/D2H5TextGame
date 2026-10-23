import { loadQuestActions, type QuestItemActionDef } from '@/data/loaders/quest-actions';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { loadQuests } from '@/data/loaders/quests';
import { validateQuestActionReceipts } from '@/engine/save/validate';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { publishQuestItemChange, questActionPreflight, withQuestTransaction } from './questTransaction';

export type QuestActionResult = 'ok' | 'not-eligible' | 'already-consumed' | 'not-ready' | 'no-player'
  | 'combat-active' | 'claim-in-progress' | 'grant-failed';

/** List authored actions at an exact canonical destination; listing has no effects. */
export function areaQuestActions(act: number, areaId: string): readonly QuestItemActionDef[] {
  const area = resolveSubArea(act, areaId);
  return area?.id === areaId && area.actId === `acts/act${String(act)}`
    ? loadQuestActions().filter(action => action.areaId === areaId) : [];
}

/** Durable availability for one authored item action at the live location. */
export function questActionStatus(source: string): 'ready' | 'consumed' | 'unavailable' {
  const map = useMapStore.getState();
  if (!map.isActUnlocked(map.currentAct)) return 'unavailable';
  const action = areaQuestActions(map.currentAct, map.currentSubAreaId).find(row => row.receiptSource === source);
  if (!action) return 'unavailable';
  const items = useInventoryStore.getState().questItems;
  try { validateQuestActionReceipts(map.questReceipts, map.questProgress, items); }
  catch { return 'unavailable'; }
  if (Object.hasOwn(map.questReceipts, source)) return 'consumed';
  const row = Object.hasOwn(map.questProgress, action.questId) ? map.questProgress[action.questId] : undefined;
  const quest = loadQuests().find(definition => definition.id === action.questId);
  if (!row || row.id !== action.questId || row.status !== 'inProgress' || row.rewardClaimed === true ||
    !quest?.objectives.every(objective => Object.hasOwn(row.objectives, objective.id) && row.objectives[objective.id] === false)) return 'unavailable';
  const input = Object.hasOwn(items, action.inputSource) ? items[action.inputSource] : undefined;
  return input?.itemId === action.itemId && input.state === 'owned' ? 'ready' : 'unavailable';
}

/** Explicit item-consuming action; progress and rewards are separate. */
export function executeQuestAction(source: string): QuestActionResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<QuestActionResult>(() => {
    const status = questActionStatus(source);
    if (status === 'consumed') return 'already-consumed';
    if (status !== 'ready') return 'not-eligible';
    const action = loadQuestActions().find(row => row.receiptSource === source);
    if (!action) return 'not-eligible';
    const map = useMapStore.getState(), progress = map.questProgress[action.questId];
    if (!progress) return 'not-eligible';
    return publishQuestItemChange(action.questId, progress,
      { ...useInventoryStore.getState().questItems, [action.inputSource]: { itemId: action.itemId, state: 'consumed' } },
      { ...map.questReceipts, [source]: true });
  });
}
