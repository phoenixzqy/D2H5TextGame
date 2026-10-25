import type { CombatUnit } from '../combat/types';
import { restoreLifeCapacityLayer } from '../combat/life-capacity';

/** Add one floored temporary Vigor bonus over the fresh maximum, never over a prior bonus. */
export function vigorLifeMax(base: number, bonus: number): number {
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(bonus) || bonus < 0) return base;
  const result = base + Math.floor(base * bonus);
  return Number.isFinite(result) ? result : base;
}

/** Restore an exact carried Vigor base before fresh composition, preserving absolute HP for the new cap. */
export function withoutVigorLife(unit: CombatUnit): CombatUnit {
  return restoreLifeCapacityLayer(unit, 'vigorLife');
}
