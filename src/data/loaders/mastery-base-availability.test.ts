import { describe, expect, it } from 'vitest';
import { loadItemBases, loadTreasureClasses } from './loot';
import { createRng } from '@/engine/rng';
import { rollDrops } from '@/engine/loot/drop-roller';
import { rollItem } from '@/engine/loot/rollItem';
import en from '@/i18n/locales/en/items.json';
import zh from '@/i18n/locales/zh-CN/items.json';

describe('Spear and Throwing Mastery ordinary weapon availability', () => {
  it.each([
    ['weapon-spear', 'spear', 'twoHanded', 8, 18, 2, 100],
    ['weapon-throwing-knife', 'throwing', 'oneHanded', 4, 8, 0, 150],
  ] as const)('acquires localized, canonical %s through the unmodified Act I drop/materialization path',
    (suffix, weaponType, handedness, min, max, maxSockets, weight) => {
      const bases = loadItemBases(), base = bases.get('items/base/' + suffix);
      expect(base).toMatchObject({ type: 'weapon', slot: 'weapon', weaponType, handedness,
        reqLevel: 1, metal: true, maxSockets, baseDamage: { min, max, breakdown: { physical: max } } });
      if (!base) throw new Error('Missing obtainable mastery base');
      expect(en.base).toHaveProperty(suffix); expect(zh.base).toHaveProperty(suffix);
      const tc = loadTreasureClasses().get('loot/trash-act1');
      if (!tc) throw new Error('Missing ordinary Act I table');
      expect(tc.picks).toContainEqual({ type: 'item', baseId: base.id, rarity: 'normal',
        weight, qlvlMin: 1, qlvlMax: 58 });
      const acquired = [];
      for (let seed = 1; seed <= 1024; seed++) {
        const rng = createRng(seed);
        for (const drop of rollDrops({ tc, tier: 'trash', monsterLevel: 6, magicFind: 0 }, rng)) {
          if (drop.kind !== 'item' || drop.baseId !== base.id) continue;
          const item = rollItem(drop, { bases, affixes: [] }, rng);
          expect(item).toMatchObject({ baseId: base.id, rarity: 'normal', level: 6, identified: true });
          if (!item) throw new Error('Selected mastery base did not materialize');
          expect(item.socketCapacity).toBeGreaterThanOrEqual(0);
          expect(item.socketCapacity).toBeLessThanOrEqual(maxSockets);
          acquired.push(item);
        }
      }
      expect(acquired.length).toBeGreaterThan(0);
    });

  it('preserves existing polearm and unique-template classifications', () => {
    const bases = loadItemBases();
    expect(bases.get('items/base/wp2h-war-pike')).toMatchObject({ weaponType: 'polearm', reqLevel: 24 });
    expect(bases.get('items/base/weapon-polearm')).toMatchObject({ weaponType: 'polearm', reqLevel: 20 });
  });
});
