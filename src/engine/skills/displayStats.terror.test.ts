import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';
const skill = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(row => row.id === 'skills-necromancer-terror');
if (!skill) throw new Error('Missing authored Terror');
// Combat's existing cooldown resolver rounds to tenths before scheduling casts.
it.each([[0, 3, 3], [1, 3, 3], [2, 3, 2.9], [18, 2.1, 2.1], [19, 2.1, 2], [20, 2, undefined]] as const)(
  'previews actual finite fear/payment/cooldown at rank%i', (rank, cooldown, nextCooldown) => {
  const before = structuredClone(skill), model = computeSkillDisplayModel(skill, rank);
  const shown = rank === 0 ? model.next : model.current;
  expect(shown).toMatchObject({ control: { durationSeconds: 1, bossDurationSeconds: .5 }, manaCost: 7 });
  expect(shown?.cooldown).toBe(cooldown);
  if (rank < 20) expect(model.next).toMatchObject({
    control: { durationSeconds: 1, bossDurationSeconds: .5 }, manaCost: 7, cooldown: nextCooldown
  });
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(skill).toEqual(before);
});
it('reads caller-supplied authored timing instead of the global default', () => {
  const source = { ...skill, statusEffect: { durationMs: 2500, bossDurationMultiplier: .4 } };
  const before = structuredClone(source);
  expect(computeSkillRankDisplayStats(source, 1).control).toEqual({ durationSeconds: 2.5, bossDurationSeconds: 1 });
  expect(source).toEqual(before);
});
it('does not advertise fear from incomplete or contradictory metadata', () => {
  for (const statusEffect of [{}, { durationMs: 1000 }, { durationMs: 1000, bossDurationMultiplier: Infinity },
    { durationMs: 1000, bossDurationMultiplier: .5, chance: .5 }])
    expect(computeSkillRankDisplayStats({ ...skill, statusEffect }, 1)).not.toHaveProperty('control');
});
