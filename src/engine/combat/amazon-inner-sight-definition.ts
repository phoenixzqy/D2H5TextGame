import rows from '../../data/skills/amazon.json';
import type { SkillDef } from '../types/skills';
import type { ActiveStatus, CombatUnit } from './types';
import { createSkillValidator } from '../skills/skill-validator';

const validate = createSkillValidator<SkillDef>();
/** Require complete authored metadata before granting a paid Amazon Inner Sight. */
export function isAmazonInnerSightDefinition(source: unknown): source is SkillDef {
  return validate(source) && source.id === 'skills-amazon-inner-sight';
}
/** Copy finite JSON-owned tuning without retaining caller data or the registry. */
export function resolveAmazonInnerSightDefinition(skills: readonly unknown[]) {
  const matches = skills.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-amazon-inner-sight');
  const row = matches[0];
  if (matches.length !== 1 || !isAmazonInnerSightDefinition(row)) throw new Error('Invalid authored Amazon Inner Sight');
  const metadata = row.statusEffect;
  if (metadata?.durationMs === undefined || metadata.defenseReductionPct === undefined)
    throw new Error('Incomplete authored Amazon Inner Sight');
  return Object.freeze({ durationMs: metadata.durationMs, defenseReductionPct: metadata.defenseReductionPct });
}
/** Constant potency; existing resource and cooldown growth still use the learned rank. */
export const AMAZON_INNER_SIGHT_DEFINITION = resolveAmazonInnerSightDefinition(rows);

/** Capture one immutable potency only at an actual eligible payment. */
export function paidAmazonInnerSight(): NonNullable<ActiveStatus['innerSight']> {
  return Object.freeze({ defenseReductionPct: AMAZON_INNER_SIGHT_DEFINITION.defenseReductionPct });
}
/** Bare, forged, future or expired Amazon markers confer no Defense reduction. */
export function activeAmazonInnerSight(unit: CombatUnit, clock: number): ActiveStatus['innerSight'] {
  if (!Number.isFinite(clock)) return undefined;
  for (const status of unit.statuses) {
    const payload = status.innerSight, start = status.appliedAtMs, end = status.expiresAtMs;
    if (status.id !== 'inner-sight' || status.stacks !== 1 || !payload || start === undefined || end === undefined ||
      !Number.isFinite(start) || !Number.isFinite(end) || clock < start || clock >= end) continue;
    const duration = AMAZON_INNER_SIGHT_DEFINITION.durationMs;
    const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end), duration));
    if (Math.abs(end - start - duration) > tolerance ||
      payload.defenseReductionPct !== AMAZON_INNER_SIGHT_DEFINITION.defenseReductionPct) continue;
    return paidAmazonInnerSight();
  }
  return undefined;
}
