/**
 * Tests for {@link useOfflineBonus} pure helpers (Bug #20).
 *
 * The hook itself is exercised indirectly via the helpers it exports;
 * we keep the assertions on pure inputs so we don't need a DOM in
 * vitest (jsdom is the default but timers + intervals are flakier).
 */
import { describe, it, expect } from 'vitest';
import { deriveBonusFromLastClosed, bonusSnapshot } from './useOfflineBonus';

describe('useOfflineBonus helpers', () => {
  it('produces no bonus when the page never went hidden', () => {
    const b = deriveBonusFromLastClosed(null, Date.now());
    const s = bonusSnapshot(b);
    expect(s.active).toBe(false);
    expect(s.multiplier).toBe(1);
  });

  it('produces no bonus for sub-minute backgrounding (anti-spam)', () => {
    const now = 1_700_000_000_000;
    const b = deriveBonusFromLastClosed(now - 30_000, now);
    expect(bonusSnapshot(b).active).toBe(false);
  });

  it('accrues a positive bonus after 1h offline', () => {
    const now = 1_700_000_000_000;
    const lastClosedAt = now - 60 * 60 * 1000; // 1h ago
    const b = deriveBonusFromLastClosed(lastClosedAt, now);
    const s = bonusSnapshot(b);
    expect(s.active).toBe(true);
    // 1h * 8% = 8% bonus → 1.08 multiplier (within rounding).
    expect(s.peakPct).toBeCloseTo(0.08, 5);
    expect(s.multiplier).toBeCloseTo(1.08, 5);
    // 1h * 1200 = 1200s window.
    expect(s.windowSeconds).toBe(1200);
    expect(s.remainingSeconds).toBe(1200);
  });

  it('caps at 50% bonus / 7200s window for very long offline periods', () => {
    const now = 1_700_000_000_000;
    const tenHours = 10 * 60 * 60 * 1000;
    const b = deriveBonusFromLastClosed(now - tenHours, now);
    const s = bonusSnapshot(b);
    expect(s.peakPct).toBeCloseTo(0.5, 5);
    expect(s.windowSeconds).toBe(7200);
  });
});
