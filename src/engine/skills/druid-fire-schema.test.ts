import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import skills from '../../data/skills/druid.json';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const slugs = ['firestorm', 'molten-boulder', 'fissure', 'volcano', 'armageddon'];
describe.each(slugs)('explicit authored Druid %s Burn', slug => {
  const row = skills.find(s => s.id === 'skills-druid-' + slug);
  it('accepts its actual catalog row with explicit potency', () => {
    expect(validate(row)).toBe(true);
    expect(row).toMatchObject({ statusEffect: { dotPctOfDamage: 0.1 } });
  });
  it.each([undefined, {}, { dotPctOfDamage: 0 }, { dotPctOfDamage: -1 },
    { dotPctOfDamage: Infinity }, { dotPctOfDamage: NaN }, { dotPctOfDamage: 0.1, typo: 1 }])(
    'rejects absent, invalid or misspelled metadata %#', statusEffect => {
      expect(validate({ ...row, statusEffect })).toBe(false);
    });
  it.each([{ trigger: 'passive' }, { damageType: 'cold' }, { appliesStatus: [] },
    { appliesStatus: ['chill'] }, { damage: undefined }])('rejects contradictory fire behavior %#', patch => {
    expect(validate({ ...row, statusEffect: { dotPctOfDamage: 0.1 }, ...patch })).toBe(false);
  });
});
