/** Pure v7 idle-state arithmetic; callers own lifecycle and persistence. */
import type { IdleState } from '../types/save';
import {
  accrueOfflineBonus,
  consumeOnlineSession,
  remainingBonusPct,
  type IdleBonus
} from './offline-bonus';

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError('Idle bonus arithmetic requires finite numbers');
  return value;
}

function normalize(state: IdleState): IdleState {
  finite(state.lastOnline);
  const offlineTime = Math.max(0, finite(state.offlineTime));
  const pct = Math.min(0.5, Math.max(0, finite(state.activeMultiplier) - 1));
  const seconds = Math.min(7200, Math.max(0, finite(state.multiplierSecondsRemaining)));
  return {
    ...state,
    offlineTime,
    activeMultiplier: pct > 0 && seconds > 0 ? 1 + pct : 1,
    multiplierSecondsRemaining: pct > 0 && seconds > 0 ? seconds : 0
  };
}

function currentBonus(state: IdleState): IdleBonus {
  return {
    bonusPct: state.activeMultiplier - 1,
    windowSeconds: state.multiplierSecondsRemaining,
    elapsedSeconds: 0
  };
}

function elapsedSince(anchor: number, now: number): number {
  return Math.max(0, finite(finite(now) - anchor));
}

/**
 * Consume online time since lastOnline, preserving the current linear decay
 * slope using only v7's current multiplier and remaining seconds. Informational
 * offlineTime and idleTarget survive. Rollback consumes zero and reanchors to
 * now; it does not enforce a monotonic clock. Nonfinite inputs/results throw.
 */
export function checkpointIdleBonus(state: IdleState, now: number): IdleState {
  const normalized = normalize(state);
  const consumed = consumeOnlineSession(elapsedSince(normalized.lastOnline, now), currentBonus(normalized));
  const multiplier = 1 + remainingBonusPct(consumed);
  return {
    ...normalized,
    lastOnline: now,
    activeMultiplier: multiplier,
    multiplierSecondsRemaining: multiplier > 1 ? consumed.windowSeconds - consumed.elapsedSeconds : 0
  };
}

/**
 * Reconcile one unawarded away interval after loading v7. The newer of savedAt
 * and lastOnline avoids counting time already included in a legacy snapshot.
 * offlineTime is an informational cumulative millisecond counter; fresh bonus
 * accrual uses only this gap. A stronger or tied old bonus keeps its remaining
 * duration without offline decay. No XP/items are awarded. Callers must exclude
 * intervals also rewarded by background ticks and persist before reconciling
 * again. Rollback reanchors to now. Nonfinite inputs/results throw.
 */
export function resumeIdleBonus(state: IdleState, savedAt: number, now: number): IdleState {
  const normalized = normalize(state);
  const gap = elapsedSince(Math.max(normalized.lastOnline, finite(savedAt)), now);
  const offlineTime = finite(normalized.offlineTime + gap);
  const current = currentBonus(normalized);
  const fresh = accrueOfflineBonus(gap);
  // The legacy helper replaces on ties. Persisted windows must not refresh.
  const chosen = 1 + fresh.bonusPct > normalized.activeMultiplier ? fresh : current;
  return {
    ...normalized,
    lastOnline: now,
    offlineTime,
    activeMultiplier: 1 + chosen.bonusPct,
    multiplierSecondsRemaining: chosen.windowSeconds
  };
}
