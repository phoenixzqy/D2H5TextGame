import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
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
