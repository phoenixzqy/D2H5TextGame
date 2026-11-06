/** Constructed predecessor compatibility, never earned item acquisition. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { withoutV32Fields } from '../../../tests/helpers/save-fixtures';
import * as loot from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '../types/items';
import { buildSave, toJsonSafe } from './serialize';
import { validateEndgameSave, validateFrozenV22Save, validateFrozenV23Save,
  validateRespecSave, validateFrozenV24Save, validateSocketSave } from './validate';

const readers = [[19, validateSocketSave], [20, validateEndgameSave],
  [21, validateRespecSave], [22, validateFrozenV22Save],
  [23, validateFrozenV23Save], [24, validateFrozenV24Save]] as const;
const originalBases = new Map(loot.loadItemBases());
const baseId = 'items/base/wp1h-short-sword';
const futureBaseId = 'items/base/small-charm';
const locations = ['backpack', 'stash', 'hero-slot', 'merc-slot', 'hero-mirror', 'merc-mirror'] as const;
afterEach(() => { vi.restoreAllMocks(); });

function sample(version: number) {
  const save = withoutV32Fields(buildSave({ timestamp: 1000, player: createMockPlayer('Literal items', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } }));
  if (version < 24) {
    Reflect.deleteProperty(save.map, 'hellClearedSubAreas');
    Reflect.deleteProperty(save.map.challengeOrdinals, 'hell');
  }
  if (version < 21) Reflect.deleteProperty(save.player, 'respecsRemaining');
  if (version < 20) Reflect.deleteProperty(save, 'endgame');
  return { ...save, version };
}
function sword(id = 'owned', extra: Partial<Item> = {}): Item {
  return { id, baseId, rarity: 'normal', level: 1, identified: true,
    equipped: false, socketCapacity: 2, ...extra };
}
function holding(version: number, location: typeof locations[number], item: Item) {
  const save = sample(version);
  const merc = { ...save.player, id: 'merc', type: 'mercenary' as const,
    archetype: 'rogue', rarity: 'R' as const, equipment: location === 'merc-mirror' ? [item] : [] };
  return { ...save, player: { ...save.player, equipment: location === 'hero-mirror' ? [item] : [] },
    inventory: { ...save.inventory,
      backpack: location === 'backpack' ? [item] : [], stash: location === 'stash' ? [item] : [],
      equipped: location === 'hero-slot' ? { charm: item } : {} },
    mercs: { ...save.mercs, ownedMercs: [merc], mercEquipment: {
      merc: location === 'merc-slot' ? { charm: item } : {} } } };
}

describe.each(readers)('literal%s item-base domain', (version, read) => {
  it.each(locations)('rejects a future base at %s even after live catalog addition', location => {
    const base = originalBases.get(baseId);
    if (!base) throw new Error('Missing fixture base');
    const live = new Map(originalBases);
    // Only the ID changes: this isolates base admission from future slot/type rules.
    live.set(futureBaseId, { ...base, id: futureBaseId });
    vi.spyOn(loot, 'loadItemBases').mockReturnValue(live);
    const save = holding(version, location, sword('future', { baseId: futureBaseId }));
    expect(() => read(save)).toThrow('unknown canonical item base');
    expect(() => read(toJsonSafe(save))).toThrow('unknown canonical item base');
  });
  it.each(['removed', 'socket-budget', 'normalized-removed'] as const)(
    'retains a known item when the live base is %s', change => {
      const live = new Map(originalBases), base = live.get(baseId);
      if (!base) throw new Error('Missing fixture base');
      if (change === 'socket-budget') live.set(baseId, { ...base, maxSockets: 0 });
      else live.delete(baseId);
      const loader = vi.spyOn(loot, 'loadItemBases').mockReturnValue(live);
      if (change === 'normalized-removed') loader.mockReturnValueOnce(originalBases);
      const save = holding(version, 'backpack', sword()), before = structuredClone(save);
      expect(read(save)).toEqual(toJsonSafe(save));
      expect(save).toEqual(before);
    });
  it('preserves arbitrary keys, old unknown unique strings and unrelated payloads', () => {
    const item = { ...sword('', { rarity: 'unique', uniqueId: 'items/unique/ormus-charm' }),
      oldPayload: { marker: 'retained' } };
    const save = holding(version, 'hero-slot', item);
    const mercs = { ...save.mercs, mercEquipment: { orphan: { arbitraryHistoricalSlot: sword('orphan') } } };
    const inventory = { ...save.inventory, legacyCharmRecovery: { unrelated: ['keep', 7] } };
    const input = { ...save, inventory, mercs }, before = structuredClone(input);
    expect(read(input)).toEqual(toJsonSafe(input));
    expect(read(toJsonSafe(input))).toEqual(toJsonSafe(input));
    expect(input).toEqual(before);
  });
  it.each(['unknown', 'capacity', 'material', 'duplicate'] as const)('keeps %s refusal', fault => {
    const save = holding(version, 'backpack', sword());
    if (fault === 'unknown') save.inventory.backpack = [sword('owned', { baseId: 'items/base/missing' })];
    if (fault === 'capacity') save.inventory.backpack = [sword('owned', { socketCapacity: 7 })];
    if (fault === 'material') save.inventory.backpack = [sword('owned', {
      socketContents: [{ kind: 'rune', id: 'runes/missing' }] })];
    if (fault === 'duplicate') save.inventory.stash = [sword()];
    expect(() => read(save)).toThrow();
    expect(() => read(toJsonSafe(save))).toThrow();
  });
  it('allows actor mirrors of an authoritative item without adding ownership', () => {
    const item = sword(), save = holding(version, 'backpack', item);
    save.player.equipment = [item];
    expect(read(save)).toEqual(toJsonSafe(save));
  });
});
