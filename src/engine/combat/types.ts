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
export type MonsterTier = 'trash' | 'elite' | 'champion' | 'boss';

/** Active status effect on a combat unit. */
export interface ActiveStatus {
  readonly id: string;
  readonly stacks: number;
  /** Remaining duration in turns; -1 = permanent (until dispelled). */
  readonly remaining: number;
  /**
   * Remaining duration in *virtual milliseconds* — used by the tick-based
   * scheduler ({@link import('./scheduler').runBattleStream}). Stamped from
   * `remaining * 1200` when the scheduler first observes a status. Undefined
   * for permanent statuses (when `remaining < 0`) or before stamping.
   */
  readonly remainingMs?: number;
  /** Damage per stack per tick (for DoTs). */
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
  /** Has this unit been "summoned-on-start" already? */
  readonly summonedAdds: boolean;
  /**
   * Base swing interval in *virtual milliseconds*, before haste.
   *
   * Used by the tick-based combat scheduler. If absent at scheduler entry,
   * the engine derives it from `attackSpeed` via
   * `Math.round(120000 / Math.max(1, attackSpeed))` so a unit with the
   * legacy default `attackSpeed: 100` gets `1200 ms`. Floors at 50 ms.
   */
  readonly attackIntervalMs?: number;
  /** Cached resistance penalty from Act IV/V (subtracted from each resist). */
  readonly resistPenalty?: number;
  /** Owner unit id (for summons). */
  readonly ownerId?: string;
  /** Is this a summon? */
  readonly summon?: boolean;
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
