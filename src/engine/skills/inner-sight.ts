import { createSkillValidator } from './skill-validator';
import mercenarySkills from '../../data/skills/mercenary.json';
import type { SkillDef } from '../types/skills';
import type { DebuffEffect, RegisteredSkill } from './effects';

/** Authored potency shared by the exact Rogue debuff and damage projection. */
export interface MercInnerSightDefinition {
  readonly statusId: 'merc-inner-sight';
  readonly defenseReductionPct: number;
  readonly durationMs: number;
}

const validate = createSkillValidator<SkillDef>();

/** Validate one exact authored row and return independent immutable runtime values. */
export function resolveMercInnerSight(rows: readonly unknown[]): {
  readonly definition: MercInnerSightDefinition;
  readonly skill: RegisteredSkill;
} {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'mskill-inner-sight');
  if (matches.length !== 1) throw new Error('Expected exactly one authored mercenary Inner Sight skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored mercenary Inner Sight skill');
  const defenseReductionPct = row.statusEffect?.defenseReductionPct;
  const durationMs = row.statusEffect?.durationMs;
  const manaCost = row.cost.mana;
  // Schema validation requires these fields; retain explicit narrowing at this boundary.
  if (defenseReductionPct === undefined || durationMs === undefined || manaCost === undefined) {
    throw new Error('Missing authored mercenary Inner Sight metadata');
  }
  const definition: MercInnerSightDefinition = Object.freeze({
    statusId: 'merc-inner-sight', defenseReductionPct, durationMs
  });
  const effect: DebuffEffect = Object.freeze({
    kind: 'debuff', statusId: definition.statusId, duration: durationMs / 1000, durationMs
  });
  const skill: RegisteredSkill = Object.freeze({
    id: row.id, archetype: 'mercenary', target: 'all-enemies', cooldown: row.cooldown,
    manaCost, minLevel: row.minLevel, effects: Object.freeze([effect])
  });
  return Object.freeze({ definition, skill });
}

const authored = resolveMercInnerSight(mercenarySkills);
/** Immutable JSON-derived defense reduction; independent of registry imports. */
export const MERC_INNER_SIGHT_DEFINITION = authored.definition;
/** Exact authored skill, registered separately after runtime integration. */
export const MERC_INNER_SIGHT_SKILL = authored.skill;
