import { describe, expect, it } from 'vitest';
import document from '../quests/items.json';
import actionDocument from '../quests/actions.json';
import { loadQuestItems, questItemSource } from './quest-items';
import { loadQuestActions } from './quest-actions';
import { loadQuests } from './quests';

function mutateItems(check: (items: Record<string, unknown>[]) => void, verify: () => void): void {
  const before = document.items;
  const items = structuredClone(before) as Record<string, unknown>[];
  try { check(items); Object.defineProperty(document, 'items', { value: items }); verify(); }
  finally { Object.defineProperty(document, 'items', { value: before }); }
}
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Khalim data fixture');
  return value;
}

describe('closed Khalim recipe and Guardian action graph', () => {
  it('resolves unordered actual component sources and the same exact retained Act II Cube', () => {
    const items = loadQuestItems(), actions = loadQuestActions();
    const will = required(items.find(item => item.id === 'items/khalims_will'));
    const cube = required(items.find(item => item.id === 'quest/horadric_cube'));
    expect(questItemSource(cube)).toBe('quests/act2-horadric-staff#objective:obj-cube');
    expect(will).toMatchObject({ kind: 'assembled', requiredTool: cube.id,
      ingredients: ['quest/khalims_heart', 'quest/khalims_brain', 'quest/khalims_eye', 'quest/khalims_flail'],
      consumeQuestId: 'quests/act3-guardian', consumeActionId: 'actions/act3-break-compelling-orb' });
    expect(will).not.toHaveProperty('consumeObjectiveId');
    expect(actions.map(action => action.id)).toEqual(['actions/act3-break-compelling-orb', 'actions/act4-shatter-soulstone']);
    expect(actions[0]).toMatchObject({ questId: 'quests/act3-guardian',
      inputSource: questItemSource(will), itemId: will.id });
    const quest = required(loadQuests().find(row => row.id === 'quests/act3-khalims-will'));
    expect(quest.objectiveStages).toEqual([['obj-heart', 'obj-brain', 'obj-eye', 'obj-flail'], ['obj-transmute']]);
    expect(quest.rewards).toEqual({ xp: 8000 }); expect(quest.unlocks).toBeNull();
  });

  it.each(['no-clear', 'no-proof', 'wrong-proof', 'wrong-action', 'two-consumers', 'missing-component', 'wrong-tool'])(
    'rejects mutated %s definitions rather than weakening the source graph', fault => {
      mutateItems(items => {
        const flail = required(items.find(item => item.id === 'quest/khalims_flail'));
        const will = required(items.find(item => item.id === 'items/khalims_will'));
        if (fault === 'no-clear') Reflect.deleteProperty(flail, 'requiresAreaClear');
        if (fault === 'no-proof') Reflect.deleteProperty(flail, 'requiredActionSource');
        if (fault === 'wrong-proof') flail.requiredActionSource = 'quests/act3-guardian#action:break-compelling-orb';
        if (fault === 'wrong-action') will.consumeActionId = 'actions/future';
        if (fault === 'two-consumers') will.consumeObjectiveId = 'obj-kill-mephisto';
        if (fault === 'missing-component') will.ingredients = ['quest/khalims_heart', 'quest/khalims_brain', 'quest/khalims_eye'];
        if (fault === 'wrong-tool') will.requiredTool = 'quest/staff_of_kings';
      }, () => { expect(() => loadQuestItems()).toThrow(/quests\/items.json/); });
    });

  it.each([
    { id: 'actions/future' }, { receiptSource: 'quests/act3-khalims-will#action:break-compelling-orb' },
    { inputSource: 'quests/act3-guardian#action:break-compelling-orb' },
    { inputSource: 'quests/act3-guardian#objective:obj-kill-mephisto' },
    { itemId: 'quest/horadric_staff' }, { targetId: 'objects/lookalike_orb' }, { extra: true }
  ])('rejects unknown, cyclic or mismatched action data %j', patch => {
    const before = actionDocument.actions;
    try {
      Object.defineProperty(actionDocument, 'actions', { value: [{ ...required(before[0]), ...patch }, ...before.slice(1)] });
      expect(() => loadQuestActions()).toThrow(/quests\/actions.json/);
      expect(() => loadQuestItems()).toThrow(/quests\/actions.json/);
    } finally { Object.defineProperty(actionDocument, 'actions', { value: before }); }
  });

  it.each([0, 2])('rejects a missing or duplicate Orb action with %s copies', count => {
    const before = actionDocument.actions;
    try {
      Object.defineProperty(actionDocument, 'actions', { value: [...Array.from({ length: count }, () => required(before[0])), ...before.slice(1)] });
      expect(() => loadQuestActions()).toThrow(/quests\/actions.json/);
      expect(() => loadQuestItems()).toThrow(/quests\/actions.json/);
    } finally { Object.defineProperty(actionDocument, 'actions', { value: before }); }
  });
});
