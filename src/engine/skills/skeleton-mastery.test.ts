import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import necromancerSkills from '../../data/skills/necromancer.json';
import skillSchema from '../../data/schema/skill.schema.json';
import sorceressSkills from '../../data/skills/sorceress.json';
import paladinSkills from '../../data/skills/paladin.json';
import barbarianSkills from '../../data/skills/barbarian.json';

const authored = () => {
  const row = necromancerSkills.find(row => row.id === 'skills-necromancer-skeleton-mastery');
  if (!row) throw new Error('Missing authored Skeleton Mastery');
  return structuredClone(row);
};
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);

const coefficients = { summonLifePct: 0.04, summonAttackPct: 0.02, summonDefensePct: 0.01 };
const coefficientKeys = ['summonLifePct', 'summonAttackPct', 'summonDefensePct'] as const;
const malformedRows = [
  { requiredLevel: undefined },
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '18', null].map(requiredLevel => ({ requiredLevel })),
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '20', null].map(maxLevel => ({ maxLevel })),
  { scaling: undefined }, { scaling: {} }, { scaling: { passiveStatsPerLevel: {} } },
  ...coefficientKeys.flatMap(key => [
    { scaling: { passiveStatsPerLevel: Object.fromEntries(Object.entries(coefficients).filter(([name]) => name !== key)) } },
    ...[-0.01, NaN, Infinity, -Infinity, '0.04', null].map(value =>
      ({ scaling: { passiveStatsPerLevel: { ...coefficients, [key]: value } } }))
  ]),
  { trigger: 'active' }, { target: 'single-enemy' }, { passive: false },
  { aura: true }, { summon: true },
  ...[1, -1, NaN, Infinity, -Infinity, '0', null].map(cooldown => ({ cooldown })),
  { cost: {} }, { cost: { mana: 0 } }, { cost: { life: 0 } },
  { damage: { min: 1, max: 1, breakdown: { physical: 1 } } }, { damageType: 'physical' },
  { appliesStatus: [] }, { appliesStatus: ['burn'] }, { statusEffect: { chance: 1 } },
  { additionalStatusEffects: { freeze: { chance: 1 } } },
  { appliesTags: [] }, { appliesTags: ['fire'] }, { synergies: {} }, { synergies: { fire: 1.2 } },
  { heal: { min: 1, max: 1, target: 'self' } }, { summonId: 'skeleton' },
  { aoeShape: 'single' }, { requires: {} }, { requires: { weaponType: ['staff'] } },
  { scaling: { passiveStatsPerLevel: { ...coefficients, coldDamagePct: 0.1 } } },
  { scaling: { passiveStatsPerLevel: { ...coefficients, typo: 0.1 } } },
  ...['damagePerLevel', 'cooldownPerLevel', 'costPerLevel'].map(key =>
    ({ scaling: { passiveStatsPerLevel: { ...coefficients }, [key]: 0 } })),
  { scaling: { passiveStatsPerLevel: { ...coefficients }, summonStatsPerLevel: { attack: 1 } } },
  { scaling: { passiveStatsPerLevel: { ...coefficients }, summonMaxCount: { kind: 'first-three-then-every-three' } } },
  { scaling: { passiveStatsPerLevel: { ...coefficients }, typo: 1 } },
  { typo: 1 }
];

describe('P07a05A exact Skeleton Mastery schema', () => {
  it('preserves authored passive/self tuning and authored unlock1 and cap20', () => {
    const row = authored();
    expect(validate(row)).toBe(true);
    expect(row).toMatchObject({ id: 'skills-necromancer-skeleton-mastery', trigger: 'passive',
      target: 'self', requiredLevel: 1, minLevel: 1, maxLevel: 20, cooldown: 0,
      scaling: { passiveStatsPerLevel: { ...coefficients } } });
    expect(row).not.toHaveProperty('cost');
    expect(row).not.toHaveProperty('damage');
  });

  it.each([
    { summonLifePct: 0, summonAttackPct: 0, summonDefensePct: 0 },
    { summonLifePct: 0.125, summonAttackPct: 0.375, summonDefensePct: 0.625 },
    { summonLifePct: 3, summonAttackPct: 4, summonDefensePct: 5 }
  ])('accepts alternate finite nonnegative coefficients without a balance ceiling %j', values => {
    expect(validate({ ...authored(), scaling: { passiveStatsPerLevel: values } })).toBe(true);
  });

  it('permits alternative positive integer unlock/cap and explicit passive classification', () => {
    expect(validate({ ...authored(), requiredLevel: 9, maxLevel: 31,
      passive: true, aura: false, summon: false })).toBe(true);
  });

  it.each(malformedRows)('rejects malformed exact Skeleton Mastery row %j', fields => {
    expect(validate({ ...authored(), ...fields })).toBe(false);
  });

  it('preserves every other currently authored Necromancer skill', () => {
    for (const row of necromancerSkills.filter(row => row.id !== 'skills-necromancer-skeleton-mastery')) {
      expect(validate(row), row.id).toBe(true);
    }
  });

  it('preserves neighboring exact player contracts and all authored Sorceress/Paladin/Barbarian rows', () => {
    for (const row of [...sorceressSkills, ...paladinSkills, ...barbarianSkills]) expect(validate(row), row.id).toBe(true);
  });

  it('does not impose the exact-player contract on a distinct passive identity', () => {
    expect(validate({ ...authored(), id: 'skills-other-summon-mastery', requiredLevel: undefined,
      scaling: undefined, cooldown: 1, cost: { mana: 1 } })).toBe(true);
  });
});

import { SKELETON_MASTERY_DEFINITION, resolveSkeletonMasteryDefinition, resolveSkeletonMasteryRank } from './skeleton-mastery';

describe('P07a05A independent immutable Skeleton Mastery definition', () => {
  it('copies current JSON unlock, cap and coefficient without mutating the source', () => {
    const before = structuredClone(necromancerSkills);
    expect(SKELETON_MASTERY_DEFINITION).toEqual({ requiredLevel: 1, maxRank: 20,
      summonLifePctPerRank: 0.04, summonAttackPctPerRank: 0.02, summonDefensePctPerRank: 0.01 });
    expect(Object.isFrozen(SKELETON_MASTERY_DEFINITION)).toBe(true);
    expect(resolveSkeletonMasteryDefinition(necromancerSkills)).toEqual(SKELETON_MASTERY_DEFINITION);
    expect(necromancerSkills).toEqual(before);
  });

  it('copies only primitives without retaining or freezing mutable caller input', () => {
    const row = authored();
    const before = structuredClone(row);
    const rows = [row];
    const result = resolveSkeletonMasteryDefinition(rows);
    expect(result).not.toBe(resolveSkeletonMasteryDefinition([row]));
    expect(Object.isFrozen(result)).toBe(true);
    expect(row).toEqual(before);
    expect(Object.isFrozen(rows)).toBe(false);
    expect(Object.isFrozen(row)).toBe(false);
    expect(Object.isFrozen(row.scaling.passiveStatsPerLevel)).toBe(false);
    row.requiredLevel = 99;
    row.maxLevel = 1;
    const mutableCoefficients = row.scaling.passiveStatsPerLevel;
    if (!mutableCoefficients) throw new Error('Missing authored Skeleton Mastery coefficients');
    mutableCoefficients.summonLifePct = 99;
    mutableCoefficients.summonAttackPct = 88;
    mutableCoefficients.summonDefensePct = 77;
    rows.push(authored());
    expect(result).toEqual({ requiredLevel: 1, maxRank: 20,
      summonLifePctPerRank: 0.04, summonAttackPctPerRank: 0.02, summonDefensePctPerRank: 0.01 });
    for (const key of ['requiredLevel', 'maxRank', 'summonLifePctPerRank', 'summonAttackPctPerRank', 'summonDefensePctPerRank']) {
      expect(Reflect.set(result, key, 99)).toBe(false);
    }
  });

  it.each([
    { summonLifePct: 0, summonAttackPct: 0, summonDefensePct: 0 },
    { summonLifePct: 0.125, summonAttackPct: 0.375, summonDefensePct: 0.625 },
    { summonLifePct: 3, summonAttackPct: 4, summonDefensePct: 5 }
  ])('copies distinct alternative coefficients, unlock and cap %j', values => {
    const row = { ...authored(), requiredLevel: 9, maxLevel: 31,
      scaling: { passiveStatsPerLevel: values } };
    const definition = resolveSkeletonMasteryDefinition([row]);
    expect(definition).toEqual({ requiredLevel: 9, maxRank: 31,
      summonLifePctPerRank: values.summonLifePct, summonAttackPctPerRank: values.summonAttackPct,
      summonDefensePctPerRank: values.summonDefensePct });
    expect(resolveSkeletonMasteryRank({ 'necromancer.skeleton_mastery': 99 }, definition)).toBe(31);
  });

  it('requires exactly one authored identity, never the canonical alias or another mastery', () => {
    for (const rows of [[], [null, 7, {}], [{ ...authored(), id: 'necromancer.skeleton_mastery' }],
      [{ ...authored(), id: 'skills-sorceress-fire-mastery' }], [authored(), authored()]]) {
      expect(() => resolveSkeletonMasteryDefinition(rows)).toThrow(/exactly one/);
    }
    expect(resolveSkeletonMasteryDefinition([null, 7, {}, { id: 'other' }, authored()]))
      .toEqual(SKELETON_MASTERY_DEFINITION);
  });

  it.each(malformedRows)('rejects malformed selected definition %j', fields => {
    expect(() => resolveSkeletonMasteryDefinition([{ ...authored(), ...fields }])).toThrow(/Skeleton Mastery/);
  });
});

const invalidRanks: readonly unknown[] = [0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true];
const levels = (value: unknown): Readonly<Record<string, number>> =>
  value as Readonly<Record<string, number>>;

describe('P07a05A allocated Skeleton Mastery rank, independent of eligibility or combo', () => {
  it.each(['skills-necromancer-skeleton-mastery', 'necromancer.skeleton_mastery'])('resolves exact alias %s', alias => {
    for (const rank of [1, 10, 20]) expect(resolveSkeletonMasteryRank({ [alias]: rank })).toBe(rank);
    expect(resolveSkeletonMasteryRank({ [alias]: 99 })).toBe(20);
  });

  it('takes the maximum once for both orders and duplicate allocations', () => {
    expect(resolveSkeletonMasteryRank({ 'skills-necromancer-skeleton-mastery': 2, 'necromancer.skeleton_mastery': 7 })).toBe(7);
    expect(resolveSkeletonMasteryRank({ 'necromancer.skeleton_mastery': 2, 'skills-necromancer-skeleton-mastery': 7 })).toBe(7);
    expect(resolveSkeletonMasteryRank({ 'skills-necromancer-skeleton-mastery': 20, 'necromancer.skeleton_mastery': 20 })).toBe(20);
    expect(resolveSkeletonMasteryRank({ 'skills-necromancer-skeleton-mastery': 99, 'necromancer.skeleton_mastery': 1 })).toBe(20);
  });

  it.each(invalidRanks)('ignores invalid allocation %s without suppressing a valid second alias', invalid => {
    expect(resolveSkeletonMasteryRank(levels({ 'skills-necromancer-skeleton-mastery': invalid, 'necromancer.skeleton_mastery': 3 }))).toBe(3);
    expect(resolveSkeletonMasteryRank(levels({ 'necromancer.skeleton_mastery': invalid, 'skills-necromancer-skeleton-mastery': 3 }))).toBe(3);
    expect(resolveSkeletonMasteryRank(levels({ 'skills-necromancer-skeleton-mastery': invalid }))).toBe(0);
    expect(resolveSkeletonMasteryRank(levels({ 'necromancer.skeleton_mastery': invalid }))).toBe(0);
  });

  it('does not mutate or require mutable allocation input', () => {
    const input = Object.freeze({ 'skills-necromancer-skeleton-mastery': 2, 'necromancer.skeleton_mastery': 7 });
    expect(resolveSkeletonMasteryRank(input)).toBe(7);
    expect(input).toEqual({ 'skills-necromancer-skeleton-mastery': 2, 'necromancer.skeleton_mastery': 7 });
  });

  it('never falls back to rank1 or accepts similar, nonexact identities', () => {
    expect(resolveSkeletonMasteryRank()).toBe(0);
    expect(resolveSkeletonMasteryRank({})).toBe(0);
    expect(resolveSkeletonMasteryRank({ 'necromancer.skeleton-mastery': 20, 'skills-necromancer-skeleton_mastery': 20,
      'skills-sorceress-fire-mastery': 20, 'mskill-skeleton-mastery': 20 })).toBe(0);
  });
});
