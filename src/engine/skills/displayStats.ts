/**
 * Skill display-stat resolver.
 *
 * Converts data-authored skill templates into level-aware rows that UI layers
 * can format with i18n. This module stays pure TypeScript and contains no
 * React, DOM, store, or locale dependencies.
 *
 * @module engine/skills/displayStats
 */

import type { DamageType } from '../types/attributes';
import { maxFirstThreeThenEveryThreeForLevel, maxSkeletonsForLevel } from './scaling';

export interface DisplaySkillSource {
  readonly id: string;
  readonly trigger: string;
  readonly target: string;
  readonly cooldown: number;
  readonly maxLevel: number;
  readonly summon?: boolean;
  readonly cost?: {
    readonly mana?: number;
    readonly life?: number;
  };
  readonly damage?: {
    readonly min: number;
    readonly max: number;
    readonly breakdown?: Partial<Record<DamageType, number>>;
  };
  readonly damageType?: DamageType;
  readonly appliesStatus?: readonly string[];
  readonly appliesTags?: readonly string[];
  readonly scaling?: {
    readonly damagePerLevel?: number;
    readonly cooldownPerLevel?: number;
    readonly costPerLevel?: number;
    readonly summonMaxCount?: {
      readonly kind: 'first-three-then-every-three' | 'raise-skeleton-1-6-12-cap-3';
    };
  };
}

export interface SkillDamageDisplayRow {
  readonly type: DamageType;
  readonly min: number;
  readonly max: number;
}

export interface SkillRankDisplayStats {
  readonly rank: number;
  readonly damage: readonly SkillDamageDisplayRow[];
  readonly totalDamage?: {
    readonly min: number;
    readonly max: number;
  };
  readonly summonCap?: number;
  readonly manaCost?: number;
  readonly lifeCost?: number;
  readonly cooldown: number;
  readonly statuses: readonly string[];
  readonly tags: readonly string[];
}

export interface SkillDisplayModel {
  readonly allocatedLevel: number;
  readonly maxLevel: number;
  readonly displayRank: number;
  readonly nextRank?: number;
  readonly current?: SkillRankDisplayStats;
  readonly next?: SkillRankDisplayStats;
  readonly maxed: boolean;
}

function clampRank(rank: number, maxLevel: number): number {
  return Math.max(1, Math.min(Math.max(1, Math.floor(maxLevel)), Math.floor(rank)));
}

function scaleValue(base: number, perLevel: number, rank: number): number {
  return Math.round(base + perLevel * Math.max(0, rank - 1));
}

function scaleCost(base: number | undefined, perLevel: number, rank: number): number | undefined {
  if (base === undefined) return undefined;
  return Math.max(0, Math.round(base + perLevel * Math.max(0, rank - 1)));
}

function scaleCooldown(skill: DisplaySkillSource, rank: number): number {
  if (skill.cooldown <= 0 || skill.trigger === 'passive' || skill.trigger === 'aura') return 0;
  const perLevel = skill.scaling?.cooldownPerLevel ?? 0;
  return Math.max(1, Number((skill.cooldown + perLevel * Math.max(0, rank - 1)).toFixed(1)));
}

function damageRows(skill: DisplaySkillSource, rank: number): readonly SkillDamageDisplayRow[] {
  if (!skill.damage) return [];
  const perLevel = skill.scaling?.damagePerLevel ?? 0;
  const totalMin = scaleValue(skill.damage.min, perLevel, rank);
  const totalMax = scaleValue(skill.damage.max, perLevel, rank);
  const breakdown = skill.damage.breakdown;
  const weightedTypes = breakdown
    ? (Object.entries(breakdown) as [DamageType, number][])
        .filter(([, weight]) => weight > 0)
    : [];

  if (weightedTypes.length > 1) {
    const totalWeight = weightedTypes.reduce((sum, [, weight]) => sum + weight, 0);
    if (totalWeight > 0) {
      return weightedTypes.map(([type, weight]) => ({
        type,
        min: Math.round(totalMin * weight / totalWeight),
        max: Math.round(totalMax * weight / totalWeight)
      }));
    }
  }

  const type = skill.damageType ?? weightedTypes[0]?.[0] ?? 'physical';
  return [{ type, min: totalMin, max: totalMax }];
}

function summonCap(skill: DisplaySkillSource, rank: number): number | undefined {
  if (skill.scaling?.summonMaxCount?.kind === 'raise-skeleton-1-6-12-cap-3') {
    return maxSkeletonsForLevel(rank);
  }
  if (skill.scaling?.summonMaxCount?.kind === 'first-three-then-every-three') {
    return maxFirstThreeThenEveryThreeForLevel(rank);
  }
  return skill.summon ? 1 : undefined;
}

/** Resolve a skill's display rows at one rank. */
export function computeSkillRankDisplayStats(
  skill: DisplaySkillSource,
  rank: number
): SkillRankDisplayStats {
  const safeRank = clampRank(rank, skill.maxLevel);
  const damage = damageRows(skill, safeRank);
  const totalDamage = skill.damage
    ? {
        min: scaleValue(skill.damage.min, skill.scaling?.damagePerLevel ?? 0, safeRank),
        max: scaleValue(skill.damage.max, skill.scaling?.damagePerLevel ?? 0, safeRank)
      }
    : undefined;
  const resolvedSummonCap = summonCap(skill, safeRank);
  const manaCost = scaleCost(skill.cost?.mana, skill.scaling?.costPerLevel ?? 0, safeRank);
  const lifeCost = scaleCost(skill.cost?.life, skill.scaling?.costPerLevel ?? 0, safeRank);

  return {
    rank: safeRank,
    damage,
    ...(totalDamage ? { totalDamage } : {}),
    ...(resolvedSummonCap !== undefined ? { summonCap: resolvedSummonCap } : {}),
    ...(manaCost !== undefined ? { manaCost } : {}),
    ...(lifeCost !== undefined ? { lifeCost } : {}),
    cooldown: scaleCooldown(skill, safeRank),
    statuses: skill.appliesStatus ?? [],
    tags: skill.appliesTags ?? []
  };
}

/** Resolve current and next-level display state for a skill allocation. */
export function computeSkillDisplayModel(
  skill: DisplaySkillSource,
  allocatedLevel: number
): SkillDisplayModel {
  const maxLevel = Math.max(1, Math.floor(skill.maxLevel));
  const allocated = Math.max(0, Math.floor(allocatedLevel));
  const displayRank = clampRank(allocated > 0 ? allocated : 1, maxLevel);
  const maxed = allocated >= maxLevel;
  const nextRank = maxed ? undefined : clampRank(allocated > 0 ? allocated + 1 : 1, maxLevel);

  return {
    allocatedLevel: allocated,
    maxLevel,
    displayRank,
    ...(nextRank !== undefined ? { nextRank } : {}),
    ...(allocated > 0 ? { current: computeSkillRankDisplayStats(skill, displayRank) } : {}),
    ...(nextRank !== undefined ? { next: computeSkillRankDisplayStats(skill, nextRank) } : {}),
    maxed
  };
}
