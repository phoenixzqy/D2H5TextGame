import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import schema from '../../data/schema/skill.schema.json';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
describe('exact Barbarian weapon-mastery metadata', () => {
  it.each(['sword', 'axe', 'mace'])('accepts authored %s tuning and rejects contradictory metadata', key => {
    const row = skills.find(row => row.id === 'skills-barbarian-' + key + '-mastery');
    if (!row) throw new Error('Missing authored mastery');
    const proposed = { ...row, requires: { weaponType: [key] } };
    expect(validate(proposed)).toBe(true);
    const coefficients = { physicalDamagePct: 0.03, critChancePct: 0.005 };
    for (const patch of [{ trigger: 'active' }, { target: 'all-allies' }, { cooldown: 1 },
      { requiredLevel: undefined }, { passive: false }, { aura: true }, { summon: true },
      { cost: { mana: 0 } }, { requires: undefined }, { requires: { weaponType: [] } },
      { requires: { weaponType: [key === 'sword' ? 'axe' : 'sword'] } },
      { requires: { weaponType: [key, 'dagger'] } },
      { scaling: { passiveStatsPerLevel: { physicalDamagePct: 0.03 } } },
      { scaling: { passiveStatsPerLevel: { ...coefficients, attackPct: 0.2 } } },
      ...Object.keys(coefficients).flatMap(stat => [-1, Infinity, NaN, null, '0.03'].map(value =>
        ({ scaling: { passiveStatsPerLevel: { ...coefficients, [stat]: value } } }))),
    ]) expect.soft(validate({ ...proposed, ...patch }), JSON.stringify(patch)).toBe(false);
  });
});
