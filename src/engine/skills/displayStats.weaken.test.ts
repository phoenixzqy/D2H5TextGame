import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

const skill = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(row => row.id === 'skills-necromancer-weaken');
if (!skill) throw new Error('Missing authored Weaken');
it.each([0, 1, 2, 18, 19, 20])('previews complete constant curse and actual rank%i mana', rank => {
  const before = structuredClone(skill), model = computeSkillDisplayModel(skill, rank);
  const expected = { durationSeconds: 3, damageReductionPercent: 33 };
  expect(rank === 0 ? model.next : model.current).toMatchObject({ weaken: expected,
    manaCost: Math.round(6 - .2 * (Math.max(1, rank) - 1)), cooldown: 3 });
  if (rank > 0 && rank < 20) expect(model.next).toMatchObject({ weaken: expected, manaCost: Math.round(6 - .2 * rank) });
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(skill).toEqual(before);
});
it('never advertises a complete curse from missing or contradictory metadata', () => {
  for (const statusEffect of [{}, { durationMs: 3000 }, { durationMs: 3000, damageReductionPct: Infinity },
    { durationMs: 3000, damageReductionPct: 33, attackSpeedReductionPct: 50 }])
    expect(computeSkillRankDisplayStats({ ...skill, statusEffect }, 1)).not.toHaveProperty('weaken');
});
