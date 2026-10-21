import { describe, expect, it } from 'vitest';
import sorceressSkills from '../../data/skills/sorceress.json';
import { METEOR_ARMOR_MELT_DEFINITION, resolveMeteorArmorMelt } from './armor-melt';

describe('P08a08 authored Meteor Armor Melt definition boundary', () => {
  const fixture = () => {
    const row = sorceressSkills.find(row => row.id === 'skills-sorceress-meteor');
    if (!row?.appliesStatus) throw new Error('Actual Meteor is missing');
    return { ...structuredClone(row), appliesStatus: [...row.appliesStatus], additionalStatusEffects: {
      'armor-melt': { chance: 1, defenseReductionPct: 30, durationMs: 3000 }
    } };
  };

  it('reads the exact authored production row into independent immutable values', () => {
    const before = structuredClone(sorceressSkills);
    expect(METEOR_ARMOR_MELT_DEFINITION).toEqual({
      statusId: 'armor-melt', defenseReductionPct: 30, durationMs: 3000
    });
    expect(resolveMeteorArmorMelt(sorceressSkills)).toEqual(METEOR_ARMOR_MELT_DEFINITION);
    expect(sorceressSkills).toEqual(before);
  });

  it('copies every result without retaining or freezing caller data', () => {
    const row = fixture();
    const before = structuredClone(row);
    const first = resolveMeteorArmorMelt([row]);
    const second = resolveMeteorArmorMelt([row]);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(row).toEqual(before);
    for (const value of [row, row.additionalStatusEffects, row.additionalStatusEffects['armor-melt'], row.appliesStatus]) {
      expect(Object.isFrozen(value)).toBe(false);
    }
    row.additionalStatusEffects['armor-melt'].defenseReductionPct = 99;
    row.additionalStatusEffects['armor-melt'].durationMs = 1;
    row.appliesStatus[0] = 'freeze';
    expect(first).toEqual(METEOR_ARMOR_MELT_DEFINITION);
    expect(Reflect.set(first, 'defenseReductionPct', 99)).toBe(false);
    expect(Reflect.set(first, 'durationMs', 1)).toBe(false);
  });

  it.each([0, 12.5, 100])('consumes authored potency %s and unrounded fractional duration', defenseReductionPct => {
    const row = fixture();
    row.additionalStatusEffects['armor-melt'] = { chance: 1, defenseReductionPct, durationMs: 0.5 };
    expect(resolveMeteorArmorMelt([row])).toEqual({ statusId: 'armor-melt', defenseReductionPct, durationMs: 0.5 });
  });

  it('requires exactly one exact identity and ignores unrelated unknown rows', () => {
    for (const rows of [[], [null, 42, {}], [{ ...fixture(), id: 'mskill-meteor' }], [fixture(), fixture()]]) {
      expect(() => resolveMeteorArmorMelt(rows)).toThrow(/exactly one/);
    }
    expect(resolveMeteorArmorMelt([null, 42, { id: 'mskill-meteor' }, fixture()]))
      .toEqual(METEOR_ARMOR_MELT_DEFINITION);
  });

  it.each([
    { additionalStatusEffects: undefined }, { additionalStatusEffects: {} },
    ...[{}, null, { chance: 1 }, { chance: 1, defenseReductionPct: 30 },
      { defenseReductionPct: 30, durationMs: 3000 },
      ...[0, 0.5, NaN, Infinity, '1'].map(chance => ({ chance, defenseReductionPct: 30, durationMs: 3000 })),
      ...[-1, 101, NaN, Infinity, -Infinity, '30', null].map(defenseReductionPct => ({ chance: 1, defenseReductionPct, durationMs: 3000 })),
      ...[0, -1, NaN, Infinity, '3000', null].map(durationMs => ({ chance: 1, defenseReductionPct: 30, durationMs })),
      { chance: 1, defenseReductionPct: 30, durationMs: 3000, dotPctOfDamage: 0.1 }
    ].map(melt => ({ additionalStatusEffects: { 'armor-melt': melt } })),
    { damageType: 'cold' }, { appliesStatus: ['armor-melt', 'burn'] },
    { appliesStatus: ['burn', 'armor-melt', 'freeze'] }, { damage: undefined },
    { additionalStatusEffects: { 'armor-melt': { chance: 1, defenseReductionPct: 30, durationMs: 3000 }, freeze: { chance: 1 } } }
  ])('rejects malformed selected row %j', fields => {
    expect(() => resolveMeteorArmorMelt([{ ...fixture(), ...fields }])).toThrow(/Meteor Armor Melt/);
  });
});
