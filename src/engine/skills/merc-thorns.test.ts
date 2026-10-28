import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_THORNS_DEFINITION, MERC_THORNS_SKILL, resolveMercThorns } from './merc-thorns';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'aura-thorns');
  if (!row) throw new Error('Missing native Thorns');
  return structuredClone(row);
}
describe('authored native mercenary Thorns', () => {
  it('uses the GDD potency and retains a passive with no cast effects', () => {
    expect(validate(authored())).toBe(true);
    expect(MERC_THORNS_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, physicalReflectionPct: 1 });
    expect(MERC_THORNS_SKILL).toMatchObject({ id: 'aura-thorns', trigger: 'passive',
      target: 'all-allies', manaCost: 0, cooldown: 0, effects: [] });
  });
  it('copies alternate valid tuning without retaining or freezing caller input', () => {
    const row = { ...authored(), maxLevel: 31, mercThorns: { physicalReflectionPct: 12.5 } };
    const result = resolveMercThorns([null, {}, row]);
    expect(result.definition).toEqual({ minLevel: 1, maxRank: 31, physicalReflectionPct: .125 });
    expect(Object.isFrozen(row.mercThorns)).toBe(false);
    row.mercThorns.physicalReflectionPct = 99;
    expect(result.definition.physicalReflectionPct).toBe(.125);
    expect(Object.isFrozen(result.definition)).toBe(true);
    expect(Object.isFrozen(result.skill.effects)).toBe(true);
    expect(validate({ ...authored(), mercThorns: { physicalReflectionPct: 0 } })).toBe(true);
  });
  it.each([
    { mercThorns: undefined }, { mercThorns: {} }, { mercThorns: { physicalReflectionPct: -1 } },
    { mercThorns: { physicalReflectionPct: NaN } }, { mercThorns: { physicalReflectionPct: Infinity } },
    { mercThorns: { physicalReflectionPct: '30' } }, { mercThorns: { physicalReflectionPct: 30, extra: 1 } },
    { trigger: 'active' }, { target: 'self' }, { cooldown: 1 }, { cost: { mana: 1 } },
    { damageType: 'physical' }, { appliesStatus: ['stun'] }, { appliesTags: ['physical'] },
    { scaling: { damagePerLevel: 1 } }
  ])('rejects malformed or conflicting metadata %j', patch => {
    const row = { ...authored(), ...patch };
    expect(validate(row)).toBe(false);
    expect(() => resolveMercThorns([row])).toThrow(/Invalid/);
  });
  it('rejects missing/duplicate native rows and tuning on another identity', () => {
    expect(() => resolveMercThorns([])).toThrow(/exactly one/);
    expect(() => resolveMercThorns([authored(), authored()])).toThrow(/exactly one/);
    expect(validate({ ...authored(), id: 'aura-prayer' })).toBe(false);
  });
});
