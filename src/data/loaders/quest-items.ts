/** JSON-authored bound quest items; dependencies flow from items to quests only. */
import Ajv2020 from 'ajv/dist/2020';
import schema from '../schema/quest-item.schema.json';
import document from '../quests/items.json';
import { loadQuests } from './quests';

/** A unique quest reward entitlement and its one-time Read effect. */
export interface QuestItemDef {
  readonly id: string;
  readonly sourceQuestId: string;
  readonly nameKey: string;
  readonly descKey: string;
  readonly effect: { readonly skillPoints: number };
}

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = ajv.compile<{ readonly items: readonly QuestItemDef[] }>(schema);

/** Canonical source identity, independent of gear instances and allocation sequences. */
export function questItemSource(item: QuestItemDef): string {
  return `${item.sourceQuestId}#reward:questItem`;
}

/** Validate the entire definition document and its unique authored reward sources. */
export function loadQuestItems(): readonly QuestItemDef[] {
  if (!validate(document)) {
    throw new Error(`quests/items.json: ${ajv.errorsText(validate.errors)}`);
  }
  const ids = new Set<string>();
  const sources = new Set<string>();
  const quests = loadQuests();
  for (const item of document.items) {
    if (ids.has(item.id) || sources.has(item.sourceQuestId)) {
      throw new Error('quests/items.json: duplicate quest item or source');
    }
    const quest = quests.find(row => row.id === item.sourceQuestId);
    if (!quest?.rewards || !Object.hasOwn(quest.rewards, 'questItem') ||
      quest.rewards.questItem !== item.id) {
      throw new Error(`quests/items.json: reward/source mismatch for ${item.id}`);
    }
    ids.add(item.id);
    sources.add(item.sourceQuestId);
  }
  return Object.freeze([...document.items]);
}
