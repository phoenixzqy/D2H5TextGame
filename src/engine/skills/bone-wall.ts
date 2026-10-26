import type { ActiveStatus, CombatUnit } from '../combat/types';
import type { Player } from '../types/entities';
import type { RegisteredSkill } from './effects';
import { BONE_WALL_DEFINITION as d, BONE_WALL_IDS } from '../combat/bone-wall-definition';
import { projectPlayerClassActives } from './player-class-actives';
import { validCapturedSkillRank } from './effective-rank';

/** Actual class allocation and complete prerequisites, independently resolved each wave. */
export function composeBoneWallRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [BONE_WALL_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[BONE_WALL_IDS[1]] ?? 0 : 0;
}
function personalHero(unit: CombatUnit): boolean {
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined && unit.id.length > 0 &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) && unit.level >= d.requiredLevel;
}
/** Explicit learned authority; combo IDs and presentation markers supply none. */
export function boneWallRank(unit: CombatUnit): number {
  const rank = unit.boneWallRank;
  return personalHero(unit) && typeof rank === 'number' && Number.isInteger(rank) && rank > 0 && rank <= d.maxRank ? rank : 0;
}
/** Exact registry qualification before payment or cooldown publication. */
export function matchesBoneWall(skill: RegisteredSkill): boolean {
  const effect = skill.effects[0];
  return skill.id === BONE_WALL_IDS[1] && skill.archetype === 'necromancer' &&
    skill.trigger === 'active' && skill.target === 'self' && skill.isBuff === true &&
    skill.summonOnStart !== true && skill.requires === undefined && skill.aoeShape === undefined &&
    skill.maxTargets === undefined && skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost && skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.costPerRank && skill.cooldownPerRank === d.cooldownPerRank &&
    skill.effects.length === 1 && effect?.kind === 'buff' && effect.id === 'bone-wall' &&
    effect.boneWall === true && effect.duration === d.durationMs / 1000 && Object.keys(effect).length === 4;
}
function validPool(unit: CombatUnit): ActiveStatus | undefined {
  const matches = unit.statuses.filter(s => s.id === 'bone-wall'), status = matches[0];
  if (!personalHero(unit) || matches.length !== 1 || !status || status.sourceId !== unit.id || status.stacks !== 1 ||
    !Number.isFinite(status.remaining) || status.remaining <= 0 || status.remaining > d.durationMs / 1000 ||
    status.dotPerStack !== undefined || status.damageType !== undefined) return undefined;
  const payload: unknown = status.boneWall, start = status.appliedAtMs, end = status.expiresAtMs;
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload) ||
    Object.keys(payload).some(key => !['rank', 'rankBonus', 'remaining'].includes(key)) ||
    start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;
  const pool = payload as Readonly<Record<string, unknown>>;
  const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(d.durationMs, Math.abs(start), Math.abs(end)));
  return validCapturedSkillRank(pool.rank, d.maxRank, pool.rankBonus) &&
    typeof pool.remaining === 'number' && Number.isFinite(pool.remaining) && pool.remaining > 0 &&
    pool.remaining <= d.baseCapacity + d.capacityPerRank * (pool.rank - 1) && end - start <= d.durationMs + tolerance
    ? status : undefined;
}
/** One valid paid pool on [start,expiry); bare, duplicate or malformed markers grant no defense. */
export function boneWallPool(unit: CombatUnit, clock: number): ActiveStatus | undefined {
  const status = validPool(unit);
  return Number.isFinite(clock) && status && clock >= (status.appliedAtMs ?? Infinity) &&
    clock < (status.expiresAtMs ?? -Infinity) ? status : undefined;
}
/** Copy carried remaining power without refilling it or extending its clock. */
export function copyBoneWallStatuses(unit: CombatUnit): CombatUnit {
  const valid = validPool(unit);
  return { ...unit, statuses: unit.statuses.flatMap(s => {
    if (s === valid && s.boneWall) return [{ ...s, boneWall: Object.freeze({ ...s.boneWall }) }];
    if (s.id === 'bone-wall') return [];
    if (s.boneWall === undefined) return [s];
    const { boneWall, ...unpaid } = s; void boneWall;
    return [unpaid];
  }) };
}
/** Capture finite paid potency once; active pools cannot be refreshed or stacked. */
export function payBoneWall(unit: CombatUnit, rank: number, clock: number, rankBonus?: 1): CombatUnit {
  if (!Number.isFinite(clock) || !Number.isFinite(clock + d.durationMs) || clock + d.durationMs <= clock || boneWallRank(unit) === 0 ||
    !validCapturedSkillRank(rank, d.maxRank, rankBonus) || rank !== boneWallRank(unit) + (rankBonus ?? 0) ||
    boneWallPool(unit, clock)) return unit;
  return { ...unit, activeBuffIds: unit.activeBuffIds.filter(id => id !== 'bone-wall' && !BONE_WALL_IDS.some(alias => alias === id)),
    statuses: [...unit.statuses.filter(s => s.id !== 'bone-wall'), {
      id: 'bone-wall', sourceId: unit.id, stacks: 1, remaining: d.durationMs / 1000,
      appliedAtMs: clock, expiresAtMs: clock + d.durationMs,
      boneWall: Object.freeze({ rank, remaining: d.baseCapacity + d.capacityPerRank * (rank - 1), ...(rankBonus ? { rankBonus } : {}) })
    }] };
}
/** Absorb already-mitigated HP damage before mana diversion and Bone Armor, without RNG or input mutation. */
export function absorbBoneWall(unit: CombatUnit, damage: number, clock: number) {
  const status = boneWallPool(unit, clock), pool = status?.boneWall;
  if (!pool || !Number.isFinite(damage) || damage <= 0) return { unit, damage, absorbed: 0 };
  const absorbed = Math.min(damage, pool.remaining), remaining = pool.remaining - absorbed;
  return { unit: { ...unit, statuses: unit.statuses.flatMap(s => s !== status ? [s] : remaining > 0
    ? [{ ...s, boneWall: Object.freeze({ ...pool, remaining }) }] : []) }, damage: damage - absorbed, absorbed };
}
