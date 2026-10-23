import { describe, expect, it } from 'vitest';
import document from '../quests/items.json';
import { loadQuestItems, questItemSource } from './quest-items';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Golden Bird fixture');
  return value;
}

function withItems(change: (items: typeof document.items) => void, check: () => void): void {
  const descriptor = Object.getOwnPropertyDescriptor(document, 'items');
  if (!descriptor) throw new Error('Missing quest item definitions');
  try {
    const items = structuredClone(document.items);
    change(items);
    Object.defineProperty(document, 'items', { ...descriptor, value: items });
    check();
  } finally { Object.defineProperty(document, 'items', descriptor); }
}

describe('Golden Bird closed authored item graph', () => {
  it('binds each exchange output to the preceding exact Give source and closes the Read effect', () => {
    const items = loadQuestItems().filter(item => item.sourceQuestId === 'quests/act3-golden-bird');
    expect(items.map(item => [item.id, questItemSource(item)])).toEqual([
      ['quest/jade_figurine', 'quests/act3-golden-bird#objective:obj-find-figurine'],
      ['quest/golden_bird', 'quests/act3-golden-bird#objective:obj-give-cain'],
      ['items/potion_of_life_q', 'quests/act3-golden-bird#reward:questItem']
    ]);
    expect(items.find(item => item.id === 'quest/jade_figurine')).toMatchObject({
      consumeObjectiveId: 'obj-give-cain', outputItemId: 'quest/golden_bird'
    });
    expect(items.find(item => item.id === 'items/potion_of_life_q')?.effect).toEqual({ maxLife: 20 });
  });

  it.each([
    { outputItemId: 'quest/missing' }, { outputItemId: 'quest/jade_figurine' },
    { outputItemId: 'items/potion_of_life_q' }, { outputItemId: 'quest/gidbinn' },
    { consumeObjectiveId: 'obj-give-alkor' }, { sourceObjectiveId: 'obj-give-alkor' },
    { outputItemId: undefined }
  ])('rejects a missing, cyclic, cross-source or nonreciprocal exchange %j', change => {
    withItems(items => { Object.assign(required(items.find(item => item.id === 'quest/jade_figurine')), change); },
      () => { expect(() => loadQuestItems()).toThrow('quests/items.json'); });
  });

  it.each([
    {}, { maxLife: 0 }, { maxLife: -20 }, { maxLife: 0.5 }, { maxLife: Infinity },
    { maxLife: Number.MAX_SAFE_INTEGER + 1 }, { maxLife: 20, skillPoints: 1 },
    { maxLife: 20, xp: 1 }
  ])('rejects unsupported or unsafe Read effects %j', effect => {
    withItems(items => { Object.assign(required(items.find(item => item.id === 'items/potion_of_life_q')), { effect }); },
      () => { expect(() => loadQuestItems()).toThrow('quests/items.json'); });
  });
});
