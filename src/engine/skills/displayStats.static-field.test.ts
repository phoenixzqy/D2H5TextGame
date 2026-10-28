import { describe, expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

const skill = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(row => row.id === 'skills-sorceress-static-field');
if (!skill?.staticField) throw new Error('Missing authored Static Field');
const tuning = skill.staticField;

describe('Static Field difficulty-floor display', () => {
  it.each([0, 1, 20])('shows the JSON-owned Hell floor at rank%i with preserved current-health and Nightmare values', rank => {
    const before = structuredClone(skill), model = computeSkillDisplayModel(skill, rank);
    const shown = rank === 0 ? model.next : model.current;
    const rows = [
      { id: 'staticFieldCurrentHealth', labelKey: 'details.staticField.currentHealth', value: 0.25, valueKind: 'percent' },
      { id: 'staticFieldNightmareFloor', labelKey: 'details.staticField.nightmareFloor', value: 0.33, valueKind: 'percent' },
      { id: 'staticFieldHellFloor', labelKey: 'details.staticField.hellFloor', value: 0.5, valueKind: 'percent' }
    ];
    expect(shown?.utility).toEqual(rows);
    if (rank === 1) expect(model.next?.utility).toEqual(rows);
    if (rank === 0) expect(model.current).toBeUndefined();
    if (rank === 20) expect(model.next).toBeUndefined();
    expect(skill).toEqual(before);
  });

  it('reads caller-authored Hell tuning without freezing or mutating the source', () => {
    const source = { ...skill, staticField: { ...tuning, hellFloorFraction: 0.6 } };
    const before = structuredClone(source);
    expect(computeSkillRankDisplayStats(source, 1).utility).toContainEqual({
      id: 'staticFieldHellFloor', labelKey: 'details.staticField.hellFloor', value: 0.6, valueKind: 'percent'
    });
    expect(source).toEqual(before);
    expect(Object.isFrozen(source.staticField)).toBe(false);
  });
});
