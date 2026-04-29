/**
 * Bug #6 (P0) — idle ticks accumulate (engine side).
 *
 * The engine's {@link onlineTick} returns a per-tick delta, not a running
 * total. This test verifies:
 *  1. N successive calls produce N non-zero rewards.
 *  2. The advanced `bonus` snapshot decays the window each tick (no fixed
 *     reuse), so the consumer can persist it and let the bonus expire.
 *  3. With a non-zero raw xp, the sum of N tick rewards equals N * raw
 *     (within bonus-rounding) — i.e. there is no "only-once" cap in the
 *     engine layer. Whether the consumer actually applies the delta to
 *     player xp / inventory is a wiring concern documented in Bugs.md.
 */
import { describe, it, expect } from 'vitest';
import { onlineTick, EMPTY_REWARD, type TickReward } from './online-tick';
import { NO_BONUS, accrueOfflineBonus } from './offline-bonus';

describe('Bug #6 — onlineTick accumulates per-tick deltas', () => {
  it('returns the same xp each tick when raw input is constant (no zeroing)', () => {
    const raw: TickReward = { ...EMPTY_REWARD, xp: 10, runeShards: 1 };
    let bonus = NO_BONUS;
    let totalXp = 0;
    let totalShards = 0;
    for (let i = 0; i < 50; i++) {
      const r = onlineTick(raw, bonus, { tickSeconds: 6, baseMagicFind: 0 });
      totalXp += r.reward.xp;
      totalShards += r.reward.runeShards;
      bonus = r.bonus;
    }
    expect(totalXp).toBe(500);
    expect(totalShards).toBe(50);
  });

  it('advances the bonus window each tick so it eventually decays', () => {
    const initial = accrueOfflineBonus(4 * 3_600_000, NO_BONUS);
    expect(initial.bonusPct).toBeCloseTo(0.32);
    let bonus = initial;
    for (let i = 0; i < 10; i++) {
      const r = onlineTick({ ...EMPTY_REWARD, xp: 100 }, bonus, {
        tickSeconds: 6,
        baseMagicFind: 0
      });
      expect(r.bonus.elapsedSeconds).toBeGreaterThanOrEqual(bonus.elapsedSeconds);
      bonus = r.bonus;
    }
    expect(bonus.elapsedSeconds).toBe(60);
  });

  it('linear accumulation: 100 ticks × xp=5 = 500 xp', () => {
    const raw: TickReward = { ...EMPTY_REWARD, xp: 5 };
    let bonus = NO_BONUS;
    let total = 0;
    for (let i = 0; i < 100; i++) {
      const r = onlineTick(raw, bonus, { tickSeconds: 6, baseMagicFind: 0 });
      total += r.reward.xp;
      bonus = r.bonus;
    }
    expect(total).toBe(500);
  });

  it('with an active bonus, xp delta exceeds raw xp until window expires', () => {
    const bonus0 = accrueOfflineBonus(2 * 3_600_000, NO_BONUS);
    const r = onlineTick({ ...EMPTY_REWARD, xp: 100 }, bonus0, {
      tickSeconds: 6,
      baseMagicFind: 0
    });
    expect(r.reward.xp).toBeGreaterThan(100);
  });
});
