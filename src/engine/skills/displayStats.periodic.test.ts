import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import skills from '../../data/skills/druid.json';
import type { SkillDef } from '../types/skills';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

const validate = new Ajv2020({ strict: true }).compile<SkillDef>(schema);
function source(slug: string): SkillDef {
  const row: unknown = skills.find((s) => s.id === 'skills-druid-' + slug);
  if (!validate(row)) throw new Error('Invalid authored Druid attack fixture');
  return row;
}
describe('truthful explicit Bleed and Poison display', () => {
  it.each(['werewolf-maul', 'rabies'])(
    'exposes the %s rule at unlearned/current/next/MAX without inventing final DPS',
    (slug) => {
      const s = source(slug),
        before = structuredClone(s);
      const periodic =
        slug === 'rabies'
          ? { statusId: 'poison', percentOfHit: 5, durationSeconds: 5, maxStacks: 10, minDps: 1 }
          : { statusId: 'bleed', percentOfHit: 10, durationSeconds: 3, maxStacks: 1, minDps: 1 };
      for (const rank of [0, 1, 2, 19, 20]) {
        const model = computeSkillDisplayModel(s, rank);
        expect((rank === 0 ? model.next : model.current)?.periodic).toEqual(periodic);
        if (rank > 0 && rank < 20) expect(model.next?.periodic).toEqual(periodic);
        if (rank === 20) expect(model.next).toBeUndefined();
      }
      expect(s).toEqual(before);
    }
  );
  it.each([undefined, 0, -1, NaN, Infinity])(
    'does not advertise a damaging Bleed for rate %s',
    (rate) => {
      const s = source('werewolf-maul');
      expect(
        computeSkillRankDisplayStats(
          { ...s, statusEffect: rate === undefined ? {} : { dotPctOfDamage: rate } },
          1
        ).periodic
      ).toBeUndefined();
    }
  );
  it('rejects unrelated, secondary, uncertain or multiple-stack payloads', () => {
    const s = source('werewolf-maul');
    for (const patch of [
      { appliesStatus: ['chill', 'bleed'] },
      { appliesStatus: ['bleed', 'poison'] },
      { damageType: 'fire' as const },
      { trigger: 'passive' },
      { statusEffect: { dotPctOfDamage: 0.1, chance: 0.5 } },
      { statusEffect: { dotPctOfDamage: 0.1, stacksOnApply: 2 } }
    ]) {
      expect(computeSkillRankDisplayStats({ ...s, ...patch }, 1).periodic).toBeUndefined();
    }
    const withoutDamage = { ...s };
    delete withoutDamage.damage;
    expect(computeSkillRankDisplayStats(withoutDamage, 1).periodic).toBeUndefined();
  });
  it.each([0, -1, NaN, Infinity, 2500])(
    'does not advertise an unsupported primary duration override %s',
    (durationMs) => {
      const s = source('rabies');
      expect(
        computeSkillRankDisplayStats(
          { ...s, statusEffect: { dotPctOfDamage: 0.05, durationMs } },
          1
        ).periodic
      ).toBeUndefined();
    }
  );
});
