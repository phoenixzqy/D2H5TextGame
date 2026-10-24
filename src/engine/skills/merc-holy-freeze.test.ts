import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_HOLY_FREEZE_DEFINITION, MERC_HOLY_FREEZE_SKILL, resolveMercHolyFreeze } from './merc-holy-freeze';
import { getSkill, loadDefaultSkills, registerSkill } from './registry';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const authored = () => {
  const row = rows.find(row => row.id === 'aura-holy-freeze');
  if (!row) throw new Error('Missing native Holy Freeze');
  return structuredClone(row);
};
describe('exact mercenary Holy Freeze schema', () => {
  it('requires its authored tuning', () => {
    const row = { ...authored(), holyFreeze: undefined };
    expect(validate(row)).toBe(false);
  });
  it('accepts the authored passive, and finite alternate cold tuning', () => {
    expect(validate(authored())).toBe(true);
    expect(validate({ ...authored(), holyFreeze: { coldDamagePct: 12.5 } })).toBe(true);
  });
  it.each([
    { holyFreeze: {} }, { holyFreeze: { coldDamagePct: -1 } },
    { holyFreeze: { coldDamagePct: NaN } }, { holyFreeze: { coldDamagePct: Infinity } },
    { holyFreeze: { coldDamagePct: '20' } }, { holyFreeze: { coldDamagePct: 20, extra: 1 } },
    { trigger: 'active' }, { target: 'self' }, { cooldown: 1 }, { cost: { mana: 1 } },
    { damageType: 'cold' }, { appliesStatus: [] }, { appliesTags: ['cold'] }
  ])('rejects malformed or conflicting effect metadata %j', patch => {
    expect(validate({ ...authored(), ...patch })).toBe(false);
  });
  it('does not attach native aura tuning to another identity', () => {
    expect(validate({ ...authored(), id: 'aura-prayer', holyFreeze: { coldDamagePct: 20 } })).toBe(false);
  });
});

describe('immutable authored Holy Freeze definition', () => {
  it('copies alternate valid tuning independently without freezing or retaining the input', () => {
    const row = { ...authored(), maxLevel: 31, holyFreeze: { coldDamagePct: 12.5 } };
    const before = structuredClone(row), resolved = resolveMercHolyFreeze([row]);
    expect(resolved.definition).toEqual({ minLevel: 1, maxRank: 31, coldDamagePct: .125 });
    expect(row).toEqual(before);
    expect(Object.isFrozen(row.holyFreeze)).toBe(false);
    row.holyFreeze.coldDamagePct = 99;
    expect(resolved.definition.coldDamagePct).toBe(.125);
    expect(Object.isFrozen(resolved.definition)).toBe(true);
    expect(Object.isFrozen(resolved.skill.effects)).toBe(true);
    expect(MERC_HOLY_FREEZE_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, coldDamagePct: .2 });
  });
  it('rejects missing, duplicate and malformed selected rows while ignoring unrelated input', () => {
    for (const source of [[], [null, 7, {}], [authored(), authored()]]) {
      expect(() => resolveMercHolyFreeze(source)).toThrow(/exactly one/);
    }
    expect(() => resolveMercHolyFreeze([{ ...authored(), holyFreeze: undefined }])).toThrow(/Invalid/);
    expect(resolveMercHolyFreeze([null, 7, {}, authored()]).definition).toEqual(MERC_HOLY_FREEZE_DEFINITION);
  });
  it('restores the exact authored passive on repeated registry loads', () => {
    for (let i = 0; i < 3; i++) {
      registerSkill({ ...MERC_HOLY_FREEZE_SKILL, effects: [{ kind: 'buff', id: 'forged', duration: -1 }] });
      loadDefaultSkills();
      expect(getSkill('aura-holy-freeze')).toBe(MERC_HOLY_FREEZE_SKILL);
      expect(getSkill('aura-holy-freeze')).toMatchObject({ trigger: 'passive', effects: [] });
    }
  });
});
