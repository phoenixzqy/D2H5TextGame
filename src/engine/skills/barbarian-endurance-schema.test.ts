import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import schema from '../../data/schema/skill.schema.json';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const rows = skills.filter(row => ['increased-stamina', 'increased-speed', 'natural-resistance']
  .some(id => row.id === 'skills-barbarian-' + id));
describe('exact Barbarian endurance passive schemas', () => {
  it('preserves all authored rows and alternate finite tuning', () => {
    expect(rows).toHaveLength(3);
    for (const row of skills) expect(validate(row), row.id).toBe(true);
    for (const row of rows) {
      const coefficients = row.scaling.passiveStatsPerLevel;
      if (!coefficients) throw new Error('Missing authored coefficients');
      expect(validate({ ...row, requiredLevel: 9, maxLevel: 31,
        scaling: { passiveStatsPerLevel: Object.fromEntries(Object.keys(coefficients).map(key => [key, 3])) } })).toBe(true);
    }
  });

  it.each(rows)('rejects contradictory metadata and extra/malformed coefficients for $id', row => {
    const coefficients = row.scaling.passiveStatsPerLevel;
    if (!coefficients) throw new Error('Missing authored coefficients');
    const patches = [{ trigger: 'active' }, { target: 'all-allies' }, { cooldown: 1 },
      { requiredLevel: undefined }, { requiredLevel: 0 }, { maxLevel: 1.5 },
      { passive: false }, { aura: true }, { summon: true }, { cost: { mana: 0 } },
      { damage: { min: 1, max: 1 } }, { appliesStatus: ['chill'] },
      { requires: { weaponType: ['sword'] } }, { scaling: undefined },
      { scaling: { passiveStatsPerLevel: {} } },
      { scaling: { passiveStatsPerLevel: { ...coefficients, defensePct: 0.1 } } },
      { scaling: { passiveStatsPerLevel: coefficients, damagePerLevel: 1 } },
      ...Object.keys(coefficients).flatMap(key => [-1, NaN, Infinity, '0.01', null, undefined].map(value =>
        ({ scaling: { passiveStatsPerLevel: { ...coefficients, [key]: value } } }))),
    ];
    for (const patch of patches) expect.soft(validate({ ...row, ...patch }), JSON.stringify(patch)).toBe(false);
  });
});
