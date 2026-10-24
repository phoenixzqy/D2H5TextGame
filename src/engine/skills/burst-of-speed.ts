import skills from '../../data/skills/assassin.json';
import type { SkillDef } from '../types/skills';
import type { Player } from '../types/entities';
import type { CombatUnit, ActiveStatus } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { createSkillValidator } from './skill-validator';
import { statusActiveAt } from '../combat/status';

/** Exact source aliases; duplicate allocations never add. */
export const BURST_OF_SPEED_IDS = [
  'skills-assassin-burst-of-speed',
  'assassin.burst_of_speed'
] as const;
/** Primitive copied tuning for the paid finite speed/dodge buff. */
export interface BurstOfSpeedDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly durationMs: number;
  readonly attackSpeedPerRank: number;
  readonly physDodgePerRank: number;
  readonly manaCost: number;
  readonly cooldown: number;
  readonly costPerRank: number;
  readonly cooldownPerRank: number;
}
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate the exact authored row and copy independent immutable numeric tuning. */
export function resolveBurstOfSpeedDefinition(rows: readonly unknown[]): BurstOfSpeedDefinition {
  const matches = rows.filter(
    (row) =>
      typeof row === 'object' && row !== null && 'id' in row && row.id === BURST_OF_SPEED_IDS[0]
  );
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.timedBuff)
    throw new Error('Invalid authored Burst of Speed');
  const stats = row.scaling?.passiveStatsPerLevel;
  if (
    stats?.attackSpeedPct === undefined ||
    stats.physDodgePct === undefined ||
    row.cost.mana === undefined
  )
    throw new Error('Missing Burst tuning');
  return Object.freeze({
    requiredLevel: row.requiredLevel,
    maxRank: row.maxLevel,
    durationMs: row.timedBuff.durationMs,
    attackSpeedPerRank: stats.attackSpeedPct,
    physDodgePerRank: stats.physDodgePct,
    manaCost: row.cost.mana,
    cooldown: row.cooldown,
    costPerRank: row.scaling?.costPerLevel ?? 0,
    cooldownPerRank: row.scaling?.cooldownPerLevel ?? 0
  });
}
export const BURST_OF_SPEED_DEFINITION = resolveBurstOfSpeedDefinition(skills);
/** Fresh actual Assassin authority; learning prerequisites stay at the learning boundary. */
export function composeBurstOfSpeedRank(
  player: Pick<Player, 'class' | 'level' | 'skillLevels'>
): number {
  const d = BURST_OF_SPEED_DEFINITION;
  if (
    player.class !== 'assassin' ||
    !Number.isFinite(player.level) ||
    player.level < d.requiredLevel
  )
    return 0;
  return BURST_OF_SPEED_IDS.reduce((rank, id) => {
    const value = player.skillLevels?.[id];
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? Math.max(rank, Math.min(d.maxRank, value))
      : rank;
  }, 0);
}
/** Only the actual living player hero can spend this independently composed rank. */
export function burstOfSpeedRank(unit: CombatUnit): number {
  const rank = unit.burstOfSpeedRank;
  return unit.side === 'player' &&
    unit.kind === 'hero' &&
    unit.summon !== true &&
    unit.ownerId === undefined &&
    unit.summonOwnerId === undefined &&
    Number.isFinite(unit.life) &&
    unit.life > 0 &&
    Number.isFinite(unit.level) &&
    unit.level >= BURST_OF_SPEED_DEFINITION.requiredLevel &&
    typeof rank === 'number' &&
    Number.isInteger(rank) &&
    rank > 0 &&
    rank <= BURST_OF_SPEED_DEFINITION.maxRank
    ? rank
    : 0;
}
/** Reject marker-only or contradictory registry overrides before payment. */
export function matchesBurstOfSpeed(skill: RegisteredSkill): boolean {
  const d = BURST_OF_SPEED_DEFINITION,
    e = skill.effects[0];
  return (
    skill.id === BURST_OF_SPEED_IDS[1] &&
    skill.archetype === 'assassin' &&
    skill.trigger === 'active' &&
    skill.target === 'self' &&
    skill.isBuff === true &&
    skill.summonOnStart !== true &&
    skill.minLevel === d.requiredLevel &&
    skill.manaCost === d.manaCost &&
    skill.cooldown === d.cooldown &&
    skill.manaCostPerRank === d.costPerRank &&
    skill.cooldownPerRank === d.cooldownPerRank &&
    skill.effects.length === 1 &&
    e?.kind === 'buff' &&
    e.id === 'burst-of-speed' &&
    e.timedStatBuff === 'burst-of-speed' &&
    e.duration === d.durationMs / 1000
  );
}
/** Independently frozen paid cast potency; it never changes base stats. */
export function paidBurstOfSpeed(rank: number): NonNullable<ActiveStatus['statBuff']> {
  if (!Number.isInteger(rank) || rank < 1 || rank > BURST_OF_SPEED_DEFINITION.maxRank) {
    throw new Error('Invalid paid Burst rank');
  }
  return Object.freeze({
    rank,
    attackSpeedPct: rank * BURST_OF_SPEED_DEFINITION.attackSpeedPerRank,
    physDodgePct: rank * BURST_OF_SPEED_DEFINITION.physDodgePerRank
  });
}
/** Validate external/carried potency and its complete finite clock interval. */
function validBurstStatus(unit: CombatUnit, status: ActiveStatus): boolean {
  const payload: unknown = status.statBuff;
  const d = BURST_OF_SPEED_DEFINITION;
  if (
    payload === null ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    Object.keys(payload).length !== 3 ||
    !['rank', 'attackSpeedPct', 'physDodgePct'].every((key) => Object.hasOwn(payload, key))
  )
    return false;
  const p = payload as Readonly<Record<string, unknown>>;
  const start = status.appliedAtMs,
    end = status.expiresAtMs;
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end))
    return false;
  // A handful of ulps permits cancellation from fractional cross-wave rebasing.
  const tolerance = 8 * Number.EPSILON * Math.max(d.durationMs, Math.abs(start), Math.abs(end));
  return (
    status.id === 'burst-of-speed' &&
    status.sourceId === unit.id &&
    unit.side === 'player' &&
    unit.kind === 'hero' &&
    unit.summon !== true &&
    unit.ownerId === undefined &&
    unit.summonOwnerId === undefined &&
    Number.isFinite(unit.level) &&
    unit.level >= d.requiredLevel &&
    typeof p.rank === 'number' &&
    Number.isInteger(p.rank) &&
    p.rank > 0 &&
    p.rank <= d.maxRank &&
    p.attackSpeedPct === p.rank * d.attackSpeedPerRank &&
    p.physDodgePct === p.rank * d.physDodgePerRank &&
    end > start &&
    Math.abs(end - start - d.durationMs) <= Math.min(tolerance, 0.000001)
  );
}
/** Copy incoming paid status payloads; ordinary units retain their exact legacy representation. */
export function copyBurstOfSpeedStatuses(unit: CombatUnit): CombatUnit {
  if (!unit.statuses.some((s) => s.statBuff !== undefined)) return unit;
  return {
    ...unit,
    statuses: unit.statuses.map((s) => {
      if (s.statBuff === undefined) return s;
      const { statBuff, ...marker } = s;
      return validBurstStatus(unit, s)
        ? { ...marker, statBuff: paidBurstOfSpeed(statBuff.rank) }
        : marker;
    })
  };
}
/** Read at most one active paid payload, never stack duplicate markers or mutate stats. */
export function activeBurstOfSpeed(unit: CombatUnit, clock: number): ActiveStatus['statBuff'] {
  if (!Number.isFinite(clock) || !Number.isFinite(unit.life) || unit.life <= 0) return undefined;
  return unit.statuses.find((s) => statusActiveAt(s, clock) && validBurstStatus(unit, s))?.statBuff;
}
