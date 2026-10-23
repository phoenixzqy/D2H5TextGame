import { describe, expect, it } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { createRng } from '../rng';
import { rollItem } from './rollItem';
import type { KillRewards } from './award';
import { mergeRewards, planRewardGrant } from './reward-plan';

const empty = (): KillRewards => ({ items: [], runeShards: 0, wishstones: 0, runes: 0, gems: 0, materials: {} });
const bag = (): KillRewards => ({ ...empty(), runeShards: 17, wishstones: 3, runes: 2, gems: 1,
  materials: { 'runes/ral': 2, 'gems/ruby/chipped': 1, 'materials/scrap': 4 } });
const destination = () => ({ backpack: [], stash: [], equipped: {}, mercEquipment: {}, currencies: { 'rune-shard': 10, wishstone: 5,
  'gem-shard': 40, 'historical-token': -1.25 }, materials: { 'runes/ral': 3 } });

describe('whole reward planning', () => {
  it('merges concrete counts and descriptive totals without mutating any bag', () => {
    const a = bag(), before = structuredClone(a);
    expect(mergeRewards(a, a)).toEqual({ ...a, runeShards: 34, wishstones: 6, runes: 4, gems: 2,
      materials: { 'runes/ral': 4, 'gems/ruby/chipped': 2, 'materials/scrap': 8 } });
    expect(a).toEqual(before);
    expect(mergeRewards()).toEqual(empty());
  });

  it('credits only actual shards, wishstones and material identities, preserving all legacy balances', () => {
    const into = destination(), before = structuredClone(into);
    expect(planRewardGrant(bag(), into)).toEqual({ backpack: [],
      currencies: { ...into.currencies, 'rune-shard': 27, wishstone: 8 },
      materials: { 'runes/ral': 5, 'gems/ruby/chipped': 1, 'materials/scrap': 4 } });
    expect(into).toEqual(before);
  });

  it('does not manufacture zero currency keys on an empty grant', () => {
    expect(planRewardGrant(empty(), { ...destination(), currencies: {}, materials: {} }))
      .toEqual({ backpack: [], currencies: {}, materials: {} });
  });

  it.each(['runeShards', 'wishstones', 'runes', 'gems'] as const)('refuses unsafe %s and aggregate overflow', field => {
    for (const amount of [-1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => mergeRewards({ ...empty(), [field]: amount })).toThrow();
    }
    const max = { ...empty(), [field]: Number.MAX_SAFE_INTEGER,
      ...(field === 'runes' ? { materials: { 'runes/ral': Number.MAX_SAFE_INTEGER } } : {}),
      ...(field === 'gems' ? { materials: { 'gems/ruby/chipped': Number.MAX_SAFE_INTEGER } } : {}) };
    const one = { ...empty(), [field]: 1,
      ...(field === 'runes' ? { materials: { 'runes/ral': 1 } } : {}),
      ...(field === 'gems' ? { materials: { 'gems/ruby/chipped': 1 } } : {}) };
    expect(() => mergeRewards(max, one)).toThrow();
  });

  it.each([
    { ...empty(), materials: { 'runes/ral': 1 } },
    { ...empty(), runes: 1 },
    { ...empty(), materials: { 'gems/ruby/chipped': 1 } },
    { ...empty(), gems: 1 },
    { ...empty(), materials: { 'runes/unknown': 1 } },
    { ...empty(), materials: { 'materials/scrap': 0 } }
  ])('refuses the whole malformed or inconsistent bag %j', invalid => {
    const into = destination(), before = structuredClone(into);
    expect(() => planRewardGrant(invalid, into)).toThrow();
    expect(into).toEqual(before);
  });

  it.each(['rune-shard', 'wishstone', 'runes/ral'] as const)('preflights destination %s overflow before publishing anything', id => {
    const into = destination();
    if (id === 'runes/ral') into.materials[id] = Number.MAX_SAFE_INTEGER;
    else into.currencies[id] = Number.MAX_SAFE_INTEGER;
    const before = structuredClone(into);
    expect(() => planRewardGrant(bag(), into)).toThrow();
    expect(into).toEqual(before);
  });

  it('refuses a reward ID already owned outside the backpack', () => {
    const pools = loadAwardPools(), baseId = pools.bases.keys().next().value;
    if (!baseId) throw new Error('Missing production item base');
    const item = rollItem({ baseId, rarity: 'normal', ilvl: 1 }, pools, createRng(41));
    if (!item) throw new Error('Missing production item');
    for (const ownership of [{ stash: [item] }, { equipped: { weapon: item } },
      { mercEquipment: { rogue: { weapon: item } } }]) {
      const into = { ...destination(), stash: [], equipped: {}, mercEquipment: {}, ...ownership };
      expect(() => planRewardGrant({ ...empty(), items: [item] }, into)).toThrow(/duplicate/i);
    }
  });

  it('keeps earned gear recoverable beyond backpack capacity and rejects duplicate ownership', () => {
    const pools = loadAwardPools(), baseId = pools.bases.keys().next().value;
    if (!baseId) throw new Error('Missing production item base');
    const item = rollItem({ baseId, rarity: 'normal', ilvl: 1 }, pools, createRng(41));
    if (!item) throw new Error('Missing production item');
    const owned = Array.from({ length: 100 }, (_, index) => ({ ...item, id: `owned-${String(index)}` }));
    const grant = { ...empty(), items: [item] };
    expect(planRewardGrant(grant, { ...destination(), backpack: owned, currencies: {}, materials: {} }).backpack)
      .toEqual([...owned, item]);
    expect(() => mergeRewards(grant, grant)).toThrow(/duplicate/i);
    expect(() => planRewardGrant(grant, { ...destination(), backpack: [item], currencies: {}, materials: {} })).toThrow(/duplicate/i);
  });
});
