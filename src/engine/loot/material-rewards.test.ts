import { describe, expect, it } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import runesJson from '@/data/items/runes.json';
import { createRng } from '../rng';
import { rollQuestTableRewards, type AwardDataPools } from './award';
import { rollDrops, type TcPick, type TreasureClass } from './drop-roller';

const SEED = 41;
const pools = loadAwardPools();
const runeIds = new Set(runesJson.map(rune => rune.id));
const profiles = [
  ['loot/countess-runes', 12], ['loot/hellforge-runes', 56], ['loot/baal-q', 82],
  ['loot/andariel-q', 12], ['loot/duriel-q', 32], ['loot/mephisto-q', 46], ['loot/diablo-q', 61]
] as const;

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing authored material reward');
  return value;
}

function withPicks(table: TreasureClass, picks: readonly TcPick[]): AwardDataPools {
  return { ...pools, treasureClasses: new Map([[table.id, { ...table, picks }]]) };
}

describe('concrete materials in authored quest caches', () => {
  for (const [tableId, ilvl] of profiles) {
    const table = required(pools.treasureClasses.get(tableId));
    const runes = table.picks.filter(pick => pick.type === 'rune');

    it(`${tableId} has real canonical rune outcomes to exercise`, () => {
      expect(runes.length).toBeGreaterThan(0);
      for (const pick of runes) expect(runeIds.has(required(pick.itemId))).toBe(true);
    });

    for (const pick of runes) {
      it(`preserves selected ${required(pick.itemId)} from ${tableId}, without another RNG draw`, () => {
        // Restrict selection to this actual authored pick, preserving its complete payload.
        const data = withPicks(table, [pick]);
        const rng = createRng(SEED), control = createRng(SEED);
        const direct = rollDrops({ tc: { ...table, picks: [pick], numPicks: 1, noDropChance: 0 },
          tier: 'chapter-boss', monsterLevel: ilvl, magicFind: 0, magicFindMultiplier: 1 }, control);
        const result = required(rollQuestTableRewards({ tableId, ilvl, picks: 1 }, data, rng));
        const count = pick.quantityMin ?? 1;
        expect(direct).toEqual([{ kind: 'direct', currency: 'runes', itemId: pick.itemId,
          quantity: count, ilvl }]);
        expect(rng.next()).toBe(control.next());
        expect(result).toMatchObject({ items: [], runeShards: 0, wishstones: 0, runes: count, gems: 0,
          materials: { [required(pick.itemId)]: count } });
      });
    }
  }

  const table = required(pools.treasureClasses.get('loot/countess-runes'));
  const ral = required(table.picks.find(pick => pick.itemId === 'runes/ral'));

  it('aggregates repeated selections of the same real rune into one safe owned stack', () => {
    const result = rollQuestTableRewards({ tableId: table.id, ilvl: 12, picks: 5 },
      withPicks(table, [ral]), createRng(SEED));
    expect(result).toMatchObject({ items: [], runes: 5, gems: 0, runeShards: 0, wishstones: 0,
      materials: { 'runes/ral': 5 } });
  });

  it('accepts an exactly safe concrete stack count without rounding it', () => {
    const count = Number.MAX_SAFE_INTEGER;
    const result = rollQuestTableRewards({ tableId: table.id, ilvl: 12, picks: 1 },
      withPicks(table, [{ ...ral, quantityMin: count, quantityMax: count }]), createRng(SEED));
    expect(result).toMatchObject({ runes: count, materials: { 'runes/ral': count } });
  });

  it('refuses the entire cache when duplicate concrete counts overflow a safe integer', () => {
    const count = Number.MAX_SAFE_INTEGER;
    expect(rollQuestTableRewards({ tableId: table.id, ilvl: 12, picks: 2 },
      withPicks(table, [{ ...ral, quantityMin: count, quantityMax: count }]), createRng(SEED))).toBeUndefined();
  });

  it.each([
    ['rune', 'runes/not-authored'], ['rune', 'runes/RAL'], ['rune', ''],
    ['rune', '__proto__'], ['rune', 'currency/wishstone'], ['gem', 'runes/ral']
  ] as const)('refuses a strict concrete %s cache with invalid identity %j', (type, itemId) => {
    // Deliberately invalid inputs: no substitute valid material identity is invented.
    expect(rollQuestTableRewards({ tableId: table.id, ilvl: 12, picks: 1 },
      withPicks(table, [{ ...ral, type, itemId }]), createRng(SEED))).toBeUndefined();
  });

  it('refuses a mixed cache rather than returning the earlier valid rune as a partial bag', () => {
    const picks = [ral, { ...ral, itemId: 'runes/not-authored' }];
    const data = withPicks(table, picks);
    const direct = rollDrops({ tc: { ...table, picks, numPicks: 10, noDropChance: 0 },
      tier: 'chapter-boss', monsterLevel: 12, magicFind: 0 }, createRng(SEED));
    expect(direct).toContainEqual(expect.objectContaining({ itemId: 'runes/ral' }));
    expect(direct).toContainEqual(expect.objectContaining({ itemId: 'runes/not-authored' }));
    expect(rollQuestTableRewards({ tableId: table.id, ilvl: 12, picks: 10 }, data, createRng(SEED)))
      .toBeUndefined();
  });
});
