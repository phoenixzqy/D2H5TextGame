import { expect, it } from 'vitest';
import rows from '../../data/skills/sorceress.json';
import { createSkillValidator } from './skill-validator';
import { PERIODIC_SPELL_DEFINITIONS, resolvePeriodicSpellDefinition } from './periodic-spells';

const validate = createSkillValidator();
for (const spell of ['blaze', 'fire-wall', 'thunder-storm']) {
  const row = rows.find(r => r.id === 'skills-sorceress-' + spell);
  it(`${spell} requires strict authored recurring timing`, () => {
    expect(row).toHaveProperty('periodicSpell', { durationMs: 3000, intervalMs: 1000 });
    expect(validate(row)).toBe(true);
    expect(validate({ ...row, periodicSpell: undefined })).toBe(false);
  });
  it.each([{ durationMs: 0, intervalMs: 1000 }, { durationMs: 3000, intervalMs: 999 },
    { durationMs: 60001, intervalMs: 1000 }, { durationMs: 3000, intervalMs: 1000, extra: 1 },
    { durationMs: 3000 }, { durationMs: '3000', intervalMs: 1000 }])(`${spell} refuses invalid timing %j`, periodicSpell => {
    expect(validate({ ...row, periodicSpell })).toBe(false);
  });
  it.each([{ attackDamagePct: 100 }, { hitSequence: { strikes: 2 } }, { ignoresDefense: true },
    { heal: { min: 1, max: 2, target: 'self' } }])(`${spell} refuses unsupported extra mechanics %j`, patch => {
    expect(validate({ ...row, ...patch })).toBe(false);
  });
}
it('copies pulse metadata into immutable definitions, including ordinary Burn and Paralyze', () => {
  expect(PERIODIC_SPELL_DEFINITIONS.blaze.pulse).toMatchObject({ kind: 'damage', damageType: 'fire',
    base: [60, 85], perRank: [5, 5], applyStatus: { id: 'burn', dotPctOfDamage: .1 } });
  expect(PERIODIC_SPELL_DEFINITIONS['thunder-storm'].pulse).toMatchObject({ damageType: 'lightning',
    applyStatus: { id: 'paralyze' } });
  expect(Object.isFrozen(PERIODIC_SPELL_DEFINITIONS.blaze.pulse.base)).toBe(true);
  expect(() => resolvePeriodicSpellDefinition([], 'blaze')).toThrow();
  const row = rows.find(r => r.id === 'skills-sorceress-blaze');
  expect(() => resolvePeriodicSpellDefinition([{ ...row, periodicSpell: { durationMs: 1000, intervalMs: 1000 } }], 'blaze')).toThrow();
});
it('prevents unrelated skills from opting into paid recurring spell timing', () => {
  expect(validate({ ...rows[0], periodicSpell: { durationMs: 3000, intervalMs: 1000 } })).toBe(false);
});
