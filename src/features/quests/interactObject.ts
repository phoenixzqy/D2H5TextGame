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
  if (areaObjectTargets(act, areaId).length === 0) return 'unknown-area';
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
