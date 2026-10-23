import { describe, expect, it, vi } from 'vitest';
import { loadAffixPool, loadItemBases } from '@/data/loaders/loot';
import { createRng } from '../rng';
import type { Affix } from '../types/items';
import { prepareRareAffixPair } from './rollItem';

describe('same-instance caster affix planner', () => {
  const base = loadItemBases().get('items/base/amu-tin');
  if (!base) throw new Error('Missing amulet fixture');
  it('rolls exactly one legal modern prefix and suffix deterministically at source level', () => {
    const affixes = loadAffixPool();
    const plan = prepareRareAffixPair(base, 25, affixes);
    const first = plan(createRng(901));
    expect(first).toEqual(plan(createRng(901)));
    expect(first).toHaveLength(2);
    for (const [index, roll] of first.entries()) {
      const def = affixes.find(row => row.id === roll.id), tier = def?.tiers[roll.tier];
      expect(def?.kind).toBe(index ? 'suffix' : 'prefix');
      expect(def?.appliesTo.length === 0 || def?.appliesTo.includes(base.type)).toBe(true);
      expect(tier?.ilvlMin).toBeLessThanOrEqual(25); expect(tier?.ilvlMax).toBeGreaterThanOrEqual(25);
      expect(roll.rolledValue).toBeGreaterThanOrEqual(tier?.valueMin ?? Infinity);
      expect(roll.rolledValue).toBeLessThanOrEqual(tier?.valueMax ?? -Infinity);
    }
  });
  it('refuses missing legal weighted pools before any random output is requested', () => {
    const pool = loadAffixPool();
    for (const affixes of [[], pool.filter(row => row.kind === 'prefix'), pool.map(row => ({ ...row, rarityWeights: {} }))]) {
      expect(() => prepareRareAffixPair(base, 25, affixes)).toThrow();
    }
    expect(() => prepareRareAffixPair(base, 0, pool)).toThrow();
    expect(() => prepareRareAffixPair({ ...base, canHaveAffixes: false }, 25, pool)).toThrow();
  });
  it('uses rare weights, level legality and existing weighted selection without rerolling an item', () => {
    const row = (id: string, kind: 'prefix' | 'suffix', weight: number): Affix => ({ id, kind, i18nKey: id,
      stat: 'mana', appliesTo: ['jewelry'], rarityWeights: { rare: weight },
      tiers: [{ ilvlMin: 20, ilvlMax: 30, valueMin: 11, valueMax: 11 }] });
    const rng = { ...createRng(1), next: vi.fn(() => .8) };
    expect(prepareRareAffixPair(base, 25, [row('prefix/a', 'prefix', 1), row('prefix/b', 'prefix', 3),
      row('suffix/a', 'suffix', 1)])(rng)).toEqual([
      { id: 'prefix/b', tier: 0, rolledValue: 11 }, { id: 'suffix/a', tier: 0, rolledValue: 11 }
    ]);
    expect(rng.next).toHaveBeenCalledTimes(2);
    expect(() => prepareRareAffixPair(base, 19, [row('prefix/a', 'prefix', 1), row('suffix/a', 'suffix', 1)])).toThrow();
  });
});
