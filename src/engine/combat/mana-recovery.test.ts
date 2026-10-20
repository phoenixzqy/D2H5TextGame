import { describe, expect, it } from 'vitest';
import { createManaRecoveryIntegral, integrateManaRecovery } from './mana-recovery';

function intervals(total: number, step: number): number[] {
  return Array.from({ length: Math.ceil(total / step) }, (_, i) => Math.min(step, total - i * step));
}

describe('compensated cumulative MP-millisecond integration', () => {
  it.each([
    [7.2, 1250, 9], [4.16, 25_000, 104], [43.68, 25_000, 1092]
  ])('grants exactly %s MP/s × %sms = %s whole MP under every partition', (rate, duration, whole) => {
    for (const chunks of [[duration], intervals(duration, 1), intervals(duration, 17),
      intervals(duration, 250), [3, 19, 127, duration - 149]]) {
      let integral = createManaRecoveryIntegral();
      let granted = 0;
      for (const elapsed of chunks) {
        const before = structuredClone(integral);
        const next = integrateManaRecovery(rate, elapsed, integral);
        granted += next.wholeGranted - integral.wholeGranted;
        expect(integral).toEqual(before);
        integral = next;
      }
      expect(granted).toBe(whole);
      expect(integral.wholeGranted).toBe(whole);
      expect(integral.total).toBe(whole * 1000);
    }
  });

  it('retains cumulative totals after grants instead of repeatedly reducing them to a fraction', () => {
    const first = integrateManaRecovery(7.2, 1000);
    const second = integrateManaRecovery(7.2, 250, first);
    expect(first.total).toBe(7200);
    expect(first.wholeGranted).toBe(7);
    expect(second.total).toBe(9000);
    expect(second.wholeGranted - first.wholeGranted).toBe(2);
  });

  it('seeds a new battle from fractional MP and signed MP compensation', () => {
    expect(createManaRecoveryIntegral(0.75, -0.125))
      .toEqual({ total: 750, compensation: -125, wholeGranted: 0 });
    expect(integrateManaRecovery(1, 125, createManaRecoveryIntegral(0.75, -0.125)))
      .toEqual({ total: 1000, compensation: 0, wholeGranted: 1 });
  });

  it('preserves whole grants across qualified carry handoffs without carrying elapsed time', () => {
    let carry = 0;
    let compensation = 0;
    let whole = 0;
    for (const duration of [17, 233, 333, 667]) {
      const next = integrateManaRecovery(7.2, duration, createManaRecoveryIntegral(carry, compensation));
      whole += next.wholeGranted;
      carry = next.total / 1000 - next.wholeGranted;
      compensation = next.compensation / 1000;
    }
    expect(whole).toBe(9);
    expect(carry).toBeCloseTo(0, 12);
  });

  it.each([-1, 1, 1.5, NaN, Infinity, -Infinity])('ignores malformed fractional carry %s', carry => {
    expect(createManaRecoveryIntegral(carry)).toEqual({ total: 0, compensation: 0, wholeGranted: 0 });
  });

  it.each([NaN, Infinity, -Infinity])('ignores nonfinite compensation %s while retaining valid carry', compensation => {
    expect(createManaRecoveryIntegral(0.25, compensation))
      .toEqual({ total: 250, compensation: 0, wholeGranted: 0 });
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('does not integrate invalid/nonpositive rate %s', rate => {
    const before = createManaRecoveryIntegral(0.5, -0.001);
    expect(integrateManaRecovery(rate, 250, before)).toEqual(before);
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('does not integrate invalid/nonpositive elapsed time %s', elapsed => {
    const before = createManaRecoveryIntegral(0.5, -0.001);
    expect(integrateManaRecovery(4.16, elapsed, before)).toEqual(before);
  });
});
