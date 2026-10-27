import { loadTownNpcs } from '@/data/loaders/towns';
import { loadQuests } from '@/data/loaders/quests';
import { ACT1_QUEST_RECEIPTS as R } from '@/engine/map/act1-quest-sources';
import { CAIN_QUEST, CAIN_SIDE_QUEST, CAIN_AREA, canEarnCainObjective, hasCainRescue } from '@/engine/map/cain-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { questActionPreflight, withQuestTransaction, publishQuestItemChange } from './questTransaction';
export type CainActionResult='ok'|'already-read'|'not-eligible'|'not-ready'|'no-player'|'combat-active'|'claim-in-progress'|'grant-failed';

/** Canonical Cain presence for rendering, direct Talk and selected-item consumers. */
export function isCainTownPresent(): boolean {
  const map=useMapStore.getState();
  if (!map.isActUnlocked(map.currentAct) || !loadTownNpcs(map.currentAct).some(npc=>npc.id==='npc/cain')) return false;
  if(map.currentAct!==1) return true;
  const items=useInventoryStore.getState().questItems;
  try {validateQuestItemLedger(items,map.questProgress,map.questReceipts);}catch{return false;}
  return hasCainRescue(map.questProgress,items,map.questReceipts);
}
function status(kind:'rescue'|'talk'): 'ready'|'completed'|'unavailable' {
  const map=useMapStore.getState(),items=useInventoryStore.getState().questItems;
  if(map.currentAct!==1 || map.selectedDifficulty!=='normal' || !map.isActUnlocked(1) ||
    (kind==='rescue' ? map.currentSubAreaId!==CAIN_AREA : !isCainTownPresent())) return 'unavailable';
  try {validateQuestItemLedger(items,map.questProgress,map.questReceipts);}catch{return 'unavailable';}
  const source=kind==='rescue'?R.rescueCain:R.cainTalk;
  if(Object.hasOwn(map.questReceipts,source)) return 'completed';
  return canEarnCainObjective(map.questProgress,kind==='rescue'?CAIN_QUEST:CAIN_SIDE_QUEST,
    kind==='rescue'?'obj-rescue-cain':'obj-talk',items,map.questReceipts)?'ready':'unavailable';
}
/** Rescue availability needs actual hand-in; old rescue flags may earn missing proof explicitly. */
export function cainRescueStatus(): 'ready'|'completed'|'unavailable' {return status('rescue');}
function execute(kind:'rescue'|'talk'): CainActionResult {
  const refusal=questActionPreflight(); if(refusal)return refusal;
  return withQuestTransaction<CainActionResult>(()=>{
    const availability=status(kind);
    if(availability==='completed')return 'already-read';
    if(availability!=='ready')return 'not-eligible';
    const map=useMapStore.getState(),questId=kind==='rescue'?CAIN_QUEST:CAIN_SIDE_QUEST;
    const quest=loadQuests().find(row=>row.id===questId),progress=map.questProgress[questId];
    if(!quest||!progress)return 'not-eligible';
    const objectives={...progress.objectives,[kind==='rescue'?'obj-rescue-cain':'obj-talk']:true};
    const source=kind==='rescue'?R.rescueCain:R.cainTalk;
    return publishQuestItemChange(questId,{...progress,objectives,
      status:progress.status==='completed'||quest.objectives.every(row=>objectives[row.id])?'completed':'inProgress'},
    useInventoryStore.getState().questItems,{...map.questReceipts,[source]:true});
  });
}
/** Explicit field Rescue publishes the objective and source receipt together. */
export function rescueCain():CainActionResult{return execute('rescue');}
/** Explicit current-town Talk earns the side receipt, including sparse claimed legacy repair. */
export function talkToCain():CainActionResult{return execute('talk');}
