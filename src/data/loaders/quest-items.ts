import { compileAuthoredValidator } from '../authored-validators';
/** JSON-authored bound quest items; dependencies flow from items to quests only. */
import Ajv2020 from 'ajv/dist/2020';
import document from '../quests/items.json';
import { loadQuests, type QuestDef, type QuestObjective } from './quests';
import { subAreas } from '../index';
import { questObjectivePrerequisites } from '../../engine/map/questStages';
import { loadTownNpcs } from './towns';
import { loadQuestActions, questActionInputs } from './quest-actions';
import { act5Runtime } from './act5-runtime';
import { cowRuntime } from './cow-runtime';

/** A unique quest reward entitlement and its one-time Read effect. */
interface QuestItemBase {
  readonly id: string;
  readonly sourceQuestId: string;
  readonly nameKey: string;
  readonly descKey: string;
}

/** Existing reward-bound consumable, preserving its canonical source and Read effect. */
export interface ReadQuestItemDef extends QuestItemBase {
  readonly kind?: never;
  readonly sourceObjectiveId?: never;
  readonly effect: { readonly skillPoints: number; readonly maxLife?: never; readonly allResist?: never }
    | { readonly maxLife: number; readonly skillPoints?: never; readonly allResist?: never }
    | { readonly allResist: 10; readonly skillPoints?: never; readonly maxLife?: never };
}

/** An actual retained reward with a closed optional consumer; never a Read effect. */
export interface RetainedQuestItemDef extends QuestItemBase {
  readonly kind: 'retained';
  readonly sourceObjectiveId?: never;
  readonly effect?: never;
  readonly requiredActionSource: 'quests/act3-guardian#action:break-compelling-orb';
  readonly consumeActionId?: 'actions/act4-shatter-soulstone';
}

/** Retained tool issued only by its explicit authored fetch objective. */
export interface QuestToolDef extends QuestItemBase {
  readonly kind: 'tool';
  readonly sourceObjectiveId: string;
  readonly effect?: never;
}

/** Qualified encounter proof followed by explicit recovery at one authored object. */
export interface QuestEncounterItemDef extends QuestItemBase {
  readonly kind: 'encounter';
  readonly sourceObjectiveId: 'obj-kill-hephasto';
  readonly targetId: 'objects/hellforge_hammer_cache';
  readonly requiredActionSource: 'quests/act4-hellforge#action:hephasto-victory';
  readonly consumeActionId: 'actions/act4-shatter-soulstone';
  readonly effect?: never;
}

/** Fetch-sourced ingredient whose consumed receipt is bound to one assembled output. */
export interface QuestComponentDef extends QuestItemBase {
  readonly kind: 'component';
  readonly sourceObjectiveId: string;
  readonly consumedBy: string;
  readonly requiresAreaClear?: true;
  readonly requiredActionSource?: 'quests/act3-khalims-will#action:council-victory';
  readonly effect?: never;
}

/** A recovered physical item consumed only by its exact explicit NPC hand-in. */
export interface QuestDeliveryDef extends QuestItemBase {
  readonly kind: 'delivery';
  readonly sourceObjectiveId: string;
  readonly consumeObjectiveId: string;
  readonly outputItemId?: string;
  readonly effect?: never;
}

/** Quest recipe output and its exact subsequent item-dependent interaction. */
export interface AssembledQuestItemDef extends QuestItemBase {
  readonly kind: 'assembled';
  readonly sourceObjectiveId: string;
  readonly recipe: string;
  readonly requiredTool: string;
  readonly ingredients: readonly string[];
  readonly consumeQuestId: string;
  readonly consumeObjectiveId?: string;
  readonly consumeActionId?: 'actions/act3-break-compelling-orb';
  readonly effect?: never;
}

/** The one exact NPC-issued potion, bound to its receive action rather than an objective. */
export interface ActionQuestItemDef extends QuestItemBase {
  readonly kind: 'action';
  readonly sourceActionId: 'actions/act5-receive-malah-potion';
  readonly consumeActionId: 'actions/act5-thaw-anya';
  readonly sourceObjectiveId?: never;
  readonly effect?: never;
}

/** Closed ingredients consumed by the finite Cow portal recipe, without an output item. */
export type PortalIngredientDef = QuestItemBase & {
  readonly kind: 'portalIngredient';
  readonly consumeActionId: 'actions/act1-open-cow-portal';
  readonly effect?: never;
} & ({ readonly id: 'quest/wirts_leg'; readonly sourceObjectiveId: 'obj-find-leg';
  readonly sourceActionId?: never; readonly requiresAreaClear: true }
  | { readonly id: 'quest/cow_portal_tome'; readonly sourceActionId: 'actions/act1-receive-cow-tome';
    readonly sourceObjectiveId?: never; readonly requiresAreaClear?: never });

export type ObjectiveQuestItemDef = QuestEncounterItemDef | QuestToolDef | QuestComponentDef | QuestDeliveryDef | AssembledQuestItemDef;
export type QuestItemDef = ReadQuestItemDef | RetainedQuestItemDef | ActionQuestItemDef | PortalIngredientDef | ObjectiveQuestItemDef;

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = compileAuthoredValidator<{ readonly items: readonly QuestItemDef[] }>(ajv, 'questItems');

/** Canonical source identity, independent of gear instances and allocation sequences. */
export function questItemSource(item: QuestItemDef): string {
  return questItemSourceWithActions(item, [...act5Runtime.actions, ...Object.values(cowRuntime.actions)]);
}

/** Resolve a historical item using only the supplied action-source identities. */
export function questItemSourceWithActions(item: QuestItemDef,
  sourceActions: readonly { readonly id: string; readonly receiptSource: string }[]): string {
  if (item.kind === 'action' || item.kind === 'portalIngredient' && item.sourceActionId !== undefined) {
    const action = sourceActions.find(row => row.id === item.sourceActionId);
    if (!action) throw new Error('Missing bound quest action source');
    return action.receiptSource;
  }
  return item.kind !== undefined && item.kind !== 'retained'
    ? `${item.sourceQuestId}#objective:${item.sourceObjectiveId}`
    : `${item.sourceQuestId}#reward:questItem`;
}

function exactObjective(quest: QuestDef | undefined, objectiveId: string): QuestObjective | undefined {
  const matching = quest?.objectives.filter(objective => objective.id === objectiveId);
  return matching?.length === 1 ? matching[0] : undefined;
}

function canonicalObject(quest: QuestDef, objective: QuestObjective): boolean {
  return typeof objective.targetId === 'string' && objective.targetId.startsWith('objects/') &&
    objective.targetId.length > 'objects/'.length &&
    (objective.count === undefined || objective.count === 1) &&
    subAreas.some(area => area.id === objective.areaId && area.actId === quest.actId);
}

/** Validate closed definitions and the reciprocal recipe/consumer graph, without gameplay effects. */
export function loadQuestItems(): readonly QuestItemDef[] {
  if (!validate(document)) {
    throw new Error(`quests/items.json: ${ajv.errorsText(validate.errors)}`);
  }
  const ids = new Set<string>();
  const sources = new Set<string>();
  const quests = loadQuests();
  const actions = loadQuestActions();
  const items = document.items as readonly QuestItemDef[];
  for (const item of items) {
    const source = questItemSource(item);
    if (ids.has(item.id) || sources.has(source)) {
      throw new Error('quests/items.json: duplicate quest item or source');
    }
    const quest = quests.find(row => row.id === item.sourceQuestId);
    if (item.kind === 'portalIngredient') {
      const input = cowRuntime.recipe.inputs.find(input => input.itemId === item.id && input.source === source);
      const portal = exactObjective(quest, cowRuntime.recipe.objectiveId);
      const leg = exactObjective(quest, 'obj-find-leg');
      if (!input || item.sourceQuestId !== cowRuntime.questId || item.consumeActionId !== cowRuntime.actions.openPortal.id ||
        quest?.actId !== cowRuntime.actId || quest.giver !== cowRuntime.actions.receiveTome.npcId ||
        portal?.type !== 'transmute' || portal.recipe !== cowRuntime.recipe.id ||
        (item.sourceActionId !== undefined ? item.sourceActionId !== cowRuntime.actions.receiveTome.id || source !== cowRuntime.actions.receiveTome.receiptSource
          : leg?.type !== 'fetch' || leg.itemId !== item.id || leg.areaId !== cowRuntime.hostAreaId ||
            leg.targetId !== 'objects/wirts_remains')) {
        throw new Error('quests/items.json: invalid Cow portal ingredient source/consumer');
      }
    } else if (item.kind === 'action') {
      if (item.id !== 'quest/malahs_potion' || item.sourceQuestId !== 'quests/act5-prison-of-ice' ||
        !act5Runtime.actions.some(action => action.id === item.sourceActionId && action.kind === 'potion') ||
        !act5Runtime.actions.some(action => action.id === item.consumeActionId && action.kind === 'thaw')) {
        throw new Error('quests/items.json: invalid bound potion actions');
      }
    } else if (item.kind !== undefined && item.kind !== 'retained') {
      const objective = exactObjective(quest, item.sourceObjectiveId);
      if (!quest || !objective || (item.kind === 'assembled'
        ? objective.type !== 'transmute' || objective.recipe !== item.recipe
        : item.kind === 'encounter' ? objective.type !== 'kill' || objective.targetId !== 'monsters/act4.mega-demon' ||
          objective.areaId !== 'areas/act4-river-of-flame' || quest.id !== 'quests/act4-hellforge'
        : item.kind === 'delivery' && objective.type === 'give'
          ? !items.some(input => input.kind === 'delivery' && input.outputItemId === item.id &&
              input.sourceQuestId === item.sourceQuestId && input.consumeObjectiveId === item.sourceObjectiveId)
          : objective.type !== 'fetch' || objective.itemId !== item.id ||
            objective.itemRequired !== undefined || !canonicalObject(quest, objective))) {
        throw new Error(`quests/items.json: objective/source mismatch for ${item.id}`);
      }
    } else if (!quest?.rewards || !Object.hasOwn(quest.rewards, 'questItem') || quest.rewards.questItem !== item.id) {
      throw new Error(`quests/items.json: reward/source mismatch for ${item.id}`);
    }
    if (item.kind === undefined && item.effect.allResist !== undefined &&
      (item.id !== 'items/scroll_of_resist' || item.sourceQuestId !== 'quests/act5-prison-of-ice')) {
      throw new Error('quests/items.json: invalid resistance scroll source');
    }
    // The closed schema pins the retained proof to Orb; its owner must also match.
    if (item.kind === 'retained' && !actions.some(action => action.questId === item.sourceQuestId)) {
      throw new Error(`quests/items.json: retained reward/action mismatch for ${item.id}`);
    }
    ids.add(item.id);
    sources.add(source);
  }
  for (const item of items) {
    if (item.kind === 'delivery') {
      const quest = quests.find(row => row.id === item.sourceQuestId);
      const consumer = exactObjective(quest, item.consumeObjectiveId);
      const act = /^acts\/act([1-5])$/.exec(quest?.actId ?? '');
      if (!quest || !consumer || consumer.type !== 'give' || consumer.itemId !== item.id ||
        !questObjectivePrerequisites(quest, item.consumeObjectiveId)?.includes(item.sourceObjectiveId) ||
        !act || !loadTownNpcs(Number(act[1])).some(npc => npc.id === consumer.npcId) ||
        items.filter(other => other.kind === 'delivery' && other.sourceQuestId === item.sourceQuestId &&
          other.consumeObjectiveId === item.consumeObjectiveId).length !== 1) {
        throw new Error(`quests/items.json: delivery/consumer mismatch for ${item.id}`);
      }
      if (item.outputItemId !== undefined) {
        const output = items.find(row => row.id === item.outputItemId);
        if (output?.kind !== 'delivery' || output.sourceQuestId !== item.sourceQuestId ||
          output.sourceObjectiveId !== item.consumeObjectiveId ||
          items.filter(input => input.kind === 'delivery' && input.outputItemId === output.id).length !== 1) {
          throw new Error(`quests/items.json: exchange/output mismatch for ${item.id}`);
        }
      }
    } else if (item.kind === 'encounter' || item.kind === 'retained') {
      const action = actions.find(row => row.id === item.consumeActionId);
      if (!action || !questActionInputs(action).some(input => input.inputSource === questItemSource(item) && input.itemId === item.id)) {
        throw new Error(`quests/items.json: encounter/retained consumer mismatch for ${item.id}`);
      }
    } else if (item.kind === 'component') {
      const output = items.find(row => row.id === item.consumedBy);
      if (output?.kind !== 'assembled' || !output.ingredients.includes(item.id) ||
        (actions.some(action => action.itemId === output.id) && item.requiresAreaClear !== true) ||
        (item.id === 'quest/khalims_flail' && item.requiredActionSource !== 'quests/act3-khalims-will#action:council-victory') ||
        (item.requiredActionSource !== undefined && (item.id !== 'quest/khalims_flail' ||
          questItemSource(item) !== 'quests/act3-khalims-will#objective:obj-flail' || item.requiresAreaClear !== true))) {
        throw new Error(`quests/items.json: component/output mismatch for ${item.id}`);
      }
    } else if (item.kind === 'assembled') {
      const quest = quests.find(row => row.id === item.sourceQuestId);
      const prerequisiteIds = quest ? questObjectivePrerequisites(quest, item.sourceObjectiveId) : undefined;
      const tool = items.find(row => row.id === item.requiredTool);
      const ingredients = item.ingredients.map(id => items.find(row => row.id === id));
      const predecessors = quest?.objectives.filter(objective => prerequisiteIds?.includes(objective.id)) ?? [];
      const consumerQuest = quests.find(row => row.id === item.consumeQuestId);
      const consumer = item.consumeObjectiveId === undefined ? undefined : exactObjective(consumerQuest, item.consumeObjectiveId);
      const action = actions.find(row => row.id === item.consumeActionId);
      const localTool = tool?.sourceQuestId === item.sourceQuestId;
      if (!quest || prerequisiteIds === undefined || tool?.kind !== 'tool' ||
        ingredients.some(ingredient => ingredient?.kind !== 'component' || ingredient.consumedBy !== item.id) ||
        ingredients.some(input => input?.kind === undefined || input.sourceQuestId !== item.sourceQuestId ||
          !predecessors.some(objective => objective.id === input.sourceObjectiveId)) ||
        (localTool && !predecessors.some(objective => objective.id === tool.sourceObjectiveId)) ||
        predecessors.filter(objective => objective.type === 'fetch').length !== ingredients.length + (localTool ? 1 : 0) ||
        !consumerQuest || (item.consumeActionId !== undefined
          ? !action || action.questId !== item.consumeQuestId || action.inputSource !== questItemSource(item) || action.itemId !== item.id ||
            tool.id !== 'quest/horadric_cube' || questItemSource(tool) !== 'quests/act2-horadric-staff#objective:obj-cube'
          : !consumer || consumer.type !== 'interact' || consumer.itemRequired !== item.id || !canonicalObject(consumerQuest, consumer))) {
        throw new Error(`quests/items.json: recipe/consumer mismatch for ${item.id}`);
      }
    }
  }
  for (const action of actions) {
    for (const input of questActionInputs(action)) {
      if (items.filter(item => (item.kind === 'assembled' || item.kind === 'encounter' || item.kind === 'retained') &&
        item.consumeActionId === action.id && item.id === input.itemId && questItemSource(item) === input.inputSource).length !== 1) {
        throw new Error('quests/items.json: action/input mismatch');
      }
    }
  }
  for (const input of cowRuntime.recipe.inputs) {
    if (items.filter(item => item.kind === 'portalIngredient' && item.id === input.itemId &&
      questItemSource(item) === input.source && item.consumeActionId === cowRuntime.actions.openPortal.id).length !== 1) {
      throw new Error('quests/items.json: missing reciprocal Cow recipe input');
    }
  }
  const cube = items.find(item => item.id === cowRuntime.recipe.requiredTool.itemId);
  if (cube?.kind !== 'tool' || questItemSource(cube) !== cowRuntime.recipe.requiredTool.source) {
    throw new Error('quests/items.json: missing retained Cow recipe tool');
  }
  for (const quest of quests) {
    for (const objective of quest.objectives.filter(row => row.type === 'give')) {
      if (!items.some(item => item.kind === 'delivery' && item.sourceQuestId === quest.id &&
        item.consumeObjectiveId === objective.id)) {
        throw new Error(`quests/items.json: missing delivery source for ${quest.id}#${objective.id}`);
      }
    }
  }
  return Object.freeze([...items]);
}
