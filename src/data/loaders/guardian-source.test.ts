import { describe, expect, it } from 'vitest';
import document from '../quests/items.json';
import { loadQuestItems, questItemSource } from './quest-items';
import { loadQuests } from './quests';

const QUEST = 'quests/act3-guardian', ITEM = 'items/soulstone_mephisto';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Guardian definition fixture');
  return value;
}
describe('closed retained Guardian reward definition', () => {
  it('authors the exact retained reward and fixed level47/five-pick cache without a Read or later consumer', () => {
    const item = required(loadQuestItems().find(row => row.id === ITEM));
    expect(item).toEqual({ id: ITEM, sourceQuestId: QUEST, kind: 'retained',
      requiredActionSource: `${QUEST}#action:break-compelling-orb`,
      nameKey: 'inventory:questItems.mephistosSoulstone.name', descKey: 'inventory:questItems.mephistosSoulstone.description' });
    expect(questItemSource(item)).toBe(`${QUEST}#reward:questItem`);
    expect(required(loadQuests().find(row => row.id === QUEST)).rewards).toEqual({
      xp: 18000, lootTable: { tableId: 'loot/mephisto-q', ilvl: 47, picks: 5 }, questItem: ITEM
    });
  });

  it.each(['no-kind', 'effect', 'objective', 'consumer', 'action-consumer', 'recipe', 'no-proof', 'council-proof',
    'future-proof', 'wrong-quest', 'wrong-item'] as const)('rejects retained %s definition drift', fault => {
    const before = document.items, items = structuredClone(before) as Record<string, unknown>[];
    const item = required(items.find(row => row.id === ITEM));
    if (fault === 'no-kind') Reflect.deleteProperty(item, 'kind');
    if (fault === 'effect') item.effect = { skillPoints: 1 };
    if (fault === 'objective') item.sourceObjectiveId = 'obj-kill-mephisto';
    if (fault === 'consumer') item.consumeQuestId = 'quests/act4-hellforge';
    if (fault === 'action-consumer') item.consumeActionId = 'actions/act3-break-compelling-orb';
    if (fault === 'recipe') item.recipe = 'soulstone';
    if (fault === 'no-proof') Reflect.deleteProperty(item, 'requiredActionSource');
    if (fault === 'council-proof') item.requiredActionSource = 'quests/act3-khalims-will#action:council-victory';
    if (fault === 'future-proof') item.requiredActionSource = `${QUEST}#action:future`;
    if (fault === 'wrong-quest') item.sourceQuestId = 'quests/act3-khalims-will';
    if (fault === 'wrong-item') item.id = 'items/future_soulstone';
    try {
      Object.defineProperty(document, 'items', { value: items });
      expect(() => loadQuestItems()).toThrow(/quests\/items.json/);
    } finally { Object.defineProperty(document, 'items', { value: before }); }
  });
});
