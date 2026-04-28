import { describe, it, expect } from 'vitest';
import {
  accrueOfflineBonus,
  consumeOnlineSession,
  remainingBonusPct,
  bonusMultiplier,
  NO_BONUS
} from './offline-bonus';

const HOUR = 3_600_000;

describe('offline bonus', () => {
  it('1h offline → +8%, 20m window', () => {
    const b = accrueOfflineBonus(HOUR);
    expect(b.bonusPct).toBeCloseTo(0.08, 5);
    expect(b.windowSeconds).toBeCloseTo(1200, 0);
  });

  it('6h offline → ~+48%, 7200s window', () => {
    const b = accrueOfflineBonus(6 * HOUR);
    expect(b.bonusPct).toBeCloseTo(0.48, 5);
    expect(b.windowSeconds).toBe(7200);
  });

  it('caps at +50% / 2h regardless of long offline', () => {
    const b6_25 = accrueOfflineBonus(6.25 * HOUR);
    expect(b6_25.bonusPct).toBe(0.5);
    expect(b6_25.windowSeconds).toBe(7200);
    const b24 = accrueOfflineBonus(24 * HOUR);
    expect(b24).toEqual(b6_25);
    const b7d = accrueOfflineBonus(7 * 24 * HOUR);
    expect(b7d).toEqual(b6_25);
  });

  it('< 1 minute offline returns prior NO_BONUS', () => {
    expect(accrueOfflineBonus(30_000)).toEqual(NO_BONUS);
  });

  it('preserves an existing higher bonus on small new accrual', () => {
    const big = accrueOfflineBonus(6 * HOUR);
    const small = accrueOfflineBonus(5 * 60_000, big);
    expect(small).toEqual(big);
  });

  it('linear decay: 1h online into a 2h window halves the bonus', () => {
    const b = accrueOfflineBonus(6.25 * HOUR);
    const halfway = consumeOnlineSession(HOUR, b);
    expect(remainingBonusPct(halfway)).toBeCloseTo(0.25, 2);
    expect(bonusMultiplier(halfway)).toBeCloseTo(1.25, 2);
  });

  it('decay clamps to 0 past the window', () => {
    const b = accrueOfflineBonus(6 * HOUR);
    const past = consumeOnlineSession(3 * HOUR, b);
    expect(remainingBonusPct(past)).toBe(0);
    expect(bonusMultiplier(past)).toBe(1);
  });

  it('NO_BONUS produces multiplier 1', () => {
    expect(bonusMultiplier(NO_BONUS)).toBe(1);
    expect(consumeOnlineSession(HOUR, NO_BONUS)).toEqual(NO_BONUS);
  });
});
