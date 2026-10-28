import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_MIGHT_DEFINITION, MERC_MIGHT_SKILL, resolveMercMight } from './merc-might';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'aura-might');
  if (!row) throw new Error('Missing native Might');
  return structuredClone(row);
}
describe('authored native mercenary Might', () => {
  it('uses the GDD potency and retains a passive with no cast effects', () => {
    expect(validate(authored())).toBe(true);
    expect(MERC_MIGHT_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, physicalDamagePct: .3 });
    expect(MERC_MIGHT_SKILL).toMatchObject({ id: 'aura-might', trigger: 'passive',
      target: 'all-allies', manaCost: 0, cooldown: 0, effects: [] });
  });
  it('copies alternate valid tuning without retaining or freezing caller input', () => {
    const row = { ...authored(), maxLevel: 31, mercMight: { physicalDamagePct: 12.5 } };
    const result = resolveMercMight([null, {}, row]);
    expect(result.definition).toEqual({ minLevel: 1, maxRank: 31, physicalDamagePct: .125 });
    expect(Object.isFrozen(row.mercMight)).toBe(false);
    row.mercMight.physicalDamagePct = 99;
    expect(result.definition.physicalDamagePct).toBe(.125);
    expect(Object.isFrozen(result.definition)).toBe(true);
    expect(Object.isFrozen(result.skill.effects)).toBe(true);
    expect(validate({ ...authored(), mercMight: { physicalDamagePct: 0 } })).toBe(true);
  });
  it.each([
    { mercMight: undefined }, { mercMight: {} }, { mercMight: { physicalDamagePct: -1 } },
    { mercMight: { physicalDamagePct: NaN } }, { mercMight: { physicalDamagePct: Infinity } },
    { mercMight: { physicalDamagePct: '30' } }, { mercMight: { physicalDamagePct: 30, extra: 1 } },
    { trigger: 'active' }, { target: 'self' }, { cooldown: 1 }, { cost: { mana: 1 } },
    { damageType: 'physical' }, { appliesStatus: ['stun'] }, { appliesTags: ['physical'] },
    { scaling: { damagePerLevel: 1 } }
  ])('rejects malformed or conflicting metadata %j', patch => {
    const row = { ...authored(), ...patch };
    expect(validate(row)).toBe(false);
    expect(() => resolveMercMight([row])).toThrow(/Invalid/);
  });
  it('rejects missing/duplicate native rows and tuning on another identity', () => {
    expect(() => resolveMercMight([])).toThrow(/exactly one/);
    expect(() => resolveMercMight([authored(), authored()])).toThrow(/exactly one/);
    expect(validate({ ...authored(), id: 'aura-prayer' })).toBe(false);
  });
});
