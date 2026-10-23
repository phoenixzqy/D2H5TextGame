import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '../types/items';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave } from './validate';
import { deriveEquippedPlayerStats } from '../progression/equipped-stats';

const shield: Item = { id: 'native19-exile', baseId: 'items/base/sh-monarch', rarity: 'runeword',
  runewordId: 'runewords/exile', socketCapacity: 4, level: 60, identified: true, equipped: true,
  baseRolls: { defense: 64 },
  socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };
function fixture(equipped = true) {
  const player = createMockPlayer('Old Exile cache', 'barbarian');
  return buildSave({ timestamp: 1000, player: { ...player, level: 60,
    derivedStats: { ...player.derivedStats, defense: 481, attack: 777,
      magicResist: 17, life: 23, mana: 7, lifeMax: 999, manaMax: 888 } },
    inventory: { backpack: equipped ? [] : [{ ...shield, equipped: false }], stash: [],
      equipped: equipped ? { offhand: shield } : {}, currencies: {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false,
      musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}

describe('qualified native19 Exile display-cache compatibility', () => {
  it('repairs only defense from canonical gear, preserving every unrelated saved cache and resource', () => {
    const input = fixture(), before = structuredClone(input);
    const output = decodeSave(toJsonSafe(input));
    expect(output.player.derivedStats.defense).toBeCloseTo(577.2, 12);
    expect(output).toEqual({ ...input, player: { ...input.player,
      derivedStats: { ...input.player.derivedStats, defense: 481 * 1.2 } } });
    expect(input).toEqual(before);
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
    expect(deriveEquippedPlayerStats(output.player, 60, output.inventory.equipped).defense)
      .toBe(output.player.derivedStats.defense);
  });
  it('leaves unqualified backpack-only and naked caches exact', () => {
    const input = fixture(false);
    expect(decodeSave(toJsonSafe(input))).toEqual(input);
    const naked = { ...input, inventory: { ...input.inventory, backpack: [] } };
    expect(decodeSave(toJsonSafe(naked))).toEqual(naked);
  });
});
