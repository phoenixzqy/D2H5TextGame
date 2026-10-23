import { loadQuestItems, questItemSource, type QuestToolDef } from '@/data/loaders/quest-items';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from '@/stores/inventoryStore';
import { withQuestTransaction } from './questTransaction';
import { loadQuests } from '@/data/loaders/quests';
import { subAreas } from '@/data/index';
import { listAreaObjectTargets, objectInteractionStatus } from '@/engine/map/questInteractions';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { assertRecordedWaveNewTransitionAllowed } from '@/stores/recordedWaveAccess';

export type ObjectActionResult = 'ok' | 'already-read' | 'not-eligible' | 'not-ready'
  | 'no-player' | 'combat-active' | 'locked-area' | 'unknown-area';

function preflight(): ObjectActionResult | null {
  assertRecordedWaveNewTransitionAllowed();
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
  if (!usePlayerStore.getState().player) return 'no-player';
  if (hasActiveSubAreaRun() || useCombatStore.getState().inCombat) return 'combat-active';
  return null;
}

/** Supported object identities come from canonical authored objectives, never inferred legacy areas. */
export function areaObjectTargets(act: number, areaId: string): readonly string[] {
  return listAreaObjectTargets(loadQuests(), subAreas, { actId: `acts/act${String(act)}`, areaId });
}

/**
 * Explicitly visit an authored area object without starting combat or reading it.
 * Refuses active combat, unavailable saves and locked/mismatched acts before mutation.
 * Throws the existing typed wave/restore/receipt refusals.
 */
export function travelToAreaObjects(act: number, areaId: string): ObjectActionResult {
  const refusal = preflight();
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
  const refusal = preflight();
  if (refusal) return refusal;
  const map = useMapStore.getState();
  const area = resolveSubArea(map.currentAct, map.currentSubAreaId);
  const actId = `acts/act${String(map.currentAct)}`;
  if (!area || area.actId !== actId) return 'unknown-area';
  if (!map.isActUnlocked(map.currentAct)) return 'locked-area';
  const event = { actId, areaId: area.id, targetId };
  const status = objectInteractionStatus(loadQuests(), subAreas, map.questProgress, event);
  if (status === 'completed' || status === 'claimed') return 'already-read';
  if (status !== 'ready') return 'not-eligible';
  map.recordObjectInteraction(event);
  return 'ok';
}

/** Objective-bound tools placed at this canonical authored location. Listing grants nothing. */
export function areaQuestTools(act: number, areaId: string): readonly QuestToolDef[] {
  const quests = loadQuests();
  return loadQuestItems().filter((item): item is QuestToolDef => item.kind === 'tool' &&
    quests.some(quest => quest.id === item.sourceQuestId && quest.actId === `acts/act${String(act)}` &&
      quest.objectives.some(objective => objective.id === item.sourceObjectiveId && objective.areaId === areaId)));
}

/** Whether an explicit visit can show a supported Read or Recover object. */
export function hasAreaObjects(act: number, areaId: string): boolean {
  return areaObjectTargets(act, areaId).length > 0 || areaQuestTools(act, areaId).length > 0;
}

/** Durable recovery availability; execution additionally checks hydration, combat and ownership guards. */
export function questToolStatus(source: string): 'ready' | 'owned' | 'unavailable' {
  const map = useMapStore.getState();
  const area = resolveSubArea(map.currentAct, map.currentSubAreaId);
  if (!area || !map.isActUnlocked(map.currentAct)) return 'unavailable';
  const tool = areaQuestTools(map.currentAct, area.id).find(item => questItemSource(item) === source);
  if (!tool || !Object.hasOwn(map.questProgress, tool.sourceQuestId)) return 'unavailable';
  const quest = loadQuests().find(row => row.id === tool.sourceQuestId);
  const progress = map.questProgress[tool.sourceQuestId];
  const index = quest?.objectives.findIndex(objective => objective.id === tool.sourceObjectiveId) ?? -1;
  if (Object.hasOwn(useInventoryStore.getState().questItems, source)) return 'owned';
  if (!quest || index < 0 || progress?.id !== quest.id || progress.status !== 'inProgress' ||
    progress.rewardClaimed === true || !quest.objectives.slice(0, index).every(objective =>
      Object.hasOwn(progress.objectives, objective.id) && progress.objectives[objective.id] === true)) return 'unavailable';
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
  const refusal = preflight();
  if (refusal) return refusal;
  return withQuestTransaction<RecoverToolResult>(() => {
    const map = useMapStore.getState();
    const inventory = useInventoryStore.getState();
    try { validateQuestItemLedger(inventory.questItems, map.questProgress); }
    catch { return 'not-eligible'; }
    const status = questToolStatus(source);
    if (status === 'owned') return 'already-owned';
    if (status !== 'ready') return 'not-eligible';
    const tool = loadQuestItems().find((item): item is QuestToolDef => item.kind === 'tool' && questItemSource(item) === source);
    if (!tool) return 'not-eligible';
    const progress = map.questProgress[tool.sourceQuestId];
    if (!progress) return 'not-eligible';
    const nextProgress = { ...progress, objectives: { ...progress.objectives, [tool.sourceObjectiveId]: true } };
    const nextItems = { ...inventory.questItems, [source]: { itemId: tool.id, state: 'owned' as const } };
    try { validateQuestItemLedger(nextItems, { ...map.questProgress, [tool.sourceQuestId]: nextProgress }); }
    catch { return 'not-eligible'; }
    try {
      useInventoryStore.setState({ questItems: nextItems });
      useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [tool.sourceQuestId]: nextProgress } }));
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      try { useInventoryStore.setState({ questItems: inventory.questItems }); } catch (error) { errors.push(error); }
      try { useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [tool.sourceQuestId]: progress } })); }
      catch (error) { errors.push(error); }
      if (errors.length > 0) throw new AggregateError(errors, 'Quest tool restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
