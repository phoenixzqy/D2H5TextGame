import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from './types';
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

/** Read paid own-identity authority only within its finite authored interval, including Cleansing/rebasing. */
export function activeTargetCurse(unit: CombatUnit, id: TargetCurseId, clock: number): boolean {
  if (!Number.isFinite(clock)) return false;
  const duration = TARGET_CURSE_DEFINITIONS[id].durationMs;
  return unit.statuses.some(status => {
    const start = status.appliedAtMs, end = status.expiresAtMs;
    if (status.id !== id || status.targetCurse !== id || status.stacks !== 1 ||
      start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end) ||
      end <= start || clock < start || clock >= end) return false;
    const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end), duration));
    return end - start <= duration + tolerance;
  });
}
