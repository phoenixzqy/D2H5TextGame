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
import { getSummonStats } from './summons';

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
  readonly summonId?: string;
  readonly scaling?: {
    readonly damagePerLevel?: number;
    readonly cooldownPerLevel?: number;
    readonly costPerLevel?: number;
    readonly summonMaxCount?: {
      readonly kind: 'first-three-then-every-three' | 'raise-skeleton-1-6-12-cap-3';
    };
    readonly summonStatsPerLevel?: {
      readonly lifeMax?: number;
      readonly attack?: number;
      readonly defense?: number;
      readonly attackSpeed?: number;
      readonly physDodge?: number;
      readonly magicDodge?: number;
    };
    readonly passiveStatsPerLevel?: {
      readonly summonLifePct?: number;
      readonly summonAttackPct?: number;
      readonly summonDefensePct?: number;
      readonly summonResistAllPct?: number;
      readonly fireDamagePct?: number;
      readonly coldDamagePct?: number;
      readonly lightningDamagePct?: number;
      readonly poisonDamagePct?: number;
      readonly arcaneDamagePct?: number;
      readonly physicalDamagePct?: number;
      readonly elementalDamagePct?: number;
      readonly attackPct?: number;
      readonly attackSpeedPct?: number;
      readonly critChancePct?: number;
      readonly lifePct?: number;
      readonly lifeRegenPct?: number;
      readonly resistAllPct?: number;
      readonly thornsPct?: number;
      readonly defensePct?: number;
      readonly physDodgePct?: number;
      readonly magicDodgePct?: number;
      readonly manaRegenPct?: number;
      readonly magicFindPct?: number;
      readonly shieldAbsorbPct?: number;
      readonly boneArmorAbsorb?: number;
      readonly golemLifePct?: number;
      readonly golemAttackSpeed?: number;
    };
  };
}

type PassiveStatsPerLevel = NonNullable<NonNullable<DisplaySkillSource['scaling']>['passiveStatsPerLevel']>;

export interface SkillDamageDisplayRow {
  readonly type: DamageType;
  readonly min: number;
  readonly max: number;
}

export interface SkillSummonStatDisplayRow {
  readonly id: 'lifeMax' | 'attack' | 'defense' | 'attackSpeed' | 'physDodge' | 'magicDodge';
  readonly labelKey: string;
  readonly value: number;
  readonly valueKind: 'flat' | 'percent';
}

export interface SkillSummonDisplayStats {
  readonly summonId: string;
  readonly nameKey: string;
  readonly stats: readonly SkillSummonStatDisplayRow[];
}

export interface SkillUtilityDisplayRow {
  readonly id: string;
  readonly labelKey: string;
  readonly value: number;
  readonly valueKind: 'flat' | 'percent';
}

export interface SkillRankDisplayStats {
  readonly rank: number;
  readonly damage: readonly SkillDamageDisplayRow[];
  readonly totalDamage?: {
    readonly min: number;
    readonly max: number;
  };
  readonly summonCap?: number;
  readonly summonUnit?: SkillSummonDisplayStats;
  readonly utility: readonly SkillUtilityDisplayRow[];
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

function inferSummonId(skill: DisplaySkillSource): string | undefined {
  if (skill.summonId) return skill.summonId;
  if (skill.id === 'skills-necromancer-raise-skeleton' || skill.id === 'necromancer.raise_skeleton') {
    return 'skeleton';
  }
  return undefined;
}

function summonUnit(skill: DisplaySkillSource, rank: number): SkillSummonDisplayStats | undefined {
  const summonId = inferSummonId(skill);
  if (!summonId) return undefined;
  const stats = getSummonStats(summonId, {
    skillLevel: rank,
    statScaling: skill.scaling?.summonStatsPerLevel
  });
  if (!stats) return undefined;
  return {
    summonId,
    nameKey: `details.summonName.${summonId}`,
    stats: [
      { id: 'lifeMax', labelKey: 'details.summonStat.lifeMax', value: stats.lifeMax, valueKind: 'flat' },
      { id: 'attack', labelKey: 'details.summonStat.attack', value: stats.attack, valueKind: 'flat' },
      { id: 'defense', labelKey: 'details.summonStat.defense', value: stats.defense, valueKind: 'flat' }
    ]
  };
}

function passiveUtilityRows(skill: DisplaySkillSource, rank: number): readonly SkillUtilityDisplayRow[] {
  const scaling = skill.scaling?.passiveStatsPerLevel;
  if (!scaling) return [];
  const multiplier = Math.max(1, rank);
  const rows: SkillUtilityDisplayRow[] = [];
  const push = (id: keyof PassiveStatsPerLevel, valueKind: 'flat' | 'percent') => {
    const perRank = scaling[id];
    if (perRank === undefined) return;
    rows.push({
      id,
      labelKey: `details.passiveStat.${id}`,
      value: Number((perRank * multiplier).toFixed(4)),
      valueKind
    });
  };
  push('summonLifePct', 'percent');
  push('summonAttackPct', 'percent');
  push('summonDefensePct', 'percent');
  push('summonResistAllPct', 'percent');
  push('fireDamagePct', 'percent');
  push('coldDamagePct', 'percent');
  push('lightningDamagePct', 'percent');
  push('poisonDamagePct', 'percent');
  push('arcaneDamagePct', 'percent');
  push('physicalDamagePct', 'percent');
  push('elementalDamagePct', 'percent');
  push('attackPct', 'percent');
  push('attackSpeedPct', 'percent');
  push('critChancePct', 'percent');
  push('lifePct', 'percent');
  push('lifeRegenPct', 'percent');
  push('resistAllPct', 'percent');
  push('thornsPct', 'percent');
  push('defensePct', 'percent');
  push('physDodgePct', 'percent');
  push('magicDodgePct', 'percent');
  push('manaRegenPct', 'percent');
  push('magicFindPct', 'percent');
  push('shieldAbsorbPct', 'percent');
  push('boneArmorAbsorb', 'flat');
  push('golemLifePct', 'percent');
  push('golemAttackSpeed', 'flat');
  return rows;
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
  const resolvedSummonUnit = summonUnit(skill, safeRank);
  const utility = passiveUtilityRows(skill, safeRank);
  const manaCost = scaleCost(skill.cost?.mana, skill.scaling?.costPerLevel ?? 0, safeRank);
  const lifeCost = scaleCost(skill.cost?.life, skill.scaling?.costPerLevel ?? 0, safeRank);

  return {
    rank: safeRank,
    damage,
    ...(totalDamage ? { totalDamage } : {}),
    ...(resolvedSummonCap !== undefined ? { summonCap: resolvedSummonCap } : {}),
    ...(resolvedSummonUnit ? { summonUnit: resolvedSummonUnit } : {}),
    utility,
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
