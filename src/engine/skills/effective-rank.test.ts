import { describe, expect, it } from 'vitest';
import { effectiveLearnedSkillRank } from './effective-rank';

describe('learned authority versus temporary skill potency', () => {
  it.each([[1, 2], [20, 21], [31, 32]])('raises learned rank%s above allocation caps to %s', (learned, expected) => {
    expect(effectiveLearnedSkillRank(learned, 1)).toBe(expected);
    expect(effectiveLearnedSkillRank(learned)).toBe(learned);
    expect(effectiveLearnedSkillRank(learned, 0)).toBe(learned);
  });
  it.each([0, -1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '20', null, true])(
    'never grants authority from malformed or unlearned rank %s', value => {
      expect(effectiveLearnedSkillRank(value as number, 1)).toBe(0);
    });
  it.each([-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '1', null, true])(
    'ignores malformed temporary bonus %s without disabling the learned skill', value => {
      expect(effectiveLearnedSkillRank(20, value as number)).toBe(20);
    });
  it('rejects unsafe addition and permits a safe sum at the boundary', () => {
    expect(effectiveLearnedSkillRank(20, Number.MAX_SAFE_INTEGER)).toBe(20);
    expect(effectiveLearnedSkillRank(20, Number.MAX_SAFE_INTEGER - 20)).toBe(Number.MAX_SAFE_INTEGER);
  });
});
