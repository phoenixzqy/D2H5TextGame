import { assertIronGolemOwnershipMutationAllowed } from '@/stores/waveTransitionGuard';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { assertRecordedWaveNewTransitionAllowed } from '@/stores/recordedWaveAccess';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { QuestItemLedger } from '@/engine/types/save';
import type { QuestDef } from '@/data/loaders/quests';

let inProgress = false;

/** Serialize synchronous quest grants through all rollback attempts. */
export function withQuestTransaction<T>(operation: () => T): T | 'claim-in-progress' {
  assertIronGolemOwnershipMutationAllowed();
  if (inProgress) return 'claim-in-progress';
  inProgress = true;
  try { return operation(); } finally { inProgress = false; }
}

/** Shared live readiness check for explicit world-item actions; typed wave refusals propagate. */
export function questActionPreflight(): 'not-ready' | 'no-player' | 'combat-active' | null {
  assertRecordedWaveNewTransitionAllowed();
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
  if (!usePlayerStore.getState().player) return 'no-player';
  if (hasActiveSubAreaRun() || useCombatStore.getState().inCombat) return 'combat-active';
  return null;
}

/** Ordinary ordered progress or an internally complete legacy row permits explicit receipt repair. */
export function eligibleQuestObjective(quest: QuestDef, objectiveId: string): boolean {
  const map = useMapStore.getState();
  const progress = map.questProgress[quest.id];
  const index = quest.objectives.findIndex(objective => objective.id === objectiveId);
  const act = /^acts\/act(\d+)$/.exec(quest.actId);
  if (!Object.hasOwn(map.questProgress, quest.id) || !progress || progress.id !== quest.id || index < 0 ||
    !act || !map.isActUnlocked(Number(act[1]))) return false;
  const ownTrue = (id: string) => Object.hasOwn(progress.objectives, id) && progress.objectives[id] === true;
  return progress.status === 'completed'
    ? quest.objectives.every(objective => ownTrue(objective.id))
    : progress.status === 'inProgress' && progress.rewardClaimed !== true &&
      quest.objectives.slice(0, index).every(objective => ownTrue(objective.id));
}

type Progress = ReturnType<typeof useMapStore.getState>['questProgress'][string];

/**
 * Publish a validated item ledger and one quest row. On synchronous failure restore
 * both participating domains, preserving unrelated journal writes and holding the
 * caller's transaction lock. This does not provide crash or observer-wide atomicity.
 */
export function publishQuestItemChange(questId: string, progress: Progress, questItems: QuestItemLedger):
  'ok' | 'not-eligible' | 'grant-failed' {
  const previousItems = useInventoryStore.getState().questItems;
  const map = useMapStore.getState(), previousProgress = map.questProgress[questId];
  if (!previousProgress) return 'not-eligible';
  try { validateQuestItemLedger(questItems, { ...map.questProgress, [questId]: progress }); }
  catch { return 'not-eligible'; }
  try {
    useInventoryStore.setState({ questItems });
    useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [questId]: progress } }));
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    try { useInventoryStore.setState({ questItems: previousItems }); } catch (error) { errors.push(error); }
    try { useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [questId]: previousProgress } })); }
    catch (error) { errors.push(error); }
    if (errors.length > 0) throw new AggregateError(errors, 'Quest item restoration failed', { cause });
    return 'grant-failed';
  }
}
