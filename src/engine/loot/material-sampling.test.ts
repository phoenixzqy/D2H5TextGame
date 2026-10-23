import { describe, expect, it } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { materialCatalog } from '@/data/loaders/materials';
import { createRng, type Rng } from '../rng';
import { rollCurrencyDrops } from './orbs-and-currency';
import { rollDrops, type TcPick, type TreasureClass } from './drop-roller';
import { rollKillRewards, rollQuestTableRewards } from './award';

function scripted(values: number[]) {
  let count = 0;
  const next = () => {
    const value = values[count++];
    if (value === undefined) throw new Error('Unexpected additional RNG draw');
    return value;
  };
  const rng: Rng = { next, chance: p => next() < p,
    nextInt: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: () => { throw new Error('Unexpected pick'); }, fork: () => { throw new Error('Unexpected fork'); } };
  return { rng, count: () => count };
}

describe('identity sampling preserves production RNG draws', () => {
  it('uses the successful gate residual for an actual trash rune and gem', () => {
    const source = scripted([.005, .014, .5]);
    expect(rollCurrencyDrops(10, 'trash', 1, 'normal', 0, source.rng)).toEqual({
      runeShards: 50, wishstones: 0, runes: 1, gems: 1,
      materials: { 'runes/ith': 1, 'gems/topaz/chipped': 1 }
    });
    expect(source.count()).toBe(3);
  });

  it('keeps strict gate boundaries and still consumes both unsuccessful gate draws', () => {
    const source = scripted([.006, .015, .5]);
    expect(rollCurrencyDrops(10, 'trash', 1, 'normal', 0, source.rng)).toEqual({
      runeShards: 50, wishstones: 0, runes: 0, gems: 0, materials: {}
    });
    expect(source.count()).toBe(3);
  });

  it('keeps the champion wishstone gate first, then two identity gates and shard variance', () => {
    const source = scripted([.3999, 0, 0, .5]);
    expect(rollCurrencyDrops(10, 'champion', 1, 'normal', 0, source.rng)).toEqual({
      runeShards: 200, wishstones: 1, runes: 1, gems: 1,
      materials: { 'runes/el': 1, 'gems/amethyst/chipped': 1 }
    });
    expect(source.count()).toBe(4);
  });

  it('boss probability one samples the full conditional pool without extra draws', () => {
    const source = scripted([1 - Number.EPSILON / 2, 1 - Number.EPSILON / 2, .5]);
    expect(rollCurrencyDrops(10, 'boss', 5, 'hell', 0, source.rng)).toEqual({
      runeShards: 2500, wishstones: 60, runes: 1, gems: 1,
      materials: { 'runes/zod': 1, 'gems/topaz/perfect': 1 }
    });
    expect(source.count()).toBe(3);
  });

  it('does not repeat a constant fork sequence on successive kills', () => {
    const rng = createRng(41);
    const results = Array.from({ length: 12 }, () => rollCurrencyDrops(22, 'boss', 5, 'hell', 0, rng));
    expect(new Set(results.map(result => JSON.stringify(result.materials))).size).toBeGreaterThan(1);
  });
});

const generic = (type: 'rune' | 'gem', weight = 1): TcPick => ({ type, weight, qlvlMin: 1, qlvlMax: 99 });
function table(picks: readonly TcPick[], materialPoolId?: string): TreasureClass {
  // New table metadata is intentionally introduced through data-shaped input.
  return { id: 'loot/material-test', picks, numPicks: 1, noDropChance: 0,
    ...(materialPoolId ? { materialPoolId } : {}) };
}
function roll(tc: TreasureClass, values: number[], monsterLevel = 22) {
  const source = scripted(values);
  return { drops: rollDrops({ tc, tier: 'boss', monsterLevel, magicFind: 0 }, source.rng), source };
}

describe('generic TC conditional identities and authored context', () => {
  it('preserves legacy <= entry selection at the shared boundary and clamps residual one', () => {
    const { drops, source } = roll(table([generic('rune'), generic('gem')], 'act1-normal'), [.5, .5, .9]);
    expect(drops).toEqual([{ kind: 'direct', currency: 'runes', quantity: 1, itemId: 'runes/ral', ilvl: 22 }]);
    expect(source.count()).toBe(3);
  });

  it('samples the next interval from its normalized residual without a new draw', () => {
    const { drops, source } = roll(table([generic('rune'), generic('gem')], 'act5-hell'), [.5, .999999, .9]);
    expect(drops).toEqual([{ kind: 'direct', currency: 'gems', quantity: 1, itemId: 'gems/topaz/perfect', ilvl: 22 }]);
    expect(source.count()).toBe(3);
  });

  it('ignores zero and negative weights instead of selecting a zero-weight entry at u=0', () => {
    expect(roll(table([generic('gem', 0), generic('gem', -1), generic('rune')], 'act1-normal'), [.5, 0, .9]).drops)
      .toEqual([{ kind: 'direct', currency: 'runes', quantity: 1, itemId: 'runes/el', ilvl: 22 }]);
  });

  it('refuses selected generic entries without authored context, without inferring from the id or level', () => {
    const pools = loadAwardPools();
    const tc = { ...table([generic('rune')]), id: 'loot/act5-boss' };
    expect(rollQuestTableRewards({ tableId: tc.id, ilvl: 82, picks: 1 },
      { ...pools, treasureClasses: new Map([[tc.id, tc]]) }, createRng(41))).toBeUndefined();
  });

  it('keeps explicit Zod in an Act I cache as authored, independent of pool caps', () => {
    const pools = loadAwardPools(), tc = table([{ ...generic('rune'), itemId: 'runes/zod' }], 'act1-normal');
    expect(rollQuestTableRewards({ tableId: tc.id, ilvl: 12, picks: 1 },
      { ...pools, treasureClasses: new Map([[tc.id, tc]]) }, createRng(41)))
      .toMatchObject({ runes: 1, materials: { 'runes/zod': 1 } });
  });

  it('overrides a shared authored Normal table with actual live Act V Hell context', () => {
    const pools = loadAwardPools(), tc = table([generic('rune')], 'act1-normal');
    const source = scripted([.5, 1 - Number.EPSILON / 2, .9, 0, 0, .5]);
    expect(rollKillRewards({ tier: 'boss', monsterLevel: 22, act: 5, difficulty: 'hell',
      treasureClassId: tc.id, magicFind: 0, goldFind: 0 },
    { ...pools, treasureClasses: new Map([[tc.id, tc]]) }, source.rng))
      .toMatchObject({ runes: 2, gems: 1, materials: {
        'runes/zod': 1, 'runes/el': 1, 'gems/amethyst/normal': 1
      } });
    expect(source.count()).toBe(6);
  });

  it('authored generic production tables all have valid catalog outcomes', () => {
    for (const tc of loadAwardPools().treasureClasses.values()) {
      const picks = tc.picks.filter(p => (p.type === 'rune' || p.type === 'gem') && p.itemId === undefined);
      for (const pick of picks) {
        const result = roll({ ...tc, picks: [pick], numPicks: 1, noDropChance: 0 }, [.5, .5, .5], pick.qlvlMin).drops[0];
        expect(result?.kind).toBe('direct');
        if (result?.kind !== 'direct') throw new Error('Missing generic material');
        expect(materialCatalog.has(result.itemId ?? '')).toBe(true);
      }
    }
  });
});
