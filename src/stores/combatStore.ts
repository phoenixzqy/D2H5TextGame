/**
 * Combat store
 * Manages active combat state, log, and recorded-event playback.
 */

import { create } from 'zustand';
import type { CombatUnit } from '@/engine/combat/types';
import type { WavePresentation } from '@/engine/combat';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatSide } from '@/engine/combat/types';
import type { KillRewards } from '@/engine/loot/award';
import { mergeRewards } from '@/engine/loot/reward-plan';
import { withDefaultGridPositions } from '@/engine/combat/grid';
import { applyEventToTeams, overlayStatusPresentation, type StatusPlaybackState } from './combatPlayback';
import { eventToLocalizedLogEntry } from './eventToLogI18n';
import { resolveSummonDisplayName } from './summonDisplayName';
import { stageRecordedBattle, type RecordedBattleInput, type RecordedBattlePublication } from './recordedBattlePublication';
import { assertRecordedWavePlaybackAllowed } from './recordedWaveAccess';

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'death' | 'skill' | 'system';
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  message: string;
  value?: number;
}

/** Mapping of unit ids → display names for log rendering. */
export type UnitNameMap = ReadonlyMap<string, string>;

/** Final battle outcome attached to the recorded battle. */
export interface RecordedBattleOutcome {
  readonly winner: CombatSide | null;
  readonly finalPlayerTeam: readonly CombatUnit[];
  readonly finalEnemyTeam: readonly CombatUnit[];
  readonly rewards?: KillRewards;
}

interface CombatState {
  inCombat: boolean;
  playerTeam: CombatUnit[];
  enemyTeam: CombatUnit[];
  log: CombatLogEntry[];
  currentTurn: number;
  currentWave: number;
  totalWaves: number;
  currentWavePresentation: WavePresentation | null;
  isPaused: boolean;
  autoMode: boolean;

  // Recorded-event playback
  recordedEvents: readonly RecordedBattleEvent[];
  eventCursor: number;
  playbackComplete: boolean;
  unitNameMap: UnitNameMap;
  outcome: RecordedBattleOutcome | null;
  /** Copied battle-local status views; null for recordings without transport. */
  statusPlayback: StatusPlaybackState | null;
  /** Transient recording-level Iron lock; never included in saved game data. */
  ironGolemReplayLocked: boolean;

  /**
   * Identifier of the active sub-area run, or null when the combat
   * screen is showing a one-off / synthetic battle. Used by the UI's
   * "Continue to next sub-area" CTA on full-run victory.
   */
  subAreaRunId: string | null;
  /** True when every wave was won with the original hero alive. */
  runVictory: boolean;
  /** True when a wave was not won or the original hero died, including draws. */
  runDefeat: boolean;
  /** Accumulated rewards summary across every wave in the active run. */
  runRewards: KillRewards;

  // Actions
  startCombat: (playerTeam: CombatUnit[], enemyTeam: CombatUnit[], totalWaves: number) => void;
  endCombat: () => void;
  addLogEntry: (entry: Omit<CombatLogEntry, 'id' | 'timestamp'>) => void;
  clearLog: () => void;
  nextTurn: () => void;
  nextWave: (newEnemies: CombatUnit[]) => void;
  updateUnit: (unitId: string, updater: (unit: CombatUnit) => CombatUnit) => void;
  /** Toggle playback pause; refuses active ownership or unpublished receipt phases. */
  togglePause: () => void;
  toggleAutoMode: () => void;
  reset: () => void;

  /**
   * Install a recorded battle. Initializes playback state with the
   * provided initial teams (cursor 0) and stores the final state +
   * rewards for use when playback completes.
   */
  setRecordedBattle: (input: RecordedBattleInput) => void;
  /**
   * Install exact staged references in one update, without normalization/defaults.
   * Observer errors may follow installation; callers must inspect live state.
   */
  publishStagedRecordedBattle: (publication: RecordedBattlePublication) => void;
  /** Mark the active sub-area run as fully cleared. */
  markRunVictory: () => void;
  /** Mark the active sub-area run as failed; the raw engine winner is retained. */
  markRunDefeat: () => void;
  /** Add the most recent wave's rewards into the run-aggregate counter. */
  accumulateRunRewards: (rewards: KillRewards) => void;
  /** Reset the run-aggregate rewards (called when starting a new run). */
  resetRunRewards: () => void;
  /** Check ownership/receipt phase, then publish one timestamp batch; paused/complete is inert. */
  advanceEvent: () => void;
  /** Alias for {@link advanceEvent} kept for UI timer ergonomics. */
  tick: () => void;
  /** Pause playback; throws typed ownership/receipt refusals before changing state. */
  pausePlayback: () => void;
  /** Resume playback; throws typed ownership/receipt refusals before changing state. */
  resumePlayback: () => void;
}

/**
 * Bounds and presentation delay of the next atomic simulation timestamp group.
 * Only a leading boss intro is separate; engine warmup and speed apply once.
 */
export function recordedPlaybackBatch(
  events: readonly RecordedBattleEvent[], cursor: number, speed = 1
): { readonly end: number; readonly delayMs: number } | null {
  const next = events[cursor];
  if (!next) return null;
  const first = events[0];
  const hasIntro = first?.kind === 'message' && first.messageKey === 'combat:bossIntro';
  const isIntro = cursor === 0 && hasIntro;
  let end = cursor + 1;
  if (!isIntro) {
    while (end < events.length && events[end]?.simClockMs === next.simClockMs) end++;
  }
  const previous = events[cursor - 1];
  const delay = isIntro ? 1200 : cursor === 0 || (cursor === 1 && hasIntro) ? 200
    : Math.max(50, Math.min(3000, next.simClockMs - (previous?.simClockMs ?? 0)));
  return { end, delayMs: Math.max(50, Math.floor(delay / speed)) };
}


/** Empty {@link KillRewards} value used to seed run-aggregate state. */
function emptyRewards(): KillRewards {
  return { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} };
}

const initialState = {
  inCombat: false,
  playerTeam: [] as CombatUnit[],
  enemyTeam: [] as CombatUnit[],
  log: [] as CombatLogEntry[],
  currentTurn: 0,
  currentWave: 1,
  totalWaves: 1,
  currentWavePresentation: null as WavePresentation | null,
  isPaused: false,
  autoMode: true,
  recordedEvents: [] as readonly RecordedBattleEvent[],
  eventCursor: 0,
  playbackComplete: false,
  unitNameMap: new Map() as UnitNameMap,
  outcome: null as RecordedBattleOutcome | null,
  statusPlayback: null as StatusPlaybackState | null,
  ironGolemReplayLocked: false,
  subAreaRunId: null as string | null,
  runVictory: false,
  runDefeat: false,
  runRewards: emptyRewards()
};

// Delegate to the shared i18n-aware converter; kept as a thin alias so
// the call site below stays readable.
function eventToLogEntry(
  event: RecordedBattleEvent,
  unitMap: UnitNameMap
): Omit<CombatLogEntry, 'id' | 'timestamp'> | null {
  return eventToLocalizedLogEntry(event, unitMap);
}

export const useCombatStore= create<CombatState>((set, get) => ({
  ...initialState,

  startCombat: (playerTeam, enemyTeam, totalWaves) => { set({
    inCombat: true,
    playerTeam: withDefaultGridPositions(playerTeam),
    enemyTeam: withDefaultGridPositions(enemyTeam),
    totalWaves,
    currentWave: 1,
    currentWavePresentation: null,
    currentTurn: 0,
    log: [],
    isPaused: false,
    recordedEvents: [],
    eventCursor: 0,
    playbackComplete: false,
    outcome: null,
    statusPlayback: null,
    ironGolemReplayLocked: false
  }); },

    // Bug #1 (P0) - reset all run state on endCombat
  endCombat: () => { set({
    inCombat: false,
    playerTeam: [],
    enemyTeam: [],
    log: [],
    currentTurn: 0,
    currentWave: 1,
    totalWaves: 1,
    currentWavePresentation: null,
    isPaused: false,
    recordedEvents: [],
    eventCursor: 0,
    playbackComplete: false,
    unitNameMap: new Map(),
    outcome: null,
    statusPlayback: null,
    ironGolemReplayLocked: false,
    subAreaRunId: null,
    runVictory: false,
    runDefeat: false,
    runRewards: emptyRewards()
  }); },

  addLogEntry: (entry) => { set((state) => ({
    log: [
      ...state.log,
      {
        ...entry,
        id: `${String(Date.now())}-${String(Math.random())}`,
        timestamp: Date.now()
      }
    ].slice(-200) // Keep last 200 entries
  })); },

  clearLog: () => { set({ log: [] }); },

  nextTurn: () => { set((state) => ({
    currentTurn: state.currentTurn + 1
  })); },

  nextWave: (newEnemies) => { set((state) => ({
    currentWave: state.currentWave + 1,
    enemyTeam: withDefaultGridPositions(newEnemies),
    currentWavePresentation: null,
    currentTurn: 0,
    statusPlayback: null,
    ironGolemReplayLocked: false
  })); },

  updateUnit: (unitId, updater) => { set((state) => ({
    playerTeam: state.playerTeam.map((u) => (u.id === unitId ? updater(u) : u)),
    enemyTeam: state.enemyTeam.map((u) => (u.id === unitId ? updater(u) : u))
  })); },

  togglePause: () => { assertRecordedWavePlaybackAllowed(); set((state) => ({
    isPaused: !state.isPaused
  })); },

  toggleAutoMode: () => { set((state) => ({
    autoMode: !state.autoMode
  })); },

  reset: () => { set(initialState); },

  setRecordedBattle: input => {
    const publication = stageRecordedBattle(input, get());
    set(publication);
  },
  publishStagedRecordedBattle: publication => { set(publication); },

  markRunVictory: () => { set({ runVictory: true, runDefeat: false }); },
  markRunDefeat: () => { set({ runDefeat: true, runVictory: false }); },

  accumulateRunRewards: (rewards) => { set((state) => ({
    runRewards: mergeRewards(state.runRewards, rewards)
  })); },
  resetRunRewards: () => { set({ runRewards: emptyRewards() }); },

  advanceEvent: () => {
    assertRecordedWavePlaybackAllowed();
    const state = get();
    if (state.isPaused || state.playbackComplete) return;
    const batch = recordedPlaybackBatch(state.recordedEvents, state.eventCursor);
    if (!batch) {
      set({ playbackComplete: true });
      return;
    }
    let playerTeam = state.playerTeam;
    let enemyTeam = state.enemyTeam;
    let statusPlayback = state.statusPlayback;
    let nameMap = state.unitNameMap;
    let log = state.log;
    let currentTurn = state.currentTurn;
    for (let idx = state.eventCursor; idx < batch.end; idx++) {
      const ev = state.recordedEvents[idx];
      if (!ev) continue;
      const stepped = applyEventToTeams(playerTeam, enemyTeam, ev, statusPlayback);
      playerTeam = stepped.playerTeam as CombatUnit[];
      enemyTeam = stepped.enemyTeam as CombatUnit[];
      statusPlayback = stepped.statusPlayback ?? null;
      // Summon names must be available to later events in this same batch.
      if (ev.kind === 'summon' && !nameMap.has(ev.unit.id)) {
        const next = new Map(nameMap);
        next.set(ev.unit.id, resolveSummonDisplayName(ev.unit));
        nameMap = next;
      }
      const entry = eventToLogEntry(ev, nameMap);
      if (entry) log = [...log, { ...entry, id: `${String(idx)}-${String(ev.kind)}`, timestamp: Date.now() }].slice(-200);
      if (ev.kind === 'turn-start') currentTurn = ev.turn;
    }
    const finished = batch.end >= state.recordedEvents.length;
    // Snap resources only after folding the complete terminal timestamp group.
    if (finished && state.outcome) {
      playerTeam = statusPlayback ? overlayStatusPresentation(state.outcome.finalPlayerTeam, statusPlayback)
        : [...state.outcome.finalPlayerTeam];
      enemyTeam = statusPlayback ? overlayStatusPresentation(state.outcome.finalEnemyTeam, statusPlayback)
        : [...state.outcome.finalEnemyTeam];
    }
    set({ playerTeam, enemyTeam, statusPlayback, unitNameMap: nameMap, log, currentTurn,
      eventCursor: batch.end, playbackComplete: finished });
  },


  tick: () => { get().advanceEvent(); },

  pausePlayback: () => { assertRecordedWavePlaybackAllowed(); set({ isPaused: true }); },
  resumePlayback: () => { assertRecordedWavePlaybackAllowed(); set({ isPaused: false }); }
}));
