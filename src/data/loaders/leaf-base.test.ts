import { describe, expect, it } from 'vitest';
import { loadItemBases, loadTreasureClasses } from './loot';
import { socketRunewords } from './socket-effects';
import { createRng } from '@/engine/rng';
import { rollDrops } from '@/engine/loot/drop-roller';
import { rollItem } from '@/engine/loot/rollItem';
import { previewSocketInsertion, validateCanonicalSocketItem } from '@/engine/items/socket-contents';

describe('Leaf ordinary base availability', () => {
  it('has an authored staff with enough socket capacity to form real Leaf', () => {
    const leaf = socketRunewords.find(word => word.id === 'runewords/leaf');
    if (!leaf) throw new Error('Missing approved Leaf word');
    const candidates = [...loadItemBases().values()].filter(base => base.slot === 'weapon' &&
      base.type === 'weapon' && base.weaponType === 'staff' && (base.maxSockets ?? 0) >= leaf.sockets);
    expect(candidates.length).toBeGreaterThan(0);
  });
  it('offers a normal staff through the ordinary Act I table with the reviewed early two-handed weight', () => {
    const table = loadTreasureClasses().get('loot/trash-act1');
    expect(table?.picks).toContainEqual({ type: 'item', baseId: 'items/base/weapon-staff',
      rarity: 'normal', weight: 100, qlvlMin: 1, qlvlMax: 10 });
  });
  it('acquires ordinary staves with random zero-to-two capacity and forms Leaf only with two sockets', () => {
    const bases = loadItemBases(), staff = bases.get('items/base/weapon-staff');
    const tc = loadTreasureClasses().get('loot/trash-act1');
    if (!staff || !tc) throw new Error('Missing real staff acquisition inputs');
    expect(staff).toMatchObject({ weaponType: 'staff', handedness: 'twoHanded',
      reqLevel: 1, metal: false, maxSockets: 2, baseDamage: { min: 8, max: 18 } });
    const acquired = [];
    for (let seed = 1; seed <= 512; seed++) {
      const rng = createRng(seed);
      for (const drop of rollDrops({ tc, tier: 'trash', monsterLevel: 5, magicFind: 0 }, rng)) {
        if (drop.kind !== 'item' || drop.baseId !== staff.id) continue;
        const item = rollItem(drop, { bases, affixes: [] }, rng);
        if (!item) throw new Error('Ordinary selected staff did not materialize');
        acquired.push(item);
      }
    }
    expect(acquired.length).toBeGreaterThan(0);
    expect(new Set(acquired.map(item => item.socketCapacity))).toEqual(new Set([0, 1, 2]));
    for (const item of acquired) {
      expect(item.rarity).toBe('normal');
      expect(item).not.toHaveProperty('runewordId');
      if (item.socketCapacity !== 2) continue;
      const first = previewSocketInsertion(item, staff, 'runes/tir');
      expect(first).not.toHaveProperty('runewordId');
      const complete = previewSocketInsertion(first, staff, 'runes/ral');
      expect(complete).toMatchObject({ rarity: 'runeword', runewordId: 'runewords/leaf', socketCapacity: 2 });
      expect(() => { validateCanonicalSocketItem(complete, staff); }).not.toThrow();
      expect(() => previewSocketInsertion(complete, staff, 'runes/el')).toThrow('Ineligible socket insertion');
    }
    const leaf = socketRunewords.find(word => word.id === 'runewords/leaf');
    expect(leaf?.reqLevel).toBe(19);
  });
});
