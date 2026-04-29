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

  /**
   * Identifier of the active sub-area run, or null when the combat
   * screen is showing a one-off / synthetic battle. Used by the UI's
   * "Continue to next sub-area" CTA on full-run victory.
   */
  subAreaRunId: string | null;
  /** True when every wave in the active run has resolved with the player alive. */
  runVictory: boolean;
  /** True when the player team died at any point in the run. */
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
    /** 1-based wave index (defaults to current value). */
    currentWave?: number;
    /** Total wave count (defaults to current value). */
    totalWaves?: number;
    /** Sub-area run id (null/undefined for one-off battles). */
    subAreaRunId?: string | null;
  }) => void;
  /** Mark the active sub-area run as fully cleared. */
  markRunVictory: () => void;
  /** Mark the active sub-area run as failed (player team wiped). */
  markRunDefeat: () => void;
  /** Add the most recent wave's rewards into the run-aggregate counter. */
  accumulateRunRewards: (rewards: KillRewards) => void;
  /** Reset the run-aggregate rewards (called when starting a new run). */
  resetRunRewards: () => void;
  /** Advance the cursor by one event (no-op when paused or complete). */
  advanceEvent: () => void;
  /** Alias for {@link advanceEvent} kept for UI timer ergonomics. */
  tick: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
}

/** Empty {@link KillRewards} value used to seed run-aggregate state. */
function emptyRewards(): KillRewards {
  return { items: [], gold: 0, runes: 0, gems: 0, wishstones: 0 };
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
  outcome: null as RecordedBattleOutcome | null,
  subAreaRunId: null as string | null,
  runVictory: false,
  runDefeat: false,
  runRewards: emptyRewards()
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
    case 'summon': {
      const ownerName = getName(event.owner);
      return {
        type: 'system',
        actorId: event.owner,
        actorName: ownerName,
        message: `${ownerName} summons ${event.unit.name}`
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

export const useCombatStore= create<CombatState>((set, get) => ({
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

  setRecordedBattle: ({
    initialPlayerTeam,
    initialEnemyTeam,
    events,
    unitNameMap,
    outcome,
    currentWave,
    totalWaves,
    subAreaRunId
  }) => {
    set((state) => ({
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
      outcome,
      currentWave: currentWave ?? state.currentWave,
      totalWaves: totalWaves ?? state.totalWaves,
      subAreaRunId: subAreaRunId === undefined ? state.subAreaRunId : subAreaRunId,
      // A new wave clears the per-wave run flags; final flags are set
      // explicitly via markRunVictory / markRunDefeat after playback.
      runVictory: false,
      runDefeat: false
    }));
  },

  markRunVictory: () => { set({ runVictory: true, runDefeat: false }); },
  markRunDefeat: () => { set({ runDefeat: true, runVictory: false }); },

  accumulateRunRewards: (rewards) => { set((state) => ({
    runRewards: {
      items: [...state.runRewards.items, ...rewards.items],
      gold: state.runRewards.gold + rewards.gold,
      runes: state.runRewards.runes + rewards.runes,
      gems: state.runRewards.gems + rewards.gems,
      wishstones: state.runRewards.wishstones + rewards.wishstones
    }
  })); },
  resetRunRewards: () => { set({ runRewards: emptyRewards() }); },

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

    // Extend the name map when a summon enters the battle so the log resolves
    // its display name.
    let nameMap = state.unitNameMap;
    if (ev.kind === 'summon' && !nameMap.has(ev.unit.id)) {
      const next = new Map(nameMap);
      next.set(ev.unit.id, ev.unit.name);
      nameMap = next;
    }

    const logEntry = eventToLogEntry(ev, nameMap);
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
      unitNameMap: nameMap,
      currentTurn: ev.kind === 'turn-start' ? ev.turn : state.currentTurn
    });
  },

  tick: () => { get().advanceEvent(); },

  pausePlayback: () => { set({ isPaused: true }); },
  resumePlayback: () => { set({ isPaused: false }); }
}));
