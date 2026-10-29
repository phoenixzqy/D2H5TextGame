import mercenarySkills from '../../data/skills/mercenary.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const ids = ['mskill-fire-ball', 'mskill-glacial-spike', 'mskill-charged-bolt',
  'mskill-smite', 'mskill-chop', 'mskill-pierce-thrust', 'mskill-basic-swing'] as const;

/** Resolve the complete authored direct-damage mercenary catalog as independent immutable skills. */
export function resolveMercDirectSkills(rows: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(ids.map(id => {
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${id} skill`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${id} skill`);
    const { damage, damageType, hitSequence, critChanceBonus, maxTargets } = row;
    const manaCost = row.cost.mana, statusId = row.appliesStatus?.[0];
    if (!damage || !damageType || manaCost === undefined || !Number.isInteger(damage.min) ||
      !Number.isInteger(damage.max) || damage.min > damage.max || (statusId && !row.statusEffect)) {
      throw new Error(`Invalid authored ${id} damage metadata`);
    }
    const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType,
      base: Object.freeze([damage.min, damage.max] as const),
      ...(hitSequence ? { hitSequence: Object.freeze({ ...hitSequence }) } : {}),
      ...(critChanceBonus !== undefined ? { critChanceBonus } : {}),
      ...(statusId ? { applyStatus: Object.freeze({ id: statusId, ...row.statusEffect }) } : {}),
      ...(row.appliesTags ? { tags: Object.freeze([...row.appliesTags]) } : {}) });
    return Object.freeze({ id, archetype: 'mercenary' as const, trigger: 'active' as const,
      target: row.target, cooldown: row.cooldown, manaCost, minLevel: row.minLevel,
      ...(maxTargets !== undefined ? { maxTargets } : {}), effects: Object.freeze([effect]) });
  }));
}

/** JSON-derived attacks, independent of player skills and remaining mercenary placeholders. */
export const MERC_DIRECT_SKILLS = resolveMercDirectSkills(mercenarySkills);
