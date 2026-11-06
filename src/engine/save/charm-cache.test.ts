import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as loot from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '../progression/stats';
import type { Item, ItemBase, UniqueItemDef } from '../types/items';
import type { SaveCurrent } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave } from './validate';

const charmBase: ItemBase = { id: 'items/base/small-charm', name: 'items.base.small-charm',
  type: 'charm', slot: 'charm', reqLevel: 1, maxSockets: 0, metal: false, canHaveAffixes: false };
const unique: UniqueItemDef = { id: 'items/unique/ormus-charm', baseId: charmBase.id,
  name: 'items.unique.ormus-charm.name', reqLevel: 1, stats: { statMods: { life: 20, mana: 10 } } };
const bases = loot.loadItemBases(), uniques = loot.loadUniques().filter(row => row.id !== unique.id);
const charm: Item = { id: 'cache-charm', baseId: charmBase.id, uniqueId: unique.id,
  rarity: 'unique', level: 32, ilvl: 32, socketCapacity: 0, identified: true, equipped: true };
const cap: Item = { id: 'cache-cap', baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, socketCapacity: 0, identified: true, equipped: true,
  affixes: [{ affixId: 'old-cache-affix', values: new Map([['statMods.life', 7], ['statMods.mana', 4]]) }] };
function sample(): SaveCurrent {
  const hero = createMockPlayer('Cache tester', 'sorceress');
  return buildSave({ timestamp: 1000, player: { ...hero, derivedStats: {
    ...deriveStats(hero.coreStats, hero.level), lifeMax: 900, manaMax: 800, life: 7, mana: 3,
    attack: 333, defense: 444 } },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function withCharm(): SaveCurrent {
  const save = sample();
  return { ...save, inventory: { ...save.inventory, equipped: { charm, head: cap } },
    player: { ...save.player, equipment: [charm, cap] } };
}
beforeEach(() => {
  vi.spyOn(loot, 'loadItemBases').mockReturnValue(new Map([...bases, [charmBase.id, charmBase]]));
  vi.spyOn(loot, 'loadUniques').mockReturnValue([...uniques, unique]);
});
afterEach(() => { vi.restoreAllMocks(); });

describe('charm snapshots enforce authoritative ownership', () => {
  it.each(['hero-slot', 'reserved-slot', 'merc-item', 'merc-null', 'duplicate'] as const)('rejects %s without mutation', problem => {
    let save = sample();
    if (problem === 'hero-slot') save = { ...save, inventory: { ...save.inventory, equipped: { head: charm } } };
    if (problem === 'reserved-slot') save = { ...save, inventory: { ...save.inventory, equipped: { charm: cap } } };
    if (problem === 'merc-item') save = { ...save, mercs: { ...save.mercs, mercEquipment: { orphan: { head: charm } } } };
    if (problem === 'merc-null') save = { ...save, mercs: { ...save.mercs, mercEquipment: { orphan: { charm: null } } } };
    if (problem === 'duplicate') save = { ...save, inventory: { ...save.inventory, equipped: { charm }, stash: [charm] } };
    const before = structuredClone(save);
    expect(() => buildSave(save)).toThrow('Invalid save:');
    expect(save).toEqual(before);
  });
  it('keeps bags and mirrors inert and preserves ordinary arbitrary keys', () => {
    const save = sample(), input = { ...save,
      inventory: { ...save.inventory, backpack: [{ ...charm, equipped: false }], equipped: { legacy: cap } },
      player: { ...save.player, equipment: [charm] } };
    const out = buildSave(input);
    expect(out.player.derivedStats).toEqual(save.player.derivedStats);
    expect(out.player.equipment).toEqual([cap]);
    expect(out.inventory).toEqual(input.inventory);
  });
});

describe('charm resource caches compose once and preserve pools', () => {
  it.each(['snapshot', 'native', 'json'] as const)('%s repairs only capacities and current pools', boundary => {
    const input = withCharm(), before = structuredClone(input);
    const out = boundary === 'snapshot' ? buildSave(input) : decodeSave(boundary === 'json' ? toJsonSafe(input) : input);
    const base = deriveStats(input.player.coreStats, input.player.level);
    expect(out.player.derivedStats).toEqual({ ...input.player.derivedStats,
      lifeMax: base.lifeMax + 27, manaMax: base.manaMax + 14 });
    expect(out.inventory).toEqual(input.inventory); expect(input).toEqual(before);
    expect(decodeSave(toJsonSafe(out))).toEqual(out);
  });
  it.each([0, 7, 700])('preserves or clamps current Life/Mana %s without healing or revival', resource => {
    const save = withCharm(), input = { ...save, player: { ...save.player,
      alive: resource !== 0, derivedStats: { ...save.player.derivedStats, life: resource, mana: resource } } };
    for (const out of [buildSave(input), decodeSave(input)]) {
      const base = deriveStats(input.player.coreStats, input.player.level);
      expect(out.player.derivedStats).toMatchObject({ life: Math.min(resource, base.lifeMax + 27),
        mana: Math.min(resource, base.manaMax + 14), lifeMax: base.lifeMax + 27, manaMax: base.manaMax + 14 });
      expect(out.player.alive).toBe(input.player.alive);
    }
  });
  it('includes existing Golden Bird entitlement with restored equipment affix Maps', () => {
    const save = withCharm(), quest = 'quests/act3-golden-bird';
    const input: SaveCurrent = { ...save, map: { ...save.map,
      questProgress: { [quest]: { id: quest, status: 'completed', rewardClaimed: true,
        objectives: { 'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': true } } } },
      inventory: { ...save.inventory, questItems: {
        [`${quest}#objective:obj-find-figurine`]: { itemId: 'quest/jade_figurine', state: 'consumed' },
        [`${quest}#objective:obj-give-cain`]: { itemId: 'quest/golden_bird', state: 'consumed' },
        [`${quest}#reward:questItem`]: { itemId: 'items/potion_of_life_q', state: 'consumed' } } } };
    for (const out of [buildSave(input), decodeSave(toJsonSafe(input))]) {
      expect(out.player.derivedStats.lifeMax).toBe(deriveStats(input.player.coreStats, input.player.level).lifeMax + 47);
      expect(out.player.derivedStats).toMatchObject({ life: 7, mana: 3, attack: 333, defense: 444 });
    }
  });
  it('preserves no-charm caches through snapshots and decode', () => {
    const save = sample(), input = { ...save, inventory: { ...save.inventory,
      equipped: { charm: null }, backpack: [{ ...charm, equipped: false }] } };
    expect(buildSave(input)).toEqual(input); expect(decodeSave(toJsonSafe(input))).toEqual(input);
  });
  it.each([Infinity, Number.MAX_SAFE_INTEGER * 2, -10000])('rejects unsafe projected charm capacity %s', life => {
    vi.mocked(loot.loadUniques).mockReturnValue([...uniques, { ...unique, stats: { statMods: { life } } }]);
    const save = withCharm(), before = structuredClone(save);
    expect(() => buildSave(save)).toThrow('Invalid save:');
    expect(() => decodeSave(toJsonSafe(save))).toThrow('Invalid save:');
    expect(save).toEqual(before);
  });
});
