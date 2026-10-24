import Ajv2020 from 'ajv/dist/2020';
import sorceressSkills from '../../data/skills/sorceress.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { ColdMasteryTuning, SkillDef } from '../types/skills';
import type { Player } from '../types/entities';

/** Independent authored unlock, cap and personal cold penetration tuning. */
export interface ColdMasteryDefinition extends ColdMasteryTuning {
  readonly requiredLevel: number;
  readonly maxRank: number;
}
const validate = new Ajv2020({ strict: true, allErrors: true })
  .compile<SkillDef & { readonly requiredLevel: number; readonly coldMastery: ColdMasteryTuning }>(skillSchema);

/** Validate exactly one authored identity and copy primitives without retaining caller state. */
export function resolveColdMasteryDefinition(rows: readonly unknown[]): ColdMasteryDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-sorceress-cold-mastery');
  if (matches.length !== 1) throw new Error('Expected exactly one authored Cold Mastery skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored Cold Mastery skill');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    resistanceReductionPct: row.coldMastery.resistanceReductionPct,
    resistanceReductionPerRankPct: row.coldMastery.resistanceReductionPerRankPct });
}

/** Immutable JSON-owned definition, independent of the mutable skill registry. */
export const COLD_MASTERY_DEFINITION = resolveColdMasteryDefinition(sorceressSkills);

/** Resolve the maximum valid allocated exact alias once, clamped to the authored cap. */
export function resolveColdMasteryRank(
  levels?: Readonly<Record<string, number>>,
  definition: Pick<ColdMasteryDefinition, 'maxRank'> = COLD_MASTERY_DEFINITION
): number {
  let rank = 0;
  for (const alias of ['skills-sorceress-cold-mastery', 'sorceress.cold_mastery']) {
    const allocated = levels?.[alias];
    if (typeof allocated === 'number' && Number.isFinite(allocated) &&
      Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definition.maxRank, allocated));
    }
  }
  return rank;
}

/** Personal resistance percentage points ignored by an allocated rank; zero when unlearned. */
export function coldMasteryReductionAtRank(
  rank: number,
  definition: ColdMasteryTuning & { readonly maxRank: number } = COLD_MASTERY_DEFINITION
): number {
  if (!Number.isFinite(rank) || !Number.isInteger(rank) || rank <= 0) return 0;
  return definition.resistanceReductionPct +
    (Math.min(definition.maxRank, rank) - 1) * definition.resistanceReductionPerRankPct;
}

/** Compose only an eligible player's allocated passive; no actions, resources or mutation. */
export function composeColdMastery(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  return player.class === 'sorceress' && Number.isFinite(player.level) &&
    player.level >= COLD_MASTERY_DEFINITION.requiredLevel
    ? coldMasteryReductionAtRank(resolveColdMasteryRank(player.skillLevels)) : 0;
}
