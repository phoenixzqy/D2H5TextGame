import { withoutV20Fields } from '../../../tests/helpers/save-fixtures';
import { describe, expect, it } from 'vitest';
import { buildSave, toJsonSafe } from './serialize';
import { migrateSaveV19 } from './migrate-v19';
import { validateFrozenV18Save, validateSocketSave } from './validate';
import { deriveStats } from '../progression/stats';
import type { SaveV18, SaveV19 } from '../types/save';
import type { HistoricalItem } from './historical-items';
import type { CanonicalSocketItem } from '../items/socket-contents';

function predecessor(): SaveV18 {
  const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
  const save = buildSave({ timestamp: 1000,
    player: { id: 'hero', name: 'Hero', type: 'player', team: 'player', class: 'sorceress',
      level: 30, coreStats, derivedStats: deriveStats(coreStats, 30), statusEffects: [], cooldowns: [],
      skills: [], comboOrder: [], alive: true, turnOrder: 0, experience: 0,
      experienceToNextLevel: 100, statPoints: 0, skillPoints: 0, equipment: [] },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
  return { ...withoutV20Fields(save), version: 18, inventory: { backpack: [], stash: [], equipped: {}, currencies: {},
    materials: {}, questItems: {}, questServices: {}, legacyGearQuarantine: [] } };
}
const gear = (id: string): CanonicalSocketItem => ({ id, baseId: 'items/base/wp1h-short-sword',
  rarity: 'normal', level: 20, identified: true, equipped: false, socketCapacity: 2,
  socketContents: [{ kind: 'rune', id: 'runes/el' }, { kind: 'gem', id: 'gems/ruby/chipped' }],
  affixes: [{ affixId: 'legacy', values: new Map([['statMods.mana', 20]]) }] });
const unsupported = (id: string): HistoricalItem => ({ id, baseId: 'items/base/armor-quilted',
  rarity: 'runeword', level: 20, identified: true, equipped: false, socketCapacity: 2,
  runes: ['runes/ort', 'runes/sol'], runewordId: 'runewords/lore' });
function native(): SaveV19 {
  const old = predecessor();
  const migrated = migrateSaveV19({ ...old, inventory: { ...old.inventory, stash: [unsupported('recover')] } });
  return { ...migrated,
    inventory: { ...migrated.inventory,
      backpack: [gear('bag')], stash: [gear('stash')], equipped: { weapon: { ...gear('hero-weapon'), equipped: true } } } };
}

describe('frozen v18 boundary before the v19 migration', () => {
  it('validates actual old holdings and preserves historically legal incompatible words', () => {
    const old = predecessor();
    const input = { ...old, inventory: { ...old.inventory, backpack: [unsupported('old-lore')] } };
    expect(validateFrozenV18Save(input)).toEqual(input);
    expect(migrateSaveV19(validateFrozenV18Save(input)).inventory.socketQuarantine[0]?.item).toEqual(unsupported('old-lore'));
  });
  it.each([undefined, { 'runes/el': 0 }, { 'runes/unknown': 1 }])('rejects raw bad material holdings before defaults: %j', materials => {
    const old = predecessor();
    expect(() => validateFrozenV18Save({ ...old, inventory: { ...old.inventory, materials } })).toThrow();
  });
  it.each(['materialActionOrdinal', 'latestMaterialAction', 'socketQuarantine'])('reserves %s on direct frozen validation', key => {
    const old = predecessor();
    expect(() => validateFrozenV18Save({ ...old, inventory: { ...old.inventory, [key]: undefined } })).toThrow();
  });
});

describe('native v19 boundary, separate from frozen predecessor semantics', () => {
  it('accepts mixed ordered inserts and separate exact quarantine in native and JSON forms without mutation', () => {
    const input = native(), before = structuredClone(input);
    expect(validateSocketSave(input)).toEqual(toJsonSafe(input));
    expect(validateSocketSave(toJsonSafe(input))).toEqual(toJsonSafe(input));
    expect(input).toEqual(before);
  });
  it('accepts the closed latest result with explicit empty maps', () => {
    const save = native();
    const inventory = { ...save.inventory, materialActionOrdinal: 1, latestMaterialAction: {
      ordinal: 1, requestHash: 'a'.repeat(64), result: { materials: {}, currencies: {} } } };
    expect(validateSocketSave({ ...save, inventory }).inventory).toEqual(toJsonSafe(inventory));
  });
  it.each([
    { materialActionOrdinal: undefined }, { materialActionOrdinal: 0, latestMaterialAction: undefined },
    { materialActionOrdinal: 1 }, { materialActionOrdinal: -1 },
    { materialActionOrdinal: 1, latestMaterialAction: { ordinal: 2, requestHash: 'a'.repeat(64), result: { materials: {}, currencies: {} } } },
    { materialActionOrdinal: 1, latestMaterialAction: { ordinal: 1, requestHash: 'a'.repeat(64), result: { materials: {}, currencies: {}, item: {} } } }
  ])('rejects malformed action state at the save boundary %#', patch => {
    const save = native();
    expect(() => validateSocketSave({ ...save, inventory: { ...save.inventory, ...patch } })).toThrow();
  });
  it.each(['backpack', 'stash', 'equipped', 'hero-mirror', 'merc-mirror', 'merc-equipment'] as const)(
    'rejects obsolete rune arrays at %s even when empty', location => {
      const save = native(), bad = { ...gear('obsolete'), runes: [] };
      const merc = { ...save.player, id: 'merc', type: 'mercenary' as const, archetype: 'rogue', rarity: 'R' as const,
        equipment: location === 'merc-mirror' ? [bad] : [] };
      const input = { ...save, player: { ...save.player, equipment: location === 'hero-mirror' ? [bad] : [] },
        inventory: { ...save.inventory,
          backpack: location === 'backpack' ? [bad] : save.inventory.backpack,
          stash: location === 'stash' ? [bad] : save.inventory.stash,
          equipped: location === 'equipped' ? { weapon: bad } : save.inventory.equipped },
        mercs: { ...save.mercs, ownedMercs: [merc],
          mercEquipment: location === 'merc-equipment' ? { merc: { weapon: bad } } : {} } };
      expect(() => validateSocketSave(input)).toThrow();
    });
  it.each([
    { sourceVersion: 17 }, { extra: true }, { origin: { container: 'stash', index: -1 } },
    { origin: { container: 'mercEquipment', slot: 'weapon' } }, { item: { ...unsupported('recover'), socketContents: [] } }
  ])('rejects malformed recovery provenance/payload %#', patch => {
    const save = native();
    expect(() => validateSocketSave({ ...save, inventory: { ...save.inventory,
      socketQuarantine: [{ ...save.inventory.socketQuarantine[0], ...patch }] } })).toThrow();
  });
  it('rejects active/recovery and duplicate recovery ownership', () => {
    const save = native(), entry = save.inventory.socketQuarantine[0];
    if (!entry) throw new Error('Missing recovery fixture');
    for (const entries of [[entry, { ...entry, origin: { container: 'backpack', index: 0 } }],
      [{ ...entry, item: { ...entry.item, id: 'bag' } }]]) {
      expect(() => validateSocketSave({ ...save, inventory: { ...save.inventory, socketQuarantine: entries } })).toThrow();
    }
  });
  it('preserves old v16 quarantine internal ID collisions, but prevents new owners from colliding with it', () => {
    const save = native();
    const { socketCapacity: _capacity, ...oldItem } = unsupported('frozen16');
    const legacyGearQuarantine = [{ item: oldItem, origin: { container: 'backpack' as const, index: 0 } },
      { item: oldItem, origin: { container: 'stash' as const, index: 0 } }];
    const input = { ...save, inventory: { ...save.inventory, legacyGearQuarantine } };
    expect(validateSocketSave(input).inventory.legacyGearQuarantine).toEqual(legacyGearQuarantine);
    const entry = save.inventory.socketQuarantine[0];
    if (!entry) throw new Error('Missing recovery fixture');
    expect(() => validateSocketSave({ ...input, inventory: { ...input.inventory,
      socketQuarantine: [{ ...entry, item: { ...entry.item, id: oldItem.id } }] } })).toThrow();
  });
  it('rejects raw socket/receipt accessors before normalization without invoking them', () => {
    let reads = 0;
    const save = native();
    const item = Object.defineProperty({ ...gear('getter') }, 'socketContents', { enumerable: true,
      get: () => { reads++; return []; } });
    expect(() => validateSocketSave({ ...save, inventory: { ...save.inventory, backpack: [item] } })).toThrow();
    const inventory = Object.defineProperty({ ...save.inventory }, 'latestMaterialAction', { enumerable: true,
      get: () => { reads++; return undefined; } });
    expect(() => validateSocketSave({ ...save, inventory })).toThrow();
    expect(reads).toBe(0);
  });
});


describe('native v19 raw boundary regressions', () => {
  it.each(['socketContents', 'socketCapacity', 'personalizedBy'])('rejects raw %s inside frozen16 quarantine', field => {
    const save = native();
    const { socketCapacity: _capacity, ...item } = unsupported('old16');
    const input = { ...save, inventory: { ...save.inventory, legacyGearQuarantine: [
      { item: { ...item, [field]: undefined }, origin: { container: 'stash', index: 0 } }
    ] } };
    expect(() => validateSocketSave(input)).toThrow();
  });

  it.each(['inventory', 'level', 'affix', 'legacy-origin', 'legacy-socket', 'symbol', 'map-value', 'map-key', 'set-value'])(
    'rejects %s accessors before evaluating any imported getter', location => {
      const save = native();
      let reads = 0;
      const getter = { enumerable: true, get: () => { reads++; return location === 'inventory' ? save.inventory : 20; } };
      const payload = Object.defineProperty({}, 'field', getter);
      let input: unknown;
      if (location === 'inventory') input = Object.defineProperty({ ...save }, 'inventory', getter);
      else if (location === 'legacy-origin' || location === 'legacy-socket') {
        const { socketCapacity: _capacity, ...old } = unsupported('old16');
        const entry = { item: old, origin: { container: 'stash', index: 0 } };
        if (location === 'legacy-origin') Object.defineProperty(entry, 'origin', getter);
        else Object.defineProperty(old, 'socketContents', getter);
        input = { ...save, inventory: { ...save.inventory, legacyGearQuarantine: [entry] } };
      } else {
        const item = gear('raw-getter');
        if (location === 'level') Object.defineProperty(item, 'level', getter);
        else if (location === 'affix') {
          const affix = item.affixes?.[0];
          if (!affix || !('values' in affix)) throw new Error('Missing legacy affix fixture');
          Object.defineProperty(affix.values, 'payload', getter);
        }
        else if (location === 'symbol') Object.defineProperty(item, Symbol('hidden'), getter);
        const extra = location === 'map-value' ? new Map([['key', payload]])
          : location === 'map-key' ? new Map([[payload, 'value']])
            : location === 'set-value' ? new Set([payload]) : {};
        input = { ...save, inventory: { ...save.inventory, backpack: [Object.assign(item, { extra })] } };
      }
      expect(reads).toBe(0);
      expect(() => validateSocketSave(input)).toThrow();
      expect(reads).toBe(0);
    });

  it.each(['active-empty-id', 'frozen16-empty-id', 'empty-merc-key', 'unknown-slot', 'unknown-null-slot', 'empty-slot'])(
    'accepts the migration of historically valid %s without changing payload', location => {
      let old = predecessor();
      const { socketContents: _contents, ...item } = gear(location === 'active-empty-id' ? '' : 'historic-item');
      if (location === 'active-empty-id') old = { ...old, inventory: { ...old.inventory, backpack: [item] } };
      if (location === 'frozen16-empty-id') {
        const { socketCapacity: _capacity, ...old16 } = item;
        old = { ...old, inventory: { ...old.inventory, legacyGearQuarantine: [
          { item: { ...old16, id: '' }, origin: { container: 'stash', index: 0 } },
          { item: { ...old16, id: '' }, origin: { container: 'backpack', index: 0 } }
        ] } };
      }
      if (location === 'empty-merc-key') old = { ...old, mercs: { ...old.mercs, mercEquipment: { '': { weapon: item } } } };
      if (location === 'unknown-slot') old = { ...old, inventory: { ...old.inventory, equipped: { historic: item } } };
      if (location === 'unknown-null-slot') old = { ...old, inventory: { ...old.inventory, equipped: { historic: null } } };
      if (location === 'empty-slot') old = { ...old, inventory: { ...old.inventory, equipped: { '': item } } };
      const before = structuredClone(old);
      const validated = validateFrozenV18Save(old);
      const migrated = migrateSaveV19(validated);
      expect(validateSocketSave(migrated)).toEqual(toJsonSafe(migrated));
      expect(validateSocketSave(toJsonSafe(migrated))).toEqual(toJsonSafe(migrated));
      expect(old).toEqual(before);
    });
});


describe('v18 quarantine exact open location compatibility', () => {
  it.each([
    { container: 'equipped', slot: 'historic' }, { container: 'equipped', slot: '' },
    { container: 'mercEquipment', mercId: '', slot: 'chest' },
    { container: 'mercEquipment', mercId: 'merc', slot: '' }
  ] as const)('preserves unsupported gear originally owned at %j', origin => {
    let old = predecessor();
    const item = unsupported('historic-recover');
    if (origin.container === 'equipped') old = { ...old, inventory: { ...old.inventory, equipped: { [origin.slot]: item } } };
    else old = { ...old, mercs: { ...old.mercs, mercEquipment: { [origin.mercId]: { [origin.slot]: item } } } };
    const migrated = migrateSaveV19(validateFrozenV18Save(old));
    expect(migrated.inventory.socketQuarantine).toEqual([{ sourceVersion: 18, item, origin }]);
    expect(validateSocketSave(migrated)).toEqual(toJsonSafe(migrated));
  });
});


describe('native normalization uses intrinsic container operations', () => {
  it.each(['Map', 'Array'])('does not invoke an inherited %s normalization accessor', kind => {
    const save = native();
    let reads = 0;
    const map = new Map([['statMods.mana', 20]]);
    const list = [gear('intrinsic')];
    const proto = Object.create(kind === 'Map' ? Map.prototype : Array.prototype) as object;
    Object.defineProperty(proto, kind === 'Map' ? 'entries' : 'map', {
      get: () => { reads++; throw new Error('Imported normalization accessor'); }
    });
    if (kind === 'Map') {
      Object.setPrototypeOf(map, proto);
      list[0] = { ...gear('intrinsic'), affixes: [{ affixId: 'legacy', values: map }] };
    } else Object.setPrototypeOf(list, proto);
    const input = { ...save, inventory: { ...save.inventory, backpack: list } };
    expect(() => validateSocketSave(input)).toThrow();
    expect(reads).toBe(0);
  });
});


describe('inherited native save accessors', () => {
  it.each(['inventory', 'questProgress', 'sparse-affix'])('rejects inherited %s without invoking it', location => {
    const save = native();
    let reads = 0;
    const questProgress = save.map.questProgress;
    const getter = { get: () => { reads++; return location === 'inventory' ? save.inventory
      : location === 'questProgress' ? questProgress : { id: 'unknown-affix', tier: 0, rolledValue: 1 }; } };
    const input = { ...save };
    if (location === 'sparse-affix') {
      const affixes: NonNullable<CanonicalSocketItem['affixes']>[number][] = [];
      affixes.length = 1;
      Object.setPrototypeOf(affixes, Object.defineProperty(Object.create(Array.prototype) as object, '0', getter));
      input.inventory = { ...save.inventory, backpack: [{ ...gear('sparse'), affixes }] };
    } else {
      const target = location === 'inventory' ? input : input.map;
      Reflect.deleteProperty(target, location);
      Object.setPrototypeOf(target, Object.defineProperty({}, location, getter));
    }
    expect(() => validateSocketSave(input)).toThrow();
    expect(reads).toBe(0);
  });
  it('rejects cycles while accepting repeated data references', () => {
    const save = native(), shared = { label: 'data' }, extra: Record<string, unknown> = { left: shared, right: shared };
    const input = { ...save, extra };
    expect(validateSocketSave(input)).toEqual(toJsonSafe(input));
    extra.self = extra;
    expect(() => validateSocketSave(input)).toThrow(/cyclic/);
  });
});
