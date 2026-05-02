import type { Rng } from '../rng';
import type { ItemBonusStats, ItemStatRollValue } from '../types/items';

export interface ResolvedStatValue {
  readonly path: string;
  readonly value: number;
  readonly rollId?: string;
}

function isRollRange(value: ItemStatRollValue): value is Exclude<ItemStatRollValue, number> {
  return typeof value === 'object';
}

function rollValue(value: ItemStatRollValue, statRolls: Record<string, number>, rng: Rng): number {
  if (typeof value === 'number') return value;
  const existing = statRolls[value.roll];
  if (typeof existing === 'number') return existing;
  const step = value.step ?? 1;
  const minStep = Math.ceil(value.min / step);
  const maxStep = Math.floor(value.max / step);
  const rolled = rng.nextInt(minStep, maxStep) * step;
  statRolls[value.roll] = rolled;
  return rolled;
}

function resolveValue(value: ItemStatRollValue, statRolls: Readonly<Record<string, number>>): number {
  if (typeof value === 'number') return value;
  return statRolls[value.roll] ?? value.min;
}

function walkStats(
  stats: ItemBonusStats | undefined,
  readValue: (value: ItemStatRollValue) => number
): ResolvedStatValue[] {
  if (!stats) return [];
  const out: ResolvedStatValue[] = [];
  const pushResolved = (path: string, value: ItemStatRollValue) => {
    const resolved: ResolvedStatValue = { path, value: readValue(value) };
    if (isRollRange(value)) {
      out.push({ ...resolved, rollId: value.roll });
    } else {
      out.push(resolved);
    }
  };
  const pushGroup = (group: string, values: Readonly<Record<string, ItemStatRollValue>> | undefined) => {
    if (!values) return;
    for (const [key, value] of Object.entries(values)) {
      pushResolved(`${group}.${key}`, value);
    }
  };

  pushGroup('coreStats', stats.coreStats);
  pushGroup('resistances', stats.resistances);
  pushGroup('statMods', stats.statMods);
  if (stats.damageBonus) {
    const { min, max, value, breakdown } = stats.damageBonus;
    if (min !== undefined) pushResolved('damageBonus.min', min);
    if (max !== undefined) pushResolved('damageBonus.max', max);
    if (value !== undefined) pushResolved('damageBonus.value', value);
    if (breakdown) {
      for (const [type, entry] of Object.entries(breakdown)) {
        pushResolved(`damageBonus.breakdown.${type}`, entry);
      }
    }
  }
  return out;
}

export function rollStatPackage(
  stats: ItemBonusStats | undefined,
  rng: Rng,
  existingRolls: Readonly<Record<string, number>> = {}
): { readonly statRolls: Readonly<Record<string, number>>; readonly modifiers: readonly ResolvedStatValue[] } {
  const statRolls: Record<string, number> = { ...existingRolls };
  const modifiers = walkStats(stats, (value) => rollValue(value, statRolls, rng));
  return { statRolls, modifiers };
}

export function resolveStatPackage(
  stats: ItemBonusStats | undefined,
  statRolls: Readonly<Record<string, number>> = {}
): readonly ResolvedStatValue[] {
  return walkStats(stats, (value) => resolveValue(value, statRolls));
}
