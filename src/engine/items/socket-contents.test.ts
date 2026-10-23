import { describe, expect, it } from 'vitest';
import { loadItemBases } from '@/data/loaders/loot';
import type { ItemBonusStats } from '../types/items';
import { previewSocketInsertion, previewSocketClearing, socketBonusPackages, validateCanonicalSocketItem,
  type CanonicalSocketItem } from './socket-contents';

function gear(extra: Partial<CanonicalSocketItem> = {}): CanonicalSocketItem {
  return { id: 'socket-target', baseId: 'items/base/wp1h-short-sword', rarity: 'normal',
    level: 1, ilvl: 25, socketCapacity: 2, identified: true, equipped: false,
    baseRolls: { attack: 12 }, personalizedBy: { characterId: 'hero', name: 'Hero' }, ...extra };
}
function base(item: CanonicalSocketItem) {
  const result = loadItemBases().get(item.baseId);
  if (!result) throw new Error('Missing socket test base');
  return result;
}

describe('canonical mixed socket contents', () => {
  it('previews one next-empty insertion and exact word creation without spending or mutating', () => {
    const source = gear(), before = structuredClone(source);
    const first = previewSocketInsertion(source, base(source), 'runes/tir');
    expect(first).toEqual({ ...source, socketContents: [{ kind: 'rune', id: 'runes/tir' }] });
    const second = previewSocketInsertion(first, base(first), 'runes/el');
    expect(second).toEqual({ ...first, rarity: 'runeword', runewordId: 'runewords/steel',
      socketContents: [{ kind: 'rune', id: 'runes/tir' }, { kind: 'rune', id: 'runes/el' }] });
    expect(source).toEqual(before);
    expect(first.socketContents).toHaveLength(1);
    expect(() => previewSocketInsertion(second, base(second), 'runes/el')).toThrow();
    expect(socketBonusPackages(second, base(second))).toHaveLength(3);
  });
  it('keeps wrong-order and mixed materials as ordinary inserts with no word', () => {
    const source = gear();
    const wrong = previewSocketInsertion(previewSocketInsertion(source, base(source), 'runes/el'), base(source), 'runes/tir');
    const mixed = previewSocketInsertion(previewSocketInsertion(source, base(source), 'runes/tir'), base(source), 'gems/ruby/chipped');
    for (const item of [wrong, mixed]) {
      expect(item.rarity).toBe('normal'); expect(item).not.toHaveProperty('runewordId');
      expect(socketBonusPackages(item, base(item))).toHaveLength(2);
    }
    expect(mixed.socketContents).toEqual([{ kind: 'rune', id: 'runes/tir' }, { kind: 'gem', id: 'gems/ruby/chipped' }]);
  });
  it.each([
    { rarity: 'normal' as const },
    { rarity: 'normal' as const, runewordId: 'runewords/steel' },
    { rarity: 'runeword' as const },
    { rarity: 'magic' as const, runewordId: 'runewords/steel' }
  ])('refuses inconsistent completed-word identity %o', identity => {
    const source = gear({ ...identity, socketContents: [
      { kind: 'rune', id: 'runes/tir' }, { kind: 'rune', id: 'runes/el' }
    ] });
    expect(() => { validateCanonicalSocketItem(source, base(source)); }).toThrow();
    expect(() => socketBonusPackages(source, base(source))).toThrow();
  });
  it('keeps a full matching sequence plain on non-white gear', () => {
    const source = gear({ rarity: 'magic', socketContents: [
      { kind: 'rune', id: 'runes/tir' }, { kind: 'rune', id: 'runes/el' }
    ] });
    expect(() => { validateCanonicalSocketItem(source, base(source)); }).not.toThrow();
    expect(socketBonusPackages(source, base(source))).toHaveLength(2);
  });
  it('previews clearing inserts and word identity while preserving the exact instance and other payloads', () => {
    const source = gear();
    const word = previewSocketInsertion(previewSocketInsertion(source, base(source), 'runes/tir'), base(source), 'runes/el');
    const before = structuredClone(word);
    expect(previewSocketClearing(word, base(word))).toEqual({ ...source, socketContents: [] });
    expect(word).toEqual(before);
    for (const rarity of ['magic', 'rare', 'unique', 'set'] as const) {
      const mixed = gear({ rarity, socketContents: [{ kind: 'gem', id: 'gems/skull/flawed' }] });
      expect(previewSocketClearing(mixed, base(mixed))).toEqual({ ...mixed, socketContents: [] });
    }
    expect(() => previewSocketClearing(gear(), base(source))).toThrow();
    expect(() => previewSocketClearing({ ...word, equipped: true }, base(word))).toThrow();
  });
  it('restricts word creation by actual slot and weapon type, while allowing plain sockets on non-white gear', () => {
    for (const rarity of ['normal', 'magic', 'rare', 'unique', 'set'] as const) {
      const source = gear({ rarity });
      const item = previewSocketInsertion(previewSocketInsertion(source, base(source), 'runes/tir'), base(source), 'runes/ral');
      expect(item.rarity).toBe(rarity); expect(item).not.toHaveProperty('runewordId');
    }
    const chest = gear({ baseId: 'items/base/armor-quilted' });
    const loreOnChest = previewSocketInsertion(previewSocketInsertion(chest, base(chest), 'runes/ort'), base(chest), 'runes/sol');
    expect(loreOnChest.rarity).toBe('normal'); expect(loreOnChest).not.toHaveProperty('runewordId');
  });
  it.each(['runes/nonexistent', 'gems/ruby/unknown', 'materials/scrap', 'rune-shard'])(
    'refuses non-socket material %s', id => {
      const source = gear(); expect(() => previewSocketInsertion(source, base(source), id)).toThrow();
    });
  it('requires native capacity and an unequipped gear target', () => {
    for (const source of [gear({ equipped: true }), gear({ socketCapacity: 0 }),
      gear({ socketCapacity: 3 }), gear({ baseId: 'items/base/amu-tin', socketCapacity: 0 })]) {
      expect(() => previewSocketInsertion(source, base(source), 'runes/el')).toThrow();
    }
    const { socketCapacity: _capacity, ...missing } = gear();
    expect(() => previewSocketInsertion(missing, base(missing), 'runes/el')).toThrow();
  });
  it.each([
    { runes: [] }, { runes: undefined }, { socketContents: undefined }, { socketContents: null },
    { socketContents: new Array(1) }, { socketContents: [{ kind: 'rune', id: 'runes/el', extra: 1 }] },
    { socketContents: [{ kind: 'gem', id: 'runes/el' }] }, { socketContents: [{ kind: 'rune', id: 'el' }] },
    { socketContents: [{ kind: 'rune', id: 'runes/el' }], rarity: 'runeword', runewordId: 'runewords/steel' }
  ])('refuses obsolete, malformed or inconsistent native state %o', extra => {
    const source = { ...gear(), ...extra } as unknown as CanonicalSocketItem;
    expect(() => { validateCanonicalSocketItem(source, base(source)); }).toThrow();
  });
  it('refuses inherited/hidden/accessor contents without evaluating imported getters', () => {
    let reads = 0;
    for (const source of [
      Object.assign(Object.create({ socketContents: [] }) as CanonicalSocketItem, gear()),
      Object.defineProperty(gear(), 'socketContents', { value: [], enumerable: false }),
      Object.defineProperty(gear(), 'socketContents', { enumerable: true, get: () => { reads++; return []; } }),
      gear({ socketContents: [Object.defineProperty({ kind: 'rune' as const, id: 'placeholder' }, 'id', { enumerable: true, get: () => { reads++; return 'runes/el'; } })] })
    ]) expect(() => { validateCanonicalSocketItem(source, base(source)); }).toThrow();
    expect(reads).toBe(0);
  });
  it('resolves ratio-valued rune effects and flat magical mitigation without heuristic conversions', () => {
    const chest = gear({ baseId: 'items/base/armor-quilted', socketContents: [{ kind: 'rune', id: 'runes/eld' }] });
    expect(socketBonusPackages(chest, base(chest))).toEqual([{ statMods: { physDodge: .02 } }]);
    const diamond = gear({ socketContents: [{ kind: 'gem', id: 'gems/diamond/perfect' }] });
    expect(socketBonusPackages(diamond, base(diamond))).toEqual([{ statMods: { magicResist: 10 } }]);
  });
  it.each(['amethyst', 'diamond', 'emerald', 'ruby', 'sapphire', 'skull', 'topaz'])(
    'resolves all five %s qualities in weapon, armor and shield contexts', type => {
      const qualities = ['chipped', 'flawed', 'normal', 'flawless', 'perfect'];
      for (const [index, quality] of qualities.entries()) {
        const q = index + 1;
        const expectations: Record<string, readonly ItemBonusStats[]> = {
          amethyst: [{ statMods: { attack: 5*q } }, { coreStats: { strength: q } }, { statMods: { defense: 5*q } }],
          diamond: [{ statMods: { magicResist: 2*q } }, { statMods: { magicResist: 2*q } },
            { resistances: { fire: 2*q, cold: 2*q, lightning: 2*q, poison: 2*q, arcane: 2*q, physical: 2*q } }],
          emerald: [{ coreStats: { dexterity: q } }, { coreStats: { dexterity: q } }, { resistances: { poison: 6*q } }],
          ruby: [{ statMods: { attack: 4*q } }, { statMods: { life: 10*q } }, { resistances: { fire: 6*q } }],
          sapphire: [{ statMods: { mana: 4*q } }, { statMods: { mana: 10*q } }, { resistances: { cold: 6*q } }],
          skull: [{ statMods: { life: 5*q } }, { statMods: { life: 5*q, mana: 5*q } }, { resistances: { physical: 2*q } }],
          topaz: [{ statMods: { attackSpeed: 2*q } }, { statMods: { magicFind: 5*q } }, { resistances: { lightning: 6*q } }]
        };
        for (const [location, baseId] of ['items/base/wp1h-short-sword', 'items/base/armor-quilted', 'items/base/sh-buckler'].entries()) {
          const source = gear({ baseId, socketCapacity: 1, socketContents: [{ kind: 'gem', id: `gems/${type}/${quality}` }] });
          expect(socketBonusPackages(source, base(source))).toEqual([expectations[type]?.[location]]);
        }
      }
    });
});
