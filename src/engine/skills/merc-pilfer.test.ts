import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_PILFER_DEFINITION, MERC_PILFER_SKILL, resolveMercPilfer } from './merc-pilfer';
import { getSkill, loadDefaultSkills, resetRegistry } from './registry';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'mskill-pilfer');
  if (!row) throw new Error('Missing native Pilfer');
  return structuredClone(row);
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

it('registers the authored fixed physical attack and separate wave-find tuning', () => {
  expect(authored()).toMatchObject({ trigger: 'active', target: 'single-enemy', cooldown: 2,
    minLevel: 1, maxLevel: 20, cost: { mana: 0 }, damage: { min: 14, max: 24 },
    mercPilfer: { currencyFindPct: 30 } });
  expect(MERC_PILFER_DEFINITION).toEqual({ minLevel: 1, currencyFindPct: 30 });
  expect(getSkill('mskill-pilfer')).toBe(MERC_PILFER_SKILL);
  expect(MERC_PILFER_SKILL).toMatchObject({ target: 'single-enemy', cooldown: 2, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [14, 24], tags: ['physical'] }] });
  loadDefaultSkills();
  expect(getSkill('mskill-pilfer')).toBe(MERC_PILFER_SKILL);
  expect(rows.every(row => validate(row))).toBe(true);
});

it.each([
  { mercPilfer: undefined }, { mercPilfer: {} },
  ...[-1, NaN, Infinity, '30'].map(currencyFindPct => ({ mercPilfer: { currencyFindPct } })),
  { mercPilfer: { currencyFindPct: 30, extra: 1 } }, { cost: undefined }, { cost: { mana: 1 } },
  { trigger: 'passive' }, { target: 'all-enemies' }, { cooldown: 0 }, { cooldown: 3 },
  { minLevel: 2 }, { maxLevel: 21 }, { damage: undefined }, { damageType: 'fire' },
  { damage: { min: 14.5, max: 24, breakdown: { physical: 24 } } },
  { damage: { min: 14, max: 24, breakdown: { physical: 24, fire: 1 } } },
  { appliesTags: ['fire'] }, { appliesStatus: ['bleed'] }, { attackDamagePct: 100 },
  { scaling: { damagePerLevel: 10 } }, { heal: { amount: 8 } }, { passive: {} }
])('rejects malformed or contradictory native Pilfer metadata %j', patch => {
  const row = { ...authored(), ...patch };
  expect(validate(row)).toBe(false);
  expect(() => resolveMercPilfer([row])).toThrow('Invalid native Pilfer');
});

it('requires a unique native row and ordered damage, with no tuning on other IDs', () => {
  const row = authored();
  for (const source of [[], [row, row], [{ ...row, damage: { ...row.damage, min: 25, max: 24 } }]]) {
    expect(() => resolveMercPilfer(source)).toThrow();
  }
  expect(validate({ ...row, id: 'mskill-basic-arrow' })).toBe(false);
});

it.each([0, 37.5])('copies tunable find %s and deep-freezes only its own output', currencyFindPct => {
  const row = { ...authored(), mercPilfer: { currencyFindPct } };
  const before = structuredClone(row), out = resolveMercPilfer([row]);
  expect(row).toEqual(before);
  expect(Object.isFrozen(row)).toBe(false);
  expect(Object.isFrozen(row.damage)).toBe(false);
  expect(Object.isFrozen(row.mercPilfer)).toBe(false);
  row.mercPilfer.currencyFindPct = 99;
  if (!row.damage) throw new Error('Missing authored damage');
  row.damage.min = 1;
  expect(out.definition).toEqual({ minLevel: 1, currencyFindPct });
  expect(out.skill.effects[0]).toMatchObject({ base: [14, 24] });
  for (const object of [out, out.definition, out.skill, out.skill.effects, out.skill.effects[0]]) {
    expect(Object.isFrozen(object)).toBe(true);
  }
  const effect = out.skill.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing native damage');
  expect(Object.isFrozen(effect.base)).toBe(true);
  expect(Object.isFrozen(effect.tags)).toBe(true);
});
