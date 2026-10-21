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

import { MIGHT_DEFINITION, resolveMightDefinition, resolveMightRank, resolveEligibleMightRank } from './might';

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


describe('shared player Might eligibility independent of selection', () => {
  const player = { class: 'paladin', level: 1, skillLevels: { 'paladin.might': 2 } };
  it.each(['sorceress', 'amazon', 'necromancer', 'barbarian', 'druid', 'assassin', 'Paladin', ''])('rejects exact wrong class %s', cls => {
    expect(resolveEligibleMightRank({ ...player, class: cls })).toBe(0);
  });
  it.each([NaN, Infinity, -Infinity, -1, 0])('rejects nonfinite or below-unlock level %s', level => {
    expect(resolveEligibleMightRank({ ...player, level })).toBe(0);
  });
  it('requires allocated rank independently of class and marker ownership', () => {
    expect(resolveEligibleMightRank({ class: 'paladin', level: 30 })).toBe(0);
    expect(resolveEligibleMightRank({ ...player, skillLevels: {} })).toBe(0);
    for (const rank of [0, -1, 1.5, NaN, Infinity]) {
      expect(resolveEligibleMightRank({ ...player, skillLevels: { 'paladin.might': rank } })).toBe(0);
    }
    expect(resolveEligibleMightRank({ ...player, skillLevels: { 'aura-might': 20 } })).toBe(0);
  });
  it.each(['paladin.might', 'skills-paladin-might'])('accepts allocation alias %s at unlock and clamps cap', id => {
    expect(resolveEligibleMightRank({ ...player, skillLevels: { [id]: 1 } })).toBe(1);
    expect(resolveEligibleMightRank({ ...player, skillLevels: { [id]: 99 } })).toBe(20);
  });
  it('uses copied authored unlock/cap without changing the allocation-only resolver', () => {
    const definition = resolveMightDefinition([{ ...authored(), requiredLevel: 7, maxLevel: 3 }]);
    expect(resolveEligibleMightRank({ ...player, level: 6 }, definition)).toBe(0);
    expect(resolveEligibleMightRank({ ...player, level: 7,
      skillLevels: { 'paladin.might': 9, 'skills-paladin-might': 1 } }, definition)).toBe(3);
    expect(resolveMightRank(player.skillLevels, definition)).toBe(2);
  });
});

import { composeMightAura, activeMightAura, type MightAuraProjection } from './might';
import type { CombatUnit } from '../combat/types';

const selectedHero = { id: 'hero', class: 'paladin' as const, level: 1,
  selectedAuraId: 'paladin.might' as const, skillLevels: { 'paladin.might': 20 } };
function auraUnit(id: string, kind: NonNullable<CombatUnit['kind']> = 'hero'): CombatUnit {
  return { id, name: id, side: 'player', kind, level: 1, tier: 'trash', life: 1, mana: 0,
    stats: { life: 1, lifeMax: 1, mana: 0, manaMax: 0, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function composed(): MightAuraProjection {
  const result = composeMightAura(selectedHero, 'merc-fielded');
  if (!result) throw new Error('Missing selected fixture aura');
  return result;
}
describe('Might frozen wave composition and live recipient lookup', () => {
  it('copies only immutable primitives and both independent authored potencies', () => {
    const levels = { 'paladin.might': 20 }; const input = { ...selectedHero, skillLevels: levels };
    const original = structuredClone(input); const result = composeMightAura(input, 'merc-fielded');
    expect(result).toEqual({ selectedAuraId: 'paladin.might', sourceHeroId: 'hero', fieldedMercCombatId: 'merc-fielded',
      rank: 20, maxRank: 20, physicalDamagePct: 0.6, attackPct: 0.2 });
    expect(Object.isFrozen(result)).toBe(true); expect(input).toEqual(original);
    levels['paladin.might'] = 1;
    expect(result?.rank).toBe(20); expect(result?.physicalDamagePct).toBe(0.6); expect(result?.attackPct).toBe(0.2);
  });
  it('requires explicit canonical selection independently of eligibility and allocation', () => {
    const { selectedAuraId: _selection, ...none } = selectedHero;
    expect(composeMightAura(none)).toBeUndefined();
    expect(composeMightAura({ ...selectedHero, class: 'sorceress' })).toBeUndefined();
    expect(composeMightAura({ ...selectedHero, level: 0 })).toBeUndefined();
    expect(composeMightAura({ ...selectedHero, skillLevels: {} })).toBeUndefined();
    expect(composeMightAura({ ...selectedHero, skillLevels: { 'aura-might': 20 } })).toBeUndefined();
  });
  it('uses max exact allocated aliases and copied definition coefficients without retaining maps', () => {
    const definition = { requiredLevel: 7, maxRank: 3, physicalDamagePctPerRank: .125, attackPctPerRank: .5 };
    const input = { ...selectedHero, level: 7, skillLevels: { 'skills-paladin-might': 9, 'paladin.might': 2 } };
    expect(composeMightAura(input, undefined, definition)).toEqual({ selectedAuraId: 'paladin.might', sourceHeroId: 'hero',
      rank: 3, maxRank: 3, physicalDamagePct: .375, attackPct: 1.5 });
    expect(composeMightAura({ ...input, level: 6 }, undefined, definition)).toBeUndefined();
  });
  it.each([undefined, '', 'hero'])('never infers an explicit fielded merc for %s', mercId => {
    expect(composeMightAura(selectedHero, mercId)).not.toHaveProperty('fieldedMercCombatId');
  });
  it('resolves CURRENT source and recipient identities on every lookup without mutating maps or units', () => {
    const aura = composed(); const hero = auraUnit('hero'); const merc = auraUnit('merc-fielded', 'merc');
    const units = new Map([[hero.id, hero], [merc.id, merc]]); const before = structuredClone(units);
    expect(activeMightAura(aura, 'hero', units)).toBe(aura);
    expect(activeMightAura(aura, merc.id, units)).toBe(aura); expect(units).toEqual(before);
    // Replacing an immutable encounter unit must immediately suppress the frozen potency.
    units.set(hero.id, { ...hero, life: 0 });
    expect(activeMightAura(aura, merc.id, units)).toBeUndefined();
    units.set(hero.id, { ...hero, life: -1 });
    expect(activeMightAura(aura, merc.id, units)).toBeUndefined();
    units.delete(hero.id); expect(activeMightAura(aura, merc.id, units)).toBeUndefined();
    units.set(hero.id, hero); expect(activeMightAura(aura, merc.id, units)).toBe(aura);
    units.set(merc.id, { ...merc, life: 0 }); expect(activeMightAura(aura, merc.id, units)).toBeUndefined();
    units.delete(merc.id); expect(activeMightAura(aura, merc.id, units)).toBeUndefined();
  });
  it.each(['stun', 'freeze'])('ignores source %s and never reads encounter skill levels for frozen potency', id => {
    const aura = composed(); const hero = { ...auraUnit('hero'), skillLevels: { 'paladin.might': 0 },
      statuses: [{ id, sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    expect(activeMightAura(aura, 'merc-fielded', new Map([['hero', hero], ['merc-fielded', auraUnit('merc-fielded', 'merc')]])))
      .toBe(aura);
  });
  const excluded: readonly Partial<CombatUnit>[] = [
    { side: 'enemy' }, { kind: 'summon' }, { kind: 'monster' }, { summon: true },
    { ownerId: 'hero' }, { summonOwnerId: 'hero' }, { life: 0 }, { life: -1 }
  ];
  it.each(excluded)('excludes malformed/wrong-side/dead source %#', patch => {
    const aura = composed(); const hero = { ...auraUnit('hero'), ...patch };
    expect(activeMightAura(aura, 'merc-fielded', new Map([['hero', hero], ['merc-fielded', auraUnit('merc-fielded', 'merc')]])))
      .toBeUndefined();
  });
  it.each(excluded)('excludes malformed/wrong-side/dead explicit merc recipient %#', patch => {
    const aura = composed(); const merc = { ...auraUnit('merc-fielded', 'merc'), ...patch };
    expect(activeMightAura(aura, merc.id, new Map([['hero', auraUnit('hero')], [merc.id, merc]]))).toBeUndefined();
  });
  it('excludes unlisted mercs, hero-shaped non-source recipients and missing projections', () => {
    const aura = composed(); const units = new Map([['hero', auraUnit('hero')],
      ['bench', auraUnit('bench', 'merc')], ['other-hero', auraUnit('other-hero')], ['merc-fielded', auraUnit('merc-fielded')]]);
    for (const id of ['bench', 'other-hero', 'merc-fielded', 'missing']) expect(activeMightAura(aura, id, units)).toBeUndefined();
    expect(activeMightAura(undefined, 'hero', units)).toBeUndefined();
  });
  it.each([{ rank: 0 }, { rank: 1.5 }, { rank: 21 }, { rank: Infinity },
    { physicalDamagePct: -1 }, { physicalDamagePct: NaN }, { physicalDamagePct: Infinity },
    { attackPct: -1 }, { attackPct: NaN }, { attackPct: Infinity }])('suppresses invalid frozen potency %#', patch => {
    const aura = composed();
    expect(activeMightAura({ ...aura, ...patch }, 'hero', new Map([['hero', auraUnit('hero')]]))).toBeUndefined();
  });
  it('keeps a valid alternate authored cap31/rank31 active and checks the copied cap', () => {
    const definition = { ...MIGHT_DEFINITION, maxRank: 31 };
    const aura = composeMightAura({ ...selectedHero, skillLevels: { 'paladin.might': 31 } }, undefined, definition);
    expect(aura).toMatchObject({ rank: 31, maxRank: 31, physicalDamagePct: .9299999999999999, attackPct: .31 });
    const units = new Map([['hero', auraUnit('hero')]]);
    expect(activeMightAura(aura, 'hero', units)).toBe(aura);
    if (!aura) throw new Error('Missing alternate-cap aura');
    expect(activeMightAura({ ...aura, rank: 32 }, 'hero', units)).toBeUndefined();
    expect(activeMightAura({ ...aura, maxRank: 30 }, 'hero', units)).toBeUndefined();
  });
  it.each([0, -1, 1.5, NaN, Infinity, -Infinity])('suppresses malformed copied cap %s', maxRank => {
    expect(activeMightAura({ ...composed(), maxRank }, 'hero', new Map([['hero', auraUnit('hero')]]))).toBeUndefined();
  });
  it('accepts finite nonnegative authored potency without inventing a tuning ceiling', () => {
    const aura = composed(); const units = new Map([['hero', auraUnit('hero')]]);
    for (const value of [0, 3]) {
      const alternate = { ...aura, physicalDamagePct: value, attackPct: value };
      expect(activeMightAura(alternate, 'hero', units)).toBe(alternate);
    }
  });
});
