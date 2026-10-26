import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

const nova = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(row => row.id === 'skills-necromancer-poison-nova');
if (!nova) throw new Error('Missing authored Nova');
it.each([0, 1, 2, 19, 20])('shows authored Nova two-stack poison at rank%i without guessed final DPS', rank => {
  const before = structuredClone(nova), model = computeSkillDisplayModel(nova, rank);
  expect((rank === 0 ? model.next : model.current)?.periodic).toEqual({
    statusId: 'poison', percentOfHit: 5, durationSeconds: 5, maxStacks: 10, minDps: 1, stacksOnApply: 2
  });
  expect(nova).toEqual(before);
});
it('refuses invalid multi-stack previews rather than promising unsupported rates', () => {
  for (const stacksOnApply of [0, -1, 1.5, 11, NaN, Infinity]) {
    expect(computeSkillRankDisplayStats({ ...nova, statusEffect: { dotPctOfDamage: .05, stacksOnApply } }, 1).periodic).toBeUndefined();
  }
});
