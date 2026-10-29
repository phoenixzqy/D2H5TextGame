import rows from '../../data/skills/mercenary.json';
import type { SkillDef } from '../types/skills';
import type { DebuffEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Resolve the exact authored mercenary War Cry into independent immutable control. */
export function resolveMercWarCrySkill(source: readonly unknown[]): RegisteredSkill {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'mskill-war-cry');
  if (matches.length !== 1) throw new Error('Expected exactly one authored mskill-war-cry skill');
  const row = matches[0];
  if (!validate(row) || row.statusEffect?.durationMs === undefined || row.cost.mana === undefined) {
    throw new Error('Invalid authored mskill-war-cry skill');
  }
  const effect: DebuffEffect = Object.freeze({ kind: 'debuff', statusId: 'stun',
    durationMs: row.statusEffect.durationMs });
  return Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'active',
    target: row.target, cooldown: row.cooldown, manaCost: row.cost.mana,
    minLevel: row.minLevel, effects: Object.freeze([effect]) });
}

/** Guaranteed finite area Stun, separate from player War Cry and mercenary Bash. */
export const MERC_WAR_CRY_SKILL = resolveMercWarCrySkill(rows);
