import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import sorceressSkills from '../../data/skills/sorceress.json';
import skillSchema from '../../data/schema/skill.schema.json';

const authored = () => {
  const row = sorceressSkills.find(row => row.id === 'skills-sorceress-frozen-armor');
  if (!row) throw new Error('Missing authored player Frozen Armor');
  return structuredClone(row);
};
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);

describe('P07b01 exact player Frozen Armor schema', () => {
  it('preserves the current authored tuning and active self identity', () => {
    const row = authored();
    expect(validate(row)).toBe(true);
    expect(row).toMatchObject({ id: 'skills-sorceress-frozen-armor', trigger: 'active',
      target: 'self', requiredLevel: 1, minLevel: 1, maxLevel: 20,
      cooldown: 4, cost: { mana: 7 }, appliesStatus: ['frozen-armor'],
      scaling: { cooldownPerLevel: -0.05, costPerLevel: -0.1,
        passiveStatsPerLevel: { defensePct: 0.03 } } });
  });

  it.each([0, 0.125, 3])('permits finite nonnegative defense coefficient %s', defensePct => {
    const row = authored();
    row.scaling.passiveStatsPerLevel = { defensePct };
    expect(validate(row)).toBe(true);
  });

  it('permits alternative valid authored cap, cost and cooldown tuning', () => {
    const row = { ...authored(), maxLevel: 31, cooldown: 0.5, cost: { mana: 0 } };
    expect(validate(row)).toBe(true);
  });

  it.each([
    { scaling: undefined }, { scaling: {} }, { scaling: { passiveStatsPerLevel: {} } },
    ...[-0.01, NaN, Infinity, -Infinity, '0.03', null].map(defensePct =>
      ({ scaling: { passiveStatsPerLevel: { defensePct } } })),
    { cost: undefined }, { cost: {} },
    ...[-1, NaN, Infinity, '7', null].map(mana => ({ cost: { mana } })),
    ...[0, -1, 1.5, NaN, Infinity, '20', null].map(maxLevel => ({ maxLevel })),
    { trigger: 'passive' }, { target: 'single-enemy' }, { passive: true },
    { aura: true }, { summon: true },
    { scaling: { passiveStatsPerLevel: { defensePct: 0.03, manaRegenPct: 0.1 } } },
    { cooldown: 0 }, { cooldown: Infinity },
    { appliesStatus: undefined }, { appliesStatus: [] }, { appliesStatus: ['chill'] },
    { appliesStatus: ['frozen-armor', 'chill'] },
    { damage: { min: 1, max: 1, breakdown: { cold: 1 } } }, { damageType: 'cold' }
  ])('rejects malformed exact player row %j', fields => {
    expect(validate({ ...authored(), ...fields })).toBe(false);
  });

  it('does not impose player Frozen Armor requirements on a distinct skill', () => {
    const row = { ...authored(), id: 'fixture-other-frozen-armor', scaling: undefined, cost: undefined,
      appliesStatus: ['merc-frozen-armor'] };
    expect(validate(row)).toBe(true);
  });
});

import { FROZEN_ARMOR_DEFINITION, resolveFrozenArmorDefinition, resolveFrozenArmorRank } from './frozen-armor';

describe('P07b01 immutable authored player Frozen Armor definition', () => {
  it('copies current JSON coefficient and cap into frozen primitive values', () => {
    const before = structuredClone(sorceressSkills);
    expect(FROZEN_ARMOR_DEFINITION).toEqual({ maxRank: 20, defensePctPerRank: 0.03 });
    expect(Object.isFrozen(FROZEN_ARMOR_DEFINITION)).toBe(true);
    expect(resolveFrozenArmorDefinition(sorceressSkills)).toEqual(FROZEN_ARMOR_DEFINITION);
    expect(sorceressSkills).toEqual(before);
  });

  it('copies independently without retaining or freezing caller data', () => {
    const row = authored();
    const before = structuredClone(row);
    const result = resolveFrozenArmorDefinition([row]);
    expect(result).not.toBe(resolveFrozenArmorDefinition([row]));
    expect(Object.isFrozen(result)).toBe(true);
    expect(row).toEqual(before);
    expect(Object.isFrozen(row)).toBe(false);
    expect(Object.isFrozen(row.scaling.passiveStatsPerLevel)).toBe(false);
    row.maxLevel = 1;
    row.scaling.passiveStatsPerLevel = { defensePct: 99 };
    expect(result).toEqual({ maxRank: 20, defensePctPerRank: 0.03 });
    expect(Reflect.set(result, 'maxRank', 99)).toBe(false);
    expect(Reflect.set(result, 'defensePctPerRank', 99)).toBe(false);
  });

  it.each([0, 0.125, 3])('consumes alternate valid JSON coefficient %s and cap', defensePct => {
    const row = authored();
    row.maxLevel = 31;
    row.scaling.passiveStatsPerLevel = { defensePct };
    const definition = resolveFrozenArmorDefinition([row]);
    expect(definition).toEqual({ maxRank: 31, defensePctPerRank: defensePct });
    expect(resolveFrozenArmorRank({ 'sorceress.frozen_armor': 40 }, definition)).toBe(31);
  });

  it('selects exactly one authored identity and ignores unknown rows', () => {
    for (const rows of [[], [null, 7, {}], [{ ...authored(), id: 'mskill-frozen-armor' }],
      [{ ...authored(), id: 'sorceress.frozen_armor' }], [authored(), authored()]]) {
      expect(() => resolveFrozenArmorDefinition(rows)).toThrow(/exactly one/);
    }
    expect(resolveFrozenArmorDefinition([null, 7, {}, { id: 'mskill-frozen-armor' }, authored()]))
      .toEqual(FROZEN_ARMOR_DEFINITION);
  });

  it.each([
    { scaling: undefined }, { scaling: {} }, { scaling: { passiveStatsPerLevel: {} } },
    { scaling: { passiveStatsPerLevel: { defensePct: -1 } } },
    { scaling: { passiveStatsPerLevel: { defensePct: Infinity } } },
    { trigger: 'passive' }, { target: 'single-enemy' }, { maxLevel: 0 },
    { appliesStatus: ['chill'] }, { cost: {} }
  ])('rejects malformed selected row %j', fields => {
    expect(() => resolveFrozenArmorDefinition([{ ...authored(), ...fields }])).toThrow(/Frozen Armor/);
  });
});

describe('P07b01 allocated Frozen Armor rank shared by engine and native boundary', () => {
  it.each(['skills-sorceress-frozen-armor', 'sorceress.frozen_armor'])('resolves exact alias %s', alias => {
    expect(resolveFrozenArmorRank({ [alias]: 1 })).toBe(1);
    expect(resolveFrozenArmorRank({ [alias]: 20 })).toBe(20);
    expect(resolveFrozenArmorRank({ [alias]: 99 })).toBe(20);
  });

  it('takes the maximum valid alias and ignores invalid conflicting values', () => {
    expect(resolveFrozenArmorRank({ 'skills-sorceress-frozen-armor': 2, 'sorceress.frozen_armor': 7 })).toBe(7);
    expect(resolveFrozenArmorRank({ 'skills-sorceress-frozen-armor': 7, 'sorceress.frozen_armor': 2 })).toBe(7);
    for (const invalid of [0, -1, 1.5, NaN, Infinity, -Infinity]) {
      expect(resolveFrozenArmorRank({ 'skills-sorceress-frozen-armor': invalid, 'sorceress.frozen_armor': 3 })).toBe(3);
      expect(resolveFrozenArmorRank({ 'skills-sorceress-frozen-armor': 3, 'sorceress.frozen_armor': invalid })).toBe(3);
    }
  });

  it('never infers rank1 from an absent, invalid or unrelated allocation', () => {
    expect(resolveFrozenArmorRank()).toBe(0);
    expect(resolveFrozenArmorRank({})).toBe(0);
    expect(resolveFrozenArmorRank({ 'mskill-frozen-armor': 20 })).toBe(0);
    for (const invalid of [0, -1, 1.5, NaN, Infinity, -Infinity]) {
      expect(resolveFrozenArmorRank({ 'skills-sorceress-frozen-armor': invalid })).toBe(0);
      expect(resolveFrozenArmorRank({ 'sorceress.frozen_armor': invalid })).toBe(0);
    }
  });
});
