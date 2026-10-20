import necromancerSkills from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';

/** Immutable authored defaults shared by canonical and legacy Amplify Damage statuses. */
export interface AmplifyDamageDefinition {
  readonly canonicalStatusId: 'amplify-damage';
  readonly legacyStatusId: 'amplify';
  readonly durationMs: number;
  readonly physicalResistReductionPct: number;
}

/** Resolve one complete authored definition without importing the skill registry. */
export function resolveAmplifyDamageDefinition(
  skills: readonly Pick<SkillDef, 'id' | 'statusEffect'>[]
): AmplifyDamageDefinition {
  const matches = skills.filter((skill) => skill.id === 'skills-necromancer-amplify-damage');
  if (matches.length !== 1) throw new Error('Expected exactly one authored Amplify Damage skill');
  const durationMs = matches[0]?.statusEffect?.durationMs;
  const physicalResistReductionPct = matches[0]?.statusEffect?.physicalResistReductionPct;
  if (durationMs === undefined || !Number.isFinite(durationMs) || durationMs < 0 ||
    physicalResistReductionPct === undefined || !Number.isFinite(physicalResistReductionPct) ||
    physicalResistReductionPct < 0) {
    throw new Error('Amplify Damage defaults must be finite nonnegative numbers');
  }
  return Object.freeze({
    canonicalStatusId: 'amplify-damage', legacyStatusId: 'amplify', durationMs, physicalResistReductionPct
  });
}

/** JSON-derived family defaults; no duplicated duration or resistance tuning literals. */
export const AMPLIFY_DAMAGE_DEFINITION = resolveAmplifyDamageDefinition(necromancerSkills);
