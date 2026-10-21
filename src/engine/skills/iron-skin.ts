import Ajv2020 from 'ajv/dist/2020';
import barbarianSkills from '../../data/skills/barbarian.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';

/** Independent authored unlock and potency for the player Iron Skin passive. */
export interface IronSkinDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly defensePctPerRank: number;
}

const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef & { readonly requiredLevel: number }>(skillSchema);

/** Validate exactly one authored Iron Skin row and copy its primitive tuning. */
export function resolveIronSkinDefinition(rows: readonly unknown[]): IronSkinDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-barbarian-iron-skin');
  if (matches.length !== 1) throw new Error('Expected exactly one authored Iron Skin skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored Iron Skin skill');
  const defensePctPerRank = row.scaling?.passiveStatsPerLevel?.defensePct;
  if (defensePctPerRank === undefined) {
    throw new Error('Missing authored Iron Skin defense coefficient');
  }
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, defensePctPerRank });
}

/** JSON-derived values independent of the mutable catalog and registry. */
export const IRON_SKIN_DEFINITION = resolveIronSkinDefinition(barbarianSkills);

/** Resolve allocated rank only; authoritative hero composition applies class/level eligibility. */
export function resolveIronSkinRank(
  levels?: Readonly<Record<string, number>>,
  definition: IronSkinDefinition = IRON_SKIN_DEFINITION
): number {
  let rank = 0;
  for (const alias of ['skills-barbarian-iron-skin', 'barbarian.iron_skin']) {
    const allocated = levels?.[alias];
    if (typeof allocated === 'number' && Number.isFinite(allocated) &&
      Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definition.maxRank, allocated));
    }
  }
  return rank;
}
