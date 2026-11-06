import { describe, expect, it } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { createRng } from '../rng';
import { rollQuestTableRewards } from './award';
function required<T>(value: T | undefined): T { if (value === undefined) throw new Error('Missing authored cache'); return value; }
const pools = loadAwardPools();

describe('all authored Act IV quest cache outcomes', () => {
  for (const [tableId, ilvl, count] of [['loot/hellforge-runes', 56, 8], ['loot/diablo-q', 61, 14]] as const) {
    const table = required(pools.treasureClasses.get(tableId));
    it(`materializes all ${String(count)} authored outcomes from ${tableId} within their level gates`, () => {
      expect(table.picks).toHaveLength(count);
      for (const pick of table.picks) {
        // Force each authored outcome without changing its eligibility, identity, quantity or rarity.
        const selectedPools = {
          ...pools, treasureClasses: new Map([[tableId, { ...table, picks: [pick] }]])
        };
        const eligibleLevel = Math.max(pick.qlvlMin, Math.min(ilvl, pick.qlvlMax));
        if (eligibleLevel !== ilvl) {
          expect(rollQuestTableRewards({ tableId, ilvl, picks: 1 }, selectedPools, createRng(41))).toBeUndefined();
        }
        const result = required(rollQuestTableRewards({ tableId, ilvl: eligibleLevel, picks: 1 }, selectedPools, createRng(41)));
        if (pick.type === 'item') {
          const item = required(result.items[0]); expect(result.items).toHaveLength(1);
          expect(item.baseId).toBe(pick.baseId); expect(item.rarity).toBe(pick.rarity); expect(item.ilvl).toBe(eligibleLevel);
          if (item.baseId === 'items/base/wp2h-thunder-maul') expect(item.rarity).toBe('rare');
        } else {
          expect(result.items).toHaveLength(0);
          if (pick.type === 'rune') expect(result.runes).toBe(1);
          else if (pick.type === 'gold') {
            expect(result.runeShards).toBeGreaterThanOrEqual(50000); expect(result.runeShards).toBeLessThanOrEqual(120000);
          }
        }
      }
    });
  }
  it('materializes every eligible level61 armet unique without downgrading or admitting level62+ templates', () => {
    const tableId = 'loot/diablo-q', table = required(pools.treasureClasses.get(tableId));
    const pick = required(table.picks.find(row => row.type === 'item' && row.rarity === 'unique'));
    const eligible = required(pools.uniques).filter(row => row.baseId === 'items/base/helm-armet' && (row.qlvl ?? row.reqLevel) <= 61);
    expect(eligible).toHaveLength(6);
    for (const template of eligible) {
      const result = required(rollQuestTableRewards({ tableId, ilvl: 61, picks: 1 }, {
        ...pools, uniques: [template], treasureClasses: new Map([[tableId, { ...table, picks: [pick] }]])
      }, createRng(17)));
      expect(result.items[0]?.uniqueId).toBe(template.id); expect(result.items[0]?.rarity).toBe('unique'); expect(result.items[0]?.ilvl).toBe(61);
    }
    expect(eligible.some(row => /steelshade|crown-of-ages|griffon/.test(row.id))).toBe(false);
  });
});
