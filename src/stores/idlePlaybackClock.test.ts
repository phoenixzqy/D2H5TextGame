import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import * as helpers from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { useCombatStore, recordedPlaybackBatch } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { reserveWaveRestore, releaseWaveRestore } from './waveTransitionGuard';
import { createIdlePlaybackClock, type IdlePlaybackClockPlan } from './idlePlaybackClock';

const AREA = 'areas/act1-blood-moor';
let context = { enabled: true, speed: 1, exiting: false };
const clocks: ReturnType<typeof createIdlePlaybackClock>[] = [];

function clock() {
  const instance = createIdlePlaybackClock({ readContext: () => context });
  clocks.push(instance);
  return instance;
}

function finishDrain(instance: ReturnType<typeof clock>, initial: IdlePlaybackClockPlan) {
  let plan = initial;
  for (let count = 0; plan.continuation !== null && count < 200; count++) {
    plan = instance.resumeDrain(plan.continuation);
  }
  expect(plan.continuation).toBeNull();
  return plan;
}

function recording(count: number, gap = 50, intro = false) {
  const events: RecordedBattleEvent[] = Array.from({ length: count }, (_, index) => ({
    kind: 'turn-start', turn: index + 1, simClockMs: index * gap, uiDelayMs: 50
  }));
  if (intro) events.unshift({ kind: 'message', messageKey: 'combat:bossIntro', simClockMs: 0, uiDelayMs: 1200 });
  useCombatStore.setState({ recordedEvents: events, eventCursor: 0, playbackComplete: false });
  return events;
}

function setupFixture() {
  helpers.abortSubAreaRun();
  for (const store of [useCombatStore, usePlayerStore, useInventoryStore, useMercStore,
    useFormationStore, useMapStore, useMetaStore]) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  loadDefaultSkills();
  registerSkill({ id: 'fixture.idle-clock-finisher', archetype: 'fixture', target: 'all-enemies',
    cooldown: 1, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000] }] });
  const hero = createMockPlayer('Clock fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, comboOrder: ['fixture.idle-clock-finisher'] });
  useMapStore.getState().setCurrentLocation(1, AREA);
  useMetaStore.getState().setIdleTarget('a1-blood-moor');
  helpers.startSubAreaRun({ mode: 'idle', runSeed: 7, challengeOrdinal: 0 });
  context = { enabled: true, speed: 1, exiting: false };
}

beforeEach(setupFixture);

afterEach(() => {
  clocks.splice(0).forEach(instance => { instance.dispose(); });
  vi.restoreAllMocks();
  helpers.abortSubAreaRun();
  resetRegistry();
});

describe('transient idle presentation clock', () => {
  it.each([1, 4])('pays intro, warmup and clamped timestamp gaps once at %sx', speed => {
    context.speed = speed;
    const events = recording(3, 10_000, true);
    // Equal timestamps stay one atomic store operation.
    events.splice(2, 0, { kind: 'turn-start', turn: 99, simClockMs: 0, uiDelayMs: 50 });
    const instance = clock();
    expect(instance.wake(0).waitMs).toBe(1200 / speed);
    expect(instance.wake(1200 / speed - 1).waitMs).toBe(1);
    expect(instance.wake(1200 / speed).waitMs).toBe(200 / speed);
    expect(useCombatStore.getState().eventCursor).toBe(1);
    const afterWarmup = 1400 / speed;
    expect(instance.wake(afterWarmup).waitMs).toBe(3000 / speed);
    expect(useCombatStore.getState().eventCursor).toBe(3);
    expect(instance.wake(afterWarmup + 3000 / speed).waitMs).toBe(3000 / speed);
    expect(useCombatStore.getState().eventCursor).toBe(4);
  });

  it.each([[299_999, 5996, 1], [300_000, 5997, 50], [300_001, 5997, 50]])(
    'caps one %sms wake across bounded continuations', (elapsed, cursor, wait) => {
      recording(7000);
      const instance = clock();
      instance.wake(0);
      const first = instance.wake(elapsed);
      expect(useCombatStore.getState().eventCursor).toBe(64);
      expect(first.continuation).not.toBeNull();
      const plan = finishDrain(instance, first);
      expect(useCombatStore.getState().eventCursor).toBe(cursor);
      expect(plan.waitMs).toBe(wait);
      expect(instance.wake(elapsed).waitMs).toBe(wait);
      expect(useCombatStore.getState().eventCursor).toBe(cursor);
    }
  );

  it('keeps unpaid time across redundant render wakes and samples clock rollback with a high water mark', () => {
    recording(100);
    const instance = clock();
    instance.wake(1000);
    expect(instance.wake(1100).waitMs).toBe(100);
    expect(instance.wake(900).waitMs).toBe(100);
    expect(instance.wake(Number.NaN).waitMs).toBe(100);
    expect(instance.wake(1100).waitMs).toBe(100);
    expect(instance.wake(1199).waitMs).toBe(1);
    instance.wake(1200);
    expect(useCombatStore.getState().eventCursor).toBe(1);
  });

  it('preserves a paid partial countdown on Pause and discards all paused elapsed time', () => {
    recording(100);
    const instance = clock();
    instance.wake(0);
    instance.interrupt(80, 'pause');
    useCombatStore.getState().pausePlayback();
    expect(instance.wake(5000).waitMs).toBeNull();
    instance.interrupt(10_000, 'pause');
    useCombatStore.getState().resumePlayback();
    expect(instance.wake(10_000).waitMs).toBe(120);
    expect(instance.wake(10_119).waitMs).toBe(1);
    instance.wake(10_120);
    expect(useCombatStore.getState().eventCursor).toBe(1);
  });

  it('stops a yielded drain synchronously, rejects its callback, and permits a refused exit to resume fresh', () => {
    recording(7000);
    const instance = clock();
    instance.wake(0);
    const old = instance.wake(300_000).continuation;
    assert.ok(old !== null);
    instance.interrupt(300_000, 'stop');
    instance.resumeDrain(old);
    expect(useCombatStore.getState().eventCursor).toBe(64);
    expect(instance.wake(400_000).waitMs).toBe(50);
    instance.wake(400_050);
    expect(useCombatStore.getState().eventCursor).toBe(65);
  });

  it('resets the full pending batch on speed change and attaches Skip to a fresh settle delay', () => {
    recording(100);
    const instance = clock();
    instance.wake(0);
    instance.interrupt(100, 'speed');
    context.speed = 4;
    expect(instance.wake(100).waitMs).toBe(50);
    instance.wake(149);
    expect(useCombatStore.getState().eventCursor).toBe(0);
    instance.interrupt(149, 'skip');
    while (!useCombatStore.getState().playbackComplete) useCombatStore.getState().advanceEvent();
    expect(instance.wake(149).waitMs).toBe(1500);
    instance.interrupt(249, 'speed');
    context.speed = 1;
    expect(instance.wake(249).waitMs).toBe(1400);
  });

  it('retains the partial delay across hydration gates with no loading-time credit', () => {
    recording(100);
    const instance = clock();
    instance.wake(0);
    instance.interrupt(80, 'gate');
    useHydrationStore.getState().setStatus('loading');
    expect(instance.wake(5000).waitMs).toBeNull();
    useHydrationStore.getState().setStatus('ready');
    expect(instance.wake(10_000).waitMs).toBe(120);
    instance.wake(10_120);
    expect(useCombatStore.getState().eventCursor).toBe(1);
  });

  it('drops old debt on external recording replacement and target changes', () => {
    recording(7000);
    const instance = clock();
    instance.wake(0);
    const stale = instance.wake(300_000).continuation;
    assert.ok(stale !== null);
    recording(100);
    expect(instance.resumeDrain(stale).waitMs).toBe(200);
    expect(useCombatStore.getState().eventCursor).toBe(0);
    useMetaStore.getState().setIdleTarget('a1-cold-plains');
    expect(instance.wake(400_000).waitMs).toBeNull();
    expect(useCombatStore.getState().eventCursor).toBe(0);
  });

  it('does not spin or replace a receipt when a transition returns true without progress', () => {
    useCombatStore.setState({ playbackComplete: true, eventCursor: useCombatStore.getState().recordedEvents.length });
    const transition = vi.spyOn(helpers, 'performCombatScreenTransition').mockReturnValue(true);
    const instance = clock();
    instance.wake(0);
    const plan = instance.wake(300_000);
    expect(plan).toMatchObject({ waitMs: null, continuation: null, transitionFailed: true });
    instance.wake(400_000);
    expect(transition).toHaveBeenCalledTimes(1);
  });

  it('reports failed native transitions even when they introduce a receipt recovery gate', () => {
    useCombatStore.setState({ playbackComplete: true, eventCursor: useCombatStore.getState().recordedEvents.length });
    const recovery = vi.spyOn(helpers, 'readCombatTransitionRecovery');
    const transition = vi.spyOn(helpers, 'performCombatScreenTransition').mockImplementation(() => {
      recovery.mockReturnValue({ kind: 'parked', reason: 'settlementFailed' });
      return false;
    });
    const instance = clock();
    instance.wake(0);
    expect(instance.wake(1500)).toMatchObject({ waitMs: null, continuation: null, transitionFailed: true });
    instance.wake(300_000);
    expect(transition).toHaveBeenCalledOnce();
  });

  it('coalesces wakes during an outstanding drain without minting another elapsed allowance', () => {
    recording(7000);
    const instance = clock();
    instance.wake(0);
    const first = instance.wake(300_001);
    const duplicate = instance.wake(300_001);
    expect(duplicate.continuation).toBe(first.continuation);
    expect(useCombatStore.getState().eventCursor).toBe(64);
    finishDrain(instance, duplicate);
    expect(useCombatStore.getState().eventCursor).toBe(5997);
    instance.wake(300_051);
    expect(useCombatStore.getState().eventCursor).toBe(5998);
  });

  it('reads a synchronous Pause observer before another batch and rejects the previous epoch', () => {
    recording(7000);
    const instance = clock();
    instance.wake(0);
    const unsubscribe = useCombatStore.subscribe(state => {
      if (state.eventCursor !== 1 || state.isPaused) return;
      instance.interrupt(300_000, 'pause');
      state.pausePlayback();
    });
    try { expect(instance.wake(300_000).waitMs).toBeNull(); }
    finally { unsubscribe(); }
    expect(useCombatStore.getState().eventCursor).toBe(1);
    useCombatStore.getState().resumePlayback();
    expect(instance.wake(600_000).waitMs).toBe(50);
    expect(useCombatStore.getState().eventCursor).toBe(1);
  });

  it('parks behind failed receipt recovery without executing Retry automatically', () => {
    recording(100);
    const instance = clock();
    instance.wake(0);
    instance.interrupt(80, 'gate');
    const recovery = vi.spyOn(helpers, 'readCombatTransitionRecovery').mockReturnValue({ kind: 'parked', reason: 'settlementFailed' });
    const transition = vi.spyOn(helpers, 'performCombatScreenTransition');
    expect(instance.wake(10_000).waitMs).toBeNull();
    instance.wake(100_000);
    expect(transition).not.toHaveBeenCalled();
    recovery.mockRestore();
    expect(instance.wake(200_000).waitMs).toBe(120);
  });

  it('carries one wake through a qualified native settlement and the next recording', () => {
    const events = useCombatStore.getState().recordedEvents;
    let duration = 0;
    for (let cursor = 0; cursor < events.length;) {
      const batch = recordedPlaybackBatch(events, cursor);
      assert.ok(batch);
      duration += batch.delayMs;
      cursor = batch.end;
    }
    const instance = clock();
    instance.wake(0);
    const playerBefore = usePlayerStore.getState().player;
    assert.ok(playerBefore);
    const before = playerBefore.experience;
    finishDrain(instance, instance.wake(duration + 1500 + 200));
    expect(useCombatStore.getState().currentWave).toBe(2);
    expect(useCombatStore.getState().eventCursor).toBeGreaterThan(0);
    const playerAfter = usePlayerStore.getState().player;
    assert.ok(playerAfter);
    expect(playerAfter.experience).not.toBe(before);
    const earned = useCombatStore.getState().runRewards;
    instance.wake(duration + 1500 + 200);
    expect(useCombatStore.getState().runRewards).toBe(earned);
  });

  it('matches timely native playback after a delayed wake spans settlement and a new recording', () => {
    // Frozen unit-fixture clock/seed keeps both native inputs identical; production
    // award time and start seed generation remain inside their ordinary helpers.
    vi.spyOn(Date, 'now').mockReturnValue(1_793_304_000_000);
    setupFixture();
    const opening = useCombatStore.getState().recordedEvents;
    let firstDuration = 0;
    for (let cursor = 0; cursor < opening.length;) {
      const batch = recordedPlaybackBatch(opening, cursor);
      assert.ok(batch);
      firstDuration += batch.delayMs;
      cursor = batch.end;
    }
    const elapsed = firstDuration + 1500 + 225;
    const timely = clock();
    let now = 0;
    let plan = timely.wake(now);
    while (plan.waitMs !== null && now + plan.waitMs <= elapsed) {
      now += plan.waitMs;
      plan = finishDrain(timely, timely.wake(now));
    }
    const timelyPlan = timely.wake(elapsed);
    function snapshot() {
      const state = useCombatStore.getState();
      return structuredClone({ currentWave: state.currentWave, eventCursor: state.eventCursor,
        playbackComplete: state.playbackComplete, playerTeam: state.playerTeam,
        enemyTeam: state.enemyTeam, recordedEvents: state.recordedEvents });
    }
    const expected = snapshot();
    expect(expected.currentWave).toBe(2);
    expect(expected.eventCursor).toBeGreaterThan(0);
    timely.dispose();
    setupFixture();
    const delayed = clock();
    delayed.wake(0);
    const delayedPlan = finishDrain(delayed, delayed.wake(elapsed));
    expect(snapshot()).toEqual(expected);
    expect(delayedPlan).toEqual(timelyPlan);
  });

  it('uses an unscaled repeat wait and refuses a repeat reset under restore ownership', () => {
    while (helpers.hasActiveSubAreaRun()) {
      while (!useCombatStore.getState().playbackComplete) useCombatStore.getState().advanceEvent();
      helpers.advanceWaveOrFinish();
    }
    expect(useCombatStore.getState().runVictory).toBe(true);
    context.speed = 4;
    const instance = clock();
    expect(instance.wake(0).waitMs).toBe(1500);
    const before = useCombatStore.getState();
    const lease = reserveWaveRestore();
    try { expect(instance.wake(1500).transitionFailed).toBe(true); }
    finally { releaseWaveRestore(lease); }
    expect(useCombatStore.getState()).toBe(before);
  });

  it('carries only the current wake remainder from settled full victory into an ordinary repeat', () => {
    while (helpers.hasActiveSubAreaRun()) {
      while (!useCombatStore.getState().playbackComplete) useCombatStore.getState().advanceEvent();
      helpers.advanceWaveOrFinish();
    }
    context.speed = 4;
    const start = vi.spyOn(helpers, 'performCombatScreenTransition');
    const instance = clock();
    instance.wake(0);
    expect(instance.wake(1499).waitMs).toBe(1);
    const previous = useCombatStore.getState().recordedEvents;
    expect(instance.wake(1550).waitMs).toBeGreaterThan(0);
    expect(start).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledWith({ kind: 'start', options: { mode: 'idle' } });
    expect(useCombatStore.getState().recordedEvents).not.toBe(previous);
    expect(useCombatStore.getState().eventCursor).toBeGreaterThan(0);
    expect(useCombatStore.getState().runVictory).toBe(false);
  });

  it('preserves earlier settled rewards when the next qualified native wave is a nonwin', () => {
    const instance = clock();
    instance.wake(0);
    let now = 0;
    // One timely native first-wave settlement, without changing its recording.
    while (useCombatStore.getState().currentWave === 1) {
      const plan = instance.wake(now);
      now += plan.waitMs ?? 0;
      instance.wake(now);
    }
    const earned = useCombatStore.getState().runRewards;
    const playerBefore = usePlayerStore.getState().player;
    assert.ok(playerBefore);
    const xp = playerBefore.experience;
    // Explicit native replay after removing the fixture finisher creates an
    // ordinary low-power loss; settlement still uses its own exact receipt.
    resetRegistry();
    loadDefaultSkills();
    helpers.refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(useCombatStore.getState().outcome?.winner).not.toBe('player');
    instance.interrupt(now, 'skip');
    while (!useCombatStore.getState().playbackComplete) useCombatStore.getState().advanceEvent();
    expect(instance.wake(now).waitMs).toBe(1500);
    expect(finishDrain(instance, instance.wake(now + 1500)).waitMs).toBeNull();
    expect(useCombatStore.getState().runDefeat).toBe(true);
    expect(useCombatStore.getState().runRewards).toBe(earned);
    const playerAfter = usePlayerStore.getState().player;
    assert.ok(playerAfter);
    expect(playerAfter.experience).toBe(xp);
    expect(useMetaStore.getState().idleState.idleTarget).toBeUndefined();
  });

  it('handles terminal ownership refusal without clearing idle or throwing through the host timer', () => {
    while (!useCombatStore.getState().playbackComplete) useCombatStore.getState().advanceEvent();
    useCombatStore.getState().markRunDefeat();
    const instance = clock();
    const lease = reserveWaveRestore();
    try { expect(instance.wake(0)).toMatchObject({ waitMs: null, transitionFailed: true }); }
    finally { releaseWaveRestore(lease); }
    expect(useMetaStore.getState().idleState.idleTarget).toBe('a1-blood-moor');
    expect(useCombatStore.getState().runDefeat).toBe(true);
  });

  it('admits idle once without pre-admission credit and disposal rejects every stale wake', () => {
    helpers.abortSubAreaRun();
    useCombatStore.getState().endCombat();
    const transition = vi.spyOn(helpers, 'performCombatScreenTransition');
    const instance = clock();
    const plan = instance.wake(300_000);
    expect(transition).toHaveBeenCalledTimes(1);
    expect(transition).toHaveBeenCalledWith({ kind: 'start', options: { mode: 'idle' } });
    expect(plan.waitMs).toBe(200);
    expect(useCombatStore.getState().eventCursor).toBe(0);
    const run = combatRunLifecycle.activeRun;
    instance.dispose();
    expect(instance.wake(600_000).waitMs).toBeNull();
    expect(combatRunLifecycle.activeRun).toBe(run);
    expect(transition).toHaveBeenCalledTimes(1);
  });

  it('restarts an intentionally reset presentation through native admission even when the run holder remains', () => {
    const previous = combatRunLifecycle.activeRun;
    useCombatStore.getState().endCombat();
    expect(combatRunLifecycle.activeRun).toBe(previous);
    const transition = vi.spyOn(helpers, 'performCombatScreenTransition');
    const instance = clock();
    expect(instance.wake(300_000).waitMs).toBe(200);
    expect(transition).toHaveBeenCalledOnce();
    expect(combatRunLifecycle.activeRun).not.toBe(previous);
    expect(useCombatStore.getState().eventCursor).toBe(0);
  });
});
