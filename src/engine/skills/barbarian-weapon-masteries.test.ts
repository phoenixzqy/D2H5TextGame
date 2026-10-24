import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import { BARBARIAN_WEAPON_MASTERY_DEFINITIONS as definitions,
  BARBARIAN_WEAPON_MASTERY_IDENTITIES as identities, composeBarbarianWeaponMasteries,
  resolveBarbarianWeaponMasteryDefinitions, resolveBarbarianWeaponMasteryRank } from './barbarian-weapon-masteries';

const neutral = { physicalDamagePct: 0, critChanceBonus: 0 };
describe('authored weapon-mastery definitions and composition', () => {
  it.each(['sword', 'axe', 'mace'] as const)('copies/freeze-validates %s metadata, aliases, ranks, cap and eligibility', key => {
    const rows = structuredClone(skills), before = structuredClone(rows);
    const copy = resolveBarbarianWeaponMasteryDefinitions(rows);
    expect(copy[key]).toEqual({ requiredLevel: 1, maxRank: 20, weaponType: key,
      physicalDamagePctPerRank: 0.03, critChancePctPerRank: 0.005 });
    expect(Object.isFrozen(copy)).toBe(true); expect(Object.isFrozen(copy[key])).toBe(true);
    expect(rows).toEqual(before); expect(Object.isFrozen(rows)).toBe(false);
    rows.splice(0, rows.length); expect(copy).toEqual(definitions);
    const [authored, canonical] = identities[key];
    expect(resolveBarbarianWeaponMasteryRank(key, { [authored]: 2, [canonical]: 99 })).toBe(20);
    expect(resolveBarbarianWeaponMasteryRank(key, { [authored]: 20, [canonical]: 2 })).toBe(20);
    const input = { classId: 'barbarian', level: 1, weaponType: key };
    expect(composeBarbarianWeaponMasteries({ ...input, skillLevels: { [authored]: 1 } }))
      .toEqual({ physicalDamagePct: 0.03, critChanceBonus: 0.005 });
    expect(composeBarbarianWeaponMasteries({ ...input, skillLevels: { [canonical]: 20 } }))
      .toEqual({ physicalDamagePct: 0.6, critChanceBonus: 0.1 });
    expect(composeBarbarianWeaponMasteries({ ...input, skillLevels: { [canonical + '-lookalike']: 20 } })).toEqual(neutral);
    for (const allocated of [0, -1, 1.5, NaN, Infinity, null, '20', true]) {
      const bad = { [authored]: allocated } as unknown as Record<string, number>;
      expect(resolveBarbarianWeaponMasteryRank(key, bad)).toBe(0);
      expect(resolveBarbarianWeaponMasteryRank(key, { ...bad, [canonical]: 1 })).toBe(1);
    }
    for (const level of [0, -1, NaN, Infinity]) {
      expect(composeBarbarianWeaponMasteries({ ...input, level, skillLevels: { [canonical]: 20 } })).toEqual(neutral);
    }
    expect(composeBarbarianWeaponMasteries({ ...input, classId: 'sorceress', skillLevels: { [canonical]: 20 } })).toEqual(neutral);
    expect(composeBarbarianWeaponMasteries({ classId: 'barbarian', level: 30, skillLevels: { [canonical]: 20 } })).toEqual(neutral);
  });

  it.each(['sword', 'axe', 'mace'] as const)('rejects missing, duplicate and invalid exact %s rows', key => {
    const id = identities[key][0], row = skills.find(row => row.id === id);
    if (!row) throw new Error('Missing authored mastery');
    expect(() => resolveBarbarianWeaponMasteryDefinitions(skills.filter(row => row.id !== id))).toThrow(/exactly one/);
    expect(() => resolveBarbarianWeaponMasteryDefinitions([...skills, row])).toThrow(/exactly one/);
    expect(() => resolveBarbarianWeaponMasteryDefinitions(skills.map(row => row.id === id ? { ...row, cooldown: 1 } : row))).toThrow(/Invalid/);
  });

  it('honors alternate authored unlock/cap and coefficients without numerical runtime constants', () => {
    const copy = resolveBarbarianWeaponMasteryDefinitions(skills.map(row => row.id === identities.sword[0]
      ? { ...row, requiredLevel: 9, maxLevel: 31,
          scaling: { passiveStatsPerLevel: { physicalDamagePct: 0.125, critChancePct: 0.01 } } } : row));
    const input = { classId: 'barbarian', weaponType: 'sword' as const, skillLevels: { 'barbarian.sword_mastery': 99 } };
    expect(composeBarbarianWeaponMasteries({ ...input, level: 8 }, copy)).toEqual(neutral);
    expect(composeBarbarianWeaponMasteries({ ...input, level: 9 }, copy))
      .toEqual({ physicalDamagePct: 3.875, critChanceBonus: 0.31 });
  });
});
