import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import paladinSkills from '../../data/skills/paladin.json';
import skillSchema from '../../data/schema/skill.schema.json';

const authored = () => {
  const row = paladinSkills.find(row => row.id === 'skills-paladin-might');
  if (!row) throw new Error('Missing authored Might');
  return structuredClone(row);
};
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);
const coefficients = { physicalDamagePct: 0.03, attackPct: 0.01 };
const malformedRows = [
  { requiredLevel: undefined },
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '1', null].map(requiredLevel => ({ requiredLevel })),
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '20', null].map(maxLevel => ({ maxLevel })),
  { scaling: undefined }, { scaling: {} }, { scaling: { passiveStatsPerLevel: {} } },
  { scaling: { passiveStatsPerLevel: { attackPct: 0.01 } } },
  { scaling: { passiveStatsPerLevel: { physicalDamagePct: 0.03 } } },
  ...['physicalDamagePct', 'attackPct'].flatMap(key =>
    [-0.01, NaN, Infinity, -Infinity, '0.03', null].map(value =>
      ({ scaling: { passiveStatsPerLevel: { ...coefficients, [key]: value } } }))),
  { trigger: 'active' }, { target: 'all-allies' }, { passive: false },
  { aura: undefined }, { aura: false }, { summon: true },
  ...[1, -1, NaN, Infinity, -Infinity, '0', null].map(cooldown => ({ cooldown })),
  { cost: {} }, { cost: { mana: 0 } }, { cost: { life: 0 } },
  { damage: { min: 1, max: 1, breakdown: { physical: 1 } } }, { damageType: 'physical' },
  { appliesStatus: [] }, { appliesStatus: ['stun'] }, { statusEffect: { chance: 1 } },
  { additionalStatusEffects: { freeze: { chance: 1 } } },
  { appliesTags: ['physical'] }, { synergies: { physical: 1.2 } },
  { heal: { min: 1, max: 1, target: 'self' } }, { summonId: 'skeleton' },
  { aoeShape: 'single' }, { requires: {} }, { requires: { weaponType: ['sword'] } },
  { scaling: { passiveStatsPerLevel: { ...coefficients, fireDamagePct: 0.1 } } },
  { scaling: { passiveStatsPerLevel: { ...coefficients, typo: 0.1 } } },
  ...['damagePerLevel', 'cooldownPerLevel', 'costPerLevel'].map(key =>
    ({ scaling: { passiveStatsPerLevel: coefficients, [key]: 0 } })),
  { scaling: { passiveStatsPerLevel: coefficients, summonStatsPerLevel: { attack: 1 } } },
  { scaling: { passiveStatsPerLevel: coefficients, summonMaxCount: { kind: 'first-three-then-every-three' } } },
  { scaling: { passiveStatsPerLevel: coefficients, typo: 1 } }, { typo: 1 }
];

describe('P07b02A exact player Might schema', () => {
  it('preserves authored unlock1/cap20 and both distinct coefficients without selecting an aura', () => {
    const row = authored();
    expect(validate(row)).toBe(true);
    expect(row).toMatchObject({ id: 'skills-paladin-might', requiredLevel: 1, minLevel: 1,
      maxLevel: 20, trigger: 'passive', aura: true, target: 'self', cooldown: 0,
      scaling: { passiveStatsPerLevel: coefficients } });
    expect(row).not.toHaveProperty('cost');
    expect(row).not.toHaveProperty('damage');
  });

  it.each([0, 0.125, 3])('accepts each finite nonnegative coefficient %s independently without a tuning ceiling', value => {
    for (const key of ['physicalDamagePct', 'attackPct']) {
      expect(validate({ ...authored(), scaling: { passiveStatsPerLevel: { ...coefficients, [key]: value } } })).toBe(true);
    }
  });

  it('accepts alternate positive integer unlock/cap with explicit passive and nonsummon classification', () => {
    expect(validate({ ...authored(), requiredLevel: 9, maxLevel: 31,
      passive: true, summon: false })).toBe(true);
  });

  it.each(malformedRows)('rejects malformed exact player Might row %j', fields => {
    expect(validate({ ...authored(), ...fields })).toBe(false);
  });

  it('preserves every other authored Paladin skill including distinct aura metadata', () => {
    for (const row of paladinSkills.filter(row => row.id !== 'skills-paladin-might')) {
      expect(validate(row), row.id).toBe(true);
    }
  });

  it('does not impose player Might restrictions on a distinct mercenary identity', () => {
    expect(validate({ ...authored(), id: 'aura-might', aura: false, requiredLevel: undefined,
      scaling: undefined, cooldown: 1, cost: { mana: 1 } })).toBe(true);
  });
});

import { MIGHT_DEFINITION, resolveMightDefinition, resolveMightRank } from './might';

describe('P07b02A independent immutable player Might definition', () => {
  it('copies authored two-coefficient tuning and leaves the full source unchanged', () => {
    const before = structuredClone(paladinSkills);
    expect(MIGHT_DEFINITION).toEqual({ requiredLevel: 1, maxRank: 20,
      physicalDamagePctPerRank: 0.03, attackPctPerRank: 0.01 });
    expect(Object.isFrozen(MIGHT_DEFINITION)).toBe(true);
    expect(resolveMightDefinition(paladinSkills)).toEqual(MIGHT_DEFINITION);
    expect(paladinSkills).toEqual(before);
  });

  it('returns independent frozen primitives without retaining or freezing caller rows', () => {
    const row = authored();
    const before = structuredClone(row);
    const result = resolveMightDefinition([row]);
    expect(result).not.toBe(resolveMightDefinition([row]));
    expect(Object.isFrozen(result)).toBe(true);
    expect(row).toEqual(before);
    expect(Object.isFrozen(row)).toBe(false);
    expect(Object.isFrozen(row.scaling.passiveStatsPerLevel)).toBe(false);
    row.requiredLevel = 9;
    row.maxLevel = 31;
    row.scaling.passiveStatsPerLevel = { physicalDamagePct: 99, attackPct: 99 };
    expect(result).toEqual(MIGHT_DEFINITION);
    for (const key of ['requiredLevel', 'maxRank', 'physicalDamagePctPerRank', 'attackPctPerRank']) {
      expect(Reflect.set(result, key, 99)).toBe(false);
    }
  });

  it.each([0, 0.125, 3])('copies each alternate valid coefficient %s, unlock and cap independently', value => {
    for (const key of ['physicalDamagePct', 'attackPct']) {
      const values = { ...coefficients, [key]: value };
      const definition = resolveMightDefinition([{ ...authored(), requiredLevel: 9, maxLevel: 31,
        scaling: { passiveStatsPerLevel: values } }]);
      expect(definition).toEqual({ requiredLevel: 9, maxRank: 31,
        physicalDamagePctPerRank: values.physicalDamagePct, attackPctPerRank: values.attackPct });
      expect(resolveMightRank({ 'paladin.might': 99 }, definition)).toBe(31);
    }
  });

  it('selects exactly one authored player identity, never canonical-only or mercenary identities', () => {
    for (const rows of [[], [null, 7, {}], [{ ...authored(), id: 'paladin.might' }],
      [{ ...authored(), id: 'aura-might' }], [authored(), authored()]]) {
      expect(() => resolveMightDefinition(rows)).toThrow(/exactly one/);
    }
    expect(resolveMightDefinition([null, 7, {}, { id: 'other' }, authored()])).toEqual(MIGHT_DEFINITION);
  });

  it.each(malformedRows)('rejects malformed selected Might definition %j', fields => {
    expect(() => resolveMightDefinition([{ ...authored(), ...fields }])).toThrow(/Might/);
  });
});

const invalidRanks: readonly unknown[] = [0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true];
const levels = (value: unknown): Readonly<Record<string, number>> => value as Readonly<Record<string, number>>;

describe('P07b02A allocation-only Might rank independent of selection and eligibility', () => {
  it.each(['skills-paladin-might', 'paladin.might'])('resolves exact alias %s and clamps once', alias => {
    for (const rank of [1, 10, 20]) expect(resolveMightRank({ [alias]: rank })).toBe(rank);
    expect(resolveMightRank({ [alias]: 99 })).toBe(20);
  });

  it('takes the maximum valid alias once regardless of insertion order or duplicate allocations', () => {
    expect(resolveMightRank({ 'skills-paladin-might': 2, 'paladin.might': 7 })).toBe(7);
    expect(resolveMightRank({ 'paladin.might': 2, 'skills-paladin-might': 7 })).toBe(7);
    expect(resolveMightRank({ 'skills-paladin-might': 20, 'paladin.might': 20 })).toBe(20);
    expect(resolveMightRank({ 'skills-paladin-might': 99, 'paladin.might': 1 })).toBe(20);
  });

  it.each(invalidRanks)('ignores invalid allocation %s while preserving a valid alternate alias', invalid => {
    expect(resolveMightRank(levels({ 'skills-paladin-might': invalid, 'paladin.might': 3 }))).toBe(3);
    expect(resolveMightRank(levels({ 'paladin.might': invalid, 'skills-paladin-might': 3 }))).toBe(3);
    expect(resolveMightRank(levels({ 'skills-paladin-might': invalid }))).toBe(0);
    expect(resolveMightRank(levels({ 'paladin.might': invalid }))).toBe(0);
  });

  it('never infers rank1 or accepts a mercenary, marker, selected field or similar alias', () => {
    expect(resolveMightRank()).toBe(0);
    expect(resolveMightRank({})).toBe(0);
    expect(resolveMightRank({ 'paladin-might': 20, 'skills-paladin.might': 20,
      'aura-might': 20, 'might': 20, 'selectedAuraId': 20, 'skills-paladin-holy-fire': 20 })).toBe(0);
  });
});
