import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRng } from '../rng';
import { __resetRollItemSeqForTests } from './rollItem';
import * as itemRoll from './rollItem';
import { isQuestTableRewardInput, rollQuestTableRewards, type AwardDataPools } from './award';
import type { TcPick, TreasureClass } from './drop-roller';

const profile = { tableId: 'loot/test-cache', ilvl: 32, picks: 5 };
const currency = (type: NonNullable<TcPick['type']>, amount = 3): TcPick => ({
  type, weight: 1, qlvlMin: 1, qlvlMax: 99, quantityMin: amount, quantityMax: amount
});
function pools(picks: readonly TcPick[], overrides: Partial<TreasureClass> = {}): AwardDataPools {
  return { bases: new Map([['items/base/test', { id: 'items/base/test', name: 'Test', type: 'weapon',
    slot: 'weapon', reqLevel: 1, canHaveAffixes: true }]]), affixes: [],
    treasureClasses: new Map([[profile.tableId, { id: profile.tableId, picks, ...overrides }]]) };
}
beforeEach(() => { __resetRollItemSeqForTests(); vi.restoreAllMocks(); });

describe('explicit quest table, without independent kill income', () => {
  it.each([
    'loot/test-cache', null, {}, { ...profile, ilvl: 0 }, { ...profile, picks: 0 },
    { ...profile, picks: 1.2 }, { ...profile, ilvl: Number.MAX_SAFE_INTEGER + 1 },
    { ...profile, picks: Infinity }, { ...profile, tableId: '../cache' },
    { ...profile, magicFind: 1 }
  ])('rejects malformed runtime profile %j', value => {
    expect(isQuestTableRewardInput(value)).toBe(false);
  });

  it('accepts only the closed authored profile', () => {
    expect(isQuestTableRewardInput(profile)).toBe(true);
    expect(isQuestTableRewardInput(Object.create(profile))).toBe(false);
  });

  it.each([
    ['rune', 'runes'], ['gem', 'gems'], ['gold', 'runeShards']
  ] as const)('selects %s with replacement and pays only table %s', (type, target) => {
    const rewards = rollQuestTableRewards(profile, pools([currency(type)], { numPicks: 1, noDropChance: 1 }), createRng(8));
    expect(rewards).toEqual({ items: [], runes: 0, gems: 0, runeShards: 0, wishstones: 0, [target]: 15 });
  });

  it('retains explicit wishstone interpretation without secondary drops', () => {
    expect(rollQuestTableRewards(profile, pools([{ ...currency('currency'), itemId: 'currency/wishstone' }]), createRng(8)))
      .toEqual({ items: [], runes: 0, gems: 0, runeShards: 0, wishstones: 15 });
  });

  it.each(['unknown', 'empty', 'ineligible', 'zero-weight', 'missing-base', 'zero-quantity'] as const)(
    'refuses the whole %s table', kind => {
      const pick = kind === 'missing-base'
        ? { type: 'item' as const, baseId: 'absent', weight: 1, qlvlMin: 1, qlvlMax: 99 }
        : { ...currency('rune', kind === 'zero-quantity' ? 0 : 1),
          qlvlMin: kind === 'ineligible' ? 40 : 1, weight: kind === 'zero-weight' ? 0 : 1 };
      const data = kind === 'unknown' ? { ...pools([]), treasureClasses: new Map() }
        : pools(kind === 'empty' ? [] : [pick]);
      expect(rollQuestTableRewards(profile, data, createRng(12))).toBeUndefined();
    });

  it('refuses failed materialization after earlier items without returning a partial bag', () => {
    const original = itemRoll.rollItem;
    vi.spyOn(itemRoll, 'rollItem').mockImplementationOnce(original).mockReturnValueOnce(undefined);
    const data = pools([{ type: 'item', baseId: 'items/base/test', rarity: 'rare', weight: 1, qlvlMin: 1, qlvlMax: 99 }]);
    expect(rollQuestTableRewards(profile, data, createRng(12))).toBeUndefined();
  });

  it('keeps forced rarity, item level and deterministic properties while permitting allocator gaps', () => {
    const data = pools([{ type: 'item', baseId: 'items/base/test', rarity: 'rare', weight: 1, qlvlMin: 1, qlvlMax: 99 }]);
    const first = rollQuestTableRewards(profile, data, createRng(72));
    const second = rollQuestTableRewards(profile, data, createRng(72));
    expect(first?.items).toHaveLength(5); expect(second?.items).toHaveLength(5);
    expect(first?.items.every(item => item.rarity === 'rare' && item.ilvl === 32)).toBe(true);
    const properties = (items = first?.items) => items?.map(item => ({ ...item, id: '' }));
    expect(properties(second?.items)).toEqual(properties());
    expect(first?.items.map(item => item.id)).not.toEqual(second?.items.map(item => item.id));
  });
});
