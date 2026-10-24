import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import { BARBARIAN_ENDURANCE_DEFINITIONS as definitions, BARBARIAN_ENDURANCE_IDENTITIES as ids,
  composeBarbarianEndurance, resolveBarbarianEnduranceDefinitions, resolveBarbarianEnduranceRank } from './barbarian-endurance';

const neutral = { lifeMultiplier: 1, attackSpeedMultiplier: 1, physDodgeBonus: 0, magicDodgeBonus: 0, resistAllBonus: 0 };
const all = { 'barbarian.increased_stamina': 20, 'barbarian.increased_speed': 20, 'barbarian.natural_resistance': 20 };
describe('immutable authored Barbarian endurance definitions', () => {
  it('copies and freezes authored tuning without freezing or retaining caller rows', () => {
    const rows = structuredClone(skills), before = structuredClone(rows);
    const copy = resolveBarbarianEnduranceDefinitions(rows);
    expect([copy.stamina.requiredLevel, copy.speed.requiredLevel, copy.resistance.requiredLevel]).toEqual([12, 24, 30]);
    expect(copy.stamina.perRank.lifePct).toBe(0.03);
    expect(copy.speed.perRank).toMatchObject({ attackSpeedPct: 0.01, physDodgePct: 0.005 });
    expect(copy.resistance.perRank).toMatchObject({ resistAllPct: 0.02, magicDodgePct: 0.005 });
    expect(Object.isFrozen(copy)).toBe(true);
    for (const value of Object.values(copy)) {
      expect(value.maxRank).toBe(20); expect(Object.isFrozen(value)).toBe(true);
      expect(Object.isFrozen(value.perRank)).toBe(true);
    }
    expect(rows).toEqual(before); expect(Object.isFrozen(rows)).toBe(false);
    rows.splice(0, rows.length);
    expect(copy).toEqual(definitions);
  });

  it.each(['stamina', 'speed', 'resistance'] as const)('rejects missing, duplicate and invalid %s definitions', key => {
    const id = ids[key][0], row = skills.find(row => row.id === id);
    if (!row) throw new Error('Missing authored passive');
    expect(() => resolveBarbarianEnduranceDefinitions(skills.filter(row => row.id !== id))).toThrow(/exactly one/);
    expect(() => resolveBarbarianEnduranceDefinitions([...skills, row])).toThrow(/exactly one/);
    expect(() => resolveBarbarianEnduranceDefinitions(skills.map(row => row.id === id ? { ...row, target: 'all-allies' } : row))).toThrow(/Invalid/);
  });

  it('honors alternate tuning, unlock and cap without hardcoded numerical runtime rules', () => {
    const copy = resolveBarbarianEnduranceDefinitions(skills.map(row => row.id === ids.speed[0]
      ? { ...row, requiredLevel: 9, maxLevel: 31,
          scaling: { passiveStatsPerLevel: { attackSpeedPct: 0.125, physDodgePct: 0 } } } : row));
    expect(composeBarbarianEndurance({ classId: 'barbarian', level: 8, skillLevels: all }, copy)).toEqual(neutral);
    expect(composeBarbarianEndurance({ classId: 'barbarian', level: 9,
      skillLevels: { [ids.speed[1]]: 99 } }, copy)).toEqual({ ...neutral, attackSpeedMultiplier: 4.875 });
  });
});

describe('exact allocated Barbarian endurance ranks and eligibility', () => {
  it('takes the maximum alias once, caps ranks and ignores lookalike identities', () => {
    for (const key of ['stamina', 'speed', 'resistance'] as const) {
      const [authored, canonical] = ids[key];
      expect(resolveBarbarianEnduranceRank(key, { [authored]: 2, [canonical]: 99 })).toBe(20);
      expect(resolveBarbarianEnduranceRank(key, { [authored]: 20, [canonical]: 2 })).toBe(20);
      expect(resolveBarbarianEnduranceRank(key, { [canonical.replace('_', '-')]: 20, ['mskill-' + key]: 20 })).toBe(0);
    }
    const before = structuredClone(all);
    expect(composeBarbarianEndurance({ classId: 'barbarian', level: 30, skillLevels: all }))
      .toEqual({ lifeMultiplier: 1.6, attackSpeedMultiplier: 1.2, physDodgeBonus: 0.1, magicDodgeBonus: 0.1, resistAllBonus: 40 });
    expect(all).toEqual(before);
    expect(composeBarbarianEndurance({ classId: 'barbarian', level: 30 })).toEqual(neutral);
  });

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, true])('ignores malformed rank %s and accepts a valid companion alias', value => {
    for (const key of ['stamina', 'speed', 'resistance'] as const) {
      const [authored, canonical] = ids[key];
      const levels = { [authored]: value } as unknown as Record<string, number>;
      expect(resolveBarbarianEnduranceRank(key, levels)).toBe(0);
      expect(resolveBarbarianEnduranceRank(key, { ...levels, [canonical]: 1 })).toBe(1);
    }
  });

  it.each(['sorceress', 'amazon', 'paladin', 'necromancer', 'druid', 'assassin', ''])(
    'grants no imported Barbarian bonus to %s', classId => {
      expect(composeBarbarianEndurance({ classId, level: 90, skillLevels: all })).toEqual(neutral);
    });
  it.each([NaN, Infinity, -Infinity, 11])('grants no bonuses at invalid or below-unlock level %s', level => {
    expect(composeBarbarianEndurance({ classId: 'barbarian', level, skillLevels: all })).toEqual(neutral);
  });
  it('uses independent authored unlocks', () => {
    expect(composeBarbarianEndurance({ classId: 'barbarian', level: 12, skillLevels: all }))
      .toEqual({ ...neutral, lifeMultiplier: 1.6 });
    expect(composeBarbarianEndurance({ classId: 'barbarian', level: 24, skillLevels: all }))
      .toEqual({ ...neutral, lifeMultiplier: 1.6, attackSpeedMultiplier: 1.2, physDodgeBonus: 0.1 });
  });
});
