import type { ActiveStatus, CombatUnit } from '../combat/types';
import type { HitSpeedStackTuning } from '../types/skills';
import { statusActiveAt } from '../combat/status';

/** Internal identity keeps each skill's marker and native authority together. */
export type HitSpeedStackDefinition = Readonly<HitSpeedStackTuning & {
  requiredLevel: number; maxRank: number;
} & ({ id: 'feral-rage'; marker: 'feralRage'; rankField: 'feralRageRank' } |
     { id: 'frenzy'; marker: 'frenzy'; rankField: 'frenzyRank' })>;
function eligible(unit: CombatUnit, d: HitSpeedStackDefinition): boolean {
  const rank = unit[d.rankField];
  return unit.side === 'player' && unit.kind === 'hero' && unit.summon !== true &&
    unit.ownerId === undefined && unit.summonOwnerId === undefined &&
    Number.isFinite(unit.life) && unit.life > 0 && Number.isInteger(unit.level) &&
    unit.level >= d.requiredLevel && typeof rank === 'number' && Number.isInteger(rank) &&
    rank > 0 && rank <= d.maxRank;
}
function validStatus(unit: CombatUnit, status: ActiveStatus, d: HitSpeedStackDefinition): boolean {
  const start = status.appliedAtMs, end = status.expiresAtMs;
  if (!eligible(unit, d) || status.id !== d.id || status[d.marker] !== true ||
    status.sourceId !== unit.id || !Number.isInteger(status.stacks) ||
    status.stacks < 1 || status.stacks > d.maxStacks || status.remaining !== d.durationMs / 1000 ||
    start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end) || end <= start ||
    Object.keys(status).some(key => !['id', 'sourceId', 'stacks', 'remaining', 'appliedAtMs', 'expiresAtMs', d.marker].includes(key)))
    return false;
  const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(d.durationMs, Math.abs(start), Math.abs(end)));
  return Math.abs(end - start - d.durationMs) <= tolerance;
}
/** At most one authenticated active record counts; duplicate markers never add. */
export function activeHitSpeedStack(unit: CombatUnit, clock: number, d: HitSpeedStackDefinition): ActiveStatus | undefined {
  return Number.isFinite(clock) ? unit.statuses.find(status => validStatus(unit, status, d) && statusActiveAt(status, clock)) : undefined;
}
/** Copy valid carried records while rejecting foreign or malformed capability payloads. */
export function copyHitSpeedStackStatuses(unit: CombatUnit, d: HitSpeedStackDefinition): CombatUnit {
  if (!unit.statuses.some(status => status.id === d.id || status[d.marker] !== undefined)) return unit;
  return { ...unit, statuses: unit.statuses.flatMap(status => status.id !== d.id && status[d.marker] === undefined
    ? [status] : validStatus(unit, status, d) ? [{ ...status }] : []) };
}
/** Called only after positive hostile direct HP loss; grant or refresh one bounded self stack. */
export function gainHitSpeedStack(unit: CombatUnit, clock: number, d: HitSpeedStackDefinition): CombatUnit {
  if (!eligible(unit, d) || !Number.isFinite(clock)) return unit;
  const old = activeHitSpeedStack(unit, clock, d);
  return { ...unit, statuses: [...unit.statuses.filter(status => status.id !== d.id), {
    id: d.id, [d.marker]: true as const, sourceId: unit.id,
    stacks: Math.min(d.maxStacks, (old?.stacks ?? 0) + 1), remaining: d.durationMs / 1000,
    appliedAtMs: clock, expiresAtMs: clock + d.durationMs
  }] };
}
