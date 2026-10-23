import { loadQuestItems, questItemSource, type AssembledQuestItemDef } from '@/data/loaders/quest-items';
import { loadQuests, type QuestDef } from '@/data/loaders/quests';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { QuestItemEntry } from '@/engine/types/save';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { eligibleQuestObjective, publishQuestItemChange, questActionPreflight, withQuestTransaction } from './questTransaction';

export type QuestCraftingStatus = 'ready' | 'owned' | 'consumed' | 'unavailable';
export type QuestCraftingResult = 'ok' | 'not-eligible' | 'already-owned' | 'already-consumed'
  | 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress' | 'grant-failed';

function assembledDefinition(source: string): AssembledQuestItemDef | undefined {
  return loadQuestItems().find((item): item is AssembledQuestItemDef => item.kind === 'assembled' && questItemSource(item) === source);
}

function validLedger(): boolean {
  const map = useMapStore.getState();
  try { validateQuestItemLedger(useInventoryStore.getState().questItems, map.questProgress, map.questReceipts); return true; }
  catch { return false; }
}

/** Action-bound assembly rewards require their actual output, independently of subsequent use or Claim timing. */
export function hasQuestAssemblyCompletion(quest: QuestDef): boolean {
  const outputs = loadQuestItems().filter(item => item.kind === 'assembled' &&
    item.consumeActionId !== undefined && item.sourceQuestId === quest.id);
  if (outputs.length === 0) return true;
  if (!validLedger()) return false;
  const ledger = useInventoryStore.getState().questItems;
  return outputs.every(item => {
    const source = questItemSource(item);
    return Object.hasOwn(ledger, source) && ledger[source]?.itemId === item.id;
  });
}

/** Availability for portable explicit assembly; flags alone never supply ingredients or a tool. */
export function questAssemblyStatus(source: string): QuestCraftingStatus {
  const item = assembledDefinition(source);
  if (!item) return 'unavailable';
  const definitions = loadQuestItems(), ledger = useInventoryStore.getState().questItems;
  if (Object.hasOwn(ledger, source)) return ledger[source]?.state === 'consumed' ? 'consumed' : 'owned';
  const quest = loadQuests().find(row => row.id === item.sourceQuestId);
  if (!quest || !eligibleQuestObjective(quest, item.sourceObjectiveId)) return 'unavailable';
  const owns = (id: string) => {
    const definition = definitions.find(row => row.id === id);
    if (!definition) return false;
    const inputSource = questItemSource(definition);
    return Object.hasOwn(ledger, inputSource) && ledger[inputSource]?.itemId === id && ledger[inputSource].state === 'owned';
  };
  return [item.requiredTool, ...item.ingredients].every(owns) ? 'ready' : 'unavailable';
}

/**
 * Assemble one authored quest item, retaining its tool and consuming its exact
 * ingredient receipts. Rewards are a separate Claim. Legacy repairs preserve
 * already-completed/claimed progress; failures restore both participating domains.
 */
export function assembleQuestItem(source: string): QuestCraftingResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<QuestCraftingResult>(() => {
    if (!validLedger()) return 'not-eligible';
    const status = questAssemblyStatus(source);
    if (status === 'owned' || status === 'consumed') return 'already-owned';
    if (status !== 'ready') return 'not-eligible';
    const item = assembledDefinition(source);
    if (!item) return 'not-eligible';
    const progress = useMapStore.getState().questProgress[item.sourceQuestId];
    const quest = loadQuests().find(row => row.id === item.sourceQuestId);
    if (!quest || !progress) return 'not-eligible';
    const definitions = loadQuestItems();
    const consumed = Object.fromEntries(item.ingredients.map(id => {
      const definition = definitions.find(row => row.id === id);
      if (!definition) throw new Error('Missing validated quest ingredient');
      return [questItemSource(definition), { itemId: id, state: 'consumed' } satisfies QuestItemEntry];
    }));
    const objectives = { ...progress.objectives, [item.sourceObjectiveId]: true };
    const nextProgress = { ...progress, objectives,
      status: quest.objectives.every(objective => objectives[objective.id] === true) ? 'completed' as const : progress.status };
    return publishQuestItemChange(item.sourceQuestId, nextProgress, { ...useInventoryStore.getState().questItems,
      ...consumed, [source]: { itemId: item.id, state: 'owned' } });
  });
}

/** Authored item-dependent interactions at a canonical area; listing emits no event. */
export function areaQuestInsertions(act: number, areaId: string): readonly AssembledQuestItemDef[] {
  const area = resolveSubArea(act, areaId);
  if (!area || area.id !== areaId || area.actId !== `acts/act${String(act)}`) return [];
  const quests = loadQuests();
  return loadQuestItems().filter((item): item is AssembledQuestItemDef => item.kind === 'assembled' &&
    quests.some(quest => quest.id === item.consumeQuestId && quest.actId === area.actId &&
      item.consumeObjectiveId !== undefined &&
      quest.objectives.some(objective => objective.id === item.consumeObjectiveId && objective.areaId === areaId)));
}

/** Insertion requires the real owned output, tracked progress and exact live destination. */
export function questInsertionStatus(source: string): QuestCraftingStatus {
  const map = useMapStore.getState(), area = resolveSubArea(map.currentAct, map.currentSubAreaId);
  if (!area) return 'unavailable';
  const item = areaQuestInsertions(map.currentAct, area.id).find(row => questItemSource(row) === source);
  if (!item) return 'unavailable';
  const quest = loadQuests().find(row => row.id === item.consumeQuestId);
  if (!quest || item.consumeObjectiveId === undefined || !eligibleQuestObjective(quest, item.consumeObjectiveId)) return 'unavailable';
  const ledger = useInventoryStore.getState().questItems, entry = ledger[source];
  if (!Object.hasOwn(ledger, source) || entry?.itemId !== item.id) return 'unavailable';
  return entry.state === 'consumed' ? 'consumed' : 'ready';
}

/** Explicitly consume an assembled item at its authored orifice, without rewards, kills or clears. */
export function insertQuestItem(source: string): QuestCraftingResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<QuestCraftingResult>(() => {
    if (!validLedger()) return 'not-eligible';
    const status = questInsertionStatus(source);
    if (status === 'consumed') return 'already-consumed';
    if (status !== 'ready') return 'not-eligible';
    const item = assembledDefinition(source);
    if (item?.consumeObjectiveId === undefined) return 'not-eligible';
    const progress = useMapStore.getState().questProgress[item.consumeQuestId];
    if (!progress) return 'not-eligible';
    return publishQuestItemChange(item.consumeQuestId,
      { ...progress, objectives: { ...progress.objectives, [item.consumeObjectiveId]: true } },
      { ...useInventoryStore.getState().questItems, [source]: { itemId: item.id, state: 'consumed' } });
  });
}
