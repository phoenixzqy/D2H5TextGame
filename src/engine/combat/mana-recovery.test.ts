import { describe, expect, it } from 'vitest';
import {
  createManaRecoveryIntegral, exportManaRecoveryCarry,
  integrateManaRecovery, integrateManaRecoveryBetween
} from './mana-recovery';

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

  it('preserves exactly 1092 MP at 43.68 MP/s across the 16ms and 24984ms product partition', () => {
    const first = integrateManaRecovery(43.68, 16);
    const second = integrateManaRecovery(43.68, 24_984, first);
    expect(second.wholeGranted).toBe(1092);
    expect(second.total).toBe(1_092_000);
  });

  it('seeds a new battle from fractional MP and signed MP compensation', () => {
    expect(createManaRecoveryIntegral(0.75, -0.125))
      .toEqual({ total: 750, compensation: -125, wholeGranted: 0, exactTotal: '875' });
    expect(integrateManaRecovery(1, 125, createManaRecoveryIntegral(0.75, -0.125)))
      .toEqual({ total: 1000, compensation: 0, wholeGranted: 1, exactTotal: '1000' });
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
    expect(createManaRecoveryIntegral(carry)).toEqual({ total: 0, compensation: 0, wholeGranted: 0, exactTotal: '0' });
  });

  it.each([NaN, Infinity, -Infinity])('ignores nonfinite compensation %s while retaining valid carry', compensation => {
    expect(createManaRecoveryIntegral(0.25, compensation))
      .toEqual({ total: 250, compensation: 0, wholeGranted: 0, exactTotal: '250' });
  });

  it('prefers qualified exact carry over contradictory legacy numeric views', () => {
    expect(createManaRecoveryIntegral(0.75, -0.125, '0.004'))
      .toEqual({ total: 4, compensation: 0, wholeGranted: 0, exactTotal: '4' });
  });

  it('accepts canonical zero exact carry in preference to nonzero numeric credit', () => {
    expect(createManaRecoveryIntegral(0.75, -0.125, '0'))
      .toEqual({ total: 0, compensation: 0, wholeGranted: 0, exactTotal: '0' });
  });

  it.each(['', '.1', '00.1', '0.10', '0.', '+0.1', '-0', '-0.1', '1', '1.1', '1e-3', ' 0.1 '])(
    'falls back to qualified legacy carry for malformed/noncanonical/out-of-range exact carry %s', exactCarry => {
      expect(createManaRecoveryIntegral(0.25, 0, exactCarry))
        .toEqual({ total: 250, compensation: 0, wholeGranted: 0, exactTotal: '250' });
    });

  it('rejects foreign exact carry beyond the 2048-character parser bound', () => {
    const exactCarry = `0.${'0'.repeat(2046)}1`;
    expect(exactCarry.length).toBe(2049);
    expect(createManaRecoveryIntegral(0.25, 0, exactCarry))
      .toEqual({ total: 250, compensation: 0, wholeGranted: 0, exactTotal: '250' });
  });

  it('retains generated exact totals beyond the foreign carry parser bound', () => {
    const exactCarry = `0.${'0'.repeat(2045)}1`;
    expect(exactCarry.length).toBe(2048);
    const first = integrateManaRecovery(1e100, 1e100, createManaRecoveryIntegral(0, 0, exactCarry));
    const second = integrateManaRecovery(1, 1, first);
    expect(first.exactTotal).toBe(`1${'0'.repeat(200)}.${'0'.repeat(2042)}1`);
    expect(second.exactTotal).toBe(`1${'0'.repeat(199)}1.${'0'.repeat(2042)}1`);
    expect(second.exactTotal.length).toBeGreaterThan(2048);
  });

  it.each([1, -0.5])('resets combined legacy credit outside [0,1) with compensation %s', compensation => {
    expect(createManaRecoveryIntegral(0.75, compensation))
      .toEqual({ total: 0, compensation: 0, wholeGranted: 0, exactTotal: '0' });
  });

  it('subtracts exact decimal boundary endpoints before multiplying the elapsed interval', () => {
    const first = integrateManaRecoveryBetween(7.2, 0, 0.1);
    const second = integrateManaRecoveryBetween(7.2, 0.1, 0.3, first);
    const third = integrateManaRecoveryBetween(7.2, 0.3, 1250, second);
    expect(second.exactTotal).toBe('2.16');
    expect(third).toEqual({ total: 9000, compensation: 0, wholeGranted: 9, exactTotal: '9000' });
  });

  it.each([[NaN, 1], [0, Infinity], [-Infinity, 1], [1, 1], [2, 1]])(
    'does not integrate invalid/nonpositive boundary interval %s → %s', (from, to) => {
      const before = createManaRecoveryIntegral(0.5, -0.001);
      expect(integrateManaRecoveryBetween(7.2, from, to, before)).toEqual(before);
    });

  it('preserves an exact mixed-scale remainder across helper export and battle reseeding', () => {
    const first = integrateManaRecovery(4.16, 17);
    const carry = exportManaRecoveryCarry(first);
    expect(carry.manaRegenExactCarry).toBe('0.07072');
    const elapsed = Number('129.0666666666667');
    expect(elapsed.toString()).toBe('129.0666666666667');
    const second = integrateManaRecovery(7.2, elapsed,
      createManaRecoveryIntegral(carry.manaRegenCarry, carry.manaRegenCompensation, carry.manaRegenExactCarry));
    expect(second.wholeGranted).toBe(1);
    expect(second.exactTotal).toBe('1000.00000000000024');
    expect(exportManaRecoveryCarry(second)).toEqual({ manaRegenCarry: 2.4e-16,
      manaRegenCompensation: 0, manaRegenExactCarry: '0.00000000000000024' });
    expect(JSON.parse(JSON.stringify(second))).toEqual(second);
  });

  it('integrates the represented shortest decimal when an input spelling rounds down', () => {
    const elapsed = Number('129.06666666666667');
    expect(elapsed.toString()).toBe('129.06666666666666');
    const second = integrateManaRecovery(7.2, elapsed, createManaRecoveryIntegral(0.07072));
    expect(second.wholeGranted).toBe(0);
    expect(second.exactTotal).toBe('999.999999999999952');
  });

  it.each([
    ['0.070720000000000000024', -2.4e-20],
    ['0.070719999999999999976', 2.4e-20]
  ] as const)('exports numeric minus exact carry rounding for %s', (exactCarry, compensation) => {
    const carry = exportManaRecoveryCarry(createManaRecoveryIntegral(0, 0, exactCarry));
    expect(carry).toEqual({ manaRegenCarry: 0.07072,
      manaRegenCompensation: compensation, manaRegenExactCarry: exactCarry });
  });

  it('bounds the numeric compatibility carry below one without changing its exact fraction', () => {
    const carry = exportManaRecoveryCarry(createManaRecoveryIntegral(0, 0, '0.99999999999999999'));
    expect(carry).toEqual({ manaRegenCarry: 0.9999999999999999,
      manaRegenCompensation: -9e-17, manaRegenExactCarry: '0.99999999999999999' });
  });

  it.each([['numeric-only', false], ['exact-aware', true]] as const)(
    'retains near-one MP through %s export and reseeding', (_mode, withExact) => {
      const carry = exportManaRecoveryCarry(createManaRecoveryIntegral(0, 0, '0.99999999999999999'));
      const seed = createManaRecoveryIntegral(carry.manaRegenCarry, carry.manaRegenCompensation,
        withExact ? carry.manaRegenExactCarry : undefined);
      expect.soft(seed.exactTotal).toBe('999.99999999999999');
      const next = integrateManaRecovery(1, 1e-14, seed);
      expect.soft(next.wholeGranted).toBe(1);
      expect(next.exactTotal).toBe('1000');
      expect(exportManaRecoveryCarry(next).manaRegenExactCarry).toBe('0');
    });

  it('integrates exponent-form numeric inputs without quantizing their decimal product', () => {
    const integral = integrateManaRecovery(1e-7, 1e-7);
    expect(integral.exactTotal).toBe('0.00000000000001');
    expect(exportManaRecoveryCarry(integral).manaRegenExactCarry).toBe('0.00000000000000001');
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
