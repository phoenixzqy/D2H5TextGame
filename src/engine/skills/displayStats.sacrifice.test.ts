import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/paladin.json';
import { computeSkillDisplayModel } from './displayStats';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';
const validate = createSkillValidator<SkillDef>();
const row: unknown = skills.find((s) => s.id === 'skills-paladin-sacrifice');
if (!validate(row)) throw new Error('Invalid Sacrifice presentation fixture');
describe('Sacrifice authored life-cost previews', () => {
  it.each([0, 1, 2, 19, 20])('rank%i shows the actual current/next rule', (rank) => {
    const before = structuredClone(row),
      model = computeSkillDisplayModel(row, rank),
      stats = rank === 0 ? model.next : model.current;
    expect(stats).toHaveProperty('selfDamage', { percentOfHpRemoved: 8, minimumLifeLoss: 1 });
    expect(stats?.manaCost).toBe(0);
    expect(stats?.damage).toEqual([
      { type: 'physical', min: 40 + 4 * Math.max(0, rank - 1), max: 60 + 4 * Math.max(0, rank - 1) }
    ]);
    if (rank > 0 && rank < 20)
      expect(model.next).toHaveProperty('selfDamage', {
        percentOfHpRemoved: 8,
        minimumLifeLoss: 1
      });
    if (rank === 20) expect(model.next).toBeUndefined();
    expect(row).toEqual(before);
  });
  it('does not infer self damage from missing or foreign metadata', () => {
    const { onHitSelfDamage, ...ordinary } = row;
    void onHitSelfDamage;
    expect(computeSkillDisplayModel(ordinary, 1).current).not.toHaveProperty('selfDamage');
    expect(computeSkillDisplayModel({ ...row, id: 'foreign' }, 1).current).not.toHaveProperty(
      'selfDamage'
    );
  });
});
