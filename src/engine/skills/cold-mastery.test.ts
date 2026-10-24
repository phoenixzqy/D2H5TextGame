import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/sorceress.json';
import { COLD_MASTERY_DEFINITION, coldMasteryReductionAtRank, composeColdMastery,
  resolveColdMasteryDefinition, resolveColdMasteryRank } from './cold-mastery';

const CANONICAL = 'sorceress.cold_mastery';
const AUTHORED = 'skills-sorceress-cold-mastery';
describe('Cold Mastery authored definition and allocated rank', () => {
  it('copies immutable primitive tuning without retaining or freezing caller data', () => {
    const row = structuredClone(skills.find(s => s.id === AUTHORED));
    if (!row?.coldMastery) throw new Error('Missing test definition');
    const before = structuredClone(row);
    const copied = resolveColdMasteryDefinition([row]);
    expect(copied).toEqual({ requiredLevel: 30, maxRank: 20,
      resistanceReductionPct: 15, resistanceReductionPerRankPct: 4 });
    expect(COLD_MASTERY_DEFINITION).toEqual(copied);
    expect(Object.isFrozen(copied)).toBe(true);
    expect(row).toEqual(before); expect(Object.isFrozen(row)).toBe(false);
    row.coldMastery.resistanceReductionPct = 99;
    expect(copied.resistanceReductionPct).toBe(15);
    expect(Reflect.set(copied, 'resistanceReductionPct', 99)).toBe(false);
  });
  it('requires one exact valid authored identity', () => {
    const row = skills.find(s => s.id === AUTHORED);
    for (const rows of [[], [null, 1, {}], [row, row], [{ ...row, id: CANONICAL }],
      [{ ...row, coldMastery: { resistanceReductionPct: -1, resistanceReductionPerRankPct: 4 } }]]) {
      expect(() => resolveColdMasteryDefinition(rows)).toThrow(/Cold Mastery/);
    }
  });
  it('uses alternate valid tuning instead of embedded gameplay constants', () => {
    const row = skills.find(s => s.id === AUTHORED);
    const def = resolveColdMasteryDefinition([{ ...row, requiredLevel: 9, maxLevel: 3,
      coldMastery: { resistanceReductionPct: 5, resistanceReductionPerRankPct: 2 } }]);
    expect(coldMasteryReductionAtRank(99, def)).toBe(9);
    expect(resolveColdMasteryRank({ [CANONICAL]: 99 }, def)).toBe(3);
  });
  it.each([0, -1, 1.5, NaN, Infinity, -Infinity])('ignores invalid allocated rank %s', rank => {
    expect(resolveColdMasteryRank({ [CANONICAL]: rank })).toBe(0);
    expect(resolveColdMasteryRank({ [CANONICAL]: rank, [AUTHORED]: 2 })).toBe(2);
    expect(coldMasteryReductionAtRank(rank)).toBe(0);
  });
  it('takes the maximum of exact aliases once and does not infer a missing allocation', () => {
    expect(resolveColdMasteryRank({ [CANONICAL]: 1, [AUTHORED]: 20 })).toBe(20);
    expect(resolveColdMasteryRank({ [AUTHORED]: 1, [CANONICAL]: 20 })).toBe(20);
    expect(resolveColdMasteryRank()).toBe(0);
    expect(resolveColdMasteryRank({ 'sorceress.cold-mastery': 20 })).toBe(0);
  });
  it.each([[0, 0], [1, 15], [2, 19], [20, 91], [99, 91]])(
    'rank%s gives%s percentage points', (rank, expected) => {
      expect(coldMasteryReductionAtRank(rank)).toBe(expected);
    });
  it('requires finite eligible character level and exact class', () => {
    for (const level of [1, 29, NaN, Infinity, -Infinity]) {
      expect(composeColdMastery({ class: 'sorceress', level, skillLevels: { [CANONICAL]: 20 } })).toBe(0);
    }
    expect(composeColdMastery({ class: 'amazon', level: 99, skillLevels: { [CANONICAL]: 20 } })).toBe(0);
    expect(composeColdMastery({ class: 'sorceress', level: 30, skillLevels: {} })).toBe(0);
    expect(composeColdMastery({ class: 'sorceress', level: 30, skillLevels: { [CANONICAL]: 20 } })).toBe(91);
  });
});
