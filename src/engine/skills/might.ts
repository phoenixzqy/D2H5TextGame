import Ajv2020 from 'ajv/dist/2020';
import paladinSkills from '../../data/skills/paladin.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';

/** Independent authored unlock and both player Might aura coefficients. */
export interface MightDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly physicalDamagePctPerRank: number;
  readonly attackPctPerRank: number;
}

const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef & { readonly requiredLevel: number }>(skillSchema);

/** Validate exactly one authored player Might row and copy only primitive tuning. */
export function resolveMightDefinition(rows: readonly unknown[]): MightDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-paladin-might');
  if (matches.length !== 1) throw new Error('Expected exactly one authored player Might skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored player Might skill');
  const physicalDamagePctPerRank = row.scaling?.passiveStatsPerLevel?.physicalDamagePct;
  const attackPctPerRank = row.scaling?.passiveStatsPerLevel?.attackPct;
  if (physicalDamagePctPerRank === undefined || attackPctPerRank === undefined) {
    throw new Error('Missing authored player Might coefficients');
  }
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    physicalDamagePctPerRank, attackPctPerRank });
}

/** JSON-derived values independent of mutable skill catalog and registry. */
export const MIGHT_DEFINITION = resolveMightDefinition(paladinSkills);

/** Allocation only; later composition independently checks selection/class/level eligibility. */
export function resolveMightRank(
  levels?: Readonly<Record<string, number>>,
  definition: MightDefinition = MIGHT_DEFINITION
): number {
  let rank = 0;
  for (const alias of ['skills-paladin-might', 'paladin.might']) {
    const allocated = levels?.[alias];
    if (typeof allocated === 'number' && Number.isFinite(allocated) &&
      Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definition.maxRank, allocated));
    }
  }
  return rank;
}
