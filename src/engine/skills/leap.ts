import skills from '../../data/skills/barbarian.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { projectPlayerClassActives } from './player-class-actives';
import { statusActiveAt } from '../combat/status';
import { validCapturedSkillRank } from './effective-rank';

/** Exact native learned identities; aliases never add ranks. */
export const LEAP_IDS = ['skills-barbarian-leap', 'barbarian.leap'] as const;
type PaidLeap = NonNullable<ActiveStatus['leap']>;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate the authored row and capture immutable paid-effect tuning. */
export function resolveLeapDefinition(rows: readonly unknown[]) {
  const matches = rows.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === LEAP_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.timedBuff ||
    row.scaling?.passiveStatsPerLevel?.physicalDamagePct === undefined || row.cost.mana === undefined)
    throw new Error('Invalid authored Leap');
  return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
    durationMs: row.timedBuff.durationMs, physicalDamagePerRank: row.scaling.passiveStatsPerLevel.physicalDamagePct,
    manaCost: row.cost.mana, cooldown: row.cooldown,
    costPerRank: row.scaling.costPerLevel ?? 0, cooldownPerRank: row.scaling.cooldownPerLevel ?? 0 });
}
export const LEAP_DEFINITION = resolveLeapDefinition(skills);

/** Independently project native legal allocation at the wave boundary. */
export function composeLeapRank(player: Pick<Player, 'class' | 'level' | 'skillLevels'>): number {
  const projected = projectPlayerClassActives({ classId: player.class, level: player.level,
    skillOrder: [LEAP_IDS[0]], ...(player.skillLevels ? { skillLevels: player.skillLevels } : {}) });
  return projected.skillOrder.length === 1 ? projected.skillLevels?.[LEAP_IDS[1]] ?? 0 : 0;
}
function personalHero(unit: CombatUnit): boolean {
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    Number.isInteger(unit.level) && unit.level >= LEAP_DEFINITION.requiredLevel &&
    Number.isFinite(unit.life) && unit.life > 0;
}
/** Only the native living personal hero may spend its independently captured rank. */
export function leapRank(unit: CombatUnit): number {
  const rank = unit.leapRank;
  return personalHero(unit) && typeof rank === 'number' && Number.isInteger(rank) &&
    rank > 0 && rank <= LEAP_DEFINITION.maxRank ? rank : 0;
}
/** Reject partial or contradictory registry replacements before payment. */
export function matchesLeap(skill: RegisteredSkill): boolean {
  const d = LEAP_DEFINITION, buff = skill.effects[0], control = skill.effects[1];
  return skill.id === LEAP_IDS[1] && skill.archetype === 'barbarian' &&
    skill.trigger === 'active' && skill.target === 'all-enemies' && skill.isBuff === true &&
    skill.summonOnStart !== true && skill.requires === undefined && skill.aoeShape === undefined &&
    skill.maxTargets === undefined && skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost && skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.costPerRank && skill.cooldownPerRank === d.cooldownPerRank &&
    skill.effects.length === 2 && buff?.kind === 'buff' && Object.keys(buff).length === 4 &&
    buff.id === 'leap' && buff.timedStatBuff === 'leap' && buff.duration === d.durationMs / 1000 &&
    control?.kind === 'debuff' && Object.keys(control).length === 2 && control.statusId === 'stun';
}
/** Immutable source-owned potency captured once after the real payment. */
export function paidLeap(rank: number, rankBonus?: 1): PaidLeap {
  if (!validCapturedSkillRank(rank, LEAP_DEFINITION.maxRank, rankBonus))
    throw new Error('Invalid paid Leap rank');
  return Object.freeze({ rank, ...(rankBonus ? { rankBonus } : {}),
    physicalDamagePct: rank * LEAP_DEFINITION.physicalDamagePerRank });
}
function validLeapStatus(unit: CombatUnit, status: ActiveStatus): boolean {
  const payload: unknown = status.leap, d = LEAP_DEFINITION;
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload) ||
    Object.keys(payload).length !== (Object.hasOwn(payload, 'rankBonus') ? 3 : 2) ||
    !['rank', 'physicalDamagePct'].every(key => Object.hasOwn(payload, key))) return false;
  const p = payload as Readonly<Record<string, unknown>>, start = status.appliedAtMs, end = status.expiresAtMs;
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end)) return false;
  const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(d.durationMs, Math.abs(start), Math.abs(end)));
  return personalHero(unit) && status.id === 'leap' && status.sourceId === unit.id &&
    validCapturedSkillRank(p.rank, d.maxRank, p.rankBonus) &&
    p.physicalDamagePct === p.rank * d.physicalDamagePerRank && end > start &&
    Math.abs(end - start - d.durationMs) <= tolerance;
}
/** Copy and sanitize carried paid payloads without changing unrelated statuses. */
export function copyLeapStatuses(unit: CombatUnit): CombatUnit {
  if (!unit.statuses.some(status => status.leap !== undefined)) return unit;
  return { ...unit, statuses: unit.statuses.map(status => {
    if (status.leap === undefined) return status;
    const { leap, ...marker } = status;
    return validLeapStatus(unit, status) ? { ...marker, leap: paidLeap(leap.rank, leap.rankBonus) } : marker;
  }) };
}
/** Read one active paid payload; duplicates never stack and expiry is exclusive. */
export function activeLeap(unit: CombatUnit, clock: number): ActiveStatus['leap'] {
  if (!Number.isFinite(clock)) return undefined;
  return unit.statuses.find(status => statusActiveAt(status, clock) && validLeapStatus(unit, status))?.leap;
}
