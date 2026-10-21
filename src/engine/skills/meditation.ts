import Ajv2020 from 'ajv/dist/2020';
import paladinSkills from '../../data/skills/paladin.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';

/** Independent authored unlock and source-baseline recovery fraction per Meditation rank. */
export interface MeditationDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly manaRegenPctPerRank: number;
}

const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef & { readonly requiredLevel: number }>(skillSchema);

/** Validate exactly one authored player Meditation row and copy only primitive tuning. */
export function resolveMeditationDefinition(rows: readonly unknown[]): MeditationDefinition {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-paladin-meditation');
  if (matches.length !== 1) throw new Error('Expected exactly one authored player Meditation skill');
  const row = matches[0];
  if (!validate(row)) throw new Error('Invalid authored player Meditation skill');
  const manaRegenPctPerRank = row.scaling?.passiveStatsPerLevel?.manaRegenPct;
  if (manaRegenPctPerRank === undefined) throw new Error('Missing authored player Meditation coefficient');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, manaRegenPctPerRank });
}

/** JSON-derived primitives independent of the mutable skill catalog and registry. */
export const MEDITATION_DEFINITION = resolveMeditationDefinition(paladinSkills);

/** Resolve allocated rank only; selection, class, level and encounter life are independent. */
export function resolveMeditationRank(
  levels?: Readonly<Record<string, number>>,
  definition: MeditationDefinition = MEDITATION_DEFINITION
): number {
  let rank = 0;
  for (const alias of ['skills-paladin-meditation', 'paladin.meditation']) {
    const allocated = levels?.[alias];
    if (typeof allocated === 'number' && Number.isFinite(allocated) &&
      Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, allocated);
    }
  }
  return Math.min(definition.maxRank, rank);
}

/** Eligible allocated rank; callers separately check explicit selection and encounter source life. */
export function resolveEligibleMeditationRank(
  player: Pick<Player, 'class' | 'level' | 'skillLevels'>,
  definition: MeditationDefinition = MEDITATION_DEFINITION
): number {
  if (player.class !== 'paladin' || !Number.isFinite(player.level) || player.level < definition.requiredLevel) {
    return 0;
  }
  return resolveMeditationRank(player.skillLevels, definition);
}
