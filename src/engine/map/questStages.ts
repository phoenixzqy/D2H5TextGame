/** Objective order shared by live quest actions, events and receipt validation. */
export interface QuestObjectiveOrder {
  readonly objectives: readonly { readonly id: string }[];
  /** Complete ordered partition; objectives within a stage are unordered. */
  readonly objectiveStages?: readonly (readonly string[])[];
}

/** Earlier-stage IDs, or the earlier display rows when stages are omitted. Unknown IDs fail closed. */
export function questObjectivePrerequisites(quest: QuestObjectiveOrder, objectiveId: string): readonly string[] | undefined {
  const index = quest.objectives.findIndex(objective => objective.id === objectiveId);
  if (index < 0) return undefined;
  if (quest.objectiveStages === undefined) return quest.objectives.slice(0, index).map(objective => objective.id);
  const stageIndex = quest.objectiveStages.findIndex(stage => stage.includes(objectiveId));
  return stageIndex < 0 ? undefined : quest.objectiveStages.slice(0, stageIndex).flat();
}

/** Check pre-event own true predecessors only; callers separately enforce source flags, status and actual inputs. */
export function questObjectivePrerequisitesMet(quest: QuestObjectiveOrder, flags: Readonly<Record<string, boolean>>,
  objectiveId: string): boolean {
  const prerequisites = questObjectivePrerequisites(quest, objectiveId);
  return prerequisites?.every(id => Object.hasOwn(flags, id) && flags[id] === true) ?? false;
}
