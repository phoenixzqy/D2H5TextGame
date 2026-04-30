/**
 * Combat-internal types used by the deterministic combat resolver.
 *
 * These are **runtime** combat units distinct from the persistent {@link import('../types/entities').Unit}
 * type, because combat needs mutable HP/mana/buff state per turn.
 *
 * @module engine/combat/types
 */

import type { DamageType, DerivedStats, Resistances } from '../types/attributes';
import type { ComboTag } from '../types/skills';

/** Tag a unit's "side" in combat. */
export type CombatSide = 'player' | 'enemy';

/** Tier of a monster — drives loot/affix/enrage rules. */
export type MonsterTier = 'trash' | 'elite' | 'champion' | 'rare-elite' | 'rare-minion' | 'boss' | 'chapter-boss';

/** Active status effect on a combat unit. */
export interface ActiveStatus {
  readonly id: string;
  readonly stacks: number;
  /**
   * Remaining duration in turns (legacy turn-based callers); -1 = permanent.
   * The combat engine now drives expiry via {@link expiresAtMs}; the `remaining`
   * field is preserved for non-combat callers (analyzers, tests) using the
   * round-based {@link tickStatuses} helper.
   */
  readonly remaining: number;
  /**
   * Absolute simulation-time (ms) at which the status expires. When set, the
   * combat engine drops the status as soon as `simClockMs >= expiresAtMs`.
   * Undefined for legacy turn-based statuses or permanent statuses.
   */
  readonly expiresAtMs?: number;
  /**
   * Damage per stack per **second** (for DoTs).
   *
   * NOTE: historically this was "per round/tick". With the timeline scheduler,
   * DoT chunks are computed proportionally to elapsed sim-time, so this value
   * is now interpreted as damage-per-second. Existing data values stay
   * numerically the same — they just represent a slower per-second rate.
   */
  readonly dotPerStack?: number;
  /** Damage type for DoT damage. */
  readonly damageType?: DamageType;
  /** Source unit ID. */
  readonly sourceId: string;
  /** Tags relevant to combo lookup. */
  readonly tags?: readonly ComboTag[];
}

/** Combat-time unit. Immutable; updates produce new instances. */
export interface CombatUnit {
  readonly id: string;
  readonly name: string;
  readonly side: CombatSide;
  readonly level: number;
  readonly tier: MonsterTier;
  readonly stats: DerivedStats;
  readonly life: number;
  readonly mana: number;
  readonly statuses: readonly ActiveStatus[];
  /** Cooldowns: skillId → remaining turns. */
  readonly cooldowns: Readonly<Record<string, number>>;
  /** Combo skill priority (player) or AI priority (monster). */
  readonly skillOrder: readonly string[];
  /** Buffs already applied this combat (don't recast). */
  readonly activeBuffIds: readonly string[];
  /** Boss enrage activated? */
  readonly enraged: boolean;
  /**
   * Has summon-on-start been cast for this unit?
   *
   * @deprecated Optional and ignored by the combat engine. Summon caps are
   * now enforced via per-owner counts in {@link CombatUnit.summonOwnerId}.
   * Field kept optional for back-compat with legacy unit factories.
   */
  readonly summonedAdds?: boolean;
  /** Cached resistance penalty from Act IV/V (subtracted from each resist). */
  readonly resistPenalty?: number;
  /** Owner unit id (for summons). */
  readonly ownerId?: string;
  /** Is this a summon? */
  readonly summon?: boolean;
  /**
   * Combat role of this unit. When omitted the engine infers it from
   * `side`/`id`/`summonOwnerId`. Used by targeting (taunt prefers `summon`)
   * and victory checks (hero death = enemy victory).
   *
   * `merc` is an ally that fights alongside the hero but whose death does
   * NOT end the run (Bug #2). For threat/aggro purposes mercs are treated
   * the same as heroes.
   */
  readonly kind?: 'hero' | 'merc' | 'summon' | 'monster';
  /** Owner id of a summon. Set by the engine when summons are spawned. */
  readonly summonOwnerId?: string;
}

/**
 * Infer a combat unit's role when {@link CombatUnit.kind} is not set.
 * - explicit `kind` wins
 * - any unit with `summonOwnerId` is a summon
 * - player-side units whose id begins with `merc-` are mercenaries
 * - player-side units whose id begins with `player-` are heroes
 * - everything else is a monster
 */
export function inferKind(u: CombatUnit): 'hero' | 'merc' | 'summon' | 'monster' {
  if (u.kind) return u.kind;
  if (u.summonOwnerId !== undefined || u.summon === true) return 'summon';
  if (u.side === 'player' && u.id.startsWith('merc-')) return 'merc';
  if (u.side === 'player' && u.id.startsWith('player-')) return 'hero';
  return 'monster';
}

/**
 * Apply a Resistance pierce (penalty) to a Resistances object.
 * Used for Act IV (-20) / Act V (-40) per combat-formulas §8.2.
 * Values are clamped to [-100, 75].
 */
export function applyPenalty(res: Resistances, penalty: number): Resistances {
  const clamp = (v: number): number => Math.min(75, Math.max(-100, v - penalty));
  return {
    fire: clamp(res.fire),
    cold: clamp(res.cold),
    lightning: clamp(res.lightning),
    poison: clamp(res.poison),
    arcane: clamp(res.arcane),
    physical: clamp(res.physical)
  };
}
