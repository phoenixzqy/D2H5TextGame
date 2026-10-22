/** Synthetic receipt phases around actual run staging, playback and completion. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as combatEngine from '@/engine/combat/combat';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
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
  inspectRecordedWaves, abandonRecordedWaves } from './recordedWaveReceipt';
import { RecordedWaveAccessError } from './recordedWaveAccess';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore, WaveGuardError } from './waveTransitionGuard';

const phases = ['prepared', 'committedPendingPublication', 'conflict'] as const;
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
  useMapStore, useFormationStore, useMetaStore, useIronGolemSelectionStore, useHydrationStore] as const;
const start = (options: Parameters<typeof startSubAreaRun>[0] = {}) =>
  startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7, ...options });
const actions = [{ name: 'start', action: () => start() }, { name: 'advance', action: advanceWaveOrFinish },
  { name: 'replay', action: () => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); } }] as const;

function receipt(run: ActiveRun, phase: typeof phases[number] | 'published') {
  const combat = useCombatStore.getState(); const inv = useInventoryStore.getState();
  const recording = run.recording;
  if (!recording) throw new Error('Missing actual recording');
  const ownership = { backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped,
    mercEquipment: useMercStore.getState().mercEquipment };
  const selection = useIronGolemSelectionStore.getState().selection;
  const publication = stageRecordedBattle({ initialPlayerTeam: combat.playerTeam, initialEnemyTeam: combat.enemyTeam,
    events: recording.events, outcome: recording.outcome, unitNameMap: combat.unitNameMap,
    currentWave: run.waveIdx + 1, totalWaves: run.plan.waves.length, subAreaRunId: run.plan.subAreaId }, combat);
  const lease = beginWaveTransition(true);
  try {
    const token = prepareRecordedWave({ candidateRun: run, expectedActiveRun: combatRunLifecycle.activeRun,
      heroId: run.playerUnit.id, targetWaveIdx: run.waveIdx, waveElapsedMs: run.waveElapsedMs,
      selection, ownership, debitIntent: null, attestation: null,
      engineInput: { seed: run.seed, playerTeam: combat.playerTeam, enemyTeam: combat.enemyTeam },
      recording, publication }, lease);
    if (phase !== 'prepared') expect(commitPreparedRecordedWave(token, lease, {
      activeRun: combatRunLifecycle.activeRun, heroId: run.playerUnit.id, selection,
      ownership: phase === 'conflict' ? { ...ownership, backpack: [] } : ownership
    })).toBe(phase === 'published' ? 'committedPendingPublication' : phase);
    if (phase === 'published') {
      useCombatStore.getState().publishStagedRecordedBattle(publication);
      expect(recognizeRecordedWavePublication(token, lease, { activeRun: run,
        heroId: run.playerUnit.id, combat: useCombatStore.getState() })).toBe(true);
    }
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
