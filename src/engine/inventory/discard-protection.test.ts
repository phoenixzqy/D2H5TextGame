import { describe, expect, it } from 'vitest';
import type { Item } from '../types/items';
import { isBulkDiscardProtected } from './discard-protection';

const ordinary: Item = {
  id: 'candidate', baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, identified: true, equipped: false
};

describe('bulk discard protection', () => {
  it('preserves special rarities and a runeword identity on ordinary gear', () => {
    for (const rarity of ['unique', 'set', 'runeword'] as const) {
      expect(isBulkDiscardProtected({ ...ordinary, rarity })).toBe(true);
    }
    expect(isBulkDiscardProtected({ ...ordinary, runewordId: 'runewords/lore' })).toBe(true);
  });

  it.each(['normal', 'magic', 'rare'] as const)('preserves inserted materials on %s gear without mutation', rarity => {
    for (const content of [{ kind: 'rune', id: 'runes/el' }, { kind: 'gem', id: 'gems/ruby/chipped' }] as const) {
      const item: Item = Object.freeze({ ...ordinary, rarity, socketContents: Object.freeze([Object.freeze(content)]) });
      const before = structuredClone(item);
      expect(isBulkDiscardProtected(item)).toBe(true);
      expect(item).toEqual(before);
    }
  });

  it('allows ordinary gear and empty sockets to be discarded', () => {
    for (const rarity of ['normal', 'magic', 'rare'] as const) {
      expect(isBulkDiscardProtected({ ...ordinary, rarity })).toBe(false);
      expect(isBulkDiscardProtected({ ...ordinary, rarity, socketCapacity: 2, socketContents: [] })).toBe(false);
    }
  });
});
