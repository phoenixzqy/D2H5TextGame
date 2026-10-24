import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import amazonSkills from '../../data/skills/amazon.json';
import skillSchema from '../../data/schema/skill.schema.json';

const identities = [
  ['skills-amazon-critical-strike', 'critChancePct', 1, 0.01],
  ['skills-amazon-penetrate', 'attackPct', 18, 0.03],
  ['skills-amazon-dodge', 'physDodgePct', 6, 0.01],
] as const;
function authored(id: string) {
  const row = amazonSkills.find(candidate => candidate.id === id);
  if (!row) throw new Error('Missing authored Amazon passive: ' + id);
  return structuredClone(row);
}
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);

describe('exact authored Amazon passive schema', () => {
  it.each(identities)('preserves %s unlock, cap and JSON coefficient', (id, coefficient, unlock, value) => {
    const row = authored(id);
    expect(validate(row)).toBe(true);
    expect(row).toMatchObject({ trigger: 'passive', target: 'self', cooldown: 0,
      requiredLevel: unlock, maxLevel: 20,
      scaling: { passiveStatsPerLevel: { [coefficient]: value } } });
    expect(row).not.toHaveProperty('cost');
  });

  it.each(identities)('accepts alternate valid tuning for %s without inventing a balance ceiling', (id, coefficient) => {
    for (const value of [0, 0.125, 3]) {
      expect(validate({ ...authored(id), requiredLevel: 9, maxLevel: 31,
        passive: true, aura: false, summon: false,
        scaling: { passiveStatsPerLevel: { [coefficient]: value } } })).toBe(true);
    }
  });

  it.each(identities)('rejects missing, contradictory or malformed exact metadata for %s', (id, coefficient) => {
    const fields = [
      { requiredLevel: undefined }, { requiredLevel: 0 }, { requiredLevel: 1.5 },
      { maxLevel: 0 }, { maxLevel: Infinity },
      { trigger: 'active' }, { target: 'single-enemy' }, { cooldown: 1 },
      { passive: false }, { aura: true }, { summon: true },
      { cost: { mana: 0 } }, { damage: { min: 1, max: 1 } },
      { damageType: 'physical' }, { appliesStatus: ['burn'] }, { appliesTags: ['fire'] },
      { requires: { weaponType: ['bow'] } },
      { scaling: undefined }, { scaling: {} },
      { scaling: { passiveStatsPerLevel: {} } },
      { scaling: { passiveStatsPerLevel: { [coefficient]: 0.01 }, damagePerLevel: 0 } },
      { scaling: { passiveStatsPerLevel: { [coefficient]: 0.01, manaRegenPct: 0.01 } } },
      ...[-0.01, NaN, Infinity, -Infinity, '0.01', null].map(value =>
        ({ scaling: { passiveStatsPerLevel: { [coefficient]: value } } })),
    ];
    for (const patch of fields) expect.soft(validate({ ...authored(id), ...patch }), JSON.stringify(patch)).toBe(false);
  });

  it('preserves every other authored Amazon skill and a distinct passive identity', () => {
    for (const row of amazonSkills) expect(validate(row), row.id).toBe(true);
    expect(validate({ ...authored(identities[0][0]), id: 'skills-other-passive',
      requiredLevel: undefined, scaling: undefined, cooldown: 1, cost: { mana: 1 } })).toBe(true);
  });
});
