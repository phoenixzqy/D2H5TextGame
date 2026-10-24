import { createSkillValidator } from './skill-validator';
import necromancerSkills from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import type { DerivedStats } from '../types/attributes';
import { inferKind, type CombatUnit } from '../combat/types';

/** Independent authored unlock and potency for player Skeleton Mastery. */
export interface SkeletonMasteryDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly summonLifePctPerRank: number;
  readonly summonAttackPctPerRank: number;
  readonly summonDefensePctPerRank: number;
}

const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

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

/** Copied wave tuning; authoritative Player composition establishes class and level eligibility. */
export interface SkeletonMasteryProjection {
  readonly sourceHeroId: string;
  readonly rank: number;
  readonly maxRank: number;
  readonly summonLifePct: number;
  readonly summonAttackPct: number;
  readonly summonDefensePct: number;
}

/** Copy eligible allocated Mastery into immutable primitives without retaining Player/definition references. */
export function composeSkeletonMastery(
  player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>,
  definition: SkeletonMasteryDefinition = SKELETON_MASTERY_DEFINITION
): SkeletonMasteryProjection | undefined {
  if (player.class !== 'necromancer' || !Number.isFinite(player.level) ||
    player.level < definition.requiredLevel) return undefined;
  const rank = resolveSkeletonMasteryRank(player.skillLevels, definition);
  if (rank <= 0) return undefined;
  return Object.freeze({ sourceHeroId: player.id, rank, maxRank: definition.maxRank,
    summonLifePct: rank * definition.summonLifePctPerRank,
    summonAttackPct: rank * definition.summonAttackPctPerRank,
    summonDefensePct: rank * definition.summonDefensePctPerRank });
}

function isValidProjection(projection: SkeletonMasteryProjection | undefined): projection is SkeletonMasteryProjection {
  return !!projection && Number.isInteger(projection.rank) && projection.rank > 0 &&
    Number.isInteger(projection.maxRank) && projection.maxRank > 0 && projection.rank <= projection.maxRank &&
    Number.isFinite(projection.summonLifePct) && projection.summonLifePct >= 0 &&
    Number.isFinite(projection.summonAttackPct) && projection.summonAttackPct >= 0 &&
    Number.isFinite(projection.summonDefensePct) && projection.summonDefensePct >= 0;
}

/**
 * Copy the three Mastery-scaled stats without rounding or changing current life.
 * Callers establish skill/template eligibility; runtime callers also establish owner provenance.
 * An absent or malformed projection leaves the input unchanged.
 */
export function applySkeletonMasteryStats<T extends Pick<DerivedStats, 'lifeMax' | 'attack' | 'defense'>>(
  stats: T,
  projection: SkeletonMasteryProjection | undefined
): T {
  if (!isValidProjection(projection)) return stats;
  return { ...stats, lifeMax: stats.lifeMax * (1 + projection.summonLifePct),
    attack: stats.attack * (1 + projection.summonAttackPct),
    defense: stats.defense * (1 + projection.summonDefensePct) };
}

/**
 * Decorate only a freshly built skeleton/mage, once, before runtime identity allocation.
 * The engine supplies its current encounter owner. This validates provenance within
 * that typed snapshot; it cannot authenticate an arbitrarily forged entire snapshot.
 * Never call on preloaded/damaged or already decorated units.
 */
export function empowerSkeletonSummon(
  projection: SkeletonMasteryProjection | undefined,
  currentOwner: CombatUnit,
  freshSummon: CombatUnit
): CombatUnit {
  if (!isValidProjection(projection) ||
    currentOwner.id !== projection.sourceHeroId || currentOwner.side !== 'player' ||
    inferKind(currentOwner) !== 'hero' || !Number.isFinite(currentOwner.life) || currentOwner.life <= 0 ||
    currentOwner.summon === true || currentOwner.ownerId !== undefined || currentOwner.summonOwnerId !== undefined ||
    freshSummon.side !== 'player' || freshSummon.kind !== 'summon' || freshSummon.summon !== true ||
    freshSummon.summonOwnerId !== currentOwner.id ||
    (freshSummon.ownerId !== undefined && freshSummon.ownerId !== currentOwner.id) ||
    (freshSummon.summonTemplateId !== 'skeleton' && freshSummon.summonTemplateId !== 'skeletal_mage')) {
    return freshSummon;
  }
  const stats = applySkeletonMasteryStats(freshSummon.stats, projection);
  return { ...freshSummon, life: stats.lifeMax, stats: { ...stats, life: stats.lifeMax } };
}
