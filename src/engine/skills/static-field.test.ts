import { describe, expect, it } from 'vitest';
import sorceressSkills from '../../data/skills/sorceress.json';
import { composeStaticField, resolveStaticFieldDefinition, resolveStaticFieldRank,
  STATIC_FIELD_DEFINITION } from './static-field';

describe('Static Field source ownership and exact allocated ranks', () => {
  it('validates and privately copies the single source definition', () => {
    const row = structuredClone(sorceressSkills.find(s => s.id === 'skills-sorceress-static-field'));
    if (!row?.staticField) throw new Error('Missing definition');
    const definition = resolveStaticFieldDefinition([row]);
    expect(definition).toEqual({ requiredLevel: 6, maxRank: 20, currentHealthFraction: 0.25,
      normalFloorFraction: 0, nightmareFloorFraction: 0.33 });
    row.staticField.currentHealthFraction = 0.5;
    expect(definition.currentHealthFraction).toBe(0.25);
    expect(Object.isFrozen(definition)).toBe(true);
    expect(STATIC_FIELD_DEFINITION).toEqual(definition);
    expect(() => resolveStaticFieldDefinition([])).toThrow(/Static Field/);
    expect(() => resolveStaticFieldDefinition([row, row])).toThrow(/Static Field/);
    expect(() => resolveStaticFieldDefinition([{ ...row, staticField: undefined }])).toThrow(/Static Field/);
  });
  it.each([
    [{}, 0], [{ 'sorceress.static_field': 1 }, 1],
    [{ 'skills-sorceress-static-field': 20 }, 20],
    [{ 'sorceress.static_field': 1, 'skills-sorceress-static-field': 4 }, 4],
    [{ 'sorceress.static_field': Infinity, 'skills-sorceress-static-field': 2 }, 2],
    [{ 'sorceress.static_field': 99 }, 20],
    [{ 'sorceress.static_field': 1.5, 'sorceress.static-field': 20 }, 0]
  ] as const)('resolves actual aliases once: %j', (levels, expected) => {
    expect(resolveStaticFieldRank(levels)).toBe(expected);
  });
  it.each(['amazon', 'assassin', 'barbarian', 'druid', 'necromancer', 'paladin'] as const)(
    'refuses a foreign %s even with matching allocation', classId => {
      expect(composeStaticField({ class: classId, level: 24, skillLevels: { 'sorceress.static_field': 20 } })).toBe(0);
    });
  it.each([1, 5, NaN, Infinity, 6.5])('refuses invalid/under-unlock level%s', level => {
    expect(composeStaticField({ class: 'sorceress', level, skillLevels: { 'sorceress.static_field': 20 } })).toBe(0);
  });
  it('admits actual Sorceress allocations from unlock onwards', () => {
    expect(composeStaticField({ class: 'sorceress', level: 6, skillLevels: { 'sorceress.static_field': 1 } })).toBe(1);
  });
});
