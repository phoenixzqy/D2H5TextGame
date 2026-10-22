import Ajv2020 from 'ajv/dist/2020';
import necromancerSkills from '../../data/skills/necromancer.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import { inferKind, type CombatUnit } from '../combat/types';

const AUTHORED = 'skills-necromancer-golem-mastery';
const CLAY = 'skills-necromancer-clay-golem';
const validate = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef & {
  readonly requiredLevel: number; readonly prerequisites?: readonly string[];
  readonly passive?: boolean; readonly aura?: boolean; readonly summon?: boolean;
}>(skillSchema);
const positiveInteger = (value: number) => Number.isInteger(value) && value > 0;
const nonnegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** Independent authored eligibility and potency; no mutable catalog references. */
export interface GolemMasteryDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly clayMaxRank: number;
  readonly golemLifePctPerRank: number;
  readonly golemAttackSpeedPerRank: number;
}

/** Validate the authored passive and its direct prerequisite, then freeze copied primitives. */
export function resolveGolemMasteryDefinition(rows: readonly unknown[]): GolemMasteryDefinition {
  function row(id: string) {
    const matches = rows.filter(value => typeof value === 'object' && value !== null && 'id' in value && value.id === id);
    const value = matches[0];
    if (matches.length !== 1 || !validate(value)) throw new Error('Invalid authored Golem Mastery source');
    return value;
  }
  const mastery = row(AUTHORED), clay = row(CLAY), values = mastery.scaling?.passiveStatsPerLevel;
  if (!positiveInteger(mastery.requiredLevel) || !positiveInteger(mastery.maxLevel) || !positiveInteger(clay.maxLevel) ||
    mastery.passive !== true || mastery.trigger !== 'passive' || mastery.target !== 'self' || mastery.cooldown !== 0 ||
    mastery.prerequisites?.length !== 1 || mastery.prerequisites[0] !== CLAY ||
    ['cost', 'damage', 'damageType', 'appliesStatus', 'statusEffect', 'additionalStatusEffects', 'appliesTags',
      'synergies', 'heal', 'summonId', 'aoeShape', 'requires'].some(key => key in mastery) ||
    mastery.aura === true || mastery.summon === true ||
    !values || !nonnegative(values.golemLifePct) || !nonnegative(values.golemAttackSpeed) ||
    Object.keys(values).length !== 2 || Object.keys(mastery.scaling ?? {}).length !== 1) {
    throw new Error('Invalid authored Golem Mastery semantics');
  }
  return Object.freeze({ requiredLevel: mastery.requiredLevel, maxRank: mastery.maxLevel, clayMaxRank: clay.maxLevel,
    golemLifePctPerRank: values.golemLifePct, golemAttackSpeedPerRank: values.golemAttackSpeed });
}

/** JSON-derived tuning independent of runtime skill registry mutation. */
export const GOLEM_MASTERY_DEFINITION = resolveGolemMasteryDefinition(necromancerSkills);

function allocated(levels: Readonly<Record<string, number>> | undefined, aliases: readonly string[], maximum: number,
  clamp: boolean): number {
  let rank = 0;
  for (const id of aliases) {
    const value = levels?.[id];
    if (typeof value === 'number' && Number.isFinite(value) && positiveInteger(value) && (clamp || value <= maximum)) {
      rank = Math.max(rank, Math.min(maximum, value));
    }
  }
  return rank;
}

/** Resolve exact allocated aliases once, without implicit rank one, combo or gear fallback. */
export function resolveGolemMasteryRank(levels?: Readonly<Record<string, number>>,
  definition: GolemMasteryDefinition = GOLEM_MASTERY_DEFINITION): number {
  return allocated(levels, [AUTHORED, 'necromancer.golem_mastery'], definition.maxRank, true);
}

/** Copied wave potency bound to one authoritative Player; CombatUnit cannot establish class. */
export interface GolemMasteryProjection {
  readonly sourceHeroId: string;
  readonly rank: number;
  readonly maxRank: number;
  readonly golemLifePct: number;
  readonly golemAttackSpeed: number;
}

/** Require actual Necromancer eligibility and allocated Clay prerequisite, without charging an action or slot. */
export function composeGolemMastery(player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>,
  definition: GolemMasteryDefinition = GOLEM_MASTERY_DEFINITION): GolemMasteryProjection | undefined {
  if (player.id.length === 0 || player.class !== 'necromancer' || !Number.isInteger(player.level) ||
    player.level < definition.requiredLevel ||
    allocated(player.skillLevels, [CLAY, 'necromancer.clay_golem'], definition.clayMaxRank, false) === 0) return undefined;
  const rank = resolveGolemMasteryRank(player.skillLevels, definition);
  if (rank === 0) return undefined;
  const golemLifePct = rank * definition.golemLifePctPerRank, golemAttackSpeed = rank * definition.golemAttackSpeedPerRank;
  if (!nonnegative(golemLifePct) || !nonnegative(golemAttackSpeed)) return undefined;
  return Object.freeze({ sourceHeroId: player.id, rank, maxRank: definition.maxRank, golemLifePct, golemAttackSpeed });
}

/**
 * Apply once to a fresh owned golem, after rank scaling and Iron item inheritance.
 * Callers never pass preloaded or already decorated units. Invalid authority is
 * inert; arithmetic overflow refuses the candidate before preparation payment.
 * Typed snapshot provenance cannot authenticate an arbitrarily forged snapshot.
 */
export function empowerGolemSummon(projection: GolemMasteryProjection | undefined,
  owner: CombatUnit, fresh: CombatUnit): CombatUnit | undefined {
  if (!projection || !positiveInteger(projection.rank) || !positiveInteger(projection.maxRank) ||
    projection.rank > projection.maxRank || !nonnegative(projection.golemLifePct) ||
    !nonnegative(projection.golemAttackSpeed) || projection.sourceHeroId.length === 0 ||
    owner.id !== projection.sourceHeroId || owner.side !== 'player' || inferKind(owner) !== 'hero' ||
    !Number.isFinite(owner.life) || owner.life <= 0 || owner.summon === true ||
    owner.ownerId !== undefined || owner.summonOwnerId !== undefined ||
    fresh.side !== 'player' || fresh.kind !== 'summon' || fresh.summon !== true ||
    fresh.summonOwnerId !== owner.id || (fresh.ownerId !== undefined && fresh.ownerId !== owner.id) ||
    !['clay_golem', 'blood_golem', 'iron_golem', 'fire_golem'].includes(fresh.summonTemplateId ?? '') ||
    fresh.life !== fresh.stats.lifeMax || fresh.stats.life !== fresh.stats.lifeMax) return fresh;
  const lifeMax = fresh.stats.lifeMax * (1 + projection.golemLifePct);
  const attackSpeed = fresh.stats.attackSpeed + projection.golemAttackSpeed;
  if (!nonnegative(lifeMax) || lifeMax === 0 || !nonnegative(attackSpeed)) return undefined;
  return { ...fresh, life: lifeMax, stats: { ...fresh.stats, life: lifeMax, lifeMax, attackSpeed } };
}
