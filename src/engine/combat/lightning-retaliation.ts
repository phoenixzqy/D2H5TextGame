/** Transient authored receiving-hit reaction; never saved or inferred from skills. */
export interface LightningRetaliation {
  readonly chance: number;
  readonly damage: readonly [number, number];
}

/** Validate at the native boundary and copy independently before any factory RNG. */
export function copyLightningRetaliation(value: unknown): LightningRetaliation | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
    Object.keys(value).length !== 2 || !('chance' in value) || !('damage' in value) ||
    typeof value.chance !== 'number' || !Number.isFinite(value.chance) || value.chance < 0 || value.chance > 1 ||
    !Array.isArray(value.damage) || value.damage.length !== 2 ||
    !value.damage.every((n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0))
    throw new RangeError('Invalid Lightning retaliation');
  const min: unknown = value.damage[0], max: unknown = value.damage[1];
  if (typeof min !== 'number' || typeof max !== 'number' || min > max)
    throw new RangeError('Invalid Lightning retaliation damage range');
  return Object.freeze({ chance: value.chance, damage: Object.freeze([min, max] as const) });
}
