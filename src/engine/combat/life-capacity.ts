import type { CombatUnit } from './types';
import { integrateManaRecoveryWithContributionBetween } from './mana-recovery';

/** One exact authored percentage contribution over the common fresh capacity. */
export interface LifeCapacityBonus {
  readonly coefficient: number;
  readonly rank: number;
}
type Layer = 'vigorLife' | 'druidFormLife';
/** Restore one verified transient baseline without prematurely clamping absolute HP. */
export function restoreLifeCapacityLayer(unit: CombatUnit, key: Layer): CombatUnit {
  if (unit[key] === undefined) return unit;
  const { [key]: layer, ...base } = unit;
  const value: unknown = layer;
  if (
    typeof value !== 'object' ||
    value === null ||
    Object.keys(value).length !== 2 ||
    !('baseLifeMax' in value) ||
    !('appliedLifeMax' in value)
  )
    return base;
  return typeof value.baseLifeMax === 'number' &&
    Number.isFinite(value.baseLifeMax) &&
    value.baseLifeMax > 0 &&
    typeof value.appliedLifeMax === 'number' &&
    Number.isFinite(value.appliedLifeMax) &&
    value.appliedLifeMax >= value.baseLifeMax &&
    unit.stats.lifeMax === value.appliedLifeMax
    ? { ...base, stats: { ...base.stats, lifeMax: value.baseLifeMax } }
    : base;
}
/** Ambient capacity wraps form capacity; remove outer then inner before any fresh projection. */
export function withoutTemporaryLifeCapacity(unit: CombatUnit): CombatUnit {
  return restoreLifeCapacityLayer(restoreLifeCapacityLayer(unit, 'vigorLife'), 'druidFormLife');
}
/** Floor the exact decimal product once, independently of floating-point multiplication order. */
export function lifeCapacityContribution(base: number, bonus: LifeCapacityBonus): number {
  return integrateManaRecoveryWithContributionBetween(
    0,
    { sourceBaselinePerSecond: base, factors: [bonus.coefficient, bonus.rank] },
    0,
    1000
  ).wholeGranted;
}
/**
 * Settle form and ambient capacity over one fresh baseline. Preserve legacy transient
 * transport fields, but never multiply bonuses or clamp HP before the final cap.
 */
export function projectLifeCapacity(
  unit: CombatUnit,
  form?: LifeCapacityBonus,
  ambient: readonly LifeCapacityBonus[] = []
): CombatUnit {
  const base = withoutTemporaryLifeCapacity(unit),
    original = base.stats.lifeMax;
  if (!Number.isFinite(original) || original <= 0 || !Number.isFinite(base.life)) return base;
  const formLife = form ? lifeCapacityContribution(original, form) : 0;
  const ambientLife = ambient.reduce(
    (sum, bonus) => sum + lifeCapacityContribution(original, bonus),
    0
  );
  const shaped = original + formLife,
    lifeMax = shaped + ambientLife;
  if (!Number.isFinite(lifeMax) || lifeMax <= 0) return base;
  return {
    ...base,
    stats: { ...base.stats, lifeMax },
    life: Math.min(base.life, lifeMax),
    ...(form
      ? { druidFormLife: Object.freeze({ baseLifeMax: original, appliedLifeMax: shaped }) }
      : {}),
    ...(ambientLife > 0
      ? { vigorLife: Object.freeze({ baseLifeMax: shaped, appliedLifeMax: lifeMax }) }
      : {})
  };
}
