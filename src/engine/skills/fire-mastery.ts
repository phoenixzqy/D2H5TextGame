import { createSkillValidator } from './skill-validator';
import sorceressSkills from '../../data/skills/sorceress.json';
import type { SkillDef } from '../types/skills';

/** Independent authored unlock and potency for the player Fire Mastery passive. */
export interface FireMasteryDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly fireDamagePctPerRank: number;
}

const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate exactly one authored Fire Mastery row and copy its primitive tuning. */
export function resolveFireMasteryDefinition(rows: readonly unknown[]): FireMasteryDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-sorceress-fire-mastery');
  if (matches.length !== 1) throw new Error('Expected exactly one authored Fire Mastery skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored Fire Mastery skill');
  const fireDamagePctPerRank = row.scaling?.passiveStatsPerLevel?.fireDamagePct;
  if (fireDamagePctPerRank === undefined) {
    throw new Error('Missing authored Fire Mastery fire coefficient');
  }
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, fireDamagePctPerRank });
}

/** JSON-derived values independent of the mutable catalog and registry. */
export const FIRE_MASTERY_DEFINITION = resolveFireMasteryDefinition(sorceressSkills);

/** Resolve allocated rank only; authoritative hero composition applies class/level eligibility. */
export function resolveFireMasteryRank(
  levels?: Readonly<Record<string, number>>,
  definition: FireMasteryDefinition = FIRE_MASTERY_DEFINITION
): number {
  let rank = 0;
  for (const alias of ['skills-sorceress-fire-mastery', 'sorceress.fire_mastery']) {
    const allocated = levels?.[alias];
    if (typeof allocated === 'number' && Number.isFinite(allocated) &&
      Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definition.maxRank, allocated));
    }
  }
  return rank;
}
