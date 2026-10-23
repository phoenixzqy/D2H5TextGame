import { withoutV19Fields, withV19Defaults } from '../../../tests/helpers/save-fixtures';
import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_VERSION, MIGRATIONS } from '../types/save';
import { deriveStats } from '../progression/stats';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave } from './validate';

function sample() {
  const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
  return buildSave({ timestamp: 1000,
    player: { id: 'hero', name: 'Hero', type: 'player', team: 'player', class: 'sorceress',
      level: 1, coreStats, derivedStats: deriveStats(coreStats, 1), statusEffects: [], cooldowns: [],
      skills: [], comboOrder: [], alive: true, turnOrder: 0, experience: 0,
      experienceToNextLevel: 100, statPoints: 0, skillPoints: 0, equipment: [] },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { 'rune-shard': 321, 'old-token': 9 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}

function predecessor17() {
  const current = withoutV19Fields(sample());
  const inventory = Object.fromEntries(Object.entries(current.inventory).filter(([key]) => key !== 'materials'));
  return { ...current, version: 17, inventory };
}

describe('v18 concrete material ownership', () => {
  it('adds exactly an empty ledger to validated v17 without inventing old shard identities', () => {
    expect(CURRENT_SAVE_VERSION).toBe(19);
    const old = predecessor17(), before = structuredClone(old);
    const expected = { ...old, version: 18, inventory: { ...old.inventory, materials: {} } };
    const migrate = MIGRATIONS[18];
    if (!migrate) throw new Error('Missing v18 migration');
    expect(migrate(old)).toEqual(expected);
    expect(decodeSave(old)).toEqual(withV19Defaults(expected));
    expect(old).toEqual(before);
  });

  it('round trips exact typed balances including the safe-integer boundary without changing currencies', () => {
    const current = sample();
    const materials = { 'runes/ral': Number.MAX_SAFE_INTEGER, 'gems/ruby/chipped': 2, 'materials/scrap': 7 };
    const native = { ...current, inventory: { ...current.inventory, materials } };
    expect(decodeSave(native)).toEqual(native);
    expect(decodeSave(toJsonSafe(native))).toEqual(native);
    expect(native.inventory.currencies).toEqual({ 'rune-shard': 321, 'old-token': 9 });
  });

  it('requires the native field, while only truly absent trusted builder input defaults', () => {
    const current = sample();
    expect(current.inventory).toHaveProperty('materials', {});
    expect(() => decodeSave({ ...current, inventory: predecessor17().inventory })).toThrow();
    const input = { ...current, inventory: { ...current.inventory, materials: undefined } };
    expect(() => buildSave(input as unknown as Parameters<typeof buildSave>[0])).toThrow(/material/i);
  });

  it.each([undefined, null, [], 1, { 'runes/ral': 0 }, { 'runes/ral': -1 }, { 'runes/ral': 0.5 },
    { 'runes/ral': Infinity }, { 'runes/ral': NaN }, { 'runes/ral': Number.MAX_SAFE_INTEGER + 1 },
    { 'runes/Ral': 1 }, { 'runes/not-real': 1 }, { 'gems/ruby/not-real': 1 }, { 'currency/wishstone': 1 },
    JSON.parse('{"__proto__":1}') as unknown, { constructor: 1 }, Object.create({ 'runes/ral': 1 }) as unknown
  ])('rejects malformed native materials before normalization: %j', materials => {
    const current = sample();
    expect(() => decodeSave({ ...current, inventory: { ...current.inventory, materials } })).toThrow(/material/i);
    expect(() => buildSave({ ...current, inventory: { ...current.inventory, materials } } as Parameters<typeof buildSave>[0]))
      .toThrow(/material/i);
  });

  it('does not invoke material accessors or erase inherited/nonenumerable ownership', () => {
    const current = sample();
    const getter = { get materials(): never { throw new Error('must not evaluate accessor'); } };
    const materials = Object.defineProperty({}, 'runes/ral', { value: 1, enumerable: false });
    expect(() => decodeSave({ ...current, inventory: { ...current.inventory, materials } })).toThrow(/material/i);
    const inventory = { ...current.inventory };
    Object.defineProperty(inventory, 'materials', Object.getOwnPropertyDescriptor(getter, 'materials') ?? {});
    expect(() => decodeSave({ ...current, inventory })).toThrow(/material/i);
  });

  it.each(Array.from({ length: 17 }, (_, index) => index + 1))(
    'rejects the reserved field in original v%i before migration can erase it', version => {
      const old = predecessor17();
      for (const materials of [{}, undefined, { 'runes/ral': 1 }]) {
        expect(() => decodeSave({ ...old, version, inventory: { ...old.inventory, materials } }))
          .toThrow(/reserved.*material|historical.*material/i);
      }
    });

  it('validates v17 item and quest authority before adding the ledger', () => {
    const old = predecessor17();
    expect(() => decodeSave({ ...old, inventory: { ...old.inventory, backpack: [{ id: 'invalid' }] } })).toThrow();
    expect(() => decodeSave({ ...old, map: { ...old.map, questReceipts: { forged: true } } })).toThrow();
  });
});

describe('raw pre-v19 reservation before chained normalization or migration', () => {
  function predecessor18() {
    return { ...withoutV19Fields(sample()), version: 18 as const };
  }
  it.each(['Map', 'Set'] as const)('uses intrinsic %s traversal without invoking imported methods', kind => {
    let calls = 0;
    const nested = { baseId: 'items/base/wp1h-short-sword', socketContents: undefined };
    const container = kind === 'Map' ? new Map([['gear', nested]]) : new Set([nested]);
    Object.defineProperty(container, 'values', { get: () => { calls++; return () => []; } });
    expect(() => decodeSave({ ...predecessor18(), snapshot: container })).toThrow('reserved v19');
    expect(calls).toBe(0);
  });
  it('rejects a version accessor without invoking it', () => {
    let calls = 0;
    const input = predecessor18();
    Object.defineProperty(input, 'version', { enumerable: true, get: () => { calls++; return 18; } });
    expect(() => decodeSave(input)).toThrow(/version/i);
    expect(calls).toBe(0);
  });
  it('rejects a symbol iterator accessor before a v1 migration can invoke it', () => {
    let calls = 0;
    const equipment = new Map();
    Object.defineProperty(equipment, Symbol.iterator, { get: () => { calls++; return Map.prototype[Symbol.iterator]; } });
    const input = predecessor18();
    const old = { version: 1, timestamp: input.timestamp, player: input.player,
      inventory: { backpack: [], stash: [], equipment }, mercenaries: [],
      mapProgress: { currentAct: 1, currentSubArea: null, completedSubAreas: [] },
      ...input.meta };
    expect(() => decodeSave(old)).toThrow(/accessor/i);
    expect(calls).toBe(0);
  });
  it('preserves same-spelled keys in open historical currency dictionaries', () => {
    const input = predecessor18();
    const currencies = { socketContents: 1, materialActionOrdinal: 2, latestMaterialAction: 3,
      socketQuarantine: 4, sourceVersion: 5, item: 6, origin: 7 };
    expect(decodeSave({ ...input, inventory: { ...input.inventory, currencies } }).inventory.currencies)
      .toEqual(currencies);
  });
  it.each(Array.from({ length: 18 }, (_, index) => index + 1).flatMap(version =>
    ['materialActionOrdinal', 'latestMaterialAction', 'socketQuarantine'].map(field => ({ version, field }))))(
    'rejects own undefined $field on raw v$version before migration', ({ version, field }) => {
      const save = predecessor18();
      const inventory = { ...save.inventory, [field]: undefined };
      expect(() => decodeSave({ ...save, version, inventory })).toThrow('reserved v19');
    });
  it.each(['backpack', 'stash', 'equipped', 'heroMirror', 'mercEquipment', 'mercMirror',
    'legacyEquipmentMap', 'legacyEquipmentArray', 'legacyMercMirror', 'quarantine', 'snapshot'] as const)(
    'rejects reserved sockets in raw %s without invoking the socket getter', site => {
      const save = predecessor18();
      const gear = { id: 'reserved', baseId: 'items/base/wp1h-short-sword', rarity: 'normal' as const,
        level: 1, socketCapacity: 2, identified: true, equipped: false };
      Object.defineProperty(gear, 'socketContents', { enumerable: true, get: () => { throw new Error('evaluated reserved getter'); } });
      const merc = { ...save.player, id: 'merc', type: 'mercenary' as const, archetype: 'rogue', rarity: 'common', equipment: [gear] };
      const input = { ...save,
        player: { ...save.player, equipment: site === 'heroMirror' ? [gear] : [] },
        inventory: { ...save.inventory,
          backpack: site === 'backpack' ? [gear] : [], stash: site === 'stash' ? [gear] : [],
          equipped: site === 'equipped' ? { weapon: gear } : {},
          ...(site === 'legacyEquipmentMap' ? { equipment: new Map([['weapon', gear]]) } : {}),
          ...(site === 'legacyEquipmentArray' ? { equipment: [['weapon', gear]] } : {}),
          legacyGearQuarantine: site === 'quarantine' ? [{ item: gear, origin: { container: 'backpack' as const, index: 0 } }] : [] },
        mercs: { ...save.mercs, ownedMercs: site === 'mercMirror' ? [merc] : [],
          mercEquipment: site === 'mercEquipment' ? { merc: { weapon: gear } } : {} },
        ...(site === 'legacyMercMirror' ? { mercenaries: [merc] } : {}),
        ...(site === 'snapshot' ? { combatSnapshot: { actors: [{ equipment: [gear] }] } } : {}) };
      expect(() => decodeSave(input)).toThrow('reserved v19');
    });
  it('rejects a raw new quarantine discriminator before legacy quarantine normalization', () => {
    const save = predecessor18();
    expect(() => decodeSave({ ...save, inventory: { ...save.inventory,
      legacyGearQuarantine: [{ sourceVersion: undefined, item: {}, origin: {} }] } })).toThrow('reserved v19');
  });
});
