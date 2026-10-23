/** Leaf action definitions depend on quests/areas; reciprocal items are checked by the item loader. */
import Ajv2020 from 'ajv/dist/2020';
import schema from '../schema/quest-action.schema.json';
import document from '../quests/actions.json';
import { subAreas } from '../index';
import { loadQuests } from './quests';

export interface QuestItemActionDef {
  readonly id: 'actions/act3-break-compelling-orb';
  readonly questId: 'quests/act3-guardian';
  readonly receiptSource: 'quests/act3-guardian#action:break-compelling-orb';
  readonly areaId: 'areas/act3-travincal';
  readonly targetId: 'objects/compelling_orb';
  readonly inputSource: 'quests/act3-khalims-will#objective:obj-transmute';
  readonly itemId: 'items/khalims_will';
}

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = ajv.compile<{ readonly actions: readonly QuestItemActionDef[] }>(schema);

/** Read closed authored actions without importing the reciprocal item loader or performing effects. */
export function loadQuestActions(): readonly QuestItemActionDef[] {
  if (!validate(document)) throw new Error(`quests/actions.json: ${ajv.errorsText(validate.errors)}`);
  const quests = loadQuests();
  for (const action of document.actions) {
    const quest = quests.find(row => row.id === action.questId);
    if (!quest || !subAreas.some(area => area.id === action.areaId && area.actId === quest.actId)) {
      throw new Error('quests/actions.json: action owner/location mismatch');
    }
  }
  return Object.freeze([...document.actions]) as readonly QuestItemActionDef[];
}
