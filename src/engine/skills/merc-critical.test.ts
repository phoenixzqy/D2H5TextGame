import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_CRITICAL_DEFINITION, MERC_CRITICAL_SKILL, resolveMercCritical } from './merc-critical';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'passive-critical');
  if (!row) throw new Error('Missing native Critical Strike');
  return structuredClone(row);
}
describe('authored native mercenary Critical', () => {
  it('uses the GDD potency and retains a passive with no cast effects', () => {
    expect(validate(authored())).toBe(true);
    expect(MERC_CRITICAL_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, critChancePct: .05, critDamagePct: .20 });
    expect(MERC_CRITICAL_SKILL).toMatchObject({ id: 'passive-critical', trigger: 'passive',
      target: 'all-allies', manaCost: 0, cooldown: 0, effects: [] });
  });
  it('copies alternate valid tuning without retaining or freezing caller input', () => {
    const row = { ...authored(), maxLevel: 31, mercCritical: { critChancePct: 12.5, critDamagePct: 30 } };
    const result = resolveMercCritical([null, {}, row]);
    expect(result.definition).toEqual({ minLevel: 1, maxRank: 31, critChancePct: .125, critDamagePct: .30 });
    expect(Object.isFrozen(row.mercCritical)).toBe(false);
    row.mercCritical.critChancePct = 99;
    expect(result.definition.critChancePct).toBe(.125);
    expect(Object.isFrozen(result.definition)).toBe(true);
    expect(Object.isFrozen(result.skill.effects)).toBe(true);
    expect(validate({ ...authored(), mercCritical: { critChancePct: 0, critDamagePct: 0 } })).toBe(true);
  });
  it.each([
    { mercCritical: undefined }, { mercCritical: {} }, { mercCritical: { critChancePct: 5 } }, { mercCritical: { critDamagePct: 20 } }, { mercCritical: { critChancePct: -1, critDamagePct: 20 } }, { mercCritical: { critChancePct: 5, critDamagePct: -1 } },
    { mercCritical: { critChancePct: NaN, critDamagePct: 20 } }, { mercCritical: { critChancePct: 5, critDamagePct: Infinity } },
    { mercCritical: { critChancePct: '5', critDamagePct: 20 } }, { mercCritical: { critChancePct: 5, critDamagePct: 20, extra: 1 } },
    { trigger: 'active' }, { target: 'self' }, { cooldown: 1 }, { cost: { mana: 1 } },
    { damageType: 'fire' }, { appliesStatus: ['stun'] }, { appliesTags: ['fire'] },
    { scaling: { damagePerLevel: 1 } }
  ])('rejects malformed or conflicting metadata %j', patch => {
    const row = { ...authored(), ...patch };
    expect(validate(row)).toBe(false);
    expect(() => resolveMercCritical([row])).toThrow(/Invalid/);
  });
  it('rejects missing/duplicate native rows and tuning on another identity', () => {
    expect(() => resolveMercCritical([])).toThrow(/exactly one/);
    expect(() => resolveMercCritical([authored(), authored()])).toThrow(/exactly one/);
    expect(validate({ ...authored(), id: 'aura-prayer' })).toBe(false);
  });
});
