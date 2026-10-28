import mercenarySkills from '../../data/skills/mercenary.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Resolve the exact authored mercenary Jab as an independent immutable active skill. */
export function resolveMercJabSkill(rows: readonly unknown[]): RegisteredSkill {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'mskill-jab');
  if (matches.length !== 1) throw new Error('Expected exactly one authored mskill-jab skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored mskill-jab skill');
  const { damage, attackDamagePct, mercJab, hitSequence } = row;
  const manaCost = row.cost.mana;
  if (!damage || !mercJab || !hitSequence || attackDamagePct === undefined || manaCost === undefined ||
    !Number.isInteger(damage.min) || !Number.isInteger(damage.max) || damage.min > damage.max) {
    throw new Error('Invalid authored mskill-jab damage metadata');
  }
  const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType: 'physical',
    base: Object.freeze([damage.min, damage.max] as const), attackDamagePct,
    increasedDamagePct: mercJab.physicalDamagePct / 100,
    hitSequence: Object.freeze({ ...hitSequence }),
    ...(row.appliesTags ? { tags: Object.freeze([...row.appliesTags]) } : {}) });
  return Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'active', target: row.target,
    cooldown: row.cooldown, manaCost, minLevel: row.minLevel, effects: Object.freeze([effect]) });
}

/** JSON-derived mercenary Jab, independent of registry state and player Amazon Jab. */
export const MERC_JAB_SKILL = resolveMercJabSkill(mercenarySkills);
