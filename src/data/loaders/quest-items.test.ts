import { describe, expect, it } from 'vitest';
import document from '../quests/items.json';
import quests from '../quests/main.json';
import { loadQuestItems, questItemSource } from './quest-items';

const book = {
  id: 'items/book_of_skill', sourceQuestId: 'quests/act2-radaments-lair',
  nameKey: 'inventory:questItems.bookOfSkill.name',
  descKey: 'inventory:questItems.bookOfSkill.description', effect: { skillPoints: 1 }
};

function withDocument(value: object, check: () => void): void {
  const original = Object.getOwnPropertyDescriptors(document);
  const clear = () => { for (const key of Reflect.ownKeys(document)) Reflect.deleteProperty(document, key); };
  try { clear(); Object.assign(document, value); check(); }
  finally { clear(); Object.defineProperties(document, original); }
}

describe('bound quest item definitions', () => {
  it('resolves the authored one-point book and its unique source without changing data', () => {
    const before = JSON.stringify(document);
    const items = loadQuestItems();
    expect(items.find(item => item.id === book.id)).toEqual(book);
    expect(items.map(item => item.id)).toEqual([book.id, 'quest/horadric_cube',
      'quest/staff_of_kings', 'quest/viper_amulet', 'quest/horadric_staff',
      'quest/gidbinn', 'quest/lam_esens_tome', 'quest/jade_figurine',
      'quest/golden_bird', 'items/potion_of_life_q']);
    expect(questItemSource(book)).toBe('quests/act2-radaments-lair#reward:questItem');
    expect(Object.isFrozen(items)).toBe(true);
    expect(JSON.stringify(document)).toBe(before);
  });

  it.each([
    {}, { items: null }, { items: [null] }, { items: [{ ...book, typo: 1 }] },
    { items: [{ ...book, effect: { skillPoints: 1, xp: 5 } }] },
    { items: [{ ...book, id: '../book' }] },
    { items: [{ ...book, sourceQuestId: 'quests/quest#reward:questItem' }] },
    ...[0, -1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '1', undefined].map(skillPoints =>
      ({ items: [{ ...book, effect: { skillPoints } }] })),
    { items: [{ ...book, nameKey: '' }] },
    { items: [{ ...book, descKey: undefined }] }
  ])('rejects malformed document %j without repair', value => {
    withDocument(value, () => {
      const before = Object.getOwnPropertyDescriptors(document);
      expect(() => loadQuestItems()).toThrow('quests/items.json');
      expect(Object.getOwnPropertyDescriptors(document)).toEqual(before);
    });
  });

  it.each([
    { items: [book, book] },
    { items: [book, { ...book, id: 'items/second-book' }] },
    { items: [book, { ...book, sourceQuestId: 'quests/act1-den-of-evil' }] }
  ])('rejects duplicate or conflicting identity/source %j', ({ items }) => {
    withDocument({ items }, () => { expect(() => loadQuestItems()).toThrow(/duplicate/); });
  });

  it.each([
    { ...book, id: 'items/other-book' },
    { ...book, sourceQuestId: 'quests/unknown' },
    { ...book, sourceQuestId: 'quests/act1-den-of-evil' }
  ])('rejects a noncanonical reward pairing %j', item => {
    withDocument({ items: [item] }, () => { expect(() => loadQuestItems()).toThrow(/mismatch/); });
  });

  it('does not accept an inherited questItem reward as an authored source', () => {
    const quest = quests.quests.find(row => row.id === book.sourceQuestId);
    if (!quest) throw new Error('Missing Radament quest');
    const descriptor = Object.getOwnPropertyDescriptor(quest, 'rewards');
    if (!descriptor) throw new Error('Missing rewards');
    try {
      Object.defineProperty(quest, 'rewards', { ...descriptor,
        value: Object.create({ questItem: book.id }) });
      expect(() => loadQuestItems()).toThrow(/mismatch/);
    } finally { Object.defineProperty(quest, 'rewards', descriptor); }
  });
});
