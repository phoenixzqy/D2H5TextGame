/** Battle-local MP-millisecond integral; its canonical decimal string is authoritative. */
export interface ManaRecoveryIntegral {
  readonly total: number;
  /** Signed numeric rounding difference: total minus exactTotal. */
  readonly compensation: number;
  readonly wholeGranted: number;
  readonly exactTotal: string;
}

interface Decimal {
  readonly coefficient: bigint;
  readonly scale: number;
}

function normalize(coefficient: bigint, scale: number): Decimal {
  if (coefficient === 0n) return { coefficient: 0n, scale: 0 };
  while (scale > 0 && coefficient % 10n === 0n) {
    coefficient /= 10n;
    scale--;
  }
  return { coefficient, scale };
}

/** Parse trusted internal strings and Number.toString(), including exponent notation. */
function decimal(value: string): Decimal {
  const [mantissa = '0', exponent = '0'] = value.toLowerCase().split('e');
  const [whole = '0', fraction = ''] = mantissa.split('.');
  const coefficient = BigInt(whole + fraction);
  const scale = fraction.length - Number(exponent);
  return scale < 0 ? { coefficient: coefficient * 10n ** BigInt(-scale), scale: 0 } :
    normalize(coefficient, scale);
}

function text(value: Decimal): string {
  if (value.scale === 0) return value.coefficient.toString();
  const negative = value.coefficient < 0n;
  const digits = (negative ? -value.coefficient : value.coefficient).toString().padStart(value.scale + 1, '0');
  const split = digits.length - value.scale;
  return `${negative ? '-' : ''}${digits.slice(0, split)}.${digits.slice(split)}`;
}

function add(left: Decimal, right: Decimal, sign = 1n): Decimal {
  const scale = Math.max(left.scale, right.scale);
  return normalize(left.coefficient * 10n ** BigInt(scale - left.scale) +
    sign * right.coefficient * 10n ** BigInt(scale - right.scale), scale);
}

function multiply(left: Decimal, right: Decimal): Decimal {
  return normalize(left.coefficient * right.coefficient, left.scale + right.scale);
}

/** Mathematical floor, including negative operands rather than BigInt truncation. */
function wholeMP(value: Decimal): bigint {
  const divisor = 10n ** BigInt(value.scale + 3);
  const quotient = value.coefficient / divisor;
  return value.coefficient < 0n && value.coefficient % divisor !== 0n ? quotient - 1n : quotient;
}

function roundingDifference(high: number, exact: Decimal): number {
  if (!Number.isFinite(high)) return high;
  const difference = Number(text(add(decimal(high.toString()), exact, -1n)));
  return difference === 0 ? 0 : difference;
}

function integral(exact: Decimal, high = Number(text(exact))): ManaRecoveryIntegral {
  return {
    total: high,
    compensation: roundingDifference(high, exact),
    wholeGranted: Number(wholeMP(exact)),
    exactTotal: text(exact)
  };
}

/**
 * Seed fractional MP from canonical exact carry, or qualified legacy carry minus
 * signed compensation. Foreign exact carry is bounded; generated totals are not.
 */
export function createManaRecoveryIntegral(carry = 0, compensation = 0, exactCarry?: string): ManaRecoveryIntegral {
  if (typeof exactCarry === 'string' && exactCarry.length <= 2048 && exactCarry.trim() === exactCarry &&
    /^(?:0|0\.[0-9]*[1-9])$/.test(exactCarry)) {
    return integral(multiply(decimal(exactCarry), decimal('1000')));
  }
  const qualifiedCarry = Number.isFinite(carry) && carry >= 0 && carry < 1 ? carry : 0;
  const qualifiedCompensation = Number.isFinite(compensation) ? compensation : 0;
  const credit = add(decimal(qualifiedCarry.toString()), decimal(qualifiedCompensation.toString()), -1n);
  if (credit.coefficient < 0n || credit.coefficient >= 10n ** BigInt(credit.scale)) {
    return integral(decimal('0'));
  }
  return integral(multiply(credit, decimal('1000')), qualifiedCarry * 1000);
}

/** Integrate shortest decimal Number inputs without rounding their product or sum. */
export function integrateManaRecovery(
  ratePerSecond: number,
  elapsedMs: number,
  previous: ManaRecoveryIntegral = createManaRecoveryIntegral()
): ManaRecoveryIntegral {
  if (!Number.isFinite(ratePerSecond) || ratePerSecond <= 0 ||
    !Number.isFinite(elapsedMs) || elapsedMs <= 0) return previous;
  return integral(add(decimal(previous.exactTotal),
    multiply(decimal(ratePerSecond.toString()), decimal(elapsedMs.toString()))));
}

/** Subtract exact decimal simulation endpoints before multiplying the interval. */
export function integrateManaRecoveryBetween(
  ratePerSecond: number,
  fromMs: number,
  toMs: number,
  previous: ManaRecoveryIntegral = createManaRecoveryIntegral()
): ManaRecoveryIntegral {
  if (!Number.isFinite(ratePerSecond) || ratePerSecond <= 0 || !Number.isFinite(fromMs) ||
    !Number.isFinite(toMs) || toMs <= fromMs) return previous;
  const elapsed = add(decimal(toMs.toString()), decimal(fromMs.toString()), -1n);
  return integral(add(decimal(previous.exactTotal), multiply(decimal(ratePerSecond.toString()), elapsed)));
}

/** Export only fractional MP; BigInt coefficients never leave these calculations. */
export function exportManaRecoveryCarry(value: ManaRecoveryIntegral): {
  readonly manaRegenCarry: number;
  readonly manaRegenCompensation: number;
  readonly manaRegenExactCarry: string;
} {
  const exact = decimal(value.exactTotal);
  const remainder = add(exact, { coefficient: wholeMP(exact) * 1000n, scale: 0 }, -1n);
  const carry = normalize(remainder.coefficient, remainder.scale + 3);
  // A fraction rounded to one still needs a qualified numeric compatibility seed.
  const numericCarry = Math.min(Number(text(carry)), 0.9999999999999999);
  return {
    manaRegenCarry: numericCarry,
    manaRegenCompensation: roundingDifference(numericCarry, carry),
    manaRegenExactCarry: text(carry)
  };
}
