import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

const skill = PLAYABLE_CLASS_SKILL_DATA.amazon.find(row => row.id === 'skills-amazon-inner-sight');
if (!skill) throw new Error('Missing authored Amazon Inner Sight');
it.each([0, 1, 2, 18, 19, 20])('previews actual finite Defense reduction and rank%i payment without inventing passive damage', rank => {
  const before = structuredClone(skill), model = computeSkillDisplayModel(skill, rank), safe = Math.max(1, rank);
  expect(rank === 0 ? model.next : model.current).toMatchObject({
    innerSight: { durationSeconds: 8, defenseReductionPercent: 25 },
    manaCost: Math.round(5 - .05 * (safe - 1)),
    cooldown: Math.max(1, Number((3 - .05 * (safe - 1)).toFixed(1)))
  });
  if (rank > 0 && rank < 20) expect(model.next).toMatchObject({
    innerSight: { durationSeconds: 8, defenseReductionPercent: 25 },
    manaCost: Math.round(5 - .05 * rank), cooldown: Math.max(1, Number((3 - .05 * rank).toFixed(1)))
  });
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(skill).not.toHaveProperty('scaling.passiveStatsPerLevel');
  expect(skill).toEqual(before);
});
it('does not advertise a complete effect from missing or contradictory metadata', () => {
  for (const statusEffect of [{}, { durationMs: 8000 }, { durationMs: 8000, defenseReductionPct: Infinity },
    { durationMs: 8000, defenseReductionPct: 25, chance: 1 }])
    expect(computeSkillRankDisplayStats({ ...skill, statusEffect }, 1)).not.toHaveProperty('innerSight');
});
