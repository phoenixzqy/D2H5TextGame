import { withoutV17Fields, withCurrentDefaults } from '../../../tests/helpers/save-fixtures';
import { assert, describe, expect, it, vi } from 'vitest';
import type { DerivedStats } from '../types/attributes';
import { CURRENT_SAVE_VERSION, type LegacyDerivedStats } from '../types/save';
import type { Item } from '../types/items';
import { toJsonSafe } from './serialize';
import { buildSave } from './serialize';
import { decodeSave, decodeSaveJson, validateSave } from './validate';
import { deriveStats } from '../progression/stats';
import { DEFAULT_LOOT_FILTER } from '../loot/filter';

function historicalStats(stats: DerivedStats): LegacyDerivedStats {
  const { magicResist: _mr, ...old } = stats;
  return old;
}

/** Expected fixture capacities are the frozen template capacities, not new item rolls. */
function expectedGear<T extends { baseId: string }>(item: T) {
  const capacities: Record<string, number> = {
    'items/base/weapon-bow-training': 0, 'items/base/helm-cap': 2, 'items/base/sh-buckler': 1
  };
  const socketCapacity = capacities[item.baseId];
  if (socketCapacity === undefined) throw new Error(`Unspecified fixture base ${item.baseId}`);
  return { ...item, socketCapacity };
}
function expectedSlots(slots: Readonly<Record<string, { baseId: string } | null | undefined>>) {
  return Object.fromEntries(Object.entries(slots).map(([slot, item]) => [slot, item ? expectedGear(item) : null]));
}
/** Current defaults and authoritative equipment replace historical actor cache mirrors. */
function expectedCurrent<T extends {
  inventory: { backpack: readonly { baseId: string }[]; stash: readonly { baseId: string }[];
    equipped: Readonly<Record<string, { baseId: string } | null | undefined>> };
  map: object; player: { derivedStats: LegacyDerivedStats };
  mercs: { mercEquipment: Readonly<Record<string, Readonly<Record<string, { baseId: string } | null | undefined>>>>;
    ownedMercs: readonly { id: string; derivedStats: LegacyDerivedStats }[] }
}>(save: T) {
  const equipped = expectedSlots(save.inventory.equipped);
  const mercEquipment = Object.fromEntries(Object.entries(save.mercs.mercEquipment)
    .map(([id, slots]) => [id, expectedSlots(slots)]));
  return withCurrentDefaults({ ...save,
    inventory: { ...save.inventory, questItems: {}, equipped,
      backpack: save.inventory.backpack.map(expectedGear), stash: save.inventory.stash.map(expectedGear) },
    map: { ...save.map, questReceipts: {} },
    player: { ...save.player, equipment: Object.values(equipped).filter(item => item !== null),
      derivedStats: { ...save.player.derivedStats, magicResist: 0 } },
    mercs: { ...save.mercs, mercEquipment, ownedMercs: save.mercs.ownedMercs.map(merc => ({ ...merc,
      equipment: Object.values(mercEquipment[merc.id] ?? {}).filter(item => item !== null),
      derivedStats: { ...merc.derivedStats, magicResist: 0 } })) } });
}

const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
function sampleSave() {
  return buildSave({
    player: {
      id: 'hero',
      name: 'Hero',
      type: 'player',
      team: 'player',
      class: 'sorceress',
      level: 1,
      coreStats,
      derivedStats: deriveStats(coreStats, 1),
      statusEffects: [],
      cooldowns: [],
      skills: [],
      comboOrder: [],
      alive: true,
      turnOrder: 0,
      experience: 0,
      experienceToNextLevel: 100,
      statPoints: 0,
      skillPoints: 1,
      equipment: []
    },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: {
      currentAct: 1,
      currentSubAreaId: null,
      discoveredAreas: [],
      clearedSubAreas: [],
      questProgress: {}
    },
    meta: {
      settings: {
        locale: 'zh-CN',
        stealthMode: false,
        soundEnabled: true,
        musicEnabled: true,
        combatSpeed: 1,
        autoCombat: true
      },
      idleState: {
        lastOnline: 1000,
        offlineTime: 0,
        multiplierSecondsRemaining: 0,
        activeMultiplier: 1
      },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 }
    },
    formation: {
      playerPosition: { row: 1, col: 1 },
      mercPosition: { row: 0, col: 0 },
      summonPositions: []
    },
    timestamp: 1000
  });
}

describe('save boundary', () => {
  it('round-trips an opt-in loot filter while accepting older current saves without one', () => {
    const old = sampleSave();
    expect(decodeSaveJson(JSON.stringify(toJsonSafe(old))).meta.settings.lootFilter).toBeUndefined();
    const lootFilter = { ...DEFAULT_LOOT_FILTER, enabled: true, maxItemLevel: 25,
      actions: { ...DEFAULT_LOOT_FILTER.actions, normal: 'salvage' as const, rare: 'discard' as const } };
    const current = { ...old, meta: { ...old.meta, settings: { ...old.meta.settings, lootFilter } } };
    expect(decodeSaveJson(JSON.stringify(toJsonSafe(current))).meta.settings.lootFilter).toEqual(lootFilter);
  });

  it.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1, null])('rejects invalid loot filter level %s', maxItemLevel => {
    const old = sampleSave();
    const settings = { ...old.meta.settings, lootFilter: { ...DEFAULT_LOOT_FILTER, maxItemLevel } };
    expect(() => decodeSave({ ...old, meta: { ...old.meta, settings } })).toThrow('Invalid save');
  });

  it('rejects invalid loot filter actions before hydration', () => {
    const old = sampleSave();
    const settings = { ...old.meta.settings, lootFilter: { ...DEFAULT_LOOT_FILTER,
      actions: { ...DEFAULT_LOOT_FILTER.actions, normal: 'sell' } } };
    expect(() => decodeSave({ ...old, meta: { ...old.meta, settings } })).toThrow('Invalid save');
  });
  it('uses the parser-owned JSON tree without scanning it for native object descriptors', () => {
    const save = sampleSave(), json = JSON.stringify(toJsonSafe(save));
    const ownKeys = vi.spyOn(Reflect, 'ownKeys');
    let graphWalks: number;
    try {
      expect(decodeSaveJson(json)).toEqual(save);
      graphWalks = ownKeys.mock.calls.filter(([node]) => Object.hasOwn(node, 'row') && Object.hasOwn(node, 'col')).length;
    } finally {
      ownKeys.mockRestore();
    }
    expect(graphWalks).toBe(0);
  });

  it('restores portable affix Maps exactly like native decoding', () => {
    const base = sampleSave();
    const item: Item = { id: 'portable-affix', baseId: 'items/base/helm-cap',
      rarity: 'magic', level: 1, socketCapacity: 2, identified: true, equipped: false,
      affixes: [{ affixId: 'legacy', values: new Map([['statMods.mana', 12]]) }] };
    const save = { ...base, inventory: { ...base.inventory, backpack: [item] } };
    const json = JSON.stringify(toJsonSafe(save)), output = decodeSaveJson(json);
    expect(output).toEqual(decodeSave(JSON.parse(json) as unknown));
    expect(output).toEqual(save);
    const affix = output.inventory.backpack[0]?.affixes?.[0];
    expect(affix && 'values' in affix && affix.values).toBeInstanceOf(Map);
    expect(decodeSave(output)).toEqual(output);
    Object.defineProperty(output.formation.playerPosition, 'hidden', { get: () => { throw new Error('Getter executed'); } });
    expect(() => decodeSave(output)).toThrow('accessor');
  });

  it('preserves frozen quarantine payloads and provenance through portable decoding', () => {
    const base = sampleSave();
    const item = { id: 'legacy-quarantine', baseId: 'items/base/helm-cap',
      rarity: 'magic' as const, level: 1, identified: true, equipped: false,
      affixes: [{ affixId: 'legacy', values: new Map([['statMods.mana', 12]]) }] };
    const save = { ...base, inventory: { ...base.inventory, legacyGearQuarantine: [
      { item, origin: { container: 'backpack' as const, index: 4 } }
    ] } };
    const json = JSON.stringify(toJsonSafe(save)), output = decodeSaveJson(json);
    expect(output).toEqual(save);
    expect(output).toEqual(decodeSave(JSON.parse(json) as unknown));
  });

  it.each(['origin', 'duplicate-origin', 'payload'] as const)(
    'retains the native quarantine error for portable %s corruption', kind => {
      const base = sampleSave();
      const entry = { item: { id: 'legacy-quarantine', baseId: 'items/base/helm-cap',
        rarity: 'normal', level: kind === 'payload' ? '1' : 1,
        identified: true, equipped: false },
        origin: { container: 'backpack', index: kind === 'origin' ? -1 : 4 } };
      const save = { ...base, inventory: { ...base.inventory, legacyGearQuarantine:
        kind === 'duplicate-origin' ? [entry, { ...entry, item: { ...entry.item, id: 'other' } }] : [entry] } };
      const json = JSON.stringify(toJsonSafe(save)), parsed: unknown = JSON.parse(json);
      const before = structuredClone(parsed);
      let nativeError: unknown;
      try { decodeSave(parsed); } catch (error) { nativeError = error; }
      assert(nativeError instanceof Error);
      expect(() => decodeSaveJson(json)).toThrow(nativeError.message);
      expect(parsed).toEqual(before);
    }
  );

  it.each([
    ['player', { ...sampleSave().player, level: 0 }],
    ['player', { ...sampleSave().player, respecsRemaining: -1 }],
    ['player', { ...sampleSave().player, selectedAuraId: 'paladin.unknown' }],
    ['inventory', { ...sampleSave().inventory, backpack: [null] }],
    ['inventory', { ...sampleSave().inventory, materialActionOrdinal: 1 }],
    ['map', { ...sampleSave().map, questProgress: { quest: { status: 'completed' } } }],
    ['map', { ...sampleSave().map, bounties: { unknown: {} } }],
    ['meta', { ...sampleSave().meta, recruitmentState: { srPityCounter: -1, totalPulls: 0, history: [] } }],
    ['formation', { ...sampleSave().formation, mercPosition: { row: 3, col: 0 } }]
  ])('retains semantic and schema rejection for portable %s corruption %#', (field, value) => {
    const json = JSON.stringify(toJsonSafe({ ...sampleSave(), [field]: value }));
    expect(() => decodeSave(JSON.parse(json) as unknown)).toThrow();
    expect(() => decodeSaveJson(json)).toThrow();
  });

  it.each(['duplicate', 'unknown-base', 'invalid-rune', 'false-runeword', 'charm-slot'] as const)(
    'retains portable item ownership and socket checks for %s', kind => {
      const save = sampleSave();
      const item: Item = { id: 'portable-item', baseId: 'items/base/helm-cap',
        rarity: 'normal', level: 1, socketCapacity: 2, identified: true, equipped: false };
      const corruptItem: Item = { ...item,
        ...(kind === 'unknown-base' ? { baseId: 'items/base/unknown' } : {}),
        ...(kind === 'invalid-rune' ? { socketContents: [{ kind: 'rune' as const, id: 'runes/unknown' }] } : {}),
        ...(kind === 'false-runeword' ? { rarity: 'runeword' as const } : {}) };
      const inventory = { ...save.inventory,
        backpack: kind === 'charm-slot' ? [] : [corruptItem],
        stash: kind === 'duplicate' ? [{ ...item }] : [],
        equipped: kind === 'charm-slot' ? { charm: item } : {} };
      const json = JSON.stringify(toJsonSafe({ ...save, inventory }));
      expect(() => decodeSave(JSON.parse(json) as unknown)).toThrow();
      expect(() => decodeSaveJson(json)).toThrow();
    }
  );

  it.each(['{', 'null', '[]', '{}', '{"version":0}', '{"version":34}', '{"version":33,"inventory":{}}'])(
    'refuses malformed or unsupported portable save %s', json => {
      expect(() => decodeSaveJson(json)).toThrow();
    }
  );

  it('requires actual JSON text without coercing an object supplied by JavaScript', () => {
    let reads = 0;
    const input = { toString: () => { reads++; return JSON.stringify(toJsonSafe(sampleSave())); } };
    expect(() => { Reflect.apply(decodeSaveJson, undefined, [input]); }).toThrow('JSON text required');
    expect(reads).toBe(0);
  });

  it('treats prototype-looking JSON keys as data just like native normalization', () => {
    const json = JSON.stringify(toJsonSafe(sampleSave())).replace(/}$/, ',"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}');
    expect(decodeSaveJson(json)).toEqual(decodeSave(JSON.parse(json) as unknown));
    expect(Object.getOwnPropertyDescriptor(Object.prototype, 'polluted')).toBeUndefined();
  });

  it('retains the complete historical v7 migration path for portable saves', () => {
    const json = JSON.stringify(toJsonSafe(legacyAmazon()));
    expect(decodeSaveJson(json)).toEqual(decodeSave(JSON.parse(json) as unknown));
    expect(decodeSaveJson(json).version).toBe(CURRENT_SAVE_VERSION);
  });

  it('inspects each current-save graph once before validation and restoration', () => {
    const save = sampleSave();
    const ownKeys = vi.spyOn(Reflect, 'ownKeys');
    let graphWalks: number;
    try {
      expect(decodeSave(save)).toEqual(save);
      graphWalks = ownKeys.mock.calls.filter(([node]) => node === save.formation.playerPosition).length;
    } finally {
      ownKeys.mockRestore();
    }
    expect(graphWalks).toBe(1);
  });

  it.each(['hidden', 'symbol', 'prototype', 'map-key', 'map-value', 'set-value'] as const)(
    'rechecks a previously decoded current save and rejects a %s getter without executing it', location => {
      const save = sampleSave();
      expect(decodeSave(save)).toEqual(save);
      let reads = 0;
      const hostile = Object.defineProperty({}, location === 'symbol' ? Symbol('field') : 'field', {
        enumerable: location !== 'hidden', get: () => { reads++; return 1; }
      });
      const nested = location === 'prototype' ? Object.create(hostile) as object
        : location === 'map-key' ? new Map([[hostile, 1]])
        : location === 'map-value' ? new Map([['key', hostile]])
        : location === 'set-value' ? new Set([hostile]) : hostile;
      Object.defineProperty(save.formation.playerPosition, 'hiddenState', { value: nested });
      expect(() => decodeSave(save)).toThrow('accessor');
      expect(() => validateSave(save)).toThrow('accessor');
      expect(reads).toBe(0);
    }
  );

  it('rejects a cycle introduced after a successful current decode', () => {
    const save = sampleSave();
    expect(decodeSave(save)).toEqual(save);
    Object.defineProperty(save.formation.playerPosition, 'cycle', { value: save });
    expect(() => decodeSave(save)).toThrow('cyclic');
    expect(() => validateSave(save)).toThrow('cyclic');
  });

  it('preserves a valid current save and optional legacy fields without mutation', () => {
    const save = sampleSave();
    const original = JSON.stringify(save);
    expect(decodeSave(save)).toEqual(save);
    expect(JSON.stringify(save)).toBe(original);
  });

  it('migrates valid v6 formation preferences without mutating the original', () => {
    const { formation: _formation, ...rest } = withoutV17Fields(sampleSave());
    const { questItems: _ledger, ...inventory } = rest.inventory;
    const { questReceipts: _receipts, ...map } = rest.map;
    const legacy = { ...rest, inventory, map, version: 6, player: { ...rest.player, derivedStats: historicalStats(rest.player.derivedStats) } };
    expect(decodeSave(legacy).version).toBe(CURRENT_SAVE_VERSION);
    expect(decodeSave(legacy).formation.playerPosition).toEqual({ row: 1, col: 1 });
    expect(legacy).not.toHaveProperty('formation');
  });

  it('restores JSON-serialized legacy affix values and skill synergies as Maps', () => {
    const save = sampleSave();
    const withMaps = {
      ...save,
      inventory: {
        ...save.inventory,
        equipped: {
          weapon: {
            id: 'legacy-item',
            baseId: 'items/base/weapon-bow-training',
            socketCapacity: 0,
            rarity: 'normal',
            level: 1,
            identified: true,
            equipped: true,
            affixes: [{ affixId: 'legacy-affix', values: [['attack', 12]] }]
          }
        }
      },
      player: {
        ...save.player,
        skills: [
          {
            id: 'test-skill',
            name: 'Test',
            description: '',
            trigger: 'active',
            target: 'single-enemy',
            cooldown: 1,
            cost: {},
            minLevel: 1,
            level: 1,
            maxLevel: 20,
            synergies: [['physical', 0.2]]
          }
        ]
      }
    };
    const decoded = decodeSave(withMaps);
    const affix = decoded.inventory.equipped.weapon?.affixes?.[0];
    expect(affix && 'values' in affix && affix.values).toEqual(new Map([['attack', 12]]));
    expect(decoded.player.skills[0]?.synergies).toEqual(new Map([['physical', 0.2]]));
  });

  it.each([0, -1, 0.5, 91, 1e300])('rejects unsafe player level %s', (level) => {
    const save = sampleSave();
    expect(() => decodeSave({ ...save, player: { ...save.player, level } })).toThrow(
      'Invalid save'
    );
  });

  it.each([new Map([['attack', 'bad']]), new Map([['attack', Infinity]]), new Map([[3, 12]])])(
    'rejects corrupt native Maps loaded from IndexedDB %#',
    (values) => {
      const save = sampleSave();
      const corrupted = {
        ...save,
        inventory: {
          ...save.inventory,
          stash: [
            {
              id: 'bad-affix',
              baseId: 'items/base/weapon-bow-training',
              socketCapacity: 0,
              rarity: 'normal',
              level: 1,
              identified: true,
              equipped: false,
              affixes: [{ affixId: 'legacy', values }]
            }
          ]
        }
      };
      expect(() => decodeSave(corrupted)).toThrow('Invalid save');
    }
  );

  it.each([
    null,
    [],
    {},
    { version: 7 },
    { version: 8 },
    { version: NaN },
    { version: Infinity },
    { version: 6.5 },
    { version: -1 }
  ])('rejects invalid version/shape %#', (value) => {
    expect(() => decodeSave(value)).toThrow();
  });

  it.each([
    ['inventory', { ...sampleSave().inventory, backpack: [null] }],
    ['meta', { ...sampleSave().meta, settings: { locale: 'bad' } }],
    ['formation', { ...sampleSave().formation, mercPosition: { row: 3, col: 0 } }],
    ['player', { ...sampleSave().player, experience: Infinity }],
    ['map', { ...sampleSave().map, questProgress: { quest: { status: 'completed' } } }]
  ])('rejects malformed nested %s before hydration', (field, value) => {
    expect(() => decodeSave({ ...sampleSave(), [field]: value })).toThrow('Invalid save');
  });
});


const starterId = 'starter-amazon-bow-1792497600123';
function legacyStarter(intermediate = false): Item {
  return {
    id: starterId,
    baseId: intermediate ? 'items/base/weapon-bow-training' : 'items/base/weapon-bow',
    rarity: 'normal', level: 1, identified: true, equipped: true, equipSlot: 'weapon',
    ...(intermediate ? { ilvl: 1, baseRolls: { attack: 13 } } : {})
  };
}
function legacyAmazon(intermediate = false) {
  const base = withoutV17Fields(sampleSave());
  // Freeze this v7 fixture before fields introduced by later save builders.
  const { questItems: _ledger, ...inventory } = base.inventory;
  const { questReceipts: _receipts, ...map } = base.map;
  const coreStats = { strength: 20, dexterity: 25, vitality: 20, energy: 15 };
  return {
    ...base, inventory, map, version: 7,
    player: {
      ...base.player, class: 'amazon', coreStats, derivedStats: historicalStats(deriveStats(coreStats, 1)),
      equipment: [legacyStarter(intermediate)], comboOrder: ['amazon.magic_arrow'],
      skillLevels: { 'amazon.magic_arrow': 1 }
    }
  };
}

/** Repair runs through the existing untrusted-save decoder, never a hypothetical helper. */
describe('conservative legacy Amazon starter compatibility', () => {
  it.each([false, true])('transfers proven signature intermediate=%s once, preserving source', (intermediate) => {
    const input = legacyAmazon(intermediate);
    const before = structuredClone(input);
    const output = decodeSave(input);
    expect(output.player.equipment).toEqual(Object.values(output.inventory.equipped).filter(item => item != null));
    expect(output.version).toBe(CURRENT_SAVE_VERSION);
    expect(output.inventory.equipped.weapon).toEqual({
      ...legacyStarter(true), id: starterId, socketCapacity: 0
    });
    expect(output.player.derivedStats.attack).toBe(35);
    expect(output.player.comboOrder).toEqual(['amazon.magic_arrow']);
    expect(output.player.skillLevels).toEqual({ 'amazon.magic_arrow': 1 });
    expect(output.player.derivedStats.life).toBe(input.player.derivedStats.life);
    expect(output.player.derivedStats.mana).toBe(input.player.derivedStats.mana);
    expect(input).toEqual(before);
    expect(decodeSave(output)).toEqual(output);
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
    expect(decodeSave(input)).toEqual(output);
  });

  it.each(['native', 'array', 'object'] as const)('recomposes progressed gear with %s legacy affixes without healing or resetting domains', (form) => {
    const input = legacyAmazon();
    const values = form === 'native' ? new Map([['coreStats.dexterity', 10], ['statMods.life', 20]])
      : form === 'array' ? [['coreStats.dexterity', 10], ['statMods.life', 20]]
      : { 'coreStats.dexterity': 10, 'statMods.life': 20 };
    const hat = {
      id: 'retained-hat', baseId: 'items/base/helm-cap', rarity: 'magic', level: 1,
      equipped: true, identified: true, affixes: [{ affixId: 'legacy', values }]
    };
    const progressed = {
      ...input,
      player: { ...input.player, level: 12, experience: 43, experienceToNextLevel: 500,
        statPoints: 3, skillPoints: 4, derivedStats: { ...historicalStats(deriveStats(input.player.coreStats, 12)), life: 17, mana: 9 } },
      inventory: { ...input.inventory, equipped: { head: hat }, currencies: { 'rune-shard': 71 } },
      map: { ...input.map, clearedSubAreas: ['blood-moor'], questProgress: {
        quest: { id: 'quest', status: 'completed', objectives: { done: true }, rewardClaimed: true }
      } },
      formation: { ...input.formation, playerPosition: { row: 2, col: 2 } },
      mercs: { ...input.mercs, fieldedMercId: 'retained-merc', ownedMercs: [{
        ...input.player, id: 'retained-merc', type: 'mercenary', archetype: 'rogue', rarity: 'rare',
        equipment: [{ ...legacyStarter(true), id: 'merc-legacy-bow' }]
      }], mercEquipment: { 'retained-merc': { weapon: { ...legacyStarter(true), id: 'merc-bow' } } },
        mercProgress: { 'retained-merc': { experience: 19, experienceToNextLevel: 200, level: 4 } } }

    };
    const before = structuredClone(progressed);
    const output = decodeSave(progressed);
    expect(output.player.equipment).toEqual(Object.values(output.inventory.equipped).filter(item => item != null));
    // L12: floor(10+22+max(20,25+10)/2+13)=62; retained gear participates.
    expect(output.player.derivedStats.attack).toBe(62);
    expect(output.player.derivedStats.lifeMax).toBe(248);
    expect(output.player.derivedStats.life).toBe(17);
    expect(output.player.derivedStats.mana).toBe(9);
    expect({ ...output.player, equipment: input.player.equipment, derivedStats: progressed.player.derivedStats })
      .toEqual({ ...progressed.player, respecsRemaining: { stat: 3, skill: 3 } });
    expect(output.inventory.currencies).toEqual(progressed.inventory.currencies);
    expect(output.map).toEqual(expectedCurrent(progressed).map);
    expect(output.mercs).toEqual(expectedCurrent(progressed).mercs);
    expect(output.formation).toEqual(progressed.formation);
    const affix = output.inventory.equipped.head?.affixes?.[0];
    expect(affix && 'values' in affix && affix.values).toEqual(new Map([
      ['coreStats.dexterity', 10], ['statMods.life', 20]
    ]));
    expect(progressed).toEqual(before);
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
  });

  it.each(['backpack', 'stash', 'hero', 'merc', 'legacy-merc'] as const)('does not guess ownership on a %s ID collision', (container) => {
    const input = legacyAmazon();
    const collision = { ...legacyStarter(true), equipped: false };
    const merc = { ...input.player, id: 'merc', type: 'mercenary', archetype: 'rogue', rarity: 'normal', equipment: [collision] };
    const conflicted = {
      ...input,
      inventory: { ...input.inventory,
        backpack: container === 'backpack' ? [collision] : [],
        stash: container === 'stash' ? [collision] : [],
        equipped: container === 'hero' ? { head: collision } : {} },
      mercs: { ...input.mercs,
        ownedMercs: container === 'legacy-merc' ? [merc] : [],
        mercEquipment: container === 'merc' ? { merc: { head: collision } } : {} }
    };
    expect(decodeSave(conflicted)).toEqual(expectedCurrent(conflicted));
  });

  it.each([
    ['null weapon', { weapon: null }],
    ['retained weapon', { weapon: { ...legacyStarter(true), id: 'current' } }],
    ['retained offhand', { offhand: { ...legacyStarter(true), id: 'shield', baseId: 'items/base/sh-buckler' } }]
  ])('preserves %s and all stale data', (_name, equipped) => {
    const input = legacyAmazon();
    const skipped = { ...input, inventory: { ...input.inventory, equipped } };
    expect(decodeSave(skipped)).toEqual(expectedCurrent(skipped));
  });

  it('allows an explicitly empty offhand without displacing it', () => {
    const input = legacyAmazon();
    const output = decodeSave({ ...input, inventory: { ...input.inventory, equipped: { offhand: null } } });
    expect(output.inventory.equipped.offhand).toBeNull();
    expect(output.inventory.equipped.weapon?.id).toBe(starterId);
    expect(output.player.equipment).toEqual(Object.values(output.inventory.equipped).filter(item => item != null));
  });

  it.each([
    { id: 'loot-bow' }, { id: 'starter-amazon-bow-1.5' }, { id: 'starter-amazon-bow-1e3' },
    { id: 'starter-amazon-bow-' }, { baseId: 'items/base/weapon-crossbow' },
    { rarity: 'magic' }, { level: 2 }, { equipped: false }, { identified: false },
    { equipSlot: 'offhand' }, { ilvl: 1 }, { baseRolls: {} }, { affixes: [] }, { custom: true }
  ])('preserves altered original signature %#', (patch) => {
    const input = legacyAmazon();
    const skipped = { ...input, player: { ...input.player, equipment: [{ ...legacyStarter(), ...patch }] } };
    expect(decodeSave(skipped)).toEqual(expectedCurrent(skipped));
  });

  it.each([
    { baseRolls: { attack: 12 } }, { baseRolls: { attack: 13, defense: 0 } },
    { ilvl: 2 }, { statRolls: {} }, { baseId: 'items/base/weapon-bow' }
  ])('preserves altered intermediate signature %#', (patch) => {
    const input = legacyAmazon(true);
    const skipped = { ...input, player: { ...input.player, equipment: [{ ...legacyStarter(true), ...patch }] } };
    expect(decodeSave(skipped)).toEqual(expectedCurrent(skipped));
  });

  it.each(['barbarian', 'sorceress', 'necromancer', 'paladin', 'druid', 'assassin'])('never grants to %s', (cls) => {
    const input = legacyAmazon();
    const skipped = { ...input, player: { ...input.player, class: cls } };
    expect(decodeSave(skipped)).toEqual(expectedCurrent(skipped));
  });

  it('does not infer a starter from mixed/empty legacy arrays or already-v8 input', () => {
    const input = legacyAmazon();
    for (const equipment of [[], [legacyStarter(), { ...legacyStarter(), id: 'other' }]]) {
      const skipped = { ...input, player: { ...input.player, equipment } };
      expect(decodeSave(skipped)).toEqual(expectedCurrent(skipped));
    }
    const current = { ...input, version: 8 };
    expect(decodeSave(current)).toEqual(expectedCurrent(current));
  });

  it.each(['missing-attack', 'missing-derived', 'bad-core', 'bad-life', 'bad-max', 'bad-resistance', 'bad-native-affix', 'bad-json-affix'] as const)(
    'rejects corrupt original %s before recomposition can hide it', (kind) => {
      const input = legacyAmazon();
      const corrupted = structuredClone(input) as unknown as Record<string, unknown>;
      const player = corrupted.player as { derivedStats: Record<string, unknown> };
      if (kind === 'missing-attack') delete player.derivedStats.attack;
      if (kind === 'missing-derived') delete (corrupted.player as Record<string, unknown>).derivedStats;
      if (kind === 'bad-core') (corrupted.player as Record<string, unknown>).coreStats = { ...input.player.coreStats, dexterity: 'bad' };
      if (kind === 'bad-life') player.derivedStats.life = '17';
      if (kind === 'bad-max') player.derivedStats.lifeMax = Infinity;
      if (kind === 'bad-resistance') player.derivedStats.resistances = { fire: 'bad' };
      if (kind === 'bad-native-affix' || kind === 'bad-json-affix') {
        corrupted.inventory = { ...input.inventory, equipped: { head: {
          ...legacyStarter(true), id: 'corrupt-hat', affixes: [{ affixId: 'legacy', values: kind === 'bad-native-affix' ? new Map([['statMods.life', Infinity]]) : [['statMods.life', 'bad']] }]
        } } };
      }
      expect(() => decodeSave(corrupted)).toThrow('Invalid save');
      assert(input.player.derivedStats.attack === 22);
    }
  );
});


describe('legacy starter boundary controls', () => {
  it.each([0, 17, 10000])('preserves or clamps resource pools at %s using ordinary equipment semantics', (pool) => {
    const input = legacyAmazon();
    const output = decodeSave({ ...input, player: { ...input.player,
      derivedStats: { ...input.player.derivedStats, life: pool, mana: pool } } });
    expect(output.player.equipment).toEqual(Object.values(output.inventory.equipped).filter(item => item != null));
    expect(output.player.derivedStats.life).toBe(Math.min(140, pool));
    expect(output.player.derivedStats.mana).toBe(Math.min(72, pool));
  });
  it('chains genuine v6 formation defaults then starter compatibility', () => {
    const { formation: _formation, ...input } = legacyAmazon();
    const output = decodeSave({ ...input, version: 6 });
    expect(output.version).toBe(CURRENT_SAVE_VERSION);
    expect(output.formation.playerPosition).toEqual({ row: 1, col: 1 });
    expect(output.inventory.equipped.weapon?.id).toBe(starterId);
    expect(output.player.equipment).toEqual(Object.values(output.inventory.equipped).filter(item => item != null));
    expect(input).not.toHaveProperty('formation');
  });
  it.each(['offhand', 'head', 'body', 'hands', 'feet', 'belt', 'amulet', 'ring1', 'ring2'])(
    'preserves the exact payload when starter ID is retained in hero %s', (slot) => {
      const input = legacyAmazon();
      const skipped = { ...input, inventory: { ...input.inventory, equipped: {
        [slot]: { ...legacyStarter(true), equipped: true }
      } } };
      expect(decodeSave(skipped)).toEqual(expectedCurrent(skipped));
    }
  );
  it('rejects malformed present weapon instead of treating it as missing', () => {
    const input = legacyAmazon();
    expect(() => decodeSave({ ...input, inventory: { ...input.inventory, equipped: { weapon: false } } })).toThrow('Invalid save');
  });
});
