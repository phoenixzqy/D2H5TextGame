/** Leaf action definitions depend on quests/areas; reciprocal items are checked by the item loader. */
import Ajv2020 from 'ajv/dist/2020';
import schema from '../schema/quest-action.schema.json';
import document from '../quests/actions.json';
import { subAreas } from '../index';
import { loadQuests } from './quests';

export interface QuestActionInput { readonly inputSource: string; readonly itemId: string }
export interface QuestItemActionDef extends QuestActionInput {
  readonly id: 'actions/act3-break-compelling-orb' | 'actions/act4-shatter-soulstone';
  readonly questId: string;
  readonly receiptSource: string;
  readonly areaId: string;
  readonly targetId: string;
  readonly additionalInputs?: readonly QuestActionInput[];
  readonly completeObjectiveId?: string;
}

/** All exact physical inputs, preserving the original one-input Orb contract. */
export function questActionInputs(action: QuestItemActionDef): readonly QuestActionInput[] {
  return [action, ...(action.additionalInputs ?? [])];
}

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = ajv.compile<{ readonly actions: readonly QuestItemActionDef[] }>(schema);

/** Read closed authored actions without importing the reciprocal item loader or performing effects. */
export function loadQuestActions(): readonly QuestItemActionDef[] {
  if (!validate(document)) throw new Error(`quests/actions.json: ${ajv.errorsText(validate.errors)}`);
  const quests = loadQuests();
  for (const action of document.actions) {
    const quest = quests.find(row => row.id === action.questId);
    if (!quest || (action.completeObjectiveId !== undefined && !quest.objectives.some(objective =>
      objective.id === action.completeObjectiveId && objective.type === 'interact' &&
      objective.targetId === action.targetId && objective.areaId === action.areaId)) || !subAreas.some(area => area.id === action.areaId && area.actId === quest.actId)) {
      throw new Error('quests/actions.json: action owner/location mismatch');
    }
  }
  return Object.freeze([...document.actions]) as readonly QuestItemActionDef[];
}
