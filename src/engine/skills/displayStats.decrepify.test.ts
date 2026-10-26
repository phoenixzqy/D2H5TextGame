import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

const skill = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(row => row.id === 'skills-necromancer-decrepify');
if (!skill) throw new Error('Missing authored Decrepify');
it.each([0, 1, 2, 19, 20])('previews complete constant curse tuning and actual rank%i payment', rank => {
  const before = structuredClone(skill), model = computeSkillDisplayModel(skill, rank);
  const expected = { durationSeconds: 3, attackSpeedReductionPercent: 50, damageReductionPercent: 33 };
  expect(rank === 0 ? model.next : model.current).toMatchObject({ decrepify: expected,
    manaCost: Math.round(20 - .3 * (Math.max(1, rank) - 1)), cooldown: 3 });
  if (rank > 0 && rank < 20) expect(model.next).toMatchObject({ decrepify: expected,
    manaCost: Math.round(20 - .3 * rank) });
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(skill).toEqual(before);
});
it('does not advertise complete curse potency from missing or contradictory metadata', () => {
  for (const statusEffect of [{}, { durationMs: 3000, attackSpeedReductionPct: 50 },
    { durationMs: 3000, attackSpeedReductionPct: Infinity, damageReductionPct: 33 }])
    expect(computeSkillRankDisplayStats({ ...skill, statusEffect }, 1)).not.toHaveProperty('decrepify');
});
