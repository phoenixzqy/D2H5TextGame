import { describe, expect, it } from 'vitest';
import document from '../quests/items.json';
import quests from '../quests/main.json';
import { loadQuestItems, questItemSource } from './quest-items';

const questId = 'quests/act2-horadric-staff';
const cube = {
  id: 'quest/horadric_cube', sourceQuestId: questId, kind: 'tool', sourceObjectiveId: 'obj-cube',
  nameKey: 'inventory:questItems.horadricCube.name', descKey: 'inventory:questItems.horadricCube.description'
} as const;

describe('authored Cube objective source', () => {
  it('recovers the tool at the canonical coffer instead of issuing it as a completion reward', () => {
    const item = loadQuestItems().find(row => row.id === cube.id);
    expect(item).toEqual(cube);
    if (!item) throw new Error('Missing Cube');
    expect(questItemSource(item)).toBe(`${questId}#objective:obj-cube`);
    const quest = quests.quests.find(row => row.id === questId);
    expect(quest?.objectives[0]).toMatchObject({ id: 'obj-cube', type: 'fetch', itemId: cube.id,
      areaId: 'areas/act2-dry-hills', targetId: 'objects/horadric_cube_chest' });
    expect(quest?.rewards).toEqual({ xp: 6000 });
  });

  it.each([
    { ...cube, effect: { skillPoints: 1 } },
    { ...cube, sourceObjectiveId: 'missing' },
    { ...cube, sourceObjectiveId: 'obj-shaft' },
    { ...cube, id: 'quest/wrong_cube' }
  ])('rejects incompatible tool/source definitions %j', replacement => {
    const original = document.items;
    try {
      Reflect.set(document, 'items', [replacement]);
      expect(() => loadQuestItems()).toThrow('quests/items.json');
    } finally { Reflect.set(document, 'items', original); }
  });

  it.each(['areas/act2_halls_of_the_dead_3', 'areas/act1-blood-moor'])('rejects a noncanonical source area %s', areaId => {
    const objective = quests.quests.find(row => row.id === questId)?.objectives[0];
    if (!objective) throw new Error('Missing Cube objective');
    const original = objective.areaId;
    try {
      Reflect.set(objective, 'areaId', areaId);
      expect(() => loadQuestItems()).toThrow('quests/items.json');
    } finally { Reflect.set(objective, 'areaId', original); }
  });
  it('allows distinct tool objectives from one quest while rejecting duplicate full sources', () => {
    const quest = quests.quests.find(row => row.id === questId);
    if (!quest) throw new Error('Missing Staff quest');
    const originals = { items: document.items, objectives: quest.objectives };
    const retainedItems = originals.items.filter(item => item.sourceQuestId !== questId || item.id === cube.id);
    const shaft = { ...cube, id: 'quest/staff_shaft', sourceObjectiveId: 'obj-shaft' };
    try {
      const objective = quest.objectives.find(row => row.id === 'obj-shaft');
      if (!objective) throw new Error('Missing shaft');
      Reflect.set(quest, 'objectives', quest.objectives.map(row => row === objective ? { ...row, itemId: shaft.id,
        areaId: 'areas/act2-dry-hills', targetId: 'objects/staff_shaft' } : row));
      Reflect.set(document, 'items', [...retainedItems, shaft]);
      expect(loadQuestItems().map(questItemSource)).toContain(`${questId}#objective:obj-shaft`);
      Reflect.set(document, 'items', [...retainedItems,
        { ...cube, id: 'quest/duplicate' }]);
      expect(() => loadQuestItems()).toThrow('duplicate quest item or source');
    } finally { Reflect.set(document, 'items', originals.items); Reflect.set(quest, 'objectives', originals.objectives); }
  });

});
