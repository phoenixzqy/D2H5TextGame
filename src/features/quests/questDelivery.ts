import { loadQuestItems, questItemSource, type QuestDeliveryDef } from '@/data/loaders/quest-items';
import { loadQuests, type QuestDef } from '@/data/loaders/quests';
import { loadTownNpcs } from '@/data/loaders/towns';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { eligibleQuestObjective, publishQuestItemChange, questActionPreflight, withQuestTransaction } from './questTransaction';
import type { QuestCraftingResult, QuestCraftingStatus } from './questCrafting';

/** New hand-in rewards require the actual consumed item graph, including after explicit legacy repair. */
export function hasQuestDeliveryCompletion(quest: QuestDef): boolean {
  const handIns = quest.objectives.filter(objective => objective.type === 'give');
  if (handIns.length === 0) return true;
  const ledger = useInventoryStore.getState().questItems;
  const map = useMapStore.getState();
  try { validateQuestItemLedger(ledger, map.questProgress, map.questReceipts); }
  catch { return false; }
  const definitions = loadQuestItems();
  return handIns.every(objective => {
    const item = definitions.find((row): row is QuestDeliveryDef => row.kind === 'delivery' &&
      row.sourceQuestId === quest.id && row.consumeObjectiveId === objective.id);
    if (!item) return false;
    const source = questItemSource(item);
    return Object.hasOwn(ledger, source) && ledger[source]?.itemId === item.id && ledger[source].state === 'consumed';
  });
}

/** Authored hand-ins for one exact NPC in the current act's town. Listing never gives an item. */
export function npcQuestDeliveries(npcId: string): readonly QuestDeliveryDef[] {
  const map = useMapStore.getState();
  if (!loadTownNpcs(map.currentAct).some(npc => npc.id === npcId)) return [];
  const quests = loadQuests();
  return loadQuestItems().filter((item): item is QuestDeliveryDef => item.kind === 'delivery' &&
    quests.some(quest => quest.id === item.sourceQuestId && quest.actId === `acts/act${String(map.currentAct)}` &&
      quest.objectives.some(objective => objective.id === item.consumeObjectiveId && objective.npcId === npcId)));
}

/** Require the exact owned source and eligible hand-in, rather than matching an item name or flag. */
export function questDeliveryStatus(source: string, npcId: string): QuestCraftingStatus {
  const item = npcQuestDeliveries(npcId).find(row => questItemSource(row) === source);
  if (!item) return 'unavailable';
  const quest = loadQuests().find(row => row.id === item.sourceQuestId);
  if (!quest || !eligibleQuestObjective(quest, item.consumeObjectiveId)) return 'unavailable';
  const ledger = useInventoryStore.getState().questItems;
  if (!Object.hasOwn(ledger, source) || ledger[source]?.itemId !== item.id) return 'unavailable';
  return ledger[source].state === 'consumed' ? 'consumed' : 'ready';
}

/** Give one real item explicitly. Completes only its named objective; Claim remains separate. */
export function giveQuestItem(source: string, npcId: string): QuestCraftingResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<QuestCraftingResult>(() => {
    const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    try { validateQuestItemLedger(inventory.questItems, map.questProgress, map.questReceipts); }
    catch { return 'not-eligible'; }
    const status = questDeliveryStatus(source, npcId);
    if (status === 'consumed') return 'already-consumed';
    if (status !== 'ready') return 'not-eligible';
    const item = npcQuestDeliveries(npcId).find(row => questItemSource(row) === source);
    const quest = loadQuests().find(row => row.id === item?.sourceQuestId);
    if (!quest || !item) return 'not-eligible';
    const progress = map.questProgress[quest.id];
    if (!progress) return 'not-eligible';
    const output = item.outputItemId === undefined ? undefined
      : loadQuestItems().find(row => row.id === item.outputItemId);
    if (item.outputItemId !== undefined && (!output || Object.hasOwn(inventory.questItems, questItemSource(output)))) {
      return 'not-eligible';
    }
    const objectives = { ...progress.objectives, [item.consumeObjectiveId]: true };
    return publishQuestItemChange(quest.id, { ...progress, objectives,
      status: quest.objectives.every(objective => objectives[objective.id] === true) ? 'completed' : progress.status },
    { ...inventory.questItems, [source]: { itemId: item.id, state: 'consumed' },
      ...(output ? { [questItemSource(output)]: { itemId: output.id, state: 'owned' as const } } : {}) });
  });
}
