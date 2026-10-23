import { act5Runtime } from '@/data/loaders/act5-runtime';
import { loadTownNpcs } from '@/data/loaders/towns';
import { loadQuests } from '@/data/loaders/quests';
import { PRISON_QUEST } from '@/engine/map/act5-admission';
import { CAGE_PROOFS, INSPECT_PROOF, POTION_SOURCE, THAW_PROOF, isCanonicalAct5Progress } from '@/engine/save/act5-state';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { publishQuestItemChange, questActionPreflight, withQuestTransaction } from './questTransaction';
export type Act5QuestAction = typeof act5Runtime.actions[number];
export type Act5QuestActionResult = 'ok' | 'already-consumed' | 'not-eligible' | 'not-ready' | 'no-player'
  | 'combat-active' | 'claim-in-progress' | 'grant-failed';
/** Finite authored field controls at the exact canonical destination. */
export function areaAct5QuestActions(act: number, areaId: string): readonly Act5QuestAction[] {
  return act === 5 ? act5Runtime.actions.filter(action => action.areaId === areaId) : [];
}
/** Finite actual current-town Malah control; no NPC can be forged by an ID alone. */
export function npcAct5QuestActions(npcId: string): readonly Act5QuestAction[] {
  return useMapStore.getState().currentAct === 5 && loadTownNpcs(5).some(npc => npc.id === npcId)
    ? act5Runtime.actions.filter(action => action.npcId === npcId) : [];
}
/** Actual thaw proof, distinct from historical ordinary town presence. */
export function isAnyaThawed(): boolean {
  const map = useMapStore.getState();
  try { validateQuestItemLedger(useInventoryStore.getState().questItems, map.questProgress, map.questReceipts); }
  catch { return false; }
  return Object.hasOwn(map.questReceipts, THAW_PROOF);
}
/** Legacy completed/claimed presence is dialogue continuity only; it grants no source entitlement. */
export function isAnyaTownPresent(): boolean {
  const map = useMapStore.getState(), row = map.questProgress[PRISON_QUEST];
  return map.currentAct === 5 && (isAnyaThawed() ||
    row?.id === PRISON_QUEST && row.status === 'completed' && row.rewardClaimed === true);
}
/** Availability uses the live canonical location and complete prospective graph. */
export function act5QuestActionStatus(source: string): 'ready' | 'consumed' | 'unavailable' {
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  const action = act5Runtime.actions.find(row => row.receiptSource === source);
  if (!action || action.kind === 'read' || map.currentAct !== 5 || map.selectedDifficulty !== 'normal' || !map.isActUnlocked(5)) return 'unavailable';
  if (action.kind === 'potion' ? !npcAct5QuestActions('npc/malah').some(row => row.id === action.id)
    : map.currentSubAreaId !== action.areaId) return 'unavailable';
  try { validateQuestItemLedger(items, map.questProgress, map.questReceipts); } catch { return 'unavailable'; }
  if (Object.hasOwn(map.questReceipts, source)) return 'consumed';
  if (!isCanonicalAct5Progress(map.questProgress, action.questId)) return 'unavailable';
  const progress = map.questProgress[action.questId];
  if (action.questId !== PRISON_QUEST && progress?.rewardClaimed === true) return 'unavailable';
  if (action.kind === 'cage') return map.clearedSubAreas.includes('areas/act5-frigid-highlands') ? 'ready' : 'unavailable';
  if (action.kind === 'inspect') return 'ready';
  if (!Object.hasOwn(map.questReceipts, INSPECT_PROOF)) return 'unavailable';
  if (action.kind === 'potion') return Object.hasOwn(items, POTION_SOURCE) ? 'unavailable' : 'ready';
  return Object.hasOwn(items, POTION_SOURCE) && items[POTION_SOURCE]?.itemId === 'quest/malahs_potion' &&
    items[POTION_SOURCE].state === 'owned' ? 'ready' : 'unavailable';
}
/** Explicit finite action; item, source proof and objective publication share the quest lock. */
export function executeAct5QuestAction(source: string): Act5QuestActionResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  return withQuestTransaction<Act5QuestActionResult>(() => {
    const status = act5QuestActionStatus(source);
    if (status === 'consumed') return 'already-consumed';
    if (status !== 'ready') return 'not-eligible';
    const action = act5Runtime.actions.find(row => row.receiptSource === source);
    if (!action || action.kind === 'read') return 'not-eligible';
    const map = useMapStore.getState(), progress = map.questProgress[action.questId];
    const quest = loadQuests().find(row => row.id === action.questId);
    if (!progress || !quest) return 'not-eligible';
    const receipts = { ...map.questReceipts, [source]: true as const };
    const objectives = { ...progress.objectives };
    let items = useInventoryStore.getState().questItems;
    if (action.kind === 'cage' && CAGE_PROOFS.every(key => Object.hasOwn(receipts, key))) objectives['obj-free-15'] = true;
    if (action.kind === 'inspect') objectives['obj-find-anya'] = true;
    if (action.kind === 'potion') items = { ...items, [POTION_SOURCE]: { itemId: 'quest/malahs_potion', state: 'owned' } };
    if (action.kind === 'thaw') {
      objectives['obj-thaw'] = true;
      items = { ...items, [POTION_SOURCE]: { itemId: 'quest/malahs_potion', state: 'consumed' } };
    }
    return publishQuestItemChange(action.questId, { ...progress, objectives,
      status: quest.objectives.every(row => objectives[row.id]) ? 'completed' : 'inProgress' }, items, receipts);
  });
}
/** Obtain the one actual source-bound quest potion from current-town Malah after Inspect. */
export function receiveMalahPotion(): Act5QuestActionResult { return executeAct5QuestAction(POTION_SOURCE); }
/** Read-only unique group count for progress presentation, never a grant input. */
export function rescuedBarbarianCount(): number {
  return Math.min(15, CAGE_PROOFS.filter(source => Object.hasOwn(useMapStore.getState().questReceipts, source)).length *
    (act5Runtime.actions.find(action => action.kind === 'cage')?.groupSize ?? 0));
}
