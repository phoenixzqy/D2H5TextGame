import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from '../skills/skill-validator';

/** Each target curse keeps its own paid status and authored native skill identity. */
export const TARGET_CURSE_SKILL_IDS = Object.freeze({
  confuse: 'skills-necromancer-confuse',
  attract: 'skills-necromancer-attract'
} as const);
export type TargetCurseId = keyof typeof TARGET_CURSE_SKILL_IDS;
const validate = createSkillValidator<SkillDef>();

/** Only a complete schema-valid canonical definition may grant target-redirection authority. */
export function targetCurseId(source: unknown): TargetCurseId | undefined {
  if (!validate(source)) return undefined;
  if (source.id === TARGET_CURSE_SKILL_IDS.confuse) return 'confuse';
  if (source.id === TARGET_CURSE_SKILL_IDS.attract) return 'attract';
  return undefined;
}

/** Require one complete JSON definition and freeze a detached finite-duration copy. */
export function resolveTargetCurseDefinition(skills: readonly unknown[], id: TargetCurseId) {
  const matches = skills.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === TARGET_CURSE_SKILL_IDS[id]);
  const row = matches[0];
  if (matches.length !== 1 || !validate(row) || targetCurseId(row) !== id ||
    row.statusEffect?.durationMs === undefined) throw new Error('Invalid authored target curse: ' + id);
  return Object.freeze({ id, durationMs: row.statusEffect.durationMs });
}

/** Validated constant-per-rank finite tuning; no TypeScript duration defaults. */
export const TARGET_CURSE_DEFINITIONS = Object.freeze({
  confuse: resolveTargetCurseDefinition(rows, 'confuse'),
  attract: resolveTargetCurseDefinition(rows, 'attract')
});
