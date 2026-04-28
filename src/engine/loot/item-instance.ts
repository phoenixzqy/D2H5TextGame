/**
 * Item instance generator.
 *
 * Converts a {@link DropResult} (a baseId + rarity + ilvl) into a fully
 * realised {@link Item} ready to be pushed into the inventory store. Affixes
 * for magic/rare items are rolled from a JSON-driven affix pool; uniques and
 * set items are looked up by baseId from the corresponding pools.
 *
 * Pure: takes all data as arguments. Engine-side, no I/O.
 *
 * @module engine/loot/item-instance
 */

import type { Rng } from '../rng';
import type { Item, AffixRoll, Rarity, ItemBase } from '../types/items';
import type { DropResult } from './drop-roller';

/**
 * Slim affix shape we accept from the JSON pool. Mirrors the structure used
 * by `src/data/items/affixes-{prefix,suffix}.json` without coupling to it.
 */
export interface JsonAffix {
  readonly id: string;
  readonly name: string;
  readonly type: 'prefix' | 'suffix';
  readonly minIlvl: number;
  readonly coreStats?: Readonly<Record<string, number>>;
  readonly resistances?: Readonly<Record<string, number>>;
  readonly statMods?: Readonly<Record<string, number>>;
  readonly damageBonus?: {
    readonly min?: number;
    readonly max?: number;
    readonly breakdown?: Readonly<Record<string, number>>;
  };
}

/** Slim unique-item shape from `src/data/items/uniques.json`. */
export interface JsonUnique {
  readonly id: string;
  readonly name: string;
  readonly baseId: string;
  readonly reqLevel: number;
}

/** Slim set-item shape from `src/data/items/sets.json` (per-piece, not the set itself). */
export interface JsonSetPiece {
  readonly id: string;
  readonly setId: string;
  readonly baseId: string;
}

/** Inputs needed to materialise an item drop into a concrete Item. */
export interface ItemDataPools {
  readonly bases: ReadonlyMap<string, ItemBase>;
  readonly affixes: readonly JsonAffix[];
  readonly uniques: readonly JsonUnique[];
  readonly setPieces: readonly JsonSetPiece[];
}

/**
 * Increment-only id counter, derived from rng state to keep determinism.
 * Each generated item gets a stable id when given the same seed.
 */
let __itemSeq = 0;
function nextId(rng: Rng): string {
  __itemSeq = (__itemSeq + 1) >>> 0;
  return `it-${rng.nextInt(0, 0xffffff).toString(36)}-${__itemSeq.toString(36)}`;
}

/** Reset the internal id counter — test-only escape hatch. @internal */
export function __resetItemSeqForTests(): void {
  __itemSeq = 0;
}

/** Roll one numeric in the JSON `damageBonus` range, defaulting to 0. */
function rollDamageBonus(a: JsonAffix, rng: Rng): number {
  const b = a.damageBonus;
  if (!b) return 0;
  const lo = b.min ?? 0;
  const hi = b.max ?? lo;
  return hi <= lo ? lo : rng.nextInt(lo, hi);
}

/**
 * Convert a JSON affix into an {@link AffixRoll} by rolling each numeric
 * field once. Values are flattened into a single map keyed by stat path.
 */
function rollJsonAffix(a: JsonAffix, rng: Rng): AffixRoll {
  const values = new Map<string, number>();
  if (a.coreStats) for (const [k, v] of Object.entries(a.coreStats)) values.set(`coreStats.${k}`, v);
  if (a.resistances) for (const [k, v] of Object.entries(a.resistances)) values.set(`resistances.${k}`, v);
  if (a.statMods) for (const [k, v] of Object.entries(a.statMods)) values.set(`statMods.${k}`, v);
  if (a.damageBonus) {
    const rolled = rollDamageBonus(a, rng);
    values.set('damageBonus.value', rolled);
    if (a.damageBonus.breakdown) {
      for (const [k, v] of Object.entries(a.damageBonus.breakdown)) {
        values.set(`damageBonus.${k}`, v);
      }
    }
  }
  return { affixId: a.id, values };
}

/** Per-rarity affix counts. Mirrors `data/items/rarity-rules.json` defaults. */
const AFFIX_COUNTS: Readonly<Record<Rarity, { prefix: [number, number]; suffix: [number, number] }>> = {
  normal: { prefix: [0, 0], suffix: [0, 0] },
  magic: { prefix: [0, 1], suffix: [0, 1] },
  rare: { prefix: [1, 3], suffix: [1, 3] },
  unique: { prefix: [0, 0], suffix: [0, 0] },
  set: { prefix: [0, 0], suffix: [0, 0] },
  runeword: { prefix: [0, 0], suffix: [0, 0] }
};

/** Pick `n` affixes from `pool` without replacement, using weighted equal weights. */
function pickAffixes(
  pool: readonly JsonAffix[],
  n: number,
  ilvl: number,
  kind: 'prefix' | 'suffix',
  rng: Rng
): JsonAffix[] {
  const eligible = pool.filter((a) => a.type === kind && a.minIlvl <= ilvl);
  const out: JsonAffix[] = [];
  const remaining = [...eligible];
  for (let i = 0; i < n && remaining.length > 0; i++) {
    const idx = rng.nextInt(0, remaining.length - 1);
    const picked = remaining[idx];
    if (!picked) break;
    out.push(picked);
    remaining.splice(idx, 1);
  }
  return out;
}

/**
 * Materialise a single drop into an {@link Item}. Returns `undefined` if the
 * drop's baseId isn't in `pools.bases` (defensive — caller filters earlier).
 */
export function generateItem(
  drop: DropResult,
  pools: ItemDataPools,
  rng: Rng
): Item | undefined {
  const base = pools.bases.get(drop.baseId);
  if (!base) return undefined;

  // Resolve special rarities — fall back to magic when no eligible template.
  let rarity: Rarity = drop.rarity;
  let uniqueId: string | undefined;
  let setId: string | undefined;

  if (rarity === 'unique') {
    const eligible = pools.uniques.filter(
      (u) => u.baseId === base.id && u.reqLevel <= drop.ilvl + 5
    );
    if (eligible.length > 0) {
      uniqueId = eligible[rng.nextInt(0, eligible.length - 1)]?.id;
    } else {
      rarity = 'rare';
    }
  } else if (rarity === 'set') {
    const eligible = pools.setPieces.filter((s) => s.baseId === base.id);
    if (eligible.length > 0) {
      const picked = eligible[rng.nextInt(0, eligible.length - 1)];
      setId = picked?.setId;
    } else {
      rarity = 'rare';
    }
  }

  const counts = AFFIX_COUNTS[rarity];
  const nPrefix = rng.nextInt(counts.prefix[0], counts.prefix[1]);
  const nSuffix = rng.nextInt(counts.suffix[0], counts.suffix[1]);
  const prefixes = pickAffixes(pools.affixes, nPrefix, drop.ilvl, 'prefix', rng);
  const suffixes = pickAffixes(pools.affixes, nSuffix, drop.ilvl, 'suffix', rng);
  const affixes: AffixRoll[] = [...prefixes, ...suffixes].map((a) => rollJsonAffix(a, rng));

  const item: Item = {
    id: nextId(rng),
    baseId: base.id,
    rarity,
    level: drop.ilvl,
    identified: rarity === 'normal' || rarity === 'magic',
    equipped: false,
    ...(affixes.length > 0 ? { affixes } : {}),
    ...(uniqueId ? { uniqueId } : {}),
    ...(setId ? { setId } : {})
  };
  return item;
}
