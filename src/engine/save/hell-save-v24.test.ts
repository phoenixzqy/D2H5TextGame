import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
/**
 * Candidate destination: src/engine/save/hell-save-v24.test.ts.
 * Constructed compatibility fixtures only; none represents earned gameplay.
 * No future-only API import: positives exercise actual migration, builder and
 * native save boundaries so the post-H1 baseline produces behavioral REDs.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { ACT1_IMBUE_SOURCES, ACT1_QUEST_RECEIPTS } from '../map/act1-quest-sources';
import { CAIN_QUEST, CAIN_SIDE_QUEST, CAIN_SCROLL_ITEM, CAIN_SCROLL_SOURCE } from '../map/cain-quest';
import { MALUS_ITEM, MALUS_QUEST, MALUS_SIDE_QUEST, MALUS_SOURCE } from '../map/malus-quest';
import { COUNTESS } from '../map/countess-admission';
import { EVE_QUEST, THRONE_PROOF } from '../map/act5-admission';
import {
  CURRENT_SAVE_VERSION, MIGRATIONS, type CampaignMapSaveData, type CurrentMapSaveData,
  type QuestProgressData, type ReplayProfileId, type SaveCurrent, type SaveV23
} from '../types/save';
import { FROZEN_V23 } from './frozen-v23';
import { runMigrations } from './migrate';
import { buildSave, toJsonSafe, type BuildSaveInput } from './serialize';
import { decodeSave, validateFrozenV23Save, validateFrozenV24Save as validateSave, validateSave as validateCurrentSave } from './validate';

type Profile24 = 'normal' | 'nightmare' | 'hell';
// Test-local candidate shape avoids a missing SaveV24 import on the RED baseline.
// The type assertions below separately require the actual current/historical split.
type Native24Candidate = Omit<SaveV23, 'version' | 'map'> & {
  readonly version: 24;
  readonly map: Omit<SaveV23['map'], 'selectedDifficulty' | 'challengeOrdinals'> & {
    readonly selectedDifficulty: Profile24;
    readonly hellClearedSubAreas: readonly string[];
    readonly challengeOrdinals: Readonly<Record<Profile24, number>>;
  };
};

function buildInput(qualified = true): BuildSaveInput {
  const evidence = campaignEvidence();
  return {
    timestamp: 1000, player: createMockPlayer('Constructed Hell save', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 },
      questItems: qualified ? evidence.questItems : {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 5, currentSubAreaId: null,
      discoveredAreas: ['areas/act1-blood-moor', 'areas/act5-throne-of-destruction'],
      clearedSubAreas: ['areas/act1-blood-moor'],
      questProgress: qualified ? evidence.questProgress : {},
      questReceipts: qualified ? evidence.questReceipts : {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 },
    gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] }
  };
}

/** Construct a literal23 shape explicitly, independently of future builder defaults. */
function literal23(options: { qualified?: boolean; nightmare?: boolean; achievement?: boolean } = {}): SaveV23 {
  const { qualified = true, nightmare = false, achievement = false } = options;
  const input = buildInput(qualified), common = buildSave(input);
  return { ...withoutV32Fields(common), version: 23,
    endgame: achievement ? { attemptOrdinal: 5, clearCounts: { ashen: 2, glacial: 1 }, achievementRewardClaimed: true }
      : { attemptOrdinal: 0, clearCounts: { ashen: 0, glacial: 0 }, achievementRewardClaimed: false },
    map: { currentAct: input.map.currentAct, currentSubAreaId: input.map.currentSubAreaId,
      discoveredAreas: input.map.discoveredAreas, clearedSubAreas: input.map.clearedSubAreas,
      questProgress: input.map.questProgress, questReceipts: input.map.questReceipts ?? {},
      questTitles: nightmare ? { 'titles/slayer_of_baal': true } : {},
      questDifficulties: nightmare ? { 'difficulty/nightmare': true } : {},
      selectedTitle: achievement ? 'titles/worldstone-adapt' : nightmare ? 'titles/slayer_of_baal' : null,
      selectedDifficulty: nightmare ? 'nightmare' : 'normal',
      nightmareClearedSubAreas: nightmare ? ['areas/act1-dark-wood'] : [],
      challengeOrdinals: { normal: 13, nightmare: nightmare ? 2 : 0 } }
  };
}

function upgradedExpected(old: SaveV23): Native24Candidate {
  return { ...old, version: 24, map: { ...old.map,
    hellClearedSubAreas: [], challengeOrdinals: { ...old.map.challengeOrdinals, hell: 0 } } };
}
function native24(qualified = true): Native24Candidate {
  return upgradedExpected(literal23({ qualified }));
}
function hellHistory(selectedDifficulty: Profile24 = 'hell'): Native24Candidate {
  const save = native24();
  return { ...save, map: { ...save.map, selectedDifficulty,
    hellClearedSubAreas: ['areas/act1-dark-wood', 'areas/act5-throne-of-destruction'],
    challengeOrdinals: { normal: 13, nightmare: 0, hell: 360359 } } };
}
function completed(id: string): QuestProgressData {
  const quest = FROZEN_V23.quests.find(row => row.id === id);
  if (!quest) throw new Error(`Missing constructed literal23 quest ${id}`);
  return { id, status: 'completed', rewardClaimed: true,
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true])) };
}
function act1History(): SaveV23 {
  const save = literal23();
  return { ...save, map: { ...save.map,
    questProgress: { ...save.map.questProgress, ...Object.fromEntries(
      [CAIN_QUEST, CAIN_SIDE_QUEST, MALUS_QUEST, MALUS_SIDE_QUEST, COUNTESS.quest].map(id => [id, completed(id)])) },
    questReceipts: { ...save.map.questReceipts,
      ...Object.fromEntries(Object.values(ACT1_QUEST_RECEIPTS).map(source => [source, true as const])) } },
  inventory: { ...save.inventory, questItems: { ...save.inventory.questItems,
    [CAIN_SCROLL_SOURCE]: { itemId: CAIN_SCROLL_ITEM, state: 'consumed' },
    [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'consumed' } },
  questServices: {
    [ACT1_IMBUE_SOURCES.main]: { serviceId: 'imbue_item', state: 'available' },
    [ACT1_IMBUE_SOURCES.side]: { serviceId: 'imbue_item', state: 'consumed', targetItemId: 'constructed-salvaged-target' }
  } } };
}
function expectNativeRefusal(value: unknown): void {
  expect(() => validateSave(value)).toThrow();
  expect(() => decodeSave(value)).toThrow();
}

describe('native24 registration and historical type isolation', () => {
  it('retains migration24 while current25 and the two-profile historical aliases remain closed', () => {
    expect(CURRENT_SAVE_VERSION).toBe(33); expect(MIGRATIONS[24]).toBeTypeOf('function');
    expectTypeOf<ReplayProfileId>().toEqualTypeOf<'normal' | 'nightmare'>();
    expectTypeOf<CampaignMapSaveData['selectedDifficulty']>().toEqualTypeOf<'normal' | 'nightmare'>();
    expectTypeOf<CurrentMapSaveData['selectedDifficulty']>().toEqualTypeOf<'normal' | 'nightmare'>();
    expectTypeOf<SaveV23['map']['selectedDifficulty']>().toEqualTypeOf<'normal' | 'nightmare'>();
    expectTypeOf<keyof SaveV23['map']['challengeOrdinals']>().toEqualTypeOf<'normal' | 'nightmare'>();
    expectTypeOf<SaveCurrent['version']>().toEqualTypeOf<33>();
    expectTypeOf<SaveCurrent['map']['selectedDifficulty']>().toEqualTypeOf<Profile24>();
    expectTypeOf<keyof SaveCurrent['map']['challengeOrdinals']>().toEqualTypeOf<Profile24>();
  });
  it('builds current defaults with empty Hell history and three independent ordinals', () => {
    const save = buildSave(buildInput(false));
    expect(save.version).toBe(33);
    expect(save.map).toMatchObject({ selectedDifficulty: 'normal', hellClearedSubAreas: [],
      challengeOrdinals: { normal: 0, nightmare: 0, hell: 0 } });
    expect(Object.keys(save.map.challengeOrdinals).sort()).toEqual(['hell', 'nightmare', 'normal']);
    expect(validateCurrentSave(save)).toEqual(toJsonSafe(save));
  });
  it('keeps literal23 valid and rejects24 at the frozen reader without relabelling it', () => {
    const old = literal23({ nightmare: true, achievement: true }), before = structuredClone(old);
    expect(validateFrozenV23Save(old)).toEqual(toJsonSafe(old));
    expect(() => validateFrozenV23Save(hellHistory())).toThrow(); expect(old).toEqual(before);
  });
});

describe('literal23 to24 migration adds only the two Hell defaults', () => {
  it.each([
    { qualified: false }, { qualified: true }, { nightmare: true },
    { achievement: true }, { nightmare: true, achievement: true }
  ])('preserves the complete prior shape and selection for %j', options => {
    const old = literal23(options), before = structuredClone(old);
    expect(validateFrozenV23Save(old)).toEqual(toJsonSafe(old));
    const expected = upgradedExpected(old);
    expect(runMigrations(old, 24)).toEqual(expected);
    expect(decodeSave(toJsonSafe(old))).toEqual(withV32Defaults(expected)); expect(old).toEqual(before);
    expect(expected.map.questDifficulties).toEqual(old.map.questDifficulties);
    expect(expected.map.questReceipts).toEqual(old.map.questReceipts);
  });
  it('preserves both Act I imbues and exact physical/action authority during upgrade', () => {
    const old = act1History(), before = structuredClone(old);
    expect(validateFrozenV23Save(old)).toEqual(toJsonSafe(old));
    expect(runMigrations(old, 24)).toEqual(upgradedExpected(old));
    expect(decodeSave(toJsonSafe(old))).toEqual(withV32Defaults(upgradedExpected(old))); expect(old).toEqual(before);
  });
  it.each(['cain', 'malus', 'countess'])('validates literal23 %s authority before adding defaults', fault => {
    const old = structuredClone(act1History());
    if (fault === 'cain') Reflect.deleteProperty(old.map.questReceipts, ACT1_QUEST_RECEIPTS.rescueCain);
    if (fault === 'malus') Reflect.set(old.inventory.questItems, MALUS_SOURCE, { itemId: MALUS_ITEM, state: 'owned' });
    if (fault === 'countess') Reflect.set(old.map.questProgress[COUNTESS.quest]?.objectives ?? {}, COUNTESS.objective, false);
    const before = structuredClone(old);
    expect(() => validateFrozenV23Save(old)).toThrow();
    expect(() => runMigrations(old, 24)).toThrow(); expect(() => decodeSave(old)).toThrow();
    expect(old).toEqual(before);
  });
  it.each(['clears', 'selection', 'ordinal'])('refuses raw23 injected Hell %s rather than laundering it', field => {
    const old = literal23();
    if (field === 'clears') Reflect.set(old.map, 'hellClearedSubAreas', []);
    if (field === 'selection') Reflect.set(old.map, 'selectedDifficulty', 'hell');
    if (field === 'ordinal') Reflect.set(old.map, 'challengeOrdinals', { normal: 13, nightmare: 0, hell: 0 });
    const before = structuredClone(old);
    expect(() => validateFrozenV23Save(old)).toThrow();
    expect(() => runMigrations(old, 24)).toThrow(); expect(() => decodeSave(old)).toThrow();
    expect(old).toEqual(before);
  });
});

describe('source-backed native24 Hell selection and independent persisted history', () => {
  it.each(['normal', 'hell'] as const)('round trips Hell history while selected %s without a Nightmare receipt', selected => {
    const save = hellHistory(selected), before = structuredClone(save);
    expect(save.map.questDifficulties).toEqual({});
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save))).toEqual(withV32Defaults(save)); expect(save).toEqual(before);
  });
  it('accepts a source-complete selected Hell preference before any Hell clear or ordinal', () => {
    const save = native24(), input = { ...save, map: { ...save.map, selectedDifficulty: 'hell' } };
    expect(validateSave(input)).toEqual(toJsonSafe(input)); expect(decodeSave(toJsonSafe(input))).toEqual(withV32Defaults(input));
  });
  it('round trips all three progress sets with Nightmare ownership and the claimed achievement unchanged', () => {
    const base = upgradedExpected(literal23({ nightmare: true, achievement: true }));
    const save = { ...base, map: { ...base.map, selectedDifficulty: 'hell',
      hellClearedSubAreas: ['areas/act5-throne-of-destruction'],
      challengeOrdinals: { normal: 13, nightmare: 2, hell: 7 } } };
    const before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save))).toEqual(withV32Defaults(save)); expect(save).toEqual(before);
  });
  it('permits a locked character with Normal selection and exactly empty Hell history', () => {
    const save = native24(false);
    expect(validateSave(save)).toEqual(toJsonSafe(save)); expect(decodeSave(toJsonSafe(save))).toEqual(withV32Defaults(save));
  });
  it.each(['selection', 'clear', 'ordinal'])('refuses locked Hell %s even while other history stays empty', fault => {
    const save = native24(false);
    if (fault === 'selection') Reflect.set(save.map, 'selectedDifficulty', 'hell');
    if (fault === 'clear') Reflect.set(save.map, 'hellClearedSubAreas', ['areas/act1-blood-moor']);
    if (fault === 'ordinal') Reflect.set(save.map.challengeOrdinals, 'hell', 1);
    const before = structuredClone(save); expectNativeRefusal(save); expect(save).toEqual(before);
  });
  it.each(['missing-throne', 'missing-victory', 'unclaimed', 'false-objective', 'loose-flags', 'broken-malus'])(
    'refuses a source-incomplete %s graph without granting or repairing access', fault => {
      const base = fault === 'broken-malus' ? upgradedExpected(act1History()) : native24();
      const save = { ...base, map: { ...base.map, selectedDifficulty: 'hell' } };
      if (fault === 'missing-throne') Reflect.deleteProperty(save.map.questReceipts, THRONE_PROOF);
      if (fault === 'missing-victory') {
        const victory = FROZEN_V23.act5.encounters.find(row => row.questId === EVE_QUEST);
        if (!victory) throw new Error('Missing fixture Eve victory');
        Reflect.deleteProperty(save.map.questReceipts, victory.proof);
      }
      if (fault === 'unclaimed') Reflect.set(save.map.questProgress[EVE_QUEST] ?? {}, 'rewardClaimed', false);
      if (fault === 'false-objective') Reflect.set(save.map.questProgress[EVE_QUEST]?.objectives ?? {}, 'obj-kill-baal', false);
      if (fault === 'loose-flags') Reflect.set(save.map, 'questReceipts', {});
      if (fault === 'broken-malus') Reflect.set(save.inventory.questItems, MALUS_SOURCE, { itemId: MALUS_ITEM, state: 'owned' });
      const before = structuredClone(save); expectNativeRefusal(save); expect(save).toEqual(before);
    });
  it.each(['selection', 'history'])('retains the separate Nightmare receipt requirement for %s', fault => {
    const save = native24();
    if (fault === 'selection') Reflect.set(save.map, 'selectedDifficulty', 'nightmare');
    if (fault === 'history') Reflect.set(save.map, 'nightmareClearedSubAreas', ['areas/act1-blood-moor']);
    expectNativeRefusal(save);
  });
  it('does not admit an invented difficulty/hell entitlement map key', () => {
    const save = native24(); Reflect.set(save.map.questDifficulties, 'difficulty/hell', true);
    expectNativeRefusal(save);
  });
});

describe('native24 closed raw Hell fields before normalization or hydration', () => {
  it.each(['missing', 'undefined', 'inherited', 'hidden', 'accessor'])(
    'requires an own enumerable Hell clear array: %s', shape => {
      const save = native24(); let reads = 0;
      Reflect.deleteProperty(save.map, 'hellClearedSubAreas');
      if (shape === 'undefined') Reflect.set(save.map, 'hellClearedSubAreas', undefined);
      if (shape === 'inherited') Object.setPrototypeOf(save.map, { hellClearedSubAreas: [] });
      if (shape === 'hidden') Object.defineProperty(save.map, 'hellClearedSubAreas', { value: [] });
      if (shape === 'accessor') Object.defineProperty(save.map, 'hellClearedSubAreas', {
        enumerable: true, get: () => { reads++; return []; }
      });
      expectNativeRefusal(save); expect(reads).toBe(0);
    });
  it.each([{ clears: ['areas/unknown'] }, { clears: ['areas/act1-blood-moor', 'areas/act1-blood-moor'] },
    { clears: [1] }, { clears: null }])(
    'refuses malformed or noncanonical Hell clears $clears', ({ clears }) => {
      const save = native24(); Reflect.set(save.map, 'hellClearedSubAreas', clears); expectNativeRefusal(save);
    });
  it.each(['missing-normal', 'missing-nightmare', 'missing-hell', 'extra', 'inherited-hell', 'map', 'accessor'])(
    'requires an own closed three-key ordinal record: %s', shape => {
      const save = native24(); let reads = 0;
      if (shape.startsWith('missing-')) Reflect.deleteProperty(save.map.challengeOrdinals, shape.slice(8));
      if (shape === 'extra') Reflect.set(save.map.challengeOrdinals, 'future', 0);
      if (shape === 'inherited-hell') {
        Reflect.deleteProperty(save.map.challengeOrdinals, 'hell'); Object.setPrototypeOf(save.map.challengeOrdinals, { hell: 0 });
      }
      if (shape === 'map') Reflect.set(save.map, 'challengeOrdinals', new Map([['normal', 13], ['nightmare', 0], ['hell', 0]]));
      if (shape === 'accessor') Object.defineProperty(save.map.challengeOrdinals, 'hell', {
        enumerable: true, get: () => { reads++; return 0; }
      });
      expectNativeRefusal(save); expect(reads).toBe(0);
    });
  it.each((['normal', 'nightmare', 'hell'] as const).flatMap(profile =>
    [-1, 0.5, 360360, Number.NaN, Number.POSITIVE_INFINITY].map(value => ({ profile, value }))))(
    'refuses out-of-domain $profile ordinal $value', ({ profile, value }) => {
      const save = native24(); Reflect.set(save.map.challengeOrdinals, profile, value); expectNativeRefusal(save);
    });
  it.each(['unknown', 'HELL', 'hell ', undefined])('refuses a noncanonical profile %s', profile => {
    const save = native24(); Reflect.set(save.map, 'selectedDifficulty', profile); expectNativeRefusal(save);
  });
  it.each(['inherited', 'accessor'])('requires own data profile selection: %s', shape => {
    const save = native24(); let reads = 0;
    Reflect.deleteProperty(save.map, 'selectedDifficulty');
    if (shape === 'inherited') Object.setPrototypeOf(save.map, { selectedDifficulty: 'hell' });
    else Object.defineProperty(save.map, 'selectedDifficulty', { enumerable: true, get: () => { reads++; return 'hell'; } });
    expectNativeRefusal(save); expect(reads).toBe(0);
  });
});
