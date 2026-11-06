import { recordedPlaybackBatch, useCombatStore } from './combatStore';
import { combatRunLifecycle } from './combatRunLifecycle';
import { performCombatScreenTransition, readCombatRunOrigin, readCombatTransitionRecovery } from './combatHelpers';
import { useHydrationStore } from './hydrationStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { usePlayerStore } from './playerStore';
import { assertRecordedWaveNewTransitionAllowed, RecordedWaveAccessError } from './recordedWaveAccess';
import { resetIdleEliteMisses } from './idleElitePity';
import { WaveGuardError } from './waveTransitionGuard';

/** Timer ownership stays with the mounted screen; continuation tokens never sample time. */
export interface IdlePlaybackClockPlan {
  readonly waitMs: number | null;
  readonly continuation: number | null;
  readonly countingDown: boolean;
  readonly transitionFailed: boolean;
}

/** Synchronous user/gate boundaries invalidate outstanding callbacks before store actions. */
export type IdlePlaybackClockInterruptReason = 'pause' | 'speed' | 'skip' | 'stop' | 'gate';

interface Context { readonly enabled: boolean; readonly speed: number; readonly exiting: boolean }
type Combat = ReturnType<typeof useCombatStore.getState>;
type Run = typeof combatRunLifecycle.activeRun;
interface Frontier {
  readonly events: Combat['recordedEvents'];
  readonly cursor: number;
  readonly complete: boolean;
  readonly victory: boolean;
  readonly defeat: boolean;
  readonly inCombat: boolean;
  readonly wave: number;
  readonly run: Run;
}
interface Phase {
  readonly kind: 'batch' | 'settle' | 'repeat';
  readonly frontier: Frontier;
  remaining: number;
}

const MAX_WAKE_MS = 300_000;
const MAX_PHASES = 64;
const canonical = (id: string) => id.replace(/^areas\/act([1-5])-/, 'a$1-');

function frontier(combat: Combat): Frontier {
  return { events: combat.recordedEvents, cursor: combat.eventCursor, complete: combat.playbackComplete,
    victory: combat.runVictory, defeat: combat.runDefeat, inCombat: combat.inCombat,
    wave: combat.currentWave, run: combatRunLifecycle.activeRun };
}

function sameFrontier(a: Frontier, b: Frontier): boolean {
  return a.events === b.events && a.cursor === b.cursor && a.complete === b.complete &&
    a.victory === b.victory && a.defeat === b.defeat && a.inCombat === b.inCombat &&
    a.wave === b.wave && a.run === b.run;
}

/**
 * One transient ordinary-area idle owner. Spends elapsed time on the existing
 * recorded presentation schedule; native transitions retain all gameplay authority.
 * The host supplies wall time, owns timers/listeners and disposes on unmount.
 */
export function createIdlePlaybackClock({ readContext }: { readonly readContext: () => Context }) {
  let phase: Phase | null = null;
  let owner: string | null = null;
  let lastSample: number | null = null;
  let speed = 1;
  let epoch = 0;
  let budget = 0;
  let pending = false;
  let queuedNow: number | null = null;
  let draining = false;
  let suspended = true;
  let disposed = false;
  let failed = false;
  let sawDisabled = false;
  let resetBatch = false;
  let failedFrontier: Frontier | null = null;

  function readLive() {
    const context = readContext();
    const combat = useCombatStore.getState();
    const map = useMapStore.getState();
    const target = useMetaStore.getState().idleState.idleTarget;
    const origin = readCombatRunOrigin();
    const current = frontier(combat);
    const matches = Boolean(target && map.currentSubAreaId && canonical(target) === canonical(map.currentSubAreaId));
    const ordinary = origin === null ? !combat.inCombat && current.run === null
      : origin.kind === 'area' && origin.questEncounter === undefined && origin.replayProfileId === map.selectedDifficulty;
    const eligible = Boolean(usePlayerStore.getState().player) && matches && ordinary && (current.run === null || current.run.mode === 'idle') &&
      (!combat.inCombat || combat.subAreaRunId !== null && canonical(combat.subAreaRunId) === canonical(map.currentSubAreaId ?? ''));
    return { context, combat, current, eligible,
      key: eligible ? `${String(map.currentAct)}:${canonical(map.currentSubAreaId ?? '')}:${map.selectedDifficulty}` : null,
      ready: context.enabled && !context.exiting && !combat.isPaused &&
        useHydrationStore.getState().status === 'ready' && readCombatTransitionRecovery().kind === 'ready' };
  }

  function reanchor(now: number) {
    if (Number.isFinite(now)) lastSample = lastSample === null ? now : Math.max(lastSample, now);
  }

  function sample(now: number): number {
    if (!Number.isFinite(now)) return 0;
    if (lastSample === null) { lastSample = now; return 0; }
    if (now < lastSample) return 0;
    const elapsed = Math.min(MAX_WAKE_MS, now - lastSample);
    lastSample = now; // Discard excess, including across wave/run replacements.
    return elapsed;
  }

  function dropDebt() {
    epoch++;
    budget = 0;
    pending = false;
    queuedNow = null;
  }

  function arm(current: Frontier) {
    if (current.victory) phase = { kind: 'repeat', frontier: current, remaining: 1500 };
    else if (current.complete && current.run !== null) phase = { kind: 'settle', frontier: current, remaining: 1500 };
    else if (current.inCombat && !current.complete) {
      const batch = recordedPlaybackBatch(current.events, current.cursor, speed);
      phase = batch ? { kind: 'batch', frontier: current, remaining: batch.delayMs } : null;
    } else phase = null;
  }

  function plan(): IdlePlaybackClockPlan {
    const live = readLive();
    const runnable = !disposed && live.eligible && live.ready && !failed;
    return { waitMs: runnable && !pending ? phase?.remaining ?? null : null,
      continuation: runnable && pending ? epoch : null,
      countingDown: runnable && phase?.kind === 'settle', transitionFailed: failed };
  }

  function synchronize(now: number) {
    const live = readLive();
    if (!live.context.enabled) sawDisabled = true;
    if (failed && (sawDisabled && live.context.enabled || failedFrontier && !sameFrontier(failedFrontier, live.current))) {
      failed = false; failedFrontier = null; sawDisabled = false;
    }
    if (owner !== live.key || phase && !sameFrontier(phase.frontier, live.current)) {
      owner = live.key;
      dropDebt();
      arm(live.current);
      suspended = true;
    }
    const nextSpeed = Number.isFinite(live.context.speed) && live.context.speed > 0 ? live.context.speed : 1;
    if (nextSpeed !== speed || resetBatch) {
      speed = nextSpeed;
      resetBatch = false;
      dropDebt();
      if (phase?.kind === 'batch') arm(live.current);
      suspended = true;
    }
    if (!live.eligible || !live.ready || failed) {
      dropDebt();
      suspended = true;
      reanchor(now);
      return null;
    }
    if (suspended) { reanchor(now); suspended = false; }
    if (!phase) arm(live.current);
    return live;
  }

  function park(failure: boolean) {
    dropDebt();
    suspended = true;
    failed = failure;
    failedFrontier = failure ? frontier(useCombatStore.getState()) : null;
    sawDisabled = false;
  }

  function action(kind: 'batch' | 'settle' | 'repeat' | 'start', before: ReturnType<typeof readLive>): boolean {
    const generation = epoch;
    let accepted: boolean;
    try {
      if (kind === 'batch') { useCombatStore.getState().tick(); accepted = true; }
      else if (kind === 'settle') accepted = performCombatScreenTransition({ kind: 'advance' });
      else {
        if (kind === 'repeat') {
          // endCombat itself is an unguarded presentation reset.
          assertRecordedWaveNewTransitionAllowed();
          if (epoch !== generation || !readLive().ready || readLive().key !== before.key) return false;
          useCombatStore.getState().endCombat();
          if (epoch !== generation || !readLive().ready || readLive().key !== before.key) return false;
        }
        accepted = performCombatScreenTransition({ kind: 'start', options: { mode: 'idle' } });
      }
    } catch (error) {
      if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) {
        park(!(error instanceof WaveGuardError && error.code === 'hydrationNotReady'));
        return false;
      }
      park(true);
      throw error;
    }
    if (epoch !== generation) return false;
    const after = readLive();
    if (!accepted) { park(true); return false; }
    if (!after.eligible || !after.ready || after.key !== before.key) { park(false); return false; }
    const previous = before.current, current = after.current;
    const progressed = kind === 'batch'
      ? current.events === previous.events && current.run === previous.run && current.wave === previous.wave &&
        current.cursor === recordedPlaybackBatch(previous.events, previous.cursor)?.end
      : kind === 'settle'
        ? current.events !== previous.events && current.run === previous.run && current.wave === previous.wave + 1 && current.cursor === 0 ||
          current.events === previous.events && (current.victory || current.defeat) && current.run === null
        : current.inCombat && current.run !== null && current.events !== previous.events;
    if (!progressed) { park(true); return false; }
    arm(current); // Only a recognized owned replacement keeps this wake's remainder.
    return true;
  }

  function drain(): IdlePlaybackClockPlan {
    draining = true;
    pending = false;
    try {
      let completed = 0;
      while (!disposed) {
        const live = synchronize(lastSample ?? Number.NaN);
        if (!live) break;
        if (live.current.defeat) {
          assertRecordedWaveNewTransitionAllowed();
          const generation = epoch;
          useMetaStore.getState().setIdleTarget(undefined);
          if (epoch === generation) resetIdleEliteMisses();
          phase = null; dropDebt(); break;
        }
        if (!live.current.inCombat && !live.current.victory) {
          // Initial admission never receives time from before its first recording.
          budget = 0;
          if (!action('start', live)) break;
        }
        if (!phase) break;
        if (completed >= MAX_PHASES) { pending = budget > 0; break; }
        if (budget < phase.remaining) { phase.remaining -= budget; budget = 0; break; }
        budget -= phase.remaining;
        phase.remaining = 0;
        const kind = phase.kind;
        if (!action(kind, live)) break;
        completed++;
      }
      if (queuedNow !== null && !failed && !disposed) pending = true;
      return plan();
    } catch (error) {
      if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) {
        park(!(error instanceof WaveGuardError && error.code === 'hydrationNotReady'));
        return plan();
      }
      park(true);
      throw error;
    } finally { draining = false; }
  }

  return {
    /** Sample one capped newly observed interval, or queue it behind the owned drain. */
    wake(now: number): IdlePlaybackClockPlan {
      if (disposed) return plan();
      if (draining || pending) {
        if (Number.isFinite(now)) queuedNow = queuedNow === null ? now : Math.max(queuedNow, now);
        // Still observe external controls/frontier replacement before a continuation.
        if (!draining) synchronize(now);
        return plan();
      }
      if (!synchronize(now)) return plan();
      budget = sample(now);
      return drain();
    },
    /** Continue at most 64 phases of the same wake without granting another cap. */
    resumeDrain(token: number): IdlePlaybackClockPlan {
      if (disposed || token !== epoch || !pending) return plan();
      if (!synchronize(lastSample ?? Number.NaN)) return plan();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- synchronize can clear pending through dropDebt.
      if (!pending) return plan();
      if (budget === 0 && queuedNow !== null) {
        const now = queuedNow; queuedNow = null;
        budget = sample(now);
      }
      return drain();
    },
    /** Pay only the current countdown; never execute a due action during a control. */
    interrupt(now: number, reason: IdlePlaybackClockInterruptReason): void {
      if (disposed) return;
      if (!suspended && phase && (reason === 'pause' || reason === 'gate' || reason === 'speed')) {
        phase.remaining = Math.max(0, phase.remaining - sample(now));
      }
      if (reason === 'skip' || reason === 'stop') phase = null;
      if (reason === 'speed') resetBatch = true;
      dropDebt();
      suspended = true;
      reanchor(now);
    },
    /** End this mount's lifetime; no credit or callbacks survive disposal. */
    dispose(): void { disposed = true; phase = null; dropDebt(); }
  };
}
