import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/paladin.json';
import { createSkillValidator } from './skill-validator';
const validate = createSkillValidator();
const row = (): Record<string, unknown> => {
  const skill = skills.find((s) => s.id === 'skills-paladin-sacrifice');
  if (!skill) throw new Error('Missing Sacrifice schema fixture');
  return structuredClone(skill);
};
const complete = () => ({ ...row(), onHitSelfDamage: { lifeFraction: 0.08, minimumLifeLoss: 1 } });
describe('strict Sacrifice self-damage metadata', () => {
  it('requires explicit authored tuning on the actual skill', () => {
    expect(row()).toHaveProperty('onHitSelfDamage', { lifeFraction: 0.08, minimumLifeLoss: 1 });
    expect(validate(row())).toBe(true);
    expect(validate(complete())).toBe(true);
  });
  it('rejects silently removing the life tradeoff', () => {
    const s = complete();
    Reflect.deleteProperty(s, 'onHitSelfDamage');
    expect(validate(s)).toBe(false);
  });
  it.each([
    {},
    { lifeFraction: 0, minimumLifeLoss: 1 },
    { lifeFraction: -1, minimumLifeLoss: 1 },
    { lifeFraction: 1.1, minimumLifeLoss: 1 },
    { lifeFraction: NaN, minimumLifeLoss: 1 },
    { lifeFraction: Infinity, minimumLifeLoss: 1 },
    { lifeFraction: 0.08 },
    { lifeFraction: 0.08, minimumLifeLoss: 0 },
    { lifeFraction: 0.08, minimumLifeLoss: 1.5 },
    { lifeFraction: 0.08, minimumLifeLoss: Infinity },
    { lifeFraction: 0.08, minimumLifeLoss: 1, typo: true }
  ])('rejects malformed tuning %j', (onHitSelfDamage) => {
    expect(validate({ ...row(), onHitSelfDamage })).toBe(false);
  });
  it.each([
    { id: 'skills-paladin-smite' },
    { trigger: 'passive' },
    { target: 'all-enemies' },
    { damageType: 'arcane' },
    { requiredLevel: 12 },
    { maxLevel: 21 },
    { onHitRecovery: { lifeFraction: 0.5 } },
    { hitSequence: { strikes: 5 } },
    { appliesStatus: ['stun'] }
  ])('rejects foreign/contradictory ownership %j', (patch) => {
    expect(validate({ ...complete(), ...patch })).toBe(false);
  });
});
