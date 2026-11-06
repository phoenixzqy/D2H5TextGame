import rows from '../../data/skills/mercenary.json';
import type { SkillDef } from '../types/skills';
import type { DamageEffect, RegisteredSkill, WeightedDamageComponent } from './effects';
import { createSkillValidator } from './skill-validator';

const validate = createSkillValidator<SkillDef>();
const ids = ['mskill-fire-arrow', 'mskill-cold-arrow'] as const;

/** Copy only the exact authored elemental Rogue arrows into immutable runtime definitions. */
export function resolveMercElementalArrows(source: readonly unknown[]): readonly RegisteredSkill[] {
  return Object.freeze(ids.map(id => {
    const matches = source.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    if (matches.length !== 1) throw new Error(`Expected exactly one authored ${id}`);
    const row = matches[0];
    if (!validate(row)) throw new Error(`Invalid authored ${id}`);
    const { damage, attackDamagePct, mercElementalArrow: tuning, statusEffect } = row;
    const element = id === 'mskill-fire-arrow' ? 'fire' : 'cold';
    const physical = damage?.breakdown.physical, elemental = damage?.breakdown[element];
    if (!damage || damage.min > damage.max || attackDamagePct === undefined || !tuning ||
      !statusEffect || physical === undefined || elemental === undefined || row.cost.mana === undefined)
      throw new Error(`Invalid authored ${id} component metadata`);
    const components: readonly [WeightedDamageComponent, WeightedDamageComponent] = Object.freeze([
      Object.freeze({ damageType: 'physical', weight: physical }),
      Object.freeze({ damageType: element, weight: elemental })
    ]);
    const effect: DamageEffect = Object.freeze({ kind: 'damage', damageType: 'physical',
      base: Object.freeze([damage.min, damage.max] as const), attackDamagePct, components,
      mercElementalArrow: Object.freeze(tuning.splash ? { splash: Object.freeze({ ...tuning.splash }) } : {}),
      applyStatus: Object.freeze({ id: element === 'fire' ? 'burn' : 'chill',
        damageType: element, ...statusEffect }),
      tags: Object.freeze([...(row.appliesTags ?? [])]) });
    return Object.freeze({ id, archetype: 'mercenary', trigger: 'active', target: row.target,
      cooldown: row.cooldown, manaCost: row.cost.mana, minLevel: row.minLevel,
      effects: Object.freeze([effect]) });
  }));
}

/** Independent JSON-derived Fire/Cold definitions; Basic/Pierce keep their separate resolver. */
export const MERC_ELEMENTAL_ARROWS = resolveMercElementalArrows(rows);
