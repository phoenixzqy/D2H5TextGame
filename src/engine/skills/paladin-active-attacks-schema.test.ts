import { describe, expect, it } from 'vitest';
import authored from '../../data/skills/paladin.json';
import { createSkillValidator } from './skill-validator';
const validate = createSkillValidator();
const source = (slug: string): Record<string, unknown> => {
  const row = authored.find((s) => s.id === 'skills-paladin-' + slug);
  if (!row) throw new Error('Missing Paladin attack fixture');
  return structuredClone(row);
};
const complete = (slug: string) => ({
  ...source(slug),
  ...(slug === 'holy-bolt'
    ? { onHitRecovery: { lifeFraction: 0.5 } }
    : { ignoresMagicResist: true })
});
describe.each(['holy-bolt', 'blessed-hammer'])('strict Paladin %s attack metadata', (slug) => {
  const field = slug === 'holy-bolt' ? 'onHitRecovery' : 'ignoresMagicResist';
  it('accepts explicit data and requires it on the actual authored row', () => {
    expect(validate(complete(slug))).toBe(true);
    expect(source(slug)[field]).toEqual(slug === 'holy-bolt' ? { lifeFraction: 0.5 } : true);
    expect(validate(source(slug))).toBe(true);
  });
  it('rejects missing behavior metadata rather than accepting a misleading ordinary attack', () => {
    const row = complete(slug);
    Reflect.deleteProperty(row, field);
    expect(validate(row)).toBe(false);
  });
  it('rejects foreign or contradictory ownership', () => {
    for (const patch of [
      { id: 'skills-paladin-smite' },
      { trigger: 'passive' },
      { target: 'summon' },
      { damageType: 'physical' },
      { maxLevel: 21 }
    ]) {
      expect(validate({ ...complete(slug), ...patch })).toBe(false);
    }
  });
});
it.each([
  {},
  { lifeFraction: 0 },
  { lifeFraction: -0.1 },
  { lifeFraction: NaN },
  { lifeFraction: Infinity },
  { lifeFraction: 1.1 },
  { lifeFraction: 0.5, typo: 1 }
])('rejects malformed Holy Bolt recovery %j', (onHitRecovery) => {
  expect(validate({ ...complete('holy-bolt'), onHitRecovery })).toBe(false);
});
it.each([false, 1, 'true', null, {}])(
  'rejects malformed Hammer opt-in %j',
  (ignoresMagicResist) => {
    expect(validate({ ...complete('blessed-hammer'), ignoresMagicResist })).toBe(false);
  }
);
it('does not allow Hammer bypass metadata on another otherwise valid Arcane skill', () => {
  expect(
    validate({
      ...source('holy-bolt'),
      onHitRecovery: { lifeFraction: 0.5 },
      ignoresMagicResist: true
    })
  ).toBe(false);
});
