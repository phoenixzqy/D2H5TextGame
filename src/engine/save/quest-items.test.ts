import { describe, expect, it } from 'vitest';
import { deriveStats } from '../progression/stats';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type SaveV1 } from '../types/save';
import { buildSave, toJsonSafe, type BuildSaveInput } from './serialize';
import { decodeSave, validateSave, validateQuestItemLedger } from './validate';

const questId = 'quests/act2-radaments-lair';
const source = `${questId}#reward:questItem`;
const bookId = 'items/book_of_skill';
const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };

function sampleSave() {
  return buildSave({ timestamp: 1000,
    player: { id: 'hero', name: 'Hero', type: 'player', team: 'player', class: 'sorceress',
      level: 1, coreStats, derivedStats: deriveStats(coreStats, 1),
      statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true, turnOrder: 0,
      experience: 0, experienceToNextLevel: 100, statPoints: 0, skillPoints: 7, equipment: [] },
    inventory: { backpack: [{ id: 'retained-gear-17', baseId: 'items/base/helm-cap',
      rarity: 'normal', level: 1, identified: true, equipped: false }],
      stash: [], equipped: {}, currencies: { 'rune-shard': 42 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 2, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [],
      questProgress: { [questId]: { id: questId, status: 'completed',
        objectives: { 'obj-kill-radament': true }, rewardClaimed: true } } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false,
      musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] }
  });
}

function withLedger(questItems: unknown) {
  const save = sampleSave();
  return { ...save, inventory: { ...save.inventory, questItems } };
}

function legacySave() {
  const save = sampleSave();
  const inventory = { backpack: save.inventory.backpack, stash: save.inventory.stash,
    equipped: save.inventory.equipped, currencies: save.inventory.currencies };
  return { ...save, version: 11, inventory };
}

function legacyV1(): SaveV1 {
  const save = sampleSave();
  return { version: 1, timestamp: save.timestamp, player: save.player,
    inventory: { backpack: [], stash: [], equipment: new Map(), maxBackpack: 100, maxStash: 500 },
    mercenaries: [], mapProgress: { currentAct: 1, currentSubArea: 'rogue-camp',
      completedSubAreas: [], completedActs: [], waypoints: [] },
    settings: save.meta.settings, idleState: save.meta.idleState, gachaState: save.meta.gachaState };
}

describe('v12 source-bound quest item ledger', () => {
  it.each([
    { label: 'Map', ledger: new Map([[source, { itemId: bookId, state: 'owned' }]]) },
    { label: 'Date', ledger: new Date(1000) },
    { label: 'inherited receipt', ledger: Object.create({ [source]: { itemId: bookId, state: 'owned' } }) as unknown },
    { label: 'inherited fields', ledger: { [source]: Object.create({ itemId: bookId, state: 'owned' }) as unknown } }
  ])('rejects a non-JSON ledger before normalization ($label)', ({ ledger }) => {
    const input = withLedger(ledger);
    expect(() => validateQuestItemLedger(ledger, input.map.questProgress)).toThrow('Invalid save');
    expect(() => decodeSave(input)).toThrow('Invalid save');
  });
  it('decodes a valid original v1 inventory before testing reserved-field corruption', () => {
    const input = legacyV1();
    const before = structuredClone(input);
    const decoded = decodeSave(input);
    expect(decoded.version).toBe(12);
    expect(decoded.inventory.questItems).toEqual({});
    expect(decoded.player.skillPoints).toBe(input.player.skillPoints);
    expect(input).toEqual(before);
  });

  it.each([undefined, {}, { [source]: { itemId: bookId, state: 'owned' } }])(
    'rejects a reserved ledger in original v1 before inventory reconstruction (%j)', questItems => {
      const original = legacyV1();
      const input = { ...original, inventory: { ...original.inventory, questItems } };
      const before = structuredClone(input);
      expect(() => decodeSave(input)).toThrow('Invalid save: historical inventory cannot contain questItems');
      expect(input).toEqual(before);
    }
  );
  it('emits a required empty ledger for a trusted legacy builder input', () => {
    expect(CURRENT_SAVE_VERSION).toBe(12);
    expect(sampleSave().inventory).toHaveProperty('questItems', {});
  });

  it('does not default a present undefined trusted ledger', () => {
    const save = sampleSave();
    const input = { ...save, inventory: { ...save.inventory, questItems: undefined } };
    expect(() => buildSave(input as unknown as BuildSaveInput)).toThrow('Invalid save');
  });

  it.each([null, [], { invalid: true }])('does not erase a present malformed trusted ledger (%j)', questItems => {
    const save = sampleSave();
    const input = { ...save, inventory: { ...save.inventory, questItems } };
    const built = buildSave(input as unknown as BuildSaveInput);
    expect(built.inventory.questItems).toBe(questItems);
    expect(() => decodeSave(built)).toThrow('Invalid save');
  });

  it.each(['owned', 'consumed'])('preserves %s through native and JSON decoding without granting points', state => {
    const input = withLedger({ [source]: { itemId: bookId, state } });
    const original = structuredClone(input);
    expect(validateSave(input)).toEqual(input);
    expect(decodeSave(input)).toEqual(input);
    expect(decodeSave(toJsonSafe(decodeSave(input)))).toEqual(input);
    expect(decodeSave(structuredClone(input))).toEqual(input);
    expect(input).toEqual(original);
  });

  it.each([
    undefined, null, [], false,
    { unknown: { itemId: bookId, state: 'owned' } },
    { [questId]: { itemId: bookId, state: 'owned' } },
    { [source]: null }, { [source]: [] },
    { [source]: { itemId: bookId } },
    { [source]: { itemId: bookId, state: undefined } },
    { [source]: { itemId: bookId, state: 'unread' } },
    { [source]: { itemId: 'items/unknown', state: 'owned' } },
    { [source]: { itemId: bookId, state: 'consumed', owned: true } },
    { [source]: { itemId: bookId, state: ['owned', 'consumed'] } },
    { [source]: { itemId: bookId, state: 'owned', heroId: 'other-hero' } },
    { [source]: { itemId: bookId, state: 'owned' },
      [source + ':duplicate']: { itemId: bookId, state: 'consumed' } }
  ])('rejects malformed or conflicting ledger %j without repair', questItems => {
    const input = withLedger(questItems);
    const before = structuredClone(input);
    expect(() => decodeSave(input)).toThrow('Invalid save');
    expect(input).toEqual(before);
  });

  it('rejects a missing current ledger rather than treating corruption as a legacy save', () => {
    const input = { ...legacySave(), version: CURRENT_SAVE_VERSION };
    expect(() => decodeSave(input)).toThrow('Invalid save');
  });

  it.each([
    {},
    { [questId]: { id: questId, status: 'completed', objectives: { 'obj-kill-radament': true } } },
    { [questId]: { id: questId, status: 'inProgress', objectives: { 'obj-kill-radament': true }, rewardClaimed: true } },
    { [questId]: { id: 'quests/other', status: 'completed', objectives: { 'obj-kill-radament': true }, rewardClaimed: true } },
    { [questId]: { id: questId, status: 'completed', objectives: { 'obj-kill-radament': false }, rewardClaimed: true } }
  ])('rejects entitlement without completed and claimed canonical source %j', questProgress => {
    const save = withLedger({ [source]: { itemId: bookId, state: 'owned' } });
    expect(() => decodeSave({ ...save, map: { ...save.map, questProgress } })).toThrow('Invalid save');
  });

  it('migrates historical claimed v11 to an empty ledger with exact nonledger state', () => {
    const input = legacySave();
    const original = structuredClone(input);
    const expected = { ...input, version: CURRENT_SAVE_VERSION,
      inventory: { ...input.inventory, questItems: {} } };
    expect(MIGRATIONS[12]).toBeDefined();
    expect(MIGRATIONS[12]?.(input)).toEqual(expected);
    expect(decodeSave(input)).toEqual(expected);
    expect(input).toEqual(original);
  });

  it.each([undefined, {}, { [source]: { itemId: bookId, state: 'owned' } }])(
    'rejects reserved ledger fields in historical v11 (%j)', questItems => {
      const input = legacySave();
      expect(() => decodeSave({ ...input, inventory: { ...input.inventory, questItems } })).toThrow('Invalid save');
    }
  );

  it.each([undefined, null, 'paladin.holy-fire'])('validates frozen v11 before migration (%j)', selectedAuraId => {
    const input = legacySave();
    expect(() => decodeSave({ ...input, player: { ...input.player, selectedAuraId } })).toThrow('Invalid save');
  });
});
