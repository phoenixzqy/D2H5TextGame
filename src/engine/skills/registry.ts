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
import { DAMAGE_DELIVERY_DEFINITION, sameDeliverySource, type DamageDelivery } from '../combat/damage-delivery';
import { DEFAULT_SKILLS } from './builders';
import { aliasToCanonical, MERC_STUB_SKILLS } from './aliases';
import { PLAYABLE_CLASS_DATA_SKILLS, AUTHORED_PROJECTILE_SKILLS, withAuthoredProjectileFlight } from './dataCatalog';
import { MINOR_HEAL_SKILL } from './minor-heal';
import { MERC_INNER_SIGHT_SKILL } from './inner-sight';
import { MERC_ARROW_SKILLS } from './merc-arrows';
import { MERC_ELEMENTAL_ARROWS } from './merc-elemental-arrows';
import { MERC_PILFER_SKILL } from './merc-pilfer';
import { MERC_JAB_SKILL } from './merc-jab';
import { MERC_BASH_SKILL } from './merc-bash';
import { MERC_DIRECT_SKILLS } from './merc-direct';
import { MERC_WAR_CRY_SKILL } from './merc-war-cry';
import { MERC_TELEKINESIS_SKILL } from './merc-telekinesis';
import { MERC_HOLY_FREEZE_SKILL } from './merc-holy-freeze';
import { MERC_MIGHT_SKILL } from './merc-might';
import { MERC_FIRE_MASTERY_SKILL } from './merc-fire-mastery';
import { MERC_BATTLE_ORDERS_SKILL } from './merc-battle-orders';
import { MERC_CRITICAL_SKILL } from './merc-critical';
import { MERC_THORNS_SKILL } from './merc-thorns';
import { MERC_DEFIANCE_SKILL } from './merc-defiance';
import { MERC_BLESSED_AIM_SKILL } from './merc-blessed-aim';
import { MERC_PRAYER_SKILL } from './merc-prayer';
import { MERC_HOLY_FIRE_SKILL } from './merc-holy-fire';
import { MERC_FROZEN_ARMOR_SKILL } from './merc-frozen-armor';
import { ACT1_LIGHTNING_AFFIX_SKILL } from './act1-lightning';
import { BLOOD_RAVEN_SKILLS } from './blood-raven';
import { MONSTER_RESURRECTION_SKILL } from './monster-resurrection';
import { MONSTER_PANIC_SKILL } from './monster-panic';
import { FIRE_ENCHANTED_EXPLOSION_SKILL, MONSTER_DEATH_EXPLOSION_SKILL } from './monster-death-explosion';
import { MONSTER_PHYSICAL_SKILLS } from './monster-physical';
import { MONSTER_DOT_SKILLS } from './monster-dot';
import { MONSTER_HEAL_LIGHTNING_SKILLS } from './monster-heal-lightning';
import { MONSTER_SELF_BUFFS } from './monster-self-buffs';
import { MONSTER_BONE_PRISON } from './monster-bone-prison';
import { MONSTER_LEVEL_SPELLS } from './monster-level-spells';
import { MONSTER_CURSE_SKILL } from './monster-curse';
import { MONSTER_DIRECT_SKILLS } from './monster-direct';
import { MONSTER_SUMMON_SKILL } from './monster-summon';
import { DIABLO_SIGNATURES } from './diablo-signatures';
import { BAAL_SIGNATURES } from './baal-signatures';
import { BAAL_TENTACLES } from './baal-tentacles';
import { ITEM_REDEMPTION_SKILL } from './item-redemption';

const registry = new Map<string, RegisteredSkill>();
const warned = new Set<string>();
// Baselines are captured once, before callers can mutate an exposed native source.
const nativeSourceBaselines = new WeakMap<RegisteredSkill, RegisteredSkill>();
const nativeDeliveries = new WeakMap<RegisteredSkill, {
  readonly delivery: DamageDelivery; readonly baseline: RegisteredSkill;
}>();

/** Resolve only unchanged, currently installed native strike authority; custom/legacy is unknown. */
export function getSkillDamageDelivery(skill: RegisteredSkill): DamageDelivery | undefined {
  const entry = nativeDeliveries.get(skill);
  return registry.get(skill.id) === skill && entry && sameDeliverySource(skill, entry.baseline)
    ? entry.delivery : undefined;
}

/** Only the installed unchanged native mercenary object receives recruitment rank effects. */
export function isNativeMercenarySkill(skill: RegisteredSkill): boolean {
  const baseline = nativeSourceBaselines.get(skill);
  return skill.archetype === 'mercenary' && registry.get(skill.id) === skill &&
    baseline !== undefined && sameDeliverySource(skill, baseline);
}

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
  const native = new Set<RegisteredSkill>();
  const install = (id: string, skill: RegisteredSkill): void => {
    let baseline = nativeSourceBaselines.get(skill);
    if (!baseline) {
      baseline = structuredClone(skill);
      nativeSourceBaselines.set(skill, baseline);
    }
    if (sameDeliverySource(skill, baseline)) native.add(skill);
    registry.set(id, skill);
  };
  for (const s of DEFAULT_SKILLS) {
    install(s.id, s);
  }
  for (const s of PLAYABLE_CLASS_DATA_SKILLS) {
    install(s.id, s);
  }
  for (const s of MERC_STUB_SKILLS) {
    install(s.id, s);
  }
  install(MINOR_HEAL_SKILL.id, MINOR_HEAL_SKILL);
  install(ITEM_REDEMPTION_SKILL.id, ITEM_REDEMPTION_SKILL);
  install(MERC_INNER_SIGHT_SKILL.id, MERC_INNER_SIGHT_SKILL);
  install(MERC_HOLY_FREEZE_SKILL.id, MERC_HOLY_FREEZE_SKILL);
  install(MERC_MIGHT_SKILL.id, MERC_MIGHT_SKILL);
  install(MERC_FIRE_MASTERY_SKILL.id, MERC_FIRE_MASTERY_SKILL);
  install(MERC_CRITICAL_SKILL.id, MERC_CRITICAL_SKILL);
  install(MERC_BATTLE_ORDERS_SKILL.id, MERC_BATTLE_ORDERS_SKILL);
  install(MERC_THORNS_SKILL.id, MERC_THORNS_SKILL);
  install(MERC_DEFIANCE_SKILL.id, MERC_DEFIANCE_SKILL);
  install(MERC_BLESSED_AIM_SKILL.id, MERC_BLESSED_AIM_SKILL);
  install(MERC_PRAYER_SKILL.id, MERC_PRAYER_SKILL);
  install(MERC_HOLY_FIRE_SKILL.id, MERC_HOLY_FIRE_SKILL);
  install(MERC_FROZEN_ARMOR_SKILL.id, MERC_FROZEN_ARMOR_SKILL);
  install(MERC_PILFER_SKILL.id, MERC_PILFER_SKILL);
  for (const skill of MERC_ARROW_SKILLS) install(skill.id, skill);
  for (const skill of MERC_ELEMENTAL_ARROWS) install(skill.id, skill);
  install(MERC_JAB_SKILL.id, MERC_JAB_SKILL);
  install(MERC_BASH_SKILL.id, MERC_BASH_SKILL);
  for (const skill of MERC_DIRECT_SKILLS) install(skill.id, skill);
  install(MERC_WAR_CRY_SKILL.id, MERC_WAR_CRY_SKILL);
  install(MERC_TELEKINESIS_SKILL.id, MERC_TELEKINESIS_SKILL);
  for (const skill of MONSTER_PHYSICAL_SKILLS) install(skill.id, skill);
  for (const skill of MONSTER_DOT_SKILLS) install(skill.id, skill);
  for (const skill of MONSTER_HEAL_LIGHTNING_SKILLS) install(skill.id, skill);
  for (const { skill } of MONSTER_SELF_BUFFS) install(skill.id, skill);
  install(MONSTER_BONE_PRISON.skill.id, MONSTER_BONE_PRISON.skill);
  for (const skill of MONSTER_LEVEL_SPELLS) install(skill.id, skill);
  install(MONSTER_CURSE_SKILL.id, MONSTER_CURSE_SKILL);
  for (const skill of MONSTER_DIRECT_SKILLS) install(skill.id, skill);
  install(MONSTER_SUMMON_SKILL.id, MONSTER_SUMMON_SKILL);
  for (const skill of DIABLO_SIGNATURES) install(skill.id, skill);
  for (const skill of BAAL_SIGNATURES) install(skill.id, skill);
  install(BAAL_TENTACLES.id, BAAL_TENTACLES);
  install(MONSTER_RESURRECTION_SKILL.id, MONSTER_RESURRECTION_SKILL);
  install(MONSTER_PANIC_SKILL.id, MONSTER_PANIC_SKILL);
  install(MONSTER_DEATH_EXPLOSION_SKILL.id, MONSTER_DEATH_EXPLOSION_SKILL);
  install(FIRE_ENCHANTED_EXPLOSION_SKILL.id, FIRE_ENCHANTED_EXPLOSION_SKILL);
  install(ACT1_LIGHTNING_AFFIX_SKILL.id, ACT1_LIGHTNING_AFFIX_SKILL);
  for (const skill of BLOOD_RAVEN_SKILLS) install(skill.id, skill);
  const available = new Set([...registry.keys()].map(id => aliasToCanonical(id) ?? id));
  for (const skill of AUTHORED_PROJECTILE_SKILLS) {
    if (!available.has(skill.id)) install(skill.id, skill);
  }
  for (const [id, skill] of registry) {
    const projected = withAuthoredProjectileFlight(skill);
    registry.set(id, projected);
    const delivery = DAMAGE_DELIVERY_DEFINITION.skills[skill.id];
    if (native.has(skill) && delivery !== undefined) {
      nativeDeliveries.set(projected, { delivery, baseline: structuredClone(projected) });
    }
  }
}

// Auto-load defaults on import.
loadDefaultSkills();
