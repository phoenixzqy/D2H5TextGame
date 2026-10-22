/** Synthetic receipt phases around actual run staging, playback and completion. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as combatEngine from '@/engine/combat/combat';
import * as persistence from './persistence';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun, recoverRecordedWavePublication } from './combatHelpers';
import { combatRunLifecycle, type ActiveRun } from './combatRunLifecycle';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { armIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { getIdleEliteMisses, setIdleEliteMisses } from './idleElitePity';
import { stageRecordedBattle } from './recordedBattlePublication';
import { prepareRecordedWave, commitPreparedRecordedWave, recognizeRecordedWavePublication,
  inspectRecordedWaves, abandonRecordedWaves, prepareRecordedWaveInstallation,
  type RecordedWaveInstallIntent, RecordedWaveReceiptError } from './recordedWaveReceipt';
import { RecordedWaveAccessError } from './recordedWaveAccess';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore, WaveGuardError, deferWaveSaveIfBusy, assertWaveSnapshotAllowed } from './waveTransitionGuard';

const phases = ['prepared', 'committedPendingPublication', 'conflict'] as const;
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
  useMapStore, useFormationStore, useMetaStore, useIronGolemSelectionStore, useHydrationStore] as const;
const start = (options: Parameters<typeof startSubAreaRun>[0] = {}) =>
  startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7, ...options });
const actions = [{ name: 'start', action: () => start() }, { name: 'advance', action: advanceWaveOrFinish },
  { name: 'replay', action: () => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); } }] as const;

function receipt(run: ActiveRun, phase: typeof phases[number] | 'published', intent?: RecordedWaveInstallIntent, targetWaveIdx = run.waveIdx) {
  const combat = useCombatStore.getState(); const inv = useInventoryStore.getState();
  const recording = run.recording;
  if (!recording) throw new Error('Missing actual recording');
  const ownership = { backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped,
    mercEquipment: useMercStore.getState().mercEquipment };
  const selection = useIronGolemSelectionStore.getState().selection;
  const publication = stageRecordedBattle({ initialPlayerTeam: combat.playerTeam, initialEnemyTeam: combat.enemyTeam,
    events: recording.events, outcome: recording.outcome, unitNameMap: combat.unitNameMap,
    currentWave: targetWaveIdx + 1, totalWaves: run.plan.waves.length, subAreaRunId: run.plan.subAreaId }, combat);
  const lease = beginWaveTransition(true);
  try {
    const binding = { candidateRun: run, expectedActiveRun: combatRunLifecycle.activeRun,
      heroId: run.playerUnit.id, targetWaveIdx, waveElapsedMs: run.waveElapsedMs,
      selection, ownership, debitIntent: null, attestation: null,
      engineInput: { seed: run.seed, playerTeam: combat.playerTeam, enemyTeam: combat.enemyTeam },
      recording, publication };
    const token = intent ? prepareRecordedWaveInstallation(binding, intent, lease) : prepareRecordedWave(binding, lease);
    if (phase !== 'prepared') expect(commitPreparedRecordedWave(token, lease, {
      activeRun: combatRunLifecycle.activeRun, heroId: run.playerUnit.id, selection,
      ownership: phase === 'conflict' ? { ...ownership, backpack: [] } : ownership
    })).toBe(phase === 'published' ? 'committedPendingPublication' : phase);
    if (phase === 'published') {
      useCombatStore.getState().publishStagedRecordedBattle(publication);
      expect(recognizeRecordedWavePublication(token, lease, { activeRun: run,
        heroId: run.playerUnit.id, combat: useCombatStore.getState() })).toBe(true);
    }
    return { token, binding, publication };
  } finally { expect(endWaveTransition(lease)).toBe(false); }
}

function unchanged(action: () => unknown, expected: Error | null) {
  const before = stores.map(store => store.getState()); const holder = inspectRecordedWaves();
  const run = combatRunLifecycle.activeRun; const runData = structuredClone(run);
  const pity = getIdleEliteMisses(); const notified = vi.fn();
  const stops = stores.map(store => store.subscribe(notified));
  try {
    if (expected) {
      let caught: unknown;
      try { action(); } catch (error) { caught = error; }
      expect(caught).toBeInstanceOf(expected.constructor);
      expect(caught).toMatchObject({ message: expected.message });
      if ('code' in expected) expect(caught).toMatchObject({ code: expected.code });
    } else expect(action).not.toThrow();
    stores.forEach((store, i) => { expect(store.getState()).toBe(before[i]); });
    expect(inspectRecordedWaves()).toBe(holder);
    expect(combatRunLifecycle.activeRun).toBe(run); expect(run).toEqual(runData);
    expect(getIdleEliteMisses()).toBe(pity); expect(notified).not.toHaveBeenCalled();
  } finally { stops.forEach(stop => { stop(); }); }
}
function activeRun() {
  const run = combatRunLifecycle.activeRun;
  if (!run) throw new Error('Missing active run');
  return run;
}
function phaseError(phase: typeof phases[number]) {
  return new RecordedWaveAccessError(phase === 'prepared' ? 'preparedPending' :
    phase === 'conflict' ? 'conflict' : 'publicationPending');
}

beforeEach(() => {
  abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useMapStore, useFormationStore, useMetaStore]) store.getState().reset();
  loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  registerSkill({ id: 'fixture.receipt-finisher', archetype: 'fixture', target: 'all-enemies',
    cooldown: 1, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000] }] });
  const player = createMockPlayer('Receipt helper', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: ['fixture.receipt-finisher'] });
  armIronGolemSelection(player.id, 'receipt-helper-selection', true); setIdleEliteMisses(9);
});
afterEach(() => {
  abortSubAreaRun(); useHydrationStore.getState().setStatus('idle');
  setIdleEliteMisses(0); resetRegistry(); vi.restoreAllMocks();
});

describe.each(phases)('new transitions during %s', phase => {
  it.each((['absent', 'playing', 'complete'] as const).flatMap(context =>
    actions.map(action => ({ context, ...action }))))('refuses $name before the $context controls', ({ context, action }) => {
    start({ mode: 'idle', challengeOrdinal: 0 }); const run = activeRun();
    if (context === 'complete') {
      const length = useCombatStore.getState().recordedEvents.length;
      for (let i = 0; i < length; i++) useCombatStore.getState().advanceEvent();
      expect(useCombatStore.getState().playbackComplete).toBe(true);
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
    }
    if (context === 'absent') abortSubAreaRun();
    receipt(run, phase);
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const mercXp = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    const clear = vi.spyOn(useMapStore.getState(), 'markCleared');
    unchanged(action, phaseError(phase));
    expect(engine).not.toHaveBeenCalled(); expect(xp).not.toHaveBeenCalled();
    expect(mercXp).not.toHaveBeenCalled(); expect(clear).not.toHaveBeenCalled();
  });

  it.each(['idle', 'loading', 'error'] as const)('prioritizes phase over hydration %s', status => {
    start(); receipt(activeRun(), phase); useHydrationStore.getState().setStatus(status);
    for (const { action } of actions) unchanged(action, phaseError(phase));
  });

  it.each(['wave', 'restore'] as const)('prioritizes %s ownership over phase and hydration', owner => {
    start(); receipt(activeRun(), phase);
    const wave = owner === 'wave' ? beginWaveTransition(true) : undefined;
    const restore = owner === 'restore' ? reserveWaveRestore() : undefined;
    useHydrationStore.getState().setStatus('error');
    try {
      for (const { action } of actions) unchanged(action, new WaveGuardError(owner === 'wave' ? 'waveBusy' : 'restorePending'));
      unchanged(() => start({ runSeed: -1 }), new RangeError('runSeed must be an unsigned 32-bit integer'));
      unchanged(() => start({ challengeOrdinal: 360360 }), new RangeError('challengeOrdinal must be an integer in [0, 360360)'));
      unchanged(() => { refreshActivePlayerCombatConfig(); refreshActivePlayerCombatConfig({ replayCurrentWave: false }); }, null);
    } finally {
      if (wave) expect(endWaveTransition(wave)).toBe(false);
      if (restore) releaseWaveRestore(restore);
    }
  });

  it('retains no-op refresh and option validation before phase access', () => {
    start(); receipt(activeRun(), phase);
    unchanged(() => { refreshActivePlayerCombatConfig(); refreshActivePlayerCombatConfig({ replayCurrentWave: false }); }, null);
    unchanged(() => start({ runSeed: NaN }), new RangeError('runSeed must be an unsigned 32-bit integer'));
    unchanged(() => start({ challengeOrdinal: -1 }), new RangeError('challengeOrdinal must be an integer in [0, 360360)'));
  });

  it('does not spend a refused ordinal and permits ordinary actions after abandonment', () => {
    const first = start(); if (!first) throw new Error('Missing first ordinal');
    receipt(activeRun(), phase);
    unchanged(() => start(), phaseError(phase));
    unchanged(() => start({ challengeOrdinal: 23 }), phaseError(phase));
    abandonRecordedWaves();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(start({ challengeOrdinal: 23 })?.challengeOrdinal).toBe(23);
    expect(start()?.challengeOrdinal).toBe((first.challengeOrdinal + 1) % 360360);
  });

  it('allows explicit abort to clear the phase and armed selection without changing persistent data', () => {
    start(); receipt(activeRun(), phase);
    const before = [usePlayerStore, useInventoryStore, useMercStore, useMapStore, useMetaStore].map(store => store.getState());
    abortSubAreaRun();
    expect(combatRunLifecycle.activeRun).toBeNull();
    expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
    [usePlayerStore, useInventoryStore, useMercStore, useMapStore, useMetaStore].forEach((store, i) => {
      expect(store.getState()).toBe(before[i]);
    });
    expect(start()).not.toBeNull();
  });
});

it.each(['empty', 'published'] as const)('allows start, explicit replay and completion for %s holder', state => {
  start(); if (state === 'published') receipt(activeRun(), 'published');
  const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(engine).toHaveBeenCalledTimes(1);
  const length = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < length; i++) useCombatStore.getState().advanceEvent();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(engine).toHaveBeenCalledTimes(2);
  expect(start()).not.toBeNull(); expect(engine).toHaveBeenCalledTimes(3);
});


describe('captured publication installation', () => {
  it('retains a failed publisher payload and recovers it without simulation or repeated selection', () => {
    start(); const oldRun = activeRun(); const candidate = { ...oldRun };
    const { token, publication } = receipt(candidate, 'committedPendingPublication',
      { kind: 'newRun', nextDefaultChallengeOrdinal: 17 });
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const error = new Error('publisher before write');
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle')
      .mockImplementationOnce(() => { throw error; });
    const selectionChanged = vi.fn(); const stop = useIronGolemSelectionStore.subscribe(selectionChanged);
    try {
      expect(() => { recoverRecordedWavePublication(token); }).toThrow(error);
      expect(activeRun()).toBe(candidate); expect(candidate.recording).toBe(oldRun.recording);
      expect(inspectRecordedWaves().pending?.binding.publication).toBe(publication);
      expect(inspectRecordedWaves().pending?.installation).toMatchObject({ metadataInstalled: true, selectionProgress: 'resolved' });
      expect(useIronGolemSelectionStore.getState().selection).toBeNull();
      recoverRecordedWavePublication(token);
      expect(inspectRecordedWaves().pending).toBeNull();
      expect(inspectRecordedWaves().currentPublished?.receipt).toBe(token);
      expect(inspectRecordedWaves().currentPublished?.publicationFailure?.error).toBe(error);
      expect(publish).toHaveBeenNthCalledWith(1, publication); expect(publish).toHaveBeenNthCalledWith(2, publication);
      expect(selectionChanged).toHaveBeenCalledTimes(1); expect(engine).not.toHaveBeenCalled();
      const combat = useCombatStore.getState(); const holder = inspectRecordedWaves();
      expect(() => { recoverRecordedWavePublication(token); }).toThrow('staleReceipt');
      expect(useCombatStore.getState()).toBe(combat); expect(inspectRecordedWaves()).toBe(holder);
      expect(start()?.challengeOrdinal).toBe(17);
    } finally { stop(); }
  });

  it('recognizes a publisher-after-write error without resetting playback on retry', () => {
    start(); const run = activeRun();
    const { token, publication } = receipt(run, 'committedPendingPublication', { kind: 'replay' });
    const original = useCombatStore.getState().publishStagedRecordedBattle;
    const error = new Error('publisher after write');
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementation(value => {
      original(value); throw error;
    });
    const selection = useIronGolemSelectionStore.getState().selection;
    expect(() => { recoverRecordedWavePublication(token); }).toThrow(error);
    expect(inspectRecordedWaves().pending).toBeNull();
    expect(inspectRecordedWaves().currentPublished?.publicationFailure?.error).toBe(error);
    expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
    useCombatStore.getState().advanceEvent();
    const combat = useCombatStore.getState(); const holder = inspectRecordedWaves();
    expect(() => { recoverRecordedWavePublication(token); }).toThrow('staleReceipt');
    expect(useCombatStore.getState()).toBe(combat); expect(inspectRecordedWaves()).toBe(holder);
    expect(publish).toHaveBeenCalledTimes(1); expect(publish).toHaveBeenCalledWith(publication);
  });
});


it.each(['before', 'after'] as const)('observes selection throw-%s-write and retries only unresolved consumption', when => {
  start(); const candidate = { ...activeRun() };
  const { token } = receipt(candidate, 'committedPendingPublication', { kind: 'newRun', nextDefaultChallengeOrdinal: null });
  const originalSelection = useIronGolemSelectionStore.getState().selection;
  const error = new Error(`selection ${when} write`);
  const selectionChanged = vi.fn(); const stopCount = useIronGolemSelectionStore.subscribe(selectionChanged);
  const setter = when === 'before' ? vi.spyOn(useIronGolemSelectionStore, 'setState')
    .mockImplementationOnce(() => { throw error; }) : undefined;
  const stopThrow = when === 'after' ? useIronGolemSelectionStore.subscribe(() => { throw error; }) : () => { /* No throwing subscription to release in the before-write case. */ };
  const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
  try {
    expect(() => { recoverRecordedWavePublication(token); }).toThrow(error);
    expect(inspectRecordedWaves().pending?.installation).toMatchObject({ metadataInstalled: true,
      selectionProgress: when === 'before' ? 'pending' : 'resolved', selectionFailure: { error } });
    expect(useIronGolemSelectionStore.getState().selection).toBe(when === 'before' ? originalSelection : null);
    expect(publish).not.toHaveBeenCalled();
    setter?.mockRestore(); stopThrow();
    recoverRecordedWavePublication(token);
    expect(inspectRecordedWaves().currentPublished?.installation?.selectionFailure?.error).toBe(error);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
    expect(selectionChanged).toHaveBeenCalledTimes(1); expect(publish).toHaveBeenCalledTimes(1);
  } finally { setter?.mockRestore(); stopThrow(); stopCount(); }
});

it.each(['before', 'after'] as const)('preserves a fresh same-ID rearm after a selection throw-%s-write', when => {
  start(); const run = { ...activeRun() };
  const { token } = receipt(run, 'committedPendingPublication', { kind: 'newRun', nextDefaultChallengeOrdinal: null });
  const old = useIronGolemSelectionStore.getState().selection;
  if (!old) throw new Error('Missing captured selection');
  const error = new Error('selection notification');
  const setter = when === 'before' ? vi.spyOn(useIronGolemSelectionStore, 'setState')
    .mockImplementationOnce(() => { throw error; }) : undefined;
  const stopThrow = when === 'after' ? useIronGolemSelectionStore.subscribe(() => { throw error; }) : () => { /* No throwing subscription to release in the before-write case. */ };
  try { expect(() => { recoverRecordedWavePublication(token); }).toThrow(error); }
  finally { setter?.mockRestore(); stopThrow(); }
  const rearm = armIronGolemSelection(old.heroId, old.itemId, true);
  expect(rearm).not.toBe(old); expect(rearm).toEqual(old);
  const changed = vi.fn(); const stop = useIronGolemSelectionStore.subscribe(changed);
  try {
    recoverRecordedWavePublication(token);
    expect(useIronGolemSelectionStore.getState().selection).toBe(rearm); expect(changed).not.toHaveBeenCalled();
    expect(inspectRecordedWaves().currentPublished?.installation?.selectionProgress).toBe('resolved');
  } finally { stop(); }
});

it('installs captured next-wave carry once and preserves replay baseline and selection', () => {
  start(); const run = activeRun(); const carry = structuredClone(run.carryPlayerTeam);
  const { token, binding } = receipt(run, 'committedPendingPublication', { kind: 'newWave', carryPlayerTeam: carry }, 1);
  const error = new Error('next wave publisher before write');
  vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw error; });
  expect(() => { recoverRecordedWavePublication(token); }).toThrow(error);
  expect(run.carryPlayerTeam).toBe(carry); expect(run.waveIdx).toBe(1);
  recoverRecordedWavePublication(token);
  expect(activeRun()).toBe(run); expect(run.waveIdx).toBe(1); expect(run.carryPlayerTeam).toBe(carry);
  expect(run.recording).toBe(binding.recording); expect(run.waveElapsedMs).toBe(binding.waveElapsedMs);
  expect(Object.isFrozen(carry)).toBe(false);
  const selection = armIronGolemSelection(run.playerUnit.id, 'next-selection', true);
  const replay = receipt(run, 'committedPendingPublication', { kind: 'replay' });
  const changed = vi.fn(); const stop = useIronGolemSelectionStore.subscribe(changed);
  try {
    recoverRecordedWavePublication(replay.token);
    expect(run.carryPlayerTeam).toBe(carry); expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
    expect(changed).not.toHaveBeenCalled();
  } finally { stop(); }
});

it('keeps the default ordinal unchanged for an explicit-ordinal installation', () => {
  const first = start(); if (!first) throw new Error('Missing ordinal control');
  const { token } = receipt({ ...activeRun() }, 'committedPendingPublication',
    { kind: 'newRun', nextDefaultChallengeOrdinal: null });
  recoverRecordedWavePublication(token);
  expect(start()?.challengeOrdinal).toBe((first.challengeOrdinal + 1) % 360360);
});

it.each([360360, Number.MAX_SAFE_INTEGER])('refuses retained ordinal %s before any installation mutation', nextDefaultChallengeOrdinal => {
  const first = start(); if (!first) throw new Error('Missing ordinal control');
  const { token } = receipt({ ...activeRun() }, 'committedPendingPublication', { kind: 'newRun', nextDefaultChallengeOrdinal });
  unchanged(() => { recoverRecordedWavePublication(token); },
    new RangeError('nextDefaultChallengeOrdinal must be an integer in [0, 360360)'));
  expect(inspectRecordedWaves().pending?.installation?.metadataInstalled).toBe(false);
  abandonRecordedWaves();
  expect(start()?.challengeOrdinal).toBe((first.challengeOrdinal + 1) % 360360);
});


it.each(['idle', 'loading', 'error', 'wave', 'restore'] as const)('refuses recovery during %s and releases ownership for later exact recovery', refusal => {
  start(); const { token } = receipt({ ...activeRun() }, 'committedPendingPublication',
    { kind: 'newRun', nextDefaultChallengeOrdinal: null });
  const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
  const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
  const wave = refusal === 'wave' ? beginWaveTransition(true) : undefined;
  const restore = refusal === 'restore' ? reserveWaveRestore() : undefined;
  useHydrationStore.getState().setStatus(refusal === 'wave' || refusal === 'restore' ? 'error' : refusal);
  try {
    unchanged(() => { recoverRecordedWavePublication(token); }, new WaveGuardError(refusal === 'wave' ? 'waveBusy'
      : refusal === 'restore' ? 'restorePending' : 'hydrationNotReady'));
    expect(engine).not.toHaveBeenCalled(); expect(publish).not.toHaveBeenCalled();
  } finally {
    if (wave) expect(endWaveTransition(wave)).toBe(false);
    if (restore) releaseWaveRestore(restore);
  }
  useHydrationStore.getState().setStatus('ready'); recoverRecordedWavePublication(token);
  expect(inspectRecordedWaves().currentPublished?.receipt).toBe(token);
  expect(assertWaveSnapshotAllowed).not.toThrow(); expect(engine).not.toHaveBeenCalled();
});

it.each(['prepared', 'conflict', 'foundation'] as const)('refuses %s receipt recovery without an install fallback', phase => {
  start(); const { token } = receipt({ ...activeRun() }, phase === 'foundation' ? 'committedPendingPublication' : phase,
    phase === 'foundation' ? undefined : { kind: 'newRun', nextDefaultChallengeOrdinal: null });
  unchanged(() => { recoverRecordedWavePublication(token); }, new RecordedWaveReceiptError(phase === 'foundation' ? 'bindingMismatch' : 'wrongPhase'));
  expect(assertWaveSnapshotAllowed).not.toThrow();
});

it('preserves a newer pending install when an older genuine token requests recovery', () => {
  start(); const old = receipt({ ...activeRun() }, 'committedPendingPublication',
    { kind: 'newRun', nextDefaultChallengeOrdinal: null });
  abandonRecordedWaves();
  const next = receipt({ ...activeRun() }, 'committedPendingPublication',
    { kind: 'newRun', nextDefaultChallengeOrdinal: null });
  unchanged(() => { recoverRecordedWavePublication(old.token); }, new RecordedWaveReceiptError('staleReceipt'));
  recoverRecordedWavePublication(next.token);
  expect(inspectRecordedWaves().currentPublished?.receipt).toBe(next.token);
});

it('marks metadata before observers, rejects nested recovery and wakes one deferred save after release', () => {
  start(); const run = { ...activeRun() };
  const { token } = receipt(run, 'committedPendingPublication', { kind: 'newRun', nextDefaultChallengeOrdinal: null });
  const wake = vi.spyOn(persistence, 'resumeWaveDeferredSave').mockImplementation(() => {
    expect(assertWaveSnapshotAllowed).not.toThrow();
  });
  const observed = vi.fn(() => {
    expect(activeRun()).toBe(run);
    expect(inspectRecordedWaves().pending?.installation?.metadataInstalled).toBe(true);
    expect(() => { recoverRecordedWavePublication(token); }).toThrow(new WaveGuardError('waveBusy'));
    expect(deferWaveSaveIfBusy()).toBe(true); expect(deferWaveSaveIfBusy()).toBe(true);
  });
  const stop = useCombatStore.subscribe(observed);
  try {
    recoverRecordedWavePublication(token);
    expect(observed).toHaveBeenCalledTimes(1); expect(wake).toHaveBeenCalledTimes(1);
    expect(inspectRecordedWaves().currentPublished?.receipt).toBe(token);
    expect(assertWaveSnapshotAllowed).not.toThrow();
  } finally { stop(); }
});


it('retains a partially installed publisher result until exact captured publication recovers', () => {
  start(); const { token, publication } = receipt({ ...activeRun() }, 'committedPendingPublication',
    { kind: 'newRun', nextDefaultChallengeOrdinal: null });
  const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(value => {
    useCombatStore.setState({ outcome: value.outcome, recordedEvents: [] });
  });
  expect(() => { recoverRecordedWavePublication(token); }).toThrow(new RecordedWaveReceiptError('bindingMismatch'));
  expect(inspectRecordedWaves().pending?.binding.publication).toBe(publication);
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
  recoverRecordedWavePublication(token);
  expect(useCombatStore.getState().recordedEvents).toBe(publication.recordedEvents);
  expect(inspectRecordedWaves().currentPublished?.receipt).toBe(token);
  expect(publish).toHaveBeenCalledTimes(2);
});

it('keeps production start, replay and next-wave producers disconnected from install receipts', () => {
  expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
  start(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  const length = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < length; i++) useCombatStore.getState().advanceEvent();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
});
