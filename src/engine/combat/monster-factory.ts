/**
 * Build a runtime {@link CombatUnit} from a data-driven {@link MonsterDef}.
 *
 * Pure / deterministic given a seeded {@link Rng}. Tier multipliers are
 * applied per Diablo2TextGame.md §7.1 (sub-area roguelike waves):
 *   - **trash**: baseline JSON stats.
 *   - **champion** (reserved): mild boost.
 *   - **elite**: ~×1.6 life / ×1.3 attack/defense + 1 random affix label.
 *   - **boss**: ~×3 life / ×1.6 attack / ×1.5 defense + signature ability.
 *
 * Attack & defense scaling derive from `docs/balance/early-game-spec.md §4`
 * because v1 monster JSON does not yet carry per-archetype attack ranges:
 *
 *   `attack  = round(BASE_ATK + (lvl-1) * GROWTH_ATK)`
 *   `defense = round((def ?? BASE_DEF) + (lvl-1) * GROWTH_DEF)`
 *
 * Life is rolled via RNG over the JSON `[min, max]` range and grown per
 * level using the JSON `lifeGrowth` `[min, max]` range — same values used
 * by content-designer specs.
 *
 * @module engine/combat/monster-factory
 */

import type { Rng } from '../rng';
import type { MonsterDef } from '../types/monsters';
import type { Resistances } from '../types/attributes';
import type { CombatUnit, MonsterTier } from './types';

/** Trash baseline for derived attack rating, from early-game-spec §4. */
const BASE_ATK = 32;
const GROWTH_ATK = 5;
/** Default base defense if the monster JSON does not specify one. */
const BASE_DEF = 4;
const GROWTH_DEF = 1.5;

/**
 * Per-tier multipliers applied **on top of** the level-scaled base stats.
 *
 * Numbers locked in for v1; revise alongside `level-designer` if combat
 * pacing tests demand it. Keep the table exhaustive over {@link MonsterTier}
 * so the type system catches new tiers added to the union.
 */
export const TIER_MULTIPLIERS: Readonly<
  Record<MonsterTier, { readonly life: number; readonly attack: number; readonly defense: number }>
> = {
  trash: { life: 1.0, attack: 1.0, defense: 1.0 },
  champion: { life: 1.4, attack: 1.2, defense: 1.2 },
  elite: { life: 1.6, attack: 1.3, defense: 1.3 },
  boss: { life: 3.0, attack: 1.6, defense: 1.5 }
};

/** Letter suffixes for multiple monsters of the same archetype in one wave. */
const SUFFIX_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Default elite affixes when a monster def doesn't list any. */
const DEFAULT_ELITE_AFFIXES: readonly string[] = [
  'extra-fast',
  'extra-strong',
  'cursed',
  'fire-enchanted',
  'cold-enchanted',
  'lightning-enchanted'
];

/**
 * Options for {@link buildMonsterUnit}.
 */
export interface BuildMonsterOpts {
  /** Monster archetype definition (from `src/data/monsters/actN.json`). */
  readonly def: MonsterDef;
  /** Effective monster level (from the wave/encounter — not the area level). */
  readonly level: number;
  /** Tier flag; controls stat multipliers and downstream loot/AI behavior. */
  readonly tier: MonsterTier;
  /** RNG used for life roll + elite-affix pick. */
  readonly rng: Rng;
  /**
   * Optional 0-based instance index used to disambiguate display names when
   * multiple instances of the same archetype spawn in one encounter
   * (e.g. "Fallen A", "Fallen B"). Omit when there is only one.
   */
  readonly index?: number;
  /**
   * Optional unique ID. When omitted, an ID is synthesized from the
   * archetype slug and the index using the RNG (still deterministic for a
   * given seed + RNG fork).
   */
  readonly id?: string;
}

/**
 * Build a battle-ready {@link CombatUnit} for the given monster archetype.
 *
 * Deterministic w.r.t. the supplied {@link Rng}: same RNG state + same opts
 * → identical unit (life roll, name suffix, ID).
 */
export function buildMonsterUnit(opts: BuildMonsterOpts): CombatUnit {
  const { def, level, tier, rng, index } = opts;

  // 1. Life: roll within JSON range, add growth per level, apply tier mult.
  const [lifeMin, lifeMax] = def.life;
  const [growMin, growMax] = def.lifeGrowth;
  const baseLife = rollFloat(rng, lifeMin, lifeMax);
  const growth = rollFloat(rng, growMin, growMax);
  const rawLife = baseLife + Math.max(0, level - 1) * growth;
  const lifeMaxStat = Math.max(1, Math.round(rawLife * TIER_MULTIPLIERS[tier].life));

  // 2. Attack: derived (no per-arch JSON yet — see early-game-spec §4).
  const rawAtk = BASE_ATK + Math.max(0, level - 1) * GROWTH_ATK;
  const attack = Math.round(rawAtk * TIER_MULTIPLIERS[tier].attack);

  // 3. Defense: from JSON if present, else trash baseline; level-scaled.
  const baseDef = def.defense ?? BASE_DEF;
  const rawDef = baseDef + Math.max(0, level - 1) * GROWTH_DEF;
  const defense = Math.round(rawDef * TIER_MULTIPLIERS[tier].defense);

  // 4. Resistances — fill missing slots with zero so DerivedStats is total.
  const r = def.resistances ?? {};
  const resistances: Resistances = {
    fire: r.fire ?? 0,
    cold: r.cold ?? 0,
    lightning: r.lightning ?? 0,
    poison: r.poison ?? 0,
    arcane: r.arcane ?? 0,
    physical: r.physical ?? 0
  };

  // 5. Display name with optional index suffix and tier badge.
  const baseName = def.name;
  const suffix =
    index === undefined
      ? ''
      : ` ${SUFFIX_ALPHABET[index] ?? `#${String(index + 1)}`}`;
  const tierBadge = tier === 'boss' ? ' (Boss)' : tier === 'elite' ? ' (Elite)' : '';
  const name = `${baseName}${suffix}${tierBadge}`;

  // 6. ID — synth via RNG when not provided so unit ids are unique within a
  // spawn batch even for repeated archetypes.
  const slug = def.id.split('/').pop() ?? def.id;
  const idTag = (rng.nextInt(0, 0xffff) + 0x10000).toString(16).slice(1);
  const id =
    opts.id ??
    `enemy-${slug}-${String(index ?? 0)}-${idTag}`;

  // 7. Crit / dodge — flat trash baseline. Tier 'boss' gets +5% crit.
  const critChance = tier === 'boss' ? 0.10 : 0.05;
  const critDamage = tier === 'boss' ? 1.75 : 1.5;
  const physDodge = 0.05;
  const magicDodge = 0.05;

  // 8. Skill order: prepend a "signature" cue for boss to guarantee at least
  // one big-skill action; engine's AI policy handles cooldowns.
  const skillOrder: readonly string[] = def.skills;

  const unit: CombatUnit = {
    id,
    name,
    side: 'enemy',
    level,
    tier,
    stats: {
      life: lifeMaxStat,
      lifeMax: lifeMaxStat,
      mana: 0,
      manaMax: 0,
      attack,
      defense,
      attackSpeed: def.attackSpeed ?? 95,
      critChance,
      critDamage,
      physDodge,
      magicDodge,
      magicFind: 0,
      goldFind: 0,
      resistances
    },
    life: lifeMaxStat,
    mana: 0,
    statuses: [],
    cooldowns: {},
    skillOrder,
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false,
    kind: 'monster'
  };
  return unit;
}

/**
 * Pick a deterministic elite affix id for a monster, preferring the
 * archetype's own affix pool when populated.
 */
export function pickEliteAffix(def: MonsterDef, rng: Rng): string {
  const pool =
    def.eliteAffixes && def.eliteAffixes.length > 0
      ? def.eliteAffixes
      : DEFAULT_ELITE_AFFIXES;
  return rng.pick(pool);
}

/** Float roll in [min, max] (inclusive) using the seeded RNG. */
function rollFloat(rng: Rng, min: number, max: number): number {
  if (min === max) return min;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + rng.next() * (hi - lo);
}
