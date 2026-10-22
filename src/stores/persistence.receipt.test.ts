/** Real persistence/receipts; synthetic receipt fixtures and fake Dexie IO only. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveRecord } from './save-adapter';
const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined } = { record: undefined };
  return { state, get: vi.fn(() => Promise.resolve(state.record)),
    put: vi.fn((record: SaveRecord) => { state.record = structuredClone(record); return Promise.resolve(); }),
    delete: vi.fn(() => { state.record = undefined; return Promise.resolve(); }) };
});
vi.mock('dexie', () => ({ default: class {
  version() { return { stores: () => Object.assign(this,
    { saves: { get: disk.get, put: disk.put, delete: disk.delete } }) }; }
} }));

import type { Item } from '@/engine/types/items';
import type { SaveCurrent } from '@/engine/types/save';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { synthDefaultPlan } from '@/engine/combat';
import { createSimpleEnemy, playerToCombatUnit } from './combatHelpers';
import type { ActiveRun } from './combatRunLifecycle';
import { stageRecordedBattle } from './recordedBattlePublication';
import { prepareRecordedWave, commitPreparedRecordedWave, inspectRecordedWaves, abandonRecordedWaves,
  type RecordedWaveBinding } from './recordedWaveReceipt';
import { beginWaveTransition, endWaveTransition, assertWaveSnapshotAllowed } from './waveTransitionGuard';
import { RecordedWaveAccessError } from './recordedWaveAccess';
import { captureIronGolemDebit } from './ironGolemDebit';
import { armIronGolemSelection, clearIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { __resetPersistenceForTests, snapshotStores, exportCurrentSave, flushSave,
  importIntoStores, deleteCurrentSave, hydrateFromSave, initPersistence,
  isReplacingSave, startAutoSave, stopAutoSave, useSaveStatusStore, useHydrationStore } from './persistence';

const domains = [usePlayerStore, useInventoryStore, useMercStore, useMapStore,
  useMetaStore, useFormationStore] as const;
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing persistence receipt fixture');
  return value;
}
function deferred<T>() {
  let resolve: ((value: T) => void) | undefined;
  let reject: ((error: Error) => void) | undefined;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve: (value: T) => { required(resolve)(value); },
    reject: (error: Error) => { required(reject)(error); } };
}
const item = (id: string): Item => ({ id, baseId: 'items/base/wp1h-short-sword', rarity: 'normal',
  level: 1, identified: true, equipped: false });
beforeEach(() => {
  __resetPersistenceForTests(); abandonRecordedWaves(); clearIronGolemSelection();
  for (const store of domains) store.getState().reset();
  vi.useFakeTimers(); vi.setSystemTime(1_792_627_200_000);
  disk.state.record = undefined;
  disk.get.mockReset().mockImplementation(() => Promise.resolve(disk.state.record));
  disk.put.mockReset().mockImplementation(record => {
    disk.state.record = structuredClone(record); return Promise.resolve();
  });
  disk.delete.mockReset().mockImplementation(() => { disk.state.record = undefined; return Promise.resolve(); });
  usePlayerStore.getState().setPlayer(createMockPlayer('Receipt save', 'necromancer'));
  useInventoryStore.setState({ backpack: [item('selected'), item('kept')] });
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  stopAutoSave(); abandonRecordedWaves(); clearIronGolemSelection();
  __resetPersistenceForTests(); vi.useRealTimers(); vi.restoreAllMocks();
});
type Phase = 'prepared' | 'committedPendingPublication' | 'conflict';
function receiptFixture(phase: Phase, paid = false) {
  const hero = playerToCombatUnit(required(usePlayerStore.getState().player));
  const enemy = createSimpleEnemy(1);
  const selection = armIronGolemSelection(hero.id, 'selected', true);
  const inv = useInventoryStore.getState();
  const ownership = { backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped,
    mercEquipment: useMercStore.getState().mercEquipment };
  const captured = paid ? captureIronGolemDebit(hero.id, selection, ownership) : null;
  if (captured && !captured.ok) throw new Error(captured.reason);
  const intent = captured?.intent ?? null;
  const plan = synthDefaultPlan({ id: 'receipt-save', lootTable: 'loot/trash-act1', areaLevel: 1 },
    'monsters/act1.fallen', 1, 7);
  const run: ActiveRun = { plan, act: 1, seed: 7, mode: 'manual', playerUnit: hero,
    waveIdx: 0, carryPlayerTeam: [hero], waveElapsedMs: 0 };
  const events = [{ kind: 'end' as const, winner: 'player' as const, simClockMs: 1200, uiDelayMs: 0 }];
  const outcome = { winner: 'player' as const, finalPlayerTeam: [hero], finalEnemyTeam: [enemy] };
  const publication = stageRecordedBattle({ initialPlayerTeam: [hero], initialEnemyTeam: [enemy],
    events, outcome, unitNameMap: new Map(), currentWave: 1,
    totalWaves: plan.waves.length, subAreaRunId: plan.subAreaId },
  { currentWave: 0, totalWaves: 0, subAreaRunId: null,
    runRewards: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0 } });
  const binding: RecordedWaveBinding = { candidateRun: run, expectedActiveRun: null,
    heroId: hero.id, targetWaveIdx: 0, waveElapsedMs: 1200, selection, ownership,
    debitIntent: intent, attestation: intent ? { sourceHeroId: hero.id, sourceItemId: intent.item.id,
      skillId: 'necromancer.iron_golem', spawnedUnitId: 'receipt-iron', paidMp: 35 } : null,
    engineInput: { seed: 7, playerTeam: [hero], enemyTeam: [enemy] },
    recording: { events, outcome }, publication };
  const lease = beginWaveTransition(true);
  try {
    const receipt = prepareRecordedWave(binding, lease);
    // Synthetic debit fixture: install the exact frozen array into the legacy
    // mutable store type. This is not the production payment writer.
    if (intent && phase === 'committedPendingPublication') {
      useInventoryStore.setState({ backpack: intent.expectedBackpack as Item[] });
    }
    if (phase !== 'prepared') commitPreparedRecordedWave(receipt, lease, { activeRun: null,
      heroId: hero.id, selection, ownership: { ...ownership,
        backpack: phase === 'conflict' ? [] : useInventoryStore.getState().backpack } });
    return receipt;
  } finally { endWaveTransition(lease); }
}

describe('receipt phase persistence boundaries', () => {
  const actions = ['snapshot', 'export', 'flush', 'import', 'delete', 'hydrate', 'init'] as const;
  it.each((['prepared', 'conflict'] as const).flatMap(phase => actions.map(action => ({ phase, action }))))(
    '$phase refuses $action before IO or live/status changes', async ({ phase, action }) => {
    const json = required(exportCurrentSave()); receiptFixture(phase);
    const before = domains.map(store => store.getState()); const holder = inspectRecordedWaves();
    const status = useSaveStatusStore.getState(); const hydration = useHydrationStore.getState();
    const operations: Record<typeof actions[number], () => unknown> = { snapshot: snapshotStores,
      export: exportCurrentSave, flush: flushSave, import: () => importIntoStores(json),
      delete: deleteCurrentSave, hydrate: hydrateFromSave, init: initPersistence };
    await expect(Promise.resolve().then(operations[action])).rejects.toBeInstanceOf(RecordedWaveAccessError);
    domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(useSaveStatusStore.getState()).toBe(status); expect(useHydrationStore.getState()).toBe(hydration);
    expect(isReplacingSave()).toBe(false); expect(inspectRecordedWaves()).toBe(holder);
    expect(disk.get).not.toHaveBeenCalled(); expect(disk.put).not.toHaveBeenCalled();
    expect(disk.delete).not.toHaveBeenCalled(); expect(assertWaveSnapshotAllowed).not.toThrow();
  });

  it.each(['prepared', 'conflict'] as const)('%s refuses without cancelling an existing save debounce', async phase => {
    const json = required(exportCurrentSave()); receiptFixture(phase); startAutoSave();
    useInventoryStore.getState().addCurrency('runeShards', 1);
    const timers = vi.getTimerCount(); const status = useSaveStatusStore.getState();
    await expect(flushSave()).rejects.toBeInstanceOf(RecordedWaveAccessError);
    await expect(importIntoStores(json)).rejects.toBeInstanceOf(RecordedWaveAccessError);
    await expect(deleteCurrentSave()).rejects.toBeInstanceOf(RecordedWaveAccessError);
    expect(hydrateFromSave).toThrow(RecordedWaveAccessError);
    expect(initPersistence).toThrow(RecordedWaveAccessError);
    expect(vi.getTimerCount()).toBe(timers); expect(useSaveStatusStore.getState()).toBe(status);
    abandonRecordedWaves();
    await vi.advanceTimersByTimeAsync(499); expect(disk.put).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1); expect(disk.put).toHaveBeenCalledTimes(1);
  });

  it.each(['prepared', 'conflict'] as const)('%s initialization refusal leaves a retryable uncached flight', async phase => {
    receiptFixture(phase); expect(initPersistence).toThrow(RecordedWaveAccessError);
    abandonRecordedWaves(); const accepted = initPersistence();
    expect(initPersistence()).toBe(accepted); await accepted;
    expect(disk.get).toHaveBeenCalledTimes(1); expect(useHydrationStore.getState().status).toBe('ready');
    expect(assertWaveSnapshotAllowed).not.toThrow();
  });

  it.each(['prepared', 'conflict'] as const)('%s preserves decode precedence and the exact receipt', async phase => {
    receiptFixture(phase); const holder = inspectRecordedWaves();
    await expect(importIntoStores('{')).rejects.toBeInstanceOf(SyntaxError);
    await expect(importIntoStores('{}')).rejects.toThrow();
    expect(inspectRecordedWaves()).toBe(holder); expect(disk.put).not.toHaveBeenCalled();
    expect(isReplacingSave()).toBe(false); expect(assertWaveSnapshotAllowed).not.toThrow();
  });

  it.each([false, true])('stable committed pending saves actual live data (synthetic paid=%s)', async paid => {
    receiptFixture('committedPendingPublication', paid);
    const holder = inspectRecordedWaves(); const before = domains.map(store => store.getState());
    const snapshot = required(snapshotStores()); const json = required(exportCurrentSave()); await flushSave();
    const ids = paid ? ['kept'] : ['selected', 'kept'];
    for (const save of [snapshot, JSON.parse(json) as SaveCurrent, required(disk.state.record).data as SaveCurrent]) {
      expect(save.version).toBe(11); expect(save.inventory.backpack.map(value => value.id)).toEqual(ids);
      expect(Object.keys(save).sort()).toEqual(['formation', 'inventory', 'map', 'mercs', 'meta', 'player', 'timestamp', 'version']);
    }
    expect(disk.put).toHaveBeenCalledTimes(1); expect(inspectRecordedWaves()).toBe(holder);
    domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(assertWaveSnapshotAllowed).not.toThrow();
  });

  it.each(['import', 'hydrate', 'delete', 'init'] as const)(
    'successful %s clears committed receipts before hero notifications under restore ownership', async action => {
      const source = required(snapshotStores()); const json = required(exportCurrentSave());
      receiptFixture('committedPendingPublication', true);
      disk.state.record = { id: 'current', version: source.version, timestamp: source.timestamp, data: source };
      let notifications = 0;
      const stop = usePlayerStore.subscribe(() => {
        notifications++;
        expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
        expect(assertWaveSnapshotAllowed).toThrow('restorePending');
      });
      try {
        if (action === 'import') await importIntoStores(json);
        else if (action === 'delete') await deleteCurrentSave();
        else if (action === 'hydrate') expect(await hydrateFromSave()).toBe(true);
        else await initPersistence();
      } finally { stop(); }
      expect(notifications).toBeGreaterThan(0);
      expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
      expect(useIronGolemSelectionStore.getState().selection).toBeNull();
      expect(isReplacingSave()).toBe(false); expect(assertWaveSnapshotAllowed).not.toThrow();
    });

  it.each(['import', 'hydrate', 'delete', 'init'] as const)(
    'failed %s IO releases ownership and preserves committed receipt, selection and actual paid inventory', async action => {
      const json = required(exportCurrentSave()); receiptFixture('committedPendingPublication', true);
      const holder = inspectRecordedWaves(); const before = domains.map(store => store.getState());
      const selection = useIronGolemSelectionStore.getState().selection;
      const error = new Error(`Synthetic ${action} IO`);
      if (action === 'import') {
        disk.put.mockRejectedValueOnce(error); await expect(importIntoStores(json)).rejects.toBe(error);
      } else if (action === 'delete') {
        disk.delete.mockRejectedValueOnce(error); await expect(deleteCurrentSave()).rejects.toBe(error);
      } else {
        disk.get.mockRejectedValueOnce(error);
        if (action === 'hydrate') expect(await hydrateFromSave()).toBe(false);
        else await initPersistence();
        expect(useHydrationStore.getState().status).toBe('error');
      }
      expect(useSaveStatusStore.getState().error).toBe(error.message);
      domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(inspectRecordedWaves()).toBe(holder);
      expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
      expect(useInventoryStore.getState().backpack.map(value => value.id)).toEqual(['kept']);
      expect(isReplacingSave()).toBe(false); expect(assertWaveSnapshotAllowed).not.toThrow();
    });

  it.each(['hydrate', 'init'] as const)('%s finding no save retains committed receipt and selection', async action => {
    receiptFixture('committedPendingPublication', true); const holder = inspectRecordedWaves();
    const selection = useIronGolemSelectionStore.getState().selection;
    if (action === 'hydrate') expect(await hydrateFromSave()).toBe(false);
    else await initPersistence();
    expect(inspectRecordedWaves()).toBe(holder);
    expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
    expect(useHydrationStore.getState().status).toBe('ready');
    expect(disk.put).not.toHaveBeenCalled(); expect(assertWaveSnapshotAllowed).not.toThrow();
  });

  it.each([false, true])('queued restores retain exact reservations after first failure=%s', async fails => {
    receiptFixture('committedPendingPublication', true); const holder = inspectRecordedWaves();
    const one = deferred<SaveRecord | undefined>(); const two = deferred<SaveRecord | undefined>();
    disk.get.mockImplementationOnce(() => one.promise).mockImplementationOnce(() => two.promise);
    const first = hydrateFromSave(); const second = hydrateFromSave();
    expect(snapshotStores).toThrow('restorePending');
    await vi.advanceTimersByTimeAsync(0); expect(disk.get).toHaveBeenCalledTimes(1);
    if (fails) one.reject(new Error('First queued read'));
    else one.resolve(undefined);
    expect(await first).toBe(false);
    await vi.advanceTimersByTimeAsync(0); expect(disk.get).toHaveBeenCalledTimes(2);
    expect(assertWaveSnapshotAllowed).toThrow('restorePending');
    expect(inspectRecordedWaves()).toBe(holder);
    two.resolve(undefined); expect(await second).toBe(false);
    expect(assertWaveSnapshotAllowed).not.toThrow(); expect(inspectRecordedWaves()).toBe(holder);
    const lease = beginWaveTransition(true); expect(endWaveTransition(lease)).toBe(false);
  });

  it.each(['prepared', 'conflict'] as const)('already accepted initialization keeps its cached flight in %s', async phase => {
    const accepted = initPersistence(); await accepted;
    receiptFixture(phase); const holder = inspectRecordedWaves();
    expect(initPersistence()).toBe(accepted); expect(disk.get).toHaveBeenCalledTimes(1);
    expect(inspectRecordedWaves()).toBe(holder); expect(useHydrationStore.getState().status).toBe('ready');
  });
});
