import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import type { ActiveStatus, CombatUnit } from './types';
import { createSkillValidator } from '../skills/skill-validator';

const validate = createSkillValidator<SkillDef>();
/** Require the complete authored contract before granting a paid Weaken capability. */
export function isWeakenDefinition(source: unknown): source is SkillDef {
  return validate(source) && source.id === 'skills-necromancer-weaken';
}
/** Copy and freeze complete JSON-owned tuning without depending on the mutable registry. */
export function resolveWeakenDefinition(skills: readonly unknown[]) {
  const matches = skills.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-necromancer-weaken');
  const row = matches[0];
  if (matches.length !== 1 || !isWeakenDefinition(row)) throw new Error('Invalid authored Weaken');
  const metadata = row.statusEffect;
  if (metadata?.durationMs === undefined || metadata.damageReductionPct === undefined)
    throw new Error('Incomplete authored Weaken');
  return Object.freeze({ durationMs: metadata.durationMs, damageReductionPct: metadata.damageReductionPct });
}
/** Finite constant-per-rank tuning shared by the paid status and damage consumer. */
export const WEAKEN_DEFINITION = resolveWeakenDefinition(rows);

/** Capture one immutable potency at an actual eligible payment. */
export function paidWeaken(): NonNullable<ActiveStatus['weaken']> {
  return Object.freeze({ damageReductionPct: WEAKEN_DEFINITION.damageReductionPct });
}
/** Bare, forged, future or expired markers confer no reduction. */
export function activeWeaken(unit: CombatUnit, clock: number): ActiveStatus['weaken'] {
  if (!Number.isFinite(clock)) return undefined;
  for (const status of unit.statuses) {
    const payload = status.weaken, start = status.appliedAtMs, end = status.expiresAtMs;
    if (status.id !== 'weaken' || status.stacks !== 1 || !payload || start === undefined || end === undefined ||
      !Number.isFinite(start) || !Number.isFinite(end) || end <= start || clock < start || clock >= end) continue;
    // Cleansing may shorten a paid interval; rebased/fractional clocks retain binary rounding tolerance.
    const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end), WEAKEN_DEFINITION.durationMs));
    if (end - start > WEAKEN_DEFINITION.durationMs + tolerance ||
      payload.damageReductionPct !== WEAKEN_DEFINITION.damageReductionPct) continue;
    return paidWeaken();
  }
  return undefined;
}
