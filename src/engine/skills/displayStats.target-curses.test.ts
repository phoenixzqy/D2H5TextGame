import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

for (const id of ['confuse', 'attract'] as const) {
  const skill = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(row => row.id === 'skills-necromancer-' + id);
  if (!skill) throw new Error('Missing authored target curse');
  it.each([
    { rank: 0, confuseMana: 13, attractCooldown: 3 }, { rank: 1, confuseMana: 13, attractCooldown: 3 },
    { rank: 2, confuseMana: 13, attractCooldown: 3 }, { rank: 18, confuseMana: 9, attractCooldown: 2.1 },
    { rank: 19, confuseMana: 9, attractCooldown: 2.1 }, { rank: 20, confuseMana: 8, attractCooldown: 2 }
  ])(id + ' rank$rank previews actual finite duration and unchanged rounded payment', ({ rank, confuseMana, attractCooldown }) => {
    const before = structuredClone(skill), model = computeSkillDisplayModel(skill, rank);
    const stats = rank === 0 ? model.next : model.current;
    expect(stats).toMatchObject({ targetCurse: { id, durationSeconds: 3 }, manaCost: id === 'confuse' ? confuseMana : 17 });
    expect(stats?.cooldown).toBeCloseTo(id === 'confuse' ? 3 : attractCooldown, 8);
    if (rank > 0 && rank < 20) expect(model.next).toHaveProperty('targetCurse', { id, durationSeconds: 3 });
    if (rank === 20) expect(model.next).toBeUndefined();
    expect(skill).toEqual(before);
  });
  it(id + ' suppresses targeting claims for incomplete/nonfinite/mismatched canonical definitions', () => {
    for (const statusEffect of [{}, { durationMs: 0 }, { durationMs: NaN }, { durationMs: Infinity },
      { durationMs: 3000, chance: .5 }])
      expect(computeSkillRankDisplayStats({ ...skill, statusEffect }, 1)).not.toHaveProperty('targetCurse');
    expect(computeSkillRankDisplayStats({ ...skill, appliesStatus: ['blind'] }, 1)).not.toHaveProperty('targetCurse');
  });
  it(id + ' previews a detached source-specific duration rather than a hardcoded global constant', () => {
    const altered = { ...skill, statusEffect: { durationMs: 1500 } }, before = structuredClone(altered);
    expect(computeSkillRankDisplayStats(altered, 1)).toHaveProperty('targetCurse', { id, durationSeconds: 1.5 });
    expect(altered).toEqual(before);
  });
}
