import rows from '../../data/skills/monsters.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const identities = {
  'monster-charge': 'monster.charge',
  'monster-rend': 'monster.rend',
  'monster-leap': 'monster.leap',
  'monster-leap-attack': 'monster.leap_attack',
  'monster-war-cry': 'monster.war_cry'
} as const;

/** Validate five authored physical actions and return independent immutable native payloads. */
export function resolveMonsterPhysicalSkills(rows: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(Object.entries(identities).map(([authored, canonical]) => {
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === authored);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${authored}`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${authored}`);
    const { damage, damageType } = row;
    if (!damage || !damageType || damage.min > damage.max || damage.breakdown.physical !== damage.max) {
      throw new Error(`Invalid authored ${authored} damage range`);
    }
    const status = row.appliesStatus?.[0];
    const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType,
      base: Object.freeze([damage.min, damage.max] as const),
      ...(row.attackDamagePct !== undefined ? { attackDamagePct: row.attackDamagePct } : {}),
      ...(status ? { applyStatus: Object.freeze({ id: status, ...row.statusEffect }) } : {}) });
    // Previous native payloads had no combo tags. Catalog tags are descriptive here.
    return Object.freeze({ id: canonical, archetype: 'monster', target: row.target,
      cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
      effects: Object.freeze([effect]) });
  }));
}

/** Real monster strikes; delivery remains authenticated by the native registry. */
export const MONSTER_PHYSICAL_SKILLS = resolveMonsterPhysicalSkills(rows);
