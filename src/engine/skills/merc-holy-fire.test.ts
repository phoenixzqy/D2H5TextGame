import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_HOLY_FIRE_DEFINITION, MERC_HOLY_FIRE_SKILL, resolveMercHolyFire } from './merc-holy-fire';
import { getSkill, loadDefaultSkills } from './registry';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'mskill-holy-fire');
  if (!row) throw new Error('Missing native Holy Fire');
  return structuredClone(row);
}

describe('authored native mercenary Holy Fire', () => {
  it('implements the flat ambient contract without an active attack or Burn', () => {
    expect(validate(authored())).toBe(true);
    expect(MERC_HOLY_FIRE_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, amount: 8, intervalMs: 1000 });
    expect(MERC_HOLY_FIRE_SKILL).toMatchObject({ id: 'mskill-holy-fire', trigger: 'passive',
      target: 'all-enemies', manaCost: 0, cooldown: 1, minLevel: 1, effects: [] });
  });
  it('copies validated tuning without retaining or freezing caller input', () => {
    const row = { ...authored(), mercHolyFire: { amount: 7.5, intervalMs: 1500 } };
    const before = structuredClone(row), out = resolveMercHolyFire([null, {}, row]);
    expect(out.definition).toEqual({ minLevel: 1, maxRank: 20, amount: 7.5, intervalMs: 1500 });
    expect(row).toEqual(before);
    expect(Object.isFrozen(row.mercHolyFire)).toBe(false);
    row.mercHolyFire.amount = 99; row.mercHolyFire.intervalMs = 9999;
    expect(out.definition).toMatchObject({ amount: 7.5, intervalMs: 1500 });
    expect([out, out.definition, out.skill, out.skill.effects].every(Object.isFrozen)).toBe(true);
  });
  it.each([
    { mercHolyFire: undefined }, { mercHolyFire: {} },
    ...[0, -1, NaN, Infinity, '8'].map(amount => ({ mercHolyFire: { amount, intervalMs: 1000 } })),
    ...[0, -1, 999, 1000.5, 60001, NaN, Infinity, '1000'].map(intervalMs =>
      ({ mercHolyFire: { amount: 8, intervalMs } })),
    { mercHolyFire: { amount: 8, intervalMs: 1000, extra: 1 } },
    { trigger: 'active' }, { target: 'single-enemy' }, { cooldown: 0 }, { cooldown: 2 },
    { cost: undefined }, { cost: {} }, { cost: { mana: 1 } },
    { damage: { min: 24, max: 40 } }, { damageType: 'fire' }, { attackDamagePct: 100 },
    { appliesStatus: ['burn'] }, { appliesTags: ['fire'] },
    { statusEffect: { chance: 1, durationMs: 1000 } },
    { scaling: { damagePerLevel: 1 } }, { heal: { amount: 8 } },
    { passive: { attackPct: 1 } }, { aoeShape: 'all' }
  ])('rejects malformed or contradictory metadata %j', patch => {
    const row = { ...authored(), ...patch };
    expect(validate(row)).toBe(false);
    expect(() => resolveMercHolyFire([row])).toThrow(/Invalid/);
  });
  it('rejects missing/duplicate rows and tuning under another identity', () => {
    expect(() => resolveMercHolyFire([])).toThrow(/exactly one/);
    expect(() => resolveMercHolyFire([authored(), authored()])).toThrow(/exactly one/);
    expect(validate({ ...authored(), id: 'aura-blessed-aim' })).toBe(false);
  });
  it('keeps catalog siblings valid and repeated registration distinct from player Holy Fire', () => {
    expect(rows.every(row => validate(row))).toBe(true);
    loadDefaultSkills(); loadDefaultSkills();
    expect(getSkill('mskill-holy-fire')).toEqual(MERC_HOLY_FIRE_SKILL);
    expect(getSkill('aura-prayer')).toMatchObject({ trigger: 'passive', target: 'all-allies' });
    expect(getSkill('passive-fire-mastery')).toMatchObject({ trigger: 'passive' });
    expect(getSkill('skills-paladin-holy-fire')).toBeDefined();
    expect(getSkill('skills-paladin-holy-fire')?.id).not.toBe(MERC_HOLY_FIRE_SKILL.id);
  });
});
