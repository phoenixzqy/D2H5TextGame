/**
 * Skill ID alias resolution.
 *
 * The engine registry uses canonical IDs like `barbarian.bash`,
 * `necromancer.raise_skeleton`, `monster.weak_melee`. JSON data files
 * (`src/data/skills/**`, `src/data/monsters/**`, `src/data/gacha/mercenaries.json`)
 * use kebab-case ids: `skills-barbarian-bash`, `monster-weak-melee`,
 * `mskill-jab`, `aura-might`, etc.
 *
 * Without normalization, {@link chooseSkill} silently fell back to a
 * basic attack for every monster, merc and most player skill bars
 * (Bug A — P0).
 *
 * This module provides:
 *  1. A pattern-based resolver `aliasToCanonical(id)` for predictable
 *     transforms (`monster-foo-bar` → `monster.foo_bar` etc).
 *  2. An explicit alias registry `registerSkillAlias(alias, canonical)`
 *     for the cases where the data id has no straightforward shape.
 *  3. Auto-registration of stub skills for merc/aura ids that have no
 *     engine equivalent (so a Desert-Merc-Holy-Freeze does *something*
 *     instead of basic-attacking forever). Tuning lives in JSON; these
 *     are minimal stubs to keep combat moving.
 *
 * @module engine/skills/aliases
 */

import type { RegisteredSkill } from './effects';
import type { DamageType } from '../types/attributes';
import type { SkillTarget } from '../types/skills';

const aliases = new Map<string, string>();

/** Reset the explicit alias map. Test helper. */
export function resetAliases(): void {
  aliases.clear();
}

/** Add an explicit alias `aliasId → canonicalId`. */
export function registerSkillAlias(aliasId: string, canonicalId: string): void {
  aliases.set(aliasId, canonicalId);
}

/**
 * Try to resolve a skill id to a canonical engine id.
 *
 * Order:
 *  1. Identity (caller will hit registry directly first).
 *  2. Explicit alias map.
 *  3. Pattern transforms:
 *     - `skills-CLASS-foo-bar` → `CLASS.foo_bar`
 *     - `monster-foo-bar`      → `monster.foo_bar`
 *     - dashes → underscores; `/` → `.`
 *
 * Returns `undefined` if no transform applies.
 */
export function aliasToCanonical(id: string): string | undefined {
  const explicit = aliases.get(id);
  if (explicit !== undefined) return explicit;

  const skillsMatch = /^skills-([a-z]+)-(.+)$/.exec(id);
  if (skillsMatch) {
    const cls = skillsMatch[1] ?? '';
    const rest = skillsMatch[2] ?? '';
    return `${cls}.${rest.replace(/-/g, '_')}`;
  }

  const monsterMatch = /^monster-(.+)$/.exec(id);
  if (monsterMatch) {
    const rest = monsterMatch[1] ?? '';
    return `monster.${rest.replace(/-/g, '_')}`;
  }

  if (id.includes('/') || id.includes('-')) {
    const transformed = id.replace(/\//g, '.').replace(/-/g, '_');
    if (transformed !== id) return transformed;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Stub skills for merc/aura/monster ids that have no canonical engine
// equivalent. Authored as engine-side stubs so combat still progresses
// when these data ids are referenced. Production tuning belongs in JSON.
// ---------------------------------------------------------------------------

interface StubSpec {
  readonly id: string;
  readonly target: SkillTarget;
  readonly cooldown: number;
  readonly manaCost: number;
  readonly damageType?: DamageType;
  readonly base?: readonly [number, number];
  readonly buffId?: string;
  readonly status?: { readonly id: string; readonly chance?: number };
}

function stub(spec: StubSpec): RegisteredSkill {
  const effects: import('./effects').SkillEffect[] = [];
  if (spec.damageType && spec.base) {
    effects.push({
      kind: 'damage',
      damageType: spec.damageType,
      base: spec.base,
      ...(spec.status
        ? {
            applyStatus: {
              id: spec.status.id,
              ...(spec.status.chance !== undefined ? { chance: spec.status.chance } : {})
            }
          }
        : {})
    });
  }
  if (spec.buffId) {
    effects.push({ kind: 'buff', id: spec.buffId, duration: -1 });
  }
  return {
    id: spec.id,
    archetype: spec.id.startsWith('aura-') ? 'aura' : 'mercenary',
    target: spec.target,
    cooldown: spec.cooldown,
    manaCost: spec.manaCost,
    effects,
    minLevel: 1,
    ...(spec.buffId ? { isBuff: true } : {})
  };
}

/**
 * Stub catalog for merc/aura skill ids referenced by
 * `src/data/gacha/mercenaries.json` and `src/data/skills/mercenary.json`.
 */
export const MERC_STUB_SKILLS: readonly RegisteredSkill[] = Object.freeze([
  // Mercenary actives (mskill-*)
  stub({ id: 'mskill-jab', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'physical', base: [18, 28] }),
  stub({ id: 'mskill-bash', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'physical', base: [25, 40], status: { id: 'stun', chance: 0.25 } }),
  stub({ id: 'mskill-fire-ball', target: 'area-enemies', cooldown: 2, manaCost: 0, damageType: 'fire', base: [35, 55], status: { id: 'ignite' } }),
  stub({ id: 'mskill-fire-arrow', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'fire', base: [25, 40], status: { id: 'ignite' } }),
  stub({ id: 'mskill-cold-arrow', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'cold', base: [25, 40], status: { id: 'chill' } }),
  stub({ id: 'mskill-glacial-spike', target: 'area-enemies', cooldown: 2, manaCost: 0, damageType: 'cold', base: [30, 50], status: { id: 'chill' } }),
  stub({ id: 'mskill-charged-bolt', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'lightning', base: [25, 40] }),
  stub({ id: 'mskill-pierce-arrow', target: 'all-enemies', cooldown: 2, manaCost: 0, damageType: 'physical', base: [22, 35] }),
  stub({ id: 'mskill-basic-arrow', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'physical', base: [15, 25] }),
  stub({ id: 'mskill-pierce-thrust', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'physical', base: [25, 40] }),
  stub({ id: 'mskill-chop', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'physical', base: [22, 35] }),
  stub({ id: 'mskill-basic-swing', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'physical', base: [18, 28] }),
  stub({ id: 'mskill-smite', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'physical', base: [25, 40], status: { id: 'stun', chance: 0.2 } }),
  stub({ id: 'mskill-war-cry', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'physical', base: [15, 25], status: { id: 'stun', chance: 0.3 } }),
  stub({ id: 'mskill-holy-fire', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'fire', base: [20, 30], status: { id: 'ignite' } }),
  stub({ id: 'mskill-pilfer', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'physical', base: [15, 25] }),
  stub({ id: 'mskill-minor-heal', target: 'self', cooldown: 4, manaCost: 0, buffId: 'minor_heal' }),
  stub({ id: 'mskill-frozen-armor', target: 'self', cooldown: 0, manaCost: 0, buffId: 'frozen_armor' }),
  stub({ id: 'mskill-telekinesis', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'arcane', base: [20, 30] }),
  stub({ id: 'mskill-inner-sight', target: 'self', cooldown: 0, manaCost: 0, buffId: 'inner_sight' }),

  // Auras (always-on self buffs).
  stub({ id: 'aura-holy-freeze', target: 'self', cooldown: 0, manaCost: 0, buffId: 'holy_freeze' }),
  stub({ id: 'aura-might', target: 'self', cooldown: 0, manaCost: 0, buffId: 'might' }),
  stub({ id: 'aura-thorns', target: 'self', cooldown: 0, manaCost: 0, buffId: 'thorns' }),
  stub({ id: 'aura-prayer', target: 'self', cooldown: 0, manaCost: 0, buffId: 'prayer' }),
  stub({ id: 'aura-blessed-aim', target: 'self', cooldown: 0, manaCost: 0, buffId: 'blessed_aim' }),
  stub({ id: 'aura-defiance', target: 'self', cooldown: 0, manaCost: 0, buffId: 'defiance' }),
  stub({ id: 'aura-battle-orders', target: 'self', cooldown: 0, manaCost: 0, buffId: 'battle_orders' })
]);

/**
 * Stub catalog for monster skill ids that don't have a canonical engine
 * equivalent (the registry only ships generic monster.* skills). Keeps
 * monster turns from collapsing to basic-attacks.
 */
export const MONSTER_STUB_SKILLS: readonly RegisteredSkill[] = Object.freeze([
  stub({ id: 'monster.panic_flee', target: 'self', cooldown: 4, manaCost: 0, buffId: 'panic_flee' }),
  stub({ id: 'monster.weak_ranged', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'physical', base: [8, 14] }),
  stub({ id: 'monster.rend', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'physical', base: [25, 40], status: { id: 'bleed' } }),
  stub({ id: 'monster.fire_bolt', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'fire', base: [25, 40], status: { id: 'ignite' } }),
  stub({ id: 'monster.fire_ball', target: 'area-enemies', cooldown: 3, manaCost: 0, damageType: 'fire', base: [40, 60], status: { id: 'ignite' } }),
  stub({ id: 'monster.fire_arrow', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'fire', base: [20, 35], status: { id: 'ignite' } }),
  stub({ id: 'monster.frost_bolt', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'cold', base: [25, 40], status: { id: 'chill' } }),
  stub({ id: 'monster.frost_nova', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'cold', base: [20, 30], status: { id: 'chill' } }),
  stub({ id: 'monster.thunder_storm', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'lightning', base: [30, 50] }),
  stub({ id: 'monster.lightning', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'lightning', base: [40, 60] }),
  stub({ id: 'monster.curse', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'arcane', base: [0, 0], status: { id: 'amplify' } }),
  stub({ id: 'monster.mana_rift', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'arcane', base: [10, 20], status: { id: 'mana-burn' } }),
  stub({ id: 'monster.poison_cloud', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'poison', base: [15, 25], status: { id: 'poison' } }),
  stub({ id: 'monster.plague_spit', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'poison', base: [20, 30], status: { id: 'plague' } }),
  stub({ id: 'monster.poison_dagger', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'poison', base: [20, 30], status: { id: 'poison' } }),
  stub({ id: 'monster.bone_spirit', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'arcane', base: [40, 60] }),
  stub({ id: 'monster.bone_prison', target: 'single-enemy', cooldown: 4, manaCost: 0, damageType: 'arcane', base: [10, 20], status: { id: 'stun' } }),
  stub({ id: 'monster.arcane_bolt', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'arcane', base: [25, 40] }),
  stub({ id: 'monster.leap_attack', target: 'single-enemy', cooldown: 3, manaCost: 0, damageType: 'physical', base: [50, 70], status: { id: 'stun', chance: 0.5 } }),
  stub({ id: 'monster.leap', target: 'single-enemy', cooldown: 3, manaCost: 0, damageType: 'physical', base: [40, 60] }),
  stub({ id: 'monster.whirlwind', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'physical', base: [40, 60] }),
  stub({ id: 'monster.war_cry', target: 'all-enemies', cooldown: 4, manaCost: 0, damageType: 'physical', base: [20, 30], status: { id: 'stun', chance: 0.3 } }),
  stub({ id: 'monster.shout', target: 'self', cooldown: 5, manaCost: 0, buffId: 'shout' }),
  stub({ id: 'monster.enrage', target: 'self', cooldown: 6, manaCost: 0, buffId: 'enrage' }),
  stub({ id: 'monster.thorns_aura', target: 'self', cooldown: 0, manaCost: 0, buffId: 'thorns' }),
  stub({ id: 'monster.inferno', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'fire', base: [40, 60], status: { id: 'ignite' } }),
  stub({ id: 'monster.corpse_explosion', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'fire', base: [40, 60] }),
  stub({ id: 'monster.tentacles', target: 'all-enemies', cooldown: 3, manaCost: 0, damageType: 'physical', base: [30, 50] }),
  stub({ id: 'monster.resurrect_fallen', target: 'summon', cooldown: 6, manaCost: 0, buffId: 'resurrect' })
]);
