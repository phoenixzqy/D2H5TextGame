import { describe, expect, it } from 'vitest';
import { loadQuests } from '../loaders/quests';

describe('Radament single-point reward budget', () => {
  it('claims XP and a bound unread book without an immediate quest skill point', () => {
    const quest = loadQuests().find(row => row.id === 'quests/act2-radaments-lair');
    expect(quest?.rewards).toEqual({ xp: 5000, questItem: 'items/book_of_skill' });
  });
});
