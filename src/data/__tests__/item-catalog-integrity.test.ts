/**
 * Full item-catalog integrity tests.
 *
 * These checks intentionally sit above JSON Schema validation: the schemas
 * allow some authoring conveniences (raw strings, empty stats objects, or
 * inferred image fallbacks) that are not acceptable for the shipped item
 * catalogue. If this suite fails, route fixes to content/art/design owners
 * rather than patching only the most visible broken item.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  itemBases as rawItemBases,
  uniques as rawUniques,
  sets as rawSets,
  runes as rawRunes,
  runewords as rawRunewords,
  dropTables as rawDropTables
} from '../index';
import zhCnItems from '../../i18n/locales/zh-CN/items.json';
import enItems from '../../i18n/locales/en/items.json';
import { resolveItemIcon } from '../../ui/cardAssets';
import { loadItemBases, loadTreasureClasses } from '../loaders/loot';
import { GameDataValidationError, loadGameData, validateGameData } from '../loader';
import itemBaseSchema from '../schema/item-base.schema.json';
import type { ItemBase, ItemBaseType } from '../../engine/types/items';

interface NamedEntry {
  readonly id: string;
  readonly name?: string;
  readonly flavor?: string;
}

interface UniqueEntry extends NamedEntry {
  readonly baseId: string;
  readonly reqLevel: number;
  readonly qlvl?: number;
  readonly weight?: number;
  readonly stats?: unknown;
}

interface SetPieceEntry extends NamedEntry {
  readonly id: string;
  readonly setId: string;
  readonly baseId: string;
  readonly reqLevel: number;
  readonly qlvl?: number;
  readonly weight?: number;
  readonly stats?: unknown;
}

interface SetEntry extends NamedEntry {
  readonly items: readonly string[];
  readonly pieces?: readonly SetPieceEntry[];
  readonly bonuses?: unknown;
}

interface DropEntry {
  readonly type: string;
  readonly weight: number;
  readonly itemId?: string;
  readonly itemBase?: string;
  readonly rarity?: string;
  readonly minLevel?: number;
  readonly maxLevel?: number;
}

interface DropTableEntry {
  readonly id: string;
  readonly entries?: readonly DropEntry[];
}

type LocaleJson = Readonly<Record<string, unknown>>;

const zhCn = zhCnItems as LocaleJson;
const en = enItems as LocaleJson;
const bases = rawItemBases as readonly NamedEntry[];
const uniques = rawUniques as readonly UniqueEntry[];
const sets = rawSets as readonly SetEntry[];
const runes = rawRunes as readonly NamedEntry[];
const runewords = rawRunewords as readonly (NamedEntry & { readonly stats?: unknown })[];
const dropTables = rawDropTables as readonly DropTableEntry[];

function getLocaleValue(locale: LocaleJson, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, locale);
}

function isTranslationKey(value: string): boolean {
  return value.startsWith('items.');
}

function localeKey(value: string): string {
  return value.replace(/^items\./, '');
}

function publicAssetExists(url: string): boolean {
  if (!url.startsWith('/assets/')) return false;
  return existsSync(path.join(process.cwd(), 'public', url.slice(1)));
}

function hasConcreteStatValue(node: unknown): boolean {
  if (node === null || node === undefined) return false;
  if (Array.isArray(node)) return node.length > 0;
  if (typeof node !== 'object') return true;
  return Object.values(node as Record<string, unknown>).some(hasConcreteStatValue);
}

function itemNameEntries(): NamedEntry[] {
  return [
    ...bases,
    ...uniques,
    ...sets,
    ...sets.flatMap((set) => set.pieces ?? []),
    ...runes,
    ...runewords
  ];
}

function allSetPieces(): SetPieceEntry[] {
  return sets.flatMap((set) => set.pieces ?? []);
}

function lootEntries(): { readonly table: string; readonly entry: DropEntry }[] {
  return dropTables.flatMap((table) =>
    (table.entries ?? []).map((entry) => ({ table: table.id, entry }))
  );
}

function summariseFailures(items: readonly unknown[]): string {
  return JSON.stringify({
    total: items.length,
    sample: items.slice(0, 20)
  }, null, 2);
}

describe('item catalogue integrity', () => {
  it('every item name/flavor translation key resolves in zh-CN and en', () => {
    const missing: {
      readonly id: string;
      readonly field: 'name' | 'flavor';
      readonly key?: string;
      readonly reason?: string;
      readonly zhCn: boolean;
      readonly en: boolean;
    }[] = [];

    for (const item of itemNameEntries()) {
      for (const field of ['name', 'flavor'] as const) {
        const value = item[field];
        if (value === undefined) continue;
        if (!isTranslationKey(value)) {
          missing.push({
            id: item.id,
            field,
            key: value,
            reason: 'not-an-items.*-translation-key',
            zhCn: false,
            en: false
          });
          continue;
        }
        const key = localeKey(value);
        const zhValue = getLocaleValue(zhCn, key);
        const enValue = getLocaleValue(en, key);
        if (typeof zhValue !== 'string' || zhValue.trim() === '' || typeof enValue !== 'string' || enValue.trim() === '') {
          missing.push({
            id: item.id,
            field,
            key: value,
            zhCn: typeof zhValue === 'string' && zhValue.trim() !== '',
            en: typeof enValue === 'string' && enValue.trim() !== ''
          });
        }
      }
    }

    expect(missing, summariseFailures(missing)).toHaveLength(0);
  });

  it('every concrete item resolves to an existing image asset', () => {
    const missing: { readonly id: string; readonly resolved: string | null }[] = [];

    for (const base of bases) {
      const resolved = resolveItemIcon(base.id);
      if (!resolved || !publicAssetExists(resolved)) missing.push({ id: base.id, resolved });
    }

    for (const unique of uniques) {
      const resolved = resolveItemIcon(unique.id);
      if (!resolved || !publicAssetExists(resolved)) missing.push({ id: unique.id, resolved });
    }

    for (const piece of allSetPieces()) {
      const resolved = resolveItemIcon(piece.id) ?? resolveItemIcon(piece.baseId);
      if (!resolved || !publicAssetExists(resolved)) missing.push({ id: piece.id, resolved });
    }

    expect(missing, summariseFailures(missing)).toHaveLength(0);
  });

  it('unique items and set pieces do not ship empty stat blocks', () => {
    const emptyStats: { readonly id: string; readonly field: string }[] = [];

    for (const unique of uniques) {
      if (!hasConcreteStatValue(unique.stats)) emptyStats.push({ id: unique.id, field: 'stats' });
    }

    for (const piece of allSetPieces()) {
      if (!hasConcreteStatValue(piece.stats)) emptyStats.push({ id: piece.id, field: 'stats' });
    }

    for (const set of sets) {
      if (!hasConcreteStatValue(set.bonuses)) emptyStats.push({ id: set.id, field: 'bonuses' });
    }

    expect(emptyStats, summariseFailures(emptyStats)).toHaveLength(0);
  });

  it('every concrete loot item/base reference resolves to the item catalogue', () => {
    const baseIds = new Set(bases.map((item) => item.id));
    const uniqueIds = new Set(uniques.map((item) => item.id));
    const setPieceIds = new Set(allSetPieces().map((item) => item.id));
    const runeIds = new Set(runes.map((item) => item.id));
    const runewordIds = new Set(runewords.map((item) => item.id));
    const missing: { readonly table: string; readonly ref: string; readonly field: 'itemBase' | 'itemId' }[] = [];

    for (const { table, entry } of lootEntries()) {
      if (entry.itemBase && !baseIds.has(entry.itemBase)) {
        missing.push({ table, ref: entry.itemBase, field: 'itemBase' });
      }
      if (entry.itemId && !entry.itemId.startsWith('currency/')) {
        const id = entry.itemId;
        if (!baseIds.has(id) && !uniqueIds.has(id) && !setPieceIds.has(id) && !runeIds.has(id) && !runewordIds.has(id)) {
          missing.push({ table, ref: entry.itemId, field: 'itemId' });
        }
      }
    }

    expect(missing, summariseFailures(missing)).toHaveLength(0);
  });

  it('all intended droppable items are reachable from loot tables', () => {
    const reachableBases = new Set<string>();
    const reachableItems = new Set<string>();
    const baseDropWindows: {
      readonly baseId: string;
      readonly minLevel: number;
      readonly maxLevel: number;
    }[] = [];

    for (const { entry } of lootEntries()) {
      if (entry.itemBase) {
        reachableBases.add(entry.itemBase);
        baseDropWindows.push({
          baseId: entry.itemBase,
          minLevel: entry.minLevel ?? 1,
          maxLevel: entry.maxLevel ?? Number.POSITIVE_INFINITY
        });
      }
      if (entry.itemId && !entry.itemId.startsWith('currency/')) {
        reachableItems.add(entry.itemId);
      }
    }

    const unreachable: { readonly id: string; readonly reason: string }[] = [];
    const baseReqLevels = new Map(bases.map((base) => [base.id, (base as { readonly reqLevel?: number }).reqLevel ?? 1]));

    for (const base of bases) {
      if (!reachableBases.has(base.id)) {
        unreachable.push({ id: base.id, reason: 'base-not-referenced-by-any-loot-table' });
      }
    }

    const canDropByBaseWindow = (baseId: string, qlvl: number): boolean =>
      baseDropWindows.some((window) =>
        window.baseId === baseId &&
        window.minLevel <= qlvl &&
        qlvl <= window.maxLevel
      );

    for (const unique of uniques) {
      const qlvl = Math.max(unique.qlvl ?? unique.reqLevel, baseReqLevels.get(unique.baseId) ?? 1);
      if ((unique.weight ?? 1) > 0 && typeof qlvl === 'number') {
        if (!reachableItems.has(unique.id) && !canDropByBaseWindow(unique.baseId, qlvl)) {
          unreachable.push({ id: unique.id, reason: 'weighted-unique-not-reachable' });
        }
      }
    }

    for (const piece of allSetPieces()) {
      const qlvl = Math.max(piece.qlvl ?? piece.reqLevel, baseReqLevels.get(piece.baseId) ?? 1);
      if ((piece.weight ?? 1) > 0 && typeof qlvl === 'number') {
        if (!reachableItems.has(piece.id) && !canDropByBaseWindow(piece.baseId, qlvl)) {
          unreachable.push({ id: piece.id, reason: 'weighted-set-piece-not-reachable' });
        }
      }
    }

    expect(unreachable, summariseFailures(unreachable)).toHaveLength(0);
  });

  it('materialized treasure classes preserve direct rewards and forced rarity', () => {
    const treasureClasses = loadTreasureClasses();
    const countess = treasureClasses.get('loot/countess-runes');
    const andariel = treasureClasses.get('loot/andariel-q');
    const treasureGoblin = treasureClasses.get('loot/treasure-goblin');
    const baseReqLevels = new Map(bases.map((base) => [base.id, (base as { readonly reqLevel?: number }).reqLevel ?? 1]));

    expect(countess?.picks.some((pick) => pick.type === 'rune' && pick.itemId?.startsWith('runes/'))).toBe(true);
    expect(andariel?.picks.some((pick) => pick.type === 'item' && pick.rarity === 'unique')).toBe(true);
    expect(treasureGoblin?.picks
      .filter((pick) => (pick.type ?? 'item') === 'item' && pick.baseId)
      .every((pick) => pick.qlvlMin >= (baseReqLevels.get(pick.baseId ?? '') ?? 1))
    ).toBe(true);
  });
});


// Literal acceptance set from D06 v1d, independent of catalog metadata.
const IRON_METAL_IDS = [
  'wp1h-short-sword', 'wp1h-scimitar', 'wp1h-long-sword', 'wp1h-war-sword',
  'wp1h-phase-blade', 'wp1h-legend-sword',
  'wp2h-two-handed-sword', 'wp2h-great-axe', 'wp2h-war-pike',
  'wp2h-giant-thresher', 'wp2h-colossus-blade', 'wp2h-thunder-maul',
  'weapon-axe', 'weapon-mace', 'weapon-polearm', 'weapon-scepter',
  'helm-skull-cap', 'helm-casque', 'helm-armet',
  'armor-chain-mail', 'armor-breast-plate', 'armor-archon-plate',
  'glove-chain', 'glove-light-gauntlets',
  'boot-chain', 'boot-light-plated', 'boot-myrmidon-greaves',
  'belt-plated', 'belt-mithril-coil', 'sh-aegis', 'sh-monarch'
].map(suffix => `items/base/${suffix}`).sort();
// D10 source-backed addition; the D06 historical acceptance set above stays literal.
const CURRENT_IRON_METAL_IDS = [...IRON_METAL_IDS, 'items/base/wp2h-battle-scythe'].sort();

const BASE_KINDS: readonly ItemBaseType[] = [
  'weapon', 'armor', 'jewelry', 'charm', 'rune', 'gem', 'material'
];

function metalSchemaCandidate(type: ItemBaseType): ItemBase {
  return {
    id: 'items/base/metal-fixture', name: 'items.base.metal-fixture', type,
    slot: null, reqLevel: 1, canHaveAffixes: false, maxSockets: 0,
    ...(type === 'weapon' ? { weaponType: 'sword', handedness: 'oneHanded' } as const : {})
  };
}

describe('reviewed socket maximum metadata', () => {
  it('covers all 74 historical bases plus the staff and scythe without changing historical ceilings', () => {
    expect(rawItemBases.filter(base => !['items/base/weapon-staff', 'items/base/wp2h-battle-scythe'].includes(base.id))).toHaveLength(74);
    expect(rawItemBases.filter(base => base.id === 'items/base/weapon-staff')).toEqual([
      expect.objectContaining({ sockets: 2, maxSockets: 2 })
    ]);
    expect(rawItemBases.filter(base => base.id === 'items/base/wp2h-battle-scythe')).toEqual([
      expect.objectContaining({ sockets: 5, maxSockets: 5 })
    ]);
    expect(rawItemBases).toHaveLength(76);
    for (const base of rawItemBases) {
      expect(base.maxSockets, base.id).toBe('sockets' in base ? base.sockets : 0);
    }
  });

  it.each([undefined, null, -1, 0.5, 7, '2'])('rejects missing or invalid reviewed maximum %o', maxSockets => {
    expect(() => validateGameData(itemBaseSchema.$id, { ...metalSchemaCandidate('armor'), maxSockets }))
      .toThrow(GameDataValidationError);
  });
});

describe('Iron Golem authored metal metadata', () => {
  it('preserves the 31 historical metal bases and explicitly adds only the new scythe', () => {
    const catalog = rawItemBases as readonly ItemBase[];
    expect(new Set(IRON_METAL_IDS).size).toBe(31);
    expect(new Set(CURRENT_IRON_METAL_IDS).size).toBe(32);
    for (const id of IRON_METAL_IDS) {
      expect(catalog.filter(base => base.id === id), id).toHaveLength(1);
    }
    expect(catalog.filter(base => base.metal === true).map(base => base.id).sort())
      .toEqual(CURRENT_IRON_METAL_IDS);
    for (const base of catalog) {
      expect(() => validateGameData(itemBaseSchema.$id, base), base.id).not.toThrow();
      if (!CURRENT_IRON_METAL_IDS.includes(base.id)) expect(base.metal, base.id).not.toBe(true);
    }
  });

  it('preserves the exact material flags through both real data loaders', async () => {
    for (const loaded of [loadItemBases(), (await loadGameData()).itemBases]) {
      expect([...loaded.values()].filter(base => base.metal === true).map(base => base.id).sort())
        .toEqual(CURRENT_IRON_METAL_IDS);
      for (const base of loaded.values()) {
        if (base.metal === true) expect(['weapon', 'armor']).toContain(base.type);
      }
    }
  });

  it.each(BASE_KINDS)('accepts omitted and false metadata for %s', type => {
    expect(() => validateGameData(itemBaseSchema.$id, metalSchemaCandidate(type))).not.toThrow();
    expect(() => validateGameData(itemBaseSchema.$id, { ...metalSchemaCandidate(type), metal: false }))
      .not.toThrow();
  });

  it.each(['weapon', 'armor'] as const)('accepts explicit true for %s', type => {
    expect(() => validateGameData(itemBaseSchema.$id, { ...metalSchemaCandidate(type), metal: true }))
      .not.toThrow();
  });

  it.each(['jewelry', 'charm', 'rune', 'gem', 'material'] as const)(
    'rejects true for excluded kind %s even with a metal-like name', type => {
      expect(() => validateGameData(itemBaseSchema.$id, {
        ...metalSchemaCandidate(type), name: 'items.base.iron-sword', metal: true
      })).toThrow(GameDataValidationError);
    }
  );

  it.each([null, 0, 1, 'true', 'false', [], {}])('rejects nonboolean metal value %j', metal => {
    expect(() => validateGameData(itemBaseSchema.$id, { ...metalSchemaCandidate('armor'), metal }))
      .toThrow(GameDataValidationError);
  });

  it('keeps typo protection instead of allowing arbitrary base properties', () => {
    expect(() => validateGameData(itemBaseSchema.$id, { ...metalSchemaCandidate('armor'), metals: true }))
      .toThrow(GameDataValidationError);
  });
});
