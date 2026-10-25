import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/paladin.json';
import { createSkillValidator } from './skill-validator';
const validate = createSkillValidator();
function row(): Record<string, unknown> {
  const skill = skills.find((s) => s.id === 'skills-paladin-zeal');
  if (!skill) throw new Error('Missing Zeal schema fixture');
  return structuredClone(skill);
}
const complete = () => ({ ...row(), maxTargets: 3 });
describe('Zeal authored target cap', () => {
  it('requires the advertised cap in actual data', () => {
    expect(row()).toHaveProperty('maxTargets', 3);
    expect(validate(row())).toBe(true);
    expect(validate(complete())).toBe(true);
  });
  it('rejects silently removing the limit', () => {
    const s = complete();
    Reflect.deleteProperty(s, 'maxTargets');
    expect(validate(s)).toBe(false);
  });
  it.each([0, -1, 1.5, 4, Infinity, NaN, '3', null, {}])(
    'rejects malformed cap %j',
    (maxTargets) => {
      expect(validate({ ...complete(), maxTargets })).toBe(false);
    }
  );
  it.each([
    { id: 'skills-paladin-smite' },
    { trigger: 'passive' },
    { target: 'all-enemies' },
    { aoeShape: 'line-3' },
    { damageType: 'arcane' },
    { requiredLevel: 1 },
    { maxLevel: 21 },
    { appliesStatus: ['stun'] },
    { hitSequence: { strikes: 5 } },
    { onHitSelfDamage: { lifeFraction: 0.08, minimumLifeLoss: 1 } }
  ])('rejects foreign/contradictory targeting %j', (patch) => {
    expect(validate({ ...complete(), ...patch })).toBe(false);
  });
});
