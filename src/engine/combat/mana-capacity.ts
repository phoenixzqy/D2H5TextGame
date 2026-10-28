import type { CombatUnit } from './types';
import { lifeCapacityContribution } from './life-capacity';

/** Remove a verified transient MP layer without prematurely clamping absolute MP. */
export function withoutTemporaryManaCapacity(unit: CombatUnit): CombatUnit {
  if (unit.manaCapacity === undefined) return unit;
  const { manaCapacity: layer, ...base } = unit;
  const value: unknown = layer;
  if (typeof value !== 'object' || value === null || Object.keys(value).length !== 2 ||
    !('baseManaMax' in value) || !('appliedManaMax' in value)) return base;
  return typeof value.baseManaMax === 'number' && Number.isFinite(value.baseManaMax) && value.baseManaMax >= 0 &&
    typeof value.appliedManaMax === 'number' && Number.isFinite(value.appliedManaMax) &&
    value.appliedManaMax >= value.baseManaMax && unit.stats.manaMax === value.appliedManaMax
    ? { ...base, stats: { ...base.stats, manaMax: value.baseManaMax } } : base;
}

/** Settle the final cap and exported recovery carry without granting resources. */
export function settleManaCapacity(unit: CombatUnit): CombatUnit {
  if (!Number.isFinite(unit.mana) || !Number.isFinite(unit.stats.manaMax) || unit.stats.manaMax < 0) return unit;
  const mana = Math.min(unit.mana, unit.stats.manaMax);
  return { ...unit, mana, ...(mana >= unit.stats.manaMax ? {
    ...(unit.manaRegenCarry !== undefined ? { manaRegenCarry: 0 } : {}),
    ...(unit.manaRegenCompensation !== undefined ? { manaRegenCompensation: 0 } : {}),
    ...(unit.manaRegenExactCarry !== undefined ? { manaRegenExactCarry: '0' } : {})
  } : {}) };
}

/** Compose one exactly floored contribution over the fresh personal maximum; never refill. */
export function projectManaCapacity(unit: CombatUnit, coefficient = 0): CombatUnit {
  const base = withoutTemporaryManaCapacity(unit), original = base.stats.manaMax;
  if (!Number.isFinite(original) || original < 0 || !Number.isFinite(coefficient) || coefficient < 0) return base;
  const manaMax = original + lifeCapacityContribution(original, { coefficient, rank: 1 });
  if (!Number.isFinite(manaMax)) return base;
  return settleManaCapacity({ ...base, stats: { ...base.stats, manaMax },
    ...(manaMax > original ? { manaCapacity: Object.freeze({ baseManaMax: original, appliedManaMax: manaMax }) } : {}) });
}
