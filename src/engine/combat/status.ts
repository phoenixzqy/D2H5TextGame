/**
 * Status / DoT / debuff engine.
 *
 * Source: docs/design/combat-formulas.md §9.
 *
 * Stacking rules (default):
 *   poison      — stacks, max 10
 *   ignite/burn — stacks, max 5
 *   bleed       — no stack, refresh duration
 *   chill       — no stack, refresh duration
 *   freeze      — no stack, refresh duration (boss = ½ duration)
 *   stun        — no stack
 *   paralyze    — no stack; 50% chance to fail if reapplied within 5 turns
 *   mana-burn   — stacks but only effect is a flag
 *   armor-melt  — no stack, refresh duration
 *   plague      — special, behaves like poison but flagged for spread on death
 *   shatter     — instant flag (not a duration status)
 *
 * @module engine/combat/status
 */

import type { Rng } from '../rng';
import type { ActiveStatus, CombatUnit, MonsterTier } from './types';

/** Known status IDs handled with explicit defaults. */
export type StatusId =
  | 'chill'
  | 'freeze'
  | 'stun'
  | 'paralyze'
  | 'ignite'
  | 'bleed'
  | 'poison'
  | 'plague'
  | 'mana-burn'
  | 'armor-melt'
  | 'shatter';

/** Per-status default config. */
export interface StatusConfig {
  /** Default duration in turns. */
  readonly duration: number;
  /** Stack limit; 1 = no stacking. */
  readonly maxStacks: number;
  /** Boss duration multiplier (e.g. 0.5 for freeze). */
  readonly bossDurationMult?: number;
}

/** Default per-status configuration table, derived from §9. */
export const STATUS_DEFAULTS: Readonly<Record<StatusId, StatusConfig>> = Object.freeze({
  chill: { duration: 2, maxStacks: 1 },
  freeze: { duration: 1, maxStacks: 1, bossDurationMult: 0.5 },
  stun: { duration: 1, maxStacks: 1, bossDurationMult: 0.5 },
  paralyze: { duration: 1, maxStacks: 1 },
  ignite: { duration: 3, maxStacks: 5 },
  bleed: { duration: 3, maxStacks: 1 },
  poison: { duration: 5, maxStacks: 10 },
  plague: { duration: 5, maxStacks: 10 },
  'mana-burn': { duration: 3, maxStacks: 1 },
  'armor-melt': { duration: 3, maxStacks: 1 },
  shatter: { duration: 0, maxStacks: 1 }
});

/** Description of a status to apply. */
export interface ApplyStatusInput {
  readonly id: string;
  readonly sourceId: string;
  /** Override default duration in turns (legacy callers). */
  readonly duration?: number;
  /**
   * Override default duration in **milliseconds** (sim-time callers).
   * If set together with {@link simClockMs}, the engine sets
   * `expiresAtMs = simClockMs + durationMs`.
   */
  readonly durationMs?: number;
  /**
   * Current simulation clock in ms. When provided, the produced
   * {@link ActiveStatus} is given an `expiresAtMs` rather than a
   * decremented `remaining`-counter lifecycle.
   */
  readonly simClockMs?: number;
  /** DoT damage per stack per **second** (sim-time). */
  readonly dotPerStack?: number;
  /** Damage type for DoT. */
  readonly damageType?: ActiveStatus['damageType'];
  /** Per-status config (else looked up from defaults). */
  readonly config?: StatusConfig;
}

function lookupConfig(id: string, override?: StatusConfig): StatusConfig {
  if (override) return override;
  if (id in STATUS_DEFAULTS) {
    return STATUS_DEFAULTS[id as StatusId];
  }
  return { duration: 1, maxStacks: 1 };
}

/**
 * Apply a status to a unit. Returns a new {@link CombatUnit}.
 *
 * Rules:
 *  - Stackable (maxStacks > 1): increment stacks (capped); duration = max(remaining, dur).
 *  - Non-stackable: refresh duration to the new value.
 *  - Boss tier: durations of stun/freeze halved (rounded down, min 1).
 *  - Paralyze: if there's a paralyze applied in the last 5 turns (tracked via a residual
 *    `paralyze-cooldown` status), 50% chance to fail.
 */
export function applyStatus(
  unit: CombatUnit,
  input: ApplyStatusInput,
  rng: Rng
): CombatUnit {
  const cfg = lookupConfig(input.id, input.config);
  const baseDur = input.duration ?? cfg.duration;
  const isBoss = unit.tier === 'boss';
  const dur =
    isBoss && cfg.bossDurationMult !== undefined
      ? Math.max(1, Math.floor(baseDur * cfg.bossDurationMult))
      : baseDur;

  // Paralyze diminishing returns
  if (input.id === 'paralyze') {
    const cdActive = unit.statuses.some((s) => s.id === 'paralyze-cd');
    if (cdActive && !rng.chance(0.5)) {
      return unit; // Failed application
    }
  }

  const idx = unit.statuses.findIndex((s) => s.id === input.id);
  const expiresAtMs =
    input.simClockMs !== undefined
      ? input.simClockMs + (input.durationMs ?? dur * 1000)
      : undefined;
  let next: ActiveStatus[];
  if (idx === -1) {
    const newStatus: ActiveStatus = {
      id: input.id,
      stacks: 1,
      remaining: dur,
      sourceId: input.sourceId,
      ...(expiresAtMs !== undefined ? { expiresAtMs } : {}),
      ...(input.dotPerStack !== undefined ? { dotPerStack: input.dotPerStack } : {}),
      ...(input.damageType !== undefined ? { damageType: input.damageType } : {})
    };
    next = [...unit.statuses, newStatus];
  } else {
    const prev = unit.statuses[idx];
    if (!prev) return unit;
    const stacks =
      cfg.maxStacks > 1 ? Math.min(cfg.maxStacks, prev.stacks + 1) : prev.stacks;
    const newExpiresAtMs =
      expiresAtMs !== undefined
        ? Math.max(prev.expiresAtMs ?? 0, expiresAtMs)
        : prev.expiresAtMs;
    const updated: ActiveStatus = {
      ...prev,
      stacks,
      remaining: Math.max(prev.remaining, dur),
      ...(newExpiresAtMs !== undefined ? { expiresAtMs: newExpiresAtMs } : {})
    };
    next = unit.statuses.map((s, i) => (i === idx ? updated : s));
  }

  // Add residual paralyze cooldown marker
  if (input.id === 'paralyze') {
    const existingCdIdx = next.findIndex((s) => s.id === 'paralyze-cd');
    const cdMarker: ActiveStatus = {
      id: 'paralyze-cd',
      stacks: 1,
      remaining: 5,
      sourceId: input.sourceId,
      ...(input.simClockMs !== undefined
        ? { expiresAtMs: input.simClockMs + 5 * 1000 }
        : {})
    };
    next =
      existingCdIdx === -1
        ? [...next, cdMarker]
        : next.map((s, i) => (i === existingCdIdx ? cdMarker : s));
  }

  return { ...unit, statuses: next };
}

/**
 * Drop statuses whose `expiresAtMs` has passed. Pure; returns a new unit.
 * Statuses without `expiresAtMs` (turn-based legacy) are preserved.
 */
export function expireStatuses(unit: CombatUnit, simClockMs: number): CombatUnit {
  const next = unit.statuses.filter(
    (s) => s.expiresAtMs === undefined || s.expiresAtMs > simClockMs
  );
  if (next.length === unit.statuses.length) return unit;
  return { ...unit, statuses: next };
}

/** Reduce all status durations by 1 and remove expired statuses. */
export function tickStatuses(unit: CombatUnit): CombatUnit {
  const next: ActiveStatus[] = [];
  for (const s of unit.statuses) {
    if (s.remaining < 0) {
      next.push(s); // permanent
      continue;
    }
    const remaining = s.remaining - 1;
    if (remaining > 0) next.push({ ...s, remaining });
  }
  return { ...unit, statuses: next };
}

/** Remove a specific status by id. */
export function removeStatus(unit: CombatUnit, id: string): CombatUnit {
  return { ...unit, statuses: unit.statuses.filter((s) => s.id !== id) };
}

/** Check if a status is present. */
export function hasStatus(unit: CombatUnit, id: string): boolean {
  return unit.statuses.some((s) => s.id === id);
}

/** Get current stack count of a status. */
export function getStacks(unit: CombatUnit, id: string): number {
  return unit.statuses.find((s) => s.id === id)?.stacks ?? 0;
}

/**
 * Compute total DoT damage applied to a unit per tick, summed across stacks.
 * Returns a per-damage-type breakdown plus total.
 */
export function dotDamageThisTick(unit: CombatUnit): {
  readonly total: number;
  readonly perStatus: ReadonlyMap<string, number>;
} {
  let total = 0;
  const perStatus = new Map<string, number>();
  for (const s of unit.statuses) {
    if (s.dotPerStack !== undefined) {
      const dmg = s.dotPerStack * s.stacks;
      total += dmg;
      perStatus.set(s.id, dmg);
    }
  }
  return { total, perStatus };
}

/**
 * Whether a unit will lose its action this turn.
 * Triggered by freeze, stun, paralyze.
 */
export function isStunned(unit: CombatUnit): boolean {
  return (
    hasStatus(unit, 'freeze') ||
    hasStatus(unit, 'stun') ||
    hasStatus(unit, 'paralyze')
  );
}

/** Spread plague/poison stacks to other targets on death. */
export function spreadPlague(
  source: CombatUnit,
  others: readonly CombatUnit[],
  fraction: number,
  rng: Rng
): readonly CombatUnit[] {
  const stacks = getStacks(source, 'plague') || getStacks(source, 'poison');
  if (stacks <= 0) return others;
  const toSpread = Math.max(1, Math.floor(stacks * fraction));
  const dot = source.statuses.find(
    (s) => s.id === 'plague' || s.id === 'poison'
  );
  return others.map((u) => {
    let updated = u;
    for (let i = 0; i < toSpread; i++) {
      updated = applyStatus(
        updated,
        {
          id: 'poison',
          sourceId: source.id,
          ...(dot?.dotPerStack !== undefined ? { dotPerStack: dot.dotPerStack } : {}),
          damageType: 'poison'
        },
        rng
      );
    }
    return updated;
  });
}

/** Convenience: tier alias to satisfy type imports without re-exporting types.ts. */
export type { MonsterTier };
