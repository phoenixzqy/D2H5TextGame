/** Leaf action definitions depend on quests/areas; reciprocal items are checked by the item loader. */
import Ajv2020 from 'ajv/dist/2020';
import { compileAuthoredValidator } from '../authored-validators';
import document from '../quests/actions.json';
import { subAreas } from '../index';
import { loadQuests } from './quests';

export interface QuestActionInput { readonly inputSource: string; readonly itemId: string }
interface QuestActionBase extends QuestActionInput {
  readonly id: string;
  readonly questId: string;
  readonly receiptSource: string;
  readonly areaId: string;
  readonly targetId: string;
}
interface OrbActionDef extends QuestActionBase {
  readonly id: 'actions/act3-break-compelling-orb';
  readonly questId: 'quests/act3-guardian';
  readonly receiptSource: 'quests/act3-guardian#action:break-compelling-orb';
  readonly areaId: 'areas/act3-travincal';
  readonly targetId: 'objects/compelling_orb';
  readonly inputSource: 'quests/act3-khalims-will#objective:obj-transmute';
  readonly itemId: 'items/khalims_will';
  readonly additionalInputs?: never;
  readonly completeObjectiveId?: never;
}
interface HellforgeActionDef extends QuestActionBase {
  readonly id: 'actions/act4-shatter-soulstone';
  readonly questId: 'quests/act4-hellforge';
  readonly receiptSource: 'quests/act4-hellforge#action:shatter-soulstone';
  readonly areaId: 'areas/act4-river-of-flame';
  readonly targetId: 'objects/hellforge';
  readonly inputSource: 'quests/act4-hellforge#objective:obj-kill-hephasto';
  readonly itemId: 'quest/hellforge_hammer';
  readonly additionalInputs: readonly [{ readonly inputSource: 'quests/act3-guardian#reward:questItem'; readonly itemId: 'items/soulstone_mephisto' }];
  readonly completeObjectiveId: 'obj-shatter';
}
export type QuestItemActionDef = OrbActionDef | HellforgeActionDef;

/** All exact physical inputs, preserving the original one-input Orb contract. */
export function questActionInputs(action: QuestItemActionDef): readonly QuestActionInput[] {
  return [action, ...(action.additionalInputs ?? [])];
}

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = compileAuthoredValidator<{ readonly actions: readonly QuestItemActionDef[] }>(ajv, 'questActions');

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
