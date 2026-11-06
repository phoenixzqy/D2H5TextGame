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
 *     engine equivalent. Authored implementations register separately;
 *     these
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
  if (id === 'item-redemption') return 'item.redemption';
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
  stub({ id: 'mskill-fire-arrow', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'fire', base: [25, 40], status: { id: 'ignite' } }),
  stub({ id: 'mskill-cold-arrow', target: 'single-enemy', cooldown: 1, manaCost: 0, damageType: 'cold', base: [25, 40], status: { id: 'chill' } }),
  stub({ id: 'mskill-pilfer', target: 'single-enemy', cooldown: 2, manaCost: 0, damageType: 'physical', base: [15, 25] }),
  stub({ id: 'mskill-minor-heal', target: 'self', cooldown: 4, manaCost: 0, buffId: 'minor_heal' }),
  stub({ id: 'mskill-frozen-armor', target: 'self', cooldown: 0, manaCost: 0, buffId: 'frozen_armor' }),

  // Remaining aura placeholders; native Holy Freeze and Might register authored passives separately.
  stub({ id: 'aura-blessed-aim', target: 'self', cooldown: 0, manaCost: 0, buffId: 'blessed_aim' })
]);
