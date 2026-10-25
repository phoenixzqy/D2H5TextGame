import type { CombatUnit } from '../combat/types';

/** Add one floored temporary Vigor bonus over the fresh maximum, never over a prior bonus. */
export function vigorLifeMax(base: number, bonus: number): number {
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(bonus) || bonus < 0) return base;
  const result = base + Math.floor(base * bonus);
  return Number.isFinite(result) ? result : base;
}

/** Restore an exact carried Vigor base before fresh composition, preserving absolute HP for the new cap. */
export function withoutVigorLife(unit: CombatUnit): CombatUnit {
  if (unit.vigorLife === undefined) return unit;
  const { vigorLife: carried, ...base } = unit;
  const vigorLife: unknown = carried;
  if (typeof vigorLife !== 'object' || vigorLife === null || Object.keys(vigorLife).length !== 2 ||
    !('baseLifeMax' in vigorLife) || !('appliedLifeMax' in vigorLife)) return base;
  const { baseLifeMax, appliedLifeMax } = vigorLife;
  if (typeof baseLifeMax !== 'number' || !Number.isFinite(baseLifeMax) || baseLifeMax <= 0 ||
    typeof appliedLifeMax !== 'number' || !Number.isFinite(appliedLifeMax) || appliedLifeMax < baseLifeMax ||
    unit.stats.lifeMax !== appliedLifeMax) return base;
  return { ...base, stats: { ...base.stats, lifeMax: baseLifeMax } };
}
