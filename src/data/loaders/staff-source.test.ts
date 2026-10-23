import { describe, expect, it } from 'vitest';
import document from '../quests/items.json';
import quests from '../quests/main.json';
import { loadQuestItems, questItemSource } from './quest-items';

const questId = 'quests/act2-horadric-staff';
const staffId = 'quest/horadric_staff';

function replaceItem(id: string, replacement: object, check: () => void): void {
  const original = document.items;
  try {
    Reflect.set(document, 'items', original.map(item => item.id === id ? replacement : item));
    check();
  } finally { Reflect.set(document, 'items', original); }
}

describe('authored Horadric Staff recipe and sources', () => {
  it.each([false, true])('validates recipe predecessors by authored stages rather than display order (same stage: %s)', sameStage => {
    const quest = quests.quests.find(row => row.id === questId);
    if (!quest) throw new Error('Missing Staff quest');
    const originalObjectives = Object.getOwnPropertyDescriptor(quest, 'objectives');
    const originalStages = Object.getOwnPropertyDescriptor(quest, 'objectiveStages');
    if (!originalObjectives) throw new Error('Missing objective descriptor');
    try {
      if (!sameStage) Reflect.set(quest, 'objectives', [...quest.objectives].reverse());
      Reflect.set(quest, 'objectiveStages', sameStage
        ? [['obj-cube', 'obj-shaft', 'obj-amulet', 'obj-transmute']]
        : [['obj-cube', 'obj-shaft', 'obj-amulet'], ['obj-transmute']]);
      if (sameStage) expect(() => loadQuestItems()).toThrow('quests/items.json');
      else expect(loadQuestItems().find(item => item.id === staffId)?.kind).toBe('assembled');
    } finally {
      Object.defineProperty(quest, 'objectives', originalObjectives);
      if (originalStages) Object.defineProperty(quest, 'objectiveStages', originalStages);
      else Reflect.deleteProperty(quest, 'objectiveStages');
    }
  });

  it('binds both fetches and the consumable output to exact canonical objectives', () => {
    const definitions = loadQuestItems();
    expect(definitions.find(item => item.id === 'quest/staff_of_kings')).toMatchObject({
      kind: 'component', sourceQuestId: questId, sourceObjectiveId: 'obj-shaft', consumedBy: staffId
    });
    expect(definitions.find(item => item.id === 'quest/viper_amulet')).toMatchObject({
      kind: 'component', sourceQuestId: questId, sourceObjectiveId: 'obj-amulet', consumedBy: staffId
    });
    const staff = definitions.find(item => item.id === staffId);
    expect(staff).toMatchObject({ kind: 'assembled', sourceQuestId: questId,
      sourceObjectiveId: 'obj-transmute', recipe: 'horadric_staff', requiredTool: 'quest/horadric_cube',
      ingredients: ['quest/staff_of_kings', 'quest/viper_amulet'],
      consumeQuestId: 'quests/act2-seven-tombs', consumeObjectiveId: 'obj-open-tomb' });
    if (!staff) throw new Error('Missing Staff definition');
    expect(questItemSource(staff)).toBe(`${questId}#objective:obj-transmute`);
    const quest = quests.quests.find(row => row.id === questId);
    expect(quest?.objectives[1]).toMatchObject({ id: 'obj-shaft', itemId: 'quest/staff_of_kings',
      areaId: 'areas/act2-far-oasis', targetId: 'objects/staff_of_kings_chest' });
    expect(quest?.objectives[2]).toMatchObject({ id: 'obj-amulet', itemId: 'quest/viper_amulet',
      areaId: 'areas/act2-lost-city', targetId: 'objects/serpent_altar' });
    expect(quest?.rewards).toEqual({ xp: 6000 });
    expect(quests.quests.find(row => row.id === 'quests/act2-seven-tombs')?.objectives[0])
      .toMatchObject({ id: 'obj-open-tomb', targetId: 'objects/tal_rasha_orifice',
        areaId: 'areas/act2-tomb-of-tal-rasha', itemRequired: staffId });
  });

  it.each([
    { effect: { skillPoints: 1 } }, { consumedBy: 'quest/missing' },
    { sourceObjectiveId: 'obj-amulet' }, { kind: 'tool' }, { extra: true }
  ])('rejects a malformed or nonreciprocal component %j', override => {
    const component = document.items.find(item => item.id === 'quest/staff_of_kings');
    if (!component) throw new Error('Missing component definition');
    replaceItem(component.id, { ...component, ...override }, () => {
      expect(() => loadQuestItems()).toThrow('quests/items.json');
    });
  });

  it.each([
    { recipe: 'wrong_recipe' }, { requiredTool: 'quest/staff_of_kings' },
    { ingredients: [] }, { ingredients: ['quest/staff_of_kings', 'quest/staff_of_kings'] },
    { ingredients: ['quest/staff_of_kings'] }, { ingredients: ['quest/missing'] },
    { consumeQuestId: 'quests/missing' }, { consumeObjectiveId: 'obj-kill-duriel' },
    { effect: { skillPoints: 1 } }, { consumedBy: 'quest/missing' }
  ])('rejects an invalid recipe or consumption binding %j', override => {
    const staff = document.items.find(item => item.id === staffId);
    if (!staff) throw new Error('Missing Staff definition');
    replaceItem(staff.id, { ...staff, ...override }, () => {
      expect(() => loadQuestItems()).toThrow('quests/items.json');
    });
  });

  it('rejects an orifice outside the consumer quest act', () => {
    const objective = quests.quests.find(row => row.id === 'quests/act2-seven-tombs')?.objectives[0];
    if (!objective) throw new Error('Missing orifice');
    const original = Object.getOwnPropertyDescriptor(objective, 'areaId');
    try {
      Reflect.set(objective, 'areaId', 'areas/act1-blood-moor');
      expect(() => loadQuestItems()).toThrow('quests/items.json');
    } finally {
      if (original) Object.defineProperty(objective, 'areaId', original);
      else Reflect.deleteProperty(objective, 'areaId');
    }
  });
});
