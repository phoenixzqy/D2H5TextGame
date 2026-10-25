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
import type { ColdMasteryTuning, FeralRageTuning, OnHitRecoveryTuning, OnHitSelfDamageTuning, SkillHitSequence, SkillStatusEffectMetadata, StaticFieldTuning } from '../types/skills';
import { STATUS_DEFAULTS } from '../combat/status';
import { coldMasteryReductionAtRank } from './cold-mastery';
import { maxFirstThreeThenEveryThreeForLevel, maxSkeletonsForLevel } from './scaling';
import { getSummonStats } from './summons';
import { applySkeletonMasteryStats, type SkeletonMasteryProjection } from './skeleton-mastery';
import { applyIronGolemItemStats, isIronGolemSkill, type IronGolemInput } from './iron-golem';
import { applyGolemMasteryStats, type GolemMasteryProjection } from './golem-mastery';
import { applySummonPassiveStats, type SummonPassiveProjection } from './summon-passives';
import { SPIRIT_OF_BARBS_DEFINITION, SPIRIT_OF_BARBS_IDS } from './spirit-of-barbs';
import { DRUID_SUMMON_DEFINITION, DRUID_SUMMON_IDS } from './druid-summon-definition';
import { SUMMON_PREPARATION_TEMPLATES } from './summon-preparation';

export interface DisplaySkillSource {
  readonly damageComposition?: 'weighted-components';
  readonly ignoresMagicResist?: true;
  readonly hitSequence?: SkillHitSequence;
  readonly onHitRecovery?: OnHitRecoveryTuning;
  readonly onHitSelfDamage?: OnHitSelfDamageTuning;
  readonly feralRage?: FeralRageTuning;
  readonly coldMastery?: ColdMasteryTuning;
  readonly staticField?: StaticFieldTuning;
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
  readonly statusEffect?: SkillStatusEffectMetadata;
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
  readonly id: 'lifeMax' | 'attack' | 'defense' | 'magicResist' | 'attackSpeed' | 'physDodge' | 'magicDodge' | 'physicalResistance' | 'fireResistance' | 'coldResistance' | 'lightningResistance' | 'arcaneResistance' | 'poisonResistance';
  readonly labelKey: string;
  readonly value: number;
  readonly valueKind: 'flat' | 'percent';
}

export interface SkillSummonDisplayStats {
  readonly summonId: string;
  readonly nameKey: string;
  readonly stats: readonly SkillSummonStatDisplayRow[];
  /** Ordinary unmodified template attacks; this preview grants no runtime authority. */
  readonly attackType?: 'physical';
  readonly effect?: SkillSummonEffectDisplay;
}

/** Authored summon rules, rather than promised damage or recovery from base stats. */
export type SkillSummonEffectDisplay =
  | { readonly kind: 'blind'; readonly hitPenaltyPoints: number; readonly durationSeconds: number }
  | { readonly kind: 'poison'; readonly percentOfHit: number; readonly durationSeconds: number;
      readonly maxStacks: number; readonly minDps: number }
  | { readonly kind: 'corpseRecovery'; readonly resource: 'life' | 'mana'; readonly percentOfOwnerMax: number };

function druidSummonEffect(template: string): SkillSummonEffectDisplay | undefined {
  const d = DRUID_SUMMON_DEFINITION;
  if (template === 'raven') return { kind: 'blind', hitPenaltyPoints: d.raven.physicalHitChancePenalty * 100,
    durationSeconds: STATUS_DEFAULTS.blind.duration };
  if (template === 'poison_creeper') return { kind: 'poison', percentOfHit: d.poison.dotPctOfDamage * 100,
    durationSeconds: STATUS_DEFAULTS.poison.duration, maxStacks: STATUS_DEFAULTS.poison.maxStacks, minDps: 1 };
  if (template === 'carrion_vine' || template === 'solar_creeper') return { kind: 'corpseRecovery',
    resource: template === 'carrion_vine' ? 'life' : 'mana',
    percentOfOwnerMax: (template === 'carrion_vine' ? d.vines.lifeFraction : d.vines.manaFraction) * 100 };
  return undefined;
}

export interface SkillUtilityDisplayRow {
  readonly id: string;
  readonly labelKey: string;
  readonly value: number;
  readonly valueKind: 'flat' | 'percent';
}

export interface SkillRankDisplayStats {
  /** Explicit flat MR bypass; percentage resistance and personal absorption remain. */
  readonly ignoresMagicResist?: true;
  /** One shared hit/critical decision with ordinary matching elemental control durations. */
  readonly composite?: { readonly chillSeconds: number; readonly paralyzeSeconds: number };
  /** Independent attack attempts; the displayed damage range remains per strike. */
  readonly strikesPerCast?: number;
  readonly control?: { readonly durationSeconds: number; readonly bossDurationSeconds: number };
  /** A fixed fraction of actual direct HP removed, never promised healing from base damage. */
  readonly recovery?: { readonly percentOfHpRemoved: number };
  /** Life tradeoff from actual enemy HP removed, never a static per-cast HP price. */
  readonly selfDamage?: { readonly percentOfHpRemoved: number; readonly minimumLifeLoss: number };
  readonly feralRage?: { readonly percentPerStack: number; readonly maxStacks: number; readonly durationSeconds: number };
  /** Explicit primary Bleed/Poison rule; final damage depends on the actual landed hit. */
  readonly periodic?: {
    readonly statusId: 'bleed' | 'poison';
    readonly percentOfHit: number;
    readonly durationSeconds: number;
    readonly maxStacks: number;
    readonly minDps: number;
  };
  /** A rule based on final mitigated hits, never a guaranteed base-damage DPS estimate. */
  readonly burn?: {
    /** Composite Burn derives its potency from this component alone. */
    readonly component?: 'fire';
    readonly percentOfHit: number;
    readonly durationSeconds: number;
    readonly maxStacks: number;
    readonly minDps: number;
  };
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

function burnDisplay(skill: DisplaySkillSource): SkillRankDisplayStats['burn'] {
  const id = skill.appliesStatus?.[0], fraction = skill.statusEffect?.dotPctOfDamage;
  if (!skill.damage || skill.damageType !== 'fire' || skill.trigger !== 'active' ||
    (id !== 'burn' && id !== 'ignite') || fraction === undefined ||
    !Number.isFinite(fraction) || fraction <= 0 ||
    (skill.statusEffect?.chance ?? 1) !== 1 || (skill.statusEffect?.stacksOnApply ?? 1) !== 1) return undefined;
  return { percentOfHit: Number((fraction * 100).toFixed(4)),
    ...(skill.id === 'skills-paladin-vengeance' && skill.damageComposition === 'weighted-components'
      ? { component: 'fire' as const } : {}),
    durationSeconds: STATUS_DEFAULTS.ignite.duration, maxStacks: STATUS_DEFAULTS.ignite.maxStacks, minDps: 1 };
}

function periodicDisplay(skill: DisplaySkillSource): SkillRankDisplayStats['periodic'] {
  const id = skill.appliesStatus?.[0], metadata = skill.statusEffect,
    fraction = metadata?.dotPctOfDamage, durationMs = metadata?.durationMs;
  if (!skill.damage || skill.trigger !== 'active' || skill.appliesStatus?.length !== 1 ||
    (id !== 'bleed' && id !== 'poison') ||
    skill.damageType !== (id === 'bleed' ? 'physical' : 'poison') ||
    fraction === undefined || !Number.isFinite(fraction) || fraction <= 0 ||
    (metadata?.chance ?? 1) !== 1 || (metadata?.stacksOnApply ?? 1) !== 1 ||
    // The generic damage adapter forwards potency, chance and stack count, but no primary duration override.
    durationMs !== undefined) return undefined;
  return { statusId: id, percentOfHit: Number((fraction * 100).toFixed(4)),
    durationSeconds: STATUS_DEFAULTS[id].duration,
    maxStacks: STATUS_DEFAULTS[id].maxStacks, minDps: 1 };
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
  if (SPIRIT_OF_BARBS_IDS.some(id => skill.id === id)) return 1;
  if (skill.scaling?.summonMaxCount?.kind === 'raise-skeleton-1-6-12-cap-3') {
    return maxSkeletonsForLevel(rank);
  }
  if (skill.scaling?.summonMaxCount?.kind === 'first-three-then-every-three') {
    return maxFirstThreeThenEveryThreeForLevel(rank);
  }
  return skill.summon ? 1 : undefined;
}

function inferSummonId(skill: DisplaySkillSource): string | undefined {
  if (SPIRIT_OF_BARBS_IDS.some(id => skill.id === id)) return SPIRIT_OF_BARBS_DEFINITION.summonId;
  if (skill.summonId) return skill.summonId;
  if (skill.id === 'skills-necromancer-raise-skeleton' || skill.id === 'necromancer.raise_skeleton') {
    return 'skeleton';
  }
  return undefined;
}

function summonUnit(
  skill: DisplaySkillSource,
  rank: number,
  mastery: SkeletonMasteryProjection | undefined,
  ironGolem: Pick<IronGolemInput, 'life' | 'attack' | 'defense'> | undefined,
  golemMastery: GolemMasteryProjection | undefined,
  global: SummonPassiveProjection | undefined
): SkillSummonDisplayStats | undefined {
  const summonId = inferSummonId(skill);
  if (!summonId) return undefined;
  const canonical = skill.id.startsWith('skills-druid-')
    ? 'druid.' + skill.id.slice('skills-druid-'.length).replaceAll('-', '_') : skill.id;
  const druid = canonical.startsWith('druid.') && skill.trigger === 'active' &&
    skill.target === 'summon' && skill.summon === true &&
    SUMMON_PREPARATION_TEMPLATES[canonical] === summonId &&
    DRUID_SUMMON_IDS.some(id => id === summonId);
  const effect = druid ? druidSummonEffect(summonId) : undefined;
  const baseStats = getSummonStats(summonId, {
    skillLevel: rank,
    statScaling: skill.scaling?.summonStatsPerLevel
  });
  if (!baseStats) return undefined;
  const receivesMastery = (skill.summonId === 'skeleton' &&
    (skill.id === 'skills-necromancer-raise-skeleton' || skill.id === 'necromancer.raise_skeleton')) ||
    (skill.summonId === 'skeletal_mage' &&
      (skill.id === 'skills-necromancer-raise-skeletal-mage' || skill.id === 'necromancer.raise_skeletal_mage'));
  let baseline = baseStats;
  let stats = receivesMastery ? applySkeletonMasteryStats(baseStats, mastery) : baseStats;
  if (ironGolem !== undefined && skill.summonId === 'iron_golem' && isIronGolemSkill(skill)) {
    const inherited = applyIronGolemItemStats(baseStats, ironGolem);
    if (!inherited) return undefined;
    stats = inherited;
    baseline = inherited;
  }
  const exactGolem = ['clay', 'blood', 'iron', 'fire'].some(type =>
    skill.summonId === `${type}_golem` &&
    (skill.id === `skills-necromancer-${type}-golem` || skill.id === `necromancer.${type}_golem`));
  if (exactGolem) {
    const empowered = applyGolemMasteryStats(stats, golemMastery);
    if (!empowered) return undefined;
    stats = empowered;
  }
  const exactNecromancer = receivesMastery || exactGolem || (summonId === 'revived' &&
    (skill.id === 'skills-necromancer-revive' || skill.id === 'necromancer.revive'));
  if (exactNecromancer) {
    const combined = applySummonPassiveStats(baseline, stats, summonId, global);
    if (!combined) return undefined;
    stats = combined;
  }
  const resistanceRows: SkillSummonStatDisplayRow[] = druid || (exactNecromancer && global?.resistRank)
    ? (['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison'] as const).map(type => ({
      id: `${type}Resistance`, labelKey: `details.summonStat.${type}Resistance`,
      value: stats.resistances[type] / 100, valueKind: 'percent' })) : [];
  return {
    summonId,
    nameKey: `details.summonName.${summonId}`,
    ...(druid ? { attackType: 'physical' as const } : {}),
    ...(effect ? { effect } : {}),
    stats: [
      ...resistanceRows,
      { id: 'lifeMax', labelKey: 'details.summonStat.lifeMax', value: stats.lifeMax, valueKind: 'flat' },
      { id: 'attack', labelKey: 'details.summonStat.attack', value: stats.attack, valueKind: 'flat' },
      { id: 'defense', labelKey: 'details.summonStat.defense', value: stats.defense, valueKind: 'flat' },
      ...(exactGolem || druid ? [{ id: 'attackSpeed' as const, labelKey: 'details.summonStat.attackSpeed',
        value: stats.attackSpeed, valueKind: 'flat' as const }] : []),
      ...(druid ? [
        { id: 'magicResist' as const, labelKey: 'details.summonStat.magicResist', value: stats.magicResist, valueKind: 'flat' as const },
        { id: 'physDodge' as const, labelKey: 'details.summonStat.physDodge', value: stats.physDodge, valueKind: 'percent' as const },
        { id: 'magicDodge' as const, labelKey: 'details.summonStat.magicDodge', value: stats.magicDodge, valueKind: 'percent' as const }
      ] : [])
    ]
  };
}

function passiveUtilityRows(skill: DisplaySkillSource, rank: number): readonly SkillUtilityDisplayRow[] {
  if (skill.id === 'skills-sorceress-static-field' && skill.staticField) {
    return [
      { id: 'staticFieldCurrentHealth', labelKey: 'details.staticField.currentHealth',
        value: skill.staticField.currentHealthFraction, valueKind: 'percent' },
      { id: 'staticFieldNightmareFloor', labelKey: 'details.staticField.nightmareFloor',
        value: skill.staticField.nightmareFloorFraction, valueKind: 'percent' }
    ];
  }
  if (skill.id === 'skills-sorceress-cold-mastery' && skill.coldMastery) {
    return [{ id: 'coldResistanceReductionPct',
      labelKey: 'details.passiveStat.coldResistanceReductionPct',
      value: coldMasteryReductionAtRank(rank, { ...skill.coldMastery, maxRank: skill.maxLevel }) / 100,
      valueKind: 'percent' }];
  }
  const scaling = skill.scaling?.passiveStatsPerLevel;
  if (!scaling) return [];
  const multiplier = Math.max(1, rank);
  if (skill.id === 'skills-druid-cyclone-armor' &&
    scaling.shieldAbsorbPct !== undefined && scaling.resistAllPct !== undefined) {
    return [
      { id: 'shieldAbsorbPct', labelKey: 'details.passiveStat.cycloneArmorReduction',
        value: Number((scaling.shieldAbsorbPct * multiplier).toFixed(4)), valueKind: 'percent' },
      { id: 'resistAllPct', labelKey: 'details.passiveStat.cycloneArmorResistance',
        value: Number((scaling.resistAllPct * 100 * multiplier).toFixed(4)), valueKind: 'flat' }
    ];
  }
  const rows: SkillUtilityDisplayRow[] = [];
  const push = (id: keyof PassiveStatsPerLevel, valueKind: 'flat' | 'percent') => {
    const perRank = scaling[id];
    if (perRank === undefined) return;
    rows.push({
      id,
      labelKey: id === 'shieldAbsorbPct' && skill.id === 'skills-sorceress-energy-shield'
        ? 'details.passiveStat.energyShieldAbsorbPct' : `details.passiveStat.${id}`,
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
  if (skill.id === 'skills-druid-elemental-mastery' && scaling.elementalDamagePct !== undefined) {
    for (const type of ['fire', 'cold'] as const) {
      rows.push({ id: type + 'DamagePct', labelKey: `details.passiveStat.${type}DamagePct`,
        value: Number((scaling.elementalDamagePct * multiplier).toFixed(4)), valueKind: 'percent' });
    }
  } else push('elementalDamagePct', 'percent');
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

/**
 * Resolve one rank with current eligible Mastery and optional isolated Iron item bonuses.
 * Item bonuses affect only exact Iron skill/template identities; invalid inherited
 * stats omit the summon preview. An absent item context retains ordinary base rows.
 * Golem Mastery follows rank scaling and optional Iron inheritance. Preview
 * contexts establish neither hero qualification nor payment authorization.
 */
export function computeSkillRankDisplayStats(
  skill: DisplaySkillSource,
  rank: number,
  mastery?: SkeletonMasteryProjection,
  ironGolem?: Pick<IronGolemInput, 'life' | 'attack' | 'defense'>,
  golemMastery?: GolemMasteryProjection,
  global?: SummonPassiveProjection
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
  const resolvedSummonUnit = summonUnit(skill, safeRank, mastery, ironGolem, golemMastery, global);
  const utility = passiveUtilityRows(skill, safeRank);
  const manaCost = scaleCost(skill.cost?.mana, skill.scaling?.costPerLevel ?? 0, safeRank);
  const lifeCost = scaleCost(skill.cost?.life, skill.scaling?.costPerLevel ?? 0, safeRank);
  const burn = burnDisplay(skill);
  const periodic = periodicDisplay(skill);
  const ignoresMagicResist = skill.id === 'skills-paladin-blessed-hammer' && skill.trigger === 'active' &&
    skill.damageType === 'arcane' && skill.ignoresMagicResist === true;
  const composite = skill.id === 'skills-paladin-vengeance' && skill.trigger === 'active' &&
    skill.damageComposition === 'weighted-components'
    ? { chillSeconds: STATUS_DEFAULTS.chill.duration, paralyzeSeconds: STATUS_DEFAULTS.paralyze.duration } : undefined;
  const strikes = skill.hitSequence?.strikes;
  const strikesPerCast = skill.id === 'skills-druid-fury' && skill.trigger === 'active' && skill.damage &&
    strikes !== undefined && Number.isInteger(strikes) && strikes >= 2 && strikes <= 8 ? strikes : undefined;
  const controlId = skill.appliesStatus?.[0];
  const controlDefinition = skill.damage && skill.trigger === 'active' &&
    (controlId === 'chill' || controlId === 'stun') ? STATUS_DEFAULTS[controlId] : undefined;
  const control = controlDefinition ? { durationSeconds: controlDefinition.duration,
    bossDurationSeconds: controlDefinition.duration * (controlDefinition.bossDurationMult ?? 1) } : undefined;
  const selfCost = skill.onHitSelfDamage;
  const selfDamage = skill.id === 'skills-paladin-sacrifice' && skill.trigger === 'active' &&
    skill.damageType === 'physical' && selfCost && Number.isFinite(selfCost.lifeFraction) &&
    selfCost.lifeFraction > 0 && selfCost.lifeFraction <= 1 &&
    Number.isInteger(selfCost.minimumLifeLoss) && selfCost.minimumLifeLoss > 0
    ? { percentOfHpRemoved: Number((selfCost.lifeFraction * 100).toFixed(4)), minimumLifeLoss: selfCost.minimumLifeLoss } : undefined;
  const fraction = skill.onHitRecovery?.lifeFraction;
  const recovery = skill.damage && skill.trigger === 'active' && fraction !== undefined &&
    Number.isFinite(fraction) && fraction > 0 && fraction <= 1
    ? { percentOfHpRemoved: Number((fraction * 100).toFixed(4)) } : undefined;
  const tuning = skill.feralRage;
  const feralRage = recovery && skill.id === 'skills-druid-feral-rage' && tuning &&
    Number.isFinite(tuning.attackSpeedPctPerStack) && tuning.attackSpeedPctPerStack > 0 &&
    Number.isInteger(tuning.maxStacks) && tuning.maxStacks > 0 &&
    Number.isFinite(tuning.durationMs) && tuning.durationMs > 0
    ? { percentPerStack: Number((tuning.attackSpeedPctPerStack * 100).toFixed(4)),
        maxStacks: tuning.maxStacks, durationSeconds: tuning.durationMs / 1000 } : undefined;

  return {
    rank: safeRank,
    ...(ignoresMagicResist ? { ignoresMagicResist: true as const } : {}),
    ...(composite ? { composite } : {}),
    ...(strikesPerCast !== undefined ? { strikesPerCast } : {}),
    ...(control ? { control } : {}),
    ...(recovery ? { recovery } : {}),
    ...(selfDamage ? { selfDamage } : {}),
    ...(feralRage ? { feralRage } : {}),
    ...(burn ? { burn } : {}),
    ...(periodic ? { periodic } : {}),
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

/** Resolve current/next ranks using the same eligible Mastery and isolated Iron item context. */
export function computeSkillDisplayModel(
  skill: DisplaySkillSource,
  allocatedLevel: number,
  mastery?: SkeletonMasteryProjection,
  ironGolem?: Pick<IronGolemInput, 'life' | 'attack' | 'defense'>,
  golemMastery?: GolemMasteryProjection,
  global?: SummonPassiveProjection
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
    ...(allocated > 0 ? { current: computeSkillRankDisplayStats(skill, displayRank, mastery, ironGolem, golemMastery, global) } : {}),
    ...(nextRank !== undefined ? { next: computeSkillRankDisplayStats(skill, nextRank, mastery, ironGolem, golemMastery, global) } : {}),
    maxed
  };
}
