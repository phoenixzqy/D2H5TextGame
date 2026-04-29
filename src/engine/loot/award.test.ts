/**
 * Award orchestrator tests — focus on determinism and basic plumbing.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createRng } from '../rng';
import type { ItemBase } from '../types/items';
import type { TreasureClass } from './drop-roller';
import { rollKillRewards, rollBatchRewards, type AwardDataPools } from './award';
import { __resetItemSeqForTests } from './item-instance';

const baseShortSword: ItemBase = {
  id: 'wp1h_short_sword',
  name: 'Short Sword',
  type: 'weapon',
  slot: 'weapon',
  reqLevel: 1,
  canHaveAffixes: true
};
const baseHelm: ItemBase = {
  id: 'helm_cap',
  name: 'Cap',
  type: 'armor',
  slot: 'head',
  reqLevel: 1,
  canHaveAffixes: true
};

const tc: TreasureClass = {
  id: 'tc_test',
  picks: [
    { baseId: 'wp1h_short_sword', weight: 100, qlvlMin: 1, qlvlMax: 20 },
    { baseId: 'helm_cap', weight: 100, qlvlMin: 1, qlvlMax: 20 }
  ],
  numPicks: 3,
  noDropChance: 0
};

const pools: AwardDataPools = {
  bases: new Map([
    [baseShortSword.id, baseShortSword],
    [baseHelm.id, baseHelm]
  ]),
  affixes: [
    { id: 'pre.sharp', kind: 'prefix', appliesTo: ['weapon'], stat: 'attack', tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 1, valueMax: 5 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'attack.flat' },
    { id: 'pre.defense', kind: 'prefix', appliesTo: ['armor'], stat: 'defense', tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 1, valueMax: 5 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'defense.flat' },
    { id: 'suf.health', kind: 'suffix', appliesTo: ['weapon', 'armor'], stat: 'life', tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 10, valueMax: 10 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'life.flat' },
    { id: 'suf.warding', kind: 'suffix', appliesTo: ['weapon', 'armor'], stat: 'fireRes', tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 5, valueMax: 5 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'res.fire' }
  ],
  uniques: [
    { id: 'unique.gnarled-root', name: 'Gnarled Root', baseId: 'wp1h_short_sword', reqLevel: 1 }
  ],
  setPieces: [],
  treasureClasses: new Map([[tc.id, tc]])
};

describe('award.rollKillRewards', () => {
  beforeEach(() => { __resetItemSeqForTests(); });

  it('is deterministic for a fixed seed', () => {
    const a = rollKillRewards(
      { tier: 'elite', monsterLevel: 5, treasureClassId: tc.id, magicFind: 100, goldFind: 0, act: 1 },
      pools,
      createRng(123)
    );
    __resetItemSeqForTests();
    const b = rollKillRewards(
      { tier: 'elite', monsterLevel: 5, treasureClassId: tc.id, magicFind: 100, goldFind: 0, act: 1 },
      pools,
      createRng(123)
    );
    expect(b.items.map((i) => ({ baseId: i.baseId, rarity: i.rarity, level: i.level })))
      .toEqual(a.items.map((i) => ({ baseId: i.baseId, rarity: i.rarity, level: i.level })));
    expect(b.runeShards).toBe(a.runeShards);
  });

  it('awards rune-shards even when treasure class is unknown', () => {
    const r = rollKillRewards(
      { tier: 'trash', monsterLevel: 3, treasureClassId: 'tc_missing', magicFind: 0, goldFind: 0, act: 1 },
      pools,
      createRng(7)
    );
    expect(r.items).toEqual([]);
    expect(r.runeShards).toBeGreaterThan(0);
  });

  it('boss kills produce items and rune-shards', () => {
    const r = rollKillRewards(
      { tier: 'boss', monsterLevel: 14, treasureClassId: tc.id, magicFind: 200, goldFind: 50, act: 1 },
      pools,
      createRng(42)
    );
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.runeShards).toBeGreaterThan(0);
  });

  it('mixes rarities at high MF', () => {
    let allWhite = true;
    const r = rollBatchRewards(
      Array.from({ length: 30 }, () => ({
        tier: 'trash' as const,
        monsterLevel: 5,
        treasureClassId: tc.id,
        magicFind: 1000,
        goldFind: 0,
        act: 1 as const
      })),
      pools,
      createRng(2024)
    );
    for (const it of r.items) if (it.rarity !== 'normal') allWhite = false;
    expect(allWhite).toBe(false);
  });

  it('generates valid items with stable ids', () => {
    const r = rollKillRewards(
      { tier: 'elite', monsterLevel: 5, treasureClassId: tc.id, magicFind: 50, goldFind: 0, act: 1 },
      pools,
      createRng(99)
    );
    for (const it of r.items) {
      expect(it.id).toMatch(/^it-/);
      expect(pools.bases.has(it.baseId)).toBe(true);
      expect(it.level).toBe(5);
    }
  });
});
