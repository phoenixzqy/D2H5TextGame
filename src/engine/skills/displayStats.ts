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
import type { AoeShape } from '../combat/grid';
import type { ColdMasteryTuning, FeralRageTuning, HitSpeedStackTuning, OnHitRecoveryTuning, OnHitSelfDamageTuning, SkillHitSequence, SkillStatusEffectMetadata, SkillAdditionalStatusEffects, StaticFieldTuning } from '../types/skills';
import { STATUS_DEFAULTS } from '../combat/status';
import { CHILL_DEFINITION } from '../combat/chill-definition';
import { paidBattleCry } from '../combat/warcry-definition';
import { isDecrepifyDefinition, resolveDecrepifyDefinition } from '../combat/decrepify-definition';
import { isWeakenDefinition, resolveWeakenDefinition } from '../combat/weaken-definition';
import { isDimVisionDefinition, resolveDimVisionDefinition } from '../combat/dim-vision-definition';
import { isTerrorDefinition, resolveTerrorDefinition } from '../combat/terror-definition';
import { targetCurseId, resolveTargetCurseDefinition, type TargetCurseId } from '../combat/target-curse-definition';
import { resolveDamageCurseDefinition, type DamageCurseId } from '../combat/damage-curse-definition';
import { MANA_BURN_DEFINITION } from '../combat/mana-burn-definition';
import { coldMasteryReductionAtRank } from './cold-mastery';
import { maxFirstThreeThenEveryThreeForLevel, maxSkeletonsForLevel } from './scaling';
import { getSummonStats } from './summons';
import { applySkeletonMasteryStats, type SkeletonMasteryProjection } from './skeleton-mastery';
import { applyIronGolemItemStats, isIronGolemSkill, type IronGolemInput } from './iron-golem';
import { applyGolemMasteryStats, type GolemMasteryProjection } from './golem-mastery';
import { applySummonPassiveStats, type SummonPassiveProjection } from './summon-passives';
import { SPIRIT_OF_BARBS_DEFINITION, SPIRIT_OF_BARBS_IDS } from './spirit-of-barbs';
import { DRUID_SUMMON_DEFINITION, DRUID_SUMMON_IDS } from './druid-summon-definition';
import { FIRE_GOLEM_DEFINITION, FIRE_GOLEM_IDS } from './fire-golem';
import { BLOOD_GOLEM_DEFINITION, BLOOD_GOLEM_IDS } from './blood-golem';
import { SUMMON_PREPARATION_TEMPLATES } from './summon-preparation';
import { HYDRA_DEFINITION, hydraBodyStats } from './hydra';

export interface DisplaySkillSource {
  readonly skillRankBuff?: import('../types/skills').SkillDef['skillRankBuff'];
  readonly corpseWard?: import('../types/skills').SkillDef['corpseWard'];
  readonly corpseSearch?: import('../types/skills').SkillDef['corpseSearch'];
  readonly corpseRecovery?: import('../types/skills').SkillDef['corpseRecovery'];
  readonly hydra?: import('../types/skills').SkillDef['hydra'];
  readonly enchantOnPhysicalHit?: { readonly attackPctPerRank: number };
  readonly periodicSpell?: { readonly durationMs: number; readonly intervalMs: number; readonly channelled?: true };
  readonly armorRetaliation?: import('../types/skills').ArmorRetaliationTuning;
  readonly attackDamagePct?: number;
  readonly timedBuff?: { readonly durationMs: number };
  readonly aoeShape?: AoeShape;
  readonly maxTargets?: number;
  readonly damageComposition?: 'weighted-components';
  readonly ignoresMagicResist?: true;
  readonly ignoresDefense?: true;
  readonly hitSequence?: SkillHitSequence;
  readonly critChanceBonus?: number;
  readonly onHitRecovery?: OnHitRecoveryTuning;
  readonly onHitSelfDamage?: OnHitSelfDamageTuning;
  readonly feralRage?: FeralRageTuning;
  readonly frenzy?: HitSpeedStackTuning;
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
  readonly additionalStatusEffects?: SkillAdditionalStatusEffects;
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
  readonly attackType?: 'physical' | 'fire';
  readonly effect?: SkillSummonEffectDisplay;
}

/** Authored summon rules, rather than promised damage or recovery from base stats. */
export type SkillSummonEffectDisplay =
  | { readonly kind: 'lifeLeech'; readonly percentOfDamage: number }
  | { readonly kind: 'blind'; readonly hitPenaltyPoints: number; readonly durationSeconds: number }
  | { readonly kind: 'poison'; readonly percentOfHit: number; readonly durationSeconds: number;
      readonly maxStacks: number; readonly minDps: number }
  | { readonly kind: 'burn'; readonly percentOfHit: number; readonly durationSeconds: number;
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
  /** Finite party potency changes effective ranks, never permanent allocations. */
  readonly skillRankBuff?: { readonly bonusRanks: number; readonly durationSeconds: number };
  /** Wave-local paid ward timing; fear reuses ordinary timed Howl interruption. */
  readonly corpseWard?: { readonly durationSeconds: number; readonly intervalSeconds: number;
    readonly fearSeconds: number; readonly bossFearSeconds: number };
  /** Probability of one bonus ordinary loot roll, collected only on victory. */
  readonly corpseSearch?: { readonly successPercent: number };
  /** One shared corpse restores these independent percentages, capped after payment. */
  readonly corpseRecovery?: { readonly lifePercent: number; readonly manaPercent: number };
  /** Independent body attacks; damage rows describe one head's bolt. */
  readonly hydra?: { readonly heads: number; readonly durationSeconds: number };
  /** Finite personal paid potency; Enchant is a weapon Fire base, not spell damage. */
  readonly sorceressBuff?: { readonly durationSeconds: number;
    readonly magicDodgePoints?: number; readonly enchantAttackPercent?: number };
  /** Persistent spell damage rows are per pulse, not totals or a once-only cast. */
  readonly periodicSpell?: { readonly durationSeconds: number; readonly intervalSeconds: number; readonly pulses: number;
    readonly channelled?: true };
  /** Counterattack range, distinct from direct damage at buff-cast time. */
  readonly coldArmor?: { readonly min: number; readonly max: number;
    readonly freezeSeconds: number; readonly bossFreezeSeconds: number };
  /** Authored cold-attack control, including Frost Nova's independent secondary roll. */
  readonly coldAttack?: { readonly durationSeconds: number; readonly slowPercent: number;
    readonly freeze?: { readonly chancePercent: number; readonly durationSeconds: number; readonly bossDurationSeconds: number } };
  /** Paid hostile warcry interval and, for Battle Cry, rank-scaled reductions. */
  readonly warcry?: { readonly durationSeconds: number; readonly damageReductionPercent?: number;
    readonly defenseReductionPercent?: number };
  /** Complete finite hostile curse; AttackSpeed reduction precedes normal cadence clamps. */
  readonly decrepify?: { readonly durationSeconds: number; readonly attackSpeedReductionPercent: number;
    readonly damageReductionPercent: number };
  /** Complete finite outgoing direct-damage curse, independent of action speed. */
  readonly weaken?: { readonly durationSeconds: number; readonly damageReductionPercent: number };
  /** Paid finite Physical/Thorns accuracy penalty in percentage points. */
  readonly dimVision?: { readonly durationSeconds: number; readonly physicalHitChanceReductionPoints: number };
  /** One complete finite offensive target-redirection curse, preserving its exact identity. */
  readonly targetCurse?: { readonly id: TargetCurseId; readonly durationSeconds: number };
  /** One validated finite paid reflection, healing, or resistance curse. */
  readonly damageCurse?: { readonly id: DamageCurseId; readonly durationSeconds: number; readonly percent: number };
  /** Paid personal Defense interval and Attack converted into an Arcane hit. */
  readonly concentrate?: { readonly durationSeconds: number };
  readonly convertedAttackPercent?: number;
  /** Paid finite personal Leap physical follow-up. */
  readonly leap?: { readonly durationSeconds: number };
  /** Paid personal bonuses and enemy Blind share this explicit finite duration. */
  readonly cloak?: { readonly durationSeconds: number; readonly blindHitPenaltyPoints: number };
  /** Explicit authored cone footprint; it counts covered cells, not enemy slots. */
  readonly areaShape?: 'cone-2';
  /** Authored limit after resolving the full area and its ordinary target order. */
  readonly maxTargets?: number;
  /** Explicit flat MR bypass; percentage resistance and personal absorption remain. */
  readonly ignoresMagicResist?: true;
  /** Explicit ordinary Defense bypass; hit rolls and percentage resistance remain. */
  readonly ignoresDefense?: true;
  /** One shared hit/critical decision with ordinary matching elemental control durations. */
  readonly composite?: { readonly chillSeconds: number; readonly paralyzeSeconds: number };
  /** Independent attack attempts; the displayed damage range remains per strike. */
  readonly strikesPerCast?: number;
  /** Independent attempts per original target; actual cast total depends on the pool. */
  readonly strikesPerTarget?: number;
  /** Percentage points added by this skill, not the attacker's total critical chance. */
  readonly criticalBonusPoints?: number;
  readonly control?: { readonly durationSeconds: number; readonly bossDurationSeconds: number };
  /** Shared HP-based MP debit and conditional direct Arcane amplification. */
  readonly manaBurn?: { readonly drainPercent: number; readonly zeroManaArcaneBonusPercent: number;
    readonly untilManaRestored: true };
  /** A fixed fraction of actual direct HP removed, never promised healing from base damage. */
  readonly recovery?: { readonly percentOfHpRemoved: number };
  /** Life tradeoff from actual enemy HP removed, never a static per-cast HP price. */
  readonly selfDamage?: { readonly percentOfHpRemoved: number; readonly minimumLifeLoss: number };
  readonly feralRage?: { readonly percentPerStack: number; readonly maxStacks: number; readonly durationSeconds: number };
  readonly frenzy?: { readonly percentPerStack: number; readonly maxStacks: number; readonly durationSeconds: number };
  /** Explicit primary Bleed/Poison rule; final damage depends on the actual landed hit. */
  readonly periodic?: {
    readonly statusId: 'bleed' | 'poison';
    /** Present for a validated multi-stack application; absent means one. */
    readonly stacksOnApply?: number;
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
    ...(['skills-paladin-vengeance', 'skills-assassin-phoenix-strike'].includes(skill.id) && skill.damageComposition === 'weighted-components'
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
    (metadata?.chance ?? 1) !== 1 ||
    // The generic damage adapter forwards potency, chance and stack count, but no primary duration override.
    durationMs !== undefined) return undefined;
  const stacks = metadata?.stacksOnApply ?? 1;
  if (!Number.isInteger(stacks) || stacks < 1 || stacks > STATUS_DEFAULTS[id].maxStacks) return undefined;
  return { statusId: id, ...(stacks > 1 ? { stacksOnApply: stacks } : {}),
    percentOfHit: Number((fraction * 100).toFixed(4)),
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
  if (skill.id === 'skills-sorceress-hydra' && skill.hydra && skill.target === 'summon') {
    const body = hydraBodyStats();
    return { summonId, nameKey: 'combat:summons.hydra', stats: [
      ...(['lifeMax', 'defense', 'magicResist', 'attackSpeed'] as const).map(id => ({
        id, labelKey: `details.summonStat.${id}`, value: body[id], valueKind: 'flat' as const })),
      ...(['physDodge', 'magicDodge'] as const).map(id => ({
        id, labelKey: `details.summonStat.${id}`, value: body[id], valueKind: 'percent' as const })),
      ...(['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison'] as const).map(type => ({
        id: `${type}Resistance` as const, labelKey: `details.summonStat.${type}Resistance`,
        value: body.resistances[type] / 100, valueKind: 'percent' as const }))
    ] };
  }
  const canonical = skill.id.startsWith('skills-druid-')
    ? 'druid.' + skill.id.slice('skills-druid-'.length).replaceAll('-', '_') : skill.id;
  const druid = canonical.startsWith('druid.') && skill.trigger === 'active' &&
    skill.target === 'summon' && skill.summon === true &&
    SUMMON_PREPARATION_TEMPLATES[canonical] === summonId &&
    DRUID_SUMMON_IDS.some(id => id === summonId);
  const fireGolem = FIRE_GOLEM_IDS.some(id => id === skill.id) && skill.trigger === 'active' &&
    skill.target === 'summon' && skill.summon === true && summonId === 'fire_golem';
  const bloodGolem = BLOOD_GOLEM_IDS.some(id => id === skill.id) && skill.trigger === 'active' &&
    skill.target === 'summon' && skill.summon === true && summonId === 'blood_golem';
  const effect: SkillSummonEffectDisplay | undefined = fireGolem
    ? { kind: 'burn', percentOfHit: FIRE_GOLEM_DEFINITION.attack.dotPctOfDamage * 100,
      durationSeconds: STATUS_DEFAULTS.ignite.duration, maxStacks: STATUS_DEFAULTS.ignite.maxStacks, minDps: 1 }
    : bloodGolem ? { kind: 'lifeLeech', percentOfDamage: BLOOD_GOLEM_DEFINITION.lifeLeechFraction * 100 }
    : druid ? druidSummonEffect(summonId) : undefined;
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
  const resistanceRows: SkillSummonStatDisplayRow[] = druid || fireGolem || bloodGolem || (exactNecromancer && global?.resistRank)
    ? (['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison'] as const).map(type => ({
      id: `${type}Resistance`, labelKey: `details.summonStat.${type}Resistance`,
      value: stats.resistances[type] / 100, valueKind: 'percent' })) : [];
  return {
    summonId,
    nameKey: `details.summonName.${summonId}`,
    ...(fireGolem ? { attackType: 'fire' as const } : druid || bloodGolem ? { attackType: 'physical' as const } : {}),
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
        ? 'details.passiveStat.energyShieldAbsorbPct'
        : id === 'shieldAbsorbPct' && skill.id === 'skills-paladin-holy-shield'
          ? 'details.passiveStat.holyShieldReduction' : `details.passiveStat.${id}`,
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
  const decrepify = skill.id === 'skills-necromancer-decrepify' && isDecrepifyDefinition(skill)
    ? resolveDecrepifyDefinition([skill]) : undefined;
  const weaken = skill.id === 'skills-necromancer-weaken' && isWeakenDefinition(skill)
    ? resolveWeakenDefinition([skill]) : undefined;
  const dimVision = skill.id === 'skills-necromancer-dim-vision' && isDimVisionDefinition(skill)
    ? resolveDimVisionDefinition([skill]) : undefined;
  const terror = skill.id === 'skills-necromancer-terror' && isTerrorDefinition(skill)
    ? resolveTerrorDefinition([skill]) : undefined;
  const damageCurse = resolveDamageCurseDefinition(skill);
  const targeting = targetCurseId(skill);
  const targetCurse = targeting === undefined ? undefined : resolveTargetCurseDefinition([skill], targeting);
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
  const ignoresDefense = skill.id === 'skills-amazon-impale' && skill.trigger === 'active' &&
    skill.damageType === 'physical' && skill.ignoresDefense === true;
  const composite = ['skills-paladin-vengeance', 'skills-assassin-phoenix-strike'].includes(skill.id) && skill.trigger === 'active' &&
    skill.damageComposition === 'weighted-components'
    ? { chillSeconds: STATUS_DEFAULTS.chill.duration, paralyzeSeconds: STATUS_DEFAULTS.paralyze.duration } : undefined;
  const strikes = skill.hitSequence?.strikes;
  const supportsSequence = skill.id === 'skills-druid-fury' ||
    (skill.id === 'skills-barbarian-frenzy' && skill.target === 'single-enemy' && skill.damageType === 'physical' &&
      skill.aoeShape === undefined && skill.hitSequence?.targetMode === undefined && strikes === 2) ||
    (skill.id === 'skills-barbarian-double-throw' && skill.target === 'area-enemies' &&
      skill.damageType === 'physical' && skill.aoeShape === undefined &&
      skill.hitSequence?.targetMode === undefined && strikes === 2) ||
    (['skills-amazon-jab', 'skills-assassin-dragon-talon', 'skills-assassin-dragon-claw'].includes(skill.id) &&
    skill.target === 'single-enemy' && skill.damageType === 'physical');
  const strikesPerCast = supportsSequence && skill.trigger === 'active' && skill.damage &&
    strikes !== undefined && Number.isInteger(strikes) && strikes >= 2 && strikes <= 8 ? strikes : undefined;
  const strikesPerTarget = skill.id === 'skills-barbarian-double-swing' && skill.trigger === 'active' &&
    skill.target === 'area-enemies' && skill.aoeShape === 'cross' && skill.maxTargets === 3 &&
    skill.damageType === 'physical' && skill.damage !== undefined &&
    skill.hitSequence?.targetMode === 'each-original' && strikes === 2 ? strikes : undefined;
  const bonus = skill.critChanceBonus;
  const criticalBonusPoints = skill.id === 'skills-assassin-dragon-claw' && strikesPerCast === 2 &&
    bonus !== undefined && Number.isFinite(bonus) && bonus > 0 && bonus <= 1
    ? Number((bonus * 100).toFixed(4)) : undefined;
  const mindBlast = skill.id === 'skills-assassin-mind-blast' && skill.trigger === 'active' &&
    skill.target === 'all-enemies' && skill.damageType === 'arcane' &&
    skill.appliesStatus?.length === 2 && skill.appliesStatus[0] === 'mana-burn' && skill.appliesStatus[1] === 'stun';
  const manaBurn = mindBlast ? {
    drainPercent: MANA_BURN_DEFINITION.drainFraction * 100,
    zeroManaArcaneBonusPercent: (MANA_BURN_DEFINITION.zeroManaArcaneMultiplier - 1) * 100,
    untilManaRestored: true as const
  } : undefined;
  const coldAttack = ['skills-sorceress-ice-bolt', 'skills-sorceress-frost-nova',
    'skills-sorceress-frozen-orb', 'skills-sorceress-blizzard'].includes(skill.id) &&
    skill.trigger === 'active' && skill.damageType === 'cold' && skill.appliesStatus?.includes('chill')
    ? { durationSeconds: STATUS_DEFAULTS.chill.duration,
      slowPercent: Number(((1 - CHILL_DEFINITION.attackSpeedMultiplier) * 100).toFixed(4)),
      ...(skill.id === 'skills-sorceress-frost-nova' && skill.additionalStatusEffects?.freeze ? {
        freeze: { chancePercent: skill.additionalStatusEffects.freeze.chance * 100,
          durationSeconds: STATUS_DEFAULTS.freeze.duration,
          bossDurationSeconds: STATUS_DEFAULTS.freeze.duration * (STATUS_DEFAULTS.freeze.bossDurationMult ?? 1) }
      } : {}) } : undefined;
  const leap = skill.id === 'skills-barbarian-leap' && skill.trigger === 'active' &&
    skill.target === 'all-enemies' && skill.appliesStatus?.length === 2 &&
    skill.appliesStatus[0] === 'leap' && skill.appliesStatus[1] === 'stun' && skill.timedBuff !== undefined;
  const controlId = mindBlast || leap ? 'stun' : skill.appliesStatus?.[0];
  const howl = skill.id === 'skills-barbarian-howl';
  const controlDefinition = (skill.damage !== undefined || leap || howl || skill.id === 'skills-sorceress-telekinesis') && skill.trigger === 'active' &&
    (controlId === 'chill' || controlId === 'stun' || controlId === 'paralyze' || controlId === 'howl') ? STATUS_DEFAULTS[controlId] : undefined;
  const control = terror ? { durationSeconds: terror.durationMs / 1000,
    bossDurationSeconds: Math.max(1, Math.floor(terror.durationMs * terror.bossDurationMultiplier)) / 1000
  } : controlDefinition ? { durationSeconds: controlDefinition.duration,
    bossDurationSeconds: controlDefinition.duration * (controlDefinition.bossDurationMult ?? 1) } : undefined;
  const maxTargets = skill.trigger === 'active' && skill.target === 'area-enemies' &&
    (((skill.id === 'skills-paladin-zeal' || strikesPerTarget !== undefined) && skill.aoeShape === 'cross' && skill.maxTargets === 3) ||
      (skill.id === 'skills-sorceress-chain-lightning' && skill.aoeShape === 'chain' && skill.maxTargets === 5))
    ? skill.maxTargets : undefined;
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
  const frenzyTuning = skill.frenzy;
  const frenzy = skill.id === 'skills-barbarian-frenzy' && skill.trigger === 'active' &&
    strikesPerCast === 2 && skill.damage && frenzyTuning &&
    Number.isFinite(frenzyTuning.attackSpeedPctPerStack) && frenzyTuning.attackSpeedPctPerStack > 0 && frenzyTuning.attackSpeedPctPerStack <= 1 &&
    Number.isInteger(frenzyTuning.maxStacks) && frenzyTuning.maxStacks >= 1 && frenzyTuning.maxStacks <= 20 &&
    Number.isInteger(frenzyTuning.durationMs) && frenzyTuning.durationMs >= 1000
    ? { percentPerStack: Number((frenzyTuning.attackSpeedPctPerStack * 100).toFixed(4)),
      maxStacks: frenzyTuning.maxStacks, durationSeconds: frenzyTuning.durationMs / 1000 } : undefined;
  const tuning = skill.feralRage;
  const feralRage = recovery && skill.id === 'skills-druid-feral-rage' && tuning &&
    Number.isFinite(tuning.attackSpeedPctPerStack) && tuning.attackSpeedPctPerStack > 0 &&
    Number.isInteger(tuning.maxStacks) && tuning.maxStacks > 0 &&
    Number.isFinite(tuning.durationMs) && tuning.durationMs > 0
    ? { percentPerStack: Number((tuning.attackSpeedPctPerStack * 100).toFixed(4)),
        maxStacks: tuning.maxStacks, durationSeconds: tuning.durationMs / 1000 } : undefined;

  return {
    rank: safeRank,
    ...(skill.id === 'skills-barbarian-battle-command' && skill.trigger === 'active' &&
      skill.target === 'all-allies' && skill.skillRankBuff ? { skillRankBuff: {
        bonusRanks: skill.skillRankBuff.bonusRanks,
        durationSeconds: (skill.skillRankBuff.durationMs + skill.skillRankBuff.durationPerRankMs * (safeRank - 1)) / 1000
      } } : {}),
    ...(skill.id === 'skills-barbarian-grim-ward' && skill.trigger === 'active' && skill.target === 'all-enemies' &&
      skill.corpseWard ? { corpseWard: {
        durationSeconds: (skill.corpseWard.durationMs + skill.corpseWard.durationPerRankMs * (safeRank - 1)) / 1000,
        intervalSeconds: skill.corpseWard.intervalMs / 1000, fearSeconds: skill.corpseWard.fearDurationMs / 1000,
        bossFearSeconds: skill.corpseWard.fearDurationMs * skill.corpseWard.bossDurationMultiplier / 1000 } } : {}),
    ...(skill.id === 'skills-barbarian-find-item' && skill.trigger === 'active' && skill.target === 'self' &&
      skill.corpseSearch ? { corpseSearch: { successPercent: Number(((skill.corpseSearch.successChance +
        skill.corpseSearch.successChancePerRank * (safeRank - 1)) * 100).toFixed(4)) } } : {}),
    ...(skill.id === 'skills-barbarian-find-potion' && skill.trigger === 'active' && skill.target === 'self' &&
      skill.corpseRecovery ? { corpseRecovery: {
        lifePercent: Number(((skill.corpseRecovery.lifePct + skill.corpseRecovery.lifePctPerRank * (safeRank - 1)) * 100).toFixed(4)),
        manaPercent: Number(((skill.corpseRecovery.manaPct + skill.corpseRecovery.manaPctPerRank * (safeRank - 1)) * 100).toFixed(4))
      } } : {}),
    ...(skill.id === 'skills-sorceress-hydra' && skill.hydra && skill.target === 'summon' ? {
      hydra: { heads: HYDRA_DEFINITION.heads, durationSeconds: HYDRA_DEFINITION.durationMs / 1000 }
    } : {}),
    ...(['skills-sorceress-teleport', 'skills-sorceress-enchant'].includes(skill.id) &&
      skill.trigger === 'active' && skill.target === 'self' && skill.timedBuff ? { sorceressBuff: {
        durationSeconds: skill.timedBuff.durationMs / 1000,
        ...(skill.id === 'skills-sorceress-teleport'
          ? { magicDodgePoints: Number(((skill.scaling?.passiveStatsPerLevel?.magicDodgePct ?? 0) * safeRank * 100).toFixed(4)) }
          : { enchantAttackPercent: Number(((skill.enchantOnPhysicalHit?.attackPctPerRank ?? 0) * safeRank * 100).toFixed(4)) })
      } } : {}),
    ...(skill.periodicSpell && ['skills-sorceress-inferno', 'skills-sorceress-blaze', 'skills-sorceress-fire-wall',
      'skills-sorceress-thunder-storm'].includes(skill.id) ? { periodicSpell: {
      durationSeconds: skill.periodicSpell.durationMs / 1000,
      intervalSeconds: skill.periodicSpell.intervalMs / 1000,
      pulses: Math.ceil(skill.periodicSpell.durationMs / skill.periodicSpell.intervalMs),
      ...(skill.id === 'skills-sorceress-inferno' && skill.periodicSpell.channelled === true ? { channelled: true as const } : {})
    } } : {}),
    ...(['skills-sorceress-shiver-armor', 'skills-sorceress-chilling-armor'].includes(skill.id) &&
      skill.trigger === 'active' && skill.armorRetaliation ? { coldArmor: {
        min: scaleValue(skill.armorRetaliation.min, skill.armorRetaliation.perRank, safeRank),
        max: scaleValue(skill.armorRetaliation.max, skill.armorRetaliation.perRank, safeRank),
        freezeSeconds: STATUS_DEFAULTS.freeze.duration,
        bossFreezeSeconds: STATUS_DEFAULTS.freeze.duration * (STATUS_DEFAULTS.freeze.bossDurationMult ?? 1)
      } } : {}),
    ...(coldAttack ? { coldAttack } : {}),
    ...(decrepify ? { decrepify: { durationSeconds: decrepify.durationMs / 1000,
      attackSpeedReductionPercent: decrepify.attackSpeedReductionPct,
      damageReductionPercent: decrepify.damageReductionPct } } : {}),
    ...(weaken ? { weaken: { durationSeconds: weaken.durationMs / 1000,
      damageReductionPercent: weaken.damageReductionPct } } : {}),
    ...(dimVision ? { dimVision: { durationSeconds: dimVision.durationMs / 1000,
      physicalHitChanceReductionPoints: dimVision.physicalHitChanceReductionPct } } : {}),
    ...(targetCurse ? { targetCurse: { id: targetCurse.id, durationSeconds: targetCurse.durationMs / 1000 } } : {}),
    ...(damageCurse ? { damageCurse: { id: damageCurse.id, durationSeconds: damageCurse.durationMs / 1000,
      percent: damageCurse.percent } } : {}),
    ...(['skills-barbarian-howl', 'skills-barbarian-taunt', 'skills-barbarian-battle-cry'].includes(skill.id) ? {
      warcry: { durationSeconds: (skill.statusEffect?.durationMs ?? 0) / 1000,
        ...(skill.id === 'skills-barbarian-battle-cry' ? {
          damageReductionPercent: paidBattleCry(safeRank).damageReductionPct,
          defenseReductionPercent: paidBattleCry(safeRank).defenseReductionPct
        } : {}) }
    } : {}),
    ...(skill.id === 'skills-barbarian-concentrate' && skill.timedBuff
      ? { concentrate: { durationSeconds: skill.timedBuff.durationMs / 1000 } } : {}),
    ...(skill.id === 'skills-barbarian-berserk' && skill.attackDamagePct !== undefined
      ? { convertedAttackPercent: skill.attackDamagePct } : {}),
    ...(leap ? { leap: { durationSeconds: skill.timedBuff.durationMs / 1000 } } : {}),
    ...(skill.id === 'skills-assassin-cloak-of-shadows' && skill.timedBuff
      ? { cloak: { durationSeconds: skill.timedBuff.durationMs / 1000,
        blindHitPenaltyPoints: DRUID_SUMMON_DEFINITION.raven.physicalHitChancePenalty * 100 } } : {}),
    ...(['skills-assassin-fire-blast', 'skills-assassin-blade-fury', 'skills-sorceress-frozen-orb', 'skills-sorceress-inferno'].includes(skill.id) && skill.trigger === 'active' &&
      skill.target === 'area-enemies' && skill.aoeShape === 'cone-2'
      ? { areaShape: skill.aoeShape } : {}),
    ...(maxTargets !== undefined ? { maxTargets } : {}),
    ...(ignoresMagicResist ? { ignoresMagicResist: true as const } : {}),
    ...(ignoresDefense ? { ignoresDefense: true as const } : {}),
    ...(composite ? { composite } : {}),
    ...(strikesPerCast !== undefined ? { strikesPerCast } : {}),
    ...(strikesPerTarget !== undefined ? { strikesPerTarget } : {}),
    ...(criticalBonusPoints !== undefined ? { criticalBonusPoints } : {}),
    ...(control ? { control } : {}),
    ...(manaBurn ? { manaBurn } : {}),
    ...(recovery ? { recovery } : {}),
    ...(selfDamage ? { selfDamage } : {}),
    ...(feralRage ? { feralRage } : {}),
    ...(frenzy ? { frenzy } : {}),
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
