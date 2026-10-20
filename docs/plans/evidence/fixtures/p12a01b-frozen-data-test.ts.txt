import { beforeEach, describe, expect, it } from 'vitest';
import { createRng } from '../../engine/rng';
import { resolveStatPackage } from '../../engine/items/statRolls';
import { __resetRollItemSeqForTests, rollUniqueItem, type ItemRollPools } from '../../engine/loot/rollItem';
import { loadItemBases, loadUniques } from '../loaders/loot';

describe('exact unique materialization from the complete production catalog', () => {
  beforeEach(() => { __resetRollItemSeqForTests(); });
  const pools: ItemRollPools = { bases: loadItemBases(), uniques: loadUniques(), affixes: [] };

  it.each([
    { uniqueId: 'items/unique/pelta-lunata', baseId: 'items/base/sh-buckler', ilvl: 2, defense: [5, 7] },
    { uniqueId: 'items/unique/coif-of-glory', baseId: 'items/base/helm-skull-cap', ilvl: 9, defense: [10, 14] }
  ])('materializes exact $uniqueId and resolves its authored bonuses', ({ uniqueId, baseId, ilvl, defense }) => {
    const before = JSON.stringify({ bases: [...pools.bases], uniques: pools.uniques });
    const template = pools.uniques?.find((entry) => entry.id === uniqueId);
    expect(template).toBeDefined();
    const item = rollUniqueItem({ uniqueId, ilvl }, pools, createRng(619));
    expect(item).toMatchObject({
      uniqueId, baseId, rarity: 'unique', ilvl, level: ilvl,
      affixes: [], generatedName: {}, identified: true, equipped: false
    });
    expect(item?.id).toMatch(/^it-[0-9a-z]+-1$/);
    expect(item?.baseRolls?.defense).toBeGreaterThanOrEqual(defense[0] ?? Infinity);
    expect(item?.baseRolls?.defense).toBeLessThanOrEqual(defense[1] ?? -Infinity);
    const modifiers = resolveStatPackage(template?.stats, item?.statRolls);
    if (uniqueId === 'items/unique/pelta-lunata') {
      expect(template?.qlvl).toBe(2);
      expect(item?.statRolls?.['pelta-lunata-defense']).toBeGreaterThanOrEqual(20);
      expect(item?.statRolls?.['pelta-lunata-defense']).toBeLessThanOrEqual(30);
      expect(modifiers).toEqual([
        { path: 'statMods.defense', value: item?.statRolls?.['pelta-lunata-defense'], rollId: 'pelta-lunata-defense' },
        { path: 'statMods.life', value: 10 }
      ]);
    } else {
      expect(template?.qlvl).toBeUndefined();
      expect(item?.statRolls).toEqual({});
      expect(modifiers).toEqual([
        { path: 'resistances.lightning', value: 15 },
        { path: 'statMods.defense', value: 20 },
        { path: 'statMods.life', value: 10 }
      ]);
    }
    expect(JSON.stringify({ bases: [...pools.bases], uniques: pools.uniques })).toBe(before);
  });

  it.each([
    { uniqueId: 'items/unique/pelta-lunata', ilvl: 1 },
    { uniqueId: 'items/unique/coif-of-glory', ilvl: 8 }
  ])('refuses $uniqueId just below its actual eligibility boundary', (input) => {
    expect(rollUniqueItem(input, pools, createRng(619))).toBeUndefined();
  });
});
