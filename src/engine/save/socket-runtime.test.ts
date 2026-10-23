import { withoutV20Fields, withV20Defaults } from '../../../tests/helpers/save-fixtures';
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave } from './validate';
import { migrateSaveV19 } from './migrate-v19';
import { deriveEquippedPlayerStats } from '../progression/equipped-stats';
import type { SaveV18 } from '../types/save';
import type { HistoricalItem } from './historical-items';

function oldSave(): SaveV18 {
  const save = buildSave({ player: createMockPlayer('Sockets', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] }, timestamp: 1000 });
  return { ...withoutV20Fields(save), version: 18, inventory: { backpack: [], stash: [], equipped: {}, currencies: {}, materials: {},
    questItems: {}, questServices: {}, legacyGearQuarantine: [] } };
}
const sword = (id: string): HistoricalItem => ({ id, baseId: 'items/base/wp1h-short-sword', rarity: 'normal',
  level: 20, socketCapacity: 2, identified: true, equipped: false, runes: ['runes/el'],
  affixes: [{ affixId: 'legacy', values: new Map([['statMods.mana', 20]]) }] });

describe('connected socket runtime save boundary', () => {
  it.each(['absent', 'empty'] as const)('preserves exact validated actor caches when equipped %s runes change no effects', runes => {
    const old = oldSave(), { runes: _runes, ...emptySword } = sword('empty');
    const item = { ...emptySword, equipped: true, ...(runes === 'empty' ? { runes: [] } : {}) };
    const cache = { ...old.player.derivedStats, lifeMax: 900, manaMax: 800, attack: 777, magicResist: 17 };
    const input = { ...old, player: { ...old.player, derivedStats: cache },
      inventory: { ...old.inventory, equipped: { weapon: item } } };
    const before = structuredClone(input), decoded = decodeSave(toJsonSafe(input));
    expect(decoded.player.derivedStats).toEqual(cache);
    expect(decoded.player.equipment).toEqual([decoded.inventory.equipped.weapon]);
    expect(decoded.inventory.equipped.weapon).not.toHaveProperty('runes');
    expect(input).toEqual(before);
  });
  it('preserves naked actor caches when only a bag rune changes representation', () => {
    const old = oldSave(), cache = { ...old.player.derivedStats, magicResist: 11 };
    const input = { ...old, player: { ...old.player, derivedStats: cache },
      inventory: { ...old.inventory, backpack: [sword('bag-only')] } };
    expect(decodeSave(toJsonSafe(input)).player.derivedStats).toEqual(cache);
  });
  it('decodes real v18 rune ownership into canonical current state and applies inserts on live recomposition', () => {
    const old = oldSave(), equipped = { ...sword('blade'), equipped: true };
    const input = { ...old, inventory: { ...old.inventory, equipped: { weapon: equipped } } };
    const before = structuredClone(input), decoded = decodeSave(toJsonSafe(input));
    expect(decoded.version).toBe(20);
    expect(decoded.inventory.equipped.weapon).toMatchObject({ socketContents: [{ kind: 'rune', id: 'runes/el' }] });
    expect(decoded.inventory.equipped.weapon).not.toHaveProperty('runes');
    expect(decoded.player.equipment).toEqual([decoded.inventory.equipped.weapon]);
    const live = deriveEquippedPlayerStats(decoded.player, decoded.player.level, decoded.inventory.equipped);
    expect(live).toEqual(decoded.player.derivedStats);
    expect(input).toEqual(before);
  });
  it('decodes a native v19 JSON round trip and restores affix Maps in both quarantine families', () => {
    const old = oldSave(), { socketCapacity: _capacity, runes: _runes, ...old16 } = sword('old16');
    const incompatible = { ...sword('old18'), baseId: 'items/base/armor-quilted', rarity: 'runeword' as const,
      runewordId: 'runewords/lore', runes: ['runes/ort', 'runes/sol'] };
    const native = migrateSaveV19({ ...old, inventory: { ...old.inventory, backpack: [sword('bag')], stash: [incompatible],
      legacyGearQuarantine: [{ item: old16, origin: { container: 'stash', index: 0 } }] } });
    const decoded = decodeSave(toJsonSafe(native));
    expect(decoded.version).toBe(20);
    expect(toJsonSafe(decoded)).toEqual(toJsonSafe(withV20Defaults(native)));
    for (const entry of [decoded.inventory.legacyGearQuarantine[0], decoded.inventory.socketQuarantine[0]]) {
      const affix = entry?.item.affixes?.[0];
      expect(affix && 'values' in affix && affix.values).toBeInstanceOf(Map);
    }
  });
  it('trusted snapshots rebuild player and merc equipment mirrors from actual ownership', () => {
    const old = oldSave(), native = migrateSaveV19(old), item = { ...sword('owned'), runes: undefined };
    const { runes: _runes, ...canonical } = item;
    const merc = { ...native.player, type: 'mercenary' as const, id: 'rogue', archetype: 'back', rarity: 'R' as const,
      equipment: [] };
    const save = buildSave({ ...native, inventory: { ...native.inventory, equipped: { weapon: canonical } },
      mercs: { ...native.mercs, ownedMercs: [merc], mercEquipment: { rogue: { weapon: { ...canonical, id: 'merc-owned' } } } } });
    expect(save.player.equipment).toEqual([canonical]);
    expect(save.mercs.ownedMercs[0]?.equipment).toEqual([{ ...canonical, id: 'merc-owned' }]);
  });
});
