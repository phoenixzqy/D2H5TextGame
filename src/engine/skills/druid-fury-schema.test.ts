import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import skills from '../../data/skills/druid.json';

const validate = new Ajv2020({ strict: true }).compile(schema);
const source = skills.find((s) => s.id === 'skills-druid-fury');
if (!source) throw new Error('Missing Fury');
const tuned = () => ({ ...structuredClone(source), hitSequence: { strikes: 5 } });

describe('strict bounded authored Fury sequence', () => {
  it('authors five real attempts with all unchanged damage/payment/unlock rules', () => {
    expect(source).toMatchObject({
      hitSequence: { strikes: 5 },
      target: 'area-enemies',
      damage: { min: 95, max: 135 },
      scaling: { damagePerLevel: 8 },
      cost: { mana: 11 },
      cooldown: 1,
      requiredLevel: 30,
      maxLevel: 20,
      prerequisites: ['skills-druid-rabies']
    });
    expect(validate(source)).toBe(true);
  });
  it('accepts the full intended row and rejects missing sequence metadata', () => {
    expect(validate(tuned())).toBe(true);
    const row: Record<string, unknown> = tuned();
    Reflect.deleteProperty(row, 'hitSequence');
    expect(validate(row)).toBe(false);
  });
  it.each([undefined, 0, 1, -1, 1.5, 9, NaN, Infinity])('rejects strikes %s', (strikes) => {
    expect(validate({ ...tuned(), hitSequence: strikes === undefined ? {} : { strikes } })).toBe(
      false
    );
  });
  it.each([
    { id: 'skills-druid-tornado' },
    { target: 'all-enemies' },
    { aoeShape: 'all-enemies' },
    { appliesStatus: ['stun'] },
    { statusEffect: { chance: 1 } },
    { trigger: 'passive' },
    { damageType: 'cold' },
    { damage: undefined },
    { hitSequence: { strikes: 5, typo: 1 } }
  ])('rejects foreign ownership or contradictory Fury %j', (patch) => {
    expect(validate({ ...tuned(), ...patch })).toBe(false);
  });
});
