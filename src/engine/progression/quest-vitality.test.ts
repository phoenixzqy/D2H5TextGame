import { describe, expect, it } from 'vitest';
import { resolveQuestVitalityBonus } from './quest-vitality';
import type { CountedQuestDomain } from '../map/counted-quest';
import type { QuestItemLedger, QuestProgressData } from '../types/save';

const QUEST = 'quests/side-act5-malahs-elixir';
const sources = Array.from({ length: 5 }, (_, i) => `${QUEST}#objective:obj-collect:source:lichen-${String(i + 1)}`);
const domain: CountedQuestDomain = { key: 'malah', quest: QUEST, objective: 'obj-collect',
  objectiveType: 'collect', itemId: 'quest/frost_lichen', sink: 'claim', sources };
const row: QuestProgressData = { id: QUEST, status: 'completed', rewardClaimed: true,
  objectives: { 'obj-collect': true } };
const items: QuestItemLedger = Object.fromEntries(sources.map(source =>
  [source, { itemId: domain.itemId, state: 'consumed' as const }]));

describe('Malah effective Vitality entitlement', () => {
  it('requires explicit authority plus all five consumed sources and exact claimed completion', () => {
    expect(resolveQuestVitalityBonus({ [QUEST]: row }, items, [domain])).toBe(10);
    expect(resolveQuestVitalityBonus({ [QUEST]: row }, items, [])).toBe(0);
    expect(resolveQuestVitalityBonus({ [QUEST]: row }, {}, [domain])).toBe(0);
    for (const changed of [{ ...row, rewardClaimed: false }, { ...row, status: 'inProgress' as const },
      { ...row, objectives: { 'obj-collect': false } }, { ...row, id: 'quests/wrong' }]) {
      expect(resolveQuestVitalityBonus({ [QUEST]: changed }, items, [domain])).toBe(0);
    }
    for (const source of sources) {
      const partial = { ...items }; Reflect.deleteProperty(partial, source);
      expect(resolveQuestVitalityBonus({ [QUEST]: row }, partial, [domain])).toBe(0);
      expect(resolveQuestVitalityBonus({ [QUEST]: row }, { ...items,
        [source]: { itemId: domain.itemId, state: 'owned' } }, [domain])).toBe(0);
      expect(resolveQuestVitalityBonus({ [QUEST]: row }, { ...items,
        [source]: { itemId: 'items/potion_of_life_q', state: 'consumed' } }, [domain])).toBe(0);
    }
  });

  it('does not execute malformed row or source getters, or inherit ownership', () => {
    let reads = 0;
    const accessor = { ...row };
    Object.defineProperty(accessor, 'rewardClaimed', { enumerable: true, get() { reads++; return true; } });
    expect(resolveQuestVitalityBonus({ [QUEST]: accessor }, items, [domain])).toBe(0);
    const source = sources[0]; if (!source) throw new Error('Missing fixture source');
    const badItems = { ...items };
    Object.defineProperty(badItems, source, { enumerable: true, get() { reads++; return items[source]; } });
    expect(resolveQuestVitalityBonus({ [QUEST]: row }, badItems, [domain])).toBe(0);
    expect(resolveQuestVitalityBonus(Object.create({ [QUEST]: row }) as Record<string, QuestProgressData>, items, [domain])).toBe(0);
    expect(resolveQuestVitalityBonus({ [QUEST]: row }, Object.create(items) as QuestItemLedger, [domain])).toBe(0);
    expect(reads).toBe(0);
  });
});
