import { createSkillValidator } from './skill-validator';
import sorceressSkills from '../../data/skills/sorceress.json';
import type { SkillDef } from '../types/skills';

/** Independent authored potency for the paid player Frozen Armor buff. */
export interface FrozenArmorDefinition {
  readonly maxRank: number;
  readonly defensePctPerRank: number;
}

const validate = createSkillValidator<SkillDef>();

/** Validate exactly one authored player Frozen Armor row and copy its primitive tuning. */
export function resolveFrozenArmorDefinition(rows: readonly unknown[]): FrozenArmorDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-sorceress-frozen-armor');
  if (matches.length !== 1) throw new Error('Expected exactly one authored player Frozen Armor skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored player Frozen Armor skill');
  const defensePctPerRank = row.scaling?.passiveStatsPerLevel?.defensePct;
  if (defensePctPerRank === undefined) throw new Error('Missing authored player Frozen Armor defense');
  return Object.freeze({ maxRank: row.maxLevel, defensePctPerRank });
}

/** JSON-derived values independent of the mutable catalog and registry. */
export const FROZEN_ARMOR_DEFINITION = resolveFrozenArmorDefinition(sorceressSkills);

/** Resolve allocation without the active-skill rank-one fallback; shared by cast and wave boundaries. */
export function resolveFrozenArmorRank(
  levels?: Readonly<Record<string, number>>,
  definition: FrozenArmorDefinition = FROZEN_ARMOR_DEFINITION
): number {
  let rank = 0;
  for (const alias of ['skills-sorceress-frozen-armor', 'sorceress.frozen_armor']) {
    const allocated = levels?.[alias];
    if (typeof allocated === 'number' && Number.isFinite(allocated) &&
      Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definition.maxRank, allocated));
    }
  }
  return rank;
}
