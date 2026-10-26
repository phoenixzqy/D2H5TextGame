import { expect, it } from 'vitest';
import rows from '../../data/skills/sorceress.json';
import { createSkillValidator } from './skill-validator';
import { composePeriodicSpellRanks } from './periodic-spell-authority';
import { PERIODIC_SPELL_DEFINITIONS, resolvePeriodicSpellDefinition } from './periodic-spells';

const validate = createSkillValidator();
const source = rows.find(row => row.id === 'skills-sorceress-inferno');

it('requires explicit finite channel timing and the authored stream footprint', () => {
  expect(validate(source)).toBe(true);
  expect(source).toMatchObject({ periodicSpell: { durationMs: 3000, intervalMs: 1000, channelled: true },
    target: 'area-enemies', aoeShape: 'cone-2', cost: { mana: 10 }, cooldown: 1 });
  expect(PERIODIC_SPELL_DEFINITIONS.inferno).toMatchObject({ channelled: true, target: 'area-enemies',
    aoeShape: 'cone-2', pulse: { base: [35, 55], perRank: [4, 4], damageType: 'fire',
      applyStatus: { id: 'burn', dotPctOfDamage: .1 } } });
});

it.each([undefined, { durationMs: 3000, intervalMs: 1000 },
  { durationMs: 3000, intervalMs: 1000, channelled: false },
  { durationMs: 0, intervalMs: 1000, channelled: true },
  { durationMs: 3000, intervalMs: 999, channelled: true },
  { durationMs: 60001, intervalMs: 1000, channelled: true },
  { durationMs: 3000, intervalMs: 1000, channelled: true, extra: 1 }])(
  'rejects missing, nonchannel or invalid timing %j', periodicSpell => {
    expect(validate({ ...source, periodicSpell })).toBe(false);
  });

it.each([{ aoeShape: undefined }, { aoeShape: 'all-enemies' }, { target: 'all-enemies' },
  { ignoresDefense: true }, { hitSequence: { strikes: 2 } }, { maxTargets: 2 },
  { heal: { min: 1, max: 2, target: 'self' } }])('rejects contradictory stream mechanics %j', patch => {
  expect(validate({ ...source, ...patch })).toBe(false);
});

it('rejects a nonrecurring interval and duplicate/missing source definitions', () => {
  expect(() => resolvePeriodicSpellDefinition([{ ...source,
    periodicSpell: { durationMs: 1000, intervalMs: 1000, channelled: true } }], 'inferno')).toThrow();
  expect(() => resolvePeriodicSpellDefinition([source, source], 'inferno')).toThrow();
  expect(() => resolvePeriodicSpellDefinition([], 'inferno')).toThrow();
});

it('copies and freezes paid pulse metadata independently of the JSON source', () => {
  const row = structuredClone(source), before = structuredClone(row);
  const definition = resolvePeriodicSpellDefinition([row], 'inferno');
  expect(row).toEqual(before);
  expect(Object.isFrozen(definition)).toBe(true);
  expect(Object.isFrozen(definition.pulse)).toBe(true);
  expect(Object.isFrozen(definition.pulse.base)).toBe(true);
  expect(Object.isFrozen(definition.pulse.applyStatus)).toBe(true);
  if (!row?.damage) throw new Error('Missing authored Inferno damage');
  row.damage.min = 999;
  row.periodicSpell = { durationMs: 9000, intervalMs: 2000, channelled: true };
  expect(definition.pulse.base).toEqual([35, 55]);
  expect(definition.durationMs).toBe(3000);
});

it.each(['blaze', 'fire-wall', 'thunder-storm'])('keeps %s independent of caster actions and controls', id => {
  const row = rows.find(r => r.id === 'skills-sorceress-' + id);
  expect(validate({ ...row, periodicSpell: { durationMs: 3000, intervalMs: 1000, channelled: true } })).toBe(false);
});

it.each([1, 2, 20])('projects learned rank%i independently of selected priorities', rank => {
  const player = { class: 'sorceress' as const, level: 30, skillLevels: { 'skills-sorceress-inferno': rank } };
  const before = structuredClone(player);
  expect(composePeriodicSpellRanks(player).inferno).toBe(rank);
  expect(player).toEqual(before);
});

it.each([{ class: 'amazon' as const, level: 30, skillLevels: { 'skills-sorceress-inferno': 20 } },
  { class: 'sorceress' as const, level: 5, skillLevels: { 'skills-sorceress-inferno': 1 } },
  { class: 'sorceress' as const, level: 30, skillLevels: {} }])('denies native eligibility %j', player => {
  expect(composePeriodicSpellRanks(player).inferno).toBe(0);
});
