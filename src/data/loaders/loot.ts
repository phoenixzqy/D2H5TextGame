/**
 * Loot data loaders — translate JSON into engine types.
 *
 * Lives in `src/data/` so engine modules can stay JSON-agnostic. Cached
 * after first call.
 *
 * @module data/loaders/loot
 */

import type { Affix, Item, ItemBase, Rarity, SetDef } from '@/engine/types/items';
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
import { socketRunewords } from './socket-effects';
import { EQUIPMENT_GUARANTEES } from './equipment-guarantees';
import { CHAPTER_BOSS_EQUIPMENT } from './chapter-boss-equipment';
import { CHAPTER_BOSS_UNIQUES } from './chapter-boss-uniques';
import { CHAPTER_BOSS_FIRST_KILLS, validateChapterBossFirstKillReferences } from './chapter-boss-first-kills';
import { NONBOSS_LOOT } from './nonboss-loot';
import { MINIBOSS_LOOT } from './miniboss-loot';

interface JsonTcEntry {
  readonly type: string;
  readonly itemBase?: string;
  readonly itemId?: string;
  readonly rarity?: Rarity;
  readonly weight: number;
  readonly minLevel?: number;
  readonly maxLevel?: number;
  readonly quantityMin?: number;
  readonly quantityMax?: number;
}
interface JsonTreasureClass {
  readonly id: string;
  readonly materialPoolId?: string;
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
      .filter((e) => e.weight > 0)
      .filter((e) => e.type !== 'item' || typeof e.itemBase === 'string')
      .map((e) => {
        const pick: TcPick = {
          type: e.type as NonNullable<TcPick['type']>,
          ...(e.itemBase ? { baseId: e.itemBase } : {}),
          ...(e.itemId !== undefined ? { itemId: e.itemId } : {}),
          ...(e.rarity ? { rarity: e.rarity } : {}),
          weight: e.weight,
          qlvlMin: e.minLevel ?? 1,
          qlvlMax: e.maxLevel ?? Number.MAX_SAFE_INTEGER,
          ...(e.quantityMin !== undefined ? { quantityMin: e.quantityMin } : {}),
          ...(e.quantityMax !== undefined ? { quantityMax: e.quantityMax } : {})
        };
        return pick;
      });
    map.set(raw.id, { id: raw.id, picks, ...(raw.materialPoolId ? { materialPoolId: raw.materialPoolId } : {}) });
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

/** Resolve a current unique package only for its actual concrete base. */
export function resolveItemUnique(
  item: Pick<Item, 'baseId'> & Partial<Pick<Item, 'uniqueId'>>,
  definitions: readonly JsonUnique[] = loadUniques()
): JsonUnique | undefined {
  return item.uniqueId ? definitions.find(unique => unique.id === item.uniqueId && unique.baseId === item.baseId) : undefined;
}

/** Effective equip level uses the strictest base, unique/set and completed-word requirements. */
export function resolveItemReqLevel(
  item: Pick<Item, 'baseId'> & Partial<Pick<Item, 'uniqueId' | 'setPieceId' | 'runewordId'>>,
  base: ItemBase | undefined = loadItemBases().get(item.baseId)
): number {
  const baseReq = base?.reqLevel ?? 1;
  const uniqueReq = resolveItemUnique(item)?.reqLevel;
  const setPieceReq = item.setPieceId
    ? loadSetPieces().find((piece) => piece.id === item.setPieceId)?.reqLevel
    : undefined;
  const runewordReq = item.runewordId
    ? socketRunewords.find(word => word.id === item.runewordId)?.reqLevel
    : undefined;
  return Math.max(baseReq, uniqueReq ?? 1, setPieceReq ?? 1, runewordReq ?? 1);
}

/** Bundle every loader call into a single award-ready data set. */
export function loadAwardPools(): AwardDataPools {
  const treasureClasses = loadTreasureClasses();
  for (const row of MINIBOSS_LOOT.acts) {
    if ([row.treasureClassId, row.equipmentSourceId, row.jewelrySourceId].some(id => !treasureClasses.has(id))) {
      throw new Error('Unknown miniboss loot table');
    }
  }
  for (const row of NONBOSS_LOOT.acts) {
    if ([...row.tableIds, row.equipmentSourceId, row.jewelrySourceId].some(id => !treasureClasses.has(id))) {
      throw new Error('Unknown nonboss loot table');
    }
  }
  for (const tableId of CHAPTER_BOSS_UNIQUES.keys()) {
    if (!treasureClasses.has(tableId)) throw new Error('Unknown chapter-boss unique table');
  }
  for (const [tableId, rule] of CHAPTER_BOSS_EQUIPMENT) {
    if (!treasureClasses.has(tableId) || rule.groups.some(group => !treasureClasses.has(group.sourceTableId))) {
      throw new Error('Unknown chapter-boss equipment table');
    }
  }
  for (const [tableId, rules] of EQUIPMENT_GUARANTEES) {
    if (!treasureClasses.has(tableId) || rules.some(rule => !treasureClasses.has(rule.sourceTableId))) {
      throw new Error('Unknown equipment guarantee table');
    }
  }
  const bases = loadItemBases(), uniques = loadUniques();
  validateChapterBossFirstKillReferences(CHAPTER_BOSS_FIRST_KILLS, { bases, uniques, treasureClasses });
  return {
    bases,
    affixes: loadAffixPool(),
    rarityRules: loadRarityAffixRules(),
    treasureClasses,
    equipmentGuarantees: EQUIPMENT_GUARANTEES,
    chapterBossEquipment: CHAPTER_BOSS_EQUIPMENT,
    chapterBossUniques: CHAPTER_BOSS_UNIQUES,
    chapterBossFirstKills: CHAPTER_BOSS_FIRST_KILLS,
    nonbossLoot: NONBOSS_LOOT,
    minibossLoot: MINIBOSS_LOOT,
    uniques,
    setPieces: loadSetPieces()
  };
}
