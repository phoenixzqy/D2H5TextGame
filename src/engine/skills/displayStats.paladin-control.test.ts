import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/paladin.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const validate = createSkillValidator<SkillDef>();
function source(slug: string): SkillDef {
  const row: unknown = skills.find((s) => s.id === 'skills-paladin-' + slug);
  if (!validate(row)) throw new Error('Invalid Paladin target/control preview fixture');
  return row;
}
const cases = [
  { slug: 'zeal', min: 40, max: 60, growth: 4, type: 'physical', cost: 10 },
  { slug: 'smite', min: 30, max: 45, growth: 3, type: 'physical', cost: 5 },
  { slug: 'charge', min: 80, max: 120, growth: 8, type: 'physical', cost: 20 },
  { slug: 'fist-of-heavens', min: 100, max: 150, growth: 10, type: 'lightning', cost: 50 }
] as const;
describe.each(cases)('$slug authored pure target/control previews', (c) => {
  it.each([0, 1, 2, 20])('rank%i shows actual current/next targeting and seconds', (rank) => {
    const row = source(c.slug),
      before = structuredClone(row);
    const model = computeSkillDisplayModel(row, rank);
    const stats = rank === 0 ? model.next : model.current;
    const growth = c.growth * Math.max(0, rank - 1);
    expect(stats?.damage).toEqual([{ type: c.type, min: c.min + growth, max: c.max + growth }]);
    expect(stats?.manaCost).toBe(c.cost);
    if (c.slug === 'zeal') {
      expect(stats).toHaveProperty('maxTargets', 3);
      if (model.next) expect(model.next).toHaveProperty('maxTargets', 3);
      expect(stats).not.toHaveProperty('control');
    } else {
      const control = {
        durationSeconds: 1,
        bossDurationSeconds: c.slug === 'fist-of-heavens' ? 1 : 0.5
      };
      expect(stats).toHaveProperty('control', control);
      if (model.next) expect(model.next).toHaveProperty('control', control);
      expect(stats).not.toHaveProperty('maxTargets');
    }
    if (rank === 0) expect(model.current).toBeUndefined();
    if (rank === 20) expect(model.next).toBeUndefined();
    expect(row).toEqual(before);
  });
});
it('does not infer a cap from absent, foreign, malformed or non-cross metadata', () => {
  const row = source('zeal');
  const { maxTargets, ...ordinary } = row;
  void maxTargets;
  for (const input of [
    ordinary,
    { ...row, id: 'foreign' },
    { ...row, maxTargets: 0 },
    { ...row, maxTargets: 2.5 },
    { ...row, target: 'single-enemy' },
    { ...row, aoeShape: 'line-3' as const },
    { ...row, trigger: 'passive' }
  ]) {
    expect(computeSkillDisplayModel(input, 1).current).not.toHaveProperty('maxTargets');
  }
});
