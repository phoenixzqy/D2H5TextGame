import { describe, expect, it } from 'vitest';
import { questObjectivePrerequisites, questObjectivePrerequisitesMet } from './questStages';

const quest = { objectives: ['heart', 'brain', 'eye', 'flail', 'assemble'].map(id => ({ id })) };

describe('quest objective stages', () => {
  it('preserves omitted serial order and refuses unknown objectives', () => {
    expect(questObjectivePrerequisites(quest, 'heart')).toEqual([]);
    expect(questObjectivePrerequisites(quest, 'eye')).toEqual(['heart', 'brain']);
    expect(questObjectivePrerequisitesMet(quest, { heart: true }, 'eye')).toBe(false);
    expect(questObjectivePrerequisitesMet(quest, { heart: true, brain: true }, 'eye')).toBe(true);
    expect(questObjectivePrerequisites(quest, 'missing')).toBeUndefined();
    expect(questObjectivePrerequisitesMet(quest, {}, 'missing')).toBe(false);
  });

  it('uses earlier groups rather than display order or peers', () => {
    const staged = { ...quest, objectiveStages: [['eye'], ['flail', 'brain', 'heart'], ['assemble']] };
    expect(questObjectivePrerequisites(staged, 'eye')).toEqual([]);
    expect(questObjectivePrerequisites(staged, 'heart')).toEqual(['eye']);
    expect(questObjectivePrerequisitesMet(staged, { eye: true }, 'heart')).toBe(true);
    expect(questObjectivePrerequisitesMet(staged, { eye: true, heart: true, brain: true }, 'assemble')).toBe(false);
    expect(questObjectivePrerequisitesMet(staged, { eye: true, heart: true, brain: true, flail: true }, 'assemble')).toBe(true);
    expect(questObjectivePrerequisitesMet({ ...quest, objectiveStages: [['eye']] }, {}, 'heart')).toBe(false);
  });

  it('requires own boolean true flags without mutating caller data', () => {
    const flags = Object.assign(Object.create({ heart: true }) as Record<string, boolean>, { brain: true });
    expect(questObjectivePrerequisitesMet(quest, flags, 'eye')).toBe(false);
    const before = Object.getOwnPropertyDescriptors(flags);
    expect(questObjectivePrerequisitesMet(quest, flags, 'heart')).toBe(true);
    expect(Object.getOwnPropertyDescriptors(flags)).toEqual(before);
    expect(questObjectivePrerequisitesMet(quest, { heart: false, brain: true }, 'eye')).toBe(false);
  });
});
