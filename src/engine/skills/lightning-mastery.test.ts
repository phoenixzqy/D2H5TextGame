import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import sorceressSkills from '../../data/skills/sorceress.json';
import skillSchema from '../../data/schema/skill.schema.json';

const authored = () => {
  const row = sorceressSkills.find(row => row.id === 'skills-sorceress-lightning-mastery');
  if (!row) throw new Error('Missing authored Lightning Mastery');
  return structuredClone(row);
};
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);

const malformedRows = [
  { requiredLevel: undefined },
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '30', null].map(requiredLevel => ({ requiredLevel })),
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '20', null].map(maxLevel => ({ maxLevel })),
  { scaling: undefined }, { scaling: {} }, { scaling: { passiveStatsPerLevel: {} } },
  ...[-0.01, NaN, Infinity, -Infinity, '0.04', null].map(lightningDamagePct =>
    ({ scaling: { passiveStatsPerLevel: { lightningDamagePct } } })),
  { trigger: 'active' }, { target: 'single-enemy' }, { passive: false },
  { aura: true }, { summon: true },
  ...[1, -1, NaN, Infinity, -Infinity, '0', null].map(cooldown => ({ cooldown })),
  { cost: {} }, { cost: { mana: 0 } }, { cost: { life: 0 } },
  { damage: { min: 1, max: 1, breakdown: { lightning: 1 } } }, { damageType: 'lightning' },
  { appliesStatus: [] }, { appliesStatus: ['burn'] }, { statusEffect: { chance: 1 } },
  { additionalStatusEffects: { freeze: { chance: 1 } } },
  { appliesTags: ['fire'] }, { synergies: { fire: 1.2 } },
  { heal: { min: 1, max: 1, target: 'self' } }, { summonId: 'skeleton' },
  { aoeShape: 'single' }, { requires: {} }, { requires: { weaponType: ['staff'] } },
  { scaling: { passiveStatsPerLevel: { lightningDamagePct: 0.04, coldDamagePct: 0.1 } } },
  { scaling: { passiveStatsPerLevel: { lightningDamagePct: 0.04, typo: 0.1 } } },
  ...['damagePerLevel', 'cooldownPerLevel', 'costPerLevel'].map(key =>
    ({ scaling: { passiveStatsPerLevel: { lightningDamagePct: 0.04 }, [key]: 0 } })),
  { scaling: { passiveStatsPerLevel: { lightningDamagePct: 0.04 }, summonStatsPerLevel: { attack: 1 } } },
  { scaling: { passiveStatsPerLevel: { lightningDamagePct: 0.04 }, summonMaxCount: { kind: 'first-three-then-every-three' } } },
  { scaling: { passiveStatsPerLevel: { lightningDamagePct: 0.04 }, typo: 1 } },
  { typo: 1 }
];

describe('P07a03A exact Lightning Mastery schema', () => {
  it('preserves authored passive/self tuning and authoritative unlock30 over legacy minLevel12', () => {
    const row = authored();
    expect(validate(row)).toBe(true);
    expect(row).toMatchObject({ id: 'skills-sorceress-lightning-mastery', trigger: 'passive',
      target: 'self', requiredLevel: 30, minLevel: 12, maxLevel: 20, cooldown: 0,
      scaling: { passiveStatsPerLevel: { lightningDamagePct: 0.04 } } });
    expect(row).not.toHaveProperty('cost');
    expect(row).not.toHaveProperty('damage');
  });

  it.each([0, 0.125, 3])('accepts finite nonnegative lightning coefficient %s without a balance ceiling', lightningDamagePct => {
    expect(validate({ ...authored(), scaling: { passiveStatsPerLevel: { lightningDamagePct } } })).toBe(true);
  });

  it('permits alternative positive integer unlock/cap and explicit passive classification', () => {
    expect(validate({ ...authored(), requiredLevel: 9, maxLevel: 31,
      passive: true, aura: false, summon: false })).toBe(true);
  });

  it.each(malformedRows)('rejects malformed exact Lightning Mastery row %j', fields => {
    expect(validate({ ...authored(), ...fields })).toBe(false);
  });

  it('preserves every other currently authored Sorceress skill', () => {
    for (const row of sorceressSkills.filter(row => row.id !== 'skills-sorceress-lightning-mastery')) {
      expect(validate(row), row.id).toBe(true);
    }
  });

  it('does not impose the exact-player contract on a distinct passive identity', () => {
    expect(validate({ ...authored(), id: 'skills-other-mastery', requiredLevel: undefined,
      scaling: undefined, cooldown: 1, cost: { mana: 1 } })).toBe(true);
  });
});

import { LIGHTNING_MASTERY_DEFINITION, resolveLightningMasteryDefinition, resolveLightningMasteryRank } from './lightning-mastery';

describe('P07a03A independent immutable Lightning Mastery definition', () => {
  it('copies current JSON unlock, cap and coefficient without mutating the source', () => {
    const before = structuredClone(sorceressSkills);
    expect(LIGHTNING_MASTERY_DEFINITION).toEqual({ requiredLevel: 30, maxRank: 20, lightningDamagePctPerRank: 0.04 });
    expect(Object.isFrozen(LIGHTNING_MASTERY_DEFINITION)).toBe(true);
    expect(resolveLightningMasteryDefinition(sorceressSkills)).toEqual(LIGHTNING_MASTERY_DEFINITION);
    expect(sorceressSkills).toEqual(before);
  });

  it('copies only primitives without retaining or freezing mutable caller input', () => {
    const row = authored();
    const before = structuredClone(row);
    const result = resolveLightningMasteryDefinition([row]);
    expect(result).not.toBe(resolveLightningMasteryDefinition([row]));
    expect(Object.isFrozen(result)).toBe(true);
    expect(row).toEqual(before);
    expect(Object.isFrozen(row)).toBe(false);
    expect(Object.isFrozen(row.scaling.passiveStatsPerLevel)).toBe(false);
    row.requiredLevel = 1;
    row.maxLevel = 1;
    row.scaling.passiveStatsPerLevel = { lightningDamagePct: 99 };
    expect(result).toEqual({ requiredLevel: 30, maxRank: 20, lightningDamagePctPerRank: 0.04 });
    for (const key of ['requiredLevel', 'maxRank', 'lightningDamagePctPerRank']) {
      expect(Reflect.set(result, key, 99)).toBe(false);
    }
  });

  it.each([0, 0.125, 3])('reads alternate valid JSON coefficient %s, unlock and rank cap', lightningDamagePct => {
    const row = { ...authored(), requiredLevel: 9, maxLevel: 31,
      scaling: { passiveStatsPerLevel: { lightningDamagePct } } };
    const definition = resolveLightningMasteryDefinition([row]);
    expect(definition).toEqual({ requiredLevel: 9, maxRank: 31, lightningDamagePctPerRank: lightningDamagePct });
    expect(resolveLightningMasteryRank({ 'sorceress.lightning_mastery': 99 }, definition)).toBe(31);
  });

  it('requires exactly one authored identity, never the canonical alias or another mastery', () => {
    for (const rows of [[], [null, 7, {}], [{ ...authored(), id: 'sorceress.lightning_mastery' }],
      [{ ...authored(), id: 'skills-sorceress-fire-mastery' }], [authored(), authored()]]) {
      expect(() => resolveLightningMasteryDefinition(rows)).toThrow(/exactly one/);
    }
    expect(resolveLightningMasteryDefinition([null, 7, {}, { id: 'other' }, authored()]))
      .toEqual(LIGHTNING_MASTERY_DEFINITION);
  });

  it.each(malformedRows)('rejects malformed selected definition %j', fields => {
    expect(() => resolveLightningMasteryDefinition([{ ...authored(), ...fields }])).toThrow(/Lightning Mastery/);
  });
});

const invalidRanks: readonly unknown[] = [0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true];
const levels = (value: unknown): Readonly<Record<string, number>> =>
  value as Readonly<Record<string, number>>;

describe('P07a03A allocated Lightning Mastery rank, independent of eligibility or combo', () => {
  it.each(['skills-sorceress-lightning-mastery', 'sorceress.lightning_mastery'])('resolves exact alias %s', alias => {
    for (const rank of [1, 10, 20]) expect(resolveLightningMasteryRank({ [alias]: rank })).toBe(rank);
    expect(resolveLightningMasteryRank({ [alias]: 99 })).toBe(20);
  });

  it('takes the maximum once for both orders and duplicate allocations', () => {
    expect(resolveLightningMasteryRank({ 'skills-sorceress-lightning-mastery': 2, 'sorceress.lightning_mastery': 7 })).toBe(7);
    expect(resolveLightningMasteryRank({ 'sorceress.lightning_mastery': 2, 'skills-sorceress-lightning-mastery': 7 })).toBe(7);
    expect(resolveLightningMasteryRank({ 'skills-sorceress-lightning-mastery': 20, 'sorceress.lightning_mastery': 20 })).toBe(20);
    expect(resolveLightningMasteryRank({ 'skills-sorceress-lightning-mastery': 99, 'sorceress.lightning_mastery': 1 })).toBe(20);
  });

  it.each(invalidRanks)('ignores invalid allocation %s without suppressing a valid second alias', invalid => {
    expect(resolveLightningMasteryRank(levels({ 'skills-sorceress-lightning-mastery': invalid, 'sorceress.lightning_mastery': 3 }))).toBe(3);
    expect(resolveLightningMasteryRank(levels({ 'sorceress.lightning_mastery': invalid, 'skills-sorceress-lightning-mastery': 3 }))).toBe(3);
    expect(resolveLightningMasteryRank(levels({ 'skills-sorceress-lightning-mastery': invalid }))).toBe(0);
    expect(resolveLightningMasteryRank(levels({ 'sorceress.lightning_mastery': invalid }))).toBe(0);
  });

  it('never falls back to rank1 or accepts similar, nonexact identities', () => {
    expect(resolveLightningMasteryRank()).toBe(0);
    expect(resolveLightningMasteryRank({})).toBe(0);
    expect(resolveLightningMasteryRank({ 'sorceress.lightning-mastery': 20, 'skills-sorceress-lightning_mastery': 20,
      'skills-sorceress-fire-mastery': 20, 'mskill-lightning-mastery': 20 })).toBe(0);
  });
});
