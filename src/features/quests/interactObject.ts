import { CAIN_CAGE } from '@/engine/map/cain-quest';
import { rescueCain } from './cainQuestActions';
import { loadQuestItems, questItemSource, type QuestEncounterItemDef, type QuestToolDef, type QuestComponentDef, type QuestDeliveryDef } from '@/data/loaders/quest-items';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from '@/stores/inventoryStore';
import { withQuestTransaction, questActionPreflight, eligibleQuestObjective, publishQuestItemChange } from './questTransaction';
import { loadQuests } from '@/data/loaders/quests';
import { subAreas } from '@/data/index';
import { listAreaObjectTargets, objectInteractionStatus } from '@/engine/map/questInteractions';
import { useMapStore } from '@/stores/mapStore';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { areaQuestInsertions } from './questCrafting';
import { areaQuestActions } from './questActions';
import { areaAct5QuestActions } from './act5QuestActions';
import { PRISON_QUEST } from '@/engine/map/act5-admission';

export { assembleQuestItem, questAssemblyStatus, areaQuestInsertions, questInsertionStatus, insertQuestItem } from './questCrafting';

export type ObjectActionResult = 'ok' | 'already-read' | 'not-eligible' | 'not-ready'
  | 'no-player' | 'combat-active' | 'locked-area' | 'unknown-area' | 'claim-in-progress' | 'grant-failed';

/** Supported object identities come from canonical authored objectives, never inferred legacy areas. */
export function areaObjectTargets(act: number, areaId: string): readonly string[] {
  return listAreaObjectTargets(loadQuests().filter(quest => quest.id !== PRISON_QUEST), subAreas,
    { actId: `acts/act${String(act)}`, areaId });
}

/**
 * Explicitly visit an authored area object without starting combat or reading it.
 * Refuses active combat, unavailable saves and locked/mismatched acts before mutation.
 * Throws the existing typed wave/restore/receipt refusals.
 */
export function travelToAreaObjects(act: number, areaId: string): ObjectActionResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  if (!hasAreaObjects(act, areaId)) return 'unknown-area';
  const map = useMapStore.getState();
  if (!map.isActUnlocked(act)) return 'locked-area';
  map.setCurrentLocation(act, areaId);
  return 'ok';
}

/**
 * Read one object at the live saved location. Only an explicit eligible event
 * advances objectives; completion and rewards remain separate. No combat receipt
 * is needed after Continue/import. Throws typed ownership/receipt refusals.
 */
export function interactWithAreaObject(targetId: string): ObjectActionResult {
  if (targetId === CAIN_CAGE) return rescueCain();
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  const map = useMapStore.getState();
  const area = resolveSubArea(map.currentAct, map.currentSubAreaId);
  const actId = `acts/act${String(map.currentAct)}`;
  if (!area || area.actId !== actId) return 'unknown-area';
  if (!map.isActUnlocked(map.currentAct)) return 'locked-area';
  if (!areaObjectTargets(map.currentAct, area.id).includes(targetId)) return 'not-eligible';
  const event = { actId, areaId: area.id, targetId };
  const status = objectInteractionStatus(loadQuests(), subAreas, map.questProgress, event);
  if (status === 'completed' || status === 'claimed') return 'already-read';
  if (status !== 'ready') return 'not-eligible';
  map.recordObjectInteraction(event);
  return 'ok';
}

/** Objective-bound tools placed at this canonical authored location. Listing grants nothing. */
export function areaQuestTools(act: number, areaId: string): readonly (QuestToolDef | QuestComponentDef | QuestDeliveryDef | QuestEncounterItemDef)[] {
  const quests = loadQuests();
  return loadQuestItems().filter((item): item is QuestToolDef | QuestComponentDef | QuestDeliveryDef | QuestEncounterItemDef =>
    (item.kind === 'tool' || item.kind === 'component' || item.kind === 'delivery' || item.kind === 'encounter') &&
    quests.some(quest => quest.id === item.sourceQuestId && quest.actId === `acts/act${String(act)}` &&
      quest.objectives.some(objective => objective.id === item.sourceObjectiveId && objective.areaId === areaId)));
}

/** Whether an explicit visit can show a supported Read or Recover object. */
export function hasAreaObjects(act: number, areaId: string): boolean {
  return areaObjectTargets(act, areaId).length > 0 || areaQuestTools(act, areaId).length > 0 ||
    areaQuestInsertions(act, areaId).length > 0 || areaQuestActions(act, areaId).length > 0 ||
    areaAct5QuestActions(act, areaId).length > 0;
}

/** Durable recovery availability; execution additionally checks hydration, combat and ownership guards. */
export function questToolStatus(source: string): 'ready' | 'owned' | 'consumed' | 'unavailable' {
  const map = useMapStore.getState();
  const area = resolveSubArea(map.currentAct, map.currentSubAreaId);
  if (!area || !map.isActUnlocked(map.currentAct)) return 'unavailable';
  const tool = areaQuestTools(map.currentAct, area.id).find(item => questItemSource(item) === source);
  if (!tool || !Object.hasOwn(map.questProgress, tool.sourceQuestId)) return 'unavailable';
  const quest = loadQuests().find(row => row.id === tool.sourceQuestId);
  const ledger = useInventoryStore.getState().questItems;
  if (Object.hasOwn(ledger, source)) return ledger[source]?.state === 'consumed' ? 'consumed' : 'owned';
  if (!quest || !eligibleQuestObjective(quest, tool.sourceObjectiveId)) return 'unavailable';
  if ((tool.kind === 'delivery' || tool.kind === 'component' && tool.requiresAreaClear === true) &&
    !map.clearedSubAreas.includes(area.id)) return 'unavailable';
  if ((tool.kind === 'component' || tool.kind === 'encounter') && tool.requiredActionSource !== undefined &&
    (!Object.hasOwn(map.questReceipts, tool.requiredActionSource) || map.questReceipts[tool.requiredActionSource] !== true)) return 'unavailable';
  return 'ready';
}

export type RecoverToolResult = ObjectActionResult | 'already-owned' | 'claim-in-progress' | 'grant-failed';

/**
 * Recover one exact authored tool at the live location. Only its owned receipt and
 * objective flag change; legacy true flags may recover a missing receipt explicitly.
 * Synchronous failures restore both domains, retaining the lock through restoration.
 * Failed restoration throws AggregateError; intermediate writes are observable.
 */
export function recoverQuestTool(source: string): RecoverToolResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<RecoverToolResult>(() => {
    const map = useMapStore.getState();
    const inventory = useInventoryStore.getState();
    try { validateQuestItemLedger(inventory.questItems, map.questProgress, map.questReceipts); }
    catch { return 'not-eligible'; }
    const status = questToolStatus(source);
    if (status === 'owned' || status === 'consumed') return 'already-owned';
    if (status !== 'ready') return 'not-eligible';
    const tool = loadQuestItems().find((item): item is QuestToolDef | QuestComponentDef | QuestDeliveryDef | QuestEncounterItemDef =>
      (item.kind === 'tool' || item.kind === 'component' || item.kind === 'delivery' || item.kind === 'encounter') && questItemSource(item) === source);
    if (!tool) return 'not-eligible';
    const progress = map.questProgress[tool.sourceQuestId];
    if (!progress) return 'not-eligible';
    const nextProgress = { ...progress, objectives: { ...progress.objectives, [tool.sourceObjectiveId]: true } };
    const nextItems = { ...inventory.questItems, [source]: { itemId: tool.id, state: 'owned' as const } };
    return publishQuestItemChange(tool.sourceQuestId, nextProgress, nextItems);
  });
}
