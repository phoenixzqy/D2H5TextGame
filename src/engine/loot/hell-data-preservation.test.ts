/** Constructed data/loot contracts, not earned acquisition or pacing evidence. */
import { afterEach, describe, expect, it } from 'vitest';
import actualTables from '@/data/loot/treasure-classes.json';
import { restorePreMFRarities } from '@/test/magicFindPolicy';
import currentPrefixes from '@/data/items/affixes-prefix.json';
import currentSuffixes from '@/data/items/affixes-suffix.json';
import { loadAwardPools } from '@/data/loaders/loot';
import predecessor from '../../../tests/fixtures/hell-data-predecessor.json';
import rangedPolicy from '../../../tests/fixtures/ranged-progression-v1.json';
import throwingPolicy from '../../../tests/fixtures/throwing-progression-v1.json';
import swordPolicy from '../../../tests/fixtures/sword-progression-v1.json';
import spearPolicy from '../../../tests/fixtures/spear-progression-v1.json';
import clawPolicy from '../../../tests/fixtures/claw-progression-v1.json';
import twoHandedPolicy from '../../../tests/fixtures/two-handed-progression-v1.json';
import armorPolicy from '../../../tests/fixtures/armor-progression-v1.json';
import shieldPolicy from '../../../tests/fixtures/shield-progression-v1.json';
import type { Affix, Rarity } from '../types/items';
import { createRng } from '../rng';
import { rollKillRewards, type AwardDataPools } from './award';
import { rollItem, __resetRollItemSeqForTests } from './rollItem';
afterEach(__resetRollItemSeqForTests);
import type { TcPick, TreasureClass } from './drop-roller';

interface RawEntry {
  type: NonNullable<TcPick['type']>; weight: number; itemBase?: string; itemId?: string;
  rarity?: Rarity; minLevel?: number; maxLevel?: number; quantityMin?: number; quantityMax?: number;
}
interface RawTable { id: string; materialPoolId?: string; entries: RawEntry[] }
const oldTables = predecessor.files['src/data/loot/treasure-classes.json'].data as unknown as RawTable[];
// BUG678 intentionally supersedes fixed ordinary rarity. Reconstruct only its
// declared delta for historical D08 comparisons; production-magic-find.test.ts
// separately verifies exact current data against the full predecessor hash.
const currentTables = restorePreMFRarities(actualTables) as RawTable[];
const oldPrefixes = predecessor.files['src/data/items/affixes-prefix.json'].data as unknown as Affix[];
const oldSuffixes = predecessor.files['src/data/items/affixes-suffix.json'].data as unknown as Affix[];
const envelopes = [
  ['trash-act1', 38, 58, 16], ['mini-act1', 32, 52, 6], ['act1-boss', 39, 59, 8],
  ['trash-act2', 51, 71, 5], ['mini-act2', 48, 68, 1], ['act2-boss', 52, 72, 3],
  ['trash-act3', 66, 86, 5], ['mini-act3', 63, 83, 5], ['act3-boss', 67, 87, 8],
  ['trash-act4', 81, 101, 13], ['mini-act4', 76, 96, 4], ['act4-boss', 81, 101, 2],
  ['trash-act5', 102, 122, 19], ['mini-act5', 95, 115, 5], ['act5-boss', 102, 122, 9]
] as const;
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing retained Hell predecessor fixture');
  return value;
}

// Translate the retained predecessor using the documented loader format. The
// whole parsed JSON comparison below also protects fields outside this adapter.
function predecessorTable(raw: RawTable): TreasureClass {
  return { id: raw.id, ...(raw.materialPoolId ? { materialPoolId: raw.materialPoolId } : {}),
    picks: raw.entries.filter(row => row.weight > 0 && (row.type !== 'item' || typeof row.itemBase === 'string'))
      .map(row => ({ type: row.type, weight: row.weight,
        qlvlMin: row.minLevel ?? 1, qlvlMax: row.maxLevel ?? Number.MAX_SAFE_INTEGER,
        ...(row.itemBase ? { baseId: row.itemBase } : {}),
        ...(row.itemId === undefined ? {} : { itemId: row.itemId }),
        ...(row.rarity ? { rarity: row.rarity } : {}),
        ...(row.quantityMin === undefined ? {} : { quantityMin: row.quantityMin }),
        ...(row.quantityMax === undefined ? {} : { quantityMax: row.quantityMax }) })) };
}
const pools = loadAwardPools();
// P15 intentionally adds ranged/throwing, sword, spear, claw, shield, armor and two-handed tiers.
// Keep D08 testable and bind current JSON to all independently declared deltas.
const rangedDelta = new Map(rangedPolicy.tables.map(row => {
  const entries: RawEntry[] = [];
  for (const tier of rangedPolicy.tiers) for (const family of ['bow', 'crossbow'] as const) {
    const minLevel = Math.max(row.minLevel, tier.from,
      family === 'crossbow' && tier.crossbow === 'items/base/weapon-crossbow' ? 15 : 0);
    const maxLevel = Math.min(row.maxLevel, tier.to);
    if (minLevel <= maxLevel) entries.push({ type: 'item', itemBase: tier[family],
      rarity: row.rarity as Rarity, weight: row.weightPerFamily, minLevel, maxLevel });
  }
  return [row.id, entries] as const;
}));
const throwingDelta = new Map(throwingPolicy.tables.map(row => {
  const entries: RawEntry[] = [];
  for (const tier of throwingPolicy.tiers) {
    const minLevel = Math.max(row.minLevel, tier.from), maxLevel = Math.min(row.maxLevel, tier.to);
    if (minLevel <= maxLevel) entries.push({ type: 'item', itemBase: tier.baseId,
      rarity: row.rarity as Rarity, weight: row.weightPerFamily, minLevel, maxLevel });
  }
  return [row.id, entries] as const;
}));
const swordDelta = new Map(swordPolicy.tables.map(row => {
  const entries: RawEntry[] = [];
  for (const tier of swordPolicy.tiers) {
    const minLevel = Math.max(row.minLevel, tier.from), maxLevel = Math.min(row.maxLevel, tier.to);
    if (minLevel <= maxLevel) entries.push({ type: 'item', itemBase: tier.baseId,
      rarity: row.rarity as Rarity, weight: row.weightPerFamily, minLevel, maxLevel });
  }
  return [row.id, entries] as const;
}));
const spearDelta = new Map(spearPolicy.tables.map(row => {
  const entries: RawEntry[] = [];
  for (const tier of spearPolicy.tiers) {
    const minLevel = Math.max(row.minLevel, tier.from), maxLevel = Math.min(row.maxLevel, tier.to);
    if (minLevel <= maxLevel) entries.push({ type: 'item', itemBase: tier.baseId,
      rarity: row.rarity as Rarity, weight: row.weightPerFamily, minLevel, maxLevel });
  }
  return [row.id, entries] as const;
}));
const clawDelta = new Map(clawPolicy.tables.map(row => [row.id, row.additions.map(band => ({
  type: 'item' as const, itemBase: band.baseId, weight: row.weightPerFamily,
  ...(row.id.endsWith('-q') ? { rarity: 'rare' as const } : {}), minLevel: band.from, maxLevel: band.to
}))]));
const shieldDelta = new Map(shieldPolicy.tables.map(row => [row.id, row.additions.map(band => ({
  type: 'item' as const, itemBase: band.baseId, weight: row.weightPerFamily, minLevel: band.from, maxLevel: band.to
}))]));
const twoHandedDelta = new Map(twoHandedPolicy.tables.map(row => [row.id, row.additions.map(entry => ({ ...entry, type: 'item' as const }))]));
const armorDelta = new Map(armorPolicy.tables.map(row => [row.id, row.additions.map(entry => ({ ...entry, type: 'item' as const }))]));
const d08Tables = (currentTables as unknown as RawTable[]).map(table => ({ ...table,
  entries: table.entries.slice(0, table.entries.length - (rangedDelta.get(table.id)?.length ?? 0)
    - (throwingDelta.get(table.id)?.length ?? 0) - (swordDelta.get(table.id)?.length ?? 0)
    - (spearDelta.get(table.id)?.length ?? 0) - (clawDelta.get(table.id)?.length ?? 0)
    - (shieldDelta.get(table.id)?.length ?? 0) - (armorDelta.get(table.id)?.length ?? 0) - (twoHandedDelta.get(table.id)?.length ?? 0)) }));
// D09 policies intentionally change rewards and require live source levels.
// Exclude all D09 policies from this comparison, including its synthetic level1s.
const d08Pools: AwardDataPools = { ...pools, chapterBossEquipment: new Map(), equipmentGuarantees: new Map(), chapterBossUniques: new Map(),
  treasureClasses: new Map(d08Tables.map(raw => [raw.id, predecessorTable(raw)])) };
const oldPools: AwardDataPools = { ...pools, chapterBossEquipment: new Map(), equipmentGuarantees: new Map(), chapterBossUniques: new Map(),
  affixes: [...oldPrefixes, ...oldSuffixes],
  treasureClasses: new Map(oldTables.map(raw => [raw.id, predecessorTable(raw)])) };
function weightedEquipmentPool(table: TreasureClass, level: number) {
  return table.picks.filter(row => row.type === 'item' && row.weight > 0 && level >= row.qlvlMin && level <= row.qlvlMax)
    .map(({ qlvlMax: _eligibilityAlreadyResolved, ...row }) => row);
}

describe('D08 exact Hell data extension and predecessor preservation', () => {
  it('retains exactly109 D08 ceiling extensions plus the declared P15 ranged, throwing, sword, spear, claw, shield, armor and two-handed additions', () => {
    const expected = structuredClone(oldTables); let changed = 0;
    for (const [suffix, before, after, count] of envelopes) {
      const table = required(expected.find(row => row.id === `loot/${suffix}`));
      const selected = table.entries.filter(row => row.type === 'item' && row.weight > 0 && row.maxLevel === before);
      expect(selected).toHaveLength(count);
      for (const row of selected) { row.maxLevel = after; changed++; }
    }
    expect(changed).toBe(109); expect(d08Tables).toEqual(expected);
    for (const table of expected) table.entries.push(...rangedDelta.get(table.id) ?? [],
      ...throwingDelta.get(table.id) ?? [], ...swordDelta.get(table.id) ?? [], ...spearDelta.get(table.id) ?? [],
      ...clawDelta.get(table.id) ?? [], ...shieldDelta.get(table.id) ?? [], ...armorDelta.get(table.id) ?? [], ...twoHandedDelta.get(table.id) ?? []);
    expect(currentTables).toEqual(expected);
  });

  it('changes only the last-tier102→122 maximum for all16 affixes', () => {
    let changed = 0;
    const extend = (affixes: readonly Affix[]) => affixes.map(affix => {
      expect(affix.tiers.at(-1)).toMatchObject({ ilvlMin: 26, ilvlMax: 102 });
      return { ...affix, tiers: affix.tiers.map((tier, i) => {
        if (i !== affix.tiers.length - 1) return tier;
        changed++; return { ...tier, ilvlMax: 122 };
      }) };
    });
    expect(currentPrefixes).toEqual(extend(oldPrefixes));
    expect(currentSuffixes).toEqual(extend(oldSuffixes)); expect(changed).toBe(16);
  });

  it.each(envelopes)('%s D08 component preserves complete eligible weighted pools through%i', (suffix, previousMax) => {
    const id = `loot/${suffix}`, previous = required(oldPools.treasureClasses.get(id));
    const current = required(d08Pools.treasureClasses.get(id));
    for (let level = 1; level <= previousMax; level++) {
      expect(weightedEquipmentPool(current, level), `${id}/L${String(level)}`)
        .toEqual(weightedEquipmentPool(previous, level));
    }
  });

  it.each(envelopes)('%s D08 component preserves seeded Normal/Nightmare reward outputs through%i', (suffix, previousMax) => {
    const act = Number(required(/act([1-5])/.exec(suffix)?.[1])) as 1 | 2 | 3 | 4 | 5;
    for (const difficulty of ['normal', 'nightmare'] as const) for (const seed of [0, 3286157777]) {
      for (let monsterLevel = 1; monsterLevel <= previousMax; monsterLevel++) {
        const input = { act, difficulty, monsterLevel, tier: 'chapter-boss' as const,
          treasureClassId: `loot/${suffix}`, magicFind: 0, goldFind: 0 };
        const before = createRng(seed), after = createRng(seed);
        __resetRollItemSeqForTests();
        const previousReward = rollKillRewards(input, oldPools, before);
        __resetRollItemSeqForTests();
        const currentReward = rollKillRewards(input, d08Pools, after);
        expect(currentReward).toEqual(previousReward);
        expect(after.next()).toBe(before.next());
      }
    }
  });

  it.each([...pools.bases.values()].filter(base => base.canHaveAffixes))(
    '$id preserves seeded magic/rare materialization at every former affix level1..102', base => {
      for (const rarity of ['magic', 'rare'] as const) for (const seed of [0, 3286157777]) {
        for (let ilvl = 1; ilvl <= 102; ilvl++) {
          const before = createRng(seed), after = createRng(seed);
          __resetRollItemSeqForTests();
          const previousItem = rollItem({ baseId: base.id, rarity, ilvl }, oldPools, before);
          __resetRollItemSeqForTests();
          const currentItem = rollItem({ baseId: base.id, rarity, ilvl }, pools, after);
          expect(currentItem).toEqual(previousItem);
          expect(after.next()).toBe(before.next());
        }
      }
    });

  it('preserves the full goblin table and its supported Hell source levels49/66/93', () => {
    const id = 'loot/treasure-goblin';
    expect(currentTables.find(row => row.id === id)).toEqual(oldTables.find(row => row.id === id));
    const table = required(pools.treasureClasses.get(id));
    for (const level of [49, 66, 93]) expect(weightedEquipmentPool(table, level).length).toBeGreaterThan(0);
  });
});
