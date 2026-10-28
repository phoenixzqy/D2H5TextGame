/** D11 current-only source/Present/save contracts. Constructed fixtures; no earned credit. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { ACT1_IMBUE_SOURCES as SOURCES, ACT1_QUEST_RECEIPTS as RECEIPTS } from '@/engine/map/act1-quest-sources';
import { MALUS_QUEST as MAIN, MALUS_SOURCE, MALUS_ITEM } from '@/engine/map/malus-quest';
import { QUEST_SERVICE_SOURCES, validateQuestServiceLedger, type QuestServiceLedger } from '@/engine/services/quest-services';
import type { QuestProgressData, SaveCurrent } from '@/engine/types/save';
import { hasQuestServiceSourceGraph } from '@/engine/save/act5-campaign';
import { buildSave, toJsonSafe } from '@/engine/save/serialize';
import { decodeSave, validateFrozenV22Save, validateSave } from '@/engine/save/validate';
import { runMigrations } from '@/engine/save/migrate';

const SIDE = 'quests/side-act1-charsis-imbue';
const OLD_SOURCES = {
  'quests/act5-siege-on-harrogath#reward:service': 'socket_item',
  'quests/side-act5-larzuks-sockets#reward:service': 'socket_item',
  'quests/side-act4-halbus-soul#reward:service': 'socket_armor',
  'quests/act5-prison-of-ice#reward:service': 'personalize_item',
  'quests/side-act5-anyas-gift#reward:service': 'personalize_item'
};
function row(id: string, claimed: boolean, objectives: Record<string, boolean>): QuestProgressData {
  return { id, status: 'completed', rewardClaimed: claimed, objectives };
}
function fixture(mainClaimed = true, sideClaimed = true, services: QuestServiceLedger = {}): SaveCurrent {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Imbue graph', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 }, questServices: services,
      questItems: { [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'consumed' } } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {
      [MAIN]: row(MAIN, mainClaimed, { 'obj-recover-malus': true, 'obj-imbue-ready': true }),
      [SIDE]: row(SIDE, sideClaimed, { 'obj-bring-item': true })
    }, questReceipts: { [RECEIPTS.presentItem]: true } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function roundtrip(save: SaveCurrent): void {
  const before = structuredClone(save);
  expect(validateSave(toJsonSafe(save))).toEqual(toJsonSafe(save));
  expect(decodeSave(toJsonSafe(save))).toEqual(save);
  expect(save).toEqual(before);
}
function withMain(save: SaveCurrent, replacement: QuestProgressData | null): SaveCurrent {
  const progress = { ...save.map.questProgress };
  if (replacement) progress[MAIN] = replacement; else Reflect.deleteProperty(progress, MAIN);
  return { ...save, map: { ...save.map, questProgress: progress } };
}
function actualGraph(save: SaveCurrent, id: string): boolean {
  return hasQuestServiceSourceGraph(id, save.map.questProgress, save.map.questReceipts, save.inventory.questItems);
}
function mainRow(save: SaveCurrent): QuestProgressData {
  const value = save.map.questProgress[MAIN]; if (!value) throw new Error('Missing fixture main'); return value;
}
function sideRow(save: SaveCurrent): QuestProgressData {
  const value = save.map.questProgress[SIDE]; if (!value) throw new Error('Missing fixture side'); return value;
}

describe('D11 exactly two current-only independently earned imbue sources', () => {
  it('activates only two exact Act I sources and retains all five historical mappings', () => {
    expect(QUEST_SERVICE_SOURCES).toEqual({ ...OLD_SOURCES, [SOURCES.main]: 'imbue_item', [SOURCES.side]: 'imbue_item' });
    expect(Object.isFrozen(QUEST_SERVICE_SOURCES)).toBe(true);
  });
  it('recognizes actual main hand-in without requiring its Claim or a side presentation', () => {
    const save = fixture(false, false);
    const onlyMain = { ...save, map: { ...save.map, questProgress: { [MAIN]: mainRow(save) }, questReceipts: {} } };
    expect(actualGraph(onlyMain, MAIN)).toBe(true); roundtrip(onlyMain);
  });
  it('recognizes actual side Present before either Claim, with no item custody or inferred charge', () => {
    const save = fixture(false, false);
    expect(actualGraph(save, SIDE)).toBe(true); roundtrip(save);
    expect(save.inventory.backpack).toEqual([]); expect(save.inventory.questServices).toEqual({});
  });
  it.each(['missing-item', 'owned-item', 'wrong-item', 'missing-recover', 'false-recover',
    'missing-give', 'false-give', 'wrong-row', 'missing-row', 'in-progress'] as const)(
    'rejects service and Present authority for a %s main graph', fault => {
      let save = fixture(true, true, { [SOURCES.main]: { serviceId: 'imbue_item', state: 'available' } });
      const main = mainRow(save);
      if (fault === 'missing-item') save = { ...save, inventory: { ...save.inventory, questItems: {} } };
      if (fault === 'owned-item') save = { ...save, inventory: { ...save.inventory,
        questItems: { [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'owned' } } } };
      if (fault === 'wrong-item') save = { ...save, inventory: { ...save.inventory,
        questItems: { [MALUS_SOURCE]: { itemId: 'quest/scroll_of_inifuss', state: 'consumed' } } } };
      if (fault === 'missing-recover' || fault === 'false-recover') save = withMain(save,
        { ...main, objectives: { 'obj-imbue-ready': true, ...(fault === 'false-recover' ? { 'obj-recover-malus': false } : {}) } });
      if (fault === 'missing-give' || fault === 'false-give') save = withMain(save,
        { ...main, objectives: { 'obj-recover-malus': true, ...(fault === 'false-give' ? { 'obj-imbue-ready': false } : {}) } });
      if (fault === 'wrong-row') save = withMain(save, { ...main, id: SIDE });
      if (fault === 'missing-row') save = withMain(save, null);
      if (fault === 'in-progress') save = withMain(save, { ...main, status: 'inProgress' });
      const before = structuredClone(save);
      expect(actualGraph(save, MAIN)).toBe(false); expect(actualGraph(save, SIDE)).toBe(false);
      expect(() => validateSave(toJsonSafe(save))).toThrow('Invalid'); expect(save).toEqual(before);
    });
  it.each(['no-receipt', 'false-receipt', 'wrong-receipt', 'no-side-row', 'wrong-side-id',
    'missing-flag', 'false-flag', 'in-progress'] as const)('rejects a %s side service graph', fault => {
      let save = fixture(false, true, { [SOURCES.side]: { serviceId: 'imbue_item', state: 'available' } });
      const side = sideRow(save);
      if (fault === 'no-receipt') save = { ...save, map: { ...save.map, questReceipts: {} } };
      if (fault === 'false-receipt') {
        const raw = { ...save, map: { ...save.map, questReceipts: { [RECEIPTS.presentItem]: false } } };
        expect(() => validateSave(raw)).toThrow('Invalid');
        expect(hasQuestServiceSourceGraph(SIDE, save.map.questProgress,
          { [RECEIPTS.presentItem]: false } as unknown as SaveCurrent['map']['questReceipts'], save.inventory.questItems)).toBe(false);
        return;
      }
      if (fault === 'wrong-receipt') save = { ...save, map: { ...save.map,
        questReceipts: { [RECEIPTS.cainTalk]: true } } };
      if (fault === 'no-side-row') save = { ...save, map: { ...save.map, questProgress: { [MAIN]: mainRow(save) } } };
      if (fault === 'wrong-side-id') save = { ...save, map: { ...save.map,
        questProgress: { ...save.map.questProgress, [SIDE]: { ...side, id: MAIN } } } };
      if (fault === 'missing-flag' || fault === 'false-flag') save = { ...save, map: { ...save.map,
        questProgress: { ...save.map.questProgress, [SIDE]: { ...side,
          objectives: fault === 'missing-flag' ? {} : { 'obj-bring-item': false } } } } };
      if (fault === 'in-progress') save = { ...save, map: { ...save.map,
        questProgress: { ...save.map.questProgress, [SIDE]: { ...side, status: 'inProgress' } } } };
      expect(actualGraph(save, SIDE)).toBe(false); expect(() => validateSave(toJsonSafe(save))).toThrow('Invalid');
    });
  it.each(['available', 'consumed'] as const)('roundtrips main-only %s without side row or Present', state => {
    const entry = state === 'available' ? { serviceId: 'imbue_item' as const, state }
      : { serviceId: 'imbue_item' as const, state, targetItemId: 'salvaged-main-only' };
    const full = fixture(true, false, { [SOURCES.main]: entry });
    const save = { ...full, map: { ...full.map, questProgress: { [MAIN]: mainRow(full) }, questReceipts: {} } };
    roundtrip(save); expect(save.inventory.questServices[SOURCES.side]).toBeUndefined();
  });
  it.each(['missing-item', 'owned-item', 'missing-main-row', 'missing-side-row', 'missing-flag', 'false-flag'] as const)(
    'requires the Present receipt reciprocal graph with an empty wallet: %s', fault => {
      let save = fixture(false, false);
      if (fault === 'missing-item') save = { ...save, inventory: { ...save.inventory, questItems: {} } };
      if (fault === 'owned-item') save = { ...save, inventory: { ...save.inventory,
        questItems: { [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'owned' } } } };
      if (fault === 'missing-main-row') save = { ...save, inventory: { ...save.inventory, questItems: {} },
        map: { ...save.map, questProgress: { [SIDE]: sideRow(save) } } };
      if (fault === 'missing-side-row') save = { ...save, map: { ...save.map, questProgress: { [MAIN]: mainRow(save) } } };
      if (fault === 'missing-flag' || fault === 'false-flag') save = { ...save, map: { ...save.map,
        questProgress: { ...save.map.questProgress, [SIDE]: { ...sideRow(save),
          objectives: fault === 'missing-flag' ? {} : { 'obj-bring-item': false } } } } };
      const baseline = { ...save, map: { ...save.map, questReceipts: {} } };
      // Establish that the exact receipt, not another malformed participant or wallet, causes refusal.
      roundtrip(baseline); expect(save.inventory.questServices).toEqual({});
      expect(() => validateSave(toJsonSafe(save))).toThrow('Invalid');
      expect(() => decodeSave(toJsonSafe(save))).toThrow('Invalid');
    });
  it.each(['available', 'consumed'] as const)('admits a side-only %s charge without main Claim or retained target', state => {
    const entry = state === 'available' ? { serviceId: 'imbue_item' as const, state }
      : { serviceId: 'imbue_item' as const, state, targetItemId: 'salvaged selected item' };
    const save = fixture(false, true, { [SOURCES.side]: entry });
    expect(validateQuestServiceLedger(save.inventory.questServices, save.map.questProgress)).toBe(save.inventory.questServices);
    roundtrip(save); expect(save.inventory.questServices[SOURCES.main]).toBeUndefined();
  });
  it.each([['available', 'available'], ['available', 'consumed'], ['consumed', 'available'], ['consumed', 'consumed']] as const)(
    'roundtrips independent main %s and side %s including salvaged target IDs', (mainState, sideState) => {
      const services: QuestServiceLedger = {
        [SOURCES.main]: mainState === 'available' ? { serviceId: 'imbue_item', state: mainState }
          : { serviceId: 'imbue_item', state: mainState, targetItemId: 'already-salvaged-main' },
        [SOURCES.side]: sideState === 'available' ? { serviceId: 'imbue_item', state: sideState }
          : { serviceId: 'imbue_item', state: sideState, targetItemId: 'already-salvaged-side' }
      };
      const save = fixture(true, true, services); roundtrip(save);
      expect(save.inventory.backpack).toEqual([]); expect(save.inventory.stash).toEqual([]);
    });
  it.each([SOURCES.main, SOURCES.side])('refuses an unclaimed %s wallet entry even with real physical/action proof', source => {
    const save = fixture(source !== SOURCES.main, source !== SOURCES.side,
      { [source]: { serviceId: 'imbue_item', state: 'available' } });
    expect(() => validateQuestServiceLedger(save.inventory.questServices, save.map.questProgress)).toThrow('Invalid');
    expect(() => validateSave(toJsonSafe(save))).toThrow('Invalid');
  });
  it.each([SOURCES.main, SOURCES.side])('does not convert a malformed %s entry into availability', source => {
    const save = fixture();
    for (const entry of [undefined, {}, { serviceId: 'socket_item', state: 'available' },
      { serviceId: 'imbue_item', state: 'available', targetItemId: 'forbidden' },
      { serviceId: 'imbue_item', state: 'consumed' }]) {
      const raw = { ...save, inventory: { ...save.inventory, questServices: { [source]: entry } } };
      expect(() => validateSave(raw)).toThrow('Invalid');
    }
  });
  it('accepts completed legacy flags without treating them as actual proof or manufacturing a service', () => {
    const full = fixture(), save = { ...full, inventory: { ...full.inventory, questItems: {} },
      map: { ...full.map, questReceipts: {} } };
    roundtrip(save); expect(actualGraph(save, MAIN)).toBe(false); expect(actualGraph(save, SIDE)).toBe(false);
    expect(save.inventory.questServices).toEqual({});
  });
  it.each([false, true])('migrates sparse literal22 rows losslessly with claimed=%s and grants nothing', claimed => {
    const full = fixture(), old = { ...full, version: 22 as const, inventory: { ...full.inventory, questItems: {}, questServices: {} },
      map: { ...full.map, questReceipts: {}, questProgress: { [MAIN]: row(MAIN, claimed, {}),
        [SIDE]: row(SIDE, claimed, { 'obj-bring-item': false }) } } };
    const before = structuredClone(old), expected = { ...old, version: 23 };
    expect(validateFrozenV22Save(old)).toEqual(toJsonSafe(old)); expect(runMigrations(old, 23)).toEqual(expected);
    expect(decodeSave(toJsonSafe(old))).toEqual(expected); expect(old).toEqual(before);
  });
  it.each(['present', SOURCES.main, SOURCES.side])('rejects current %s authority under literal22 before migration', kind => {
    const full = fixture(), baseline = { ...full, version: 22 as const,
      inventory: { ...full.inventory, questItems: {}, questServices: {} }, map: { ...full.map, questReceipts: {} } };
    expect(validateFrozenV22Save(baseline)).toEqual(toJsonSafe(baseline));
    const old = kind === 'present' ? { ...baseline, map: { ...baseline.map,
      questReceipts: { [RECEIPTS.presentItem]: true as const } } }
      : { ...baseline, inventory: { ...baseline.inventory,
        questServices: { [kind]: { serviceId: 'imbue_item', state: 'available' } } } };
    const before = structuredClone(old);
    expect(() => validateFrozenV22Save(old)).toThrow('Invalid'); expect(() => runMigrations(old, 23)).toThrow('Invalid');
    expect(() => decodeSave(toJsonSafe(old))).toThrow('Invalid'); expect(old).toEqual(before);
  });
});
