import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import profileJson from '../quest-rewards/act4-jamella-perfect-gem-v1.json';
import schema from '../schema/quest-table-profile.schema.json';
import { loadJamellaQuestAwardPools, loadJamellaQuestRewardProfile } from './quest-table-rewards';
import { loadTreasureClasses } from './loot';
import { rollQuestTableRewards } from '@/engine/loot/award';
import { createRng } from '@/engine/rng';

const gems = ['amethyst', 'diamond', 'emerald', 'ruby', 'sapphire', 'skull', 'topaz']
  .map(gem => `gems/${gem}/perfect`);

describe('reviewed one-use Jamella perfect-gem profile', () => {
  it('pins the exact seven equal concrete gems and freezes every exposed profile row', () => {
    const profile = loadJamellaQuestRewardProfile();
    expect(profile.input).toEqual({ tableId: 'loot/side-jamella-perfect-gem', ilvl: 51, picks: 1 });
    expect(profile.table.picks.map(pick => pick.itemId)).toEqual(gems);
    for (const value of [profile, profile.input, profile.table, profile.table.picks, ...profile.table.picks]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Reflect.set(profile.input, 'ilvl', 99)).toBe(false);
    expect(profile.input.ilvl).toBe(51);
    expect(loadJamellaQuestRewardProfile()).toBe(profile);
  });

  it.each(['extra-field', 'version', 'table-id', 'level', 'picks', 'order', 'weight', 'quantity', 'quality', 'missing', 'extra-pick'])(
    'rejects %s drift through the closed schema', kind => {
      const profile = structuredClone(profileJson);
      const first = profile.table.picks[0];
      if (!first) throw new Error('Missing authored gem pick');
      if (kind === 'extra-field') Object.assign(profile, { magicFind: 100 });
      else if (kind === 'version') profile.version = 2;
      else if (kind === 'table-id') profile.input.tableId = 'loot/ordinary';
      else if (kind === 'level') profile.input.ilvl = 52;
      else if (kind === 'picks') profile.input.picks = 2;
      else if (kind === 'order') profile.table.picks.reverse();
      else if (kind === 'weight') first.weight = 2;
      else if (kind === 'quantity') first.quantityMax = 2;
      else if (kind === 'quality') first.itemId = 'gems/amethyst/flawless';
      else if (kind === 'missing') profile.table.picks.pop();
      else profile.table.picks.push({ ...first });
      expect(new Ajv2020({ strict: true }).compile(schema)(profile)).toBe(false);
    });

  it('exposes no map mutators, including the forEach callback, without changing ordinary pools', () => {
    const ordinary = loadTreasureClasses();
    const before = [...ordinary];
    const profile = loadJamellaQuestRewardProfile();
    const pools = loadJamellaQuestAwardPools();
    const tables = pools.treasureClasses;
    expect(tables.get(profile.input.tableId)).toBe(profile.table);
    expect(Object.isFrozen(tables)).toBe(true);
    for (const name of ['set', 'delete', 'clear']) expect(Reflect.get(tables, name)).toBeUndefined();
    const receiver = { called: 0 };
    tables.forEach(function (this: typeof receiver, value, key, map) {
      expect(map).toBe(tables);
      expect(map.get(key)).toBe(value);
      expect(Reflect.get(map, 'set')).toBeUndefined();
      this.called += 1;
    }, receiver);
    expect(receiver.called).toBe(tables.size);
    expect([...tables.keys()]).toContain(profile.input.tableId);
    expect([...tables.values()]).toContain(profile.table);
    expect([...tables.entries()]).toEqual([...tables]);
    expect([...ordinary]).toEqual(before);
    expect(ordinary.has(profile.input.tableId)).toBe(false);
  });

  it('uses the existing seeded table walk for one deterministic gem and no other income', () => {
    const { input } = loadJamellaQuestRewardProfile();
    const pools = loadJamellaQuestAwardPools();
    const seen = new Set<string>();
    for (let seed = 0; seed < 64; seed++) {
      const reward = rollQuestTableRewards(input, pools, createRng(seed));
      expect(reward).toEqual(rollQuestTableRewards(input, pools, createRng(seed)));
      expect(reward).toMatchObject({ items: [], runeShards: 0, wishstones: 0, runes: 0, gems: 1 });
      const entries = Object.entries(reward?.materials ?? {});
      expect(entries).toHaveLength(1);
      const first = entries[0];
      if (!first) throw new Error('Missing deterministic gem reward');
      expect(first[1]).toBe(1);
      expect(gems).toContain(first[0]);
      seen.add(first[0]);
    }
    expect([...seen].sort()).toEqual([...gems].sort());
  });
});
