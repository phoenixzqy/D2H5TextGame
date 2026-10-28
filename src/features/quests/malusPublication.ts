import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { MALUS_QUEST, MALUS_SOURCE, MALUS_AREA } from '@/engine/map/malus-quest';
import type { QuestActionReceipts, QuestItemLedger } from '@/engine/types/save';

import { pick, replace, sameCainData as sameData } from './cainPublication';
type Progress = ReturnType<typeof useMapStore.getState>['questProgress'][string];
const QUESTS = [MALUS_QUEST];
/**
 * Publish the finite Malus physical item/row changes under the caller's quest lease.
 * Deep backups survive mutate-then-throw observers. Verify each publication and
 * every restoration; preserve unrelated sources and journals throughout rollback.
 */
export function publishMalusPhysicalChange(progress: Progress, questItems: QuestItemLedger,
  questReceipts?: QuestActionReceipts): 'ok'|'not-eligible'|'grant-failed' {
  const questId=MALUS_QUEST;
  const map=useMapStore.getState(), inventory=useInventoryStore.getState();
  if (questReceipts !== undefined && !sameData(questReceipts,map.questReceipts)) return 'not-eligible';
  if (!Object.hasOwn(map.questProgress,questId)) return 'not-eligible';
  const hero=usePlayerStore.getState().player;
  const before=structuredClone({
    rows:pick(map.questProgress,QUESTS), items:pick(inventory.questItems,[MALUS_SOURCE]),
    hero,
    location:{currentAct:map.currentAct,currentSubAreaId:map.currentSubAreaId,selectedDifficulty:map.selectedDifficulty}
  });
  const expected=structuredClone({ rows:{...before.rows,[questId]:progress},
    items:pick(questItems,[MALUS_SOURCE]) });
  const recoversMalus=!Object.hasOwn(before.items,MALUS_SOURCE) && expected.items[MALUS_SOURCE]?.state==='owned';
  const liveContext=() => {
    const live=useMapStore.getState();
    return hero!==null && usePlayerStore.getState().player===hero && sameData(usePlayerStore.getState().player,before.hero) &&
      live.currentAct===before.location.currentAct && live.currentSubAreaId===before.location.currentSubAreaId &&
      live.selectedDifficulty===before.location.selectedDifficulty && live.currentAct===1 && live.isActUnlocked(1) &&
      live.selectedDifficulty==='normal' && (!recoversMalus || live.clearedSubAreas.includes(MALUS_AREA)) &&
      useHydrationStore.getState().status==='ready' && !isReplacingSave() &&
      !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat;
  };
  const graph=() => {
    const live=useMapStore.getState();
    validateQuestItemLedger(useInventoryStore.getState().questItems,live.questProgress,live.questReceipts);
  };
  try {
    if (!liveContext()) return 'not-eligible';
    validateQuestItemLedger(questItems,{...map.questProgress,[questId]:progress},questReceipts??map.questReceipts);
  } catch { return 'not-eligible'; }
  try {
    useInventoryStore.setState(state=>({questItems:replace(state.questItems,structuredClone(expected.items),[MALUS_SOURCE])}));
    const intermediate=useMapStore.getState();
    if (!liveContext() || !sameData(pick(intermediate.questProgress,QUESTS),before.rows) ||
      !sameData(pick(useInventoryStore.getState().questItems,[MALUS_SOURCE]),expected.items)) {
      throw new Error('Malus context changed during item publication');
    }
    useMapStore.setState(state=>({questProgress:replace(state.questProgress,structuredClone(expected.rows),QUESTS)}));
    const published=useMapStore.getState();
    if (!liveContext() || !sameData(pick(published.questProgress,QUESTS),expected.rows) ||
      !sameData(pick(useInventoryStore.getState().questItems,[MALUS_SOURCE]),expected.items)) {
      throw new Error('Malus publication postcondition failed');
    }
    graph();
    return 'ok';
  } catch(cause) {
    const errors:unknown[]=[];
    const attempt=(operation:()=>void) => {try{operation();}catch(error){errors.push(error);}};
    attempt(()=>{useInventoryStore.setState(state=>({questItems:replace(state.questItems,structuredClone(before.items),[MALUS_SOURCE])}));});
    attempt(()=>{useMapStore.setState(state=>({questProgress:replace(state.questProgress,structuredClone(before.rows),QUESTS),...before.location}));});
    attempt(()=>{
      const restored=useMapStore.getState();
      if (!sameData(pick(restored.questProgress,QUESTS),before.rows) ||
        !sameData(pick(useInventoryStore.getState().questItems,[MALUS_SOURCE]),before.items) ||
        restored.currentAct!==before.location.currentAct || restored.currentSubAreaId!==before.location.currentSubAreaId ||
        restored.selectedDifficulty!==before.location.selectedDifficulty) throw new Error('Malus restoration postcondition failed');
    });
    if(errors.length>0) throw new AggregateError(errors,'Malus physical source restoration failed',{cause});
    return 'grant-failed';
  }
}
