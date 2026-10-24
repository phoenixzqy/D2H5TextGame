import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import { BARBARIAN_WEAPON_MASTERY_DEFINITIONS as definitions,
  BARBARIAN_WEAPON_MASTERY_IDENTITIES as identities, composeBarbarianWeaponMasteries,
  resolveBarbarianWeaponMasteryDefinitions, resolveBarbarianWeaponMasteryRank } from './barbarian-weapon-masteries';

describe('Polearm, Spear and Throwing authored mastery definitions', () => {
  it.each(['polearm', 'spear', 'throwing'] as const)('validates and freezes exact %s tuning and aliases', key => {
    const rows = structuredClone(skills), copy = resolveBarbarianWeaponMasteryDefinitions(rows);
    expect(copy[key]).toEqual({ requiredLevel: 6, maxRank: 20, weaponType: key,
      physicalDamagePctPerRank: key === 'throwing' ? 0.025 : 0.03,
      critChancePctPerRank: key === 'throwing' ? 0 : 0.005,
      attackSpeedPctPerRank: key === 'throwing' ? 0.01 : 0 });
    expect(Object.isFrozen(copy)).toBe(true); expect(Object.isFrozen(copy[key])).toBe(true);
    expect(Object.isFrozen(rows)).toBe(false); rows.splice(0, rows.length); expect(copy).toEqual(definitions);
    const [authored, canonical] = identities[key];
    expect(resolveBarbarianWeaponMasteryRank(key, { [authored]: 7, [canonical]: 99 })).toBe(20);
    expect(resolveBarbarianWeaponMasteryRank(key, { [authored]: 20, [canonical]: 7 })).toBe(20);
    expect(() => resolveBarbarianWeaponMasteryDefinitions(skills.filter(row => row.id !== authored))).toThrow(/exactly one/);
    const row = skills.find(row => row.id === authored); if (!row) throw new Error('Missing authored mastery');
    expect(() => resolveBarbarianWeaponMasteryDefinitions([...skills, row])).toThrow(/exactly one/);
    expect(() => resolveBarbarianWeaponMasteryDefinitions(skills.map(row => row.id === authored
      ? { ...row, cooldown: 1 } : row))).toThrow(/Invalid/);
  });

  it('takes Throwing unlock, cap and cadence from authored tuning and never grants critical chance', () => {
    const changed = resolveBarbarianWeaponMasteryDefinitions(skills.map(row => row.id === identities.throwing[0]
      ? { ...row, requiredLevel: 9, maxLevel: 31,
          scaling: { passiveStatsPerLevel: { physicalDamagePct: 0.125, attackSpeedPct: 0.02 } } } : row));
    const input = { classId: 'barbarian', weaponType: 'throwing' as const,
      skillLevels: { 'barbarian.throwing_mastery': 99 } };
    expect(composeBarbarianWeaponMasteries({ ...input, level: 8 }, changed))
      .toEqual({ physicalDamagePct: 0, critChanceBonus: 0, attackSpeedMultiplier: 1 });
    expect(composeBarbarianWeaponMasteries({ ...input, level: 9 }, changed))
      .toEqual({ physicalDamagePct: 3.875, critChanceBonus: 0, attackSpeedMultiplier: 1.62 });
  });
});
