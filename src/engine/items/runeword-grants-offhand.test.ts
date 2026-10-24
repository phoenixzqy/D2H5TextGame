import { expect, it } from 'vitest';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { resolveEquippedRunewordGrants } from './runeword-grants';
import type { Item } from '../types/items';

function word(id: string, base = 'wp1h-legend-sword'): Item {
  const row = socketRunewords.find(w => w.id === 'runewords/' + id);
  if (!row) throw new Error('Missing authored word');
  return { id: 'owned-' + id, baseId: 'items/base/' + base, rarity: 'runeword',
    level: 70, identified: true, equipped: false, runewordId: row.id,
    socketCapacity: row.sockets, socketContents: row.runes.map(id => ({ kind: 'rune', id })) };
}
it.each(['last-wish', 'phoenix', 'hand-of-justice', 'death'])('preserves real %s grants in a compatible one-handed offhand', id => {
  const source = word(id), before = structuredClone(source);
  const main = resolveEquippedRunewordGrants({ weapon: source });
  expect(main.length).toBeGreaterThan(0);
  expect(resolveEquippedRunewordGrants({ offhand: source })).toEqual(main);
  expect(source).toEqual(before);
});
it('deduplicates the same named grant across two valid weapons', () => {
  const main = word('last-wish');
  expect(resolveEquippedRunewordGrants({ weapon: main, offhand: { ...main, id: 'second-owned' } }))
    .toEqual(resolveEquippedRunewordGrants({ weapon: main }));
});
it('retains wrong-slot, unequipped-container and two-handed exclusion', () => {
  const source = word('last-wish');
  expect(resolveEquippedRunewordGrants({ head: source, backpack: source, stash: source })).toEqual([]);
  expect(resolveEquippedRunewordGrants({ offhand: word('leaf', 'weapon-staff') })).toEqual([]);
});
it('validates the exact socket recipe before granting from an offhand weapon', () => {
  expect(() => resolveEquippedRunewordGrants({ offhand: { ...word('last-wish'), socketContents: [] } })).toThrow(/runeword/);
});
