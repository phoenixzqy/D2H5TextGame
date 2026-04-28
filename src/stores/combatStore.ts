/**
 * Combat store
 * Manages active combat state and log
 */

import { create } from 'zustand';
import type { CombatUnit } from '@/engine/combat/types';

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
  autoMode: true
};

export const useCombatStore = create<CombatState>((set) => ({
  ...initialState,
  
  startCombat: (playerTeam, enemyTeam, totalWaves) => { set({
    inCombat: true,
    playerTeam,
    enemyTeam,
    totalWaves,
    currentWave: 1,
    currentTurn: 0,
    log: [],
    isPaused: false
  }); },
  
  endCombat: () => { set({
    inCombat: false,
    playerTeam: [],
    enemyTeam: [],
    currentTurn: 0
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
  
  reset: () => { set(initialState); }
}));
