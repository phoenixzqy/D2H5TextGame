/**
 * JSON-authored skill catalog adapters.
 *
 * Converts content data into engine-registered skills so runtime combat uses
 * the same level-scaling metadata displayed by the UI and dev tools.
 *
 * @module engine/skills/dataCatalog
 */

import amazonSkills from '../../data/skills/amazon.json';
import assassinSkills from '../../data/skills/assassin.json';
import barbarianSkills from '../../data/skills/barbarian.json';
import druidSkills from '../../data/skills/druid.json';
import necromancerSkills from '../../data/skills/necromancer.json';
import paladinSkills from '../../data/skills/paladin.json';
import sorceressSkills from '../../data/skills/sorceress.json';
import type { AoeShape } from '../combat/grid';
import { isDecrepifyDefinition } from '../combat/decrepify-definition';
import { isTerrorDefinition } from '../combat/terror-definition';
import { isBonePrisonDefinition } from '../combat/bone-prison-definition';
import { isBoneWallDefinition } from '../combat/bone-wall-definition';
import { isWeakenDefinition } from '../combat/weaken-definition';
import { isDimVisionDefinition } from '../combat/dim-vision-definition';
import { damageCurseId } from '../combat/damage-curse-definition';
import { targetCurseId } from '../combat/target-curse-definition';
import type { DamageType } from '../types/attributes';
import type { ComboTag, ConversionTuning, FeralRageTuning, HitSpeedStackTuning, OnHitRecoveryTuning, OnHitSelfDamageTuning, SkillHitSequence, SkillAdditionalStatusEffects, SkillRequirement, SkillStatusEffectMetadata, SkillTarget, StaticFieldTuning } from '../types/skills';
import type { OnHitStatus, RegisteredSkill, SkillEffect, SummonMaxCountScalingKind, SummonStatScaling } from './effects';

export type PlayableSkillClass =
  | 'amazon'
  | 'assassin'
  | 'barbarian'
  | 'druid'
  | 'necromancer'
  | 'paladin'
  | 'sorceress';

interface JsonSkill {
  readonly boneWall?: import('../types/skills').SkillDef['boneWall'];
  readonly skillRankBuff?: import('../types/skills').SkillDef['skillRankBuff'];
  readonly corpseWard?: import('../types/skills').SkillDef['corpseWard'];
  readonly corpseSearch?: import('../types/skills').SkillDef['corpseSearch'];
  readonly corpseRecovery?: import('../types/skills').SkillDef['corpseRecovery'];
  readonly hydra?: NonNullable<import('../types/skills').SkillDef['hydra']>;
  readonly enchantOnPhysicalHit?: { readonly attackPctPerRank: number };
  readonly periodicSpell?: NonNullable<import('../types/skills').SkillDef['periodicSpell']>;
  readonly armorRetaliation?: import('../types/skills').ArmorRetaliationTuning;
  readonly attackDamagePct?: number;
  readonly conversion?: ConversionTuning;
  readonly damageComposition?: 'weighted-components';
  readonly ignoresMagicResist?: true;
  readonly ignoresDefense?: true;
  readonly alwaysHits?: true;
  readonly hitSequence?: SkillHitSequence;
  readonly critChanceBonus?: number;
  readonly onHitRecovery?: OnHitRecoveryTuning;
  /** Explicit life debit after a real enemy HP loss; independent of personal shields. */
  readonly onHitSelfDamage?: OnHitSelfDamageTuning;
  readonly feralRage?: FeralRageTuning;
  readonly frenzy?: HitSpeedStackTuning;
  readonly staticField?: StaticFieldTuning;
  readonly timedBuff?: { readonly durationMs: number };
  readonly id: string;
  readonly name: string;
  readonly icon?: string;
  readonly maxLevel: number;
  readonly prerequisites?: readonly string[];
  readonly trigger: 'active' | 'passive' | 'aura';
  readonly target: SkillTarget;
  readonly cooldown: number;
  readonly requiredLevel?: number;
  readonly minLevel: number;
  readonly cost?: {
    readonly mana?: number;
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
  readonly summon?: boolean;
  readonly summonId?: string;
  readonly aoeShape?: AoeShape;
  /** Authored cap after shaped area selection; absent preserves all resolved targets. */
  readonly maxTargets?: number;
  readonly requires?: SkillRequirement;
  readonly scaling?: {
    readonly damagePerLevel?: number;
    readonly cooldownPerLevel?: number;
    readonly costPerLevel?: number;
    readonly summonMaxCount?: {
      readonly kind: SummonMaxCountScalingKind;
    };
    readonly summonStatsPerLevel?: SummonStatScaling;
  };
}

export const PLAYABLE_CLASS_SKILL_DATA: Readonly<Record<PlayableSkillClass, readonly JsonSkill[]>> = Object.freeze({
  amazon: amazonSkills as readonly JsonSkill[],
  assassin: assassinSkills as readonly JsonSkill[],
  barbarian: barbarianSkills as readonly JsonSkill[],
  druid: druidSkills as readonly JsonSkill[],
  necromancer: necromancerSkills as readonly JsonSkill[],
  paladin: paladinSkills as readonly JsonSkill[],
  sorceress: sorceressSkills as readonly JsonSkill[]
});

export const ENABLED_PLAYABLE_SKILL_CLASSES: readonly PlayableSkillClass[] = Object.freeze([
  'necromancer',
  'sorceress',
  'barbarian',
  'amazon',
  'paladin',
  'druid',
  'assassin'
]);

export function canonicalSkillIdFromData(id: string): string {
  const match = /^skills-([a-z]+)-(.+)$/.exec(id);
  if (!match?.[1] || !match[2]) return id;
  return `${match[1]}.${match[2].replace(/-/g, '_')}`;
}

function archetypeFromSkillId(id: string): string {
  const match = /^skills-([a-z]+)-/.exec(id);
  return match?.[1] ?? canonicalSkillIdFromData(id).split('.')[0] ?? 'unknown';
}

function comboTags(tags: readonly string[] | undefined): readonly ComboTag[] | undefined {
  if (!tags) return undefined;
  return tags.filter((tag): tag is ComboTag => (
    tag === 'cold' ||
    tag === 'fire' ||
    tag === 'lightning' ||
    tag === 'poison' ||
    tag === 'physical' ||
    tag === 'arcane' ||
    tag === 'chill' ||
    tag === 'burn' ||
    tag === 'shock' ||
    tag === 'bleed' ||
    tag === 'amp-damage'
  ));
}

function summonMaxForKind(kind: SummonMaxCountScalingKind | undefined): number {
  if (kind === 'raise-skeleton-1-6-12-cap-3') return 3;
  if (kind === 'first-three-then-every-three') return 8;
  return 1;
}

function effectsForSkill(skill: JsonSkill): SkillEffect[] {
  if (skill.id === 'skills-barbarian-battle-command' && skill.skillRankBuff) return [{ kind: 'party-skill-ranks' }];
  if (skill.id === 'skills-barbarian-grim-ward' && skill.corpseWard) return [{ kind: 'corpse-ward' }];
  if (skill.id === 'skills-barbarian-find-item' && skill.corpseSearch) return [{ kind: 'corpse-search' }];
  if (skill.id === 'skills-barbarian-find-potion' && skill.corpseRecovery) return [{ kind: 'corpse-recovery' }];
  if (skill.id === 'skills-sorceress-hydra' && skill.hydra) return [{ kind: 'hydra' }];
  if (skill.periodicSpell) {
    const spell = (['blaze', 'fire-wall', 'thunder-storm', 'inferno'] as const)
      .find(id => skill.id === 'skills-sorceress-' + id);
    if (spell) return [{ kind: 'periodic-spell', spell }];
  }
  if (skill.id === 'skills-sorceress-static-field' && skill.staticField) return [{ kind: 'static-field' }];
  const effects: SkillEffect[] = [];
  if (skill.id === 'skills-barbarian-concentrate' && skill.timedBuff) {
    effects.push({ kind: 'buff', id: 'concentrate', timedStatBuff: 'concentrate',
      duration: skill.timedBuff.durationMs / 1000 });
  }
  if (skill.damage && skill.damageType) {
    const composite = ['skills-paladin-vengeance', 'skills-assassin-phoenix-strike'].includes(skill.id) && skill.damageComposition === 'weighted-components';
    const weights = skill.damage.breakdown;
    const componentWeight = (type: DamageType): number => {
      const weight = weights?.[type];
      if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) {
        throw new Error('Invalid authored elemental component weights');
      }
      return weight;
    };
    const components = composite ? Object.freeze([
      Object.freeze({ damageType: 'fire' as const, weight: componentWeight('fire') }),
      Object.freeze({ damageType: 'cold' as const, weight: componentWeight('cold') }),
      Object.freeze({ damageType: 'lightning' as const, weight: componentWeight('lightning') })
    ] as const) : undefined;
    const tags = comboTags(skill.appliesTags);
    const statusId = skill.appliesStatus?.[0];
    const primaryStatus: OnHitStatus | undefined = statusId
      ? {
          id: statusId,
          ...(composite ? { damageType: 'fire' as const } : {}),
          ...(skill.statusEffect?.chance !== undefined ? { chance: skill.statusEffect.chance } : {}),
          ...(skill.statusEffect?.stacksOnApply !== undefined
            ? { stacksOnApply: skill.statusEffect.stacksOnApply }
            : {}),
          ...(skill.statusEffect?.dotPctOfDamage !== undefined
            ? { dotPctOfDamage: skill.statusEffect.dotPctOfDamage }
            : {})
        }
      : undefined;
    const secondaryStatuses = (skill.appliesStatus?.slice(1) ?? []).flatMap((id): OnHitStatus[] => {
      if (skill.id === 'skills-assassin-mind-blast' && skill.damageType === 'arcane' &&
        skill.appliesStatus?.length === 2 && skill.appliesStatus[0] === 'mana-burn' && id === 'stun') return [{ id }];
      // Plague marks spread; Poison alone carries this skill's periodic damage.
      if (skill.id === 'skills-amazon-plague-javelin' && skill.damageType === 'poison' &&
        skill.appliesStatus?.length === 2 && skill.appliesStatus[0] === 'poison' && id === 'plague') return [{ id }];
      if (composite && id === 'chill') return [{ id, damageType: 'cold' }];
      if (composite && id === 'paralyze') return [{ id, damageType: 'lightning' }];
      // The authored freezing cold attacks also slow after Freeze expires.
      if (id === 'chill' && skill.trigger === 'active' && skill.damageType === 'cold' &&
        skill.appliesStatus?.length === 2 && skill.appliesStatus[0] === 'freeze') return [{ id }];
      const metadata = id === 'freeze' ? skill.additionalStatusEffects?.freeze : undefined;
      if (metadata) return [{ id, ...metadata }];
      const melt = skill.additionalStatusEffects?.['armor-melt'];
      if (melt && skill.id === 'skills-sorceress-meteor' && skill.damageType === 'fire' &&
        skill.appliesStatus?.length === 2 && skill.appliesStatus[0] === 'burn' && id === 'armor-melt') {
        return [{ id, chance: melt.chance, durationMs: melt.durationMs }];
      }
      return [];
    });
    effects.push({
      kind: 'damage',
      ...(skill.id === 'skills-paladin-conversion' && skill.conversion ? { conversion: true as const } : {}),
      ...(components ? { components } : {}),
      ...(skill.ignoresMagicResist === true ? { ignoresMagicResist: true as const } : {}),
      ...(skill.ignoresDefense === true ? { ignoresDefense: true as const } : {}),
      ...(skill.alwaysHits === true ? { alwaysHits: true as const } : {}),
      ...(skill.hitSequence ? { hitSequence: { strikes: skill.hitSequence.strikes,
        ...(skill.hitSequence.targetMode ? { targetMode: skill.hitSequence.targetMode } : {}) } } : {}),
      ...(skill.critChanceBonus !== undefined ? { critChanceBonus: skill.critChanceBonus } : {}),
      ...(skill.onHitRecovery ? { onHitRecovery: { lifeFraction: skill.onHitRecovery.lifeFraction } } : {}),
      ...(skill.onHitSelfDamage ? { onHitSelfDamage: Object.freeze({
        lifeFraction: skill.onHitSelfDamage.lifeFraction,
        minimumLifeLoss: skill.onHitSelfDamage.minimumLifeLoss
      }) } : {}),
      ...(skill.id === 'skills-druid-feral-rage' && skill.feralRage ? { feralRage: true as const } : {}),
      ...(skill.id === 'skills-barbarian-frenzy' && skill.frenzy ? { frenzy: true as const } : {}),
      ...(skill.attackDamagePct !== undefined ? { attackDamagePct: skill.attackDamagePct } : {}),
      damageType: skill.damageType,
      base: [skill.damage.min, skill.damage.max],
      ...(skill.scaling?.damagePerLevel !== undefined
        ? { perRank: [skill.scaling.damagePerLevel, skill.scaling.damagePerLevel] }
        : {}),
      ...(tags && tags.length > 0 ? { tags } : {}),
      ...(primaryStatus
        ? secondaryStatuses.length > 0
          ? { applyStatuses: [primaryStatus, ...secondaryStatuses] as const }
          : { applyStatus: primaryStatus }
        : {})
    });
  }

  if (skill.summon && skill.summonId) {
    const maxCountScaling = skill.scaling?.summonMaxCount;
    effects.push({
      kind: 'summon',
      summonId: skill.summonId,
      maxCount: summonMaxForKind(maxCountScaling?.kind),
      ...(maxCountScaling ? { maxCountScaling } : {}),
      ...(skill.scaling?.summonStatsPerLevel ? { statScaling: skill.scaling.summonStatsPerLevel } : {})
    });
  }

  if (!skill.damage && !skill.summon && skill.appliesStatus?.[0]) {
    if (skill.id === 'skills-barbarian-leap' && skill.timedBuff) {
      effects.push({ kind: 'buff', id: 'leap', timedStatBuff: 'leap',
        duration: skill.timedBuff.durationMs / 1000 }, { kind: 'debuff', statusId: 'stun' });
      return effects;
    }
    if (skill.id === 'skills-assassin-cloak-of-shadows' && skill.timedBuff) {
      effects.push({ kind: 'buff', id: 'cloak-of-shadows', timedStatBuff: 'cloak-of-shadows',
        duration: skill.timedBuff.durationMs / 1000 },
      { kind: 'debuff', statusId: 'blind', durationMs: skill.timedBuff.durationMs });
      return effects;
    }
    if (skill.target === 'self') {
      const wall = isBoneWallDefinition(skill);
      effects.push({
        kind: 'buff',
        id: skill.appliesStatus[0],
        ...(wall ? { boneWall: true as const } : {}),
        ...((skill.id === 'skills-sorceress-teleport' || skill.id === 'skills-sorceress-enchant') && skill.timedBuff
          ? { sorceressBuff: skill.id === 'skills-sorceress-teleport' ? 'teleport' as const : 'enchant' as const } : {}),
        ...(skill.id === 'skills-druid-cyclone-armor' ? { cycloneArmor: true as const } : {}),
        ...(skill.id === 'skills-paladin-holy-shield' ? { holyShield: true as const } : {}),
        ...(skill.id === 'skills-sorceress-shiver-armor' ? { coldArmor: 'shiver-armor' as const } : {}),
        ...(skill.id === 'skills-sorceress-chilling-armor' ? { coldArmor: 'chilling-armor' as const } : {}),
        duration: wall && skill.boneWall ? skill.boneWall.durationMs / 1000 : skill.timedBuff ? skill.timedBuff.durationMs / 1000 : -1,
        ...((skill.id === 'skills-druid-werewolf' || skill.id === 'skills-druid-werebear') && skill.trigger === 'active'
          ? { druidForm: skill.id === 'skills-druid-werewolf' ? 'werewolf' as const : 'werebear' as const } : {}),
        ...(skill.id === 'skills-assassin-burst-of-speed' && skill.timedBuff
          ? { timedStatBuff: 'burst-of-speed' as const } : {}),
        ...(skill.id === 'skills-sorceress-frozen-armor' && skill.trigger === 'active' &&
          skill.appliesStatus.length === 1 && skill.appliesStatus[0] === 'frozen-armor'
          ? { frozenArmor: true as const } : {})
      });
      return effects;
    }
    const amplifyMetadata = skill.id === 'skills-necromancer-amplify-damage' &&
      skill.appliesStatus[0] === 'amplify-damage' ? skill.statusEffect : undefined;
    const warcry = ['skills-barbarian-howl', 'skills-barbarian-taunt', 'skills-barbarian-battle-cry'].includes(skill.id);
    const decrepify = skill.id === 'skills-necromancer-decrepify' && isDecrepifyDefinition(skill);
    const weaken = skill.id === 'skills-necromancer-weaken' && isWeakenDefinition(skill);
    const dimVision = skill.id === 'skills-necromancer-dim-vision' && isDimVisionDefinition(skill);
    const damageCurse = damageCurseId(skill);
    const terror = skill.id === 'skills-necromancer-terror' && isTerrorDefinition(skill);
    const bonePrison = skill.id === 'skills-necromancer-bone-prison' && isBonePrisonDefinition(skill);
    const targetCurse = targetCurseId(skill);
    effects.push({
      kind: 'debuff',
      statusId: skill.appliesStatus[0],
      ...((warcry || decrepify || weaken || dimVision || damageCurse !== undefined || terror || bonePrison || targetCurse !== undefined) && skill.statusEffect?.durationMs !== undefined
        ? { durationMs: skill.statusEffect.durationMs } : {}),
      ...(skill.id === 'skills-barbarian-battle-cry' ? { battleCry: true as const } : {}),
      ...(decrepify ? { decrepify: true as const } : {}),
      ...(weaken ? { weaken: true as const } : {}),
      ...(dimVision ? { dimVision: true as const } : {}),
      ...(terror ? { terror: true as const } : {}),
      ...(bonePrison ? { bonePrison: true as const } : {}),
      ...(targetCurse ? { targetCurse } : {}),
      ...(damageCurse ? { damageCurse } : {}),
      ...(amplifyMetadata?.durationMs !== undefined ? { durationMs: amplifyMetadata.durationMs } : {}),
      ...(amplifyMetadata?.physicalResistReductionPct !== undefined
        ? { physicalResistReductionPct: amplifyMetadata.physicalResistReductionPct }
        : {})
    });
  }

  if (effects.length === 0 && (skill.trigger === 'passive' || skill.trigger === 'aura')) {
    const buffId = canonicalSkillIdFromData(skill.id).split('.')[1];
    if (buffId) {
      effects.push({
        kind: 'buff',
        id: buffId,
        duration: -1
      });
    }
  }

  return effects;
}

export function registeredSkillFromJson(skill: JsonSkill): RegisteredSkill {
  return {
    id: canonicalSkillIdFromData(skill.id),
    archetype: archetypeFromSkillId(skill.id),
    trigger: skill.trigger,
    target: skill.target,
    cooldown: skill.cooldown,
    manaCost: skill.cost?.mana ?? 0,
    ...(skill.scaling?.costPerLevel !== undefined ? { manaCostPerRank: skill.scaling.costPerLevel } : {}),
    ...(skill.scaling?.cooldownPerLevel !== undefined ? { cooldownPerRank: skill.scaling.cooldownPerLevel } : {}),
    effects: effectsForSkill(skill),
    minLevel: skill.requiredLevel ?? skill.minLevel,
    ...(skill.aoeShape ? { aoeShape: skill.aoeShape } : {}),
    ...(skill.maxTargets !== undefined ? { maxTargets: skill.maxTargets } : {}),
    ...(skill.target === 'summon' && skill.trigger === 'active' ? { summonOnStart: true } : {}),
    ...(skill.trigger === 'passive' || skill.trigger === 'aura' || (
      (skill.target === 'self' || skill.id === 'skills-assassin-cloak-of-shadows' || skill.id === 'skills-barbarian-leap') && skill.appliesStatus?.[0] !== undefined
    ) ? { isBuff: true } : {}),
    ...(skill.requires ? { requires: skill.requires } : {})
  };
}

export function registeredSkillsForClasses(classes: readonly PlayableSkillClass[]): readonly RegisteredSkill[] {
  return classes.flatMap((classId) => PLAYABLE_CLASS_SKILL_DATA[classId].map(registeredSkillFromJson));
}

export const PLAYABLE_CLASS_DATA_SKILLS: readonly RegisteredSkill[] = Object.freeze(
  registeredSkillsForClasses(ENABLED_PLAYABLE_SKILL_CLASSES)
);
