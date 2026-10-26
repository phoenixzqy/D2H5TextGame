import { describe, expect, it } from 'vitest';
import { composeBarbarianEndurance, resolveBarbarianEnduranceRank,
  resolveBarbarianEnduranceDefinitions } from './barbarian-endurance';
import { composeBarbarianWarcries } from './barbarian-warcries';
import { composeBarbarianWeaponMasteries } from './barbarian-weapon-masteries';
import { composeIronSkinRank } from './iron-skin';
import skills from '../../data/skills/barbarian.json';

describe('explicit temporary ranks preserve learned Barbarian authority', () => {
  it.each([1, 20])('strengthens learned endurance rank%s without changing allocation', rank => {
    const input = { classId: 'barbarian', level: 30, temporarySkillRankBonus: 1,
      skillLevels: { 'barbarian.increased_stamina': rank, 'barbarian.increased_speed': rank,
        'barbarian.natural_resistance': rank } };
    const before = structuredClone(input);
    expect(composeBarbarianEndurance(input)).toEqual({ lifeMultiplier: 1 + (rank + 1) * 0.03,
      attackSpeedMultiplier: 1 + (rank + 1) * 0.01, physDodgeBonus: (rank + 1) * 0.005,
      magicDodgeBonus: (rank + 1) * 0.005, resistAllBonus: (rank + 1) * 0.02 * 100 });
    expect(input).toEqual(before);
    expect(composeBarbarianEndurance({ ...input, temporarySkillRankBonus: 0 }))
      .toEqual(composeBarbarianEndurance({ classId: input.classId, level: input.level, skillLevels: input.skillLevels }));
  });

  it.each([1, 20])('strengthens learned personal warcries rank%s', rank => {
    const input = { classId: 'barbarian', level: 30, temporarySkillRankBonus: 1,
      skillLevels: { 'barbarian.shout': rank, 'barbarian.battle_orders': rank } };
    expect(composeBarbarianWarcries(input)).toEqual({ defenseBonus: (rank + 1) * 0.03,
      lifeBonus: (rank + 1) * 0.04, manaRegenBonus: (rank + 1) * 0.01 });
  });

  it.each([1, 20])('strengthens learned matching weapon mastery rank%s', rank => {
    const input = { classId: 'barbarian', level: 30, weaponType: 'sword' as const,
      temporarySkillRankBonus: 1, skillLevels: { 'barbarian.sword_mastery': rank } };
    expect(composeBarbarianWeaponMasteries(input)).toEqual({ physicalDamagePct: (rank + 1) * 0.03,
      critChanceBonus: (rank + 1) * 0.005, attackSpeedMultiplier: 1 });
    expect(composeBarbarianWeaponMasteries({ ...input, weaponType: 'axe' }))
      .toEqual({ physicalDamagePct: 0, critChanceBonus: 0, attackSpeedMultiplier: 1 });
  });

  it.each([
    { classId: 'barbarian', level: 30, skillLevels: {} },
    { classId: 'sorceress', level: 30, skillLevels: { 'barbarian.increased_stamina': 20,
      'barbarian.shout': 20, 'barbarian.sword_mastery': 20 } },
    { classId: 'barbarian', level: 0, skillLevels: { 'barbarian.increased_stamina': 20,
      'barbarian.shout': 20, 'barbarian.sword_mastery': 20 } },
  ])('does not turn the bonus into passive authority: %j', owner => {
    const input = { ...owner, weaponType: 'sword' as const, temporarySkillRankBonus: 1 };
    expect(composeBarbarianEndurance(input)).toEqual({ lifeMultiplier: 1, attackSpeedMultiplier: 1,
      physDodgeBonus: 0, magicDodgeBonus: 0, resistAllBonus: 0 });
    expect(composeBarbarianWarcries(input)).toEqual({ lifeBonus: 0, defenseBonus: 0, manaRegenBonus: 0 });
    expect(composeBarbarianWeaponMasteries(input))
      .toEqual({ physicalDamagePct: 0, critChanceBonus: 0, attackSpeedMultiplier: 1 });
  });

  it.each([
    ['sword', 'sword_mastery', 0.03, 0.005, 0], ['axe', 'axe_mastery', 0.03, 0.005, 0],
    ['mace', 'mace_mastery', 0.03, 0.005, 0], ['polearm', 'pole_arm_mastery', 0.03, 0.005, 0],
    ['spear', 'spear_mastery', 0.03, 0.005, 0], ['throwing', 'throwing_mastery', 0.025, 0, 0.01],
  ] as const)('preserves the authored %s mastery curve above the allocation cap', (weaponType, id, damage, crit, speed) => {
    for (const rank of [1, 20]) {
      const input = { classId: 'barbarian', level: 30, weaponType, temporarySkillRankBonus: 1,
        skillLevels: { ['barbarian.' + id]: rank } };
      expect(composeBarbarianWeaponMasteries(input)).toEqual({ physicalDamagePct: (rank + 1) * damage,
        critChanceBonus: (rank + 1) * crit, attackSpeedMultiplier: 1 + (rank + 1) * speed });
    }
  });

  it('caps allocation before adding potency and deduplicates the aliases only once', () => {
    const definitions = resolveBarbarianEnduranceDefinitions(skills.map(row => row.id === 'skills-barbarian-increased-speed'
      ? { ...row, maxLevel: 3, requiredLevel: 9,
        scaling: { passiveStatsPerLevel: { attackSpeedPct: 0.125, physDodgePct: 0 } } } : row));
    const input = { classId: 'barbarian', level: 9, temporarySkillRankBonus: 1,
      skillLevels: { 'skills-barbarian-increased-speed': 2, 'barbarian.increased_speed': 99 } };
    expect(resolveBarbarianEnduranceRank('speed', input.skillLevels, definitions)).toBe(3);
    expect(composeBarbarianEndurance(input, definitions)).toEqual({ lifeMultiplier: 1,
      attackSpeedMultiplier: 1.5, physDodgeBonus: 0, magicDodgeBonus: 0, resistAllBonus: 0 });
    expect(composeBarbarianEndurance({ ...input, level: 8 }, definitions).attackSpeedMultiplier).toBe(1);
  });

  it.each([-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER, '1', null, true])(
    'invalid/overflowing temporary bonus %s preserves all ordinary learned bonuses', value => {
      const input = { classId: 'barbarian', level: 30, weaponType: 'sword' as const,
        skillLevels: { 'barbarian.increased_stamina': 20, 'barbarian.shout': 20,
          'barbarian.sword_mastery': 20, 'barbarian.iron_skin': 20 } };
      const invalid = { ...input, temporarySkillRankBonus: value as number };
      expect(composeBarbarianEndurance(invalid)).toEqual(composeBarbarianEndurance(input));
      expect(composeBarbarianWarcries(invalid)).toEqual(composeBarbarianWarcries(input));
      expect(composeBarbarianWeaponMasteries(invalid)).toEqual(composeBarbarianWeaponMasteries(input));
      expect(composeIronSkinRank(invalid)).toBe(composeIronSkinRank(input));
    });
});
