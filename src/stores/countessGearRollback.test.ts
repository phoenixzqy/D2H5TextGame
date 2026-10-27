/**
 * Constructed Countess gear-ownership regressions.
 * Faults are synchronous observers of actual native proof publication. The
 * current source must first reach that publication; no reproduced fault is claimed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadQuests } from '@/data/loaders/quests';
import { loadMercPool } from '@/data/loaders/mercs';
import * as award from '@/engine/loot/award';
import { claimQuestReward } from '@/features/quests/claimReward';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from '@/stores/combatHelpers';
import { combatRunLifecycle } from '@/stores/combatRunLifecycle';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { __resetPersistenceForTests, exportCurrentSave, useHydrationStore } from '@/stores/persistence';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { assertWaveSnapshotAllowed, WaveGuardError } from '@/stores/waveTransitionGuard';
import type { Item } from '@/engine/types/items';

const QUEST = 'quests/act1-forgotten-tower';
const AREA = 'areas/act1-dark-wood';
const ENCOUNTER = 'act1-dw-countess';
const PROOF = `${QUEST}#action:countess-victory`;
const NATIVE_ITEM = 'countess-native-bag-cap';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore,
  useMercStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Countess gear transaction fixture');
  return value;
}
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function data(state: object) {
  return Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== 'function'));
}
function snapshot() {
  return structuredClone({
    player: data(usePlayerStore.getState()), inventory: data(useInventoryStore.getState()),
    map: data(useMapStore.getState()), combat: data(useCombatStore.getState()),
    merc: data(useMercStore.getState()), meta: data(useMetaStore.getState()),
    formation: data(useFormationStore.getState()), run: combatRunLifecycle.activeRun
  });
}
function addMerc(definitionId: string) {
  const definition = required(loadMercPool().pool.find(row => row.id === definitionId));
  const merc = createMercFromDef(definition);
  useMercStore.getState().addMerc(merc);
  return merc.id;
}
function ready() {
  const options = { act: 1, subAreaId: AREA, mode: 'manual', runSeed: 7, questEncounter: ENCOUNTER };
  const entered = required(startSubAreaRun(options as Parameters<typeof startSubAreaRun>[0]));
  expect(entered.totalWaves).toBe(1);
  const run = required(combatRunLifecycle.activeRun), wave = required(run.plan.waves[0]);
  expect(wave.source).toEqual({ kind: 'questEncounter', encounterId: ENCOUNTER });
  expect(wave.spawns).toEqual([{ archetypeId: 'monsters/act1.the-countess', encounterId: ENCOUNTER,
    tier: 'boss', level: 13, index: 0 }]);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  expect(useMapStore.getState().questReceipts[PROOF]).toBeUndefined();
  return run;
}
function thrownBySettlement(): unknown {
  let thrown: unknown;
  try { advanceWaveOrFinish(); } catch (error) { thrown = error; }
  expect(thrown).toBeDefined();
  return thrown;
}
function failedReceiptIsClosed(error: unknown) {
  expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress)
    .toMatchObject({ phase: 'settlementFailed', failure: { error } });
  const before = snapshot(), holder = inspectRecordedWaves();
  expect(advanceWaveOrFinish).toThrow('settlementFailed');
  expect(snapshot()).toEqual(before);
  expect(inspectRecordedWaves()).toBe(holder);
  expect(assertWaveSnapshotAllowed).not.toThrow();
}
function expectOwnedLocks() {
  let result: ReturnType<typeof claimQuestReward> | undefined, failure: unknown;
  try { result = claimQuestReward(QUEST); } catch (error) { failure = error; }
  if (failure === undefined) expect(result).toBe('claim-in-progress');
  else { expect(failure).toBeInstanceOf(WaveGuardError); expect(failure).toMatchObject({ code: 'questBusy' }); }
  expect(advanceWaveOrFinish).toThrow('waveBusy');
  expect(assertWaveSnapshotAllowed).toThrow('waveBusy');
  expect(exportCurrentSave).toThrow();
}
function errorTree(root: unknown): unknown[] {
  const seen = new Set<unknown>();
  const visit = (value: unknown) => {
    if (seen.has(value)) return;
    seen.add(value);
    if (value instanceof AggregateError) for (const child of value.errors) visit(child);
    if (value instanceof Error && Object.hasOwn(value, 'cause')) visit(value.cause);
  };
  visit(root);
  return [...seen];
}
function prepareKnownOrdinaryBag() {
  // Only the ordinary roll is controlled; XP, granting and Countess settlement remain native.
  vi.spyOn(award, 'rollKillRewards').mockReturnValue({ items: [{ id: NATIVE_ITEM,
    baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, socketCapacity: 0,
    identified: true, equipped: false }], runeShards: 0, wishstones: 0, runes: 1, gems: 0,
    materials: { 'runes/el': 1 } });
}
function normalItem(id: string, baseId: string): Item {
  return { id, baseId, rarity: 'normal', level: 1, socketCapacity: 0, identified: true, equipped: false };
}
function occupiedSlots(equipment: Readonly<Record<string, Item | null | undefined>>) {
  // Both absent and null represent an empty native slot; neither can retain the granted item.
  return Object.fromEntries(Object.entries(equipment).filter(([, item]) => item != null));
}
function occupiedMercSlots(equipment: ReturnType<typeof useMercStore.getState>['mercEquipment'], ids: readonly string[]) {
  return Object.fromEntries(ids.map(id => [id, occupiedSlots(equipment[id] ?? {})]));
}
function nativeLocations() {
  const inventory = useInventoryStore.getState(), merc = useMercStore.getState();
  const result: string[] = [];
  inventory.backpack.forEach(item => { if (item.id === NATIVE_ITEM) result.push('backpack'); });
  inventory.stash.forEach(item => { if (item.id === NATIVE_ITEM) result.push('stash'); });
  for (const [slot, item] of Object.entries(inventory.equipped)) {
    if (item?.id === NATIVE_ITEM) result.push(`player:${slot}`);
  }
  for (const [id, equipment] of Object.entries(merc.mercEquipment)) {
    for (const [slot, item] of Object.entries(equipment)) {
      if (item?.id === NATIVE_ITEM) result.push(`merc:${id}:${slot}`);
    }
  }
  // Also exclude accidental retention in legacy actor arrays, although native gear uses the stores above.
  usePlayerStore.getState().player?.equipment.forEach(item => {
    if (item.id === NATIVE_ITEM) result.push('legacy-player');
  });
  merc.ownedMercs.forEach(actor => {
    actor.equipment.forEach(item => {
      if (item.id === NATIVE_ITEM) result.push(`legacy-merc:${actor.id}`);
    });
  });
  return result;
}

beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Countess gear transaction fixture', 'sorceress'), comboOrder: [] });
  const gear: Item = { id: 'countess-transaction-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'constructed-power', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(gear);
  expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  const quest = required(loadQuests().find(row => row.id === QUEST));
  useMapStore.setState({ currentAct: 1, currentSubAreaId: AREA, clearedSubAreas: [] });
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'inProgress', rewardClaimed: false,
    objectives: Object.fromEntries(quest.objectives.map(row => [row.id, false])) });
});
afterEach(() => {
  for (const stop of stops.splice(0).reverse()) stop();
  vi.restoreAllMocks(); reset();
});

describe('Countess native granted gear ownership rollback', () => {
  it('removes a native gear output renamed in place by a throwing inventory observer', () => {
    ready(); prepareKnownOrdinaryBag();
    const before = snapshot(), cause = new Error('Countess inventory observer renamed its native output');
    let fired = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (fired) return;
      const output = state.backpack.find(item => item.id === NATIVE_ITEM);
      if (!output) return;
      fired = true; expectOwnedLocks();
      Object.assign(output, { id: 'countess-renamed-native-item' });
      throw cause;
    }));
    const error = thrownBySettlement();
    expect(fired).toBe(true); expect(errorTree(error)).toContain(cause);
    expect(useInventoryStore.getState().backpack.some(item => item.id === 'countess-renamed-native-item')).toBe(false);
    expect(snapshot()).toEqual(before);
    failedReceiptIsClosed(error);
  });
  it.each(['stash', 'player-head', 'owned-merc-head'] as const)(
    'removes the exact native grant after a proof observer moves it into %s and throws', destination => {
      const recipientId = addMerc('mercs/act1-rogue-inner-sight');
      const destinationMercId = addMerc('mercs/act1-rogue-fire');
      const unrelatedMercId = addMerc('mercs/act1-rogue-cold');
      useMercStore.getState().setFieldedMerc(recipientId);
      const stashItem = normalItem('countess-retained-stash-cap', 'items/base/helm-cap');
      const chestItem = normalItem('countess-retained-player-chest', 'items/base/armor-quilted');
      const bootsItem = normalItem('countess-retained-other-merc-boots', 'items/base/boots');
      const unrelatedIds = new Set([stashItem.id, chestItem.id, bootsItem.id]);
      for (const item of [stashItem, chestItem, bootsItem]) useInventoryStore.getState().addItem(item);
      ready();
      // The recording has already won. Free a valid head slot through the native action
      // so observer movement need not overwrite or invent any previously owned gear.
      expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
      expect(useInventoryStore.getState().equipped.head).toBeNull();
      prepareKnownOrdinaryBag();
      expect(nativeLocations()).toEqual([]);
      const before = snapshot();
      const inventoryBefore = structuredClone({ backpack: useInventoryStore.getState().backpack,
        stash: useInventoryStore.getState().stash, equipped: useInventoryStore.getState().equipped });
      const mercEquipmentBefore = structuredClone(useMercStore.getState().mercEquipment);
      const mercIds = useMercStore.getState().ownedMercs.map(merc => merc.id);
      const retainedChest: Item = { ...chestItem, equipped: true };
      const retainedBoots: Item = { ...bootsItem, equipped: true, equipSlot: 'boots' };
      const cause = new Error(`Countess proof observer moved native cap to ${destination}`);
      let fired = false, moved = false;
      stops.push(useMapStore.subscribe(state => {
        if (fired || state.questReceipts[PROOF] !== true) return;
        fired = true;
        expectOwnedLocks();
        expect(nativeLocations()).toEqual(['backpack']);
        const granted = required(useInventoryStore.getState().backpack.find(item => item.id === NATIVE_ITEM));
        expect(granted.baseId).toBe('items/base/helm-cap');
        // Raw setters model a synchronous ownership observer, using ordinary native
        // container/slot values and preowned unrelated items, never an imported save.
        useInventoryStore.setState(current => ({
          backpack: current.backpack.filter(item => item.id !== NATIVE_ITEM && !unrelatedIds.has(item.id)),
          stash: [...current.stash, stashItem, ...(destination === 'stash' ? [granted] : [])],
          equipped: { ...current.equipped, chest: retainedChest,
            ...(destination === 'player-head' ? { head: { ...granted, equipped: true } } : {}) }
        }));
        useMercStore.setState(current => ({ mercEquipment: { ...current.mercEquipment,
          [unrelatedMercId]: { ...current.mercEquipment[unrelatedMercId], boots: retainedBoots },
          ...(destination === 'owned-merc-head' ? { [destinationMercId]: {
            ...current.mercEquipment[destinationMercId], head: { ...granted, equipped: true, equipSlot: 'head' as const }
          } } : {})
        } }));
        const expectedLocation = destination === 'stash' ? 'stash' : destination === 'player-head'
          ? 'player:head' : `merc:${destinationMercId}:head`;
        expect(nativeLocations()).toEqual([expectedLocation]);
        expect(useInventoryStore.getState().stash).toContainEqual(stashItem);
        expect(useInventoryStore.getState().equipped.chest).toEqual(retainedChest);
        expect(useMercStore.getState().mercEquipment[unrelatedMercId]?.boots).toEqual(retainedBoots);
        moved = true;
        expectOwnedLocks();
        throw cause;
      }));
      const error = thrownBySettlement();
      expect(fired).toBe(true); expect(moved).toBe(true);
      expect(errorTree(error)).toContain(cause);
      expect(nativeLocations()).toEqual([]);
      // All native payout/source participants return to their pre-income values.
      // Only the observer's unrelated ownership transfers remain; empty slot spelling
      // is normalized because native maps permit both null and absent empty slots.
      Object.assign(before.inventory, {
        backpack: inventoryBefore.backpack.filter(item => !unrelatedIds.has(item.id)),
        stash: [...inventoryBefore.stash, stashItem],
        equipped: occupiedSlots({ ...inventoryBefore.equipped, chest: retainedChest })
      });
      Object.assign(before.merc, { mercEquipment: occupiedMercSlots({ ...mercEquipmentBefore,
        [unrelatedMercId]: { ...mercEquipmentBefore[unrelatedMercId], boots: retainedBoots }
      }, mercIds) });
      const after = snapshot();
      Object.assign(after.inventory, { equipped: occupiedSlots(useInventoryStore.getState().equipped) });
      Object.assign(after.merc, { mercEquipment: occupiedMercSlots(useMercStore.getState().mercEquipment, mercIds) });
      expect(after).toEqual(before);
      expect(useMapStore.getState().questReceipts[PROOF]).toBeUndefined();
      failedReceiptIsClosed(error);
    }
  );
});
