import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/amazon.json';
import schema from '../../data/schema/skill.schema.json';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const cases = [['avoid', { magicDodgePct: 0.01 }],
  ['evade', { physDodgePct: 0.005, magicDodgePct: 0.005 }],
  ['pierce', { physicalDamagePct: 0.02, attackPct: 0.01 }]] as const;
function row(key: string) {
  const found = skills.find(skill => skill.id === 'skills-amazon-' + key);
  if (!found) throw new Error('Missing authored ' + key);
  return structuredClone(found);
}
describe('closed Avoid, Evade and Pierce passive contracts', () => {
  it.each(cases)('accepts authored %s and finite alternate tuning without a balance ceiling', (key, stats) => {
    expect(validate(row(key))).toBe(true);
    expect(validate({ ...row(key), requiredLevel: 9, maxLevel: 31,
      scaling: { passiveStatsPerLevel: Object.fromEntries(Object.keys(stats).map(stat => [stat, 3])) } })).toBe(true);
  });
  it.each(cases)('rejects contradictory %s metadata, missing coefficients and unrelated stats', (key, stats) => {
    for (const patch of [{ requiredLevel: undefined }, { passive: false }, { trigger: 'active' },
      { target: 'single-enemy' }, { cooldown: 1 }, { aura: true }, { summon: true },
      { cost: { mana: 0 } }, { damage: { min: 1, max: 1 } }, { requires: { weaponType: ['bow'] } },
      { appliesStatus: ['burn'] }, { appliesTags: ['fire'] }, { scaling: undefined },
      { scaling: { passiveStatsPerLevel: { ...stats, manaRegenPct: 0.01 } } },
      { scaling: { passiveStatsPerLevel: stats, damagePerLevel: 0 } }]) {
      expect.soft(validate({ ...row(key), ...patch }), JSON.stringify(patch)).toBe(false);
    }
    for (const stat of Object.keys(stats)) {
      const missing = { ...stats }; Reflect.deleteProperty(missing, stat);
      expect.soft(validate({ ...row(key), scaling: { passiveStatsPerLevel: missing } }), stat).toBe(false);
      for (const value of [-1, NaN, Infinity, '0.01', null]) {
        expect.soft(validate({ ...row(key), scaling: { passiveStatsPerLevel: { ...stats, [stat]: value } } })).toBe(false);
      }
    }
  });
});
