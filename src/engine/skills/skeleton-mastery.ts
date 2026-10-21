import Ajv2020 from 'ajv/dist/2020';
import necromancerSkills from '../../data/skills/necromancer.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';

/** Independent authored unlock and potency for player Skeleton Mastery. */
export interface SkeletonMasteryDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly summonLifePctPerRank: number;
  readonly summonAttackPctPerRank: number;
  readonly summonDefensePctPerRank: number;
}

const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef & { readonly requiredLevel: number }>(skillSchema);

/** Validate exactly one authored row and copy its primitive Skeleton Mastery tuning. */
export function resolveSkeletonMasteryDefinition(rows: readonly unknown[]): SkeletonMasteryDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-necromancer-skeleton-mastery');
  if (matches.length !== 1) throw new Error('Expected exactly one authored Skeleton Mastery skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored Skeleton Mastery skill');
  const values = row.scaling?.passiveStatsPerLevel;
  if (values?.summonLifePct === undefined || values.summonAttackPct === undefined ||
    values.summonDefensePct === undefined) {
    throw new Error('Missing authored Skeleton Mastery coefficients');
  }
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    summonLifePctPerRank: values.summonLifePct, summonAttackPctPerRank: values.summonAttackPct,
    summonDefensePctPerRank: values.summonDefensePct });
}

/** JSON-derived primitives independent of the mutable catalog and registry. */
export const SKELETON_MASTERY_DEFINITION = resolveSkeletonMasteryDefinition(necromancerSkills);

/** Resolve allocated rank only; authoritative hero composition applies class/level eligibility. */
export function resolveSkeletonMasteryRank(
  levels?: Readonly<Record<string, number>>,
  definition: SkeletonMasteryDefinition = SKELETON_MASTERY_DEFINITION
): number {
  let rank = 0;
  for (const alias of ['skills-necromancer-skeleton-mastery', 'necromancer.skeleton_mastery']) {
    const allocated = levels?.[alias];
    if (typeof allocated === 'number' && Number.isFinite(allocated) &&
      Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definition.maxRank, allocated));
    }
  }
  return rank;
}
