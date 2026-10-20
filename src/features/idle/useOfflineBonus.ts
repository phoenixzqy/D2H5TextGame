/** Read-only UI projection of the same persisted bonus used by save/export. */
import { useEffect, useReducer } from 'react';
import { useMetaStore } from '@/stores';

export interface OfflineBonusSnapshot {
  /** Whether a current multiplier and remaining window are active. */
  readonly active: boolean;
  /** Current bonus fraction (0..0.5), not the unavailable original peak. */
  readonly currentPct: number;
  /** Current effective multiplier. */
  readonly multiplier: number;
  /** Remaining boosted online seconds. */
  readonly remainingSeconds: number;
}

const TICK_MS = 30_000;

/**
 * Reproject at render time, on visible return, and at most every 30 seconds
 * while active. Reads never accrue, publish, or refresh the authoritative tuple.
 */
export function useOfflineBonus(): OfflineBonusSnapshot {
  // Both subscriptions matter: an exact restore may supply the same raw tuple
  // with a new publication anchor. A projection selector would return new
  // objects on every store read, so subscribe to the source fields instead.
  useMetaStore((state) => state.idleState);
  useMetaStore((state) => state.idleBonusAnchor);
  const readIdleBonus = useMetaStore((state) => state.readIdleBonus);
  const [wake, repaint] = useReducer((tick: number) => tick + 1, 0);
  // Never reuse the prior timer's timestamp for a restore or parent render.
  const bonus = readIdleBonus(Date.now());
  const remainingSeconds = bonus.multiplierSecondsRemaining;
  const active = bonus.activeMultiplier > 1 && remainingSeconds > 0;

  // A delivered wake must rearm even if rollback still projects the same tuple.
  useEffect(() => {
    if (!active) return undefined;
    // Round up to clock precision so a fractional final millisecond cannot
    // deliver an early timeout that leaves an otherwise unchanged view active.
    const delay = Math.max(1, Math.ceil(Math.min(TICK_MS, remainingSeconds * 1000)));
    const id = window.setTimeout(repaint, delay);
    return () => { window.clearTimeout(id); };
  }, [active, remainingSeconds, wake]);

  useEffect(() => {
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') repaint();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  return {
    active,
    currentPct: bonus.activeMultiplier - 1,
    multiplier: bonus.activeMultiplier,
    remainingSeconds
  };
}
