import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { getSkill, loadDefaultSkills, resetRegistry } from './registry';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'mskill-frozen-armor');
  if (!row) throw new Error('Missing native Frozen Armor');
  return structuredClone(row);
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

it('authors the flat self Defense contract independently of player Frozen Armor', () => {
  expect(validate(authored())).toBe(true);
  expect(authored()).toMatchObject({ trigger: 'active', target: 'self', cooldown: 6,
    minLevel: 1, maxLevel: 20, cost: { mana: 0 }, mercFrozenArmor: { defense: 120 } });
  expect(getSkill('mskill-frozen-armor')).toMatchObject({ trigger: 'active', isBuff: true,
    target: 'self', cooldown: 6, manaCost: 0, minLevel: 1, effects: [
      { kind: 'buff', id: 'frozen_armor', duration: -1, mercFrozenArmor: true }
    ] });
  expect(getSkill('mskill-frozen-armor')).not.toBe(getSkill('sorceress.frozen_armor'));
});

it.each([
  { mercFrozenArmor: undefined }, { mercFrozenArmor: {} },
  ...[0, -1, NaN, Infinity, '120'].map(defense => ({ mercFrozenArmor: { defense } })),
  { mercFrozenArmor: { defense: 120, extra: 1 } },
  { trigger: 'passive' }, { target: 'all-allies' }, { cooldown: 0 }, { cooldown: 5 },
  { minLevel: 0 }, { minLevel: 2 }, { maxLevel: 21 },
  { cost: undefined }, { cost: {} }, { cost: { mana: 1 } },
  { damage: { min: 24, max: 40 } }, { damageType: 'cold' }, { attackDamagePct: 100 },
  { appliesStatus: ['chill'] }, { appliesTags: ['cold'] },
  { statusEffect: { chance: 1, durationMs: 1000 } },
  { scaling: { damagePerLevel: 1 } }, { heal: { amount: 8 } },
  { passive: { defensePct: 1 } }, { aoeShape: 'all' }
])('rejects malformed or contradictory native Armor metadata %j', patch => {
  expect(validate({ ...authored(), ...patch })).toBe(false);
});

it('requires the closed tuning to belong only to the native Armor row', () => {
  expect(validate({ ...authored(), id: 'mskill-basic-arrow', mercFrozenArmor: { defense: 120 } })).toBe(false);
  expect(rows.every(row => validate(row))).toBe(true);
});
