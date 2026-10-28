import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import skills from '../../data/skills/sorceress.json';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const row = { id: 'skills-sorceress-static-field', name: 'skills.sorceress.static-field.name',
  description: 'skills.sorceress.static-field.desc', trigger: 'active', target: 'all-enemies',
  cooldown: 2, requiredLevel: 6, minLevel: 1, maxLevel: 20, cost: { mana: 10 },
  staticField: { currentHealthFraction: 0.25, normalFloorFraction: 0, nightmareFloorFraction: 0.33, hellFloorFraction: 0.5 },
  scaling: { cooldownPerLevel: -0.05, costPerLevel: -0.1 } };

describe('closed authored Static Field identity', () => {
  it('accepts the bounded current-health tuning', () => {
    expect(validate(row)).toBe(true);
  });
  it('accepts the production row only with actual current-health metadata', () => {
    const actual = skills.find(s => s.id === row.id);
    expect(actual).toHaveProperty('staticField', row.staticField);
    expect(validate(actual)).toBe(true);
  });
  it.each([
    { staticField: undefined }, { staticField: {} },
    ...[0, -0.1, 1, Infinity, NaN].map(currentHealthFraction => ({
      staticField: { ...row.staticField, currentHealthFraction } })),
    ...[-0.1, 1, Infinity, NaN].flatMap(value => [
      { staticField: { ...row.staticField, normalFloorFraction: value } },
      { staticField: { ...row.staticField, nightmareFloorFraction: value } },
      { staticField: { ...row.staticField, hellFloorFraction: value } }]),
    { staticField: { currentHealthFraction: 0.25, normalFloorFraction: 0, nightmareFloorFraction: 0.33 } },
    { staticField: { ...row.staticField, typo: 1 } },
    { requiredLevel: undefined }, { trigger: 'passive' }, { target: 'single-enemy' },
    { damage: { min: 1, max: 2 } }, { appliesStatus: ['static-field'] },
    { scaling: { passiveStatsPerLevel: { lightningDamagePct: 0.01 } } },
    { cost: { mana: 10, life: 1 } }, { cooldown: 0 }, { summon: true }
  ])('refuses missing/contradictory semantics %#', patch => {
    expect(validate({ ...row, ...patch })).toBe(false);
  });
  it('reserves the effect for its exact identity', () => {
    expect(validate({ ...row, id: 'skills-sorceress-nova' })).toBe(false);
  });
});
