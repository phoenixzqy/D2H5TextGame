import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import skills from '../../data/skills/druid.json';
import type { SkillDef } from '../types/skills';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

const validate = new Ajv2020({ strict: true }).compile<SkillDef>(schema);
function source(slug: string): SkillDef {
  const row: unknown = skills.find(s => s.id === 'skills-druid-' + slug);
  if (!validate(row)) throw new Error('Invalid authored Druid fire fixture');
  return row;
}
describe('truthful explicit on-hit Burn display', () => {
  it.each(['firestorm', 'molten-boulder', 'fissure', 'volcano', 'armageddon'])(
    'exposes the %s rule at unlearned/current/next/MAX without inventing final DPS', slug => {
      const s = source(slug), before = structuredClone(s);
      const burn = { percentOfHit: 10, durationSeconds: 3, maxStacks: 5, minDps: 1 };
      for (const rank of [0, 1, 2, 19, 20]) {
        const model = computeSkillDisplayModel(s, rank);
        expect((rank === 0 ? model.next : model.current)?.burn).toEqual(burn);
        if (rank > 0 && rank < 20) expect(model.next?.burn).toEqual(burn);
        if (rank === 20) expect(model.next).toBeUndefined();
      }
      expect(s).toEqual(before);
    });
  it.each([undefined, 0, -1, NaN, Infinity])('does not advertise a damaging Burn for rate %s', rate => {
    const s = source('firestorm');
    expect(computeSkillRankDisplayStats({ ...s, statusEffect: rate === undefined ? {} : { dotPctOfDamage: rate } }, 1).burn)
      .toBeUndefined();
  });
  it('does not attach the first Burn payload to a secondary or unrelated status', () => {
    const s = source('firestorm');
    expect(computeSkillRankDisplayStats({ ...s, appliesStatus: ['chill', 'burn'] }, 1).burn).toBeUndefined();
  });
});
