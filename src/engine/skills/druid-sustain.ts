import skills from '../../data/skills/druid.json';
import type { FeralRageTuning, SkillDef } from '../types/skills';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import { statusActiveAt } from '../combat/status';
import { createSkillValidator } from './skill-validator';

export const FERAL_RAGE_IDS = ['skills-druid-feral-rage', 'druid.feral_rage'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate and independently copy authored Feral stack tuning before combat. */
export function resolveFeralRageDefinition(rows: readonly unknown[]): Readonly<
  FeralRageTuning & {
    readonly requiredLevel: number;
    readonly maxRank: number;
  }
> {
  const matches = rows.filter(
    (row) => typeof row === 'object' && row !== null && 'id' in row && row.id === FERAL_RAGE_IDS[0]
  );
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || !row.feralRage)
    throw new Error('Invalid authored Feral Rage');
  return Object.freeze({
    ...row.feralRage,
    requiredLevel: row.requiredLevel,
    maxRank: row.maxLevel
  });
}
export const FERAL_RAGE_DEFINITION = resolveFeralRageDefinition(skills);

/** Consume the already validated native class-active configuration, never raw saved priorities. */
export function composeFeralRageRank(
  owner: Pick<CombatUnit, 'skillOrder' | 'skillLevels'> & {
    readonly classId: string;
    readonly level: number;
  }
): number {
  const d = FERAL_RAGE_DEFINITION;
  if (
    owner.classId !== 'druid' ||
    !Number.isInteger(owner.level) ||
    owner.level < d.requiredLevel ||
    !owner.skillOrder.some((id) => FERAL_RAGE_IDS.some((alias) => alias === id))
  )
    return 0;
  return FERAL_RAGE_IDS.reduce((rank, id) => {
    const value = owner.skillLevels?.[id];
    return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= d.maxRank
      ? Math.max(rank, value)
      : rank;
  }, 0);
}
/** Only the living native original player hero may use carried speed. */
function eligible(unit: CombatUnit): boolean {
  const rank = unit.feralRageRank,
    d = FERAL_RAGE_DEFINITION;
  return (
    unit.side === 'player' &&
    unit.kind === 'hero' &&
    unit.summon !== true &&
    unit.ownerId === undefined &&
    unit.summonOwnerId === undefined &&
    Number.isFinite(unit.life) &&
    unit.life > 0 &&
    Number.isInteger(unit.level) &&
    unit.level >= d.requiredLevel &&
    typeof rank === 'number' &&
    Number.isInteger(rank) &&
    rank > 0 &&
    rank <= d.maxRank
  );
}
function validStatus(unit: CombatUnit, status: ActiveStatus): boolean {
  const start = status.appliedAtMs,
    end = status.expiresAtMs,
    d = FERAL_RAGE_DEFINITION;
  if (
    !eligible(unit) ||
    status.id !== 'feral-rage' ||
    status.feralRage !== true ||
    status.sourceId !== unit.id ||
    !Number.isInteger(status.stacks) ||
    status.stacks < 1 ||
    status.stacks > d.maxStacks ||
    status.remaining !== d.durationMs / 1000 ||
    start === undefined ||
    end === undefined ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    Object.keys(status).some(
      (key) =>
        ![
          'id',
          'sourceId',
          'stacks',
          'remaining',
          'appliedAtMs',
          'expiresAtMs',
          'feralRage'
        ].includes(key)
    )
  )
    return false;
  const tolerance = Math.min(
    0.000001,
    8 * Number.EPSILON * Math.max(d.durationMs, Math.abs(start), Math.abs(end))
  );
  return Math.abs(end - start - d.durationMs) <= tolerance;
}
/** At most one authenticated active record counts; duplicate markers never add. */
export function activeFeralRage(unit: CombatUnit, clock: number): ActiveStatus | undefined {
  if (!Number.isFinite(clock)) return undefined;
  return unit.statuses.find((status) => validStatus(unit, status) && statusActiveAt(status, clock));
}
/** Copy valid carried records and reject marker-only or malformed external potency. */
export function copyFeralRageStatuses(unit: CombatUnit): CombatUnit {
  if (!unit.statuses.some((s) => s.id === 'feral-rage' || s.feralRage !== undefined)) return unit;
  return {
    ...unit,
    statuses: unit.statuses.flatMap((status) =>
      status.id !== 'feral-rage' && status.feralRage === undefined
        ? [status]
        : validStatus(unit, status)
          ? [{ ...status }]
          : []
    )
  };
}
/** Grant/refresh one stack only after the caller has committed positive hostile direct HP loss. */
export function gainFeralRageStack(unit: CombatUnit, clock: number): CombatUnit {
  if (!eligible(unit) || !Number.isFinite(clock)) return unit;
  const d = FERAL_RAGE_DEFINITION,
    old = activeFeralRage(unit, clock);
  return {
    ...unit,
    statuses: [
      ...unit.statuses.filter((s) => s.id !== 'feral-rage'),
      {
        id: 'feral-rage',
        feralRage: true,
        sourceId: unit.id,
        stacks: Math.min(d.maxStacks, (old?.stacks ?? 0) + 1),
        remaining: d.durationMs / 1000,
        appliedAtMs: clock,
        expiresAtMs: clock + d.durationMs
      }
    ]
  };
}
