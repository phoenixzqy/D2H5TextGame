/**
 * Affix rolling for magic/rare items.
 *
 * Source: docs/design/items-spec.md §4–§5 (affix tiers); §11 (drop pipeline step 3).
 *
 * Affixes are JSON-defined; the engine just picks `n` of them by weight and
 * rolls each affix's value-range to a concrete integer.
 *
 * @module engine/loot/affix-roll
 */

import type { Rng } from '../rng';
import type { Rarity } from '../types/items';
import type { AffixRoll } from '../types/items';

/** A single tier of an affix's value range, gated by ilvl. */
export interface AffixTier {
  readonly minIlvl: number;
  /** Per-property [min, max] roll bounds. */
  readonly values: ReadonlyMap<string, readonly [number, number]>;
}

/** Engine-side affix template. */
export interface AffixTemplate {
  readonly id: string;
  readonly kind: 'prefix' | 'suffix';
  /** Slots this affix is allowed on (e.g. ['weapon','helm']). Empty = all slots. */
  readonly slots: readonly string[];
  /** Spawn weight at roll time. */
  readonly weight: number;
  readonly tiers: readonly AffixTier[];
}

/** How many affixes per rarity. */
function affixCounts(rarity: Rarity, rng: Rng): { prefix: number; suffix: number } {
  switch (rarity) {
    case 'magic':
      return { prefix: rng.chance(0.5) ? 1 : 0, suffix: rng.chance(0.5) ? 1 : 0 };
    case 'rare':
      // 3..6 affixes split into ≤3 prefix + ≤3 suffix
      return { prefix: rng.nextInt(1, 3), suffix: rng.nextInt(1, 3) };
    default:
      return { prefix: 0, suffix: 0 };
  }
}

/** Pick the highest-tier affix-tier whose minIlvl ≤ ilvl. */
function selectTier(template: AffixTemplate, ilvl: number): AffixTier | undefined {
  let best: AffixTier | undefined;
  for (const t of template.tiers) {
    if (t.minIlvl <= ilvl) {
      if (!best || t.minIlvl > best.minIlvl) best = t;
    }
  }
  return best;
}

/** Roll a single concrete value-set for an affix at a given ilvl. */
function rollAffix(template: AffixTemplate, ilvl: number, rng: Rng): AffixRoll | undefined {
  const tier = selectTier(template, ilvl);
  if (!tier) return undefined;
  const values = new Map<string, number>();
  for (const [k, range] of tier.values) {
    values.set(k, rng.nextInt(range[0], range[1]));
  }
  return { affixId: template.id, values };
}

/** Pick one template by weight from a pool. */
function pickWeighted(
  pool: readonly AffixTemplate[],
  rng: Rng
): AffixTemplate | undefined {
  if (pool.length === 0) return undefined;
  const total = pool.reduce((s, p) => s + p.weight, 0);
  if (total <= 0) return undefined;
  let roll = rng.next() * total;
  for (const p of pool) {
    roll -= p.weight;
    if (roll <= 0) return p;
  }
  return pool[pool.length - 1];
}

/**
 * Roll the affix list for an item of the given rarity / ilvl / slot.
 * Affixes are drawn without replacement (same affix won't appear twice).
 */
export function rollAffixes(
  rarity: Rarity,
  ilvl: number,
  slot: string,
  pool: readonly AffixTemplate[],
  rng: Rng
): readonly AffixRoll[] {
  if (rarity !== 'magic' && rarity !== 'rare') return [];
  const counts = affixCounts(rarity, rng);

  const eligible = pool.filter(
    (a) => a.slots.length === 0 || a.slots.includes(slot)
  );
  const remaining = [...eligible];
  const picked: AffixRoll[] = [];

  function takeOne(kind: 'prefix' | 'suffix'): void {
    const sub = remaining.filter((a) => a.kind === kind);
    const t = pickWeighted(sub, rng);
    if (!t) return;
    const roll = rollAffix(t, ilvl, rng);
    if (roll) picked.push(roll);
    const idx = remaining.findIndex((a) => a.id === t.id);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  for (let i = 0; i < counts.prefix; i++) takeOne('prefix');
  for (let i = 0; i < counts.suffix; i++) takeOne('suffix');

  return picked;
}
