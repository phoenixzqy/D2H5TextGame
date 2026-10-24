import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import skills from '../../data/skills/sorceress.json';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const row = { id: 'skills-sorceress-cold-mastery', name: 'skills.sorceress.cold-mastery.name',
  description: 'skills.sorceress.cold-mastery.desc',
  trigger: 'passive', target: 'self', cooldown: 0, requiredLevel: 30, minLevel: 12,
  maxLevel: 20, coldMastery: { resistanceReductionPct: 15, resistanceReductionPerRankPct: 4 } };

describe('closed authored Cold Mastery resistance identity', () => {
  it('accepts exact passive resistance metadata and the actual catalog', () => {
    expect(validate(row)).toBe(true);
    expect(validate(skills.find(s => s.id === row.id))).toBe(true);
  });
  it.each([
    { coldMastery: undefined }, { coldMastery: {} },
    { coldMastery: { resistanceReductionPct: -1, resistanceReductionPerRankPct: 4 } },
    { coldMastery: { resistanceReductionPct: 15, resistanceReductionPerRankPct: -1 } },
    { coldMastery: { resistanceReductionPct: 15, resistanceReductionPerRankPct: Infinity } },
    { coldMastery: { resistanceReductionPct: 15, resistanceReductionPerRankPct: 4, typo: 1 } },
    { scaling: { passiveStatsPerLevel: { coldDamagePct: 0.04 } } },
    { trigger: 'active' }, { target: 'all-enemies' }, { cooldown: 1 },
    { cost: { mana: 1 } }, { appliesStatus: ['chill'] }, { requiredLevel: undefined }
  ])('rejects contradictory/incomplete payload %#', patch => {
    expect(validate({ ...row, ...patch })).toBe(false);
  });
  it('rejects the old generic damage-only row', () => {
    const { coldMastery, ...old } = row; void coldMastery;
    expect(validate({ ...old, scaling: { passiveStatsPerLevel: { coldDamagePct: 0.04 } } })).toBe(false);
  });
  it('reserves personal penetration metadata for exact Cold Mastery', () => {
    expect(validate({ ...row, id: 'fixture.another-passive' })).toBe(false);
  });
});
