/** Constructed content contracts; no campaign replay, earned acquisition or balance credit. */
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import policy from '../../../tests/fixtures/sword-progression-v1.json';
import { loadAwardPools } from '@/data/loaders/loot';
import rawTables from '@/data/loot/treasure-classes.json';
import dropSchema from '@/data/schema/drop-table.schema.json';
import { createRng } from '../rng';
import { rollKillRewards } from './award';

const pools = loadAwardPools();
const ids = new Set(policy.tiers.map(tier => tier.baseId));
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing ordinary sword tier');
  return value;
}

describe('BUG660 missing ordinary sword tiers', () => {
  it.each(policy.tables)('$id offers exactly the declared equip-eligible missing tiers', row => {
    const table = required(pools.treasureClasses.get(row.id));
    const picks = table.picks.filter(pick => ids.has(pick.baseId ?? ''));
    for (let level = row.minLevel; level <= row.maxLevel; level++) {
      const expected = policy.tiers.filter(tier => tier.from <= level && level <= tier.to);
      const eligible = picks.filter(pick => pick.qlvlMin <= level && level <= pick.qlvlMax);
      expect(eligible.map(pick => pick.baseId), `${row.id}/L${String(level)}`)
        .toEqual(expected.map(tier => tier.baseId));
      for (const pick of eligible) {
        expect(pick.weight).toBe(row.weightPerFamily);
        // BUG678 restores random ordinary rarity; fixed quest caches retain guarantees.
        expect(pick.rarity).toBe(row.id.endsWith('-q') ? row.rarity : undefined);
        const base = required(pools.bases.get(required(pick.baseId)));
        expect(base.reqLevel).toBeLessThanOrEqual(level);
        expect(base).toMatchObject({ weaponType: 'sword', handedness: 'oneHanded' });
      }
    }
    for (const level of [row.minLevel - 1, row.maxLevel + 1, 123]) {
      expect(picks.filter(pick => pick.qlvlMin <= level && level <= pick.qlvlMax)).toEqual([]);
    }
  });

  it.each(policy.tables)('$id materializes each declared tier through native seeded rewards', row => {
    const table = required(pools.treasureClasses.get(row.id));
    const questActs: Record<string, number> = { 'loot/duriel-q': 2, 'loot/mephisto-q': 3, 'loot/diablo-q': 4 };
    const act = Number(/act([1-5])/.exec(row.id)?.[1] ?? required(questActs[row.id])) as 1 | 2 | 3 | 4 | 5;
    for (const tier of policy.tiers) {
      const level = Math.max(row.minLevel, tier.from);
      if (level > Math.min(row.maxLevel, tier.to)) continue;
      const pick = required(table.picks.find(pick => pick.baseId === tier.baseId));
      // Availability is proved above. Isolate this real pick to test materialization,
      // without searching seeds or claiming a production acquisition probability.
      const rewards = rollKillRewards({ act, monsterLevel: level, tier: 'chapter-boss',
        treasureClassId: row.id, magicFind: 0, goldFind: 0 }, {
        ...pools, treasureClasses: new Map([[row.id, { ...table, picks: [pick] }]])
      }, createRng(3286157777));
      expect(rewards.items.length).toBeGreaterThan(0);
      const base = required(pools.bases.get(tier.baseId));
      for (const item of rewards.items) {
        expect(item).toMatchObject({ baseId: tier.baseId, ilvl: level });
        expect(row.id.endsWith('-q') ? [row.rarity] : ['normal', 'magic', 'rare', 'set', 'unique'])
          .toContain(item.rarity);
        expect(item.baseRolls?.attack).toBeGreaterThanOrEqual(required(base.baseDamage).min);
        expect(item.baseRolls?.attack).toBeLessThanOrEqual(required(base.baseDamage).max);
      }
    }
  });

  it('keeps strict table shapes and exactly34 additions in24 ordinary tables', () => {
    const validate = new Ajv2020({ strict: true }).compile(dropSchema);
    expect(policy.tables).toHaveLength(24);
    let total = 0;
    for (const row of policy.tables) {
      const raw = required(rawTables.find(table => table.id === row.id));
      expect(validate(raw), JSON.stringify(validate.errors)).toBe(true);
      total += raw.entries.filter(entry => ids.has(entry.itemBase ?? '')).length;
    }
    expect(total).toBe(34);
  });
});
