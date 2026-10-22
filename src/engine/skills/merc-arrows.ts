import Ajv2020 from 'ajv/dist/2020';
import mercenarySkills from '../../data/skills/mercenary.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef>(skillSchema);
const ids = ['mskill-basic-arrow', 'mskill-pierce-arrow'] as const;

/** Resolve exactly the reviewed authored arrows into independent immutable runtime skills. */
export function resolveMercArrowSkills(rows: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(ids.map(id => {
    const matches = rows.filter(row => typeof row === 'object' && row !== null &&
      'id' in row && row.id === id);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${id} skill`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${id} skill`);
    const damage = row.damage;
    const attackDamagePct = row.attackDamagePct;
    const manaCost = row.cost.mana;
    if (!damage || attackDamagePct === undefined || manaCost === undefined ||
      !Number.isInteger(damage.min) || !Number.isInteger(damage.max) || damage.min > damage.max) {
      throw new Error(`Invalid authored ${id} damage metadata`);
    }
    const effect: DamageEffect = Object.freeze({
      kind: 'damage', damageType: 'physical',
      base: Object.freeze([damage.min, damage.max] as const), attackDamagePct,
      ...(row.appliesTags ? { tags: Object.freeze([...row.appliesTags]) } : {})
    });
    return Object.freeze({ id, archetype: 'mercenary', target: row.target,
      cooldown: row.cooldown, manaCost, minLevel: row.minLevel, effects: Object.freeze([effect]) });
  }));
}

/** JSON-derived Basic/Pierce definitions, independent of registry state. */
export const MERC_ARROW_SKILLS = resolveMercArrowSkills(mercenarySkills);
