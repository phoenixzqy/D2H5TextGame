/**
 * useOfflineBonus — UI-side state hook for the idle offline-bonus
 * window (Bug #20). Pulls `lastClosedAt` off `useMetaStore` (set on
 * `visibilitychange === 'hidden'`) and consumes the engine's pure
 * `accrueOfflineBonus` / `bonusMultiplier` helpers from
 * `engine/idle/offline-bonus.ts`.
 *
 * Returns a stable snapshot recomputed every 30 seconds while the
 * window is active, so the banner can show a live "next Y minutes"
 * countdown without coupling React to engine timers.
 *
 * @module features/idle/useOfflineBonus
 */

import { useEffect, useMemo, useState } from 'react';
import {
  accrueOfflineBonus,
  bonusMultiplier,
  consumeOnlineSession,
  NO_BONUS,
  type IdleBonus
} from '@/engine/idle/offline-bonus';
import { useMetaStore } from '@/stores';

export interface OfflineBonusSnapshot {
  /** Whether a bonus window is currently active. */
  readonly active: boolean;
  /** Peak bonus pct (0..0.5), e.g. 0.24 = 24%. */
  readonly peakPct: number;
  /** Effective multiplier *now* (1 + remaining pct). */
  readonly multiplier: number;
  /** Seconds remaining in the window. */
  readonly remainingSeconds: number;
  /** Initial window length in seconds (for progress UI). */
  readonly windowSeconds: number;
}

const TICK_MS = 30_000;

export function deriveBonusFromLastClosed(
  lastClosedAt: number | null,
  now: number
): IdleBonus {
  if (lastClosedAt === null) return NO_BONUS;
  const elapsedMs = Math.max(0, now - lastClosedAt);
  return accrueOfflineBonus(elapsedMs);
}

export function bonusSnapshot(bonus: IdleBonus): OfflineBonusSnapshot {
  const remainingSeconds = Math.max(
    0,
    bonus.windowSeconds - bonus.elapsedSeconds
  );
  return {
    active: remainingSeconds > 0 && bonus.bonusPct > 0,
    peakPct: bonus.bonusPct,
    multiplier: bonusMultiplier(bonus),
    remainingSeconds,
    windowSeconds: bonus.windowSeconds
  };
}

/**
 * Read-only hook returning the current offline-bonus snapshot.
 * Re-renders every 30s while a window is active.
 */
export function useOfflineBonus(): OfflineBonusSnapshot {
  const lastClosedAt = useMetaStore((s) => s.lastClosedAt);
  const [now, setNow] = useState(() => Date.now());
  const [anchorAt] = useState(() => Date.now());

  const baseBonus = useMemo(
    () => deriveBonusFromLastClosed(lastClosedAt, anchorAt),
    [lastClosedAt, anchorAt]
  );

  useEffect(() => {
    if (!baseBonus.windowSeconds) return undefined;
    const id = window.setInterval(() => { setNow(Date.now()); }, TICK_MS);
    return () => { window.clearInterval(id); };
  }, [baseBonus.windowSeconds]);

  const consumed = useMemo(() => {
    const onlineMs = Math.max(0, now - anchorAt);
    return consumeOnlineSession(onlineMs, baseBonus);
  }, [baseBonus, now, anchorAt]);

  return bonusSnapshot(consumed);
}
