import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { emptyEndgameState } from '../endgame/state';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateSave, validateSocketSave } from './validate';
import { runMigrations } from './migrate';
import { migrateSaveV20 } from './migrate-v20';
import { withV20Defaults, withV21Defaults, withV24Defaults, withoutV20Fields } from '../../../tests/helpers/save-fixtures';
import type { SaveV19 } from '../types/save';

function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Endgame owner', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { 'rune-shard': 17 }, materials: { 'runes/ral': 3 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 5, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function predecessor() {
  const save = sample();
  const old = withoutV20Fields(save);
  return { ...old, version: 19 as const };
}
const progress = { attemptOrdinal: 7, clearCounts: { ashen: 2, glacial: 1 }, achievementRewardClaimed: true };
function unlocked() {
  const save = sample(), campaign = campaignEvidence();
  return { ...save, version: 24, endgame: progress,
    map: { ...save.map, questProgress: campaign.questProgress, questReceipts: campaign.questReceipts } };
}

describe('native endgame save20 ownership', () => {
  it('builds explicit empty state and preserves a valid authorized round trip', () => {
    expect(sample()).toMatchObject({ version: 24, endgame: emptyEndgameState() });
    const input = unlocked(), before = structuredClone(input);
    expect(validateSave(input)).toEqual(toJsonSafe(input));
    expect(decodeSave(toJsonSafe(input))).toEqual(input);
    expect(buildSave(input)).toEqual(input);
    expect(input).toEqual(before);
  });
  it('adds only empty ownership to a real19 without altering its holdings', () => {
    const old = predecessor(), before = structuredClone(old);
    expect(validateSocketSave(old)).toEqual(old);
    const expected = { ...old, version: 20, endgame: emptyEndgameState() };
    expect(runMigrations(old)).toEqual(withV24Defaults(withV21Defaults(expected)));
    expect(decodeSave(old)).toEqual(withV24Defaults(withV21Defaults(expected)));
    expect(old).toEqual(before);
  });
  it('preserves sockets, both recovery families, receipts, Maps, mirrors and caches across19→20', () => {
    const base = sample(), affixes = [{ affixId: 'legacy', values: new Map([['statMods.mana', 20]]) }];
    const gear = { id: 'socket-owner', baseId: 'items/base/wp1h-short-sword', rarity: 'normal' as const,
      level: 20, identified: true, equipped: true, socketCapacity: 2, affixes,
      socketContents: [{ kind: 'rune' as const, id: 'runes/el' }, { kind: 'gem' as const, id: 'gems/ruby/chipped' }] };
    const oldItem = { id: 'historic', baseId: 'items/base/armor-quilted', rarity: 'normal' as const,
      level: 20, identified: true, equipped: false, affixes };
    const unsupported = { ...oldItem, id: 'recovery', rarity: 'runeword' as const, socketCapacity: 2,
      runes: ['runes/ort', 'runes/sol'], runewordId: 'runewords/lore' };
    const merc = { ...base.player, id: 'merc', type: 'mercenary' as const, archetype: 'back', rarity: 'R' as const };
    const old: SaveV19 = { ...withoutV20Fields(buildSave({ ...base,
      inventory: { ...base.inventory, equipped: { weapon: gear }, currencies: { endgame: 9, 'rune-shard': 17 },
        backpack: [{ ...gear, id: 'bag', equipped: false }], stash: [{ ...gear, id: 'stash', equipped: false }],
        legacyGearQuarantine: [{ item: oldItem, origin: { container: 'stash', index: 7 } }],
        socketQuarantine: [{ sourceVersion: 18, item: unsupported, origin: { container: 'backpack', index: 4 } }],
        materialActionOrdinal: 3, latestMaterialAction: { ordinal: 3, requestHash: 'a'.repeat(64),
          result: { materials: { 'runes/el': 1 }, currencies: { 'rune-shard': 11 } } } },
      mercs: { ...base.mercs, ownedMercs: [merc], fieldedMercId: merc.id,
        mercEquipment: { merc: { weapon: { ...gear, id: 'merc-weapon' } } } } })), version: 19 };
    const before = structuredClone(old), expected = withV20Defaults(old);
    expect(validateSocketSave(old)).toEqual(toJsonSafe(old));
    expect(migrateSaveV20(old)).toEqual(expected);
    expect(runMigrations(old)).toEqual(withV24Defaults(withV21Defaults(expected)));
    expect(toJsonSafe(decodeSave(old))).toEqual(toJsonSafe(withV24Defaults(withV21Defaults(expected))));
    expect(toJsonSafe(decodeSave(toJsonSafe(old)))).toEqual(toJsonSafe(withV24Defaults(withV21Defaults(expected))));
    expect(old).toEqual(before);
    for (const corrupt of [
      { ...old, inventory: { ...old.inventory, materialActionOrdinal: 4 } },
      { ...old, inventory: { ...old.inventory, equipped: { weapon: { ...gear, socketCapacity: 0 } } } }
    ]) expect(() => migrateSaveV20(corrupt)).toThrow();
  });
  it.each([undefined, null, {}, { ...progress, attemptOrdinal: 1 },
    { ...progress, clearCounts: { ashen: 0, glacial: 1 } }, { ...progress, extra: true }])(
    'refuses present malformed ownership before builder defaults: %j', endgame => {
      const input = { ...unlocked(), endgame };
      expect(() => validateSave(input)).toThrow();
      expect(() => decodeSave(input)).toThrow();
      expect(() => buildSave(input as Parameters<typeof buildSave>[0])).toThrow();
    });
  it('requires current own state and actual campaign authority, without inferring history', () => {
    const { endgame: _state, ...missing } = unlocked();
    expect(() => decodeSave(missing)).toThrow();
    expect(() => decodeSave({ ...sample(), endgame: progress })).toThrow();
    expect(buildSave(missing as Parameters<typeof buildSave>[0])).toMatchObject({ endgame: emptyEndgameState() });
  });
  it.each(['map', 'inventory'] as const)('refuses current %s shadow state', location => {
    const input = unlocked();
    expect(() => decodeSave({ ...input, [location]: { ...input[location], endgame: undefined } })).toThrow();
  });
  it.each(['hidden', 'inherited', 'getter'] as const)('refuses a %s native root descriptor without evaluating it', kind => {
    const input = unlocked(); let reads = 0;
    Reflect.deleteProperty(input, 'endgame');
    if (kind === 'inherited') Object.setPrototypeOf(input, { endgame: progress });
    else Object.defineProperty(input, 'endgame', kind === 'getter'
      ? { enumerable: true, get: () => { reads++; return progress; } }
      : { enumerable: false, value: progress });
    expect(() => validateSave(input)).toThrow();
    expect(() => decodeSave(input)).toThrow();
    expect(() => buildSave(input as Parameters<typeof buildSave>[0])).toThrow();
    expect(reads).toBe(0);
  });
  it('returns an immutable private copy of progress', () => {
    const input = unlocked(), saved = validateSave(input);
    expect(saved.endgame).not.toBe(input.endgame);
    expect(Object.isFrozen(saved.endgame)).toBe(true);
    expect(Object.isFrozen(saved.endgame.clearCounts)).toBe(true);
    input.endgame.clearCounts.ashen++;
    expect(saved.endgame.clearCounts.ashen).toBe(2);
  });
});

describe('pre20 descriptor reservations', () => {
  it.each(Array.from({ length: 19 }, (_, index) => index + 1))('reserves raw root/map/inventory on version%i before any migration', version => {
    for (const location of ['root', 'map', 'inventory'] as const) {
      const old = { ...predecessor(), version };
      Object.defineProperty(location === 'root' ? old : old[location], 'endgame', { value: undefined });
      expect(() => decodeSave(old)).toThrow(/reserved.*endgame/);
      expect(() => runMigrations(old)).toThrow(/reserved.*endgame/);
    }
  });
  it.each(['root', 'map', 'inventory'] as const)('rejects reserved %s fields before historical normalization or migration', location => {
    for (const descriptor of ['undefined', 'hidden', 'inherited', 'getter'] as const) {
      const old = predecessor(); let reads = 0;
      const target = location === 'root' ? old : old[location];
      if (descriptor === 'inherited') Object.setPrototypeOf(target, { endgame: emptyEndgameState() });
      else Object.defineProperty(target, 'endgame', descriptor === 'getter'
        ? { enumerable: true, get: () => { reads++; return emptyEndgameState(); } }
        : { enumerable: descriptor !== 'hidden', value: undefined });
      for (const boundary of [decodeSave, validateSocketSave, runMigrations]) expect(() => boundary(old)).toThrow();
      expect(reads).toBe(0);
    }
  });
});
