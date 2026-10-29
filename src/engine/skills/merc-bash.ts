import mercenarySkills from '../../data/skills/mercenary.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Resolve the exact authored mercenary Bash into an independent immutable active skill. */
export function resolveMercBashSkill(rows: readonly unknown[]): RegisteredSkill {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'mskill-bash');
  if (matches.length !== 1) throw new Error('Expected exactly one authored mskill-bash skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored mskill-bash skill');
  const { damage, hitSequence, statusEffect } = row;
  const manaCost = row.cost.mana;
  if (!damage || !hitSequence || !statusEffect || manaCost === undefined ||
    !Number.isInteger(damage.min) || !Number.isInteger(damage.max) || damage.min > damage.max) {
    throw new Error('Invalid authored mskill-bash damage metadata');
  }
  const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType: 'physical',
    base: Object.freeze([damage.min, damage.max] as const),
    hitSequence: Object.freeze({ ...hitSequence }),
    applyStatus: Object.freeze({ id: 'stun', ...statusEffect }),
    ...(row.appliesTags ? { tags: Object.freeze([...row.appliesTags]) } : {}) });
  return Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'active', target: row.target,
    cooldown: row.cooldown, manaCost, minLevel: row.minLevel, effects: Object.freeze([effect]) });
}

/** JSON-derived mercenary Bash, separate from player Barbarian Bash and mercenary Jab. */
export const MERC_BASH_SKILL = resolveMercBashSkill(mercenarySkills);
