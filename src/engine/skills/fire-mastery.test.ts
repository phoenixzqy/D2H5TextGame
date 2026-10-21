import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import sorceressSkills from '../../data/skills/sorceress.json';
import skillSchema from '../../data/schema/skill.schema.json';

const authored = () => {
  const row = sorceressSkills.find(row => row.id === 'skills-sorceress-fire-mastery');
  if (!row) throw new Error('Missing authored Fire Mastery');
  return structuredClone(row);
};
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);

const malformedRows = [
  { requiredLevel: undefined },
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '30', null].map(requiredLevel => ({ requiredLevel })),
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '20', null].map(maxLevel => ({ maxLevel })),
  { scaling: undefined }, { scaling: {} }, { scaling: { passiveStatsPerLevel: {} } },
  ...[-0.01, NaN, Infinity, -Infinity, '0.04', null].map(fireDamagePct =>
    ({ scaling: { passiveStatsPerLevel: { fireDamagePct } } })),
  { trigger: 'active' }, { target: 'single-enemy' }, { passive: false },
  { aura: true }, { summon: true },
  ...[1, -1, NaN, Infinity, -Infinity, '0', null].map(cooldown => ({ cooldown })),
  { cost: {} }, { cost: { mana: 0 } }, { cost: { life: 0 } },
  { damage: { min: 1, max: 1, breakdown: { fire: 1 } } }, { damageType: 'fire' },
  { appliesStatus: [] }, { appliesStatus: ['burn'] }, { statusEffect: { chance: 1 } },
  { additionalStatusEffects: { freeze: { chance: 1 } } },
  { appliesTags: ['fire'] }, { synergies: { fire: 1.2 } },
  { heal: { min: 1, max: 1, target: 'self' } }, { summonId: 'skeleton' },
  { aoeShape: 'single' }, { requires: {} }, { requires: { weaponType: ['staff'] } },
  { scaling: { passiveStatsPerLevel: { fireDamagePct: 0.04, coldDamagePct: 0.1 } } },
  { scaling: { passiveStatsPerLevel: { fireDamagePct: 0.04, typo: 0.1 } } },
  ...['damagePerLevel', 'cooldownPerLevel', 'costPerLevel'].map(key =>
    ({ scaling: { passiveStatsPerLevel: { fireDamagePct: 0.04 }, [key]: 0 } })),
  { scaling: { passiveStatsPerLevel: { fireDamagePct: 0.04 }, summonStatsPerLevel: { attack: 1 } } },
  { scaling: { passiveStatsPerLevel: { fireDamagePct: 0.04 }, summonMaxCount: { kind: 'first-three-then-every-three' } } },
  { scaling: { passiveStatsPerLevel: { fireDamagePct: 0.04 }, typo: 1 } },
  { typo: 1 }
];

describe('P07a02A exact Fire Mastery schema', () => {
  it('preserves authored passive/self tuning and authoritative unlock30 over legacy minLevel12', () => {
    const row = authored();
    expect(validate(row)).toBe(true);
    expect(row).toMatchObject({ id: 'skills-sorceress-fire-mastery', trigger: 'passive',
      target: 'self', requiredLevel: 30, minLevel: 12, maxLevel: 20, cooldown: 0,
      scaling: { passiveStatsPerLevel: { fireDamagePct: 0.04 } } });
    expect(row).not.toHaveProperty('cost');
    expect(row).not.toHaveProperty('damage');
  });

  it.each([0, 0.125, 3])('accepts finite nonnegative fire coefficient %s without a balance ceiling', fireDamagePct => {
    expect(validate({ ...authored(), scaling: { passiveStatsPerLevel: { fireDamagePct } } })).toBe(true);
  });

  it('permits alternative positive integer unlock/cap and explicit passive classification', () => {
    expect(validate({ ...authored(), requiredLevel: 9, maxLevel: 31,
      passive: true, aura: false, summon: false })).toBe(true);
  });

  it.each(malformedRows)('rejects malformed exact Fire Mastery row %j', fields => {
    expect(validate({ ...authored(), ...fields })).toBe(false);
  });

  it('preserves every other currently authored Sorceress skill', () => {
    for (const row of sorceressSkills.filter(row => row.id !== 'skills-sorceress-fire-mastery')) {
      expect(validate(row), row.id).toBe(true);
    }
  });

  it('does not impose the exact-player contract on a distinct passive identity', () => {
    expect(validate({ ...authored(), id: 'skills-other-mastery', requiredLevel: undefined,
      scaling: undefined, cooldown: 1, cost: { mana: 1 } })).toBe(true);
  });
});

import { FIRE_MASTERY_DEFINITION, resolveFireMasteryDefinition, resolveFireMasteryRank } from './fire-mastery';

describe('P07a02A independent immutable Fire Mastery definition', () => {
  it('copies current JSON unlock, cap and coefficient without mutating the source', () => {
    const before = structuredClone(sorceressSkills);
    expect(FIRE_MASTERY_DEFINITION).toEqual({ requiredLevel: 30, maxRank: 20, fireDamagePctPerRank: 0.04 });
    expect(Object.isFrozen(FIRE_MASTERY_DEFINITION)).toBe(true);
    expect(resolveFireMasteryDefinition(sorceressSkills)).toEqual(FIRE_MASTERY_DEFINITION);
    expect(sorceressSkills).toEqual(before);
  });

  it('copies only primitives without retaining or freezing mutable caller input', () => {
    const row = authored();
    const before = structuredClone(row);
    const result = resolveFireMasteryDefinition([row]);
    expect(result).not.toBe(resolveFireMasteryDefinition([row]));
    expect(Object.isFrozen(result)).toBe(true);
    expect(row).toEqual(before);
    expect(Object.isFrozen(row)).toBe(false);
    expect(Object.isFrozen(row.scaling.passiveStatsPerLevel)).toBe(false);
    row.requiredLevel = 1;
    row.maxLevel = 1;
    row.scaling.passiveStatsPerLevel = { fireDamagePct: 99 };
    expect(result).toEqual({ requiredLevel: 30, maxRank: 20, fireDamagePctPerRank: 0.04 });
    for (const key of ['requiredLevel', 'maxRank', 'fireDamagePctPerRank']) {
      expect(Reflect.set(result, key, 99)).toBe(false);
    }
  });

  it.each([0, 0.125, 3])('reads alternate valid JSON coefficient %s, unlock and rank cap', fireDamagePct => {
    const row = { ...authored(), requiredLevel: 9, maxLevel: 31,
      scaling: { passiveStatsPerLevel: { fireDamagePct } } };
    const definition = resolveFireMasteryDefinition([row]);
    expect(definition).toEqual({ requiredLevel: 9, maxRank: 31, fireDamagePctPerRank: fireDamagePct });
    expect(resolveFireMasteryRank({ 'sorceress.fire_mastery': 99 }, definition)).toBe(31);
  });

  it('requires exactly one authored identity, never the canonical alias or another mastery', () => {
    for (const rows of [[], [null, 7, {}], [{ ...authored(), id: 'sorceress.fire_mastery' }],
      [{ ...authored(), id: 'skills-sorceress-lightning-mastery' }], [authored(), authored()]]) {
      expect(() => resolveFireMasteryDefinition(rows)).toThrow(/exactly one/);
    }
    expect(resolveFireMasteryDefinition([null, 7, {}, { id: 'other' }, authored()]))
      .toEqual(FIRE_MASTERY_DEFINITION);
  });

  it.each(malformedRows)('rejects malformed selected definition %j', fields => {
    expect(() => resolveFireMasteryDefinition([{ ...authored(), ...fields }])).toThrow(/Fire Mastery/);
  });
});

const invalidRanks: readonly unknown[] = [0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true];
const levels = (value: unknown): Readonly<Record<string, number>> =>
  value as Readonly<Record<string, number>>;

describe('P07a02A allocated Fire Mastery rank, independent of eligibility or combo', () => {
  it.each(['skills-sorceress-fire-mastery', 'sorceress.fire_mastery'])('resolves exact alias %s', alias => {
    for (const rank of [1, 10, 20]) expect(resolveFireMasteryRank({ [alias]: rank })).toBe(rank);
    expect(resolveFireMasteryRank({ [alias]: 99 })).toBe(20);
  });

  it('takes the maximum once for both orders and duplicate allocations', () => {
    expect(resolveFireMasteryRank({ 'skills-sorceress-fire-mastery': 2, 'sorceress.fire_mastery': 7 })).toBe(7);
    expect(resolveFireMasteryRank({ 'sorceress.fire_mastery': 2, 'skills-sorceress-fire-mastery': 7 })).toBe(7);
    expect(resolveFireMasteryRank({ 'skills-sorceress-fire-mastery': 20, 'sorceress.fire_mastery': 20 })).toBe(20);
    expect(resolveFireMasteryRank({ 'skills-sorceress-fire-mastery': 99, 'sorceress.fire_mastery': 1 })).toBe(20);
  });

  it.each(invalidRanks)('ignores invalid allocation %s without suppressing a valid second alias', invalid => {
    expect(resolveFireMasteryRank(levels({ 'skills-sorceress-fire-mastery': invalid, 'sorceress.fire_mastery': 3 }))).toBe(3);
    expect(resolveFireMasteryRank(levels({ 'sorceress.fire_mastery': invalid, 'skills-sorceress-fire-mastery': 3 }))).toBe(3);
    expect(resolveFireMasteryRank(levels({ 'skills-sorceress-fire-mastery': invalid }))).toBe(0);
    expect(resolveFireMasteryRank(levels({ 'sorceress.fire_mastery': invalid }))).toBe(0);
  });

  it('never falls back to rank1 or accepts similar, nonexact identities', () => {
    expect(resolveFireMasteryRank()).toBe(0);
    expect(resolveFireMasteryRank({})).toBe(0);
    expect(resolveFireMasteryRank({ 'sorceress.fire-mastery': 20, 'skills-sorceress-fire_mastery': 20,
      'skills-sorceress-lightning-mastery': 20, 'mskill-fire-mastery': 20 })).toBe(0);
  });
});
