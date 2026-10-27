import { inferKind, type CombatUnit } from '../combat/types';
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

/** Require fresh native ownership and the same legal learned rank; no legacy teaching. */
export function slowMissilesRank(owner: CombatUnit): number {
  const rank = owner.slowMissilesRank ?? 0;
  const allocated = Math.max(0, ...SLOW_MISSILES_IDS.map(id => {
    const value = owner.skillLevels?.[id];
    return typeof value === 'number' && Number.isInteger(value) && value > 0 &&
      value <= SLOW_MISSILES_DEFINITION.maxRank ? value : 0;
  }));
  return owner.side === 'player' && inferKind(owner) === 'hero' && owner.summon !== true &&
    owner.ownerId === undefined && owner.summonOwnerId === undefined && owner.id.length > 0 &&
    Number.isFinite(owner.life) && owner.life > 0 && Number.isInteger(owner.level) &&
    owner.level >= SLOW_MISSILES_DEFINITION.requiredLevel && Number.isInteger(rank) && rank > 0 &&
    rank === allocated ? rank : 0;
}
