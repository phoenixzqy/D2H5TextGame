import necromancer from '../../data/skills/necromancer.json';
import type { Player } from '../types/entities';
import type { DerivedStats } from '../types/attributes';
import type { SkillDef } from '../types/skills';
import { inferKind, type CombatUnit } from '../combat/types';
import { createSkillValidator } from './skill-validator';
import { composeGolemMastery, empowerGolemSummon, type GolemMasteryProjection } from './golem-mastery';
import { empowerSkeletonSummon, type SkeletonMasteryProjection } from './skeleton-mastery';

/** Exact global passives; no generic passive metadata is activated. */
export const SUMMON_PASSIVE_IDENTITIES = {
  mastery: ['skills-necromancer-summon-mastery', 'necromancer.summon_mastery'],
  resist: ['skills-necromancer-summon-resist', 'necromancer.summon_resist'],
} as const;
const templates = ['skeleton', 'skeletal_mage', 'clay_golem', 'blood_golem', 'iron_golem', 'fire_golem', 'revived'];
const resistanceTypes = ['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison'] as const;
const finiteNonnegative = (value: number) => Number.isFinite(value) && value >= 0;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Copied immutable authored tuning, independent of the runtime registry. */
export interface SummonPassiveDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly lifePerRank: number;
  readonly attackPerRank: number;
  readonly resistPerRank: number;
}
type Definitions = Readonly<Record<keyof typeof SUMMON_PASSIVE_IDENTITIES, SummonPassiveDefinition>>;
/** Validate each exact source row and retain only copied primitives. */
export function resolveSummonPassiveDefinitions(rows: readonly unknown[]): Definitions {
  const read = (key: keyof Definitions): SummonPassiveDefinition => {
    const id = SUMMON_PASSIVE_IDENTITIES[key][0];
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    const row = matches[0];
    if (matches.length !== 1 || !validate(row)) throw new Error('Invalid authored ' + id);
    const values = row.scaling?.passiveStatsPerLevel;
    return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
      lifePerRank: values?.summonLifePct ?? 0, attackPerRank: values?.summonAttackPct ?? 0,
      resistPerRank: values?.summonResistAllPct ?? 0 });
  };
  return Object.freeze({ mastery: read('mastery'), resist: read('resist') });
}
export const SUMMON_PASSIVE_DEFINITIONS = resolveSummonPassiveDefinitions(necromancer);

/** Per-wave global potency bound to one authoritative hero. Resistance uses percentage points. */
export interface SummonPassiveProjection {
  readonly sourceHeroId: string;
  readonly masteryRank: number;
  readonly resistRank: number;
  readonly masteryMaxRank: number;
  readonly resistMaxRank: number;
  readonly lifePct: number;
  readonly attackPct: number;
  readonly resistAllBonus: number;
}
/** Resolve eligible allocated aliases once; never infer ranks from active skills or equipment. */
export function composeSummonPassives(player: Pick<Player, 'id' | 'class' | 'level' | 'skillLevels'>,
  definitions: Definitions = SUMMON_PASSIVE_DEFINITIONS): SummonPassiveProjection | undefined {
  if (!player.id || player.class !== 'necromancer' || !Number.isFinite(player.level)) return undefined;
  const rank = (key: keyof Definitions): number => {
    const definition = definitions[key];
    if (player.level < definition.requiredLevel || (key === 'resist' && !composeGolemMastery(player))) return 0;
    let rank = 0;
    for (const alias of SUMMON_PASSIVE_IDENTITIES[key]) {
      const value = player.skillLevels?.[alias];
      if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0) {
        rank = Math.max(rank, Math.min(definition.maxRank, value));
      }
    }
    return rank;
  };
  const masteryRank = rank('mastery'), resistRank = rank('resist');
  if (masteryRank === 0 && resistRank === 0) return undefined;
  const lifePct = masteryRank * definitions.mastery.lifePerRank;
  const attackPct = masteryRank * definitions.mastery.attackPerRank;
  const resistAllBonus = resistRank * definitions.resist.resistPerRank * 100;
  if (![lifePct, attackPct, resistAllBonus].every(finiteNonnegative)) return undefined;
  return Object.freeze({ sourceHeroId: player.id, masteryRank, resistRank,
    masteryMaxRank: definitions.mastery.maxRank, resistMaxRank: definitions.resist.maxRank,
    lifePct, attackPct, resistAllBonus });
}
function valid(projection: SummonPassiveProjection | undefined): projection is SummonPassiveProjection {
  return !!projection && typeof projection.sourceHeroId === 'string' && projection.sourceHeroId.length > 0 &&
    [projection.masteryRank, projection.resistRank].every(value => Number.isInteger(value) && value >= 0) &&
    [projection.masteryMaxRank, projection.resistMaxRank].every(value => Number.isInteger(value) && value > 0) &&
    projection.masteryRank <= projection.masteryMaxRank && projection.resistRank <= projection.resistMaxRank &&
    projection.masteryRank + projection.resistRank > 0 &&
    [projection.lifePct, projection.attackPct, projection.resistAllBonus].every(finiteNonnegative) &&
    (projection.masteryRank > 0 || (projection.lifePct === 0 && projection.attackPct === 0)) &&
    (projection.resistRank > 0 || projection.resistAllBonus === 0);
}
/** Sum global percentages over the fresh baseline, preserving local bonuses without compounding. */
export function applySummonPassiveStats(baseline: DerivedStats, local: DerivedStats,
  templateId: string, projection?: SummonPassiveProjection): DerivedStats | undefined {
  if (!templates.includes(templateId) || !valid(projection)) return local;
  const lifeMax = local.lifeMax + baseline.lifeMax * projection.lifePct;
  const attack = local.attack + baseline.attack * projection.attackPct;
  const resistances = { ...local.resistances };
  for (const type of resistanceTypes) resistances[type] += projection.resistAllBonus;
  if (![lifeMax, attack].every(finiteNonnegative) || lifeMax === 0 ||
    !Object.values(resistances).every(Number.isFinite)) return undefined;
  return { ...local, lifeMax, attack, resistances };
}
/**
 * Decorate a fresh full-health summon before runtime registration. All creation paths
 * share this boundary; preloaded/damaged units must never be passed here.
 * Invalid authority is inert; overflow refuses the candidate before preparation payment.
 */
export function empowerNecromancerSummon(owner: CombatUnit, fresh: CombatUnit,
  skeleton?: SkeletonMasteryProjection, golem?: GolemMasteryProjection,
  global?: SummonPassiveProjection): CombatUnit | undefined {
  if (fresh.life !== fresh.stats.lifeMax || fresh.stats.life !== fresh.stats.lifeMax) return fresh;
  const local = empowerGolemSummon(golem, owner, empowerSkeletonSummon(skeleton, owner, fresh));
  if (!local) return undefined;
  if (!valid(global) || owner.id !== global.sourceHeroId || owner.side !== 'player' || inferKind(owner) !== 'hero' ||
    !Number.isFinite(owner.life) || owner.life <= 0 || owner.summon === true ||
    owner.ownerId !== undefined || owner.summonOwnerId !== undefined ||
    fresh.side !== 'player' || fresh.kind !== 'summon' || fresh.summon !== true ||
    fresh.summonOwnerId !== owner.id || (fresh.ownerId !== undefined && fresh.ownerId !== owner.id) ||
    fresh.life !== fresh.stats.lifeMax || fresh.stats.life !== fresh.stats.lifeMax) return local;
  const stats = applySummonPassiveStats(fresh.stats, local.stats, fresh.summonTemplateId ?? '', global);
  return stats ? { ...local, life: stats.lifeMax, stats: { ...stats, life: stats.lifeMax } } : undefined;
}
