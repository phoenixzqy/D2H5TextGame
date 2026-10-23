import { loadQuestActions, questActionInputs, type QuestItemActionDef } from '@/data/loaders/quest-actions';
import { questObjectivePrerequisitesMet } from '@/engine/map/questStages';
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
  if (map.currentSubAreaId === null || !map.isActUnlocked(map.currentAct)) return 'unavailable';
  const action = areaQuestActions(map.currentAct, map.currentSubAreaId).find(row => row.receiptSource === source);
  if (!action) return 'unavailable';
  const items = useInventoryStore.getState().questItems;
  try { validateQuestActionReceipts(map.questReceipts, map.questProgress, items); }
  catch { return 'unavailable'; }
  if (Object.hasOwn(map.questReceipts, source)) return 'consumed';
  const row = Object.hasOwn(map.questProgress, action.questId) ? map.questProgress[action.questId] : undefined;
  const quest = loadQuests().find(definition => definition.id === action.questId);
  if (!row || row.id !== action.questId || row.rewardClaimed === true ||
    !quest || !quest.objectives.every(objective => Object.hasOwn(row.objectives, objective.id) && typeof row.objectives[objective.id] === 'boolean') ||
    (action.completeObjectiveId === undefined
      ? row.status !== 'inProgress' || !quest.objectives.every(objective => row.objectives[objective.id] === false)
      : !(row.status === 'inProgress' && row.objectives[action.completeObjectiveId] === false ||
          row.status === 'completed' && quest.objectives.every(objective => row.objectives[objective.id] === true)) ||
        !questObjectivePrerequisitesMet(quest, row.objectives, action.completeObjectiveId))) return 'unavailable';
  return questActionInputs(action).every(input => Object.hasOwn(items, input.inputSource) &&
    items[input.inputSource]?.itemId === input.itemId && items[input.inputSource]?.state === 'owned') ? 'ready' : 'unavailable';
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
    const nextProgress = action.completeObjectiveId === undefined ? progress : { ...progress, status: 'completed' as const,
      objectives: { ...progress.objectives, [action.completeObjectiveId]: true } };
    return publishQuestItemChange(action.questId, nextProgress,
      { ...useInventoryStore.getState().questItems, ...Object.fromEntries(questActionInputs(action).map(input =>
        [input.inputSource, { itemId: input.itemId, state: 'consumed' as const }])) },
      { ...map.questReceipts, [source]: true });
  });
}
