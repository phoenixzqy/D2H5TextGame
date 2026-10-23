import { questObjectivePrerequisitesMet } from './questStages';

/** Ordered, area-bound object events. Item-dependent objectives need their own transaction. */
export interface InteractionProgress {
  id: string;
  status: 'locked' | 'available' | 'inProgress' | 'completed';
  objectives: Record<string, boolean>;
  rewardClaimed?: boolean;
}

export interface InteractionQuest {
  readonly id: string;
  readonly actId: string;
  readonly objectiveStages?: readonly (readonly string[])[];
  readonly objectives: readonly {
    readonly id: string;
    readonly type: string;
    readonly [extra: string]: unknown;
  }[];
}

export interface InteractionArea { readonly id: string; readonly actId: string }
export interface ObjectLocation { readonly actId: string; readonly areaId: string }
export interface ObjectInteraction extends ObjectLocation { readonly targetId: string }
export type ObjectInteractionStatus = 'unavailable' | 'ready' | 'completed' | 'claimed';

function areaObjectives(quests: readonly InteractionQuest[], areas: readonly InteractionArea[], location: ObjectLocation) {
  if (!areas.some(area => area.id === location.areaId && area.actId === location.actId)) return [];
  return quests.filter(quest => quest.actId === location.actId).flatMap(quest =>
    quest.objectives.flatMap((objective) =>
      objective.type === 'interact' && objective.areaId === location.areaId &&
      typeof objective.targetId === 'string' && objective.targetId.length > 0 &&
      objective.itemRequired === undefined && (objective.count === undefined || objective.count === 1)
        ? [{ quest, objective, targetId: objective.targetId }] : []));
}

function eligible(entry: ReturnType<typeof areaObjectives>[number], progress: Record<string, InteractionProgress>): boolean {
  const current = progress[entry.quest.id];
  return current?.status === 'inProgress' && !current.rewardClaimed &&
    current.objectives[entry.objective.id] !== true &&
    questObjectivePrerequisitesMet(entry.quest, current.objectives, entry.objective.id);
}

/** List supported authored objects in a canonical area, without granting or banking credit. */
export function listAreaObjectTargets(quests: readonly InteractionQuest[], areas: readonly InteractionArea[],
  location: ObjectLocation): readonly string[] {
  return [...new Set(areaObjectives(quests, areas, location).map(entry => entry.targetId))];
}

/** Use the same pre-event eligibility as settlement for UI availability and durable read feedback. */
export function objectInteractionStatus(quests: readonly InteractionQuest[], areas: readonly InteractionArea[],
  progress: Record<string, InteractionProgress>, event: ObjectInteraction): ObjectInteractionStatus {
  const matching = areaObjectives(quests, areas, event).filter(entry => entry.targetId === event.targetId);
  if (matching.some(entry => eligible(entry, progress))) return 'ready';
  if (matching.length === 0 || !matching.every(entry =>
    progress[entry.quest.id]?.objectives[entry.objective.id] === true)) return 'unavailable';
  return matching.every(entry => progress[entry.quest.id]?.rewardClaimed === true) ? 'claimed' : 'completed';
}

/**
 * Apply one explicit event against pre-event flags. No same-event cascade,
 * autostart, rewards or access changes. Refusals preserve the exact input reference.
 */
export function applyObjectInteraction(quests: readonly InteractionQuest[], areas: readonly InteractionArea[],
  progress: Record<string, InteractionProgress>, event: ObjectInteraction): Record<string, InteractionProgress> {
  let next = progress;
  for (const entry of areaObjectives(quests, areas, event)) {
    if (entry.targetId !== event.targetId || !eligible(entry, progress)) continue;
    const current = next[entry.quest.id];
    if (!current) continue;
    const objectives = { ...current.objectives, [entry.objective.id]: true };
    next = { ...next, [entry.quest.id]: { ...current, objectives,
      status: entry.quest.objectives.every(objective => objectives[objective.id] === true) ? 'completed' : 'inProgress' } };
  }
  return next;
}
