import rows from '../../data/skills/monsters.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const identities = {
  'monster-fire-bolt': 'monster.fire_bolt',
  'monster-fire-ball': 'monster.fire_ball',
  'monster-fire-arrow': 'monster.fire_arrow',
  'monster-inferno': 'monster.inferno',
  'monster-poison-cloud': 'monster.poison_cloud',
  'monster-mephisto-poison-cloud': 'monster.mephisto_poison_cloud',
  'monster-poison-dagger': 'monster.poison_dagger',
  'monster-plague-spit': 'monster.plague_spit',
  'monster-fire-breath': 'monster.fire_breath',
  'monster-poison-spit': 'monster.poison_spit'
} as const;

/** Copy validated rank-one monster elemental hits into immutable native DoT payloads. */
export function resolveMonsterDotSkills(input: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(Object.entries(identities).map(([authored, canonical]) => {
    const matches = input.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === authored);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${authored}`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${authored}`);
    const { damage, damageType, statusEffect } = row;
    const status = row.appliesStatus?.[0];
    if (!damage || !damageType || !statusEffect || !status || damage.min > damage.max ||
      damage.breakdown[damageType] !== damage.max) throw new Error(`Invalid authored ${authored} payload`);
    const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType,
      base: Object.freeze([damage.min, damage.max] as const),
      applyStatus: Object.freeze({ id: status, ...statusEffect }),
      ...(row.projectileFlightMs === undefined ? {} : { projectileFlightMs: row.projectileFlightMs }) });
    // Historical native hits had no combo tags; descriptive catalog tags stay metadata.
    return Object.freeze({ id: canonical, archetype: 'monster', target: row.target,
      cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
      effects: Object.freeze([effect]) });
  }));
}

/** Real monster fire/poison/plague hits, using existing shared periodic integration. */
export const MONSTER_DOT_SKILLS = resolveMonsterDotSkills(rows);
