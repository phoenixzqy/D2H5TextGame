import rows from '../../data/skills/amazon.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';

export const SLOW_MISSILES_IDS = ['skills-amazon-slow-missiles', 'amazon.slow_missiles'] as const;
type SlowMissilesSource = SkillDef & { readonly requiredLevel: number };
const validate = createSkillValidator<SlowMissilesSource>();
/** Require complete exact authored metadata before creating a paid flight window. */
export function isSlowMissilesDefinition(source: unknown): source is SlowMissilesSource {
  return validate(source) && source.id === SLOW_MISSILES_IDS[0];
}
/** Copy finite authored travel tuning; no mutable JSON or registry references escape. */
export function resolveSlowMissilesDefinition(input: readonly unknown[]) {
  const matches = input.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === SLOW_MISSILES_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !isSlowMissilesDefinition(row) ||
    row.statusEffect?.durationMs === undefined || row.statusEffect.projectileSpeedPct === undefined) throw new Error('Invalid authored Slow Missiles');
  return Object.freeze({ durationMs: row.statusEffect.durationMs,
    projectileSpeedPct: row.statusEffect.projectileSpeedPct,
    requiredLevel: row.requiredLevel, maxRank: row.maxLevel });
}
export const SLOW_MISSILES_DEFINITION = resolveSlowMissilesDefinition(rows);
