/** Literal predecessor compatibility only; all ownership/source graphs are constructed. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as itemLoader from '@/data/loaders/quest-items';
import type { QuestProgressData } from '../types/save';
import { FROZEN_V23 } from './frozen-v23';
import { buildSave, toJsonSafe } from './serialize';
import * as validation from './validate';
import { withoutV24Fields, withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';

// A changed live Act V identity exists BEFORE validate.ts and its schemas import.
// A wrapper that captures live authorities at module load would preserve this
// future identity rather than the predecessor; literal JSON must stay independent.
vi.mock('@/data/loaders/act5-runtime', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/act5-runtime')>();
  const runtime = structuredClone(actual.act5Runtime);
  runtime.encounters = runtime.encounters.map(row => row.questId === 'quests/act5-eve-of-destruction'
    ? { ...row, proof: 'quests/act5-eve-of-destruction#action:future-baal' } : row);
  return { ...actual, act5Runtime: runtime };
});

const literal24 = validation.validateFrozenV24Save;
const ormus = 'quests/side-act3-ormus-charm';
afterEach(() => { vi.restoreAllMocks(); });
function sample() {
  return { ...withoutV32Fields(buildSave({ timestamp: 1000, player: createMockPlayer('Literal24', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } })), version: 24 as const };
}
function completed(id: string): QuestProgressData {
  const quest = FROZEN_V23.quests.find(row => row.id === id);
  if (!quest) throw new Error('Missing historical fixture quest');
  return { id, status: 'completed', rewardClaimed: true,
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true])) };
}
function replay(profile: 'normal' | 'nightmare' | 'hell', achievement = false) {
  const save = sample(), eve = FROZEN_V23.act5.eveQuest;
  const encounter = FROZEN_V23.act5.encounters.find(row => row.questId === eve);
  if (!encounter) throw new Error('Missing historical Eve encounter');
  return { ...save, endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: true },
    map: { ...save.map, currentAct: 5, questProgress: { [eve]: completed(eve) },
      questReceipts: { [encounter.proof]: true as const, [FROZEN_V23.act5.throneProof]: true as const },
      questTitles: { 'titles/slayer_of_baal': true as const }, questDifficulties: { 'difficulty/nightmare': true as const },
      selectedTitle: achievement ? 'titles/worldstone-adapt' as const : 'titles/slayer_of_baal' as const,
      selectedDifficulty: profile, nightmareClearedSubAreas: ['areas/act1-blood-moor'],
      hellClearedSubAreas: ['areas/act1-blood-moor'], challengeOrdinals: { normal: 13, nightmare: 2, hell: 3 } } };
}

describe('literal24 survives future authority captured before validator import', () => {
  it.each(['normal', 'nightmare', 'hell'] as const)('preserves %s with achievement and campaign title ownership', profile => {
    for (const achievement of [false, true]) {
      const save = replay(profile, achievement), before = structuredClone(save);
      expect(() => validation.validateSave(withV32Defaults(save))).toThrow('Invalid');
      expect(literal24(save)).toEqual(toJsonSafe(save));
      expect(literal24(toJsonSafe(save))).toEqual(toJsonSafe(save));
      expect(save).toEqual(before);
    }
  });
  it('keeps literal23 isolated from the same before-import live change', () => {
    const save = replay('nightmare'), old = { ...save, map: { ...save.map,
      hellClearedSubAreas: [], challengeOrdinals: { ...save.map.challengeOrdinals, hell: 0 } } };
    const input = { ...withoutV24Fields(withV32Defaults(old)), version: 23 };
    expect(validation.validateFrozenV23Save(input)).toEqual(toJsonSafe(input));
  });
  it('retains a claimed source service when live quest definitions change', async () => {
    const quests = await vi.importActual<typeof import('@/data/loaders/quests')>('@/data/loaders/quests');
    const loader = await import('@/data/loaders/quests');
    const original = quests.loadQuests(), id = 'quests/act5-siege-on-harrogath';
    const encounter = FROZEN_V23.act5.encounters.find(row => row.questId === id);
    if (!encounter) throw new Error('Missing service source');
    const save = sample(), input = { ...save,
      map: { ...save.map, questProgress: { [id]: completed(id) }, questReceipts: { [encounter.proof]: true } },
      inventory: { ...save.inventory, questServices: { [`${id}#reward:service`]: { serviceId: 'socket_item', state: 'available' } } } };
    vi.spyOn(loader, 'loadQuests').mockReturnValue(original.map(row => row.id === id
      ? { ...row, objectives: [...row.objectives, { id: 'obj-future', type: 'talk', npcId: 'npc/larzuk', description: 'Future' }] } : row));
    expect(() => validation.validateSave(withV32Defaults(input))).toThrow('Invalid');
    expect(literal24(input)).toEqual(toJsonSafe(input));
  });
  it.each([false, true])('preserves sparse completed Ormus history with claimed=%s without fabricating proof', claimed => {
    const save = sample(), input = { ...save, map: { ...save.map,
      questProgress: { [ormus]: { id: ormus, status: 'completed', rewardClaimed: claimed, objectives: {} } } } };
    expect(literal24(input)).toEqual(toJsonSafe(input));
    expect(literal24(input).inventory.backpack).toEqual([]);
    expect(literal24(input).map.questReceipts).toEqual({});
  });
  it('preserves native affix Maps and JSON representation without mutating either', () => {
    const save = sample(), item = { id: 'map-item', baseId: 'items/base/wp1h-short-sword',
      rarity: 'normal', level: 1, equipped: false, identified: true, socketCapacity: 2,
      affixes: [{ affixId: 'legacy', values: new Map([['statMods.life', 7]]) }] };
    const input = { ...save, inventory: { ...save.inventory, backpack: [item] } }, before = structuredClone(input);
    expect(literal24(input)).toEqual(toJsonSafe(input));
    expect(literal24(toJsonSafe(input))).toEqual(toJsonSafe(input)); expect(input).toEqual(before);
  });
  it('refuses future quest-item authority even when current live data admits it', () => {
    const save = sample(), id = 'quests/act2-radaments-lair';
    const future: itemLoader.QuestItemDef = { id: 'quest/future-tool', kind: 'tool', sourceQuestId: id,
      sourceObjectiveId: 'obj-kill-radament', nameKey: 'future', descKey: 'future' };
    vi.spyOn(itemLoader, 'loadQuestItems').mockReturnValue([...FROZEN_V23.items, future]);
    const input = { ...save, map: { ...save.map, questProgress: { [id]: completed(id) } },
      inventory: { ...save.inventory, questItems: { [`${id}#objective:obj-kill-radament`]: { itemId: future.id, state: 'owned' } } } };
    const current = withV32Defaults(input);
    expect(validation.validateSave(current)).toEqual(toJsonSafe(current));
    expect(() => literal24(input)).toThrow('Invalid');
  });
});

describe('literal24 does not launder contradictory raw state', () => {
  it.each(['proof', 'objective', 'claim', 'title'] as const)('refuses missing or invalid %s authority', fault => {
    const save = replay('hell', true);
    if (fault === 'proof') Reflect.deleteProperty(save.map.questReceipts, FROZEN_V23.act5.throneProof);
    if (fault === 'objective') Reflect.set(save.map.questProgress[FROZEN_V23.act5.eveQuest]?.objectives ?? {}, 'obj-kill-baal', false);
    if (fault === 'claim') Reflect.set(save.endgame, 'achievementRewardClaimed', false);
    if (fault === 'title') Reflect.set(save.map, 'selectedTitle', 'titles/future');
    expect(() => literal24(save)).toThrow();
  });
  it('refuses a copied future Ormus proof without inferring objectives', () => {
    const save = sample(), input = { ...save, map: { ...save.map,
      questProgress: { [ormus]: completed(ormus) },
      questReceipts: { [`${ormus}#action:flayer-jungle-victory`]: true } } };
    expect(() => literal24(input)).toThrow('Invalid');
  });
  it.each(['undefined', 'inherited', 'accessor'] as const)('rejects raw %s replay fields before normalization', fault => {
    const save = sample(); let invoked = false;
    if (fault === 'undefined') Reflect.set(save.map, 'hellClearedSubAreas', undefined);
    if (fault === 'inherited') {
      Reflect.deleteProperty(save.map, 'hellClearedSubAreas');
      Object.setPrototypeOf(save.map, { hellClearedSubAreas: [] });
    }
    if (fault === 'accessor') Object.defineProperty(save.map, 'hellClearedSubAreas', {
      enumerable: true, get: () => { invoked = true; return []; } });
    expect(() => literal24(save)).toThrow(); expect(invoked).toBe(false);
  });
});
