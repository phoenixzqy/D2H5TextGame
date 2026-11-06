/** BUG680 real-pool material bundles; no earned campaign/balance credit. */
import { afterEach, describe, expect, it } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { materialCatalog, materialEconomy, validateMaterialDefinitions } from '@/data/loaders/materials';
import catalogJson from '@/data/items/materials.json';
import economyJson from '@/data/loot/material-economy.json';
import { createRng, type Rng } from '../rng';
import { rollKillRewards, rollQuestTableRewards } from './award';
import { sampleMaterial } from './materials';
import { rollCurrencyDrops } from './orbs-and-currency';
import { __resetRollItemSeqForTests } from './rollItem';

const pools = loadAwardPools();
afterEach(() => { __resetRollItemSeqForTests(); });

const cases = [
  [1, 14, 1, 1, 6, 7, 2],
  [2, 27, 1, 2, 8, 15, 3],
  [3, 42, 2, 2, 15, 20, 4],
  [4, 57, 2, 3, 18, 21, 5],
  [5, 78, 3, 5, 21, 33, 8]
] as const;

for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
  describe(`chapter-boss exact materials on ${difficulty}`, () => {
    it.each(cases)('Act%i level%i grants its full rune/gem bundle',
      (act, monsterLevel, minRunes, maxRunes, minOrdinal, maxOrdinal, gems) => {
        for (let seed = 0; seed < 8; seed++) {
          const rewards = rollKillRewards({ act, tier: 'chapter-boss', monsterLevel,
            treasureClassId: `loot/act${String(act)}-boss`, magicFind: 0, goldFind: 0, difficulty },
          pools, createRng(seed));
          expect(rewards.gems).toBe(gems);
          expect(rewards.runes).toBeGreaterThanOrEqual(minRunes);
          expect(rewards.runes).toBeLessThanOrEqual(maxRunes);
          let countedRunes = 0, countedGems = 0;
          for (const [id, count] of Object.entries(rewards.materials)) {
            const kind = materialCatalog.get(id)?.kind;
            if (kind === 'rune') {
              countedRunes += count;
              const ordinal = materialEconomy.runeOrder.indexOf(id) + 1;
              expect(ordinal).toBeGreaterThanOrEqual(minOrdinal);
              expect(ordinal).toBeLessThanOrEqual(Math.min(maxOrdinal, difficulty === 'hell' ? 33 : 22));
            } else {
              expect(kind).toBe('gem');
              countedGems += count;
              if (act !== 5 || difficulty !== 'hell') expect(id).not.toContain('/perfect');
            }
          }
          expect(countedRunes).toBe(rewards.runes);
          expect(countedGems).toBe(gems);
        }
      });
  });
}

describe('chapter-boss material boundaries and isolation', () => {
  const last = 1 - Number.EPSILON / 2;

  it.each(cases)('Act%i level%i includes both quantity/identity endpoints and aggregates stacks',
    (act, level, minRunes, maxRunes, minOrdinal, maxOrdinal, gems) => {
      const bundle = materialEconomy.chapterBossMaterials[`loot/act${String(act)}-boss`];
      if (!bundle) throw new Error('Missing authored boss policy');
      for (const difficulty of ['normal', 'hell'] as const) for (const unit of [0, last]) {
        // A complete scripted source is needed: createRng.nextInt owns its PRNG.
        const rng: Rng = { next: () => unit, chance: p => unit < p,
          nextInt: (min, max) => min + Math.floor(unit * (max - min + 1)),
          pick: () => { throw new Error('Unexpected pick'); },
          fork: () => { throw new Error('Unexpected fork'); } };
        const result = rollCurrencyDrops(level, 'chapter-boss', act, difficulty, 0, rng, bundle);
        const ordinal = unit === 0 ? minOrdinal : Math.min(maxOrdinal, difficulty === 'hell' ? 33 : 22);
        const runeId = materialEconomy.runeOrder[ordinal - 1];
        if (!runeId) throw new Error('Missing canonical rune');
        const expectedRunes = unit === 0 ? minRunes : maxRunes;
        expect(result.runes).toBe(expectedRunes);
        expect(result.gems).toBe(gems);
        expect(result.materials[runeId]).toBe(expectedRunes);
        expect(Object.entries(result.materials).filter(([id]) => materialCatalog.get(id)?.kind === 'gem'))
          .toEqual([[sampleMaterial('gem', { act, difficulty, tier: 'chapter-boss' }, unit), gems]]);
        expect(Object.keys(result.materials)).toHaveLength(2);
      }
    });

  it('refuses a configured boss from the wrong actual act before drawing rewards', () => {
    expect(() => rollKillRewards({ act: 2, tier: 'chapter-boss', monsterLevel: 14,
      treasureClassId: 'loot/act1-boss', magicFind: 0, goldFind: 0 }, pools, createRng(7)))
      .toThrow('Mismatched chapter-boss material act');
  });

  it('replaces mixed live materials while retaining explicit quest and other-tier rewards', () => {
    const tc = { id: 'loot/act1-boss', numPicks: 1, noDropChance: 0,
      picks: [{ type: 'rune' as const, itemId: 'runes/zod', weight: 1, qlvlMin: 1, qlvlMax: 99 }] };
    // This fixture isolates mixed materials; it supplies no equipment sources.
    const isolated = { ...pools, treasureClasses: new Map([[tc.id, tc]]), equipmentGuarantees: new Map(),
      chapterBossEquipment: new Map(), chapterBossUniques: new Map() };
    const input = { act: 1 as const, tier: 'chapter-boss' as const, monsterLevel: 14,
      treasureClassId: tc.id, magicFind: 0, goldFind: 0 };
    const live = rollKillRewards(input, isolated, createRng(7));
    expect(live).toMatchObject({ runes: 1, gems: 2 });
    expect(live.materials['runes/zod']).toBeUndefined();
    expect(rollQuestTableRewards({ tableId: tc.id, ilvl: 14, picks: 3 }, isolated, createRng(7)))
      .toMatchObject({ runes: 3, gems: 0, materials: { 'runes/zod': 3 } });
    expect(rollKillRewards({ ...input, tier: 'boss' }, isolated, createRng(7)))
      .toMatchObject({ runes: 2, gems: 1, materials: { 'runes/zod': 1 } });
    const other = { ...tc, id: 'loot/unconfigured-boss' };
    expect(rollKillRewards({ ...input, treasureClassId: other.id },
      { ...isolated, treasureClasses: new Map([[other.id, other]]) }, createRng(7)))
      .toMatchObject({ runes: 2, gems: 1, materials: { 'runes/zod': 1 } });
    expect(tc.picks).toHaveLength(1);
  });

  it('rejects malformed, gem-only and empty capped rune bands', () => {
    const context = { act: 1, difficulty: 'normal', tier: 'chapter-boss' } as const;
    for (const [minimum, maximum] of [[0, 7], [6, 34], [7, 6], [1.5, 7], [NaN, 7]] as const) {
      expect(() => sampleMaterial('rune', context, 0, { minimum, maximum }))
        .toThrow('Invalid rune ordinal band');
    }
    expect(() => sampleMaterial('gem', context, 0, { minimum: 6, maximum: 7 }))
      .toThrow('Invalid rune ordinal band');
    expect(() => sampleMaterial('rune', context, 0, { minimum: 21, maximum: 33 }))
      .toThrow('Empty or invalid material pool');
  });

  it('refuses incomplete, misspelled and unbounded authored bundle shapes', () => {
    const policy = economyJson.chapterBossMaterials, row = policy['loot/act1-boss'];
    const { gemQuantity: _gemQuantity, ...incomplete } = row;
    for (const invalid of [{ ...row, gemQuantity: 0 }, { ...row, gemQuantity: 9 },
      { ...row, runeQuantityMin: 1.5 }, { ...row, runeQuantityMax: 6 },
      { ...row, runeMinOrdinal: 0 }, { ...row, runeMaxOrdinal: 34 },
      { ...row, typo: 1 }, incomplete]) {
      expect(() => validateMaterialDefinitions(catalogJson, { ...economyJson,
        chapterBossMaterials: { ...policy, 'loot/act1-boss': invalid } })).toThrow('Invalid material definitions');
    }
    expect(() => validateMaterialDefinitions(catalogJson, { ...economyJson, chapterBossMaterials: {} }))
      .toThrow('Invalid material definitions');
    expect(() => validateMaterialDefinitions(catalogJson, { ...economyJson,
      chapterBossMaterials: { ...policy, 'loot/not-authored': row } })).toThrow('Invalid material definitions');
  });

  it('refuses structurally valid policy conflicts and ranges unavailable outside Hell', () => {
    const policy = economyJson.chapterBossMaterials, row = policy['loot/act1-boss'];
    for (const invalid of [{ ...row, act: 2 }, { ...row, runeQuantityMin: 3, runeQuantityMax: 2 },
      { ...row, runeMinOrdinal: 7, runeMaxOrdinal: 6 }, { ...row, runePoolAct: 1, runeMaxOrdinal: 9 },
      { ...row, runePoolAct: 5, runeMinOrdinal: 23, runeMaxOrdinal: 33 }]) {
      expect(() => validateMaterialDefinitions(catalogJson, { ...economyJson,
        chapterBossMaterials: { ...policy, 'loot/act1-boss': invalid } }))
        .toThrow('Inconsistent chapter-boss material bundle');
    }
  });
});
