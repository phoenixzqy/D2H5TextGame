import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import type { Mercenary } from '@/engine/types/entities';
import { playerToCombatUnit } from './combatHelpers';
import { mercToCombatUnit } from './mercToCombatUnit';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';

const stores = [useInventoryStore, usePlayerStore, useMapStore] as const;
beforeEach(() => { for (const store of stores) store.getState().reset(); });
afterEach(() => { for (const store of stores) store.getState().reset(); });
function word(id: string, base: string): Item {
  const row = socketRunewords.find(row => row.id === `runewords/${id}`);
  if (!row) throw new Error('Missing authored word');
  return { id, baseId: `items/base/${base}`, rarity: 'runeword', level: 70,
    identified: true, equipped: false, runewordId: row.id, socketCapacity: row.sockets,
    socketContents: row.runes.map(id => ({ kind: 'rune', id })) };
}
describe('canonical equipped active grants enter runtime snapshots', () => {
  it.each([
    { word: 'leaf', base: 'weapon-staff', slot: 'weapon', id: 'sorceress.fire_bolt', rank: 3 },
    { word: 'hand-of-justice', base: 'wp1h-legend-sword', slot: 'weapon', id: 'sorceress.blaze', rank: 5 },
    { word: 'death', base: 'wp1h-legend-sword', slot: 'weapon', id: 'sorceress.chain_lightning', rank: 5 },
    { word: 'phoenix', base: 'sh-monarch', slot: 'offhand', id: 'item.redemption', rank: 1 }
  ])('projects $word for hero/merc and removes availability without deleting stored priority', row => {
    const hero = { ...createMockPlayer('Active grant probe', 'paladin'), level: 70,
      comboOrder: ['paladin.sacrifice', row.id], skillLevels: { 'skills-paladin-sacrifice': 1 } };
    const merc: Mercenary = { ...hero, id: 'probe', type: 'mercenary',
      archetype: 'front', rarity: 'R', classId: 'rogue', signatureSkillId: 'mskill-jab',
      comboOrder: ['mskill-jab', row.id] };
    const before = structuredClone({ hero, merc });
    const equipped = { [row.slot]: word(row.word, row.base) };
    useInventoryStore.setState({ equipped });
    for (const unit of [playerToCombatUnit(hero), mercToCombatUnit(merc, undefined, equipped)]) {
      expect(unit.skillOrder).toContain(row.id);
      expect(unit).toHaveProperty(['governedActiveRanks', row.id], row.rank);
      expect(unit.skillLevels ?? {}).not.toHaveProperty(row.id);
    }
    useInventoryStore.setState({ equipped: {} });
    for (const unit of [playerToCombatUnit(hero), mercToCombatUnit(merc)]) {
      expect(unit.skillOrder).not.toContain(row.id);
      expect(unit).toHaveProperty(['governedActiveRanks', row.id], 0);
    }
    expect({ hero, merc }).toEqual(before);
  });
});
