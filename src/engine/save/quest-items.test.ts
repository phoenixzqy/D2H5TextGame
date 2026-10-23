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

describe('v13 objective-bound retained tools', () => {
  const staffQuest = 'quests/act2-horadric-staff';
  const cubeSource = `${staffQuest}#objective:obj-cube`;
  function cubeSave(state: 'owned' | 'consumed' = 'owned', flag = true) {
    const save = sampleSave();
    return { ...save, inventory: { ...save.inventory,
      questItems: { [cubeSource]: { itemId: 'quest/horadric_cube', state } } },
    map: { ...save.map, questProgress: { ...save.map.questProgress,
      [staffQuest]: { id: staffQuest, status: 'inProgress' as const, objectives: { 'obj-cube': flag,
        'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } } } } };
  }

  it('preserves an owned tool and its exact objective through JSON/native decoding', () => {
    const input = cubeSave();
    expect(input.version).toBe(14);
    expect(decodeSave(input)).toEqual(input);
    expect(decodeSave(toJsonSafe(input))).toEqual(input);
  });

  it.each([['consumed', true], ['owned', false]] as const)('rejects incompatible Cube state %s / flag %s', (state, flag) => {
    expect(() => decodeSave(cubeSave(state, flag))).toThrow('Invalid save');
  });

  it('rejects objective entitlements injected into frozen v12 before migration', () => {
    expect(() => decodeSave({ ...cubeSave(), version: 12 })).toThrow('Invalid save');
  });

  it.each(['owned', 'consumed'])('copies the v12 Book %s receipt without grants or inference', state => {
    const latest = withLedger({ [source]: { itemId: bookId, state } });
    const input = { ...latest, version: 12 };
    const before = structuredClone(input);
    expect(MIGRATIONS[13]?.(input)).toEqual({ ...input, version: 13 });
    expect(decodeSave(input)).toEqual({ ...input, version: CURRENT_SAVE_VERSION });
    expect(input).toEqual(before);
  });

  it('preserves legacy true Cube flags without manufacturing a missing tool', () => {
    const latest = cubeSave();
    const input = { ...latest, version: 12, inventory: { ...latest.inventory, questItems: {} } };
    expect(decodeSave(input)).toEqual({ ...input, version: CURRENT_SAVE_VERSION });
  });
});

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
    expect(decoded.version).toBe(CURRENT_SAVE_VERSION);
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
    expect(CURRENT_SAVE_VERSION).toBe(14);
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
    expect(MIGRATIONS[12]?.(input)).toEqual({ ...expected, version: 12 });
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

describe('v14 Staff component and consumption graph', () => {
  const staffQuest = 'quests/act2-horadric-staff';
  const tombQuest = 'quests/act2-seven-tombs';
  const cube = `${staffQuest}#objective:obj-cube`;
  const shaft = `${staffQuest}#objective:obj-shaft`;
  const amulet = `${staffQuest}#objective:obj-amulet`;
  const staff = `${staffQuest}#objective:obj-transmute`;
  function staffSave(stage: 'components' | 'assembled' | 'inserted' = 'assembled') {
    const save = sampleSave();
    const questItems: Record<string, { itemId: string; state: 'owned' | 'consumed' }> = {
      [cube]: { itemId: 'quest/horadric_cube', state: 'owned' },
      [shaft]: { itemId: 'quest/staff_of_kings', state: stage === 'components' ? 'owned' : 'consumed' },
      [amulet]: { itemId: 'quest/viper_amulet', state: stage === 'components' ? 'owned' : 'consumed' }
    };
    if (stage !== 'components') questItems[staff] = {
      itemId: 'quest/horadric_staff', state: stage === 'inserted' ? 'consumed' : 'owned'
    };
    return { ...save, inventory: { ...save.inventory, questItems }, map: { ...save.map,
      questProgress: { ...save.map.questProgress,
        [staffQuest]: { id: staffQuest, status: stage === 'components' ? 'inProgress' as const : 'completed' as const,
          objectives: { 'obj-cube': true, 'obj-shaft': true, 'obj-amulet': true, 'obj-transmute': stage !== 'components' } },
        [tombQuest]: { id: tombQuest, status: 'inProgress' as const,
          objectives: { 'obj-open-tomb': stage === 'inserted', 'obj-kill-duriel': false } }
      } } };
  }

  it.each(['components', 'assembled', 'inserted'] as const)('preserves the %s graph through native and JSON decoding', stage => {
    const input = staffSave(stage);
    const original = structuredClone(input);
    expect(input.version).toBe(14);
    expect(decodeSave(input)).toEqual(input);
    expect(decodeSave(toJsonSafe(input))).toEqual(input);
    expect(input).toEqual(original);
  });

  it.each([
    { label: 'missing Cube', source: cube, entry: undefined },
    { label: 'consumed Cube', source: cube, entry: { itemId: 'quest/horadric_cube', state: 'consumed' } },
    { label: 'missing ingredient', source: shaft, entry: undefined },
    { label: 'owned ingredient after assembly', source: amulet, entry: { itemId: 'quest/viper_amulet', state: 'owned' } },
    { label: 'missing assembly output', source: staff, entry: undefined },
    { label: 'extra receipt tag', source: staff, entry: { itemId: 'quest/horadric_staff', state: 'owned', kind: 'assembled' } },
    { label: 'wrong output identity', source: staff, entry: { itemId: 'quest/staff_of_kings', state: 'owned' } }
  ])('rejects a broken receipt graph: $label', ({ source: key, entry }) => {
    const input = staffSave();
    if (entry === undefined) Reflect.deleteProperty(input.inventory.questItems, key);
    else Reflect.set(input.inventory.questItems, key, entry);
    const before = structuredClone(input);
    expect(() => decodeSave(input)).toThrow('Invalid save');
    expect(input).toEqual(before);
  });

  it('rejects a consumed Staff without its own true orifice objective', () => {
    const input = staffSave('inserted');
    input.map.questProgress[tombQuest].objectives['obj-open-tomb'] = false;
    expect(() => decodeSave(input)).toThrow('Invalid save');
  });

  it.each(['obj-cube', 'obj-shaft', 'obj-amulet', 'obj-transmute'] as const)(
    'rejects an output graph without own true source/predecessor %s', objectiveId => {
      const input = staffSave();
      Reflect.deleteProperty(input.map.questProgress[staffQuest].objectives, objectiveId);
      expect(() => decodeSave(input)).toThrow('Invalid save');
    }
  );

  it.each(['owned', 'consumed'] as const)('preserves the unchanged Book %s receipt alongside the inserted Staff', state => {
    const input = staffSave('inserted');
    input.inventory.questItems[source] = { itemId: bookId, state };
    expect(decodeSave(input)).toEqual(input);
    expect(decodeSave(toJsonSafe(input))).toEqual(input);
  });

  it.each(['available', 'locked', 'inProgress', 'completed'] as const)('rejects incompatible consumer progress %s', status => {
    const input = staffSave('inserted');
    Reflect.set(input.map.questProgress[tombQuest], 'status', status);
    if (status === 'inProgress') Reflect.set(input.map.questProgress[tombQuest], 'rewardClaimed', true);
    expect(() => decodeSave(input)).toThrow('Invalid save');
  });

  it('accepts completed/claimed source and consumer receipts without changing reward ownership', () => {
    const input = staffSave('inserted');
    Reflect.set(input.map.questProgress[staffQuest], 'rewardClaimed', true);
    Reflect.set(input.map.questProgress[tombQuest], 'status', 'completed');
    input.map.questProgress[tombQuest].objectives['obj-kill-duriel'] = true;
    Reflect.set(input.map.questProgress[tombQuest], 'rewardClaimed', true);
    expect(decodeSave(input)).toEqual(input);
  });

  it('does not infer any receipts from legacy completed/claimed objective flags', () => {
    const input = staffSave('inserted');
    input.inventory.questItems = {};
    Reflect.set(input.map.questProgress[staffQuest], 'rewardClaimed', true);
    Reflect.set(input.map.questProgress[tombQuest], 'status', 'completed');
    Reflect.set(input.map.questProgress[tombQuest], 'rewardClaimed', true);
    input.map.questProgress[tombQuest].objectives['obj-kill-duriel'] = true;
    const legacy = { ...input, version: 13 };
    expect(MIGRATIONS[14]?.(legacy)).toEqual({ ...legacy, version: 14 });
    expect(decodeSave(legacy)).toEqual({ ...legacy, version: 14 });
  });

  it.each(['components', 'assembled', 'inserted'] as const)('rejects new %s receipts injected into frozen v13', stage => {
    expect(() => decodeSave({ ...staffSave(stage), version: 13 })).toThrow('Invalid save');
  });

  it('validates frozen v13 without consulting the widened live definitions', () => {
    const input = staffSave('components');
    Reflect.deleteProperty(input.inventory.questItems, shaft);
    Reflect.deleteProperty(input.inventory.questItems, amulet);
    const legacy = { ...input, version: 13 };
    expect(decodeSave(legacy)).toEqual({ ...legacy, version: 14 });
    const entry = legacy.inventory.questItems[cube];
    if (!entry) throw new Error('Missing Cube receipt');
    Reflect.set(entry, 'state', 'consumed');
    expect(() => decodeSave(legacy)).toThrow('Invalid save');
  });
});
