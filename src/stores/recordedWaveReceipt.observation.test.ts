/** Synthetic receipt protocol fixtures; not native or earned combat acceptance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { synthDefaultPlan } from '@/engine/combat';
import { createSimpleEnemy, playerToCombatUnit } from './combatHelpers';
import { useCombatStore } from './combatStore';
import type { ActiveRun } from './combatRunLifecycle';
import { stageRecordedBattle } from './recordedBattlePublication';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore,
  assertWaveSnapshotAllowed, WaveGuardError, type WaveTransitionLease } from './waveTransitionGuard';
import { inspectRecordedWaves, subscribeRecordedWaves, abandonRecordedWaves,
  prepareRecordedWave, prepareRecordedWaveInstallation, commitPreparedRecordedWave,
  cancelPreparedRecordedWave, recognizeRecordedWavePublication, clearRecordedWavesAfterRestore,
  markRecordedWaveMetadataInstalled, beginRecordedWaveSettlement, finishRecordedWaveSettlement,
  failRecordedWaveSettlement, type RecordedWaveBinding, type RecordedWaveLive } from './recordedWaveReceipt';

function fixture() {
  const hero = playerToCombatUnit({ ...createMockPlayer('Receipt observer', 'necromancer'), id: 'observer-hero' });
  const enemy = createSimpleEnemy(1);
  const plan = synthDefaultPlan({ id: 'observer-area', lootTable: 'loot/trash-act1', areaLevel: 1 }, 'monsters/act1.fallen', 1, 7);
  const candidateRun: ActiveRun = { plan, act: 1, seed: 7, mode: 'manual', playerUnit: hero,
    waveIdx: 0, carryPlayerTeam: [hero], waveElapsedMs: 0 };
  const events = [{ kind: 'end' as const, winner: 'player' as const, simClockMs: 1200, uiDelayMs: 0 }];
  const outcome = { winner: 'player' as const, finalPlayerTeam: [hero], finalEnemyTeam: [enemy] };
  const recording = { events, outcome };
  const publication = stageRecordedBattle({ initialPlayerTeam: [hero], initialEnemyTeam: [enemy],
    events, outcome, unitNameMap: new Map(), currentWave: 1, totalWaves: plan.waves.length,
    subAreaRunId: plan.subAreaId, resetRunRewards: true }, useCombatStore.getState());
  const ownership = { backpack: [], stash: [], equipped: {}, mercEquipment: {} };
  const binding: RecordedWaveBinding = { candidateRun, expectedActiveRun: null, heroId: hero.id,
    targetWaveIdx: 0, waveElapsedMs: 1200, selection: null, ownership, debitIntent: null,
    engineInput: { seed: 7, playerTeam: [hero], enemyTeam: [enemy] }, attestation: null, recording, publication };
  const live: RecordedWaveLive = { activeRun: null, heroId: hero.id, selection: null, ownership };
  return { binding, live };
}
function installed(binding: RecordedWaveBinding) {
  binding.candidateRun.recording = binding.recording;
  binding.candidateRun.waveElapsedMs = binding.waveElapsedMs;
  return { activeRun: binding.candidateRun, heroId: binding.heroId, combat: binding.publication };
}
let lease: WaveTransitionLease | null = null;
let stops: (() => void)[] = [];
function acquire() { lease = beginWaveTransition(true); return lease; }
function release() { if (lease) endWaveTransition(lease); lease = null; }
function listen(callback: () => void) { const stop = subscribeRecordedWaves(callback); stops.push(stop); return stop; }
const flush = async () => { await Promise.resolve(); };
beforeEach(async () => { abandonRecordedWaves(); await flush(); });
afterEach(async () => {
  for (const stop of stops) stop(); stops = [];
  release(); abandonRecordedWaves(); await flush(); vi.restoreAllMocks();
});

describe('recorded-wave immutable external-store observation', () => {
  it('keeps snapshot identity stable until replacement and does not notify on subscribe', async () => {
    const before = inspectRecordedWaves(), callback = vi.fn(); listen(callback);
    expect(inspectRecordedWaves()).toBe(before); expect(Object.isFrozen(before)).toBe(true);
    await flush(); expect(callback).not.toHaveBeenCalled();
    const { binding } = fixture(); prepareRecordedWave(binding, acquire());
    expect(inspectRecordedWaves()).not.toBe(before);
    expect(inspectRecordedWaves()).toBe(inspectRecordedWaves());
    expect(callback).not.toHaveBeenCalled(); release(); await flush();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('coalesces synchronous changes and delivers the latest snapshot after ownership release', async () => {
    const { binding, live } = fixture(); const snapshots: unknown[] = [];
    listen(() => { assertWaveSnapshotAllowed(); snapshots.push(inspectRecordedWaves()); });
    const owner = acquire(); const receipt = prepareRecordedWave(binding, owner);
    commitPreparedRecordedWave(receipt, owner, live);
    recognizeRecordedWavePublication(receipt, owner, installed(binding));
    const latest = inspectRecordedWaves(); release(); await flush();
    expect(snapshots).toEqual([latest]); expect(latest.currentPublished?.phase).toBe('published');
  });

  it('notifies final promotion without a later domain-store notification', async () => {
    const { binding, live } = fixture(), owner = acquire();
    const receipt = prepareRecordedWave(binding, owner); commitPreparedRecordedWave(receipt, owner, live);
    release(); await flush();
    const callback = vi.fn(); listen(callback); const nextOwner = acquire();
    recognizeRecordedWavePublication(receipt, nextOwner, installed(binding));
    release(); await flush();
    expect(callback).toHaveBeenCalledTimes(1); expect(inspectRecordedWaves().pending).toBeNull();
    expect(inspectRecordedWaves().currentPublished?.receipt).toBe(receipt);
  });

  it('notifies unpaid cancellation without a later domain-store notification', async () => {
    const { binding, live } = fixture(), owner = acquire();
    const receipt = prepareRecordedWave(binding, owner); release(); await flush();
    const callback = vi.fn(); listen(callback); const nextOwner = acquire();
    cancelPreparedRecordedWave(receipt, nextOwner, live.ownership); release(); await flush();
    expect(callback).toHaveBeenCalledTimes(1); expect(inspectRecordedWaves().pending).toBeNull();
  });

  it('notifies abandonment and successful restore clearing', async () => {
    const { binding } = fixture(); prepareRecordedWave(binding, acquire()); release(); await flush();
    const callback = vi.fn(); listen(callback); abandonRecordedWaves(); await flush();
    expect(callback).toHaveBeenCalledTimes(1); expect(inspectRecordedWaves().pending).toBeNull();
    prepareRecordedWave(binding, acquire()); release(); await flush(); callback.mockClear();
    const restore = reserveWaveRestore();
    try {
      clearRecordedWavesAfterRestore(restore); await flush();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(() => { assertWaveSnapshotAllowed(); }).toThrow(new WaveGuardError('restorePending'));
      expect(inspectRecordedWaves()).toEqual({ pending: null, currentPublished: null });
    } finally { releaseWaveRestore(restore); }
  });

  it.each(['finish', 'fail'] as const)('notifies installation and settlement %s progress', async action => {
    const { binding, live } = fixture(), owner = acquire();
    const receipt = prepareRecordedWaveInstallation(binding, { kind: 'newRun', nextDefaultChallengeOrdinal: null }, owner);
    commitPreparedRecordedWave(receipt, owner, live); release(); await flush();
    const callback = vi.fn(); listen(callback); const installOwner = acquire();
    markRecordedWaveMetadataInstalled(receipt, installOwner); release(); await flush();
    expect(callback).toHaveBeenCalledTimes(1); callback.mockClear();
    const promotionOwner = acquire(); recognizeRecordedWavePublication(receipt, promotionOwner, installed(binding)); release(); await flush();
    expect(callback).toHaveBeenCalledTimes(1); callback.mockClear();
    const settleOwner = acquire();
    expect(beginRecordedWaveSettlement(receipt, settleOwner, { activeRun: binding.candidateRun,
      heroId: binding.heroId, combat: { ...binding.publication, playbackComplete: true } })).toBe(true);
    release(); await flush(); expect(callback).toHaveBeenCalledTimes(1); callback.mockClear();
    const finishOwner = acquire();
    if (action === 'finish') finishRecordedWaveSettlement(receipt, finishOwner, { kind: 'terminal', result: 'victory' });
    else failRecordedWaveSettlement(receipt, finishOwner, { error: new Error('settlement') });
    release(); await flush(); expect(callback).toHaveBeenCalledTimes(1);
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase)
      .toBe(action === 'finish' ? 'settled' : 'settlementFailed');
  });

  it('respects unsubscribe before delivery and keeps duplicate callback registrations independent', async () => {
    const callback = vi.fn(), one = listen(callback), two = listen(callback);
    abandonRecordedWaves(); one(); await flush(); expect(callback).toHaveBeenCalledTimes(1);
    two(); abandonRecordedWaves(); await flush(); expect(callback).toHaveBeenCalledTimes(1);
  });

  it('uses registration tokens when a listener unsubscribes and resubscribes another during delivery', async () => {
    const calls: string[] = []; let once = true; let stopOther = () => { /* Assigned below. */ };
    const other = () => { calls.push('other'); };
    listen(() => {
      calls.push('first');
      if (once) { once = false; stopOther(); listen(other); }
    });
    stopOther = listen(other);
    abandonRecordedWaves(); await flush(); expect(calls).toEqual(['first']);
    abandonRecordedWaves(); await flush(); expect(calls).toEqual(['first', 'first', 'other']);
  });

  it('schedules nested holder changes for another notification and reports errors without skipping peers', async () => {
    const error = new Error('observer failure'), reported = vi.spyOn(console, 'error').mockImplementation(() => { /* Capture reporting. */ });
    let once = true; const snapshots: unknown[] = [];
    listen(() => { if (once) { once = false; abandonRecordedWaves(); throw error; } });
    listen(() => { snapshots.push(inspectRecordedWaves()); });
    abandonRecordedWaves(); const initial = inspectRecordedWaves(); await flush(); await flush();
    expect(reported).toHaveBeenCalledTimes(1);
    expect(reported).toHaveBeenCalledWith('Recorded wave observer failed', error);
    expect(snapshots).toHaveLength(2); expect(snapshots[0]).not.toBe(initial);
    expect(snapshots[0]).toBe(snapshots[1]); expect(snapshots[1]).toBe(inspectRecordedWaves());
  });

  it('does not replace the original transition exception with a subscriber exception', async () => {
    const transitionError = new Error('transition'), observerError = new Error('observer');
    vi.spyOn(console, 'error').mockImplementation(() => { /* Capture reporting. */ });
    listen(() => { throw observerError; });
    const { binding } = fixture();
    expect(() => { const owner = acquire(); try { prepareRecordedWave(binding, owner); throw transitionError; } finally { release(); } }).toThrow(transitionError);
    await flush(); expect(inspectRecordedWaves().pending?.phase).toBe('prepared');
    expect(console.error).toHaveBeenCalledWith('Recorded wave observer failed', observerError);
  });
});
