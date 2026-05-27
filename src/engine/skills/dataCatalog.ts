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
import type { DamageType } from '../types/attributes';
import type { ComboTag, SkillRequirement, SkillTarget } from '../types/skills';
import type { RegisteredSkill, SkillEffect, SummonMaxCountScalingKind, SummonStatScaling } from './effects';

export type PlayableSkillClass =
  | 'amazon'
  | 'assassin'
  | 'barbarian'
  | 'druid'
  | 'necromancer'
  | 'paladin'
  | 'sorceress';

interface JsonSkill {
  readonly id: string;
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
  };
  readonly damageType?: DamageType;
  readonly appliesStatus?: readonly string[];
  readonly statusEffect?: {
    readonly chance?: number;
    readonly stacksOnApply?: number;
    readonly dotPctOfDamage?: number;
  };
  readonly appliesTags?: readonly string[];
  readonly summon?: boolean;
  readonly summonId?: string;
  readonly aoeShape?: AoeShape;
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
  const effects: SkillEffect[] = [];
  if (skill.damage && skill.damageType) {
    const tags = comboTags(skill.appliesTags);
    const statusId = skill.appliesStatus?.[0];
    effects.push({
      kind: 'damage',
      damageType: skill.damageType,
      base: [skill.damage.min, skill.damage.max],
      ...(skill.scaling?.damagePerLevel !== undefined
        ? { perRank: [skill.scaling.damagePerLevel, skill.scaling.damagePerLevel] }
        : {}),
      ...(tags && tags.length > 0 ? { tags } : {}),
      ...(statusId
        ? {
            applyStatus: {
              id: statusId,
              ...(skill.statusEffect?.chance !== undefined ? { chance: skill.statusEffect.chance } : {}),
              ...(skill.statusEffect?.stacksOnApply !== undefined
                ? { stacksOnApply: skill.statusEffect.stacksOnApply }
                : {}),
              ...(skill.statusEffect?.dotPctOfDamage !== undefined
                ? { dotPctOfDamage: skill.statusEffect.dotPctOfDamage }
                : {})
            }
          }
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
    if (skill.target === 'self') {
      effects.push({
        kind: 'buff',
        id: skill.appliesStatus[0],
        duration: -1
      });
      return effects;
    }
    effects.push({
      kind: 'debuff',
      statusId: skill.appliesStatus[0]
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
    target: skill.target,
    cooldown: skill.cooldown,
    manaCost: skill.cost?.mana ?? 0,
    ...(skill.scaling?.costPerLevel !== undefined ? { manaCostPerRank: skill.scaling.costPerLevel } : {}),
    ...(skill.scaling?.cooldownPerLevel !== undefined ? { cooldownPerRank: skill.scaling.cooldownPerLevel } : {}),
    effects: effectsForSkill(skill),
    minLevel: skill.requiredLevel ?? skill.minLevel,
    ...(skill.aoeShape ? { aoeShape: skill.aoeShape } : {}),
    ...(skill.target === 'summon' && skill.trigger === 'active' ? { summonOnStart: true } : {}),
    ...(skill.trigger === 'passive' || skill.trigger === 'aura' || (
      skill.target === 'self' && skill.appliesStatus?.[0] !== undefined
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
