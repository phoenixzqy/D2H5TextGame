import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { CAIN_QUEST, CAIN_SIDE_QUEST, CAIN_SCROLL_SOURCE, CAIN_RECEIPTS, CAIN_AREA } from '@/engine/map/cain-quest';
import type { QuestActionReceipts, QuestItemLedger } from '@/engine/types/save';

type Progress = ReturnType<typeof useMapStore.getState>['questProgress'][string];
const QUESTS = [CAIN_QUEST, CAIN_SIDE_QUEST];
/** Copy only named JSON participants; absent keys stay absent. */
export function pick<T>(record: Readonly<Record<string, T>>, keys: readonly string[]): Record<string, T> {
  return Object.fromEntries(keys.filter(key => Object.hasOwn(record,key)).map(key => [key,record[key] as T ]));
}
/** Restore named participants while preserving unrelated observer writes. */
export function replace<T>(current: Readonly<Record<string,T>>, values: Readonly<Record<string,T>>, keys: readonly string[]): Record<string,T> {
  const next = { ...current };
  for (const key of keys) {
    if (Object.hasOwn(values,key)) next[key]=values[key] as T;
    else Reflect.deleteProperty(next,key);
  }
  return next;
}
/** Equality for quest data and runtime actor snapshots, including legacy affix Maps. */
export function sameCainData(left: unknown, right: unknown): boolean {
  if (Object.is(left,right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object' ||
    Array.isArray(left)!==Array.isArray(right)) return false;
  if (left instanceof Map || right instanceof Map) {
    return left instanceof Map && right instanceof Map && left.size === right.size &&
      [...left].every(([key, value]) => right.has(key) && sameCainData(value, right.get(key)));
  }
  if (Array.isArray(left) && Array.isArray(right) && left.length !== right.length) return false;
  const a=Object.keys(left), b=Object.keys(right);
  return a.length===b.length && a.every(key => Object.hasOwn(right,key) &&
    sameCainData(Reflect.get(left,key),Reflect.get(right,key)));
}

/**
 * Publish finite Cain item/row/receipt changes under the caller's quest lease.
 * Deep backups survive mutate-then-throw observers. Verify each publication and
 * every restoration; preserve unrelated sources and journals throughout rollback.
 */
export function publishCainChange(questId: string, progress: Progress, questItems: QuestItemLedger,
  questReceipts?: QuestActionReceipts): 'ok'|'not-eligible'|'grant-failed' {
  const map=useMapStore.getState(), inventory=useInventoryStore.getState();
  if (!Object.hasOwn(map.questProgress,questId)) return 'not-eligible';
  const hero=usePlayerStore.getState().player;
  const before=structuredClone({
    rows:pick(map.questProgress,QUESTS), items:pick(inventory.questItems,[CAIN_SCROLL_SOURCE]),
    receipts:pick(map.questReceipts,CAIN_RECEIPTS), hero,
    location:{currentAct:map.currentAct,currentSubAreaId:map.currentSubAreaId,selectedDifficulty:map.selectedDifficulty}
  });
  const expected=structuredClone({ rows:{...before.rows,[questId]:progress},
    items:pick(questItems,[CAIN_SCROLL_SOURCE]), receipts:pick(questReceipts??map.questReceipts,CAIN_RECEIPTS) });
  const recoversScroll=!Object.hasOwn(before.items,CAIN_SCROLL_SOURCE) && expected.items[CAIN_SCROLL_SOURCE]?.state==='owned';
  const liveContext=() => {
    const live=useMapStore.getState();
    return hero!==null && usePlayerStore.getState().player===hero && sameCainData(usePlayerStore.getState().player,before.hero) &&
      live.currentAct===before.location.currentAct && live.currentSubAreaId===before.location.currentSubAreaId &&
      live.selectedDifficulty===before.location.selectedDifficulty && live.currentAct===1 && live.isActUnlocked(1) &&
      live.selectedDifficulty==='normal' && (!recoversScroll || live.clearedSubAreas.includes(CAIN_AREA)) &&
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
    useInventoryStore.setState(state=>({questItems:replace(state.questItems,structuredClone(expected.items),[CAIN_SCROLL_SOURCE])}));
    const intermediate=useMapStore.getState();
    if (!liveContext() || !sameCainData(pick(intermediate.questProgress,QUESTS),before.rows) ||
      !sameCainData(pick(intermediate.questReceipts,CAIN_RECEIPTS),before.receipts) ||
      !sameCainData(pick(useInventoryStore.getState().questItems,[CAIN_SCROLL_SOURCE]),expected.items)) {
      throw new Error('Cain context changed during item publication');
    }
    useMapStore.setState(state=>({questProgress:replace(state.questProgress,structuredClone(expected.rows),QUESTS),
      questReceipts:replace(state.questReceipts,structuredClone(expected.receipts),CAIN_RECEIPTS)}));
    const published=useMapStore.getState();
    if (!liveContext() || !sameCainData(pick(published.questProgress,QUESTS),expected.rows) ||
      !sameCainData(pick(published.questReceipts,CAIN_RECEIPTS),expected.receipts) ||
      !sameCainData(pick(useInventoryStore.getState().questItems,[CAIN_SCROLL_SOURCE]),expected.items)) {
      throw new Error('Cain publication postcondition failed');
    }
    graph();
    return 'ok';
  } catch(cause) {
    const errors:unknown[]=[];
    const attempt=(operation:()=>void) => {try{operation();}catch(error){errors.push(error);}};
    attempt(()=>{useInventoryStore.setState(state=>({questItems:replace(state.questItems,structuredClone(before.items),[CAIN_SCROLL_SOURCE])}));});
    attempt(()=>{useMapStore.setState(state=>({questProgress:replace(state.questProgress,structuredClone(before.rows),QUESTS),
      questReceipts:replace(state.questReceipts,structuredClone(before.receipts),CAIN_RECEIPTS),...before.location}));});
    attempt(()=>{
      const restored=useMapStore.getState();
      if (!sameCainData(pick(restored.questProgress,QUESTS),before.rows) ||
        !sameCainData(pick(restored.questReceipts,CAIN_RECEIPTS),before.receipts) ||
        !sameCainData(pick(useInventoryStore.getState().questItems,[CAIN_SCROLL_SOURCE]),before.items) ||
        restored.currentAct!==before.location.currentAct || restored.currentSubAreaId!==before.location.currentSubAreaId ||
        restored.selectedDifficulty!==before.location.selectedDifficulty) throw new Error('Cain restoration postcondition failed');
    });
    if(errors.length>0) throw new AggregateError(errors,'Cain source restoration failed',{cause});
    return 'grant-failed';
  }
}
