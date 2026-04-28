/**
 * Skill registry.
 *
 * Engine ships with a stub catalog of the 70 skills from skills-spec.md.
 * Numeric tuning is intentionally minimal here — the production catalog is
 * authored by content-designer in `src/data/skills/*.json` (validated by Ajv)
 * and registered via {@link registerSkill}.
 *
 * @module engine/skills/registry
 */

import type { RegisteredSkill } from './effects';
import { DEFAULT_SKILLS } from './builders';

const registry = new Map<string, RegisteredSkill>();

/** Register or replace a skill. */
export function registerSkill(skill: RegisteredSkill): void {
  registry.set(skill.id, skill);
}

/** Look up a skill by id. */
export function getSkill(id: string): RegisteredSkill | undefined {
  return registry.get(id);
}

/** Get all registered skill ids. */
export function listSkills(): readonly string[] {
  return [...registry.keys()];
}

/** Reset the registry (testing helper). */
export function resetRegistry(): void {
  registry.clear();
}

/**
 * Load the default 70-skill catalog.
 * Idempotent — calling more than once just overwrites.
 */
export function loadDefaultSkills(): void {
  for (const s of DEFAULT_SKILLS) {
    registry.set(s.id, s);
  }
}

// Auto-load defaults on import.
loadDefaultSkills();
