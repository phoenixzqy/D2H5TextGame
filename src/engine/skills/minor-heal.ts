import mercenarySkills from '../../data/skills/mercenary.json';
import type { HealEffect, RegisteredSkill } from './effects';

/** Authored fields consumed by the exact Minor Heal boundary. */
interface MinorHealSource {
  readonly id: string;
  readonly trigger: string;
  readonly target: string;
  readonly cooldown: number;
  readonly minLevel: number;
  readonly cost?: { readonly mana?: number };
  readonly heal?: {
    readonly min?: number;
    readonly max?: number;
    readonly target?: string;
  };
}

/** Resolve one exact authored Minor Heal row into an independently frozen skill. */
export function resolveMinorHealSkill(skills: readonly MinorHealSource[]): RegisteredSkill {
  const matches = skills.filter(skill => skill.id === 'mskill-minor-heal');
  const skill = matches[0];
  if (matches.length !== 1 || !skill) throw new Error('Expected exactly one authored Minor Heal skill');
  const min = skill.heal?.min;
  const max = skill.heal?.max;
  if (min === undefined || max === undefined || !Number.isInteger(min) || !Number.isInteger(max) ||
    min < 0 || max < min) {
    throw new Error('Minor Heal range must contain finite nonnegative ordered integers');
  }
  if (skill.trigger !== 'active' || skill.target !== 'single-ally' || skill.heal?.target !== 'ally') {
    throw new Error('Minor Heal requires active trigger, single-ally target and ally heal scope');
  }
  const effect: HealEffect = Object.freeze({
    kind: 'heal', amountRange: Object.freeze([min, max] as const), target: 'ally'
  });
  return Object.freeze({
    id: skill.id,
    archetype: 'mercenary',
    target: 'single-ally',
    cooldown: skill.cooldown,
    manaCost: skill.cost?.mana ?? 0,
    minLevel: skill.minLevel,
    effects: Object.freeze([effect])
  });
}

/** Actual JSON-derived skill; importing it does not depend on the registry. */
export const MINOR_HEAL_SKILL = resolveMinorHealSkill(mercenarySkills);
