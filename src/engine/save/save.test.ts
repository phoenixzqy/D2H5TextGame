/**
 * Round-trip and migration tests for the save module.
 */
import { describe, it, expect } from 'vitest';
import { buildSave, runMigrations, toJsonSafe } from './index';
import {
  CURRENT_SAVE_VERSION,
  MIGRATIONS,
  type SaveCurrent,
  type SaveV1
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
    mercs: { ownedMercs: [], fieldedMercId: null },
    map: {
      currentAct: 1,
      currentSubAreaId: 'rogue-camp',
      discoveredAreas: ['rogue-camp', 'blood-moor'],
      questProgress: { 'q-den': { id: 'q-den', status: 'inProgress', objectives: { entered: true } } }
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
    expect(out.version).toBe(2);
    expect(out.timestamp).toBe(999);
    expect(out.player.id).toBe('p1');
    expect(out.mercs.fieldedMercId).toBe('rogue-1');
    expect(out.map.currentAct).toBe(2);
    expect(out.map.currentSubAreaId).toBe('lut-gholein');
    expect(out.map.discoveredAreas).toEqual(['rogue-camp']);
    expect(out.meta.settings.locale).toBe('en');
    expect(out.meta.gachaState.pityCounter).toBe(7);
    expect(out.inventory.equipped.weapon).toEqual({ id: 'w1' });
    expect(out.inventory.currencies).toEqual({});
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
    expect(out.inventory.equipped.head).toEqual({ id: 'h1' });
    expect(out.mercs.fieldedMercId).toBeNull();
  });
});
