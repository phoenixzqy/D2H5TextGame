import rows from '../../data/skills/necromancer.json';
import type { SkillDef } from '../types/skills';
import type { CombatUnit } from './types';
import { createSkillValidator } from '../skills/skill-validator';

const validate = createSkillValidator<SkillDef>();
/** Require complete authored finite fear before granting the paid adapter capability. */
export function isTerrorDefinition(source: unknown): source is SkillDef {
  return validate(source) && source.id === 'skills-necromancer-terror';
}
/** Copy finite JSON-owned fear timing without depending on the mutable registry. */
export function resolveTerrorDefinition(skills: readonly unknown[]) {
  const matches = skills.filter(row => typeof row === 'object' && row !== null &&
    'id' in row && row.id === 'skills-necromancer-terror');
  const row = matches[0];
  if (matches.length !== 1 || !isTerrorDefinition(row) ||
    row.statusEffect?.durationMs === undefined || row.statusEffect.bossDurationMultiplier === undefined)
    throw new Error('Invalid authored Terror');
  return Object.freeze({ durationMs: row.statusEffect.durationMs,
    bossDurationMultiplier: row.statusEffect.bossDurationMultiplier });
}
/** Immutable timing shared by paid application and control validation. */
export const TERROR_DEFINITION = resolveTerrorDefinition(rows);

/** Only a finite active paid fear interrupts; bare and malformed markers grant no control. */
export function activeTerror(unit: CombatUnit, clock: number): boolean {
  if (!Number.isFinite(clock)) return false;
  const boss = unit.tier === 'boss' || unit.tier === 'chapter-boss';
  const maximum = boss ? Math.max(1, Math.floor(TERROR_DEFINITION.durationMs *
    TERROR_DEFINITION.bossDurationMultiplier)) : TERROR_DEFINITION.durationMs;
  return unit.statuses.some(status => {
    const start = status.appliedAtMs, end = status.expiresAtMs;
    if (status.id !== 'terror' || status.terror !== true || status.stacks !== 1 ||
      start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end) ||
      end <= start || clock < start || clock >= end) return false;
    const tolerance = Math.min(.000001, 8 * Number.EPSILON * Math.max(Math.abs(start), Math.abs(end), maximum));
    return end - start <= maximum + tolerance;
  });
}
