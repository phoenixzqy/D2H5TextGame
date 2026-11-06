import { materialCatalog, materialEconomy, type MaterialProfile } from '../../data/loaders/materials';
import type { MonsterTier } from '../combat/types';

/** Closed catalog IDs with positive safe counts; absence represents zero. */
export type MaterialLedger = Readonly<Record<string, number>>;

/** A refused material bag; callers may report refusal without hiding other faults. */
export class MaterialRewardError extends Error {}

/** Reject malformed, inherited, unknown or unsafe owned stacks at ingress. */
export function isMaterialLedger(value: unknown): value is MaterialLedger {
  if (typeof value !== 'object' || value === null || Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) return false;
  return Reflect.ownKeys(value).every(key => typeof key === 'string' && materialCatalog.has(key) &&
    Object.hasOwn(value, key) && Object.getOwnPropertyDescriptor(value, key)?.enumerable === true &&
    'value' in (Object.getOwnPropertyDescriptor(value, key) ?? {}) &&
    typeof Reflect.get(value, key) === 'number' && Number.isSafeInteger(Reflect.get(value, key)) && Reflect.get(value, key) > 0);
}

/** Plan a complete material addition, throwing before any owned input changes. */
export function mergeMaterials(...ledgers: readonly MaterialLedger[]): MaterialLedger {
  const merged: Record<string, number> = {};
  for (const ledger of ledgers) {
    if (!isMaterialLedger(ledger)) throw new MaterialRewardError('Invalid material ledger');
    for (const [id, count] of Object.entries(ledger)) {
      const sum = (merged[id] ?? 0) + count;
      if (!Number.isSafeInteger(sum)) throw new MaterialRewardError('Material stack overflow');
      merged[id] = sum;
    }
  }
  return merged;
}

/** Complete acquisition authority; tier controls high runes and gem quality. */
export interface MaterialContext extends MaterialProfile {
  readonly tier: MonsterTier;
}

function weightedIdentity(entries: readonly (readonly [string, number])[], unit: number): string {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (!(total > 0) || !Number.isSafeInteger(total)) throw new MaterialRewardError('Empty or invalid material pool');
  let remaining = unit * total;
  for (const [id, weight] of entries) {
    if (weight <= 0) continue;
    if (remaining < weight) return id;
    remaining -= weight;
  }
  const last = entries.filter(([, weight]) => weight > 0).at(-1);
  if (!last) throw new MaterialRewardError('Empty material pool');
  return last[0];
}

/** Inclusive canonical ordinals for a separately authored forced rune pool. */
export interface RuneOrdinalBand {
  readonly minimum: number;
  readonly maximum: number;
}

/** Sample a concrete ID without consuming RNG; optional rune bands retain all caps. */
export function sampleMaterial(kind: 'rune' | 'gem', context: MaterialContext, unit: number, band?: RuneOrdinalBand): string {
  if (!Number.isFinite(unit) || unit < 0 || unit >= 1) throw new MaterialRewardError('Invalid material variate');
  const config = materialEconomy;
  if (band && (kind !== 'rune' || !Number.isSafeInteger(band.minimum) || !Number.isSafeInteger(band.maximum) ||
    band.minimum < 1 || band.maximum > config.runeOrder.length || band.minimum > band.maximum)) {
    throw new MaterialRewardError('Invalid rune ordinal band');
  }
  const profile = config.profiles[`act${String(context.act)}-${context.difficulty}`];
  if (!profile || !Object.hasOwn(config.gemQualityWeights, context.tier)) throw new MaterialRewardError('Invalid material context');
  if (kind === 'rune') {
    const actCap = config.actRuneCaps[profile.act - 1];
    if (actCap === undefined) throw new MaterialRewardError('Missing material act cap');
    const cap = Math.min(actCap, band?.maximum ?? config.runeOrder.length,
      profile.difficulty === 'hell' ? config.runeOrder.length : config.nonHellRuneCap,
      config.highRuneAllowedTiers.includes(context.tier) ? config.runeOrder.length : config.highRuneMinOrdinal - 1);
    return weightedIdentity(config.runeOrder.map((id, index) => [id, config.runeWeights[index] ?? 0] as const)
      .slice((band?.minimum ?? 1) - 1, cap), unit);
  }
  const actCap = config.actGemCaps[profile.act - 1];
  if (actCap === undefined) throw new MaterialRewardError('Missing material act cap');
  const cap = Math.min(actCap, profile.difficulty === 'hell' ? config.gemQualities.length - 1 : config.nonHellGemCap);
  const weights = config.gemQualities.map(() => 0);
  config.gemQualityWeights[context.tier].forEach((weight, index) => {
    const quality = Math.min(index, cap);
    weights[quality] = (weights[quality] ?? 0) + weight;
  });
  return weightedIdentity(config.gemTypes.flatMap(type => config.gemQualities.map((quality, index) =>
    [`gems/${type}/${quality}`, weights[index] ?? 0] as const)), unit);
}
