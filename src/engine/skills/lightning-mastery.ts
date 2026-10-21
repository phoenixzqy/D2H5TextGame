import Ajv2020 from 'ajv/dist/2020';
import sorceressSkills from '../../data/skills/sorceress.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';

/** Independent authored unlock and potency for the player Lightning Mastery passive. */
export interface LightningMasteryDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly lightningDamagePctPerRank: number;
}

const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef & { readonly requiredLevel: number }>(skillSchema);

/** Validate exactly one authored Lightning Mastery row and copy its primitive tuning. */
export function resolveLightningMasteryDefinition(rows: readonly unknown[]): LightningMasteryDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-sorceress-lightning-mastery');
  if (matches.length !== 1) throw new Error('Expected exactly one authored Lightning Mastery skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored Lightning Mastery skill');
  const lightningDamagePctPerRank = row.scaling?.passiveStatsPerLevel?.lightningDamagePct;
  if (lightningDamagePctPerRank === undefined) {
    throw new Error('Missing authored Lightning Mastery lightning coefficient');
  }
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, lightningDamagePctPerRank });
}

/** JSON-derived values independent of the mutable catalog and registry. */
export const LIGHTNING_MASTERY_DEFINITION = resolveLightningMasteryDefinition(sorceressSkills);

/** Resolve allocated rank only; authoritative hero composition applies class/level eligibility. */
export function resolveLightningMasteryRank(
  levels?: Readonly<Record<string, number>>,
  definition: LightningMasteryDefinition = LIGHTNING_MASTERY_DEFINITION
): number {
  let rank = 0;
  for (const alias of ['skills-sorceress-lightning-mastery', 'sorceress.lightning_mastery']) {
    const allocated = levels?.[alias];
    if (typeof allocated === 'number' && Number.isFinite(allocated) &&
      Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definition.maxRank, allocated));
    }
  }
  return rank;
}
