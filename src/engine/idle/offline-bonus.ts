/**
 * Offline-bonus accrual and online consumption.
 *
 * Source: docs/design/idle-offline.md §3.
 *  - Offline accrues bonusPct = min(0.50, hoursOffline * 0.08).
 *  - Window seconds = min(7200, hoursOffline * 1200) (cap 2h online).
 *  - Bonus decays linearly while online.
 *
 * @module engine/idle/offline-bonus
 */

/** Snapshot of the active idle bonus. */
export interface IdleBonus {
  /** Peak bonus pct (0..0.5). */
  readonly bonusPct: number;
  /** Initial window length in seconds. */
  readonly windowSeconds: number;
  /** Seconds of online play already consumed within the window. */
  readonly elapsedSeconds: number;
}

/** Empty / inactive bonus. */
export const NO_BONUS: IdleBonus = {
  bonusPct: 0,
  windowSeconds: 0,
  elapsedSeconds: 0
};

const HOUR_MS = 3_600_000;
const MIN_OFFLINE_SECONDS = 60;
const MAX_BONUS_PCT = 0.5;
const MAX_WINDOW_SECONDS = 7200;
const PCT_PER_HOUR = 0.08;
const SECONDS_PER_HOUR = 1200;

/**
 * Compute a fresh bonus from elapsed offline time (ms).
 * Sub-minute offline returns NO_BONUS (anti-spam).
 */
export function accrueOfflineBonus(elapsedMs: number, current: IdleBonus = NO_BONUS): IdleBonus {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return current;
  const hours = elapsedMs / HOUR_MS;
  if (hours * 3600 < MIN_OFFLINE_SECONDS) return current;
  const bonusPct = Math.min(MAX_BONUS_PCT, hours * PCT_PER_HOUR);
  const windowSeconds = Math.min(MAX_WINDOW_SECONDS, hours * SECONDS_PER_HOUR);

  // Edge case: prior unfinished window + new accrual → take max remaining bonus%
  // (per idle-offline.md §3.6).
  const currentRemainingPct = remainingBonusPct(current);
  if (currentRemainingPct > bonusPct) {
    return current;
  }
  return { bonusPct, windowSeconds, elapsedSeconds: 0 };
}

/**
 * Advance the bonus by `elapsedMs` of online play.
 * Returns the new bonus snapshot (clamped at window end).
 */
export function consumeOnlineSession(elapsedMs: number, bonus: IdleBonus): IdleBonus {
  if (bonus.windowSeconds <= 0 || elapsedMs <= 0) return bonus;
  const newElapsed = Math.min(
    bonus.windowSeconds,
    bonus.elapsedSeconds + elapsedMs / 1000
  );
  return { ...bonus, elapsedSeconds: newElapsed };
}

/**
 * Current bonus pct (0..bonusPct) given elapsed online seconds.
 */
export function remainingBonusPct(bonus: IdleBonus): number {
  if (bonus.windowSeconds <= 0) return 0;
  const remainingFraction = Math.max(
    0,
    (bonus.windowSeconds - bonus.elapsedSeconds) / bonus.windowSeconds
  );
  return bonus.bonusPct * remainingFraction;
}

/**
 * Multiplier applied to XP / MF rewards (1 + remaining bonus).
 */
export function bonusMultiplier(bonus: IdleBonus): number {
  return 1 + remainingBonusPct(bonus);
}
