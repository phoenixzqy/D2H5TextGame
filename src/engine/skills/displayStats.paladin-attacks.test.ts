import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/paladin.json';
import { computeSkillDisplayModel } from './displayStats';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';

const validate = createSkillValidator<SkillDef>();
function source(slug: string) {
  const row: unknown = skills.find((s) => s.id === 'skills-paladin-' + slug);
  if (!validate(row)) throw new Error('Invalid Paladin presentation fixture');
  return row;
}
describe('Paladin attack current/next/unlearned/MAX presentation', () => {
  it.each(['holy-bolt', 'blessed-hammer', 'vengeance'])(
    'describes the actual %s rule without changing data',
    (slug) => {
      const row = source(slug),
        before = structuredClone(row);
      for (const rank of [0, 1, 2, 19, 20]) {
        const model = computeSkillDisplayModel(row, rank),
          stats = rank === 0 ? model.next : model.current;
        expect(stats?.recovery).toEqual(
          slug === 'holy-bolt' ? { percentOfHpRemoved: 50 } : undefined
        );
        expect(stats).toHaveProperty('rank', Math.max(1, rank));
        if (slug === 'blessed-hammer') expect(stats).toHaveProperty('ignoresMagicResist', true);
        if (slug === 'vengeance') {
          expect(stats).toHaveProperty('composite', { chillSeconds: 2, paralyzeSeconds: 1 });
          expect(stats?.burn).toEqual({
            percentOfHit: 10,
            durationSeconds: 3,
            maxStacks: 5,
            minDps: 1,
            component: 'fire'
          });
          expect(stats?.damage).toEqual(
            ['fire', 'cold', 'lightning'].map((type) => ({
              type,
              min: 30 + 3 * Math.max(0, rank - 1),
              max: 50 + 3 * Math.max(0, rank - 1)
            }))
          );
        }
        if (rank === 20) expect(model.next).toBeUndefined();
        if (rank > 0 && rank < 20 && slug === 'blessed-hammer')
          expect(model.next).toHaveProperty('ignoresMagicResist', true);
        if (rank > 0 && rank < 20 && slug === 'vengeance')
          expect(model.next).toHaveProperty('composite', stats?.composite);
      }
      expect(row).toEqual(before);
    }
  );
  it('does not infer bypass or composite behavior from an ordinary primary type or breakdown', () => {
    const { ignoresMagicResist, ...hammer } = source('blessed-hammer');
    void ignoresMagicResist;
    const { damageComposition, ...vengeance } = source('vengeance');
    void damageComposition;
    expect(computeSkillDisplayModel(hammer, 1).current).not.toHaveProperty('ignoresMagicResist');
    expect(computeSkillDisplayModel(vengeance, 1).current).not.toHaveProperty('composite');
    expect(computeSkillDisplayModel(vengeance, 1).current?.burn).not.toHaveProperty('component');
    expect(
      computeSkillDisplayModel({ ...source('blessed-hammer'), id: 'foreign' }, 1).current
    ).not.toHaveProperty('ignoresMagicResist');
    expect(
      computeSkillDisplayModel({ ...source('vengeance'), id: 'foreign' }, 1).current
    ).not.toHaveProperty('composite');
  });
});
