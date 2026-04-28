/**
 * Combat store
 * Manages active combat state, log, and recorded-event playback.
 */

import { create } from 'zustand';
import type { CombatUnit } from '@/engine/combat/types';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatSide } from '@/engine/combat/types';
import type { KillRewards } from '@/engine/loot/award';
import { applyEventToTeams } from './combatPlayback';

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
  isPaused: boolean;
  autoMode: boolean;

  // Recorded-event playback
  recordedEvents: readonly RecordedBattleEvent[];
  eventCursor: number;
  playbackComplete: boolean;
  unitNameMap: UnitNameMap;
  outcome: RecordedBattleOutcome | null;

  // Actions
  startCombat: (playerTeam: CombatUnit[], enemyTeam: CombatUnit[], totalWaves: number) => void;
  endCombat: () => void;
  addLogEntry: (entry: Omit<CombatLogEntry, 'id' | 'timestamp'>) => void;
  clearLog: () => void;
  nextTurn: () => void;
  nextWave: (newEnemies: CombatUnit[]) => void;
  updateUnit: (unitId: string, updater: (unit: CombatUnit) => CombatUnit) => void;
  togglePause: () => void;
  toggleAutoMode: () => void;
  reset: () => void;

  /**
   * Install a recorded battle. Initializes playback state with the
   * provided initial teams (cursor 0) and stores the final state +
   * rewards for use when playback completes.
   */
  setRecordedBattle: (input: {
    initialPlayerTeam: readonly CombatUnit[];
    initialEnemyTeam: readonly CombatUnit[];
    events: readonly RecordedBattleEvent[];
    unitNameMap: UnitNameMap;
    outcome: RecordedBattleOutcome;
  }) => void;
  /** Advance the cursor by one event (no-op when paused or complete). */
  advanceEvent: () => void;
  /** Alias for {@link advanceEvent} kept for UI timer ergonomics. */
  tick: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
}

const initialState = {
  inCombat: false,
  playerTeam: [] as CombatUnit[],
  enemyTeam: [] as CombatUnit[],
  log: [] as CombatLogEntry[],
  currentTurn: 0,
  currentWave: 1,
  totalWaves: 1,
  isPaused: false,
  autoMode: true,
  recordedEvents: [] as readonly RecordedBattleEvent[],
  eventCursor: 0,
  playbackComplete: false,
  unitNameMap: new Map() as UnitNameMap,
  outcome: null as RecordedBattleOutcome | null
};

// Local: build a log entry from event without circular import on combatHelpers.
function eventToLogEntry(
  event: RecordedBattleEvent,
  unitMap: UnitNameMap
): Omit<CombatLogEntry, 'id' | 'timestamp'> | null {
  const getName = (id: string): string => unitMap.get(id) ?? id;

  switch (event.kind) {
    case 'turn-start':
      return {
        type: 'system',
        actorId: 'system',
        actorName: 'System',
        message: `Turn ${String(event.turn)} starts`
      };
    case 'action': {
      const actorName = getName(event.actor);
      return {
        type: 'skill',
        actorId: event.actor,
        actorName,
        message: `${actorName} uses ${event.skillId ?? 'basic attack'}`
      };
    }
    case 'damage': {
      const sourceName = getName(event.source);
      const targetName = getName(event.target);
      return {
        type: 'damage',
        actorId: event.source,
        actorName: sourceName,
        targetId: event.target,
        targetName,
        message: `${sourceName} deals ${String(event.amount)} ${event.damageType} damage to ${targetName}${event.crit ? ' (CRIT!)' : ''}${event.dodged ? ' (DODGED)' : ''}`,
        value: event.amount
      };
    }
    case 'death': {
      const targetName = getName(event.target);
      return {
        type: 'death',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} has died`
      };
    }
    case 'heal': {
      const targetName = getName(event.target);
      return {
        type: 'heal',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} heals for ${String(event.amount)}`,
        value: event.amount
      };
    }
    case 'buff': {
      const targetName = getName(event.target);
      return {
        type: 'buff',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} gains ${event.buffId}`
      };
    }
    case 'status': {
      const targetName = getName(event.target);
      return {
        type: 'debuff',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} is afflicted with ${event.statusId}`
      };
    }
    case 'stunned': {
      const targetName = getName(event.target);
      return {
        type: 'system',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} is stunned and cannot act`
      };
    }
    case 'dot': {
      const targetName = getName(event.target);
      return {
        type: 'damage',
        actorId: event.target,
        actorName: targetName,
        message: `${targetName} takes ${String(event.amount)} DoT damage`,
        value: event.amount
      };
    }
    case 'end':
      return {
        type: 'system',
        actorId: 'system',
        actorName: 'System',
        message: event.winner ? `${event.winner} side wins!` : 'Battle ended in a draw'
      };
    default:
      return null;
  }
}

export const useCombatStore = create<CombatState>((set, get) => ({
  ...initialState,

  startCombat: (playerTeam, enemyTeam, totalWaves) => { set({
    inCombat: true,
    playerTeam,
    enemyTeam,
    totalWaves,
    currentWave: 1,
    currentTurn: 0,
    log: [],
    isPaused: false,
    recordedEvents: [],
    eventCursor: 0,
    playbackComplete: false,
    outcome: null
  }); },

  endCombat: () => { set({
    inCombat: false,
    playerTeam: [],
    enemyTeam: [],
    currentTurn: 0,
    recordedEvents: [],
    eventCursor: 0,
    playbackComplete: false,
    outcome: null
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
    enemyTeam: newEnemies,
    currentTurn: 0
  })); },

  updateUnit: (unitId, updater) => { set((state) => ({
    playerTeam: state.playerTeam.map((u) => (u.id === unitId ? updater(u) : u)),
    enemyTeam: state.enemyTeam.map((u) => (u.id === unitId ? updater(u) : u))
  })); },

  togglePause: () => { set((state) => ({
    isPaused: !state.isPaused
  })); },

  toggleAutoMode: () => { set((state) => ({
    autoMode: !state.autoMode
  })); },

  reset: () => { set(initialState); },

  setRecordedBattle: ({ initialPlayerTeam, initialEnemyTeam, events, unitNameMap, outcome }) => {
    set({
      inCombat: true,
      playerTeam: [...initialPlayerTeam],
      enemyTeam: [...initialEnemyTeam],
      recordedEvents: events,
      eventCursor: 0,
      playbackComplete: events.length === 0,
      log: [],
      currentTurn: 0,
      isPaused: false,
      unitNameMap,
      outcome
    });
  },

  advanceEvent: () => {
    const state = get();
    if (state.isPaused || state.playbackComplete) return;
    const idx = state.eventCursor;
    const ev = state.recordedEvents[idx];
    if (!ev) {
      set({ playbackComplete: true });
      return;
    }
    const stepped = applyEventToTeams(state.playerTeam, state.enemyTeam, ev);
    const logEntry = eventToLogEntry(ev, state.unitNameMap);
    const newLog = logEntry
      ? [
          ...state.log,
          {
            ...logEntry,
            id: `${String(idx)}-${String(ev.kind)}`,
            timestamp: Date.now()
          }
        ].slice(-200)
      : state.log;

    const nextCursor = idx + 1;
    const finished = nextCursor >= state.recordedEvents.length;

    // When playback completes, snap to final state from outcome (orb effects,
    // statuses, etc. that the lightweight stepper doesn't model).
    const finalTeams = finished && state.outcome
      ? {
          playerTeam: [...state.outcome.finalPlayerTeam],
          enemyTeam: [...state.outcome.finalEnemyTeam]
        }
      : { playerTeam: stepped.playerTeam as CombatUnit[], enemyTeam: stepped.enemyTeam as CombatUnit[] };

    set({
      playerTeam: finalTeams.playerTeam,
      enemyTeam: finalTeams.enemyTeam,
      log: newLog,
      eventCursor: nextCursor,
      playbackComplete: finished,
      currentTurn: ev.kind === 'turn-start' ? ev.turn : state.currentTurn
    });
  },

  tick: () => { get().advanceEvent(); },

  pausePlayback: () => { set({ isPaused: true }); },
  resumePlayback: () => { set({ isPaused: false }); }
}));
