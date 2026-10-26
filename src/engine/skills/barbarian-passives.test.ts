import { describe, expect, it } from 'vitest';
import { composeBarbarianPassives } from './barbarian-passives';
import { composeIronSkinRank, resolveIronSkinRank } from './iron-skin';

const ranks = { 'barbarian.increased_stamina': 20, 'barbarian.increased_speed': 20,
  'barbarian.natural_resistance': 20, 'barbarian.sword_mastery': 20,
  'barbarian.shout': 20, 'barbarian.battle_orders': 20, 'barbarian.iron_skin': 20 };
describe('one fresh Barbarian passive projection', () => {
  it('recomposes all learned passives at effective21 and returns exactly to the rank20 baseline', () => {
    const input = { classId: 'barbarian', level: 30, weaponType: 'sword' as const, skillLevels: { ...ranks } };
    const before = structuredClone(input);
    const plain = composeBarbarianPassives(input);
    expect(plain).toEqual({ endurance: { lifeMultiplier: 1.6, attackSpeedMultiplier: 1.2,
      physDodgeBonus: 0.1, magicDodgeBonus: 0.1, resistAllBonus: 40 },
      mastery: { physicalDamagePct: 0.6, critChanceBonus: 0.1, attackSpeedMultiplier: 1 },
      warcries: { defenseBonus: 0.6, lifeBonus: 0.8, manaRegenBonus: 0.2 }, ironSkinDefenseBonus: 0.8 });
    const boosted = composeBarbarianPassives({ ...input, temporarySkillRankBonus: 1 });
    expect(boosted).toEqual({ endurance: { lifeMultiplier: 1.63, attackSpeedMultiplier: 1.21,
      physDodgeBonus: 0.105, magicDodgeBonus: 0.105, resistAllBonus: 42 },
      mastery: { physicalDamagePct: 0.63, critChanceBonus: 0.105, attackSpeedMultiplier: 1 },
      warcries: { defenseBonus: 0.63, lifeBonus: 0.84, manaRegenBonus: 0.21 }, ironSkinDefenseBonus: 0.84 });
    expect(composeBarbarianPassives(input)).toEqual(plain);
    expect(composeBarbarianPassives({ ...input, temporarySkillRankBonus: 1 })).toEqual(boosted);
    expect(input).toEqual(before);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(input.skillLevels)).toBe(false);
    expect(Object.isFrozen(boosted)).toBe(true);
    for (const value of [boosted.endurance, boosted.mastery, boosted.warcries]) expect(Object.isFrozen(value)).toBe(true);
  });

  it.each([1, 20])('Iron Skin has separate learned and effective ranks at %s', rank => {
    const input = { classId: 'barbarian', level: 30, temporarySkillRankBonus: 1,
      skillLevels: { 'skills-barbarian-iron-skin': rank, 'barbarian.iron_skin': 1 } };
    expect(resolveIronSkinRank(input.skillLevels)).toBe(rank);
    expect(composeIronSkinRank(input)).toBe(rank + 1);
    expect(composeBarbarianPassives(input).ironSkinDefenseBonus).toBe((rank + 1) * 0.04);
  });

  it.each([
    { classId: 'barbarian', level: 30, skillLevels: {} },
    { classId: 'barbarian', level: 17, skillLevels: { 'barbarian.iron_skin': 20 } },
    { classId: 'sorceress', level: 30, skillLevels: { ...ranks } },
    { classId: 'barbarian', level: NaN, skillLevels: { ...ranks } },
    { classId: 'barbarian', level: Infinity, skillLevels: { ...ranks } },
  ])('temporary potency never supplies missing Iron Skin eligibility: %j', owner => {
    expect(composeIronSkinRank({ ...owner, temporarySkillRankBonus: 1 })).toBe(0);
  });
});
