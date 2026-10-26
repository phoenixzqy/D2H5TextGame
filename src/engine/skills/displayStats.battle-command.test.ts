import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import { computeSkillDisplayModel } from './displayStats';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';

const validate = createSkillValidator<SkillDef>();
const row: unknown = skills.find(skill => skill.id === 'skills-barbarian-battle-command');
if (!validate(row) || !row.skillRankBuff) throw new Error('Invalid Command presentation fixture');

describe('Battle Command paid party previews', () => {
  it.each([0, 1, 2, 19, 20])('shows exact current and next duration/payment at allocated rank%i', rank => {
    const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
    const at = Math.max(1, rank), stats = rank === 0 ? model.next : model.current;
    expect(stats).toHaveProperty('skillRankBuff', { bonusRanks: 1, durationSeconds: 8 + .5 * (at - 1) });
    expect(stats?.manaCost).toBe(Math.round(11 - .1 * (at - 1)));
    expect(stats?.cooldown).toBe(Number((4 - .05 * (at - 1)).toFixed(1)));
    expect(stats?.damage).toEqual([]);
    if (rank === 0) expect(model.current).toBeUndefined();
    if (rank > 0 && rank < 20) expect(model.next).toHaveProperty('skillRankBuff', {
      bonusRanks: 1, durationSeconds: 8 + .5 * rank
    });
    if (rank === 20) expect(model.next).toBeUndefined();
    expect(row).toEqual(before);
  });

  it('uses authored tuning rather than a second copy of the duration curve', () => {
    const model = computeSkillDisplayModel({ ...row,
      skillRankBuff: { bonusRanks: 1, durationMs: 12000, durationPerRankMs: 750 } }, 2);
    expect(model.current).toHaveProperty('skillRankBuff', { bonusRanks: 1, durationSeconds: 12.75 });
    expect(model.next).toHaveProperty('skillRankBuff', { bonusRanks: 1, durationSeconds: 13.5 });
  });

  it('does not infer a Command row from missing metadata or foreign identities/targets', () => {
    const { skillRankBuff, ...ordinary } = row;
    void skillRankBuff;
    for (const source of [ordinary, { ...row, id: 'foreign' },
      { ...row, trigger: 'passive' }, { ...row, target: 'self' }]) {
      expect(computeSkillDisplayModel(source, 1).current).not.toHaveProperty('skillRankBuff');
    }
  });
});
