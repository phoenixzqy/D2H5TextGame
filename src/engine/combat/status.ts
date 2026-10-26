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
 *   mana-burn   — direct-hit mana drain and combos; persists until mana restores
 *   armor-melt  — no stack, refresh duration
 *   plague      — special, behaves like poison but flagged for spread on death
 *   shatter     — instant flag (not a duration status)
 *
 * @module engine/combat/status
 */

import type { Rng } from '../rng';
import type { ActiveStatus, CombatUnit, MonsterTier } from './types';
import { AMPLIFY_DAMAGE_DEFINITION } from './amplify-damage-definition';
import { MANA_BURN_DEFINITION } from './mana-burn-definition';
import { DRUID_SUMMON_DEFINITION } from '../skills/druid-summon-definition';
import { WARCRY_DEFINITIONS } from './warcry-definition';
import { DECREPIFY_DEFINITION } from './decrepify-definition';
import { WEAKEN_DEFINITION } from './weaken-definition';
import { DIM_VISION_DEFINITION } from './dim-vision-definition';
import { TARGET_CURSE_DEFINITIONS } from './target-curse-definition';
import { TERROR_DEFINITION } from './terror-definition';
import { BONE_PRISON_DEFINITION } from './bone-prison-definition';
import { DAMAGE_CURSE_DEFINITIONS, isDamageCurseId } from './damage-curse-definition';

/** Known status IDs handled with explicit defaults. */
export type StatusId =
  | 'confuse' | 'attract'
  | 'dim-vision'
  | 'terror'
  | 'bone-prison'
  | 'iron-maiden' | 'life-tap' | 'lower-resist'
  | 'weaken'
  | 'decrepify'
  | 'howl'
  | 'chill'
  | 'blind'
  | 'freeze'
  | 'stun'
  | 'paralyze'
  | 'ignite'
  | 'bleed'
  | 'poison'
  | 'plague'
  | 'mana-burn'
  | 'armor-melt'
  | 'amplify-damage'
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
  confuse: { duration: TARGET_CURSE_DEFINITIONS.confuse.durationMs / 1000, maxStacks: 1 },
  attract: { duration: TARGET_CURSE_DEFINITIONS.attract.durationMs / 1000, maxStacks: 1 },
  'dim-vision': { duration: DIM_VISION_DEFINITION.durationMs / 1000, maxStacks: 1 },
  'bone-prison': { duration: BONE_PRISON_DEFINITION.durationMs / 1000, maxStacks: 1,
    bossDurationMult: BONE_PRISON_DEFINITION.bossDurationMultiplier },
  terror: { duration: TERROR_DEFINITION.durationMs / 1000, maxStacks: 1,
    bossDurationMult: TERROR_DEFINITION.bossDurationMultiplier },
  'iron-maiden': { duration: DAMAGE_CURSE_DEFINITIONS['iron-maiden'].durationMs / 1000, maxStacks: 1 },
  'life-tap': { duration: DAMAGE_CURSE_DEFINITIONS['life-tap'].durationMs / 1000, maxStacks: 1 },
  'lower-resist': { duration: DAMAGE_CURSE_DEFINITIONS['lower-resist'].durationMs / 1000, maxStacks: 1 },
  weaken: { duration: WEAKEN_DEFINITION.durationMs / 1000, maxStacks: 1 },
  decrepify: { duration: DECREPIFY_DEFINITION.durationMs / 1000, maxStacks: 1 },
  howl: { duration: WARCRY_DEFINITIONS.howl.durationMs / 1000, maxStacks: 1,
    bossDurationMult: WARCRY_DEFINITIONS.howl.bossDurationMultiplier },
  chill: { duration: 2, maxStacks: 1 },
  blind: { duration: DRUID_SUMMON_DEFINITION.raven.durationMs / 1000, maxStacks: 1 },
  freeze: { duration: 1, maxStacks: 1, bossDurationMult: 0.5 },
  stun: { duration: 1, maxStacks: 1, bossDurationMult: 0.5 },
  paralyze: { duration: 1, maxStacks: 1 },
  ignite: { duration: 3, maxStacks: 5 },
  bleed: { duration: 3, maxStacks: 1 },
  poison: { duration: 5, maxStacks: 10 },
  plague: { duration: 5, maxStacks: 10 },
  'mana-burn': { duration: MANA_BURN_DEFINITION.durationSeconds, maxStacks: 1 },
  'armor-melt': { duration: 3, maxStacks: 1 },
  'amplify-damage': { duration: AMPLIFY_DAMAGE_DEFINITION.durationMs / 1000, maxStacks: 1 },
  shatter: { duration: 0, maxStacks: 1 }
});

/** Description of a status to apply. */
export interface ApplyStatusInput {
  readonly targetCurse?: ActiveStatus['targetCurse'];
  readonly dimVision?: ActiveStatus['dimVision'];
  readonly terror?: true;
  readonly bonePrison?: true;
  readonly damageCurse?: ActiveStatus['damageCurse'];
  readonly weaken?: ActiveStatus['weaken'];
  readonly decrepify?: ActiveStatus['decrepify'];
  readonly battleCry?: ActiveStatus['battleCry'];
  /** Eligible recipient's selected Cleansing factor; affects finite timed poison/curse applications only. */
  readonly cleansingDurationMultiplier?: number;
  readonly id: string;
  readonly sourceId: string;
  /** Override default duration in turns (legacy callers). */
  readonly duration?: number;
  /**
   * Override the base duration in **milliseconds** (sim-time callers), before
   * any configured boss multiplier. Takes precedence over seconds derived
   * from {@link duration} or the default when {@link simClockMs} is supplied.
   */
  readonly durationMs?: number;
  /**
   * Current simulation clock in ms. When provided, the produced
   * {@link ActiveStatus} is given start/expiry timestamps rather than a
   * decremented `remaining`-counter lifecycle.
   */
  readonly simClockMs?: number;
  /** Amplify Damage's physical resistance reduction in percentage points. */
  readonly physicalResistReductionPct?: number;
  /** DoT damage per stack per **second** (sim-time). */
  readonly dotPerStack?: number;
  /** Damage type for DoT. */
  readonly damageType?: ActiveStatus['damageType'];
  /** Per-status config (else looked up from defaults). */
  readonly config?: StatusConfig;
}

/** An accepted application may refresh an existing status without changing its potency. */
export interface StatusApplicationResult {
  readonly unit: CombatUnit;
  /** False when the status application was rejected; separate state updates are retained in unit. */
  readonly applied: boolean;
}

/** Fire and Amplify Damage each accept their legacy status alias. */
function canonicalStatusId(id: string): string {
  if (id === 'burn') return 'ignite';
  return id === AMPLIFY_DAMAGE_DEFINITION.legacyStatusId
    ? AMPLIFY_DAMAGE_DEFINITION.canonicalStatusId : id;
}

const CLEANSABLE_STATUS_IDS: ReadonlySet<string> = new Set(['poison', 'plague', 'amplify-damage',
  'decrepify', 'dim-vision', 'weaken', 'iron-maiden', 'terror', 'confuse', 'life-tap', 'attract', 'lower-resist']);

function validCleansingMultiplier(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0 && value < 1;
}

/** Shorten finite remaining/future duration once; preserve original source, potency, start and indefinite legacy identity. */
export function shortenCleansingStatuses(unit: CombatUnit, simClockMs: number, multiplier: number | undefined): CombatUnit {
  if (!validCleansingMultiplier(multiplier) || !Number.isFinite(simClockMs)) return unit;
  let changed = false;
  const statuses: ActiveStatus[] = [];
  for (const status of unit.statuses) {
    const start = Math.max(simClockMs, status.appliedAtMs ?? 0), expiry = status.expiresAtMs;
    if (status.cleansingShortened === true || !CLEANSABLE_STATUS_IDS.has(canonicalStatusId(status.id)) ||
      expiry === undefined || !Number.isFinite(expiry) || !Number.isFinite(start) || expiry <= start) {
      statuses.push(status); continue;
    }
    changed = true;
    statuses.push({ ...status, expiresAtMs: start + Math.max(1, Math.floor((expiry - start) * multiplier)), cleansingShortened: true });
  }
  return changed ? { ...unit, statuses } : unit;
}

/**
 * Read the first Amplify Damage family's potency without combining duplicates.
 * The caller must supply an active-only status view at the current simulation
 * clock. Missing legacy payload uses the authored default; explicit zero stays zero.
 */
export function amplifyDamageReduction(unit: CombatUnit): number {
  const status = unit.statuses.find(
    s => canonicalStatusId(s.id) === AMPLIFY_DAMAGE_DEFINITION.canonicalStatusId
  );
  return status === undefined ? 0
    : status.physicalResistReductionPct ?? AMPLIFY_DAMAGE_DEFINITION.physicalResistReductionPct;
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
 *  - Burn/ignite and amplify/amplify-damage share configuration and first-match
 *    identity. Fresh records use canonical IDs; active refresh preserves the
 *    stored id and valid DoT payload. An active marker adopts the first finite
 *    positive incoming DoT rate/source/type without changing its start clock.
 *  - Boss tiers: configured duration multiplier applies in milliseconds for
 *    timed callers (positive results floor to at least 1ms); legacy remaining
 *    retains whole-turn rounding with minimum 1.
 *  - Paralyze: if there's a paralyze applied in the last 5 turns (tracked via a residual
 *    `paralyze-cooldown` status), 50% chance to fail.
 */
export function applyStatus(
  unit: CombatUnit,
  input: ApplyStatusInput,
  rng: Rng
): CombatUnit {
  return applyStatusWithResult(unit, input, rng).unit;
}

/** Apply the same status rules while exposing acceptance for truthful combat feedback. */
export function applyStatusWithResult(
  unit: CombatUnit,
  input: ApplyStatusInput,
  rng: Rng
): StatusApplicationResult {
  const id = canonicalStatusId(input.id);
  const cleansing = input.simClockMs !== undefined && validCleansingMultiplier(input.cleansingDurationMultiplier) &&
    CLEANSABLE_STATUS_IDS.has(id) ? input.cleansingDurationMultiplier : undefined;
  if (cleansing !== undefined && input.simClockMs !== undefined) unit = shortenCleansingStatuses(unit, input.simClockMs, cleansing);
  const cfg = lookupConfig(id, input.config);
  const baseDur = input.duration ??
    (id === 'mana-burn' && input.durationMs !== undefined ? input.durationMs / 1000 : cfg.duration);
  const isBoss = unit.tier === 'boss' || unit.tier === 'chapter-boss';
  const bossDurationMult = isBoss ? cfg.bossDurationMult : undefined;
  const dur =
    bossDurationMult !== undefined
      ? Math.max(1, Math.floor(baseDur * bossDurationMult))
      : baseDur;
  // Timed expiry must not inherit legacy whole-turn rounding.
  const baseDurationMs = input.durationMs ?? baseDur * 1000;
  const scaledDurationMs = bossDurationMult === undefined
    ? baseDurationMs : baseDurationMs * bossDurationMult;
  const reducedDurationMs = scaledDurationMs * (cleansing ?? 1);
  const timedDurationMs = (bossDurationMult !== undefined || cleansing !== undefined) && reducedDurationMs > 0
    ? Math.max(1, Math.floor(reducedDurationMs)) : reducedDurationMs;

  // Paralyze diminishing returns
  if (input.id === 'paralyze') {
    const cdActive = unit.statuses.some((s) => s.id === 'paralyze-cd' &&
      (input.simClockMs === undefined || statusActiveAt(s, input.simClockMs)));
    if (cdActive && !rng.chance(0.5)) {
      return { unit, applied: false };
    }
  }

  // Paid warcries and finite damage curses replace their source, potency and interval without stacking.
  if (id === 'confuse' || id === 'attract' || id === 'dim-vision' || id === 'terror' || id === 'bone-prison' || id === 'howl' || id === 'taunt' || id === 'battle-cry' || id === 'decrepify' || id === 'weaken' || isDamageCurseId(id))
    unit = { ...unit, statuses: unit.statuses.filter(s => s.id !== id) };
  const idx = unit.statuses.findIndex((s) => canonicalStatusId(s.id) === id);
  const expiresAtMs =
    input.simClockMs !== undefined && !(id === 'mana-burn' && timedDurationMs < 0)
      ? input.simClockMs + timedDurationMs
      : undefined;
  let next: ActiveStatus[];
  const existing = unit.statuses[idx];
  // A future/expired record is not a refresh. Do not inherit its stacks or rate.
  if (!existing || (input.simClockMs !== undefined && !statusActiveAt(existing, input.simClockMs))) {
    const newStatus: ActiveStatus = {
      id,
      ...((id === 'confuse' || id === 'attract') && input.targetCurse === id ? { targetCurse: id } : {}),
      ...(id === 'dim-vision' && input.dimVision ? { dimVision: Object.freeze({ ...input.dimVision }) } : {}),
      ...(id === 'terror' && input.terror === true ? { terror: true as const } : {}),
      ...(id === 'bone-prison' && input.bonePrison === true ? { bonePrison: true as const } : {}),
      ...(isDamageCurseId(id) && input.damageCurse?.id === id ? { damageCurse: Object.freeze({ ...input.damageCurse }) } : {}),
      ...(id === 'weaken' && input.weaken ? { weaken: Object.freeze({ ...input.weaken }) } : {}),
      ...(id === 'decrepify' && input.decrepify ? { decrepify: Object.freeze({ ...input.decrepify }) } : {}),
      stacks: 1,
      remaining: dur,
      sourceId: input.sourceId,
      ...(id === 'battle-cry' && input.battleCry ? { battleCry: Object.freeze({ ...input.battleCry }) } : {}),
      ...(input.simClockMs !== undefined ? { appliedAtMs: input.simClockMs } : {}),
      ...(expiresAtMs !== undefined ? { expiresAtMs } : {}),
      ...(cleansing !== undefined && Number.isFinite(expiresAtMs) ? { cleansingShortened: true as const } : {}),
      ...(id === AMPLIFY_DAMAGE_DEFINITION.canonicalStatusId ? {
        physicalResistReductionPct: input.physicalResistReductionPct ??
          AMPLIFY_DAMAGE_DEFINITION.physicalResistReductionPct
      } : {}),
      ...(input.dotPerStack !== undefined ? { dotPerStack: input.dotPerStack } : {}),
      ...(input.damageType !== undefined ? { damageType: input.damageType } : {})
    };
    next = idx === -1 ? [...unit.statuses, newStatus]
      : unit.statuses.map((s, i) => i === idx ? newStatus : s);
  } else {
    const prev = unit.statuses[idx];
    if (!prev) return { unit, applied: false };
    const stacks =
      cfg.maxStacks > 1 ? Math.min(cfg.maxStacks, prev.stacks + 1) : prev.stacks;
    // Undefined expiry is indefinite, including legacy combat-entry records.
    const indefiniteManaBurn = id === 'mana-burn' && timedDurationMs < 0;
    const newExpiresAtMs = indefiniteManaBurn || prev.expiresAtMs === undefined ? undefined
      : expiresAtMs === undefined ? prev.expiresAtMs : Math.max(prev.expiresAtMs, expiresAtMs);
    const validRate = (rate: number | undefined): boolean =>
      typeof rate === 'number' && Number.isFinite(rate) && rate > 0;
    const promoteDot = !validRate(prev.dotPerStack) && validRate(input.dotPerStack);
    // A new unshortened refresh may replace the duration that the old marker described.
    const { cleansingShortened: oldReduction, expiresAtMs: oldExpiry, ...unmarked } = prev;
    const retainReduction = newExpiresAtMs !== undefined && (cleansing !== undefined ||
      oldReduction && newExpiresAtMs === oldExpiry);
    const updated: ActiveStatus = {
      ...unmarked,
      ...(retainReduction ? { cleansingShortened: true as const } : {}),
      stacks,
      remaining: indefiniteManaBurn ? -1 : Math.max(prev.remaining, dur),
      ...(promoteDot ? {
        dotPerStack: input.dotPerStack,
        sourceId: input.sourceId,
        ...(input.damageType !== undefined ? { damageType: input.damageType } : {})
      } : {}),
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
        ? { appliedAtMs: input.simClockMs, expiresAtMs: input.simClockMs + 5 * 1000 }
        : {})
    };
    next =
      existingCdIdx === -1
        ? [...next, cdMarker]
        : next.map((s, i) => (i === existingCdIdx ? cdMarker : s));
  }

  return { unit: { ...unit, statuses: next }, applied: true };
}

/** Whether a stored status is active at an exact simulation boundary. */
export function statusActiveAt(status: ActiveStatus, simClockMs: number): boolean {
  return (status.appliedAtMs ?? 0) <= simClockMs &&
    (status.expiresAtMs === undefined || simClockMs < status.expiresAtMs);
}

/** Temporary active-only view; pending records stay in the authoritative unit. */
export function activeStatusView(unit: CombatUnit, simClockMs: number): CombatUnit {
  return { ...unit, statuses: unit.statuses.filter(s => statusActiveAt(s, simClockMs)) };
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

/**
 * Translate a completed battle's status clocks into the next battle's zero
 * epoch. Preserve missing clocks and legacy counters; prior starts may become
 * negative. The caller supplies actual elapsed simulation time exactly once.
 */
export function rebaseStatusClock(unit: CombatUnit, elapsedMs: number): CombatUnit {
  return {
    ...unit,
    statuses: unit.statuses
      .filter(s => s.expiresAtMs === undefined || s.expiresAtMs > elapsedMs)
      .map(s => ({
        ...s,
        ...(s.appliedAtMs === undefined ? {} : { appliedAtMs: s.appliedAtMs - elapsedMs }),
        ...(s.expiresAtMs === undefined ? {} : { expiresAtMs: s.expiresAtMs - elapsedMs })
      }))
  };
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

/** Remove a status by id; either fire or Amplify alias removes its whole family. */
export function removeStatus(unit: CombatUnit, id: string): CombatUnit {
  const canonical = canonicalStatusId(id);
  return { ...unit, statuses: unit.statuses.filter((s) => canonicalStatusId(s.id) !== canonical) };
}

/** Check presence, accepting fire and Amplify aliases without rewriting records. */
export function hasStatus(unit: CombatUnit, id: string): boolean {
  const canonical = canonicalStatusId(id);
  return unit.statuses.some((s) => canonicalStatusId(s.id) === canonical);
}

/** Get the first matching record's stacks within the fire or Amplify alias family. */
export function getStacks(unit: CombatUnit, id: string): number {
  const canonical = canonicalStatusId(id);
  return unit.statuses.find((s) => canonicalStatusId(s.id) === canonical)?.stacks ?? 0;
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
 * Triggered by freeze, stun, paralyze or Howl fear disruption.
 */
export function isStunned(unit: CombatUnit): boolean {
  return (
    hasStatus(unit, 'freeze') ||
    hasStatus(unit, 'howl') ||
    hasStatus(unit, 'stun') ||
    hasStatus(unit, 'paralyze')
  );
}

/** Spread plague/poison stacks to other targets on death. */
export function spreadPlague(
  source: CombatUnit,
  others: readonly CombatUnit[],
  fraction: number,
  rng: Rng,
  simClockMs?: number,
  cleansingMultiplierFor?: (recipient: CombatUnit) => number | undefined
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
      const cleansingDurationMultiplier = cleansingMultiplierFor?.(updated);
      updated = applyStatus(
        updated,
        {
          id: 'poison',
          ...(cleansingDurationMultiplier !== undefined ? { cleansingDurationMultiplier } : {}),
          sourceId: source.id,
          ...(simClockMs !== undefined ? { simClockMs } : {}),
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
