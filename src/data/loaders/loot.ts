/**
 * Loot data loaders — translate JSON into engine types.
 *
 * Lives in `src/data/` so engine modules can stay JSON-agnostic. Cached
 * after first call.
 *
 * @module data/loaders/loot
 */

import type { Affix, Item, ItemBase, SetDef } from '@/engine/types/items';
import type { TreasureClass, TcPick } from '@/engine/loot/drop-roller';
import type { JsonUnique, JsonSetPiece } from '@/engine/loot/item-instance';
import type { RarityAffixCount, RarityAffixRules } from '@/engine/loot/rollItem';
import type { AwardDataPools } from '@/engine/loot/award';

import basesJson from '@/data/items/bases.json';
import affixPrefixJson from '@/data/items/affixes-prefix.json';
import affixSuffixJson from '@/data/items/affixes-suffix.json';
import uniquesJson from '@/data/items/uniques.json';
import setsJson from '@/data/items/sets.json';
import treasureClassesJson from '@/data/loot/treasure-classes.json';
import rarityRulesJson from '@/data/items/rarity-rules.json';

interface JsonTcEntry {
  readonly type: string;
  readonly itemBase: string;
  readonly weight: number;
  readonly minLevel: number;
  readonly maxLevel: number;
}
interface JsonTreasureClass {
  readonly id: string;
  readonly name?: string;
  readonly entries: readonly JsonTcEntry[];
}

let cachedBases: ReadonlyMap<string, ItemBase> | null = null;
let cachedAffixes: readonly Affix[] | null = null;
let cachedUniques: readonly JsonUnique[] | null = null;
let cachedSetPieces: readonly JsonSetPiece[] | null = null;
let cachedSets: readonly SetDef[] | null = null;
let cachedTcs: ReadonlyMap<string, TreasureClass> | null = null;
let cachedRarityRules: RarityAffixRules | null = null;

/** Item base map keyed by id. */
export function loadItemBases(): ReadonlyMap<string, ItemBase> {
  if (cachedBases) return cachedBases;
  const map = new Map<string, ItemBase>();
  for (const b of basesJson as readonly ItemBase[]) map.set(b.id, b);
  cachedBases = map;
  return map;
}

/** Combined prefix + suffix affix pool. */
export function loadAffixPool(): readonly Affix[] {
  if (cachedAffixes) return cachedAffixes;
  const pool: Affix[] = [
    ...(affixPrefixJson as readonly Affix[]),
    ...(affixSuffixJson as readonly Affix[])
  ];
  cachedAffixes = pool;
  return pool;
}

/** Unique item pool. */
export function loadUniques(): readonly JsonUnique[] {
  if (cachedUniques) return cachedUniques;
  cachedUniques = uniquesJson as readonly JsonUnique[];
  return cachedUniques;
}

/** Flatten set definitions into per-piece records. */
export function loadSetPieces(): readonly JsonSetPiece[] {
  if (cachedSetPieces) return cachedSetPieces;
  cachedSetPieces = loadSets().flatMap((set) =>
    set.pieces ?? []
  );
  return cachedSetPieces;
}

/** Set definition pool, including bonuses and any concrete piece records. */
export function loadSets(): readonly SetDef[] {
  if (cachedSets) return cachedSets;
  cachedSets = setsJson as readonly SetDef[];
  return cachedSets;
}

/** Treasure class map keyed by id. */
export function loadTreasureClasses(): ReadonlyMap<string, TreasureClass> {
  if (cachedTcs) return cachedTcs;
  const map = new Map<string, TreasureClass>();
  for (const raw of treasureClassesJson as readonly JsonTreasureClass[]) {
    const picks: TcPick[] = raw.entries
      .filter((e) => e.type === 'item')
      .map((e) => ({
        baseId: e.itemBase,
        weight: e.weight,
        qlvlMin: e.minLevel,
        qlvlMax: e.maxLevel
      }));
    map.set(raw.id, { id: raw.id, picks });
  }
  cachedTcs = map;
  return map;
}

export function loadRarityAffixRules(): RarityAffixRules {
  if (cachedRarityRules) return cachedRarityRules;
  const raw = rarityRulesJson as unknown as { readonly tiers: Record<string, { readonly affixCount: RarityAffixCount }> };
  cachedRarityRules = Object.fromEntries(
    Object.entries(raw.tiers).map(([rarity, tier]) => [rarity, tier.affixCount])
  ) as RarityAffixRules;
  return cachedRarityRules;
}

/** Effective equip level uses the stricter of base and unique/set template requirements. */
export function resolveItemReqLevel(
  item: Pick<Item, 'baseId'> & Partial<Pick<Item, 'uniqueId' | 'setPieceId'>>,
  base: ItemBase | undefined = loadItemBases().get(item.baseId)
): number {
  const baseReq = base?.reqLevel ?? 1;
  const uniqueReq = item.uniqueId
    ? loadUniques().find((unique) => unique.id === item.uniqueId)?.reqLevel
    : undefined;
  const setPieceReq = item.setPieceId
    ? loadSetPieces().find((piece) => piece.id === item.setPieceId)?.reqLevel
    : undefined;
  return Math.max(baseReq, uniqueReq ?? 1, setPieceReq ?? 1);
}

/** Bundle every loader call into a single award-ready data set. */
export function loadAwardPools(): AwardDataPools {
  return {
    bases: loadItemBases(),
    affixes: loadAffixPool(),
    rarityRules: loadRarityAffixRules(),
    treasureClasses: loadTreasureClasses(),
    uniques: loadUniques(),
    setPieces: loadSetPieces()
  };
}
