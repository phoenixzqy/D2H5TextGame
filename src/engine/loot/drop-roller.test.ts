import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import {
  effectiveMagicFind,
  rollRarity,
  rollDrops,
  pickTcBase,
  type TreasureClass
} from './drop-roller';
import type { Rarity } from '../types/items';

const sampleTc: TreasureClass = {
  id: 'tc_test',
  picks: [
    { baseId: 'helm_cap', weight: 200, qlvlMin: 1, qlvlMax: 10 },
    { baseId: 'wp1h_short_sword', weight: 250, qlvlMin: 1, qlvlMax: 10 },
    { baseId: 'sh_buckler', weight: 150, qlvlMin: 1, qlvlMax: 10 }
  ],
  numPicks: 1,
  noDropChance: 0
};

describe('drop-roller', () => {
  it('effectiveMagicFind matches reference table', () => {
    expect(effectiveMagicFind(0)).toBe(0);
    expect(effectiveMagicFind(100)).toBe(171);
    expect(effectiveMagicFind(300)).toBe(327);
    expect(effectiveMagicFind(800)).toBe(457);
  });

  it('pickTcBase filters by qlvl', () => {
    const tc: TreasureClass = {
      id: 't',
      picks: [
        { baseId: 'low', weight: 100, qlvlMin: 1, qlvlMax: 5 },
        { baseId: 'high', weight: 100, qlvlMin: 10, qlvlMax: 20 }
      ]
    };
    const r = createRng(1);
    expect(pickTcBase(tc, 3, r)).toBe('low');
    expect(pickTcBase(tc, 15, r)).toBe('high');
    expect(pickTcBase(tc, 7, r)).toBeUndefined();
  });

  it('higher MF produces more non-white drops', () => {
    const trials = 5000;
    function pctNonWhite(mf: number): number {
      const r = createRng(42);
      let nonWhite = 0;
      for (let i = 0; i < trials; i++) {
        const rar = rollRarity(mf, 'trash', r);
        if (rar !== 'normal') nonWhite++;
      }
      return nonWhite / trials;
    }
    const at0 = pctNonWhite(0);
    const at300 = pctNonWhite(300);
    const at1000 = pctNonWhite(1000);
    expect(at300).toBeGreaterThan(at0);
    expect(at1000).toBeGreaterThan(at300);
  });

  it('boss tier produces more uniques than trash', () => {
    const trials = 20000;
    function pctUnique(tier: 'trash' | 'boss'): number {
      const r = createRng(7);
      let n = 0;
      for (let i = 0; i < trials; i++) {
        const rar: Rarity = rollRarity(0, tier, r);
        if (rar === 'unique') n++;
      }
      return n / trials;
    }
    const trash = pctUnique('trash');
    const boss = pctUnique('boss');
    expect(boss).toBeGreaterThan(trash * 5);
  });

  it('rollDrops respects numPicks', () => {
    const r = createRng(11);
    const drops = rollDrops(
      { tc: sampleTc, tier: 'trash', monsterLevel: 5, magicFind: 0 },
      r
    );
    // numPicks=1 with noDrop=0 → exactly 1 drop
    expect(drops.length).toBe(1);
    expect(drops[0]?.ilvl).toBe(5);
  });

  it('determinism: same seed → same drops', () => {
    const a = rollDrops(
      { tc: sampleTc, tier: 'elite', monsterLevel: 5, magicFind: 100 },
      createRng(123)
    );
    const b = rollDrops(
      { tc: sampleTc, tier: 'elite', monsterLevel: 5, magicFind: 100 },
      createRng(123)
    );
    expect(a).toEqual(b);
  });
});
