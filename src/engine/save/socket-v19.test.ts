import { describe, expect, it } from 'vitest';
import { loadItemBases } from '@/data/loaders/loot';
import type { HistoricalItem } from './historical-items';
import { convertV18SocketItem } from './socket-v19';

function sword(extra: Partial<HistoricalItem> = {}): HistoricalItem {
  return { id: 'historical-word', baseId: 'items/base/wp1h-short-sword',
    rarity: 'normal', level: 1, socketCapacity: 2, identified: true, equipped: false,
    baseRolls: { attack: 12 }, personalizedBy: { characterId: 'old-hero', name: 'Hero' }, ...extra };
}
const bases = loadItemBases();

describe('v18 canonical socket projection prerequisite', () => {
  it('converts a supported word in exact order without modifying any other payload', () => {
    const source = sword({ rarity: 'runeword', runewordId: 'runewords/steel', runes: ['runes/tir', 'runes/el'] });
    const before = structuredClone(source);
    const { runes: _runes, ...rest } = source;
    expect(convertV18SocketItem(source, bases.get(source.baseId))).toEqual({ ...rest,
      socketContents: [{ kind: 'rune', id: 'runes/tir' }, { kind: 'rune', id: 'runes/el' }] });
    expect(source).toEqual(before);
  });
  it('preserves empty and wrong-order plain items', () => {
    const empty = sword();
    expect(convertV18SocketItem(empty, bases.get(empty.baseId))).toEqual(empty);
    const wrong = sword({ runes: ['runes/el', 'runes/tir'] });
    const projected = convertV18SocketItem(wrong, bases.get(wrong.baseId));
    expect(projected?.socketContents).toEqual([{ kind: 'rune', id: 'runes/el' }, { kind: 'rune', id: 'runes/tir' }]);
    expect(projected?.rarity).toBe('normal');
  });
  it.each([
    sword({ runes: ['runes/tir', 'runes/el'] }),
    sword({ runes: ['runes/tir', 'runes/el'], runewordId: 'runewords/steel' }),
    sword({ baseId: 'items/base/armor-quilted', rarity: 'runeword', runes: ['runes/ort', 'runes/sol'], runewordId: 'runewords/lore' })
  ])('returns a quarantine disposition for a historically valid incompatible identity %#', source => {
    const before = structuredClone(source);
    expect(convertV18SocketItem(source, bases.get(source.baseId))).toBeNull();
    expect(source).toEqual(before);
  });
  it('refuses invalid historical input and reserved fields rather than quarantining laundering', () => {
    const source = sword({ runes: ['runes/unknown'] });
    expect(() => convertV18SocketItem(source, bases.get(source.baseId))).toThrow();
    const polluted = { ...sword(), socketContents: [] };
    expect(() => convertV18SocketItem(polluted, bases.get(polluted.baseId))).toThrow();
  });
});
