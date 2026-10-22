/** Synthetic receipt phases around actual run staging, playback and completion. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as combatEngine from '@/engine/combat/combat';
import * as statusEngine from '@/engine/combat/status';
import * as persistence from './persistence';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun, recoverRecordedWavePublication, readCombatTransitionRecovery, performCombatScreenTransition } from './combatHelpers';
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
  markRecordedWaveMetadataInstalled, observeRecordedWaveSelection, beginRecordedWaveSettlement, finishRecordedWaveSettlement,
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
    if (intent?.kind === 'newWave' || (intent?.kind === 'replay' && !inspectRecordedWaves().currentPublished?.installation)) {
      // Protocol-only predecessor around the actual recording: no payout or carry rebase.
      const previous = { ...binding, expectedActiveRun: null, targetWaveIdx: run.waveIdx,
        publication: { ...publication, currentWave: run.waveIdx + 1 } };
      const predecessor = prepareRecordedWaveInstallation(previous,
        { kind: 'newRun', nextDefaultChallengeOrdinal: null }, lease);
      commitPreparedRecordedWave(predecessor, lease, { activeRun: null, heroId: run.playerUnit.id, selection, ownership });
      markRecordedWaveMetadataInstalled(predecessor, lease); observeRecordedWaveSelection(predecessor, lease, null);
      expect(recognizeRecordedWavePublication(predecessor, lease, { activeRun: run,
        heroId: run.playerUnit.id, combat: previous.publication })).toBe(true);
      if (intent.kind === 'newWave') {
        beginRecordedWaveSettlement(predecessor, lease, { activeRun: run, heroId: run.playerUnit.id,
          combat: { ...previous.publication, playbackComplete: true } });
        finishRecordedWaveSettlement(predecessor, lease, { kind: 'nextWave', carryPlayerTeam: intent.carryPlayerTeam });
      }
    }
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
    unchanged(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }, new RecordedWaveReceiptError('bindingMismatch'));
    unchanged(advanceWaveOrFinish, new RecordedWaveReceiptError('bindingMismatch'));
    abortSubAreaRun();
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

it.each(['production', 'foundation'] as const)('requires installation authority for %s holder and allows explicit replacement', state => {
  start(); if (state === 'foundation') receipt(activeRun(), 'published');
  const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
  if (state === 'foundation') {
    unchanged(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }, new RecordedWaveReceiptError('bindingMismatch'));
    drain(); unchanged(advanceWaveOrFinish, new RecordedWaveReceiptError('bindingMismatch'));
    expect(engine).not.toHaveBeenCalled();
  } else {
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(engine).toHaveBeenCalledTimes(1);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(engine).toHaveBeenCalledTimes(2);
  }
  expect(start()).not.toBeNull(); expect(engine).toHaveBeenCalledTimes(state === 'foundation' ? 1 : 3);
});


describe('captured publication installation', () => {
  it('retains a failed publisher payload and recovers it without simulation or repeated selection', () => {
    start(); const oldRun = activeRun(); const candidate = { ...oldRun };
    armIronGolemSelection(candidate.playerUnit.id, 'captured-publication-selection', true);
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
  armIronGolemSelection(candidate.playerUnit.id, 'captured-selection-throw', true);
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
  armIronGolemSelection(run.playerUnit.id, 'captured-selection-rearm', true);
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

function drain(): void {
  const length = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < length; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

it('installs production start/replay/next-wave receipts with logical-wave payout identity', () => {
  expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
  const selection = useIronGolemSelectionStore.getState().selection;
  start();
  const first = inspectRecordedWaves().currentPublished;
  expect(first?.installation).toMatchObject({ intent: { kind: 'newRun' }, metadataInstalled: true,
    selectionProgress: 'resolved', settlement: { progress: { phase: 'unsettled' } } });
  expect(first?.binding.selection).toBe(selection);
  expect(first?.binding.candidateRun).toBe(activeRun());
  expect(first?.binding.recording).toBe(activeRun().recording);
  expect(first?.binding.recording.events).toBe(useCombatStore.getState().recordedEvents);
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  const rearm = armIronGolemSelection(activeRun().playerUnit.id, 'later-wave-item', true);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  const replay = inspectRecordedWaves().currentPublished;
  expect(replay?.receipt).not.toBe(first?.receipt);
  expect(replay?.installation?.intent.kind).toBe('replay');
  expect(replay?.installation?.settlement).toBe(first?.installation?.settlement);
  expect(useIronGolemSelectionStore.getState().selection).toBe(rearm);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  const next = inspectRecordedWaves().currentPublished;
  expect(next?.installation?.intent.kind).toBe('newWave');
  expect(next?.installation?.settlement.identity).not.toBe(replay?.installation?.settlement.identity);
  expect(next?.installation?.settlement.progress.phase).toBe('unsettled');
  expect(next?.binding.recording).toBe(activeRun().recording);
  expect(activeRun().waveIdx).toBe(1);
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  expect(inspectRecordedWaves().pending).toBeNull();
});

it.each(['outcome', 'events', 'area', 'wave', 'total', 'run', 'recording', 'cursor', 'hero', 'missing'] as const)(
  'refuses forged %s completion authority before every effect', mismatch => {
    start({ mode: 'idle', challengeOrdinal: 0 }); drain();
    const run = activeRun(); const combat = useCombatStore.getState();
    const player = usePlayerStore.getState().player;
    if (!combat.outcome || !run.recording || !player) throw new Error('Missing completion fixture');
    if (mismatch === 'outcome') useCombatStore.setState({ outcome: { ...combat.outcome } });
    if (mismatch === 'events') useCombatStore.setState({ recordedEvents: [...combat.recordedEvents] });
    if (mismatch === 'area') useCombatStore.setState({ subAreaRunId: 'forged-area' });
    if (mismatch === 'wave') useCombatStore.setState({ currentWave: 2 });
    if (mismatch === 'total') useCombatStore.setState({ totalWaves: 999 });
    if (mismatch === 'run') combatRunLifecycle.activeRun = { ...run };
    if (mismatch === 'recording') run.recording = { ...run.recording };
    if (mismatch === 'cursor') run.waveIdx++;
    if (mismatch === 'hero') usePlayerStore.setState({ player: { ...player, id: 'different-hero' } });
    if (mismatch === 'missing') abandonRecordedWaves();
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    unchanged(advanceWaveOrFinish, new RecordedWaveReceiptError('bindingMismatch'));
    expect(engine).not.toHaveBeenCalled();
  });

it('latches settlement before notifying XP and refuses nested completion without repeated payouts', () => {
  start(); drain();
  const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
  const observed = vi.fn(() => {
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settling');
    for (const { action } of actions) expect(action).toThrow(new WaveGuardError('waveBusy'));
    expect(abortSubAreaRun).toThrow(new WaveGuardError('waveBusy'));
  });
  const stop = usePlayerStore.subscribe(observed);
  try { expect(advanceWaveOrFinish()).toBe('next-wave'); }
  finally { stop(); }
  expect(observed).toHaveBeenCalled(); expect(xp).toHaveBeenCalledTimes(1);
  const player = usePlayerStore.getState().player;
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(usePlayerStore.getState().player).toBe(player); expect(xp).toHaveBeenCalledTimes(1);
});

it('retries next-wave staging from captured carry without repeating rewards or rebasing', () => {
  start({ mode: 'idle', challengeOrdinal: 0 }); drain();
  const run = activeRun(); const oldRecording = run.recording; const oldCarry = run.carryPlayerTeam;
  const selected = armIronGolemSelection(run.playerUnit.id, 'retry-wave-item', true);
  const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
  const rebase = vi.spyOn(statusEngine, 'rebaseStatusClock');
  const error = new Error('next wave staging');
  vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => { throw error; });
  expect(advanceWaveOrFinish).toThrow(error);
  expect(run.waveIdx).toBe(0); expect(run.recording).toBe(oldRecording); expect(run.carryPlayerTeam).toBe(oldCarry);
  const awaiting = inspectRecordedWaves().currentPublished?.installation?.settlement;
  if (awaiting?.progress.phase !== 'awaitingNextWave') throw new Error('Missing settled carry');
  const captured = awaiting.progress.carryPlayerTeam;
  const rebases = rebase.mock.calls.length;
  expect(rebases).toBeGreaterThan(0); expect(xp).toHaveBeenCalledTimes(1);
  expect(useIronGolemSelectionStore.getState().selection).toBe(selected);
  const gains = structuredClone({ player: usePlayerStore.getState().player,
    rewards: useCombatStore.getState().runRewards, backpack: useInventoryStore.getState().backpack });
  const pity = getIdleEliteMisses();
  unchanged(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }, new RecordedWaveAccessError('replaySettled'));
  usePlayerStore.getState().setComboOrder([]);
  const rearm = armIronGolemSelection(run.playerUnit.id, 'fresh-retry-item', true);
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(run.waveIdx).toBe(1); expect(run.carryPlayerTeam).toBe(captured);
  expect(run.recording).not.toBe(oldRecording); expect(rebase).toHaveBeenCalledTimes(rebases); expect(xp).toHaveBeenCalledTimes(1);
  expect(getIdleEliteMisses()).toBe(pity);
  expect(useCombatStore.getState().runRewards).toEqual(gains.rewards);
  expect(useInventoryStore.getState().backpack).toEqual(gains.backpack);
  expect(usePlayerStore.getState().player).toEqual({ ...gains.player, comboOrder: [] });
  expect(useCombatStore.getState().playerTeam[0]?.skillOrder).toEqual([]);
  expect(inspectRecordedWaves().currentPublished?.binding.selection).toBe(rearm);
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
});

it.each(['before', 'after'] as const)('retains actual XP and original failure after a %s-write settlement error', when => {
  start(); drain();
  const run = activeRun(); const recording = run.recording;
  const before = usePlayerStore.getState().player;
  const mercs = useMercStore.getState(); const inventory = useInventoryStore.getState();
  const error = { stage: 'xp', when }; // Arbitrary thrown values retain exact identity.
  const original = usePlayerStore.getState().gainExperience;
  vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => {
    if (when === 'after') original(amount);
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- Fault injection verifies arbitrary thrown value identity.
    throw error;
  });
  let caught: unknown;
  try { advanceWaveOrFinish(); } catch (value) { caught = value; }
  expect(caught).toBe(error);
  const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
  if (progress?.phase !== 'settlementFailed') throw new Error('Missing stable failure');
  expect(progress.failure.error).toBe(error);
  expect(activeRun()).toBe(run); expect(run.waveIdx).toBe(0); expect(run.recording).toBe(recording);
  const actual = usePlayerStore.getState().player;
  if (when === 'before') expect(actual).toBe(before);
  else expect(actual?.level).toBeGreaterThan(before?.level ?? 0);
  expect(useMercStore.getState()).toBe(mercs); expect(useInventoryStore.getState()).toBe(inventory);
  expect(persistence.snapshotStores()?.player).toEqual(actual);
  for (const { action } of actions) unchanged(action, new RecordedWaveAccessError('settlementFailed'));
  unchanged(() => { useCombatStore.getState().advanceEvent(); }, new RecordedWaveAccessError('settlementFailed'));
  const slices = [usePlayerStore, useInventoryStore, useMercStore, useMapStore].map(store => store.getState());
  abortSubAreaRun();
  [usePlayerStore, useInventoryStore, useMercStore, useMapStore].forEach((store, i) => { expect(store.getState()).toBe(slices[i]); });
  expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
  expect(start()).not.toBeNull();
});

it('retains awarded gains when carry rebasing fails and never retries the payout', () => {
  start(); drain(); const run = activeRun(); const recording = run.recording;
  const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
  const error = new Error('carry rebasing');
  const rebase = vi.spyOn(statusEngine, 'rebaseStatusClock').mockImplementationOnce(() => { throw error; });
  expect(advanceWaveOrFinish).toThrow(error);
  expect(xp).toHaveBeenCalledTimes(1); expect(rebase).toHaveBeenCalledTimes(1);
  expect(useCombatStore.getState().runRewards.items.length).toBeGreaterThan(0);
  expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress)
    .toMatchObject({ phase: 'settlementFailed', failure: { error } });
  expect(run.waveIdx).toBe(0); expect(run.recording).toBe(recording);
  unchanged(advanceWaveOrFinish, new RecordedWaveAccessError('settlementFailed'));
  expect(xp).toHaveBeenCalledTimes(1); expect(rebase).toHaveBeenCalledTimes(1);
});

it.each(['before', 'after'] as const)('retains final-wave actual clear progress after a %s-write clear error', when => {
  const handle = start(); if (!handle) throw new Error('Missing run handle');
  for (let wave = 1; wave < handle.totalWaves; wave++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
  drain(); const run = activeRun();
  const original = useMapStore.getState().markCleared;
  const error = new Error(`clear ${when}`);
  vi.spyOn(useMapStore.getState(), 'markCleared').mockImplementation(id => {
    if (when === 'after') original(id);
    throw error;
  });
  expect(advanceWaveOrFinish).toThrow(error);
  expect(activeRun()).toBe(run);
  expect(useMapStore.getState().isCleared(run.plan.subAreaId)).toBe(when === 'after');
  expect(useCombatStore.getState().runVictory).toBe(false);
  expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress)
    .toMatchObject({ phase: 'settlementFailed', failure: { error } });
  unchanged(advanceWaveOrFinish, new RecordedWaveAccessError('settlementFailed'));
});

it('preserves published authority, selection and ordinal when production start or replay staging fails', () => {
  const first = start(); if (!first) throw new Error('Missing ordinal');
  armIronGolemSelection(activeRun().playerUnit.id, 'staging-retained-selection', true);
  const error = new Error('production staging');
  const engine = vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => { throw error; });
  unchanged(() => start(), error);
  engine.mockImplementationOnce(() => { throw error; });
  unchanged(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }, error);
  expect(start()?.challengeOrdinal).toBe((first.challengeOrdinal + 1) % 360360);
});

it.each(['selection', 'ownership', 'cursor', 'recording'] as const)('cancels an unpaid attempt after %s reference changes during controlled staging', changed => {
  const first = start(); if (!first) throw new Error('Missing ordinal');
  const run = activeRun(); const combat = useCombatStore.getState(); const published = inspectRecordedWaves().currentPublished;
  armIronGolemSelection(run.playerUnit.id, 'stale-attempt-selection', true);
  const original = combatEngine.runBattleRecorded;
  const backpack = [...useInventoryStore.getState().backpack];
  vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(input => {
    const actual = original(input);
    // Raw-setter fault injection at the pure engine boundary, not a supported action.
    if (changed === 'selection') useIronGolemSelectionStore.setState({ selection: null });
    if (changed === 'ownership') useInventoryStore.setState({ backpack });
    if (changed === 'cursor') run.waveIdx++;
    if (changed === 'recording' && run.recording) run.recording = { ...run.recording };
    return actual;
  });
  expect(() => start()).toThrow(new RecordedWaveReceiptError('bindingMismatch'));
  expect(inspectRecordedWaves()).toEqual({ currentPublished: published, pending: null });
  expect(activeRun()).toBe(run); expect(useCombatStore.getState()).toBe(combat);
  if (changed === 'ownership') expect(useInventoryStore.getState().backpack).toBe(backpack);
  if (changed === 'selection') expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  expect(start()?.challengeOrdinal).toBe((first.challengeOrdinal + 1) % 360360);
});

it.each(['before', 'after'] as const)('recovers actual production selection throw-%s-write without simulation or consuming rearm', when => {
  const selected = useIronGolemSelectionStore.getState().selection;
  if (!selected) throw new Error('Missing one-shot selection');
  const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
  const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
  const error = new Error('actual selection publication');
  const setter = when === 'before' ? vi.spyOn(useIronGolemSelectionStore, 'setState')
    .mockImplementationOnce(() => { throw error; }) : undefined;
  const stop = when === 'after' ? useIronGolemSelectionStore.subscribe(() => { throw error; })
    : () => { /* Before-write failure has no throwing observer. */ };
  try { expect(() => start({ challengeOrdinal: 23 })).toThrow(error); }
  finally { setter?.mockRestore(); stop(); }
  const pending = inspectRecordedWaves().pending;
  if (!pending) throw new Error('Missing committed production receipt');
  expect(pending.installation).toMatchObject({ metadataInstalled: true,
    selectionProgress: when === 'before' ? 'pending' : 'resolved', selectionFailure: { error } });
  expect(useIronGolemSelectionStore.getState().selection).toBe(when === 'before' ? selected : null);
  expect(publish).not.toHaveBeenCalled();
  const rearm = armIronGolemSelection(selected.heroId, selected.itemId, true);
  recoverRecordedWavePublication(pending.receipt);
  expect(engine).toHaveBeenCalledTimes(1); expect(publish).toHaveBeenCalledTimes(1);
  expect(useIronGolemSelectionStore.getState().selection).toBe(rearm);
  expect(inspectRecordedWaves().currentPublished?.receipt).toBe(pending.receipt);
  expect(inspectRecordedWaves().currentPublished?.installation?.selectionFailure?.error).toBe(error);
});

it.each(['before', 'after'] as const)('recognizes actual production publisher throw-%s-write and installs the ordinal once', when => {
  const first = start(); if (!first) throw new Error('Missing ordinal');
  armIronGolemSelection(activeRun().playerUnit.id, 'actual-publication-selection', true);
  const original = useCombatStore.getState().publishStagedRecordedBattle;
  const error = new Error('actual publisher');
  const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(value => {
    if (when === 'after') original(value);
    throw error;
  });
  const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
  expect(() => start()).toThrow(error);
  const retained = when === 'before' ? inspectRecordedWaves().pending : inspectRecordedWaves().currentPublished;
  if (!retained) throw new Error('Missing retained production attempt');
  expect(retained.publicationFailure?.error).toBe(error);
  expect(retained.binding.candidateRun).toBe(activeRun());
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  if (when === 'before') {
    unchanged(() => { useCombatStore.getState().advanceEvent(); }, new RecordedWaveAccessError('publicationPending'));
    recoverRecordedWavePublication(retained.receipt);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenNthCalledWith(1, retained.binding.publication);
    expect(publish).toHaveBeenNthCalledWith(2, retained.binding.publication);
  } else {
    useCombatStore.getState().advanceEvent();
    unchanged(() => { recoverRecordedWavePublication(retained.receipt); }, new RecordedWaveReceiptError('staleReceipt'));
    expect(publish).toHaveBeenCalledTimes(1);
  }
  expect(engine).toHaveBeenCalledTimes(1);
  expect(inspectRecordedWaves().pending).toBeNull();
  expect(inspectRecordedWaves().currentPublished?.receipt).toBe(retained.receipt);
  expect(start()?.challengeOrdinal).toBe((first.challengeOrdinal + 2) % 360360);
});

it.each(['victory', 'defeat'] as const)('settles terminal %s once and refuses replay until explicit replacement', result => {
  if (result === 'defeat') {
    const original = combatEngine.runBattleRecorded;
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(input => {
      const actual = original(input);
      return { ...actual, result: { ...actual.result, winner: 'enemy' } };
    });
  }
  const handle = start(); if (!handle) throw new Error('Missing terminal fixture');
  const waves = result === 'defeat' ? 1 : handle.totalWaves;
  for (let wave = 1; wave <= waves; wave++) {
    drain(); expect(advanceWaveOrFinish()).toBe(wave === waves ? result : 'next-wave');
  }
  expect(combatRunLifecycle.activeRun).toBeNull();
  expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress).toEqual({ phase: 'settled', result });
  unchanged(advanceWaveOrFinish, null);
  unchanged(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }, new RecordedWaveAccessError('replaySettled'));
  expect(start()).not.toBeNull();
});


/** Real producer failures; injected setters/engine faults are not earned gameplay. */
describe('explicit combat screen transition recovery', () => {
  const screenStart = () => performCombatScreenTransition({ kind: 'start', options: {
    subAreaId: 'areas/act1-blood-moor', runSeed: 7 } });

  function readyScreenAdvance(kind: 'advance' | 'retryNextWave') {
    start(); drain();
    if (kind === 'advance') return () => performCombatScreenTransition({ kind: 'advance' });
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => { throw new Error('initial staging'); });
    expect(performCombatScreenTransition({ kind: 'advance' })).toBe(false);
    const recovery = readCombatTransitionRecovery();
    expect(recovery.kind).toBe('retryNextWave');
    return () => performCombatScreenTransition({ kind: 'retry', recovery });
  }

  it.each((['start', 'advance', 'retryNextWave'] as const).flatMap(kind =>
    (['before', 'after'] as const).flatMap(when =>
      [undefined, null, NaN, { fault: 'same wake' }, new WaveGuardError('hydrationNotReady')]
        .map(error => ({ kind, when, error })))))('propagates the exact $kind wake after publication throws $when write', ({ kind, when, error }) => {
    const action = kind === 'start' ? screenStart : readyScreenAdvance(kind);
    const original = useCombatStore.getState().publishStagedRecordedBattle;
    vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(value => {
      expect(deferWaveSaveIfBusy()).toBe(true);
      if (when === 'after') original(value);
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Publisher and wake deliberately reuse exact arbitrary/typed values.
      throw error;
    });
    vi.spyOn(persistence, 'resumeWaveDeferredSave').mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Exception provenance must survive identical values.
      throw error;
    });
    let caught: unknown, threw = false;
    try { action(); } catch (failure) { caught = failure; threw = true; }
    expect(threw).toBe(true); expect(Object.is(caught, error)).toBe(true);
    const retained = when === 'before' ? inspectRecordedWaves().pending : inspectRecordedWaves().currentPublished;
    expect(Object.is(retained?.publicationFailure?.error, error)).toBe(true);
  });

  it.each(['advance', 'retryNextWave'] as const)('propagates a distinct deferred-save wake after %s staging fails', kind => {
    const action = readyScreenAdvance(kind), wake = new Error('distinct deferred wake');
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => {
      expect(deferWaveSaveIfBusy()).toBe(true); throw new Error('new staging failure');
    });
    vi.spyOn(persistence, 'resumeWaveDeferredSave').mockImplementationOnce(() => { throw wake; });
    expect(action).toThrow(wake);
    expect(readCombatTransitionRecovery().kind).toBe('retryNextWave');
  });

  it.each(['success', 'publisherFailure'] as const)('propagates a typed wake after publication recovery %s', result => {
    const actual = useCombatStore.getState().publishStagedRecordedBattle;
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
    publish.mockImplementationOnce(() => { throw new Error('first publication'); });
    expect(screenStart()).toBe(false); const recovery = readCombatTransitionRecovery();
    publish.mockImplementationOnce(value => {
      expect(deferWaveSaveIfBusy()).toBe(true);
      if (result === 'success') actual(value); else throw new Error('retry publication');
    });
    const wake = new RecordedWaveReceiptError('bindingMismatch');
    vi.spyOn(persistence, 'resumeWaveDeferredSave').mockImplementationOnce(() => { throw wake; });
    expect(() => performCombatScreenTransition({ kind: 'retry', recovery })).toThrow(wake);
  });

  it.each([undefined, null, NaN, { fault: 'publisher' }])('recovers an exact pending publication after arbitrary throw %j', error => {
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- Arbitrary thrown values are intentional protocol fixtures.
    publish.mockImplementationOnce(() => { throw error; });
    expect(screenStart()).toBe(false);
    const recovery = readCombatTransitionRecovery();
    expect(recovery.kind).toBe('recoverPublication');
    const pending = inspectRecordedWaves().pending;
    expect(pending?.publicationFailure).toHaveProperty('error');
    expect(Object.is(pending?.publicationFailure?.error, error)).toBe(true);
    expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(true);
    expect(readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
    expect(inspectRecordedWaves().currentPublished?.receipt).toBe(pending?.receipt);
    expect(useCombatStore.getState().recordedEvents).toBe(pending?.binding.recording.events);
    expect(engine).toHaveBeenCalledTimes(1); expect(publish).toHaveBeenCalledTimes(2);
    unchanged(() => { expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(false); }, null);
    expect(engine).toHaveBeenCalledTimes(1); expect(publish).toHaveBeenCalledTimes(2);
  });

  it.each(['before', 'after'] as const)('classifies a distinct second publication failure %s write while preserving the first', when => {
    const first = new Error('first publisher failure'), second = { failure: 'second publisher' };
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const original = useCombatStore.getState().publishStagedRecordedBattle;
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
    publish.mockImplementationOnce(() => { throw first; });
    expect(screenStart()).toBe(false);
    const recovery = readCombatTransitionRecovery(), pending = inspectRecordedWaves().pending;
    publish.mockImplementationOnce(value => {
      if (when === 'after') original(value);
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Distinct retry failure must not replace first diagnostic evidence.
      throw second;
    });
    expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(when === 'after');
    const retained = when === 'after' ? inspectRecordedWaves().currentPublished : inspectRecordedWaves().pending;
    expect(retained?.receipt).toBe(pending?.receipt);
    expect(retained?.publicationFailure?.error).toBe(first);
    expect(retained?.binding).toBe(pending?.binding);
    expect(engine).toHaveBeenCalledTimes(1); expect(publish).toHaveBeenCalledTimes(2);
    if (when === 'before') expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(true);
    expect(readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
  });

  it.each(['before', 'after'] as const)('classifies a distinct second selection failure %s write without replacing the first', when => {
    const first = new Error('first selection failure'), second = { failure: 'second selection' };
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const original = useIronGolemSelectionStore.setState;
    const setter = vi.spyOn(useIronGolemSelectionStore, 'setState');
    setter.mockImplementationOnce(() => { throw first; });
    expect(screenStart()).toBe(false); const recovery = readCombatTransitionRecovery();
    const pending = inspectRecordedWaves().pending;
    setter.mockImplementationOnce(value => {
      if (when === 'after') original(value);
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Retried selection notification may throw a different value.
      throw second;
    });
    expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(false);
    expect(inspectRecordedWaves().pending?.receipt).toBe(pending?.receipt);
    expect(inspectRecordedWaves().pending?.installation?.selectionFailure?.error).toBe(first);
    expect(inspectRecordedWaves().pending?.installation?.selectionProgress).toBe(when === 'before' ? 'pending' : 'resolved');
    expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(true);
    expect(engine).toHaveBeenCalledTimes(1); expect(readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
  });

  it.each([
    ...[undefined, null, NaN, { fault: 'same first value' }].flatMap(error =>
      (['success', 'publisherFailure'] as const).map(result => ({ result, first: error,
        publisherError: new Error('retry publisher'), wakeError: error }))),
    ...(() => { const same = new Error('same current publisher and wake'); return [{
      result: 'publisherFailure' as const, first: new Error('first publisher'), publisherError: same, wakeError: same }]; })()
  ])('preserves deferred-save provenance for $result even with identical historical/current values', ({ result, first, publisherError, wakeError }) => {
    const original = useCombatStore.getState().publishStagedRecordedBattle;
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
    publish.mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Arbitrary initial diagnostic identity.
      throw first;
    });
    expect(screenStart()).toBe(false); const recovery = readCombatTransitionRecovery();
    publish.mockImplementationOnce(value => {
      expect(deferWaveSaveIfBusy()).toBe(true);
      if (result === 'success') original(value); else throw publisherError;
    });
    vi.spyOn(persistence, 'resumeWaveDeferredSave').mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Wake may throw the same primitive/object as historical evidence.
      throw wakeError;
    });
    let caught: unknown, threw = false;
    try { performCombatScreenTransition({ kind: 'retry', recovery }); } catch (error) { caught = error; threw = true; }
    expect(threw).toBe(true); expect(Object.is(caught, wakeError)).toBe(true);
    const retained = result === 'success' ? inspectRecordedWaves().currentPublished : inspectRecordedWaves().pending;
    expect(Object.is(retained?.publicationFailure?.error, first)).toBe(true);
  });

  it.each(['success', 'publisherFailure'] as const)('does not swallow an unrelated deferred-save failure after recovery %s', result => {
    const first = new Error('first publication'), second = new Error('deferred save');
    const original = useCombatStore.getState().publishStagedRecordedBattle;
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
    publish.mockImplementationOnce(() => { throw first; });
    expect(screenStart()).toBe(false); const recovery = readCombatTransitionRecovery();
    const third = new Error('retry publisher');
    publish.mockImplementationOnce(value => {
      expect(deferWaveSaveIfBusy()).toBe(true);
      if (result === 'success') original(value); else throw third;
    });
    vi.spyOn(persistence, 'resumeWaveDeferredSave').mockImplementationOnce(() => { throw second; });
    expect(() => performCombatScreenTransition({ kind: 'retry', recovery })).toThrow(second);
    const retained = result === 'success' ? inspectRecordedWaves().currentPublished : inspectRecordedWaves().pending;
    expect(retained?.publicationFailure?.error).toBe(first);
  });

  it.each([undefined, null, NaN, { fault: 'after publication' }])('resumes an already published exact recording after throw %j', error => {
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const original = useCombatStore.getState().publishStagedRecordedBattle;
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(value => {
      original(value);
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Verify field presence and Object.is rather than error truthiness.
      throw error;
    });
    expect(screenStart()).toBe(true); expect(readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
    expect(inspectRecordedWaves().currentPublished?.publicationFailure).toHaveProperty('error');
    expect(engine).toHaveBeenCalledTimes(1); expect(publish).toHaveBeenCalledTimes(1);
    // Historical evidence must not swallow a subsequent unrelated staging failure.
    const unrelated = new Error('unrelated staging failure');
    engine.mockImplementationOnce(() => { throw unrelated; });
    expect(screenStart).toThrow(unrelated); expect(publish).toHaveBeenCalledTimes(1);
  });

  it.each(['before', 'after'] as const)('classifies selection throw-%s-write and recovers without claiming a rearm', when => {
    const selected = useIronGolemSelectionStore.getState().selection;
    if (!selected) throw new Error('Missing selection');
    const error = { selection: when }; const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const setter = when === 'before' ? vi.spyOn(useIronGolemSelectionStore, 'setState').mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Selection setter fault fixture.
      throw error;
    }) : undefined;
    const stop = when === 'after' ? useIronGolemSelectionStore.subscribe(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Selection notification fault fixture.
      throw error;
    }) : () => { /* No throwing observer before write. */ };
    try { expect(screenStart()).toBe(false); } finally { setter?.mockRestore(); stop(); }
    const recovery = readCombatTransitionRecovery(); expect(recovery.kind).toBe('recoverPublication');
    const rearm = armIronGolemSelection(selected.heroId, selected.itemId, true);
    expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(true);
    expect(useIronGolemSelectionStore.getState().selection).toBe(rearm);
    expect(engine).toHaveBeenCalledTimes(1); expect(readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
  });

  it('refuses a displayed stale publication token without recovering its replacement', () => {
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle');
    publish.mockImplementationOnce(() => { throw new Error('old pending'); });
    expect(screenStart()).toBe(false); const stale = readCombatTransitionRecovery();
    abortSubAreaRun(); publish.mockImplementationOnce(() => { throw new Error('new pending'); });
    expect(screenStart()).toBe(false); const replacement = inspectRecordedWaves();
    unchanged(() => { expect(performCombatScreenTransition({ kind: 'retry', recovery: stale })).toBe(false); }, null);
    expect(inspectRecordedWaves()).toBe(replacement); expect(publish).toHaveBeenCalledTimes(2);
  });

  it('retries only the displayed receipt and carry progress, without repeated rewards or rebasing', () => {
    start(); drain();
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const rebase = vi.spyOn(statusEngine, 'rebaseStatusClock');
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => { throw new Error('staging'); });
    expect(performCombatScreenTransition({ kind: 'advance' })).toBe(false);
    const recovery = readCombatTransitionRecovery();
    if (recovery.kind !== 'retryNextWave') throw new Error('Missing captured carry recovery');
    const gains = stores.map(store => store.getState()); const rewards = useCombatStore.getState().runRewards;
    const rebases = rebase.mock.calls.length;
    expect(xp).toHaveBeenCalledTimes(1); expect(rebases).toBeGreaterThan(0);
    unchanged(() => { expect(performCombatScreenTransition({ kind: 'retry', recovery: {
      ...recovery, progress: { ...recovery.progress } } })).toBe(false); }, null);
    expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(true);
    expect(engine).toHaveBeenCalledTimes(2); expect(xp).toHaveBeenCalledTimes(1);
    expect(rebase).toHaveBeenCalledTimes(rebases);
    expect(usePlayerStore.getState()).toBe(gains[1]); expect(useInventoryStore.getState()).toBe(gains[2]);
    expect(useCombatStore.getState().runRewards).toBe(rewards);
    unchanged(() => { expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(false); }, null);
  });

  it('parks a partial settlement and retains the exact failure until explicit abandonment', () => {
    start(); drain(); const original = usePlayerStore.getState().gainExperience;
    const error = { fault: 'partial XP' };
    vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => {
      original(amount);
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Verify stable arbitrary settlement failure.
      throw error;
    });
    expect(performCombatScreenTransition({ kind: 'advance' })).toBe(false);
    expect(readCombatTransitionRecovery()).toEqual({ kind: 'parked', reason: 'settlementFailed' });
    const recovery = readCombatTransitionRecovery();
    unchanged(() => { expect(performCombatScreenTransition({ kind: 'retry', recovery })).toBe(false); }, null);
    expect(readCombatTransitionRecovery()).toEqual(recovery);
    abortSubAreaRun(); expect(readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
  });
});
