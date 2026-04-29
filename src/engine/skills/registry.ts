/**
 * Skill registry.
 *
 * Engine ships with a stub catalog of the 70 skills from skills-spec.md
 * plus stubs for the merc/aura/monster ids referenced by the data layer
 * (`src/data/skills/**`, `src/data/monsters/**`,
 * `src/data/gacha/mercenaries.json`). Numeric tuning is intentionally
 * minimal here — the production catalog is authored by content-designer
 * in JSON and registered via {@link registerSkill}.
 *
 * @module engine/skills/registry
 */

import type { RegisteredSkill } from './effects';
import { DEFAULT_SKILLS } from './builders';
import { aliasToCanonical, MERC_STUB_SKILLS, MONSTER_STUB_SKILLS } from './aliases';

const registry = new Map<string, RegisteredSkill>();
const warned = new Set<string>();

/** Register or replace a skill. */
export function registerSkill(skill: RegisteredSkill): void {
  registry.set(skill.id, skill);
}

/**
 * Look up a skill by id, with alias normalization.
 *
 * Resolution order:
 *  1. Direct registry hit.
 *  2. {@link aliasToCanonical} pattern transform
 *     (`monster-weak-melee` → `monster.weak_melee`,
 *      `skills-barbarian-bash` → `barbarian.bash`).
 *  3. `undefined` + a one-shot `console.warn` so silent fall-throughs
 *     are visible in dev / test output. Caller still owns the policy
 *     (see `chooseSkill`).
 */
export function getSkill(id: string): RegisteredSkill | undefined {
  const direct = registry.get(id);
  if (direct) return direct;
  const aliased = aliasToCanonical(id);
  if (aliased) {
    const hit = registry.get(aliased);
    if (hit) return hit;
  }
  if (!warned.has(id)) {
    warned.add(id);
    // eslint-disable-next-line no-console
    console.warn(`[skills] unknown skill id "${id}" — falling through to basic attack`);
  }
  return undefined;
}

/** Reset the one-shot warning dedup. Test helper. */
export function resetSkillWarnings(): void {
  warned.clear();
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
 * Load the default 70-skill catalog plus merc/monster stub catalogs.
 * Idempotent — calling more than once just overwrites.
 */
export function loadDefaultSkills(): void {
  for (const s of DEFAULT_SKILLS) {
    registry.set(s.id, s);
  }
  for (const s of MERC_STUB_SKILLS) {
    registry.set(s.id, s);
  }
  for (const s of MONSTER_STUB_SKILLS) {
    registry.set(s.id, s);
  }
}

// Auto-load defaults on import.
loadDefaultSkills();
