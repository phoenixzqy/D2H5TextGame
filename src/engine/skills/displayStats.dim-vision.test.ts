import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

const skill = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(row => row.id === 'skills-necromancer-dim-vision');
if (!skill) throw new Error('Missing authored Dim Vision');
it.each([
  { rank: 0, mana: 9, cooldown: 3 }, { rank: 1, mana: 9, cooldown: 3 },
  { rank: 2, mana: 9, cooldown: 3 }, { rank: 18, mana: 6, cooldown: 2.1 },
  { rank: 19, mana: 5, cooldown: 2.1 }, { rank: 20, mana: 5, cooldown: 2 }
])('previews finite blindness and actual rank$rank payment', ({ rank, mana, cooldown }) => {
  const before = structuredClone(skill), model = computeSkillDisplayModel(skill, rank);
  const stats = rank === 0 ? model.next : model.current;
  expect(stats).toMatchObject({ dimVision: { durationSeconds: 3, physicalHitChanceReductionPoints: 50 }, manaCost: mana });
  expect(stats?.cooldown).toBeCloseTo(cooldown, 8);
  if (rank > 0 && rank < 20) expect(model.next).toHaveProperty('dimVision', { durationSeconds: 3, physicalHitChanceReductionPoints: 50 });
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(skill).toEqual(before);
});
it('does not advertise paid blindness from incomplete or mismatched data', () => {
  for (const statusEffect of [{}, { durationMs: 3000 }, { physicalHitChanceReductionPct: 50 },
    { durationMs: 3000, physicalHitChanceReductionPct: NaN },
    { durationMs: 3000, physicalHitChanceReductionPct: 50, chance: .5 }])
    expect(computeSkillRankDisplayStats({ ...skill, statusEffect }, 1)).not.toHaveProperty('dimVision');
});
