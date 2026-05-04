/**
 * JSON-authored skill catalog adapters.
 *
 * Converts content data into engine-registered skills so runtime combat uses
 * the same level-scaling metadata displayed by the UI and dev tools.
 *
 * @module engine/skills/dataCatalog
 */

import necromancerSkills from '../../data/skills/necromancer.json';
import type { AoeShape } from '../combat/grid';
import type { DamageType } from '../types/attributes';
import type { ComboTag, SkillTarget } from '../types/skills';
import type { RegisteredSkill, SkillEffect, SummonMaxCountScalingKind, SummonStatScaling } from './effects';

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

function canonicalSkillIdFromData(id: string): string {
  const match = /^skills-([a-z]+)-(.+)$/.exec(id);
  if (!match?.[1] || !match[2]) return id;
  return `${match[1]}.${match[2].replace(/-/g, '_')}`;
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
    effects.push({
      kind: 'debuff',
      statusId: skill.appliesStatus[0]
    });
  }

  return effects;
}

function registeredSkillFromJson(skill: JsonSkill): RegisteredSkill {
  return {
    id: canonicalSkillIdFromData(skill.id),
    archetype: 'necromancer',
    target: skill.target,
    cooldown: skill.cooldown,
    manaCost: skill.cost?.mana ?? 0,
    ...(skill.scaling?.costPerLevel !== undefined ? { manaCostPerRank: skill.scaling.costPerLevel } : {}),
    ...(skill.scaling?.cooldownPerLevel !== undefined ? { cooldownPerRank: skill.scaling.cooldownPerLevel } : {}),
    effects: effectsForSkill(skill),
    minLevel: skill.requiredLevel ?? skill.minLevel,
    ...(skill.aoeShape ? { aoeShape: skill.aoeShape } : {}),
    ...(skill.target === 'summon' && skill.trigger === 'active' ? { summonOnStart: true } : {}),
    ...(skill.trigger === 'passive' || skill.trigger === 'aura' ? { isBuff: true } : {})
  };
}

export const NECROMANCER_DATA_SKILLS: readonly RegisteredSkill[] = Object.freeze(
  (necromancerSkills as readonly JsonSkill[]).map(registeredSkillFromJson)
);
