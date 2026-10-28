import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { MERC_FIRE_MASTERY_DEFINITION, MERC_FIRE_MASTERY_SKILL, resolveMercFireMastery } from './merc-fire-mastery';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'passive-fire-mastery');
  if (!row) throw new Error('Missing native Fire Mastery');
  return structuredClone(row);
}
describe('authored native mercenary FireMastery', () => {
  it('uses the GDD potency and retains a passive with no cast effects', () => {
    expect(validate(authored())).toBe(true);
    expect(MERC_FIRE_MASTERY_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, fireDamagePct: .25 });
    expect(MERC_FIRE_MASTERY_SKILL).toMatchObject({ id: 'passive-fire-mastery', trigger: 'passive',
      target: 'all-allies', manaCost: 0, cooldown: 0, effects: [] });
  });
  it('copies alternate valid tuning without retaining or freezing caller input', () => {
    const row = { ...authored(), maxLevel: 31, mercFireMastery: { fireDamagePct: 12.5 } };
    const result = resolveMercFireMastery([null, {}, row]);
    expect(result.definition).toEqual({ minLevel: 1, maxRank: 31, fireDamagePct: .125 });
    expect(Object.isFrozen(row.mercFireMastery)).toBe(false);
    row.mercFireMastery.fireDamagePct = 99;
    expect(result.definition.fireDamagePct).toBe(.125);
    expect(Object.isFrozen(result.definition)).toBe(true);
    expect(Object.isFrozen(result.skill.effects)).toBe(true);
    expect(validate({ ...authored(), mercFireMastery: { fireDamagePct: 0 } })).toBe(true);
  });
  it.each([
    { mercFireMastery: undefined }, { mercFireMastery: {} }, { mercFireMastery: { fireDamagePct: -1 } },
    { mercFireMastery: { fireDamagePct: NaN } }, { mercFireMastery: { fireDamagePct: Infinity } },
    { mercFireMastery: { fireDamagePct: '25' } }, { mercFireMastery: { fireDamagePct: 25, extra: 1 } },
    { trigger: 'active' }, { target: 'self' }, { cooldown: 1 }, { cost: { mana: 1 } },
    { damageType: 'fire' }, { appliesStatus: ['stun'] }, { appliesTags: ['fire'] },
    { scaling: { damagePerLevel: 1 } }
  ])('rejects malformed or conflicting metadata %j', patch => {
    const row = { ...authored(), ...patch };
    expect(validate(row)).toBe(false);
    expect(() => resolveMercFireMastery([row])).toThrow(/Invalid/);
  });
  it('rejects missing/duplicate native rows and tuning on another identity', () => {
    expect(() => resolveMercFireMastery([])).toThrow(/exactly one/);
    expect(() => resolveMercFireMastery([authored(), authored()])).toThrow(/exactly one/);
    expect(validate({ ...authored(), id: 'aura-prayer' })).toBe(false);
  });
});
