import { describe, expect, it, vi } from 'vitest';
// Isolated catalog fixture: a legal Dream helm has synthetic lower-rank Defiance.
// This tests the duplicate reducer, never the real Dream adaptation or earned balance.
vi.mock('@/data/items/runewords.json', async importOriginal => {
  const actual = await importOriginal<{ default: readonly Record<string, unknown>[] }>();
  return { default: actual.default.map(word => word.id === 'runewords/dream'
    ? { ...word, grants: [{ id: 'aura-defiance', rank: 3, defensePct: .12 }] } : word) };
});
import { resolveEquippedRunewordGrants } from '@/engine/items/runeword-grants';
import type { Item } from '@/engine/types/items';

const shield: Item = { id: 'exile', baseId: 'items/base/sh-monarch', rarity: 'runeword',
  level: 60, runewordId: 'runewords/exile', socketCapacity: 4, identified: true, equipped: false,
  socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };
const helm: Item = { id: 'synthetic-defiance', baseId: 'items/base/helm-war-hat', rarity: 'runeword',
  level: 65, runewordId: 'runewords/dream', socketCapacity: 3, identified: true, equipped: false,
  socketContents: ['io', 'jah', 'pul'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };

describe('named runeword grant ownership and duplicate reduction', () => {
  it('uses the highest rank, independent of record insertion order, and reveals the remaining source on removal', () => {
    const high = [{ id: 'aura-defiance', rank: 5, defensePct: .20 }];
    expect(resolveEquippedRunewordGrants({ head: helm, offhand: shield })).toEqual(high);
    expect(resolveEquippedRunewordGrants({ offhand: shield, head: helm })).toEqual(high);
    expect(resolveEquippedRunewordGrants({ head: helm })).toEqual([
      { id: 'aura-defiance', rank: 3, defensePct: .12 }
    ]);
    expect(resolveEquippedRunewordGrants({})).toEqual([]);
  });
  it('ignores backpack, stash, mirror and wrong map-slot sources regardless of item flags', () => {
    const marked = { ...shield, equipped: true, equipSlot: 'offhand' as const };
    expect(resolveEquippedRunewordGrants({ backpack: marked, stash: marked, equipment: marked, head: marked })).toEqual([]);
    expect(resolveEquippedRunewordGrants({ offhand: shield, head: marked })).toEqual([
      { id: 'aura-defiance', rank: 5, defensePct: .20 }
    ]);
  });
  it('does not expose mutable tuning aliases and refuses forged exact-word identity', () => {
    const grants = resolveEquippedRunewordGrants({ offhand: shield });
    expect(Object.isFrozen(grants)).toBe(true); expect(Object.isFrozen(grants[0])).toBe(true);
    expect(() => resolveEquippedRunewordGrants({ offhand: { ...shield, socketContents: [] } })).toThrow(/runeword/);
  });
});
