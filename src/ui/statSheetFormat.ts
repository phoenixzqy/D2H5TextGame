/**
 * Pure value/delta formatters used by `<StatSheet>` and `<ItemCompareTooltip>`.
 *
 * Kept React-free so we can unit-test sign + color class logic without a
 * DOM. See `statSheetFormat.test.ts`.
 *
 * Per-stat metadata (`STAT_META`) lets us mark stats as "lower is better"
 * if the engine ever introduces one (e.g. cooldowns, attack interval). All
 * current comparable stats are higher-is-better.
 */
import type { ComparableStatKey } from '@/features/inventory/compareEquip';
import type { Resistances } from '@/engine/types/attributes';

export type StatFormat = 'int' | 'percent' | 'mult';

export interface StatMeta {
  readonly key: ComparableStatKey;
  readonly format: StatFormat;
  readonly higherIsBetter: boolean;
}

export const STAT_META: Readonly<Record<ComparableStatKey, StatMeta>> = {
  lifeMax: { key: 'lifeMax', format: 'int', higherIsBetter: true },
  manaMax: { key: 'manaMax', format: 'int', higherIsBetter: true },
  attack: { key: 'attack', format: 'int', higherIsBetter: true },
  defense: { key: 'defense', format: 'int', higherIsBetter: true },
  attackSpeed: { key: 'attackSpeed', format: 'int', higherIsBetter: true },
  critChance: { key: 'critChance', format: 'percent', higherIsBetter: true },
  critDamage: { key: 'critDamage', format: 'mult', higherIsBetter: true },
  physDodge: { key: 'physDodge', format: 'percent', higherIsBetter: true },
  magicDodge: { key: 'magicDodge', format: 'percent', higherIsBetter: true }
};

export const RESIST_KEYS: readonly (keyof Resistances)[] = [
  'fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'
];

/** Format a stat scalar in its canonical display form (no sign). */
export function formatStatValue(format: StatFormat, n: number): string {
  switch (format) {
    case 'percent':
      return `${(n * 100).toFixed(1)}%`;
    case 'mult':
      return `${n.toFixed(2)}×`;
    case 'int':
    default:
      return String(Math.round(n));
  }
}

/**
 * Format a delta with explicit sign. Returns `''` when delta is exactly 0
 * so callers can omit the parens entirely.
 */
export function formatStatDelta(format: StatFormat, d: number): string {
  if (d === 0) return '';
  const sign = d > 0 ? '+' : '-';
  const mag = Math.abs(d);
  switch (format) {
    case 'percent':
      return `${sign}${(mag * 100).toFixed(1)}%`;
    case 'mult':
      return `${sign}${mag.toFixed(2)}×`;
    case 'int':
    default:
      return `${sign}${String(Math.round(mag))}`;
  }
}

/**
 * Tailwind text-color class for a delta given orientation.
 *
 * - delta === 0 → muted gray (no UI noise)
 * - improvement → emerald
 * - regression  → rose
 */
export function deltaColorClass(delta: number, higherIsBetter: boolean): string {
  if (delta === 0) return 'text-d2-white/40';
  const isImprovement = higherIsBetter ? delta > 0 : delta < 0;
  return isImprovement ? 'text-emerald-400' : 'text-rose-400';
}

/**
 * Trend token for non-color a11y affordance. Used as `data-trend` attr on
 * the delta cell so screen-readers and CSS can target trend without relying
 * on color (WCAG 1.4.1).
 *
 * - delta === 0 → 'flat'
 * - improvement → 'up'
 * - regression  → 'down'
 *
 * `higherIsBetter` flips up/down so a "lower-is-better" stat (e.g. cooldown,
 * if introduced) still maps regression→'down' visually.
 */
export function deltaTrend(
  delta: number,
  higherIsBetter: boolean
): 'up' | 'down' | 'flat' {
  if (delta === 0) return 'flat';
  const isImprovement = higherIsBetter ? delta > 0 : delta < 0;
  return isImprovement ? 'up' : 'down';
}

/** Unicode arrow for the delta cell — paired with `data-trend` for non-color signal. */
export function deltaArrow(delta: number): string {
  if (delta > 0) return '↑';
  if (delta < 0) return '↓';
  return '';
}

/** Resistance integer formatting (engine stores resists as whole percent). */
export function formatResistValue(n: number): string {
  return `${String(Math.round(n))}%`;
}

export function formatResistDelta(d: number): string {
  if (d === 0) return '';
  const sign = d > 0 ? '+' : '-';
  return `${sign}${String(Math.round(Math.abs(d)))}%`;
}
