/**
 * Constructed Countess settlement regressions.
 * Valid native fixtures enter/play back first; faults are synchronous publication observers,
 * never imported malformed saves. No earned gameplay or historical replay is claimed.
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
const OBJECTIVE = 'obj-kill-countess';
const AREA = 'areas/act1-dark-wood';
const ENCOUNTER = 'act1-dw-countess';
const PROOF = `${QUEST}#action:countess-victory`;
const UNRELATED_QUEST = 'quests/act1-den-of-evil';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore,
  useMercStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Countess transaction fixture');
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
  // Exercise the explicit selected quest encounter at the runtime boundary.
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
  // Both supported quest exclusion surfaces are safe; do not require a wrapper implementation.
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
  // Control the native loot generator only: real engine, XP, grant, source and rollback remain active.
  // A nonempty owned bag makes restoration observable without requiring no-op setter calls.
  vi.spyOn(award, 'rollKillRewards').mockReturnValue({ items: [{ id: 'countess-native-bag-cap',
    baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, socketCapacity: 0,
    identified: true, equipped: false }], runeShards: 0, wishstones: 0, runes: 1, gems: 0,
    materials: { 'runes/el': 1 } });
}

beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Countess transaction fixture', 'sorceress'), comboOrder: [] });
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

describe('Countess native settlement transaction observers', () => {
  it.each(['row-in-place', 'location', 'difficulty'] as const)(
    'restores deep pre-income participants when an XP observer silently changes %s', fault => {
      ready();
      const before = snapshot(), originalRow = required(useMapStore.getState().questProgress[QUEST]);
      let fired = false;
      stops.push(usePlayerStore.subscribe(() => {
        if (fired) return; fired = true;
        if (fault === 'row-in-place') Object.assign(originalRow.objectives, { [OBJECTIVE]: true });
        else if (fault === 'location') useMapStore.setState({ currentAct: 2, currentSubAreaId: 'areas/act2-dry-hills' });
        else useMapStore.setState({ selectedDifficulty: 'nightmare' });
      }));
      const error = thrownBySettlement();
      expect(fired).toBe(true);
      expect(snapshot()).toEqual(before);
      failedReceiptIsClosed(error);
    }
  );

  it.each(['lost', 'corrupt'] as const)('rejects a proof silently %s after its actual map publication', fault => {
    ready(); const before = snapshot(); let fired = false;
    stops.push(useMapStore.subscribe(state => {
      if (fired || state.questReceipts[PROOF] !== true) return;
      fired = true;
      if (fault === 'lost') Reflect.deleteProperty(state.questReceipts, PROOF);
      else Object.assign(state.questReceipts, { [PROOF]: false });
    }));
    const error = thrownBySettlement();
    expect(fired).toBe(true);
    expect(snapshot()).toEqual(before);
    failedReceiptIsClosed(error);
  });

  it('reverts native payout and source while retaining unrelated map, stash and merc observer writes', () => {
    const recipientId = addMerc('mercs/act1-rogue-inner-sight');
    const otherId = addMerc('mercs/act1-rogue-fire');
    useMercStore.getState().setFieldedMerc(recipientId);
    ready();
    prepareKnownOrdinaryBag();
    const before = snapshot(), map = useMapStore.getState(), merc = useMercStore.getState();
    const unrelated = required(loadQuests().find(row => row.id === UNRELATED_QUEST));
    const unrelatedRow = { id: UNRELATED_QUEST, status: 'inProgress' as const, rewardClaimed: false,
      objectives: Object.fromEntries(unrelated.objectives.map(row => [row.id, false])) };
    const stashItem: Item = { id: 'countess-observer-stash-cap', baseId: 'items/base/helm-cap', rarity: 'normal',
      level: 1, socketCapacity: 0, identified: true, equipped: false };
    const otherProgress = { ...merc.getMercProgress(otherId), experience: merc.getMercProgress(otherId).experience + 1 };
    const ownedMercs = structuredClone(merc.ownedMercs).map(row => row.id === otherId
      ? { ...row, name: 'Observer retained merc' } : row);
    const mercProgress = { ...structuredClone(merc.mercProgress), [otherId]: otherProgress };
    const discoveredAreas = [...map.discoveredAreas, 'areas/act1-blood-moor'];
    const questProgress = { ...structuredClone(map.questProgress), [UNRELATED_QUEST]: unrelatedRow };
    const cause = new Error('Countess source observer after unrelated writes'); let fired = false;
    stops.push(useMapStore.subscribe(state => {
      if (fired || state.questReceipts[PROOF] !== true) return;
      fired = true;
      useMapStore.setState(current => ({ discoveredAreas,
        questProgress: { ...current.questProgress, [UNRELATED_QUEST]: unrelatedRow } }));
      useInventoryStore.setState(current => ({ stash: [...current.stash, stashItem] }));
      useMercStore.setState(current => ({
        ownedMercs: current.ownedMercs.map(row => row.id === otherId ? { ...row, name: 'Observer retained merc' } : row),
        mercProgress: { ...current.mercProgress, [otherId]: otherProgress }
      }));
      throw cause;
    }));
    const error = thrownBySettlement();
    expect(fired).toBe(true); expect(errorTree(error)).toContain(cause);
    Object.assign(before.map, { discoveredAreas, questProgress });
    Object.assign(before.inventory, { stash: [stashItem] });
    Object.assign(before.merc, { ownedMercs, mercProgress });
    expect(snapshot()).toEqual(before);
    failedReceiptIsClosed(error);
  });

  it('attempts every participant restoration and aggregates observer failures while retaining both locks', () => {
    const recipientId = addMerc('mercs/act1-rogue-inner-sight');
    useMercStore.getState().setFieldedMerc(recipientId);
    ready(); const before = snapshot();
    prepareKnownOrdinaryBag();
    const cause = new Error('Countess publication observer');
    const failures = { player: new Error('player restoration observer'), merc: new Error('merc restoration observer'),
      inventory: new Error('inventory restoration observer'), combat: new Error('combat restoration observer'),
      map: new Error('map restoration observer') };
    const calls = { player: 0, merc: 0, inventory: 0, combat: 0, map: 0 };
    let restoring = false;
    stops.push(usePlayerStore.subscribe(() => {
      if (!restoring) return; calls.player++; expectOwnedLocks(); throw failures.player;
    }));
    stops.push(useMercStore.subscribe(() => {
      if (!restoring) return; calls.merc++; expectOwnedLocks(); throw failures.merc;
    }));
    stops.push(useInventoryStore.subscribe(() => {
      if (!restoring) return; calls.inventory++; expectOwnedLocks(); throw failures.inventory;
    }));
    stops.push(useCombatStore.subscribe(() => {
      if (!restoring) return; calls.combat++; expectOwnedLocks(); throw failures.combat;
    }));
    stops.push(useMapStore.subscribe(state => {
      if (!restoring) {
        if (state.questReceipts[PROOF] !== true) return;
        restoring = true; expectOwnedLocks(); throw cause;
      }
      calls.map++; expectOwnedLocks(); throw failures.map;
    }));
    const error = thrownBySettlement();
    expect(restoring).toBe(true); expect(error).toBeInstanceOf(AggregateError);
    const causes = errorTree(error); expect(causes).toContain(cause);
    for (const domain of ['player', 'merc', 'inventory', 'combat', 'map'] as const) {
      expect(calls[domain]).toBeGreaterThan(0); expect(causes).toContain(failures[domain]);
    }
    expect(snapshot()).toEqual(before);
    failedReceiptIsClosed(error);
  });

  it('verifies restoration after all callbacks and aggregates a silently reintroduced proof', () => {
    ready(); const cause = new Error('Countess source publication failed');
    let restoring = false, sabotaged = 0;
    stops.push(useMapStore.subscribe(state => {
      if (!restoring) {
        if (state.questReceipts[PROOF] !== true) return;
        restoring = true; throw cause;
      }
      if (Object.hasOwn(state.questReceipts, PROOF)) return;
      sabotaged++; expectOwnedLocks();
      // The restore setter completed; this observer returns normally after corrupting it.
      Object.assign(state.questReceipts, { [PROOF]: true });
    }));
    const error = thrownBySettlement();
    expect(restoring).toBe(true); expect(sabotaged).toBeGreaterThan(0);
    expect(error).toBeInstanceOf(AggregateError);
    expect(errorTree(error)).toContain(cause);
    if (!(error instanceof AggregateError)) throw new Error('Missing explicit restoration failure');
    expect(error.errors.length).toBeGreaterThan(0);
    expect(useMapStore.getState().questReceipts[PROOF]).toBe(true);
    expect(useMapStore.getState().questProgress[QUEST]?.objectives[OBJECTIVE]).toBe(false);
    failedReceiptIsClosed(error);
  });

  it('settles a native success exactly once and leaves every store unchanged on duplicate advancement', () => {
    ready(); expect(advanceWaveOrFinish()).toBe('victory');
    expect(useMapStore.getState().questReceipts[PROOF]).toBe(true);
    expect(useMapStore.getState().questProgress[QUEST]).toMatchObject({ status: 'completed', rewardClaimed: false,
      objectives: { [OBJECTIVE]: true } });
    expect(useMapStore.getState().clearedSubAreas).toEqual([]);
    const paid = snapshot(), holder = inspectRecordedWaves();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(snapshot()).toEqual(paid); expect(inspectRecordedWaves()).toBe(holder);
  });
});
