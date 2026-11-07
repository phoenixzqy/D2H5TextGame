import { describe, expect, it } from 'vitest';
import { loadItemBases } from '@/data/loaders/loot';
import type { Item } from '../types/items';
import type { KillRewards } from './award';
import { DEFAULT_LOOT_FILTER, filterGeneratedLoot, type LootFilterSettings } from './filter';
import { planRewardGrant } from './reward-plan';

const item = (id: string, rarity: Item['rarity'] = 'normal', ilvl = 20): Item => ({
  id, baseId: 'items/base/helm-cap', rarity, level: 1, ilvl,
  identified: true, equipped: false, socketCapacity: 0
});
const bag = (items: Item[]): KillRewards => ({ items, runeShards: 2, wishstones: 1,
  runes: 1, gems: 1, materials: { 'runes/ral': 1, 'gems/ruby/chipped': 1 } });
const filter: LootFilterSettings = { ...DEFAULT_LOOT_FILTER, enabled: true,
  actions: { normal: 'salvage', magic: 'discard', rare: 'keep', unique: 'keep', set: 'keep' } };
const bases = loadItemBases();

describe('new equipment loot filter', () => {
  it('keeps all loot by default and while disabled', () => {
    const rewards = bag([item('normal'), item('magic', 'magic')]);
    expect(filterGeneratedLoot(rewards, undefined, bases).rewards).toEqual(rewards);
    expect(filterGeneratedLoot(rewards, { ...filter, enabled: false }, bases).rewards).toEqual(rewards);
  });

  it('salvages and discards selected rarities while preserving material and currency drops', () => {
    const rare = item('rare', 'rare'), rewards = bag([item('normal'), item('magic', 'magic'), rare]);
    const before = structuredClone(rewards);
    const result = filterGeneratedLoot(rewards, filter, bases);
    expect(result).toEqual({ salvaged: 1, discarded: 1,
      rewards: { ...rewards, items: [rare], materials: { ...rewards.materials, 'materials/scrap': 1 } } });
    expect(rewards).toEqual(before);
  });

  it('uses an inclusive item-level cutoff and legacy level fallback', () => {
    const boundary = item('boundary', 'normal', 20), higher = item('higher', 'normal', 21);
    const { ilvl: _omit, ...legacy } = { ...item('legacy'), level: 21 };
    expect(filterGeneratedLoot(bag([boundary, higher, legacy]), { ...filter, maxItemLevel: 20 }, bases).rewards.items)
      .toEqual([higher, legacy]);
    expect(filterGeneratedLoot(bag([higher]), filter, bases).rewards.materials['materials/scrap']).toBe(2);
  });

  it('requires explicit unique/set disposal and retains invested or non-equipment items', () => {
    const special = [item('unique', 'unique'), item('set', 'set'), item('word', 'runeword'),
      { ...item('inserted'), socketCapacity: 1, socketContents: [{ kind: 'rune' as const, id: 'runes/ral' }] },
      { ...item('named'), personalizedBy: { characterId: 'hero', name: 'Hero' } },
      { ...item('equipped'), equipped: true }, { ...item('unknown'), baseId: 'unknown' },
      { ...item('rune'), baseId: 'runes/ral' }];
    expect(filterGeneratedLoot(bag(special), filter, bases).rewards.items).toEqual(special);
    const explicit = { ...filter, actions: { ...filter.actions, unique: 'salvage' as const, set: 'discard' as const } };
    expect(filterGeneratedLoot(bag(special), explicit, bases)).toMatchObject({ salvaged: 1, discarded: 1,
      rewards: { items: special.slice(2), materials: { 'materials/scrap': 6 } } });
  });

  it('keeps malformed levels and rejects unsafe filter settings before removing anything', () => {
    const invalid = [0, NaN, Infinity, 1.5].map((level, index) => item(`invalid-${String(index)}`, 'normal', level));
    expect(filterGeneratedLoot(bag(invalid), filter, bases).rewards.items).toEqual(invalid);
    for (const maxItemLevel of [-1, 0.5, NaN, Infinity]) {
      expect(() => filterGeneratedLoot(bag([item('one')]), { ...filter, maxItemLevel }, bases)).toThrow();
    }
  });

  it('does not let filtered duplicates bypass the whole generated bag preflight', () => {
    const incoming = item('owned');
    expect(() => planRewardGrant(bag([incoming]), { backpack: [incoming], stash: [], equipped: {},
      mercEquipment: {}, currencies: {}, materials: {} })).toThrow(/duplicate/i);
  });
});
