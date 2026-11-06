/** BUG680 constructed optional rewards; no earned campaign/balance credit. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { validateChapterBossUniques } from '@/data/loaders/chapter-boss-uniques';
import policy from '@/data/loot/chapter-boss-uniques.json';
import { createRng } from '../rng';
import { rollKillRewards, rollQuestTableRewards, type AwardDataPools } from './award';
import { rollChapterBossUnique, type ChapterBossUniqueRule } from './chapter-boss-uniques';
import type { TcPick } from './drop-roller';
import { __resetRollItemSeqForTests } from './rollItem';

const pools = loadAwardPools();
afterEach(() => { vi.restoreAllMocks(); __resetRollItemSeqForTests(); });
const bosses = [[1, 14, 6], [2, 27, 8], [3, 42, 9], [4, 57, 10], [5, 78, 12]] as const;

for (const [difficulty, offset] of [['normal', 0], ['nightmare', 20], ['hell', 40]] as const) {
  describe(`optional boss uniques on ${difficulty}`, () => {
    it.each(bosses)('Act%i level%i grants one extra unique when the bonus succeeds', (act, level, ordinary) => {
      const rng = createRng(7);
      // noDrop0 stays false; bonus gates and the upper-end rarity attempt pass.
      vi.spyOn(rng, 'chance').mockImplementation(probability => probability > 0);
      vi.spyOn(rng, 'next').mockReturnValue(0.999);
      const monsterLevel = level + offset;
      const rewards = rollKillRewards({ act, tier: 'chapter-boss', monsterLevel, difficulty,
        treasureClassId: `loot/act${String(act)}-boss`, magicFind: 0, goldFind: 0 },
      { ...pools, equipmentGuarantees: new Map() }, rng);
      expect(rewards.items).toHaveLength(ordinary + 1);
      expect(rewards.items.at(-1)).toMatchObject({ rarity: 'unique', ilvl: monsterLevel });
      expect(rewards.items.at(-1)?.uniqueId).toBeTruthy();
    });
  });
}

const tableId = 'loot/unique-test', baseId = 'test/base';
const input = { act: 1, tier: 'chapter-boss' as const, monsterLevel: 10, treasureClassId: tableId, magicFind: 0 };
function fixture(rule: Partial<ChapterBossUniqueRule> = {}): AwardDataPools {
  return {
    bases: new Map([[baseId, { id: baseId, name: 'Test', type: 'armor', slot: 'head',
      reqLevel: 1, maxSockets: 0, canHaveAffixes: true }]]), affixes: [],
    uniques: [{ id: 'test/unique', name: 'Unique', baseId, reqLevel: 10, weight: 1 }],
    treasureClasses: new Map([[tableId, { id: tableId, picks: [{ baseId, weight: 1, qlvlMin: 1, qlvlMax: 20 }] }]]),
    chapterBossUniques: new Map([[tableId, { act: 1, chance: 1, ...rule }]])
  };
}

describe('optional unique chance, rarity and source selection', () => {
  it('loads the five exact authored gates and only Andariel requires a boosted attempt', () => {
    expect([...pools.chapterBossUniques ?? []]).toEqual([
      ['loot/act1-boss', { act: 1, chance: 0.25, rarityAttemptMultiplier: 5 }],
      ['loot/act2-boss', { act: 2, chance: 0.3 }], ['loot/act3-boss', { act: 3, chance: 0.35 }],
      ['loot/act4-boss', { act: 4, chance: 0.4 }], ['loot/act5-boss', { act: 5, chance: 0.5 }]
    ]);
  });

  it.each([0.25, 0.3, 0.35, 0.4, 0.5])('honors strict chance gate%i without changing failed-gate RNG', chance => {
    const seed = 7, unit = createRng(seed).next();
    for (const probability of [unit - 1e-10, unit, unit + 1e-10, chance]) {
      const rng = createRng(seed);
      const result = rollChapterBossUnique(input, fixture({ chance: probability }), rng);
      expect(result).toHaveLength(unit < probability ? 1 : 0);
      if (result.length === 0) {
        const expected = createRng(seed);
        expected.next();
        expect(rng.next()).toBe(expected.next());
      }
    }
  });

  it('consumes no randomness at chance0 and still materializes at chance1', () => {
    const rng = createRng(7), next = vi.spyOn(rng, 'next');
    expect(rollChapterBossUnique(input, fixture({ chance: 0 }), rng)).toEqual([]);
    expect(next).not.toHaveBeenCalled();
    expect(rng.next()).toBe(createRng(7).next());
    expect(rollChapterBossUnique(input, fixture(), createRng(7))[0]).toMatchObject({ rarity: 'unique', ilvl: 10 });
  });

  it('uses the exact 5U/(N+M+R+S+5U) attempt including gear and offline MF', () => {
    const roll = (magicFind: number, magicFindMultiplier: number, unit: number) => {
      const rng = createRng(7);
      vi.spyOn(rng, 'next').mockReturnValueOnce(unit);
      return rollChapterBossUnique({ ...input, magicFind, magicFindMultiplier },
        fixture({ rarityAttemptMultiplier: 5 }), rng);
    };
    // Independent MF0 weights: N1000, M300, R320, S48, U48×5.
    const boundary = 1668 / 1908;
    expect(roll(0, 1, boundary - 1e-10)).toEqual([]);
    expect(roll(0, 1, boundary)).toEqual([]);
    expect(roll(0, 1, boundary + 1e-10)).toHaveLength(1);
    expect(roll(0, 1, 0.8)).toEqual([]);
    expect(roll(300, 1, 0.8)).toHaveLength(1);
    expect(roll(300, 1, 0.72)).toEqual([]);
    expect(roll(300, 1.5, 0.72)).toHaveLength(1);
  });

  it('preserves independent source-base weights and template weights after eligibility filtering', () => {
    const data = fixture(), base = data.bases.get(baseId), template = data.uniques?.[0];
    if (!base || !template) throw new Error('Missing fixture');
    const other = 'test/other';
    const picks: readonly TcPick[] = [
      { baseId, weight: 1, qlvlMin: 1, qlvlMax: 20 },
      { baseId: other, weight: 3, qlvlMin: 1, qlvlMax: 20 },
      { baseId, weight: 100, qlvlMin: 11, qlvlMax: 20 },
      { baseId, weight: 100, qlvlMin: 1, qlvlMax: 9 },
      { baseId, weight: 0, qlvlMin: 1, qlvlMax: 20 },
      { baseId: 'missing', weight: 100, qlvlMin: 1, qlvlMax: 20 },
      { type: 'currency', itemId: 'currency/wishstone', weight: 100, qlvlMin: 1, qlvlMax: 20 }
    ];
    const selection = { ...data, bases: new Map([...data.bases, [other, { ...base, id: other }]]),
      treasureClasses: new Map([[tableId, { id: tableId, picks }]]),
      uniques: [{ ...template, weight: 0 }, { ...template, id: 'test/a', weight: 1 },
        { ...template, id: 'test/b', weight: 3 }, { ...template, id: 'test/other-unique', baseId: other }] };
    for (const [baseUnit, templateUnit, expected] of [[0, 0, 'test/a'], [0.249, 0.251, 'test/b'],
      [0.251, 0, 'test/other-unique'], [0.999, 0.999, 'test/other-unique']] as const) {
      const rng = createRng(7);
      vi.spyOn(rng, 'next').mockReturnValueOnce(baseUnit).mockReturnValueOnce(templateUnit);
      expect(rollChapterBossUnique(input, selection, rng)[0]).toMatchObject({ uniqueId: expected, rarity: 'unique', ilvl: 10 });
    }
  });

  it.each([{ reqLevel: 11 }, { reqLevel: 1, qlvl: 11 }, { reqLevel: 1, weight: 0 },
    { reqLevel: 1, weight: -1 }, { reqLevel: 1, weight: Infinity }])('refuses ineligible templates%j instead of a rare fallback', override => {
    const data = fixture();
    expect(() => rollChapterBossUnique(input, { ...data,
      uniques: [{ id: 'test/unavailable', name: 'Unavailable', baseId, ...override }] }, createRng(7)))
      .toThrow('No materializable chapter-boss unique');
  });

  it('uses qlvl instead of equip requirement and requires reviewed socket capacity', () => {
    const data = fixture();
    const eligible = { ...data, uniques: [{ id: 'test/eligible', name: 'Eligible', baseId, reqLevel: 15, qlvl: 10 }] };
    expect(rollChapterBossUnique(input, eligible, createRng(7))[0])
      .toMatchObject({ uniqueId: 'test/eligible', ilvl: 10, level: 15 });
    const base = data.bases.get(baseId);
    if (!base) throw new Error('Missing fixture');
    expect(() => rollChapterBossUnique(input, { ...eligible,
      bases: new Map([[baseId, { ...base, maxSockets: 7 }]]) }, createRng(7))).toThrow(/materializable/);
  });

  it('refuses missing, empty, invalid or overflowing equipment sources and invalid context', () => {
    for (const picks of [[], [{ baseId, weight: NaN, qlvlMin: 1, qlvlMax: 20 }],
      [{ baseId, weight: 1, qlvlMin: 11, qlvlMax: 10 }],
      [1, 2].map(() => ({ baseId, weight: Number.MAX_VALUE, qlvlMin: 1, qlvlMax: 20 }))]) {
      expect(() => rollChapterBossUnique(input, { ...fixture(),
        treasureClasses: new Map([[tableId, { id: tableId, picks }]]) }, createRng(7))).toThrow();
    }
    expect(() => rollChapterBossUnique(input, { ...fixture(), treasureClasses: new Map() }, createRng(7))).toThrow('Missing');
    for (const rule of [{ chance: NaN }, { chance: -1 }, { chance: 1.1 }, { act: 2 as const },
      { rarityAttemptMultiplier: 0 }, { rarityAttemptMultiplier: 6 }, { rarityAttemptMultiplier: Infinity }]) {
      expect(() => rollChapterBossUnique(input, fixture(rule), createRng(7))).toThrow('Invalid');
    }
    expect(() => rollChapterBossUnique({ ...input, monsterLevel: NaN }, fixture(), createRng(7))).toThrow('Invalid');
  });
});

describe('optional unique integration and schema', () => {
  it('appends after existing guarantees without altering ordinary rewards or currencies in this call', () => {
    const run = (withBonus: boolean) => {
      __resetRollItemSeqForTests();
      const rng = createRng(7);
      const data = { ...pools, chapterBossUniques: withBonus ? new Map([['loot/act4-boss', { act: 4 as const, chance: 1 }]]) : new Map() };
      return rollKillRewards({ act: 4, tier: 'chapter-boss', monsterLevel: 61, treasureClassId: 'loot/act4-boss',
        magicFind: 300, magicFindMultiplier: 1.5, goldFind: 0 }, data, rng);
    };
    const baseline = run(false), actual = run(true);
    expect(actual.items.slice(0, -1)).toEqual(baseline.items);
    expect({ ...actual, items: [] }).toEqual({ ...baseline, items: [] });
    expect(actual.items.at(-1)).toMatchObject({ rarity: 'unique', ilvl: 61 });
  });

  it('keeps caches, other live tiers and unconfigured tables independent with identical following RNG', () => {
    const compare = (run: (data: AwardDataPools) => unknown) => {
      __resetRollItemSeqForTests();
      const baseline = run({ ...pools, chapterBossUniques: new Map() });
      __resetRollItemSeqForTests();
      expect(run(pools)).toEqual(baseline);
    };
    for (const [tier, treasureClassId] of [['boss', 'loot/act1-boss'], ['chapter-boss', 'loot/trash-act1']] as const) {
      compare(data => { const rng = createRng(7); return { rewards: rollKillRewards({ act: 1, tier, monsterLevel: 19,
        treasureClassId, magicFind: 0, goldFind: 0 }, data, rng), following: rng.next() }; });
    }
    compare(data => { const rng = createRng(7); return { rewards: rollQuestTableRewards({ tableId: 'loot/act1-boss',
      ilvl: 19, picks: 3 }, data, rng), following: rng.next() }; });
  });

  it('reproduces complete rewards and following randomness with matching allocator state', () => {
    const run = () => {
      __resetRollItemSeqForTests();
      const rng = createRng(73);
      return { rewards: rollKillRewards({ act: 5, tier: 'chapter-boss', monsterLevel: 118,
        treasureClassId: 'loot/act5-boss', difficulty: 'hell', magicFind: 300, magicFindMultiplier: 1.5,
        goldFind: 0 }, pools, rng), following: rng.next() };
    };
    expect(run()).toEqual(run());
  });

  it('validates closed schemas, finite probability bounds and unique act/table bindings', () => {
    expect(validateChapterBossUniques(policy).size).toBe(5);
    const row = policy[0];
    if (!row) throw new Error('Missing policy');
    for (const override of [{ chance: -1 }, { chance: 1.1 }, { chance: NaN }, { act: 6 },
      { rarityAttemptMultiplier: 0 }, { rarityAttemptMultiplier: 6 }, { rarityAttemptMultiplier: Infinity }, { typo: true }]) {
      expect(() => validateChapterBossUniques([{ ...row, ...override }])).toThrow();
    }
    expect(() => validateChapterBossUniques([row, row])).toThrow('Duplicate');
    expect(() => validateChapterBossUniques([row, { ...row, treasureClassId: 'loot/other' }])).toThrow('Duplicate');
  });
});
