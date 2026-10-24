import { createSkillValidator } from './skill-validator';
import paladinSkills from '../../data/skills/paladin.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import { inferKind, type CombatUnit } from '../combat/types';

/** Independent authored unlock and source-baseline recovery fraction per Meditation rank. */
export interface MeditationDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly manaRegenPctPerRank: number;
}

const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

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


/** Selected Meditation tuning captured once per wave, with exact factors kept separate. */
export interface MeditationAuraProjection {
  readonly selectedAuraId: 'paladin.meditation';
  readonly sourceHeroId: string;
  readonly fieldedMercCombatId?: string;
  readonly rank: number;
  readonly maxRank: number;
  readonly sourceBaselinePerSecond: number;
  readonly manaRegenPctPerRank: number;
}

function isMeditationSelection(value: unknown): value is 'paladin.meditation' {
  return value === 'paladin.meditation';
}

/** Copy eligible selection and authoritative adapter baseline without multiplying tuning. */
export function composeMeditationAura(
  player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels' | 'selectedAuraId'>,
  sourceBaselinePerSecond: number,
  fieldedMercCombatId?: string,
  definition: MeditationDefinition = MEDITATION_DEFINITION
): MeditationAuraProjection | undefined {
  if (!isMeditationSelection(player.selectedAuraId) ||
    !Number.isFinite(sourceBaselinePerSecond) || sourceBaselinePerSecond < 0) return undefined;
  const rank = resolveEligibleMeditationRank(player, definition);
  if (rank <= 0) return undefined;
  return Object.freeze({ selectedAuraId: 'paladin.meditation', sourceHeroId: player.id, rank,
    maxRank: definition.maxRank, sourceBaselinePerSecond, manaRegenPctPerRank: definition.manaRegenPctPerRank,
    ...(fieldedMercCombatId && fieldedMercCombatId !== player.id ? { fieldedMercCombatId } : {}) });
}

function livingPlayer(unit: CombatUnit | undefined): unit is CombatUnit {
  return unit !== undefined && unit.side === 'player' && Number.isFinite(unit.life) && unit.life > 0 &&
    unit.summon !== true && unit.ownerId === undefined && unit.summonOwnerId === undefined;
}

/** Qualify the interval-start source and original recipient; crowd control is irrelevant. */
export function activeMeditationAura(
  aura: MeditationAuraProjection | undefined,
  recipientId: string,
  units: ReadonlyMap<string, CombatUnit>
): MeditationAuraProjection | undefined {
  if (!aura || !isMeditationSelection(aura.selectedAuraId) || !Number.isInteger(aura.rank) ||
    aura.rank <= 0 || !Number.isInteger(aura.maxRank) || aura.maxRank <= 0 || aura.rank > aura.maxRank ||
    !Number.isFinite(aura.sourceBaselinePerSecond) || aura.sourceBaselinePerSecond < 0 ||
    !Number.isFinite(aura.manaRegenPctPerRank) || aura.manaRegenPctPerRank < 0) return undefined;
  const source = units.get(aura.sourceHeroId);
  if (!livingPlayer(source) || source.id !== aura.sourceHeroId || inferKind(source) !== 'hero') return undefined;
  const recipient = units.get(recipientId);
  if (!livingPlayer(recipient) || recipient.id !== recipientId) return undefined;
  if (recipientId === aura.sourceHeroId) return aura;
  return recipientId === aura.fieldedMercCombatId && inferKind(recipient) === 'merc' ? aura : undefined;
}
