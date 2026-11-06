import rows from '../../data/skills/monsters.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const identities = {
  'monster-frost-bolt': 'monster.frost_bolt',
  'monster-bone-spirit': 'monster.bone_spirit',
  'monster-whirlwind': 'monster.whirlwind',
  'monster-mana-rift': 'monster.mana_rift',
  'monster-weak-ranged': 'monster.weak_ranged',
  'monster-weak-melee': 'monster.weak_melee',
  'monster-strong-melee': 'monster.strong_melee',
  'monster-frost-aura': 'monster.frost_aura'
} as const;

/** Validate JSON-owned direct monster actions and copy their immutable native payloads. */
export function resolveMonsterDirectSkills(input: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(Object.entries(identities).map(([authored, canonical]) => {
    const matches = input.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === authored);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${authored}`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${authored}`);
    const { damage, damageType } = row;
    if (!damage || !damageType || damage.min > damage.max || damage.breakdown[damageType] !== damage.max) {
      throw new Error(`Invalid authored ${authored} damage range`);
    }
    const status = row.appliesStatus?.[0];
    const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType,
      base: Object.freeze([damage.min, damage.max] as const),
      ...(status ? { applyStatus: Object.freeze({ id: status }) } : {}),
      ...(row.projectileFlightMs === undefined ? {} : { projectileFlightMs: row.projectileFlightMs }) });
    // Catalog tags describe the action; the accepted native payload has no combo tags.
    return Object.freeze({ id: canonical, archetype: 'monster', target: row.target,
      cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
      effects: Object.freeze([effect]) });
  }));
}

/** Direct monster strikes and spells retain the adopted P15 combat behavior. */
export const MONSTER_DIRECT_SKILLS = resolveMonsterDirectSkills(rows);
