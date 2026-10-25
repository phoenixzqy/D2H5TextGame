import { describe, expect, it } from 'vitest';
import paladin from '../../data/skills/paladin.json';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator();
function row(): Record<string, unknown> {
  const source = paladin.find((skill) => skill.id === 'skills-paladin-vengeance');
  if (!source) throw new Error('Missing actual Vengeance');
  return structuredClone(source);
}
const complete = () => ({ ...row(), damageComposition: 'weighted-components' });

describe('Vengeance explicit composite schema ownership', () => {
  it('requires the actual authored opt-in without changing total, growth or weights', () => {
    expect(row()).toMatchObject({
      damageComposition: 'weighted-components',
      damage: { min: 90, max: 150, breakdown: { fire: 50, cold: 50, lightning: 50 } },
      scaling: { damagePerLevel: 9 }
    });
    expect(validate(row())).toBe(true);
    expect(validate(complete())).toBe(true);
  });
  it('rejects silently returning Vengeance to scalar damage', () => {
    const input = complete();
    Reflect.deleteProperty(input, 'damageComposition');
    expect(validate(input)).toBe(false);
  });
  it.each([true, false, null, 'mixed', {}, 1])(
    'rejects malformed composition %j',
    (damageComposition) => {
      expect(validate({ ...complete(), damageComposition })).toBe(false);
    }
  );
  it.each([
    { id: 'skills-paladin-holy-fire' },
    { trigger: 'aura' },
    { target: 'all-enemies' },
    { damageType: 'physical' },
    { maxLevel: 21 },
    { requiredLevel: 6 },
    { prerequisites: [] },
    { ignoresMagicResist: true },
    { onHitRecovery: { lifeFraction: 0.5 } }
  ])('rejects contradictory identity or behavior %j', (patch) => {
    expect(validate({ ...complete(), ...patch })).toBe(false);
  });
  it.each([
    { fire: 50, cold: 50 },
    { fire: 50, cold: 50, lightning: 0 },
    { fire: -1, cold: 50, lightning: 50 },
    { fire: NaN, cold: 50, lightning: 50 },
    { fire: Infinity, cold: 50, lightning: 50 },
    { fire: 50, cold: 50, lightning: 50, physical: 1 }
  ])('rejects missing, nonpositive, nonfinite or foreign weights %j', (breakdown) => {
    expect(validate({ ...complete(), damage: { min: 90, max: 150, breakdown } })).toBe(false);
  });
  it.each([
    ['burn'],
    ['burn', 'chill'],
    ['burn', 'paralyze', 'chill'],
    ['burn', 'chill', 'paralyze', 'poison']
  ])('requires all three ordered elemental statuses %j', (...appliesStatus) => {
    expect(validate({ ...complete(), appliesStatus })).toBe(false);
  });
});
