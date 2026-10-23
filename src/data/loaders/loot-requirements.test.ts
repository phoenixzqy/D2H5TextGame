import { expect, it } from 'vitest';
import { loadItemBases, resolveItemReqLevel } from './loot';
import { socketRunewords } from './socket-effects';
import { checkEligibility } from '@/features/inventory/compareEquip';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';

it('uses the strictest authored runeword/base level for every live word', () => {
  const base = loadItemBases().get('items/base/wp1h-short-sword');
  if (!base) throw new Error('Missing short sword fixture');
  expect(socketRunewords).toHaveLength(35);
  for (const word of socketRunewords) {
    expect(resolveItemReqLevel({ baseId: base.id, runewordId: word.id }, base), word.id).toBe(Math.max(base.reqLevel, word.reqLevel));
    expect(resolveItemReqLevel({ baseId: base.id, runewordId: word.id }, { ...base, reqLevel: 99 }), word.id).toBe(99);
  }
});

it('shares the completed-word requirement with hero equipment eligibility at the exact boundary', () => {
  const stored: Item = { id: 'steel', baseId: 'items/base/wp1h-short-sword', rarity: 'runeword', level: 1,
    identified: true, equipped: false, socketCapacity: 2, runewordId: 'runewords/steel',
    socketContents: [{ kind: 'rune', id: 'runes/tir' }, { kind: 'rune', id: 'runes/el' }] };
  const player = createMockPlayer('Requirements', 'sorceress');
  expect(checkEligibility(stored, { ...player, level: 12 })).toEqual({ eligible: false,
    reasons: [{ kind: 'level', required: 13, current: 12 }] });
  expect(checkEligibility(stored, { ...player, level: 13 })).toEqual({ eligible: true, reasons: [] });
});
