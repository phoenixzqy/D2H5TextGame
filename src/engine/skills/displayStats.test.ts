import { describe, expect, it } from 'vitest';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';

describe('skill display stats', () => {
  it('scales direct damage and exposes next-level deltas', () => {
    const skill = {
      id: 'paladin.zeal',
      trigger: 'active',
      target: 'area-enemies',
      cooldown: 1,
      maxLevel: 20,
      damageType: 'physical' as const,
      damage: { min: 40, max: 60 },
      scaling: { damagePerLevel: 4 },
      cost: { mana: 10 }
    };

    const model = computeSkillDisplayModel(skill, 5);
    expect(model.current?.damage).toEqual([{ type: 'physical', min: 56, max: 76 }]);
    expect(model.next?.damage).toEqual([{ type: 'physical', min: 60, max: 80 }]);
    expect(model.current?.manaCost).toBe(10);
    expect(model.current?.cooldown).toBe(1);
  });

  it('uses Raise Skeleton summon-cap breakpoints for current and next ranks', () => {
    const skill = {
      id: 'skills-necromancer-raise-skeleton',
      trigger: 'active',
      target: 'summon',
      cooldown: 1,
      maxLevel: 20,
      summon: true,
      scaling: { summonMaxCount: { kind: 'raise-skeleton-1-6-12-cap-3' as const } },
      cost: { mana: 15 }
    };

    expect(computeSkillDisplayModel(skill, 5).current?.summonCap).toBe(1);
    expect(computeSkillDisplayModel(skill, 5).next?.summonCap).toBe(2);
    expect(computeSkillDisplayModel(skill, 12).current?.summonCap).toBe(3);
    expect(computeSkillDisplayModel(skill, 20).current?.summonCap).toBe(3);
    expect(computeSkillDisplayModel(skill, 20).next).toBeUndefined();
  });

  it('splits mixed damage by authored breakdown weights', () => {
    const stats = computeSkillRankDisplayStats({
      id: 'paladin.vengeance',
      trigger: 'active',
      target: 'single-enemy',
      cooldown: 2,
      maxLevel: 20,
      damage: {
        min: 90,
        max: 150,
        breakdown: { fire: 50, cold: 50, lightning: 50 }
      },
      scaling: { damagePerLevel: 9 }
    }, 2);

    expect(stats.damage).toEqual([
      { type: 'fire', min: 33, max: 53 },
      { type: 'cold', min: 33, max: 53 },
      { type: 'lightning', min: 33, max: 53 }
    ]);
    expect(stats.totalDamage).toEqual({ min: 99, max: 159 });
  });
});
