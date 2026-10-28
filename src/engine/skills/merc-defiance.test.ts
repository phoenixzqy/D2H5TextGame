import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_DEFIANCE_DEFINITION, MERC_DEFIANCE_SKILL, resolveMercDefiance } from './merc-defiance';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'aura-defiance');
  if (!row) throw new Error('Missing native Defiance');
  return structuredClone(row);
}
describe('authored native mercenary Defiance', () => {
  it('uses the GDD potency and retains a passive with no cast effects', () => {
    expect(validate(authored())).toBe(true);
    expect(MERC_DEFIANCE_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, defensePct: .3 });
    expect(MERC_DEFIANCE_SKILL).toMatchObject({ id: 'aura-defiance', trigger: 'passive',
      target: 'all-allies', manaCost: 0, cooldown: 0, effects: [] });
  });
  it('copies alternate valid tuning without retaining or freezing caller input', () => {
    const row = { ...authored(), maxLevel: 31, mercDefiance: { defensePct: 12.5 } };
    const result = resolveMercDefiance([null, {}, row]);
    expect(result.definition).toEqual({ minLevel: 1, maxRank: 31, defensePct: .125 });
    expect(Object.isFrozen(row.mercDefiance)).toBe(false);
    row.mercDefiance.defensePct = 99;
    expect(result.definition.defensePct).toBe(.125);
    expect(Object.isFrozen(result.definition)).toBe(true);
    expect(Object.isFrozen(result.skill.effects)).toBe(true);
    expect(validate({ ...authored(), mercDefiance: { defensePct: 0 } })).toBe(true);
  });
  it.each([
    { mercDefiance: undefined }, { mercDefiance: {} }, { mercDefiance: { defensePct: -1 } },
    { mercDefiance: { defensePct: NaN } }, { mercDefiance: { defensePct: Infinity } },
    { mercDefiance: { defensePct: '30' } }, { mercDefiance: { defensePct: 30, extra: 1 } },
    { trigger: 'active' }, { target: 'self' }, { cooldown: 1 }, { cost: { mana: 1 } },
    { damageType: 'physical' }, { appliesStatus: ['stun'] }, { appliesTags: ['physical'] },
    { scaling: { damagePerLevel: 1 } }
  ])('rejects malformed or conflicting metadata %j', patch => {
    const row = { ...authored(), ...patch };
    expect(validate(row)).toBe(false);
    expect(() => resolveMercDefiance([row])).toThrow(/Invalid/);
  });
  it('rejects missing/duplicate native rows and tuning on another identity', () => {
    expect(() => resolveMercDefiance([])).toThrow(/exactly one/);
    expect(() => resolveMercDefiance([authored(), authored()])).toThrow(/exactly one/);
    expect(validate({ ...authored(), id: 'aura-prayer' })).toBe(false);
  });
});
