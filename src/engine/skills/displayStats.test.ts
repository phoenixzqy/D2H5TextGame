import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import necromancerSkills from '../../data/skills/necromancer.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';
import { composeSkeletonMastery, type SkeletonMasteryProjection } from './skeleton-mastery';
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
      summonId: 'skeleton',
      scaling: {
        summonMaxCount: { kind: 'raise-skeleton-1-6-12-cap-3' as const },
        summonStatsPerLevel: { lifeMax: 10, attack: 2, defense: 1 }
      },
      cost: { mana: 15 }
    };

    expect(computeSkillDisplayModel(skill, 1).current?.summonUnit?.stats).toEqual([
      { id: 'lifeMax', labelKey: 'details.summonStat.lifeMax', value: 112, valueKind: 'flat' },
      { id: 'attack', labelKey: 'details.summonStat.attack', value: 25, valueKind: 'flat' },
      { id: 'defense', labelKey: 'details.summonStat.defense', value: 14, valueKind: 'flat' }
    ]);
    expect(computeSkillDisplayModel(skill, 1).next?.summonUnit?.stats).toEqual([
      { id: 'lifeMax', labelKey: 'details.summonStat.lifeMax', value: 122, valueKind: 'flat' },
      { id: 'attack', labelKey: 'details.summonStat.attack', value: 27, valueKind: 'flat' },
      { id: 'defense', labelKey: 'details.summonStat.defense', value: 15, valueKind: 'flat' }
    ]);
    expect(computeSkillDisplayModel(skill, 5).current?.summonCap).toBe(1);
    expect(computeSkillDisplayModel(skill, 5).next?.summonCap).toBe(2);
    expect(computeSkillDisplayModel(skill, 5).next?.summonUnit?.stats[0]?.value).toBe(162);
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

  it('exposes passive utility scaling rows for non-damage skills', () => {
    const model = computeSkillDisplayModel({
      id: 'skills-necromancer-summon-mastery',
      trigger: 'passive',
      target: 'self',
      cooldown: 0,
      maxLevel: 20,
      scaling: {
        passiveStatsPerLevel: {
          summonLifePct: 0.05,
          summonAttackPct: 0.02
        }
      }
    }, 2);

    expect(model.current?.utility).toEqual([
      { id: 'summonLifePct', labelKey: 'details.passiveStat.summonLifePct', value: 0.1, valueKind: 'percent' },
      { id: 'summonAttackPct', labelKey: 'details.passiveStat.summonAttackPct', value: 0.04, valueKind: 'percent' }
    ]);
    expect(model.next?.utility).toEqual([
      { id: 'summonLifePct', labelKey: 'details.passiveStat.summonLifePct', value: 0.15, valueKind: 'percent' },
      { id: 'summonAttackPct', labelKey: 'details.passiveStat.summonAttackPct', value: 0.06, valueKind: 'percent' }
    ]);
  });
});


const validateSkill = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef>(skillSchema);
function authoredSummon(id: string): SkillDef {
  const row: unknown = structuredClone(necromancerSkills.find(skill => skill.id === id));
  if (!validateSkill(row)) throw new Error(`Missing or invalid authored summon ${id}`);
  return row;
}
const skeleton = () => authoredSummon('skills-necromancer-raise-skeleton');
const mage = () => authoredSummon('skills-necromancer-raise-skeletal-mage');
const revive = () => authoredSummon('skills-necromancer-revive');
function mastery(rank: number, alias = 'necromancer.skeleton_mastery') {
  return composeSkeletonMastery({ id: 'display-hero', class: 'necromancer', level: 30,
    skillLevels: { [alias]: rank } });
}
function expectSummonValues(
  stats: ReturnType<typeof computeSkillRankDisplayStats> | undefined,
  expected: readonly number[]
) {
  expect(stats?.summonUnit?.stats.map(row => row.id)).toEqual(['lifeMax', 'attack', 'defense']);
  for (const [index, value] of expected.entries()) {
    expect(stats?.summonUnit?.stats[index]?.value).toBeCloseTo(value, 10);
  }
}

describe('BUG073 current allocated Skeleton Mastery in summon previews', () => {
  it.each([
    ['skills-necromancer-raise-skeleton', 291.6, 49, 22.8, 309.6, 51.8, 24],
    ['necromancer.raise_skeleton', 291.6, 49, 22.8, 309.6, 51.8, 24],
    ['skills-necromancer-raise-skeletal-mage', 221.4, 63, 12, 234, 67.2, 12],
    ['necromancer.raise_skeletal_mage', 221.4, 63, 12, 234, 67.2, 12]
  ] as const)('shows rank6/7 with the same Mastery20 for %s', (id, life, attack, defense, nextLife, nextAttack, nextDefense) => {
    const source = id.includes('skeletal') ? mage() : skeleton();
    const skill = { ...source, id };
    const projection = mastery(20);
    const before = structuredClone({ skill, projection });
    const model = computeSkillDisplayModel(skill, 6, projection);
    expectSummonValues(model.current, [life, attack, defense]);
    expectSummonValues(model.next, [nextLife, nextAttack, nextDefense]);
    expect(computeSkillRankDisplayStats(skill, 6, projection)).toEqual(model.current);
    expect({ skill, projection }).toEqual(before);
    expect(model.current?.manaCost).toBe(id.includes('skeletal') ? 22 : 15);
    expect(model.current?.cooldown).toBe(1);
    expect(model.current?.summonCap).toBe(id.includes('skeletal') ? 4 : 2);
  });

  it.each(['skills-necromancer-skeleton-mastery', 'necromancer.skeleton_mastery'])('uses Mastery1 from %s without rounding engine fractions', alias => {
    const projection = mastery(1, alias);
    expectSummonValues(computeSkillDisplayModel(skeleton(), 1, projection).current, [116.48, 25.5, 14.14]);
    expectSummonValues(computeSkillDisplayModel(skeleton(), 1, projection).next, [126.88, 27.54, 15.15]);
    expectSummonValues(computeSkillDisplayModel(mage(), 1, projection).current, [91.52, 30.6, 10.1]);
    expectSummonValues(computeSkillDisplayModel(mage(), 1, projection).next, [98.8, 33.66, 10.1]);
  });

  it('shows only the unlearned rank-one preview with current Mastery10', () => {
    const model = computeSkillDisplayModel(skeleton(), 0, mastery(10));
    expect(model.current).toBeUndefined();
    expect(model.nextRank).toBe(1);
    expectSummonValues(model.next, [156.8, 30, 15.4]);
  });

  it.each([
    [5, 273.6, 46.2, 21.6, 291.6, 49, 22.8],
    [11, 381.6, 63, 28.8, 399.6, 65.8, 30]
  ])('keeps Skeleton rank%s cap boundaries independent of Mastery', (rank, life, attack, defense, nextLife, nextAttack, nextDefense) => {
    const model = computeSkillDisplayModel(skeleton(), rank, mastery(20));
    expectSummonValues(model.current, [life, attack, defense]);
    expectSummonValues(model.next, [nextLife, nextAttack, nextDefense]);
    expect(model.next?.summonCap).toBe((model.current?.summonCap ?? 0) + 1);
  });

  it('caps allocated Mastery at20, keeps the max summon rank and omits its next preview', () => {
    const projection = mastery(99);
    expect(projection?.rank).toBe(20);
    const model = computeSkillDisplayModel(skeleton(), 20, projection);
    expect(model.maxed).toBe(true);
    expect(model.next).toBeUndefined();
    expectSummonValues(model.current, [543.6, 88.2, 39.6]);
  });

  it('preserves base rows without an eligible projection', () => {
    const source = skeleton();
    const ineligible = composeSkeletonMastery({ id: 'wrong-class', class: 'druid', level: 30,
      skillLevels: { 'necromancer.skeleton_mastery': 20 } });
    expect(ineligible).toBeUndefined();
    for (const projection of [undefined, mastery(0), ineligible, null as unknown as SkeletonMasteryProjection]) {
      const model = computeSkillDisplayModel(source, 6, projection);
      expectSummonValues(model.current, [162, 35, 19]);
      expectSummonValues(model.next, [172, 37, 20]);
    }
  });

  it.each([
    { rank: 0 }, { rank: -1 }, { rank: 1.5 }, { rank: 21 }, { rank: NaN },
    { maxRank: 0 }, { maxRank: 1.5 }, { maxRank: Infinity },
    ...(['summonLifePct', 'summonAttackPct', 'summonDefensePct'] as const)
      .flatMap(key => [-0.1, NaN, Infinity, -Infinity].map(value => ({ [key]: value })))
  ])('ignores malformed typed projection %j', patch => {
    const projection = { ...mastery(20), ...patch } as SkeletonMasteryProjection;
    const model = computeSkillDisplayModel(skeleton(), 6, projection);
    expectSummonValues(model.current, [162, 35, 19]);
    expectSummonValues(model.next, [172, 37, 20]);
  });

  it.each([
    () => revive(),
    () => ({ ...revive(), id: 'necromancer.revive' }),
    () => ({ ...skeleton(), id: 'synthetic.raise_skeleton' }),
    () => ({ ...mage(), id: 'skills-necromancer-raise-skeletal-mage-copy' }),
    () => ({ ...skeleton(), summonId: 'skeletal_mage' }),
    () => ({ ...mage(), summonId: 'skeleton' }),
    () => { const skill = { ...skeleton() }; delete skill.summonId; return skill; },
    () => ({ ...mage(), summonId: 'revived' })
  ])('excludes Revive, lookalikes, absent and mismatched explicit templates %#', makeSkill => {
    const skill = makeSkill();
    expect(computeSkillDisplayModel(skill, 6, mastery(20))).toEqual(computeSkillDisplayModel(skill, 6));
  });

  it('leaves exact Revive rank6/7 literal values unchanged with Mastery20', () => {
    const model = computeSkillDisplayModel(revive(), 6, mastery(20));
    expectSummonValues(model.current, [210, 38, 23]);
    expectSummonValues(model.next, [222, 40, 24]);
  });
});
