import { useHydrationStore } from './hydrationStore';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as combatEngine from '@/engine/combat/combat';
import * as wavePlans from '@/engine/combat';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import {
  abortSubAreaRun, hasActiveSubAreaRun, refreshActivePlayerCombatConfig, startSubAreaRun
} from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { armIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import * as publication from './recordedBattlePublication';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore, WaveGuardError } from './waveTransitionGuard';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
  useMapStore, useFormationStore, useMetaStore] as const;
const area = 'areas/act1-blood-moor';
const period = 360360;

function start(options: Parameters<typeof startSubAreaRun>[0] = {}) {
  const handle = startSubAreaRun({ subAreaId: area, act: 1, runSeed: 7, ...options });
  if (!handle) throw new Error('Player fixture failed to start');
  return handle;
}

beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useIronGolemSelectionStore.setState({ selection: null });
  usePlayerStore.getState().setPlayer(createMockPlayer('Staging', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
});

afterEach(() => {
  vi.restoreAllMocks();
  abortSubAreaRun();
  useIronGolemSelectionStore.setState({ selection: null });
  useHydrationStore.getState().setStatus('idle');
});

const faults = ['engine', 'normalization', 'empty-plan', 'missing-end', 'non-end',
  NaN, Infinity, -1, combatEngine.MAX_SIM_MS + 1] as const;

describe.each([undefined, 23])('new-run staging with requested ordinal %s', challengeOrdinal => {
  it.each(faults)('preserves the old run, recording, selection and next default ordinal on %s', fault => {
    const originalEngine = combatEngine.runBattleRecorded;
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const oldHandle = start();
    const oldInput = engine.mock.calls[0]?.[0];
    if (!oldInput) throw new Error('Old wave did not simulate');
    const heroId = usePlayerStore.getState().player?.id;
    if (!heroId) throw new Error('Hero missing');
    const selection = armIronGolemSelection(heroId, 'retained-selection', true);
    const rewards = { items: [], runeShards: 13, runes: 2, gems: 3, wishstones: 4 };
    useCombatStore.setState({ runRewards: rewards, runVictory: true, runDefeat: true });
    const before = stores.map(store => store.getState());
    const notified = vi.fn();
    const stops = stores.map(store => store.subscribe(notified));
    const failure = new Error(`staging ${String(fault)}`);
    if (fault === 'engine') engine.mockImplementationOnce(() => { throw failure; });
    else if (fault === 'normalization') {
      vi.spyOn(publication, 'stageRecordedBattle').mockImplementationOnce(() => { throw failure; });
    } else if (fault === 'empty-plan') {
      const originalPlan = wavePlans.resolveChallengeWavePlan;
      vi.spyOn(wavePlans, 'resolveChallengeWavePlan').mockImplementationOnce(input =>
        ({ ...originalPlan(input), waves: [] }));
    } else {
      engine.mockImplementationOnce(input => {
        const actual = originalEngine(input);
        const end = actual.events.at(-1);
        if (end?.kind !== 'end') throw new Error('Missing real terminal control');
        const events = fault === 'missing-end' ? [] : fault === 'non-end'
          ? [...actual.events, { kind: 'message' as const, messageKey: 'fixture.invalid', simClockMs: 0, uiDelayMs: 1 }]
          : [...actual.events.slice(0, -1), { ...end, simClockMs: fault }];
        return { ...actual, events };
      });
    }
    try {
      expect(() => start({ runSeed: 99,
        ...(challengeOrdinal === undefined ? {} : { challengeOrdinal }) })).toThrow();
      for (const [index, store] of stores.entries()) expect(store.getState()).toBe(before[index]);
      expect(useCombatStore.getState().runRewards).toBe(rewards);
      expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
      expect(notified).not.toHaveBeenCalled();
      expect(hasActiveSubAreaRun()).toBe(true);
    } finally { stops.forEach(stop => { stop(); }); }

    // A present run is insufficient: prove replay still uses the old run's input.
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const replayInput = engine.mock.calls.at(-1)?.[0];
    expect(replayInput?.seed).toBe(oldInput.seed);
    expect(replayInput?.enemyTeam.map(unit => unit.id)).toEqual(oldInput.enemyTeam.map(unit => unit.id));
    expect(replayInput?.playerTeam).toEqual(oldInput.playerTeam);
    expect(start().challengeOrdinal).toBe((oldHandle.challengeOrdinal + 1) % period);
  });
});

describe('accepted new-run publication', () => {
  it('publishes its recording and one fresh reward reset together in one notification', () => {
    const previous = start();
    const oldRewards = { items: [], runeShards: 13, runes: 2, gems: 3, wishstones: 4 };
    useCombatStore.setState({ runRewards: oldRewards, runVictory: true, runDefeat: true,
      eventCursor: 4, playbackComplete: true, isPaused: true });
    const before = useCombatStore.getState();
    const observations: ReturnType<typeof useCombatStore.getState>[] = [];
    const stop = useCombatStore.subscribe(state => { observations.push(state); });
    try {
      const next = start({ subAreaId: 'areas/act1-den-of-evil', runSeed: 99 });
      const state = useCombatStore.getState();
      expect(observations).toEqual([state]);
      expect(state.subAreaRunId).toBe(next.runId);
      expect(state.subAreaRunId).not.toBe(previous.runId);
      expect(state.currentWave).toBe(1);
      expect(state.totalWaves).toBe(next.totalWaves);
      expect(state.recordedEvents).not.toBe(before.recordedEvents);
      expect(state.outcome).not.toBe(before.outcome);
      expect(state.recordedEvents.at(-1)?.kind).toBe('end');
      expect(state.runRewards).toEqual({ items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0 });
      expect(state.runRewards).not.toBe(oldRewards);
      expect(oldRewards).toEqual({ items: [], runeShards: 13, runes: 2, gems: 3, wishstones: 4 });
      expect(state).toMatchObject({ inCombat: true, eventCursor: 0, playbackComplete: false,
        runVictory: false, runDefeat: false, isPaused: false, ironGolemReplayLocked: false });
      expect(next.challengeOrdinal).toBe((previous.challengeOrdinal + 1) % period);
    } finally { stop(); }
  });

  it('never advances the default ordinal for an accepted explicit ordinal', () => {
    const first = start();
    expect(start({ challengeOrdinal: 23 }).challengeOrdinal).toBe(23);
    expect(start().challengeOrdinal).toBe((first.challengeOrdinal + 1) % period);
  });
});


describe('explicit abort ownership and selection cleanup', () => {
  it.each([
    { owner: 'wave', active: true }, { owner: 'restore', active: true },
    { owner: 'wave', active: false }, { owner: 'restore', active: false }
  ] as const)('refuses $owner ownership with active=$active before any transient mutation', ({ owner, active }) => {
    start();
    if (!active) abortSubAreaRun();
    const selection = armIronGolemSelection('hero', 'abort-selection', true);
    const before = stores.map(store => store.getState());
    const notified = vi.fn();
    const stops = [...stores.map(store => store.subscribe(notified)), useIronGolemSelectionStore.subscribe(notified)];
    const wave = owner === 'wave' ? beginWaveTransition(true) : undefined;
    const restore = owner === 'restore' ? reserveWaveRestore() : undefined;
    try {
      expect(() => { abortSubAreaRun(); }).toThrow(WaveGuardError);
      expect(() => { abortSubAreaRun(); }).toThrow(owner === 'wave' ? 'waveBusy' : 'restorePending');
      expect(hasActiveSubAreaRun()).toBe(active);
      stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
      expect(notified).not.toHaveBeenCalled();
    } finally {
      stops.forEach(stop => { stop(); });
      if (wave) endWaveTransition(wave);
      if (restore) releaseWaveRestore(restore);
    }
    abortSubAreaRun();
    expect(hasActiveSubAreaRun()).toBe(false);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
    expect(useCombatStore.getState()).toBe(before[0]); // Recording remains the caller's responsibility.
  });

  it('clears an armed instruction with no active run while preserving the recording and persistent domains', () => {
    start();
    abortSubAreaRun();
    armIronGolemSelection('hero', 'no-run-selection', true);
    const before = stores.map(store => store.getState());
    abortSubAreaRun();
    expect(hasActiveSubAreaRun()).toBe(false);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  });
});
