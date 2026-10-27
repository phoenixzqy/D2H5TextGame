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
import { PLAYABLE_CLASS_DATA_SKILLS, AUTHORED_PROJECTILE_SKILLS, withAuthoredProjectileFlight } from './dataCatalog';
import { MINOR_HEAL_SKILL } from './minor-heal';
import { MERC_INNER_SIGHT_SKILL } from './inner-sight';
import { MERC_ARROW_SKILLS } from './merc-arrows';
import { MERC_HOLY_FREEZE_SKILL } from './merc-holy-freeze';
import { ACT1_LIGHTNING_AFFIX_SKILL } from './act1-lightning';
import { BLOOD_RAVEN_SKILLS } from './blood-raven';
import { ITEM_REDEMPTION_SKILL } from './item-redemption';

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
  for (const s of PLAYABLE_CLASS_DATA_SKILLS) {
    registry.set(s.id, s);
  }
  for (const s of MERC_STUB_SKILLS) {
    registry.set(s.id, s);
  }
  registry.set(MINOR_HEAL_SKILL.id, MINOR_HEAL_SKILL);
  registry.set(ITEM_REDEMPTION_SKILL.id, ITEM_REDEMPTION_SKILL);
  registry.set(MERC_INNER_SIGHT_SKILL.id, MERC_INNER_SIGHT_SKILL);
  registry.set(MERC_HOLY_FREEZE_SKILL.id, MERC_HOLY_FREEZE_SKILL);
  for (const skill of MERC_ARROW_SKILLS) registry.set(skill.id, skill);
  for (const s of MONSTER_STUB_SKILLS) {
    registry.set(s.id, s);
  }
  registry.set(ACT1_LIGHTNING_AFFIX_SKILL.id, ACT1_LIGHTNING_AFFIX_SKILL);
  for (const skill of BLOOD_RAVEN_SKILLS) registry.set(skill.id, skill);
  const available = new Set([...registry.keys()].map(id => aliasToCanonical(id) ?? id));
  for (const skill of AUTHORED_PROJECTILE_SKILLS) {
    if (!available.has(skill.id)) registry.set(skill.id, skill);
  }
  for (const [id, skill] of registry) registry.set(id, withAuthoredProjectileFlight(skill));
}

// Auto-load defaults on import.
loadDefaultSkills();
