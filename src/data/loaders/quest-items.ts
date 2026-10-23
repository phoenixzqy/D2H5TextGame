/** JSON-authored bound quest items; dependencies flow from items to quests only. */
import Ajv2020 from 'ajv/dist/2020';
import schema from '../schema/quest-item.schema.json';
import document from '../quests/items.json';
import { loadQuests } from './quests';
import { subAreas } from '../index';

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
  readonly effect: { readonly skillPoints: number };
}

/** Retained tool issued only by its explicit authored fetch objective. */
export interface QuestToolDef extends QuestItemBase {
  readonly kind: 'tool';
  readonly sourceObjectiveId: string;
  readonly effect?: never;
}

export type QuestItemDef = ReadQuestItemDef | QuestToolDef;

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = ajv.compile<{ readonly items: readonly QuestItemDef[] }>(schema);

/** Canonical source identity, independent of gear instances and allocation sequences. */
export function questItemSource(item: QuestItemDef): string {
  return item.kind === 'tool'
    ? `${item.sourceQuestId}#objective:${item.sourceObjectiveId}`
    : `${item.sourceQuestId}#reward:questItem`;
}

/** Validate the entire definition document and its unique authored reward sources. */
export function loadQuestItems(): readonly QuestItemDef[] {
  if (!validate(document)) {
    throw new Error(`quests/items.json: ${ajv.errorsText(validate.errors)}`);
  }
  const ids = new Set<string>();
  const sources = new Set<string>();
  const quests = loadQuests();
  for (const item of document.items as readonly QuestItemDef[]) {
    const source = questItemSource(item);
    if (ids.has(item.id) || sources.has(source)) {
      throw new Error('quests/items.json: duplicate quest item or source');
    }
    const quest = quests.find(row => row.id === item.sourceQuestId);
    if (item.kind === 'tool') {
      const objective = quest?.objectives.find(row => row.id === item.sourceObjectiveId);
      if (!quest || objective?.type !== 'fetch' || objective.itemId !== item.id ||
        typeof objective.targetId !== 'string' || !objective.targetId.startsWith('objects/') ||
        objective.targetId.length <= 'objects/'.length || objective.itemRequired !== undefined ||
        (objective.count !== undefined && objective.count !== 1) ||
        !subAreas.some(area => area.id === objective.areaId && area.actId === quest.actId)) {
        throw new Error(`quests/items.json: objective/source mismatch for ${item.id}`);
      }
    } else if (!quest?.rewards || !Object.hasOwn(quest.rewards, 'questItem') || quest.rewards.questItem !== item.id) {
      throw new Error(`quests/items.json: reward/source mismatch for ${item.id}`);
    }
    ids.add(item.id);
    sources.add(source);
  }
  return Object.freeze([...document.items] as QuestItemDef[]);
}
