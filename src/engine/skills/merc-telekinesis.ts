import rows from '../../data/skills/mercenary.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();

/** Resolve the exact authored damaging mercenary Telekinesis into an immutable skill. */
export function resolveMercTelekinesisSkill(source: readonly unknown[]): RegisteredSkill {
  const matches = source.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'mskill-telekinesis');
  if (matches.length !== 1) throw new Error('Expected exactly one authored mskill-telekinesis skill');
  const row = matches[0];
  if (!validate(row) || !row.damage || !row.statusEffect || row.cost.mana === undefined) {
    throw new Error('Invalid authored mskill-telekinesis skill');
  }
  const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType: 'arcane',
    base: Object.freeze([row.damage.min, row.damage.max] as const),
    applyStatus: Object.freeze({ id: 'stun', ...row.statusEffect }),
    ...(row.appliesTags ? { tags: Object.freeze([...row.appliesTags]) } : {}) });
  return Object.freeze({ id: row.id, archetype: 'mercenary', trigger: 'active',
    target: row.target, cooldown: row.cooldown, manaCost: row.cost.mana,
    minLevel: row.minLevel, effects: Object.freeze([effect]) });
}

/** Ordinary Arcane attack with landed Stun, separate from player Telekinesis utility. */
export const MERC_TELEKINESIS_SKILL = resolveMercTelekinesisSkill(rows);
