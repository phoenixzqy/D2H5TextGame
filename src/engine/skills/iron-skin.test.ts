import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import barbarianSkills from '../../data/skills/barbarian.json';
import skillSchema from '../../data/schema/skill.schema.json';
import sorceressSkills from '../../data/skills/sorceress.json';
import paladinSkills from '../../data/skills/paladin.json';

const authored = () => {
  const row = barbarianSkills.find(row => row.id === 'skills-barbarian-iron-skin');
  if (!row) throw new Error('Missing authored Iron Skin');
  return structuredClone(row);
};
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);

const malformedRows = [
  { requiredLevel: undefined },
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '18', null].map(requiredLevel => ({ requiredLevel })),
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '20', null].map(maxLevel => ({ maxLevel })),
  { scaling: undefined }, { scaling: {} }, { scaling: { passiveStatsPerLevel: {} } },
  ...[-0.01, NaN, Infinity, -Infinity, '0.04', null].map(defensePct =>
    ({ scaling: { passiveStatsPerLevel: { defensePct } } })),
  { trigger: 'active' }, { target: 'single-enemy' }, { passive: false },
  { aura: true }, { summon: true },
  ...[1, -1, NaN, Infinity, -Infinity, '0', null].map(cooldown => ({ cooldown })),
  { cost: {} }, { cost: { mana: 0 } }, { cost: { life: 0 } },
  { damage: { min: 1, max: 1, breakdown: { physical: 1 } } }, { damageType: 'physical' },
  { appliesStatus: [] }, { appliesStatus: ['burn'] }, { statusEffect: { chance: 1 } },
  { additionalStatusEffects: { freeze: { chance: 1 } } },
  { appliesTags: ['fire'] }, { synergies: { fire: 1.2 } },
  { heal: { min: 1, max: 1, target: 'self' } }, { summonId: 'skeleton' },
  { aoeShape: 'single' }, { requires: {} }, { requires: { weaponType: ['staff'] } },
  { scaling: { passiveStatsPerLevel: { defensePct: 0.04, coldDamagePct: 0.1 } } },
  { scaling: { passiveStatsPerLevel: { defensePct: 0.04, typo: 0.1 } } },
  ...['damagePerLevel', 'cooldownPerLevel', 'costPerLevel'].map(key =>
    ({ scaling: { passiveStatsPerLevel: { defensePct: 0.04 }, [key]: 0 } })),
  { scaling: { passiveStatsPerLevel: { defensePct: 0.04 }, summonStatsPerLevel: { attack: 1 } } },
  { scaling: { passiveStatsPerLevel: { defensePct: 0.04 }, summonMaxCount: { kind: 'first-three-then-every-three' } } },
  { scaling: { passiveStatsPerLevel: { defensePct: 0.04 }, typo: 1 } },
  { typo: 1 }
];

describe('P07a04A exact Iron Skin schema', () => {
  it('preserves authored passive/self tuning and authoritative unlock18 over legacy minLevel1', () => {
    const row = authored();
    expect(validate(row)).toBe(true);
    expect(row).toMatchObject({ id: 'skills-barbarian-iron-skin', trigger: 'passive',
      target: 'self', requiredLevel: 18, minLevel: 1, maxLevel: 20, cooldown: 0,
      scaling: { passiveStatsPerLevel: { defensePct: 0.04 } } });
    expect(row).not.toHaveProperty('cost');
    expect(row).not.toHaveProperty('damage');
  });

  it.each([0, 0.125, 3])('accepts finite nonnegative defense coefficient %s without a balance ceiling', defensePct => {
    expect(validate({ ...authored(), scaling: { passiveStatsPerLevel: { defensePct } } })).toBe(true);
  });

  it('permits alternative positive integer unlock/cap and explicit passive classification', () => {
    expect(validate({ ...authored(), requiredLevel: 9, maxLevel: 31,
      passive: true, aura: false, summon: false })).toBe(true);
  });

  it.each(malformedRows)('rejects malformed exact Iron Skin row %j', fields => {
    expect(validate({ ...authored(), ...fields })).toBe(false);
  });

  it('preserves every other currently authored Barbarian skill', () => {
    for (const row of barbarianSkills.filter(row => row.id !== 'skills-barbarian-iron-skin')) {
      expect(validate(row), row.id).toBe(true);
    }
  });

  it('preserves neighboring exact player contracts and all authored Sorceress/Paladin rows', () => {
    for (const row of [...sorceressSkills, ...paladinSkills]) expect(validate(row), row.id).toBe(true);
  });

  it('does not impose the exact-player contract on a distinct passive identity', () => {
    expect(validate({ ...authored(), id: 'skills-other-defense', requiredLevel: undefined,
      scaling: undefined, cooldown: 1, cost: { mana: 1 } })).toBe(true);
  });
});

import { IRON_SKIN_DEFINITION, resolveIronSkinDefinition, resolveIronSkinRank } from './iron-skin';

describe('P07a04A independent immutable Iron Skin definition', () => {
  it('copies current JSON unlock, cap and coefficient without mutating the source', () => {
    const before = structuredClone(barbarianSkills);
    expect(IRON_SKIN_DEFINITION).toEqual({ requiredLevel: 18, maxRank: 20, defensePctPerRank: 0.04 });
    expect(Object.isFrozen(IRON_SKIN_DEFINITION)).toBe(true);
    expect(resolveIronSkinDefinition(barbarianSkills)).toEqual(IRON_SKIN_DEFINITION);
    expect(barbarianSkills).toEqual(before);
  });

  it('copies only primitives without retaining or freezing mutable caller input', () => {
    const row = authored();
    const before = structuredClone(row);
    const result = resolveIronSkinDefinition([row]);
    expect(result).not.toBe(resolveIronSkinDefinition([row]));
    expect(Object.isFrozen(result)).toBe(true);
    expect(row).toEqual(before);
    expect(Object.isFrozen(row)).toBe(false);
    expect(Object.isFrozen(row.scaling.passiveStatsPerLevel)).toBe(false);
    row.requiredLevel = 1;
    row.maxLevel = 1;
    row.scaling.passiveStatsPerLevel = { defensePct: 99 };
    expect(result).toEqual({ requiredLevel: 18, maxRank: 20, defensePctPerRank: 0.04 });
    for (const key of ['requiredLevel', 'maxRank', 'defensePctPerRank']) {
      expect(Reflect.set(result, key, 99)).toBe(false);
    }
  });

  it.each([0, 0.125, 3])('reads alternate valid JSON coefficient %s, unlock and rank cap', defensePct => {
    const row = { ...authored(), requiredLevel: 9, maxLevel: 31,
      scaling: { passiveStatsPerLevel: { defensePct } } };
    const definition = resolveIronSkinDefinition([row]);
    expect(definition).toEqual({ requiredLevel: 9, maxRank: 31, defensePctPerRank: defensePct });
    expect(resolveIronSkinRank({ 'barbarian.iron_skin': 99 }, definition)).toBe(31);
  });

  it('requires exactly one authored identity, never the canonical alias or another mastery', () => {
    for (const rows of [[], [null, 7, {}], [{ ...authored(), id: 'barbarian.iron_skin' }],
      [{ ...authored(), id: 'skills-sorceress-fire-mastery' }], [authored(), authored()]]) {
      expect(() => resolveIronSkinDefinition(rows)).toThrow(/exactly one/);
    }
    expect(resolveIronSkinDefinition([null, 7, {}, { id: 'other' }, authored()]))
      .toEqual(IRON_SKIN_DEFINITION);
  });

  it.each(malformedRows)('rejects malformed selected definition %j', fields => {
    expect(() => resolveIronSkinDefinition([{ ...authored(), ...fields }])).toThrow(/Iron Skin/);
  });
});

const invalidRanks: readonly unknown[] = [0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true];
const levels = (value: unknown): Readonly<Record<string, number>> =>
  value as Readonly<Record<string, number>>;

describe('P07a04A allocated Iron Skin rank, independent of eligibility or combo', () => {
  it.each(['skills-barbarian-iron-skin', 'barbarian.iron_skin'])('resolves exact alias %s', alias => {
    for (const rank of [1, 10, 20]) expect(resolveIronSkinRank({ [alias]: rank })).toBe(rank);
    expect(resolveIronSkinRank({ [alias]: 99 })).toBe(20);
  });

  it('takes the maximum once for both orders and duplicate allocations', () => {
    expect(resolveIronSkinRank({ 'skills-barbarian-iron-skin': 2, 'barbarian.iron_skin': 7 })).toBe(7);
    expect(resolveIronSkinRank({ 'barbarian.iron_skin': 2, 'skills-barbarian-iron-skin': 7 })).toBe(7);
    expect(resolveIronSkinRank({ 'skills-barbarian-iron-skin': 20, 'barbarian.iron_skin': 20 })).toBe(20);
    expect(resolveIronSkinRank({ 'skills-barbarian-iron-skin': 99, 'barbarian.iron_skin': 1 })).toBe(20);
  });

  it.each(invalidRanks)('ignores invalid allocation %s without suppressing a valid second alias', invalid => {
    expect(resolveIronSkinRank(levels({ 'skills-barbarian-iron-skin': invalid, 'barbarian.iron_skin': 3 }))).toBe(3);
    expect(resolveIronSkinRank(levels({ 'barbarian.iron_skin': invalid, 'skills-barbarian-iron-skin': 3 }))).toBe(3);
    expect(resolveIronSkinRank(levels({ 'skills-barbarian-iron-skin': invalid }))).toBe(0);
    expect(resolveIronSkinRank(levels({ 'barbarian.iron_skin': invalid }))).toBe(0);
  });

  it('does not mutate or require mutable allocation input', () => {
    const input = Object.freeze({ 'skills-barbarian-iron-skin': 2, 'barbarian.iron_skin': 7 });
    expect(resolveIronSkinRank(input)).toBe(7);
    expect(input).toEqual({ 'skills-barbarian-iron-skin': 2, 'barbarian.iron_skin': 7 });
  });

  it('never falls back to rank1 or accepts similar, nonexact identities', () => {
    expect(resolveIronSkinRank()).toBe(0);
    expect(resolveIronSkinRank({})).toBe(0);
    expect(resolveIronSkinRank({ 'barbarian.iron-skin': 20, 'skills-barbarian-iron_skin': 20,
      'skills-sorceress-fire-mastery': 20, 'mskill-iron-skin': 20 })).toBe(0);
  });
});
