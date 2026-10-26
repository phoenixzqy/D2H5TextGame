import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from '../skills/skill-validator';

const validate = createSkillValidator<SkillDef>();
/** Require the complete authored contract before granting a paid blindness capability. */
export function isDimVisionDefinition(source: unknown): source is SkillDef {
  return validate(source) && source.id === 'skills-necromancer-dim-vision';
}
/** Copy and freeze JSON-owned tuning without freezing caller data or reading mutable registrations. */
export function resolveDimVisionDefinition(skills: readonly unknown[]) {
  const matches = skills.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-necromancer-dim-vision');
  const row = matches[0];
  if (matches.length !== 1 || !isDimVisionDefinition(row)) throw new Error('Invalid authored Dim Vision');
  const metadata = row.statusEffect;
  if (metadata?.durationMs === undefined || metadata.physicalHitChanceReductionPct === undefined)
    throw new Error('Incomplete authored Dim Vision');
  return Object.freeze({ durationMs: metadata.durationMs,
    physicalHitChanceReductionPct: metadata.physicalHitChanceReductionPct });
}
/** Finite, constant-per-rank accuracy tuning, validated once from the complete authored skill. */
export const DIM_VISION_DEFINITION = resolveDimVisionDefinition(rows);

/** Capture one immutable accuracy packet when an eligible action actually pays. */
export function paidDimVision() {
  return Object.freeze({ physicalHitChanceReductionPct: DIM_VISION_DEFINITION.physicalHitChanceReductionPct });
}
