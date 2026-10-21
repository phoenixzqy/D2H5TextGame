import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Player } from '@/engine/types/entities';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';
import { getSkillsForClass, type SkillTemplate } from './skillsHelpers';

// Literal policy membership, independent of the new engine helper. Imported
// levels/allocations are adapter scaffolding, never earned campaign evidence.
const CASES = [
  ['amazon', 'valkyrie'],
  ['assassin', 'shadow_warrior'],
  ['assassin', 'shadow_master'],
  ['druid', 'summon_dire_wolf'],
  ['druid', 'raven'],
  ['druid', 'poison_creeper'],
  ['druid', 'summon_spirit_wolf'],
  ['druid', 'carrion_vine'],
  ['druid', 'solar_creeper'],
  ['druid', 'summon_grizzly'],
  ['necromancer', 'blood_golem'],
  ['necromancer', 'clay_golem'],
  ['necromancer', 'fire_golem']
] as const;

function ids(cls: string, name: string) {
  return { canonical: `${cls}.${name}`, authored: `skills-${cls}-${name.replace(/_/g, '-')}` };
}

function eligible(cls: (typeof CASES)[number][0], name: string): Player {
  const { canonical } = ids(cls, name);
  const fresh = createMockPlayer('ImportedPreparation', cls);
  // Real authored prerequisite data provides setup only; outputs are literal.
  const prerequisites = Object.fromEntries(getSkillsForClass(cls).map(skill => [skill.id, 1]));
  return { ...fresh, level: 30, comboOrder: [canonical],
    skillLevels: { ...prerequisites, [canonical]: 2 } };
}

beforeEach(() => {
  useInventoryStore.getState().reset();
  useFormationStore.getState().reset();
});
afterEach(() => {
  useInventoryStore.getState().reset();
  useFormationStore.getState().reset();
});

describe('production scoped summon preparation eligibility', () => {
  it.each(CASES)('normalizes %s.%s canonical and authored slots to one copied rank', (cls, name) => {
    const { canonical, authored } = ids(cls, name);
    const p: Player = { ...eligible(cls, name),
      comboOrder: [authored, 'fixture.unrelated', canonical] };
    const before = structuredClone(p);
    const result = playerToCombatUnit(p);
    expect(result.skillOrder).toEqual([authored, 'fixture.unrelated', canonical]);
    const expected = { ...p.skillLevels };
    Reflect.deleteProperty(expected, authored);
    expected[canonical] = 2;
    expect(result.skillLevels).toEqual(expected);
    expect(result.skillLevels).not.toBe(p.skillLevels);
    expect(result.skillOrder).not.toBe(p.comboOrder);
    expect(p).toEqual(before);
  });

  it.each(CASES)('excludes unlearned slotted %s.%s instead of granting rank one', (cls, name) => {
    const { canonical, authored } = ids(cls, name);
    const p = eligible(cls, name);
    const levels = { ...p.skillLevels };
    Reflect.deleteProperty(levels, canonical); Reflect.deleteProperty(levels, authored);
    expect(playerToCombatUnit({ ...p, skillLevels: levels,
      comboOrder: [authored, 'fixture.unrelated', canonical] }).skillOrder).toEqual(['fixture.unrelated']);
  });

  it.each(CASES)('keeps learned unslotted %s.%s out of the combat order', (cls, name) => {
    const p = eligible(cls, name);
    expect(playerToCombatUnit({ ...p, comboOrder: ['fixture.unrelated'] }).skillOrder)
      .toEqual(['fixture.unrelated']);
  });

  it('normalizes conflicting valid aliases to the highest validated allocation without changing Player', () => {
    const p = { ...eligible('druid', 'raven'), skillLevels: {
      'druid.raven': 1, 'skills-druid-raven': 20, 'unrelated.rank': 7 } };
    const before = structuredClone(p);
    Object.freeze(p.skillLevels); Object.freeze(p.comboOrder); Object.freeze(p);
    const result = playerToCombatUnit(p);
    expect(result.skillLevels).toEqual({ 'druid.raven': 20, 'unrelated.rank': 7 });
    expect(p).toEqual(before);
  });

  it.each([NaN, Infinity, -Infinity, -1, 0, 1.5, 21])(
    'ignores invalid canonical alias %s beside a valid authored allocation', invalid => {
      const p = eligible('druid', 'raven');
      const result = playerToCombatUnit({ ...p,
        skillLevels: { 'druid.raven': invalid, 'skills-druid-raven': 2 } });
      expect(result.skillOrder).toEqual(['druid.raven']);
      expect(result.skillLevels).toEqual({ 'druid.raven': 2 });
    });

  it.each([NaN, Infinity, -Infinity, -1, 0, 1.5, 21])(
    'ignores invalid authored alias %s beside a valid canonical allocation', invalid => {
      const p = eligible('druid', 'raven');
      const result = playerToCombatUnit({ ...p,
        skillLevels: { 'druid.raven': 2, 'skills-druid-raven': invalid } });
      expect(result.skillOrder).toEqual(['druid.raven']);
      expect(result.skillLevels).toEqual({ 'druid.raven': 2 });
    });

  it.each([NaN, Infinity, -Infinity, -1, 0, 1.5, 21])(
    'excludes invalid-only allocation %s without clamping it into a learned skill', rank => {
      const p = eligible('druid', 'raven');
      const result = playerToCombatUnit({ ...p, skillLevels: { 'druid.raven': rank } });
      expect(result.skillOrder).toEqual([]);
    });

  it.each([NaN, Infinity, -Infinity, 0, -1, 29, 29.5, 30.5])(
    'excludes Valkyrie at invalid or below-required player level %s', level => {
      const p = eligible('amazon', 'valkyrie');
      expect(playerToCombatUnit({ ...p, level,
        comboOrder: ['amazon.valkyrie', 'fixture.unrelated'] }).skillOrder).toEqual(['fixture.unrelated']);
    });

  it.each([undefined, NaN, Infinity, -1, 0, 0.5, 21])(
    'requires a validated direct prerequisite allocation %s', rank => {
      const p = eligible('amazon', 'valkyrie');
      const skillLevels = { ...p.skillLevels };
      delete skillLevels['skills-amazon-decoy'];
      if (rank !== undefined) skillLevels['amazon.decoy'] = rank;
      expect(playerToCombatUnit({ ...p, skillLevels }).skillOrder).toEqual([]);
    });

  it('accepts a valid prerequisite alias beside an invalid one', () => {
    const p = eligible('amazon', 'valkyrie');
    const result = playerToCombatUnit({ ...p, skillLevels: {
      ...p.skillLevels, 'skills-amazon-decoy': NaN, 'amazon.decoy': 1 } });
    expect(result.skillOrder).toEqual(['amazon.valkyrie']);
  });

  it('rejects an unknown authored prerequisite and restores the actual data fixture', () => {
    const catalog = getSkillsForClass('amazon');
    const index = catalog.findIndex(skill => skill.id === 'skills-amazon-valkyrie');
    const original = catalog[index];
    if (!original) throw new Error('Missing actual authored Valkyrie');
    const replaced: SkillTemplate = { ...original, prerequisites: ['skills-amazon-missing-fixture'] };
    try {
      catalog[index] = replaced;
      expect(playerToCombatUnit(eligible('amazon', 'valkyrie')).skillOrder).toEqual([]);
    } finally { catalog[index] = original; }
    expect(catalog[index]).toBe(original);
  });
});
