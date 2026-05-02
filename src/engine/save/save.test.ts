/**
 * Round-trip and migration tests for the save module.
 */
import { describe, it, expect } from 'vitest';
import { buildSave, runMigrations, toJsonSafe } from './index';
import {
  CURRENT_SAVE_VERSION,
  MIGRATIONS,
  type SaveCurrent,
  type SaveV1,
  type SaveV2,
  type SaveV3,
  type SaveV5
} from '../types/save';

function fakePlayer(): SaveCurrent['player'] {
  // Cast — we don't exercise gameplay invariants here, only persistence shape.
  return {
    id: 'p1',
    name: 'Hero',
    type: 'player',
    team: 'player',
    level: 5,
    coreStats: { strength: 1, dexterity: 1, vitality: 1, energy: 1 },
    derivedStats: {},
    statusEffects: [],
    cooldowns: [],
    skills: [],
    comboOrder: [],
    alive: true,
    turnOrder: 0,
    classId: 'barbarian',
    experience: 100,
    statPoints: 0,
    skillPoints: 0
  } as unknown as SaveCurrent['player'];
}

function buildSampleSaveCurrent(): SaveCurrent {
  return buildSave({
    player: fakePlayer(),
    inventory: {
      backpack: [],
      stash: [],
      equipped: { weapon: null, head: null },
      currencies: { gold: 42, runes: 3 }
    },
    mercs: {
      ownedMercs: [],
      fieldedMercId: null,
      mercEquipment: {},
      mercProgress: {}
    },
    map: {
      currentAct: 1,
      currentSubAreaId: 'rogue-camp',
      discoveredAreas: ['rogue-camp', 'blood-moor'],
      clearedSubAreas: ['blood-moor'],
      questProgress: { 'q-den': { id: 'q-den', status: 'inProgress', objectives: { entered: true }, rewardClaimed: true } }
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
    timestamp: 12345
  });
}

describe('save round-trip', () => {
  it('survives JSON-stringify and parse with all slices intact', () => {
    const original = buildSampleSaveCurrent();
    const safe = toJsonSafe(original);
    const json = JSON.stringify(safe);
    const reparsed = JSON.parse(json) as SaveCurrent;
    expect(reparsed).toEqual(original);
    expect(reparsed.version).toBe(CURRENT_SAVE_VERSION);
    expect(reparsed.inventory.currencies.gold).toBe(42);
    expect(reparsed.map.discoveredAreas).toEqual(['rogue-camp', 'blood-moor']);
    expect(reparsed.map.clearedSubAreas).toEqual(['blood-moor']);
    expect(reparsed.map.questProgress['q-den']?.rewardClaimed).toBe(true);
    expect(reparsed.mercs.mercEquipment).toEqual({});
    expect(reparsed.mercs.mercProgress).toEqual({});
    expect(reparsed.meta.settings.locale).toBe('zh-CN');
  });

  it('toJsonSafe converts Map equipment into plain arrays (defensive)', () => {
    const save = buildSampleSaveCurrent();
    // Inject a Map, simulating engine-side Inventory shape leaking in.
    const withMap = {
      ...save,
      inventory: {
        ...save.inventory,
        equipped: new Map([['weapon', null]]) as unknown as SaveCurrent['inventory']['equipped']
      }
    } as SaveCurrent;
    const safe = toJsonSafe(withMap) as { inventory: { equipped: unknown } };
    expect(Array.isArray(safe.inventory.equipped)).toBe(true);
  });
});

describe('runMigrations', () => {
  it('returns SaveCurrent unchanged when already current', () => {
    const cur = buildSampleSaveCurrent();
    const out = runMigrations(cur, CURRENT_SAVE_VERSION);
    expect(out).toEqual(cur);
  });

  it('throws when save version is newer than target', () => {
    const future = { version: CURRENT_SAVE_VERSION + 5 } as { version: number };
    expect(() => runMigrations(future, CURRENT_SAVE_VERSION)).toThrow(/newer than target/);
  });

  it('throws when a required migration is missing', () => {
    // version=2 already current; targetVersion=2 ⇒ no work, no throw.
    expect(() => runMigrations({ version: CURRENT_SAVE_VERSION }, CURRENT_SAVE_VERSION)).not.toThrow();
    // version=0 cannot upgrade — no MIGRATIONS[1] registered.
    expect(() => runMigrations({ version: 0 }, CURRENT_SAVE_VERSION)).toThrow(/No migration registered/);
  });

  it('upgrades a v1 (legacy engine-shape) save to current', () => {
    expect(MIGRATIONS[2]).toBeDefined();
    const v1: SaveV1 = {
      version: 1,
      player: fakePlayer(),
      inventory: {
        backpack: [],
        stash: [],
        equipment: new Map([['weapon', { id: 'w1' } as never]]),
        maxBackpack: 500,
        maxStash: 2000
      },
      mercenaries: [],
      activeMercId: 'rogue-1',
      mapProgress: {
        currentAct: 2,
        currentSubArea: 'lut-gholein',
        completedSubAreas: ['rogue-camp'],
        completedActs: [1],
        waypoints: ['rogue-camp']
      },
      idleState: {
        lastOnline: 0,
        offlineTime: 0,
        multiplierSecondsRemaining: 0,
        activeMultiplier: 1
      },
      gachaState: { currency: 5, ownedMercIds: ['rogue-1'], pityCounter: 7 },
      settings: {
        locale: 'en',
        stealthMode: true,
        soundEnabled: false,
        musicEnabled: false,
        combatSpeed: 2,
        autoCombat: false
      },
      timestamp: 999
    };

    const out = runMigrations(v1, CURRENT_SAVE_VERSION);
    expect(out.version).toBe(CURRENT_SAVE_VERSION);
    expect(out.timestamp).toBe(999);
    expect(out.player.id).toBe('p1');
    expect(out.mercs.fieldedMercId).toBe('rogue-1');
    expect(out.map.currentAct).toBe(2);
    expect(out.map.currentSubAreaId).toBe('lut-gholein');
    expect(out.map.discoveredAreas).toEqual(['rogue-camp']);
    expect(out.meta.settings.locale).toBe('en');
    expect(out.meta.gachaState.pityCounter).toBe(7);
    expect(out.inventory.equipped.weapon).toMatchObject({ id: 'w1', affixes: [], baseRolls: {} });
    expect(out.inventory.currencies).toEqual({});
    expect(out.map.clearedSubAreas).toEqual([]);
    expect(out.mercs.mercEquipment).toEqual({});
    expect(out.mercs.mercProgress).toEqual({});
  });

  it('declares v6 as current and registers the v6 migration', () => {
    expect(CURRENT_SAVE_VERSION).toBe(6);
    expect(MIGRATIONS[6]).toBeDefined();
  });

  it('migrates v2 → v3 by folding currencies.gold into rune-shard', () => {
    const current = buildSampleSaveCurrent();
    const v2: SaveV2 = {
      ...current,
      version: 2,
      inventory: {
        ...current.inventory,
        currencies: { gold: 42, runes: 3, 'rune-shard': 5 }
      }
    };

    const out = runMigrations(v2, CURRENT_SAVE_VERSION);
    expect(out.inventory.currencies.gold).toBeUndefined();
    expect(out.inventory.currencies['rune-shard']).toBe(47);
    expect(out.inventory.currencies.runes).toBe(3);
  });

  it('migrates v3 → v4 with safe defaults for newly persisted fields', () => {
    const current = buildSampleSaveCurrent();
    const { mercEquipment: _mercEquipment, mercProgress: _mercProgress, ...legacyMercs } = current.mercs;
    const { clearedSubAreas: _clearedSubAreas, ...legacyMap } = current.map;
    void _mercEquipment;
    void _mercProgress;
    void _clearedSubAreas;
    const v3: SaveV3 = {
      ...current,
      version: 3,
      mercs: legacyMercs,
      map: {
        ...legacyMap,
        questProgress: {
          'q-den': { id: 'q-den', status: 'completed', objectives: { killed: true } }
        }
      }
    };

    const out = runMigrations(v3, CURRENT_SAVE_VERSION);
    expect(out.version).toBe(CURRENT_SAVE_VERSION);
    expect(out.map.clearedSubAreas).toEqual([]);
    expect(out.map.questProgress['q-den']?.rewardClaimed).toBe(false);
    expect(out.mercs.mercEquipment).toEqual({});
    expect(out.mercs.mercProgress).toEqual({});
  });

  it('handles already-JSON-serialized v1 equipment (array of [slot, item])', () => {
    const v1raw = {
      version: 1,
      player: fakePlayer(),
      inventory: {
        backpack: [],
        stash: [],
        equipment: [['head', { id: 'h1' }]],
        maxBackpack: 500,
        maxStash: 2000
      },
      mercenaries: [],
      mapProgress: {
        currentAct: 1,
        currentSubArea: 'a',
        completedSubAreas: [],
        completedActs: [],
        waypoints: []
      },
      idleState: { lastOnline: 0, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 },
      settings: {
        locale: 'zh-CN', stealthMode: false, soundEnabled: true, musicEnabled: true,
        combatSpeed: 1, autoCombat: true
      },
      timestamp: 0
    };

    const out = runMigrations(v1raw, CURRENT_SAVE_VERSION);
    expect(out.inventory.equipped.head).toMatchObject({ id: 'h1', affixes: [], baseRolls: {} });
    expect(out.mercs.fieldedMercId).toBeNull();
  });

  it('migrates v5 → v6 with JSON-safe item stat rolls', () => {
    const current = buildSampleSaveCurrent();
    const v5: SaveV5 = {
      ...current,
      version: 5,
      inventory: {
        ...current.inventory,
        backpack: [{ id: 'set1', baseId: 'items/base/ring-iron', rarity: 'set', level: 12, identified: true, equipped: false, setId: 'sets/angelic-raiment', setPieceId: 'sets/angelic-raiment/ring' }],
        equipped: {
          weapon: { id: 'u1', baseId: 'items/base/wp1h-short-sword', rarity: 'unique', level: 12, identified: true, equipped: true, uniqueId: 'items/unique/rixots-keen' }
        }
      }
    };

    const out = runMigrations(v5, CURRENT_SAVE_VERSION);
    expect(out.version).toBe(6);
    expect(out.inventory.backpack[0]?.statRolls).toEqual({});
    expect(out.inventory.equipped.weapon?.statRolls).toEqual({});
  });
});
