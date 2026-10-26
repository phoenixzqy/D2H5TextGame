import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import type { ActiveStatus, CombatUnit } from './types';
import { createSkillValidator } from '../skills/skill-validator';

const validate = createSkillValidator<SkillDef>();
/** Require the complete authored contract before granting the adapter a paid curse capability. */
export function isDecrepifyDefinition(source: unknown): source is SkillDef {
  return validate(source) && source.id === 'skills-necromancer-decrepify';
}
/** Copy complete authored curse tuning without importing the mutable skill registry. */
export function resolveDecrepifyDefinition(skills: readonly unknown[]) {
  const matches = skills.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-necromancer-decrepify');
  const row = matches[0];
  if (matches.length !== 1 || !isDecrepifyDefinition(row)) throw new Error('Invalid authored Decrepify');
  const metadata = row.statusEffect;
  if (metadata?.durationMs === undefined || metadata.attackSpeedReductionPct === undefined ||
    metadata.damageReductionPct === undefined) throw new Error('Incomplete authored Decrepify');
  return Object.freeze({ durationMs: metadata.durationMs,
    attackSpeedReductionPct: metadata.attackSpeedReductionPct, damageReductionPct: metadata.damageReductionPct });
}
/** Immutable JSON-owned duration and modifiers, shared by runtime consumers. */
export const DECREPIFY_DEFINITION = resolveDecrepifyDefinition(rows);

/** Capture one complete constant-per-rank potency at an actual eligible payment. */
export function paidDecrepify(): NonNullable<ActiveStatus['decrepify']> {
  const { attackSpeedReductionPct, damageReductionPct } = DECREPIFY_DEFINITION;
  return Object.freeze({ attackSpeedReductionPct, damageReductionPct });
}
/** Read only an exact finite paid packet; bare/future/expired/malformed markers grant no power. */
export function activeDecrepify(unit: CombatUnit, clock: number): ActiveStatus['decrepify'] {
  if (!Number.isFinite(clock)) return undefined;
  for (const status of unit.statuses) {
    const payload = status.decrepify, start = status.appliedAtMs, end = status.expiresAtMs;
    if (status.id !== 'decrepify' || status.stacks !== 1 || !payload || start === undefined || end === undefined ||
      !Number.isFinite(start) || !Number.isFinite(end) || end <= start || clock < start || clock >= end) continue;
    // Cleansing may shorten an interval; rebasing/fractional timestamps may add binary rounding noise.
    const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end), DECREPIFY_DEFINITION.durationMs));
    if (end - start > DECREPIFY_DEFINITION.durationMs + tolerance ||
      payload.attackSpeedReductionPct !== DECREPIFY_DEFINITION.attackSpeedReductionPct ||
      payload.damageReductionPct !== DECREPIFY_DEFINITION.damageReductionPct) continue;
    return paidDecrepify();
  }
  return undefined;
}
