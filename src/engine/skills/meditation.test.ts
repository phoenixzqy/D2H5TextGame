import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import paladinSkills from '../../data/skills/paladin.json';
import skillSchema from '../../data/schema/skill.schema.json';
import sorceressSkills from '../../data/skills/sorceress.json';
import necromancerSkills from '../../data/skills/necromancer.json';
import barbarianSkills from '../../data/skills/barbarian.json';
import amazonSkills from '../../data/skills/amazon.json';
import assassinSkills from '../../data/skills/assassin.json';
import druidSkills from '../../data/skills/druid.json';
import mercenarySkills from '../../data/skills/mercenary.json';
import monsterSkills from '../../data/skills/monsters.json';

const authored = () => {
  const row = paladinSkills.find(row => row.id === 'skills-paladin-meditation');
  if (!row) throw new Error('Missing authored Meditation');
  return structuredClone(row);
};
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);
const malformedRows = [
  { requiredLevel: undefined },
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '24', null].map(requiredLevel => ({ requiredLevel })),
  { maxLevel: undefined },
  ...[0, -1, 1.5, NaN, Infinity, -Infinity, '20', null].map(maxLevel => ({ maxLevel })),
  { scaling: undefined }, { scaling: {} }, { scaling: { passiveStatsPerLevel: {} } },
  ...[-0.01, NaN, Infinity, -Infinity, '0.03', null].map(value =>
    ({ scaling: { passiveStatsPerLevel: { manaRegenPct: value } } })),
  { aura: undefined }, { aura: false }, { trigger: 'active' }, { target: 'single-enemy' },
  { passive: false }, { summon: true },
  ...[1, -1, NaN, Infinity, -Infinity, '0', null].map(cooldown => ({ cooldown })),
  { cost: {} }, { cost: { mana: 0 } }, { cost: { life: 0 } },
  { damage: { min: 1, max: 1, breakdown: { physical: 1 } } }, { damageType: 'physical' },
  { appliesStatus: [] }, { appliesStatus: ['burn'] }, { statusEffect: { chance: 1 } },
  { additionalStatusEffects: { freeze: { chance: 1 } } },
  { appliesTags: [] }, { appliesTags: ['fire'] }, { synergies: {} }, { synergies: { fire: 1.2 } },
  { heal: { min: 1, max: 1, target: 'self' } }, { summonId: 'skeleton' },
  { aoeShape: 'single' }, { requires: {} }, { requires: { weaponType: ['staff'] } },
  { scaling: { passiveStatsPerLevel: { manaRegenPct: 0.03, lifeRegenPct: 0.1 } } },
  { scaling: { passiveStatsPerLevel: { manaRegenPct: 0.03, typo: 0.1 } } },
  ...['damagePerLevel', 'cooldownPerLevel', 'costPerLevel'].map(key =>
    ({ scaling: { passiveStatsPerLevel: { manaRegenPct: 0.03 }, [key]: 0 } })),
  { scaling: { passiveStatsPerLevel: { manaRegenPct: 0.03 }, summonStatsPerLevel: { attack: 1 } } },
  { scaling: { passiveStatsPerLevel: { manaRegenPct: 0.03 }, summonMaxCount: { kind: 'first-three-then-every-three' } } },
  { scaling: { passiveStatsPerLevel: { manaRegenPct: 0.03 }, typo: 1 } },
  { typo: 1 }
];

describe('P07b03A exact player Meditation schema', () => {
  it('preserves authored unlock24, Cleansing prerequisite, cap20 and aura coefficient.03', () => {
    const row = authored();
    expect(validate(row)).toBe(true);
    expect(row).toMatchObject({ id: 'skills-paladin-meditation', aura: true, trigger: 'passive',
      target: 'self', requiredLevel: 24, prerequisites: ['skills-paladin-cleansing'],
      minLevel: 1, maxLevel: 20, cooldown: 0, scaling: { passiveStatsPerLevel: { manaRegenPct: 0.03 } } });
    expect(row).not.toHaveProperty('cost'); expect(row).not.toHaveProperty('damage');
  });

  it.each([0, 0.125, 3, Number.MAX_VALUE])('accepts alternate finite nonnegative coefficient %s without a balance ceiling', coefficient => {
    expect(validate({ ...authored(), scaling: { passiveStatsPerLevel: { manaRegenPct: coefficient } } })).toBe(true);
  });

  it('permits alternate positive integer unlock/cap and optional passive classification', () => {
    expect(validate({ ...authored(), requiredLevel: 9, maxLevel: 31, passive: true, summon: false })).toBe(true);
  });

  it.each(malformedRows)('rejects malformed exact Meditation row %j', fields => {
    expect(validate({ ...authored(), ...fields })).toBe(false);
  });

  it('preserves every authored row across all seven classes, mercenaries and monsters', () => {
    for (const row of [...paladinSkills, ...sorceressSkills, ...necromancerSkills, ...barbarianSkills,
      ...amazonSkills, ...assassinSkills, ...druidSkills, ...mercenarySkills, ...monsterSkills]) {
      expect(validate(row), row.id).toBe(true);
    }
  });

  it('does not impose the exact player contract on another aura identity', () => {
    expect(validate({ ...authored(), id: 'mskill-aura-meditation', requiredLevel: undefined,
      scaling: undefined, cooldown: 1, cost: { mana: 1 } })).toBe(true);
  });
});

import { MEDITATION_DEFINITION, resolveMeditationDefinition, resolveMeditationRank,
  resolveEligibleMeditationRank } from './meditation';

describe('P07b03A independent immutable Meditation definition', () => {
  it('copies authored tuning without mutating the full source or selecting an aura', () => {
    const before = structuredClone(paladinSkills);
    expect(MEDITATION_DEFINITION).toEqual({ requiredLevel: 24, maxRank: 20, manaRegenPctPerRank: 0.03 });
    expect(Object.isFrozen(MEDITATION_DEFINITION)).toBe(true);
    expect(resolveMeditationDefinition(paladinSkills)).toEqual(MEDITATION_DEFINITION);
    expect(paladinSkills).toEqual(before);
  });

  it('returns independently frozen primitives without retaining or freezing caller rows', () => {
    const row = authored(); const before = structuredClone(row);
    const values = row.scaling.passiveStatsPerLevel;
    if (!values) throw new Error('Missing authored Meditation coefficient');
    const definition = resolveMeditationDefinition([row]);
    expect(definition).not.toBe(resolveMeditationDefinition([row]));
    expect(Object.isFrozen(definition)).toBe(true);
    expect(row).toEqual(before); expect(Object.isFrozen(row)).toBe(false);
    expect(Object.isFrozen(values)).toBe(false);
    row.requiredLevel = 9; row.maxLevel = 31; values.manaRegenPct = 99;
    expect(definition).toEqual({ requiredLevel: 24, maxRank: 20, manaRegenPctPerRank: 0.03 });
    for (const key of ['requiredLevel', 'maxRank', 'manaRegenPctPerRank']) {
      expect(Reflect.set(definition, key, 99)).toBe(false);
    }
  });

  it.each([0, 0.125, 3, Number.MAX_VALUE])('copies finite alternate coefficient %s with independent unlock/cap', coefficient => {
    const definition = resolveMeditationDefinition([{ ...authored(), requiredLevel: 9, maxLevel: 31,
      scaling: { passiveStatsPerLevel: { manaRegenPct: coefficient } } }]);
    expect(definition).toEqual({ requiredLevel: 9, maxRank: 31, manaRegenPctPerRank: coefficient });
    expect(resolveMeditationRank({ 'paladin.meditation': 99 }, definition)).toBe(31);
  });

  it('requires exactly one authored player identity, excluding canonical and distinct aura identities', () => {
    for (const rows of [[], [null, 7, {}], [{ ...authored(), id: 'paladin.meditation' }],
      [{ ...authored(), id: 'mskill-aura-meditation' }], [authored(), authored()],
      [authored(), { id: 'skills-paladin-meditation' }]]) {
      expect(() => resolveMeditationDefinition(rows)).toThrow(/exactly one/);
    }
    expect(resolveMeditationDefinition([null, 7, {}, { id: 'other' }, authored()])).toEqual(MEDITATION_DEFINITION);
  });

  it.each(malformedRows)('rejects malformed selected Meditation definition %j', fields => {
    expect(() => resolveMeditationDefinition([{ ...authored(), ...fields }])).toThrow(/Meditation/);
  });
});

const invalidRanks: readonly unknown[] = [0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true];
const levels = (value: unknown): Readonly<Record<string, number>> => value as Readonly<Record<string, number>>;

describe('P07b03A Meditation allocation independent of selection and eligibility', () => {
  it.each(['skills-paladin-meditation', 'paladin.meditation'])('resolves exact alias %s and clamps once', alias => {
    for (const rank of [1, 2, 11, 20]) expect(resolveMeditationRank({ [alias]: rank })).toBe(rank);
    expect(resolveMeditationRank({ [alias]: 99 })).toBe(20);
  });

  it('takes the maximum valid alias once, independent of insertion order and duplicate allocations', () => {
    expect(resolveMeditationRank({ 'skills-paladin-meditation': 2, 'paladin.meditation': 7 })).toBe(7);
    expect(resolveMeditationRank({ 'paladin.meditation': 2, 'skills-paladin-meditation': 7 })).toBe(7);
    expect(resolveMeditationRank({ 'paladin.meditation': 20, 'skills-paladin-meditation': 20 })).toBe(20);
    expect(resolveMeditationRank({ 'skills-paladin-meditation': 99, 'paladin.meditation': 1 })).toBe(20);
  });

  it.each(invalidRanks)('ignores invalid allocation %s while preserving a valid alternate alias', invalid => {
    expect(resolveMeditationRank(levels({ 'skills-paladin-meditation': invalid, 'paladin.meditation': 3 }))).toBe(3);
    expect(resolveMeditationRank(levels({ 'paladin.meditation': invalid, 'skills-paladin-meditation': 3 }))).toBe(3);
    expect(resolveMeditationRank(levels({ 'skills-paladin-meditation': invalid }))).toBe(0);
    expect(resolveMeditationRank(levels({ 'paladin.meditation': invalid }))).toBe(0);
  });

  it('never defaults to rank1 or infers a marker, selection field, other aura or similar identity', () => {
    expect(resolveMeditationRank()).toBe(0); expect(resolveMeditationRank({})).toBe(0);
    expect(resolveMeditationRank({ 'paladin-meditation': 20, 'skills-paladin.meditation': 20,
      'mskill-aura-meditation': 20, 'meditation': 20, 'selectedAuraId': 20, 'paladin.might': 20,
      'skills-paladin-cleansing': 20 })).toBe(0);
  });
});

describe('P07b03A shared Meditation class and level eligibility', () => {
  const player = { class: 'paladin', level: 24, skillLevels: { 'paladin.meditation': 2 } };
  it.each(['sorceress', 'amazon', 'necromancer', 'barbarian', 'druid', 'assassin', 'Paladin', ''])('rejects exact wrong class %s', cls => {
    expect(resolveEligibleMeditationRank({ ...player, class: cls })).toBe(0);
  });
  it.each([NaN, Infinity, -Infinity, -1, 0, 1, 23, 23.9])('rejects nonfinite or below-unlock level %s', level => {
    expect(resolveEligibleMeditationRank({ ...player, level })).toBe(0);
  });

  it('requires allocated rank independently of class, marker, legacy skills and combo', () => {
    expect(resolveEligibleMeditationRank({ class: 'paladin', level: 30 })).toBe(0);
    expect(resolveEligibleMeditationRank({ ...player, skillLevels: {} })).toBe(0);
    for (const rank of [0, -1, 1.5, NaN, Infinity]) {
      expect(resolveEligibleMeditationRank({ ...player, skillLevels: { 'paladin.meditation': rank } })).toBe(0);
    }
    const legacyOnly = { ...player, skillLevels: { 'mskill-aura-meditation': 20 },
      selectedAuraId: 'paladin.meditation', skills: ['skills-paladin-meditation'], combo: ['skills-paladin-meditation'] };
    expect(resolveEligibleMeditationRank(legacyOnly)).toBe(0);
  });

  it.each(['paladin.meditation', 'skills-paladin-meditation'])('accepts allocation alias %s at unlock with no runtime Cleansing prerequisite or selection', id => {
    expect(resolveEligibleMeditationRank({ ...player, skillLevels: { [id]: 1 } })).toBe(1);
    expect(resolveEligibleMeditationRank({ ...player, skillLevels: { [id]: 99 } })).toBe(20);
    expect(resolveEligibleMeditationRank({ ...player, level: 24.5, skillLevels: { [id]: 2 } })).toBe(2);
  });

  it('uses copied authored unlock/cap while leaving allocation independent of eligibility', () => {
    const definition = resolveMeditationDefinition([{ ...authored(), requiredLevel: 7, maxLevel: 3 }]);
    expect(resolveEligibleMeditationRank({ ...player, level: 6 }, definition)).toBe(0);
    expect(resolveEligibleMeditationRank({ ...player, level: 7,
      skillLevels: { 'paladin.meditation': 9, 'skills-paladin-meditation': 1 } }, definition)).toBe(3);
    expect(resolveMeditationRank(player.skillLevels, definition)).toBe(2);
  });
});


import { activeMeditationAura, composeMeditationAura } from './meditation';
import type { CombatUnit } from '../combat/types';
function encounterUnit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 100, mana: 50,
    stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}

const selectedSource = () => ({ id: 'hero', class: 'paladin' as const, level: 24,
  selectedAuraId: 'paladin.meditation' as const, skillLevels: { 'paladin.meditation': 11 } });
const meditationProjection = () => ({ selectedAuraId: 'paladin.meditation' as const,
  sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank: 11, maxRank: 20,
  sourceBaselinePerSecond: 4, manaRegenPctPerRank: 0.03 });
function encounter() {
  return new Map<string, CombatUnit>([['hero', encounterUnit('hero', 'player')],
    ['merc', { ...encounterUnit('merc', 'player'), kind: 'merc' }],
    ['bench', { ...encounterUnit('bench', 'player'), kind: 'merc' }],
    ['enemy', encounterUnit('enemy', 'enemy')],
    ['summon', { ...encounterUnit('summon', 'player'), kind: 'summon', summon: true }]]);
}
function requiredEncounterUnit(units: ReadonlyMap<string, CombatUnit>, id: string): CombatUnit {
  const unit = units.get(id);
  if (!unit) throw new Error(`Missing test unit ${id}`);
  return unit;
}
describe('immutable exact-factor Meditation wave projection and encounter eligibility', () => {
  it('copies authored factors and numeric adapter authority without computing a rate', () => {
    const source = selectedSource(); const original = structuredClone(source);
    const tuning = { requiredLevel: 24, maxRank: 31, manaRegenPctPerRank: 0.125 };
    const aura = composeMeditationAura(source, 1.4000000000000001, 'merc', tuning);
    expect(aura).toEqual({ ...meditationProjection(), maxRank: 31,
      sourceBaselinePerSecond: 1.4000000000000001, manaRegenPctPerRank: 0.125 });
    expect(Object.isFrozen(aura)).toBe(true); expect(source).toEqual(original);
    source.skillLevels['paladin.meditation'] = 20; tuning.manaRegenPctPerRank = 9;
    expect(aura?.rank).toBe(11); expect(aura?.manaRegenPctPerRank).toBe(0.125);
    expect(Object.keys(aura ?? {}).sort()).toEqual(['selectedAuraId', 'sourceHeroId', 'fieldedMercCombatId',
      'rank', 'maxRank', 'sourceBaselinePerSecond', 'manaRegenPctPerRank'].sort());
  });
  it.each([undefined, 'hero', ''])('omits absent/self/empty mercenary identity%s', mercId => {
    expect(composeMeditationAura(selectedSource(), 4, mercId)).not.toHaveProperty('fieldedMercCombatId');
  });
  it('never projects an absent selection or Might selection', () => {
    const { selectedAuraId: _selection, ...none } = selectedSource();
    expect(composeMeditationAura(none, 4)).toBeUndefined();
    expect(composeMeditationAura({ ...selectedSource(), selectedAuraId: 'paladin.might' }, 4)).toBeUndefined();
  });
  it.each([{ class: 'sorceress' as const }, { level: 23 }, { skillLevels: {} }])('independent ineligibility%j suppresses projection', patch => {
    expect(composeMeditationAura({ ...selectedSource(), ...patch }, 4)).toBeUndefined();
  });
  it('qualifies only source hero and original fielded merc, without letting CC suppress either', () => {
    const units = encounter(); const aura = meditationProjection();
    for (const id of ['hero', 'merc']) {
      units.set(id, { ...requiredEncounterUnit(units, id), statuses: [{ id: 'stun', sourceId: 'enemy', stacks: 1, remaining: -1 }] });
      expect(activeMeditationAura(aura, id, units)).toBe(aura);
    }
    for (const id of ['bench', 'enemy', 'summon', 'missing']) expect(activeMeditationAura(aura, id, units)).toBeUndefined();
  });
  it.each([{ life: 0 }, { life: NaN }, { side: 'enemy' as const }, { kind: 'merc' as const },
    { id: 'other' }, { summon: true }, { ownerId: 'other' }, { summonOwnerId: 'other' }])(
    'invalid source%j suppresses every recipient', patch => {
      const units = encounter(); units.set('hero', { ...requiredEncounterUnit(units, 'hero'), ...patch });
      for (const id of ['hero', 'merc']) expect(activeMeditationAura(meditationProjection(), id, units)).toBeUndefined();
    });
  it.each([{ life: 0 }, { life: Infinity }, { side: 'enemy' as const }, { kind: 'hero' as const },
    { id: 'replacement' }, { summon: true }, { ownerId: 'hero' }, { summonOwnerId: 'hero' }])(
    'invalid merc recipient%j does not suppress the source hero', patch => {
      const units = encounter(); units.set('merc', { ...requiredEncounterUnit(units, 'merc'), ...patch });
      const aura = meditationProjection();
      expect(activeMeditationAura(aura, 'merc', units)).toBeUndefined();
      expect(activeMeditationAura(aura, 'hero', units)).toBe(aura);
    });
  it.each([{ rank: 0 }, { rank: 1.5 }, { rank: 21 }, { rank: NaN }, { maxRank: 0 },
    { sourceBaselinePerSecond: -1 }, { sourceBaselinePerSecond: Infinity }, { sourceBaselinePerSecond: NaN },
    { manaRegenPctPerRank: -1 }, { manaRegenPctPerRank: Infinity }, { manaRegenPctPerRank: NaN }])(
    'refuses malformed projection%j', patch => {
      expect(activeMeditationAura({ ...meditationProjection(), ...patch }, 'hero', encounter())).toBeUndefined();
    });
  it.each([{ sourceBaselinePerSecond: 0 }, { manaRegenPctPerRank: 0 }])('accepts inactive zero tuning%j without fallback', patch => {
    const aura = { ...meditationProjection(), ...patch };
    expect(activeMeditationAura(aura, 'hero', encounter())).toBe(aura);
  });
});
