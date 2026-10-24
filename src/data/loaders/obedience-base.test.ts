import { describe, expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import { rollDrops } from '@/engine/loot/drop-roller';
import { rollItem } from '@/engine/loot/rollItem';
import { previewSocketInsertion, socketBonusPackages } from '@/engine/items/socket-contents';
import type { Item } from '@/engine/types/items';
import { loadItemBases, loadTreasureClasses, resolveItemReqLevel } from './loot';
import { socketRunewords } from './socket-effects';

const baseId = 'items/base/wp2h-battle-scythe';
const runes = ['runes/hel', 'runes/ko', 'runes/thul', 'runes/eth', 'runes/fal'];
function base(id = baseId) {
  const value = loadItemBases().get(id);
  if (!value) throw new Error(`Missing authored base: ${id}`);
  return value;
}
function source(capacity = 5, id = baseId): Item {
  return { id: 'ordinary-scythe', baseId: id, rarity: 'normal', level: 42, ilvl: 42,
    identified: true, equipped: false, socketCapacity: capacity, baseRolls: { attack: 45 } };
}

describe('Obedience source-backed polearm', () => {
  it('preserves old capacities and uses the existing polearm damage budget with a level41 gate', () => {
    expect(base()).toMatchObject({ type: 'weapon', slot: 'weapon', weaponType: 'polearm',
      handedness: 'twoHanded', metal: true, canHaveAffixes: true, reqLevel: 41, maxSockets: 5 });
    expect(base().baseDamage).toEqual(base('items/base/wp2h-giant-thresher').baseDamage);
    expect(base('items/base/wp2h-giant-thresher')).toMatchObject({ reqLevel: 35, maxSockets: 4 });
    expect(base('items/base/weapon-polearm').maxSockets).toBe(3);
    expect(base('items/base/weapon-staff').maxSockets).toBe(2);
  });
  it('acquires actual normal scythes with every capacity0–5 from ordinary Act IV drops', () => {
    const tc = loadTreasureClasses().get('loot/trash-act4');
    if (!tc) throw new Error('Missing ordinary Act IV table');
    expect(tc.picks).toContainEqual({ type: 'item', baseId, rarity: 'normal', weight: 120, qlvlMin: 41, qlvlMax: 81 });
    const acquired: Item[] = [];
    for (let seed = 1; seed <= 2048; seed++) {
      const rng = createRng(seed);
      for (const drop of rollDrops({ tc, tier: 'trash', monsterLevel: 42, magicFind: 0 }, rng)) {
        if (drop.kind !== 'item' || drop.baseId !== baseId) continue;
        const item = rollItem(drop, { bases: loadItemBases(), affixes: [] }, rng);
        if (!item) throw new Error('Selected real base failed to materialize');
        acquired.push(item);
      }
    }
    expect(new Set(acquired.map(item => item.socketCapacity))).toEqual(new Set([0, 1, 2, 3, 4, 5]));
    for (const item of acquired) {
      expect(item.rarity).toBe('normal');
      expect(item).not.toHaveProperty('runewordId');
      if (item.socketCapacity !== 5) continue;
      const word = runes.reduce((current, rune) => previewSocketInsertion(current, base(), rune), item);
      expect(word).toMatchObject({ rarity: 'runeword', runewordId: 'runewords/obedience', socketCapacity: 5 });
      expect(word.id).toBe(item.id);
      expect(word.baseRolls).toEqual(item.baseRolls);
      expect(resolveItemReqLevel(word)).toBe(41);
      expect(socketBonusPackages(word, base()).at(-1)).toEqual({ coreStats: { strength: 10, dexterity: 10 },
        statMods: { attack: 200 }, resistances: { fire: 30, cold: 30, lightning: 30, poison: 30, arcane: 30 } });
    }
  });
  it('requires exact sequence, white polearm and capacity without weakening the recipe', () => {
    const word = socketRunewords.find(row => row.id === 'runewords/obedience');
    expect(word).toMatchObject({ runes, sockets: 5, reqLevel: 41, allowedBases: ['weapon'],
      allowedSlots: ['weapon'], allowedWeaponTypes: ['polearm'] });
    for (const item of [source(5, 'items/base/wp2h-colossus-blade'), { ...source(), rarity: 'magic' as const }]) {
      const result = runes.reduce((current, rune) => previewSocketInsertion(current, base(item.baseId), rune), item);
      expect(result).not.toHaveProperty('runewordId');
    }
    const wrongOrder = [...runes].reverse().reduce((current, rune) => previewSocketInsertion(current, base(), rune), source());
    expect(wrongOrder).not.toHaveProperty('runewordId');
    const four = runes.slice(0, 4).reduce((current, rune) => previewSocketInsertion(current, base(), rune), source(4));
    expect(four).not.toHaveProperty('runewordId');
    expect(() => previewSocketInsertion(four, base(), 'runes/fal')).toThrow();
    for (const id of ['items/base/weapon-polearm', 'items/base/wp2h-giant-thresher']) {
      expect(() => previewSocketInsertion(source(5, id), base(id), 'runes/hel')).toThrow();
    }
    expect(() => previewSocketInsertion(source(6), base(), 'runes/hel')).toThrow();
  });
});
