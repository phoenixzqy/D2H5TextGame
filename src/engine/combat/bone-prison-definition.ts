import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from './types';
import { createSkillValidator } from '../skills/skill-validator';

export const BONE_PRISON_IDS = ['skills-necromancer-bone-prison', 'necromancer.bone_prison'] as const;
const validate = createSkillValidator<SkillDef>();
/** Require the complete player trap contract before granting paid action control. */
export function isBonePrisonDefinition(source: unknown): source is SkillDef {
  return validate(source) && source.id === BONE_PRISON_IDS[0];
}
/** Copy finite authored timing independently of caller mutations and registry overrides. */
export function resolveBonePrisonDefinition(skills: readonly unknown[]) {
  const matches = skills.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === BONE_PRISON_IDS[0]);
  const row = matches[0];
  if (matches.length !== 1 || !isBonePrisonDefinition(row) ||
    row.statusEffect?.durationMs === undefined || row.statusEffect.bossDurationMultiplier === undefined)
    throw new Error('Invalid authored Bone Prison');
  return Object.freeze({ durationMs: row.statusEffect.durationMs,
    bossDurationMultiplier: row.statusEffect.bossDurationMultiplier });
}
/** Immutable player trap timing; the separately authored monster ability is unaffected. */
export const BONE_PRISON_DEFINITION = resolveBonePrisonDefinition(rows);

/** Read one finite paid trap on [start,expiry); a marker or malformed interval grants no control. */
export function activeBonePrison(unit: CombatUnit, clock: number): boolean {
  if (!Number.isFinite(clock)) return false;
  const statuses = unit.statuses.filter(status => status.id === 'bone-prison');
  const status = statuses[0];
  if (statuses.length !== 1 || !status || status.bonePrison !== true || status.stacks !== 1 ||
    !status.sourceId || status.dotPerStack !== undefined || status.damageType !== undefined) return false;
  const start = status.appliedAtMs, end = status.expiresAtMs;
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end) ||
    end <= start || clock < start || clock >= end) return false;
  const boss = unit.tier === 'boss' || unit.tier === 'chapter-boss';
  const maximum = boss ? Math.max(1, Math.floor(BONE_PRISON_DEFINITION.durationMs *
    BONE_PRISON_DEFINITION.bossDurationMultiplier)) : BONE_PRISON_DEFINITION.durationMs;
  const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end), maximum));
  return end - start <= maximum + tolerance;
}
