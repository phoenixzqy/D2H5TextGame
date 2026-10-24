import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import necromancer from '../../data/skills/necromancer.json';
import druid from '../../data/skills/druid.json';
import schema from '../../data/schema/skill.schema.json';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const cases = [
  { id: 'skills-necromancer-poison-mastery', rows: necromancer, values: { poisonDamagePct: 0.04, arcaneDamagePct: 0.02 } },
  { id: 'skills-druid-elemental-mastery', rows: druid, values: { elementalDamagePct: 0.03, magicDodgePct: 0.005 } },
] as const;
describe('exact authored damage mastery schema', () => {
  for (const c of cases) {
    const row = c.rows.find(row => row.id === c.id);
    if (!row) throw new Error('Missing authored mastery');
    it(c.id + ' keeps current content and independent nonnegative tuning', () => {
      for (const authored of c.rows) expect(validate(authored), authored.id).toBe(true);
      const coefficients = Object.fromEntries(Object.keys(c.values).map(key => [key, 0]));
      expect(validate({ ...row, requiredLevel: 9, maxLevel: 31,
        scaling: { passiveStatsPerLevel: coefficients } })).toBe(true);
    });
    it(c.id + ' rejects missing coefficients, unrelated mechanics and invalid metadata', () => {
      const invalid = [
        { scaling: undefined }, { scaling: {} }, { scaling: { passiveStatsPerLevel: {} } },
        ...Object.keys(c.values).flatMap(key => [
          { scaling: { passiveStatsPerLevel: Object.fromEntries(Object.entries(c.values).filter(([name]) => name !== key)) } },
          ...[-1, NaN, Infinity, '0.04', null].map(value => ({ scaling: { passiveStatsPerLevel: { ...c.values, [key]: value } } })),
        ]),
        { scaling: { passiveStatsPerLevel: { ...c.values, attackPct: 1 } } },
        { scaling: { passiveStatsPerLevel: c.values, damagePerLevel: 1 } },
        { requiredLevel: undefined }, { requiredLevel: 0 }, { maxLevel: 1.5 },
        { trigger: 'active' }, { target: 'single-enemy' }, { cooldown: 1 },
        { cost: { mana: 0 } }, { damage: { min: 1, max: 1, breakdown: { fire: 1 } } },
        { appliesStatus: ['burn'] }, { passive: false }, { aura: true }, { summon: true },
        { requires: { weaponType: ['staff'] } },
      ];
      for (const fields of invalid) expect.soft(validate({ ...row, ...fields }), JSON.stringify(fields)).toBe(false);
    });
  }
});
