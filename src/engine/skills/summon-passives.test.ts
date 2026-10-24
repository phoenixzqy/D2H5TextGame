import { createSkillValidator } from './skill-validator';
import type { DisplaySkillSource } from './displayStats';
import { computeSkillRankDisplayStats } from './displayStats';
import { composeSkeletonMastery } from './skeleton-mastery';
import { composeGolemMastery } from './golem-mastery';
import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { composeSummonPassives, resolveSummonPassiveDefinitions, SUMMON_PASSIVE_DEFINITIONS } from './summon-passives';
const levels = { 'necromancer.clay_golem': 1, 'necromancer.golem_mastery': 1 };
const hero = { id: 'hero', class: 'necromancer', level: 30, skillLevels: levels };
it.each([1, 20, 99])('composes both exact aliases max-once at rank%s with authored caps', rank => {
  const result = composeSummonPassives({ ...hero, skillLevels: { ...levels,
    'skills-necromancer-summon-mastery': rank, 'necromancer.summon_mastery': rank,
    'skills-necromancer-summon-resist': rank, 'necromancer.summon_resist': rank } });
  const capped = Math.min(rank, 20);
  expect(result).toEqual({ sourceHeroId: 'hero', masteryRank: capped, resistRank: capped,
    masteryMaxRank: 20, resistMaxRank: 20, lifePct: capped * .05, attackPct: capped * .02, resistAllBonus: capped * 2 });
  expect(Object.isFrozen(result)).toBe(true);
});
it.each([null, '20', true, 1.5, NaN, Infinity, -1, 0])('ignores malformed allocations%s and retains valid alternative alias', value => {
  const skillLevels = { ...levels, 'necromancer.summon_mastery': value } as unknown as Record<string, number>;
  expect(composeSummonPassives({ ...hero, skillLevels })).toBeUndefined();
  expect(composeSummonPassives({ ...hero, skillLevels: { ...skillLevels,
    'skills-necromancer-summon-mastery': 2 } })?.lifePct).toBe(.1);
});
it('enforces class/unlock/prerequisites, excludes similar names and does not infer ranks', () => {
  const skillLevels = { ...levels, 'necromancer.summon_mastery': 20, 'necromancer.summon_resist': 20 };
  expect(composeSummonPassives({ ...hero, class: 'druid', skillLevels })).toBeUndefined();
  expect(composeSummonPassives({ ...hero, level: 23, skillLevels })).toBeUndefined();
  expect(composeSummonPassives({ ...hero, level: 24, skillLevels })).toMatchObject({ masteryRank: 0, resistRank: 20 });
  for (const level of [NaN, Infinity, -Infinity]) expect(composeSummonPassives({ ...hero, level, skillLevels })).toBeUndefined();
  for (const missing of ['necromancer.clay_golem', 'necromancer.golem_mastery']) {
    const allocations = Object.fromEntries(Object.entries(skillLevels).filter(([id]) => id !== missing));
    expect(composeSummonPassives({ ...hero, skillLevels: allocations })).toMatchObject({ masteryRank: 20, resistRank: 0 });
  }
  expect(composeSummonPassives({ ...hero, skillLevels: { 'necromancer.summon-mastery': 20 } })).toBeUndefined();
  expect(composeSummonPassives(hero)).toBeUndefined();
});
describe('independent authored tuning', () => {
  it('rejects duplicates/invalid rows and copies without freezing caller data', () => {
    const copy = structuredClone(rows), definitions = resolveSummonPassiveDefinitions(copy);
    expect(definitions).toEqual(SUMMON_PASSIVE_DEFINITIONS);
    const index = copy.findIndex(row => row.id === 'skills-necromancer-summon-mastery');
    const row = copy[index]; if (!row) throw new Error('Missing tuning');
    expect(Object.isFrozen(row)).toBe(false);
    const alternate = copy.map(value => value.id === row.id
      ? { ...value, scaling: { passiveStatsPerLevel: { summonLifePct: .125, summonAttackPct: .375 } } } : value);
    expect(definitions.mastery.lifePerRank).toBe(.05);
    expect(resolveSummonPassiveDefinitions(alternate).mastery.lifePerRank).toBe(.125);
    expect(() => resolveSummonPassiveDefinitions([])).toThrow();
    expect(() => resolveSummonPassiveDefinitions([...rows, row])).toThrow();
    expect(Object.isFrozen(definitions.mastery)).toBe(true);
  });
});

it('shows the same combined life/attack and all six resistances in summon previews', () => {
  const player = { ...hero, skillLevels: { ...levels, 'necromancer.skeleton_mastery': 1,
    'necromancer.summon_mastery': 1, 'necromancer.summon_resist': 1 } };
  const clay = rows.find(row => row.id === 'skills-necromancer-clay-golem');
  const validate = createSkillValidator<DisplaySkillSource>();
  if (!clay || !validate(clay)) throw new Error('Missing preview');
  const display = computeSkillRankDisplayStats(clay, 1, composeSkeletonMastery(player), undefined,
    composeGolemMastery(player), composeSummonPassives(player));
  const stats = display.summonUnit?.stats;
  expect(stats?.find(row => row.id === 'lifeMax')?.value).toBeCloseTo(244.2, 12);
  expect(stats?.find(row => row.id === 'attack')?.value).toBeCloseTo(24.48, 12);
  expect(stats?.filter(row => row.id.endsWith('Resistance')).map(row => [row.id, row.value])).toEqual([
    ['physicalResistance', .12], ['fireResistance', .02], ['coldResistance', .02],
    ['lightningResistance', .02], ['arcaneResistance', .02], ['poisonResistance', .02],
  ]);
});
