/** Historical namespace controls; hand-built literals independent of current save builder. */
import { describe, expect, it } from 'vitest';
import type { SaveV31 } from '../types/save';
import { runMigrations } from './migrate';
import { rejectPreBountyState } from './pre-bounty-state';
import { decodeSave, validateFrozenV30Save, validateFrozenV31Save } from './validate';

const futureQuestIds = [
  'quests/bounty-act1-moor-cull', 'quests/bounty-act2-waste-cull',
  'quests/bounty-act3-forest-cull', 'quests/bounty-act4-steppes-cull',
  'quests/bounty-act5-foothills-cull'
];
function sample(): SaveV31 {
  return {
    version: 31,
    timestamp: 1000,
    endgame: { attemptOrdinal: 0, clearCounts: { ashen: 0, glacial: 0 }, achievementRewardClaimed: false },
    player: {
      id: 'literal-31-player', name: 'Literal31', type: 'player', team: 'player', class: 'sorceress',
      level: 1, experience: 0, experienceToNextLevel: 100, statPoints: 0, skillPoints: 1,
      coreStats: { strength: 10, dexterity: 25, vitality: 10, energy: 35 },
      derivedStats: { life: 120, lifeMax: 120, mana: 102, manaMax: 102, attack: 22, defense: 20,
        magicResist: 0, attackSpeed: 125, critChance: 0.05, critDamage: 2, physDodge: 0.1,
        magicDodge: 0.05, magicFind: 0, goldFind: 0,
        resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
      statusEffects: [], cooldowns: [], skills: [], comboOrder: ['sorceress.frost_nova', 'sorceress.ice_bolt'],
      skillLevels: { 'sorceress.frost_nova': 1, 'sorceress.ice_bolt': 1 }, alive: true, turnOrder: 0,
      respecsRemaining: { stat: 3, skill: 3 }, equipment: []
    },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 },
      questItems: {}, questServices: {}, materials: {}, legacyGearQuarantine: [], socketQuarantine: [],
      materialActionOrdinal: 0 },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {},
      questReceipts: {}, questTitles: {}, questDifficulties: {}, selectedTitle: null, selectedDifficulty: 'normal',
      nightmareClearedSubAreas: [], hellClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0, hell: 0 } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] }
  };
}
function native(version: 30 | 31, input: unknown): unknown {
  return version === 30 ? validateFrozenV30Save(input) : validateFrozenV31Save(input);
}
function readers(version: 30 | 31): readonly ((input: unknown) => unknown)[] {
  return [input => native(version, input), decodeSave,
    input => runMigrations(input as SaveV31, version)];
}
function row(id: string, status: 'available' | 'inProgress') {
  return { id, status, rewardClaimed: false, objectives: { 'obj-clear': false } };
}

describe('literal31 and predecessor bounty namespace reservation', () => {
  it.each(Array.from({ length: 31 }, (_, index) => index + 1))(
    'reserves the namespace and each exact future quest before version %s conversion', version => {
      const mapKey = version === 1 ? 'mapProgress' : 'map';
      const bounty = { version, [mapKey]: { bounties: undefined } };
      expect(() => { rejectPreBountyState(bounty); }).toThrow('reserved bounty state');
      expect(() => runMigrations(bounty, version)).toThrow('reserved bounty state');
      for (const id of futureQuestIds) {
        const quest = { version, [mapKey]: { questProgress: { [id]: row(id, 'available') } } };
        expect(() => { rejectPreBountyState(quest); }).toThrow('reserved bounty quest');
        expect(() => runMigrations(quest, version)).toThrow('reserved bounty quest');
      }
    });
  it.each([30, 31] as const)('rejects ordinary bounty state at each version %s entry point and JSON boundary', version => {
    for (const bounties of [{}, undefined, null, { 'quests/bounty-act1-moor-cull': { claims: 0, victoryOrdinal: 0 } }]) {
      const input = { ...sample(), version };
      Reflect.set(input.map, 'bounties', bounties);
      const before = structuredClone(input);
      for (const read of readers(version)) expect(() => read(input)).toThrow('reserved bounty state');
      if (bounties !== undefined) {
        const jsonInput: unknown = JSON.parse(JSON.stringify(input));
        for (const read of readers(version)) expect(() => read(jsonInput)).toThrow('reserved bounty state');
      }
      expect(input).toEqual(before);
    }
  });
  it.each([30, 31] as const)('rejects all five source-free quest rows at each version %s entry point', version => {
    for (const id of futureQuestIds) for (const status of ['available', 'inProgress'] as const) {
      const input = { ...sample(), version };
      Reflect.set(input.map.questProgress, id, row(id, status));
      const before = structuredClone(input), jsonInput: unknown = JSON.parse(JSON.stringify(input));
      for (const read of readers(version)) {
        expect(() => read(input)).toThrow('reserved bounty quest');
        expect(() => read(jsonInput)).toThrow('reserved bounty quest');
      }
      expect(input).toEqual(before);
    }
  });
  it('refuses hidden/inherited keys and raw Map entries before they can disappear', () => {
    for (const inherited of [false, true]) {
      const input = sample();
      if (inherited) Object.setPrototypeOf(input.map, { bounties: undefined });
      else Object.defineProperty(input.map, 'bounties', { value: undefined, enumerable: false });
      expect(() => { rejectPreBountyState(input); }).toThrow('reserved bounty state');
      expect(() => runMigrations(input, 31)).toThrow('reserved bounty state');
      expect(() => validateFrozenV31Save(input)).toThrow('Invalid save:');
      expect(() => decodeSave(input)).toThrow('Invalid save:');
      for (const id of futureQuestIds) {
        const quest = sample();
        if (inherited) Object.setPrototypeOf(quest.map.questProgress, { [id]: undefined });
        else Object.defineProperty(quest.map.questProgress, id, { value: undefined, enumerable: false });
        expect(() => { rejectPreBountyState(quest); }).toThrow('reserved bounty quest');
        expect(() => runMigrations(quest, 31)).toThrow('reserved bounty quest');
        expect(() => validateFrozenV31Save(quest)).toThrow('Invalid save:');
        expect(() => decodeSave(quest)).toThrow('Invalid save:');
      }
    }
    expect(() => { rejectPreBountyState({ version: 1, mapProgress: new Map([['bounties', {}]]) }); })
      .toThrow('reserved bounty state');
    for (const id of futureQuestIds) {
      const legacy = { version: 3, map: { questProgress: new Map([[id, row(id, 'available')]]) } };
      expect(() => runMigrations(legacy, 4)).toThrow('reserved bounty quest');
    }
  });
  it('rejects reserved property accessors without executing any getter', () => {
    let reads = 0;
    for (const inherited of [false, true]) {
      const input = sample(), owner = inherited ? {} : input.map;
      Object.defineProperty(owner, 'bounties', { enumerable: true, get() { reads++; return {}; } });
      if (inherited) Object.setPrototypeOf(input.map, owner);
      for (const read of [rejectPreBountyState, ...readers(31)]) expect(() => { read(input); }).toThrow('Invalid save:');
      for (const id of futureQuestIds) {
        const quest = sample(), progressOwner = inherited ? {} : quest.map.questProgress;
        Object.defineProperty(progressOwner, id, { enumerable: true, get() { reads++; return row(id, 'available'); } });
        if (inherited) Object.setPrototypeOf(quest.map.questProgress, progressOwner);
        for (const read of [rejectPreBountyState, ...readers(31)]) expect(() => { read(quest); }).toThrow('Invalid save:');
      }
    }
    // Container traversal also inspects data descriptors, rather than evaluating accessors.
    for (const key of ['map', 'questProgress'] as const) {
      const input = sample(), owner = key === 'map' ? input : input.map;
      Object.defineProperty(owner, key, { enumerable: true, get() { reads++; return {}; } });
      expect(() => { rejectPreBountyState(input); }).toThrow('bounty container accessor');
      expect(() => runMigrations(input, 31)).toThrow('bounty container accessor');
    }
    expect(reads).toBe(0);
  });
  it.each([30, 31] as const)('preserves unrelated map and quest extensions for literal%s', version => {
    const input = { ...sample(), version };
    const extension = { story: 'retained', counter: 7 }, id = 'quests/extension-story';
    Reflect.set(input.map, 'customExtension', extension);
    Reflect.set(input.map.questProgress, id, row(id, 'available'));
    const before = structuredClone(input);
    expect(() => { rejectPreBountyState(input); }).not.toThrow();
    expect(runMigrations(input, version)).toBe(input);
    for (const read of [value => native(version, value), decodeSave] satisfies ((value: unknown) => unknown)[]) {
      const output = read(input) as SaveV31;
      expect(Reflect.get(output.map, 'customExtension')).toEqual(extension);
      expect(output.map.questProgress[id]).toEqual(row(id, 'available'));
    }
    expect(input).toEqual(before);
  });
  it('leaves successor and malformed-version validation to their own readers', () => {
    expect(() => { rejectPreBountyState({ version: 32, map: { bounties: {}, questProgress:
      Object.fromEntries(futureQuestIds.map(id => [id, row(id, 'available')])) } }); }).not.toThrow();
    for (const value of [null, {}, { version: '31' }, { version: 0 }, { version: 31.5 }]) {
      expect(() => { rejectPreBountyState(value); }).not.toThrow();
    }
  });
});
