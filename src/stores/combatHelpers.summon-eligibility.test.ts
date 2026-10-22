import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Player } from '@/engine/types/entities';
import { playerToCombatUnit, scopedSummonConfiguration } from './combatHelpers';
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
  ['necromancer', 'raise_skeletal_mage'],
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


// Minimal imported Mage composition fixtures, not earned progression or runtime acceptance.
const MAGE = 'necromancer.raise_skeletal_mage';
const MAGE_ALIAS = 'skills-necromancer-raise-skeletal-mage';
const SKELETON = 'necromancer.raise_skeleton';
const SKELETON_ALIAS = 'skills-necromancer-raise-skeleton';
function magePlayer(fields: Partial<Player> = {}): Player {
  return { ...createMockPlayer('ImportedMage', 'necromancer'), level: 12,
    comboOrder: [MAGE, 'fixture.unrelated'],
    skillLevels: { [SKELETON]: 1, [MAGE]: 6, 'fixture.keep': 7 }, ...fields };
}
function composeMage(p: Player) {
  const before = structuredClone(p);
  Object.freeze(p.comboOrder); Object.freeze(p.skillLevels); Object.freeze(p);
  const result = scopedSummonConfiguration(p);
  expect(p).toEqual(before);
  expect(result.skillOrder).not.toBe(p.comboOrder);
  expect(result.skillLevels).not.toBe(p.skillLevels);
  return result;
}

describe('production Mage exact class, unlock, prerequisite and alias composition', () => {
  it.each([1, 6, 20])('accepts rank%i at exact L12 with only the direct prerequisite allocated', rank => {
    const result = composeMage(magePlayer({ skillLevels: { [SKELETON]: 1, [MAGE]: rank, 'fixture.keep': 7 } }));
    expect(result.skillOrder).toEqual([MAGE, 'fixture.unrelated']);
    expect(result.skillLevels).toEqual({ [SKELETON]: 1, [MAGE]: rank, 'fixture.keep': 7 });
  });

  it.each(['amazon', 'assassin', 'barbarian', 'druid', 'paladin', 'sorceress'] as const)(
    'refuses foreign %s Mage slots despite valid imported rank and prerequisite', cls => {
      const result = composeMage(magePlayer({ class: cls, comboOrder: [MAGE_ALIAS, 'fixture.unrelated', MAGE] }));
      expect(result.skillOrder).toEqual(['fixture.unrelated']);
      expect(result.skillLevels).toEqual({ [SKELETON]: 1, [MAGE]: 6, 'fixture.keep': 7 });
    });

  it.each([11, 0, -1, 11.5, 12.5, NaN, Infinity, -Infinity])('refuses invalid/below-unlock level%s', level => {
    const result = composeMage(magePlayer({ level }));
    expect(result.skillOrder).toEqual(['fixture.unrelated']);
    expect(result.skillLevels?.[MAGE]).toBe(6);
  });

  it.each([undefined, NaN, Infinity, -Infinity, -1, 0, .5, 1.5, 21])(
    'refuses invalid-only Mage allocation%s without inventing/clamping a learned rank', rank => {
      const skillLevels = { [SKELETON]: 1, 'fixture.keep': 7, ...(rank === undefined ? {} : { [MAGE]: rank }) };
      const result = composeMage(magePlayer({ skillLevels }));
      expect(result.skillOrder).toEqual(['fixture.unrelated']);
      expect(result.skillLevels).toEqual(skillLevels);
    });

  it.each([
    [[MAGE], [MAGE]], [[MAGE_ALIAS], [MAGE_ALIAS]],
    [[MAGE_ALIAS, MAGE, MAGE_ALIAS], [MAGE_ALIAS, MAGE, MAGE_ALIAS]]
  ])('preserves explicit canonical/authored slots%j with one canonical copied rank', (slots, expected) => {
    const result = composeMage(magePlayer({ comboOrder: [...slots, 'fixture.unrelated'],
      skillLevels: { [SKELETON]: 1, [MAGE_ALIAS]: 6, 'fixture.keep': 7 } }));
    expect(result.skillOrder).toEqual([...expected, 'fixture.unrelated']);
    expect(result.skillLevels).toEqual({ [SKELETON]: 1, [MAGE]: 6, 'fixture.keep': 7 });
  });

  it('does not auto-slot a learned Mage or alter unrelated configuration', () => {
    const result = composeMage(magePlayer({ comboOrder: ['fixture.unrelated'] }));
    expect(result.skillOrder).toEqual(['fixture.unrelated']);
    expect(result.skillLevels).toEqual({ [SKELETON]: 1, [MAGE]: 6, 'fixture.keep': 7 });
  });

  it.each([SKELETON, SKELETON_ALIAS])('accepts the validated direct prerequisite alias%s without slotting Skeleton', alias => {
    const result = composeMage(magePlayer({ skillLevels: { [alias]: 1, [MAGE]: 6, 'fixture.keep': 7 } }));
    expect(result.skillOrder).toEqual([MAGE, 'fixture.unrelated']);
    expect(result.skillLevels).toEqual({ [alias]: 1, [MAGE]: 6, 'fixture.keep': 7 });
  });

  it.each([undefined, NaN, Infinity, -Infinity, -1, 0, .5, 1.5, 21])(
    'requires a valid direct Skeleton prerequisite allocation%s', rank => {
      const skillLevels = { [MAGE]: 6, 'fixture.keep': 7, ...(rank === undefined ? {} : { [SKELETON]: rank }) };
      const result = composeMage(magePlayer({ skillLevels }));
      expect(result.skillOrder).toEqual(['fixture.unrelated']);
      expect(result.skillLevels).toEqual(skillLevels);
    });

  it.each([MAGE, MAGE_ALIAS])('normalizes the highest VALID Mage allocation when%s is invalid', invalidAlias => {
    const validAlias = invalidAlias === MAGE ? MAGE_ALIAS : MAGE;
    for (const invalid of [NaN, Infinity, -Infinity, -1, 0, 1.5, 21]) {
      const result = composeMage(magePlayer({ skillLevels: {
        [SKELETON]: 1, [invalidAlias]: invalid, [validAlias]: 6, 'fixture.keep': 7 } }));
      expect(result.skillOrder).toEqual([MAGE, 'fixture.unrelated']);
      expect(result.skillLevels).toEqual({ [SKELETON]: 1, [MAGE]: 6, 'fixture.keep': 7 });
    }
  });

  it.each([[1, 20, 20], [20, 1, 20], [6, 6, 6]])('normalizes conflicting valid ranks%i/%i to%i', (canonical, authored, expected) => {
    const result = composeMage(magePlayer({ skillLevels: {
      [SKELETON]: 1, [MAGE]: canonical, [MAGE_ALIAS]: authored, 'fixture.keep': 7 } }));
    expect(result.skillOrder).toEqual([MAGE, 'fixture.unrelated']);
    expect(result.skillLevels).toEqual({ [SKELETON]: 1, [MAGE]: expected, 'fixture.keep': 7 });
  });

  it.each([SKELETON, SKELETON_ALIAS])('accepts a valid prerequisite beside invalid%s', invalidAlias => {
    const validAlias = invalidAlias === SKELETON ? SKELETON_ALIAS : SKELETON;
    const result = composeMage(magePlayer({ skillLevels: {
      [MAGE]: 6, [invalidAlias]: 1.5, [validAlias]: 1, 'fixture.keep': 7 } }));
    expect(result.skillOrder).toEqual([MAGE, 'fixture.unrelated']);
    expect(result.skillLevels).toEqual({ [MAGE]: 6, [invalidAlias]: 1.5, [validAlias]: 1, 'fixture.keep': 7 });
  });
});
