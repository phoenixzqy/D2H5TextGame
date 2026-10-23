import { describe, expect, it } from 'vitest';
import items from '../quests/items.json';
import quests from '../quests/main.json';
import { loadQuestItems } from './quest-items';

const questId = 'quests/act3-lam-esens-tome';
describe('closed delivery source graph', () => {
  it.each([
    { consumeObjectiveId: 'obj-find-tome' }, { consumeObjectiveId: 'missing' },
    { sourceObjectiveId: 'obj-deliver' }, { sourceQuestId: 'quests/act3-guardian' },
    { effect: { skillPoints: 1 } }, { consumedBy: 'quest/horadric_staff' }, { extra: true }
  ])('rejects invalid source, consumer, cycles or effect %j', override => {
    const original = items.items;
    try {
      Reflect.set(items, 'items', original.map(item => item.id === 'quest/lam_esens_tome' ? { ...item, ...override } : item));
      expect(() => loadQuestItems()).toThrow('quests/items.json');
    } finally { Reflect.set(items, 'items', original); }
  });

  it.each([{ npcId: 'npc/akara' }, { itemId: 'quest/gidbinn' }, { type: 'talk' }])(
    'rejects a mismatched hand-in objective %j', override => {
      const quest = quests.quests.find(row => row.id === questId);
      if (!quest) throw new Error('Missing canonical Tome quest');
      const original = quest.objectives;
      try {
        Reflect.set(quest, 'objectives', original.map(objective => objective.id === 'obj-deliver' ? { ...objective, ...override } : objective));
        expect(() => loadQuestItems()).toThrow();
      } finally { Reflect.set(quest, 'objectives', original); }
    }
  );

  it('rejects an orphan Give without a source-bound delivery definition', () => {
    const original = items.items;
    try {
      Reflect.set(items, 'items', original.filter(item => item.id !== 'quest/lam_esens_tome'));
      expect(() => loadQuestItems()).toThrow(/delivery/);
    } finally { Reflect.set(items, 'items', original); }
  });
});
