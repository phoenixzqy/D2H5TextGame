import rows from '../../data/skills/monsters.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, HealEffect, RegisteredSkill, SkillEffect } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const identities = {
  'monster-heal': 'monster.heal',
  'monster-lightning-bolt': 'monster.lightning_bolt',
  'monster-thunder-storm': 'monster.thunder_storm',
  'monster-lightning': 'monster.lightning'
} as const;

/** Validate and copy rank-one native self healing and finite lightning disruption. */
export function resolveMonsterHealLightningSkills(input: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(Object.entries(identities).map(([authored, canonical]) => {
    const matches = input.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === authored);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${authored}`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${authored}`);
    let effect: SkillEffect;
    if (authored === 'monster-heal') {
      const pct = row.heal?.pctOfMaxLife;
      if (pct === undefined) throw new Error('Monster Heal requires max-life recovery');
      const heal: HealEffect = Object.freeze({ kind: 'heal', target: 'self', pctOfMaxLife: pct });
      effect = heal;
    } else {
      const { damage, statusEffect } = row;
      if (!damage || !statusEffect || damage.min > damage.max || damage.breakdown.lightning !== damage.max)
        throw new Error(`Invalid authored ${authored} payload`);
      const hit: DamageEffect = Object.freeze({ kind: 'damage', damageType: 'lightning',
        base: Object.freeze([damage.min, damage.max] as const),
        applyStatus: Object.freeze({ id: 'paralyze', ...statusEffect }),
        ...(row.projectileFlightMs === undefined ? {} : { projectileFlightMs: row.projectileFlightMs }) });
      // Native lightning had no combo tags; catalog tags remain descriptive metadata.
      effect = hit;
    }
    return Object.freeze({ id: canonical, archetype: 'monster', target: row.target,
      cooldown: row.cooldown, manaCost: row.cost.mana ?? 0, minLevel: row.minLevel,
      effects: Object.freeze([effect]) });
  }));
}

/** Authored native Heal and lightning payloads consumed by the existing pure engine. */
export const MONSTER_HEAL_LIGHTNING_SKILLS = resolveMonsterHealLightningSkills(rows);
