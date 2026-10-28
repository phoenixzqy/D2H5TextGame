import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_PRAYER_DEFINITION, MERC_PRAYER_SKILL, resolveMercPrayer } from './merc-prayer';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'aura-prayer');
  if (!row) throw new Error('Missing native Prayer');
  return structuredClone(row);
}
describe('authored native mercenary Prayer', () => {
  it('uses the flat GDD recovery and retains a passive with no cast effects', () => {
    expect(validate(authored())).toBe(true);
    expect(MERC_PRAYER_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, amount: 5, intervalMs: 1000 });
    expect(MERC_PRAYER_SKILL).toMatchObject({ id: 'aura-prayer', trigger: 'passive',
      target: 'all-allies', manaCost: 0, cooldown: 0, effects: [] });
  });
  it('copies alternate valid tuning without retaining or freezing caller input', () => {
    const row = { ...authored(), maxLevel: 31, mercPrayer: { amount: 7.5, intervalMs: 1500 } };
    const result = resolveMercPrayer([null, {}, row]);
    expect(result.definition).toEqual({ minLevel: 1, maxRank: 31, amount: 7.5, intervalMs: 1500 });
    expect(Object.isFrozen(row.mercPrayer)).toBe(false);
    row.mercPrayer.amount = 99; row.mercPrayer.intervalMs = 1;
    expect(result.definition).toMatchObject({ amount: 7.5, intervalMs: 1500 });
    expect(Object.isFrozen(result.definition)).toBe(true);
    expect(Object.isFrozen(result.skill.effects)).toBe(true);
  });
  it.each([
    { mercPrayer: undefined }, { mercPrayer: {} },
    ...[0, -1, NaN, Infinity, '5'].map(amount => ({ mercPrayer: { amount, intervalMs: 1000 } })),
    ...[0, -1, 1.5, 60001, NaN, Infinity, '1000'].map(intervalMs => ({ mercPrayer: { amount: 5, intervalMs } })),
    { mercPrayer: { amount: 5, intervalMs: 1000, extra: 1 } },
    { trigger: 'active' }, { target: 'self' }, { cooldown: 1 }, { cost: { mana: 1 } },
    { damageType: 'physical' }, { appliesStatus: ['stun'] }, { appliesTags: ['physical'] },
    { scaling: { damagePerLevel: 1 } }, { heal: { amount: 5 } }
  ])('rejects malformed or conflicting metadata %j', patch => {
    const row = { ...authored(), ...patch };
    expect(validate(row)).toBe(false);
    expect(() => resolveMercPrayer([row])).toThrow(/Invalid/);
  });
  it('rejects missing/duplicate native rows and tuning on another identity', () => {
    expect(() => resolveMercPrayer([])).toThrow(/exactly one/);
    expect(() => resolveMercPrayer([authored(), authored()])).toThrow(/exactly one/);
    expect(validate({ ...authored(), id: 'aura-blessed-aim' })).toBe(false);
  });
});
