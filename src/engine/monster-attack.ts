/** Validate optional paired monster attack ranges at data and factory boundaries. */
export function isValidMonsterAttackProgression(def: {
  readonly attack?: unknown;
  readonly attackGrowth?: unknown;
}): boolean {
  if (def.attack === undefined && def.attackGrowth === undefined) return true;
  return validRange(def.attack) && validRange(def.attackGrowth);
}

function validRange(value: unknown): value is readonly [number, number] {
  return Array.isArray(value) && value.length === 2 &&
    value.every((endpoint: unknown) => typeof endpoint === 'number' && Number.isFinite(endpoint) && endpoint >= 0) &&
    value[0] <= value[1];
}
