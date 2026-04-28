/**
 * Player store
 * Manages player character state
 */

import { create } from 'zustand';
import type { Player } from '@/engine/types/entities';
import type { CoreStats } from '@/engine/types/attributes';

interface PlayerState {
  player: Player | null;
  
  // Actions
  setPlayer: (player: Player) => void;
  updateStats: (stats: Partial<CoreStats>) => void;
  addXP: (amount: number) => void;
  levelUp: () => void;
  allocateStatPoint: (stat: keyof CoreStats) => void;
  allocateSkillPoint: (skillId: string) => void;
  setComboOrder: (order: string[]) => void;
  reset: () => void;
}

const initialState = {
  player: null
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,
  
  setPlayer: (player) => { set({ player }); },
  
  updateStats: (stats) => { set((state) => {
    if (!state.player) return state;
    return {
      player: {
        ...state.player,
        coreStats: {
          ...state.player.coreStats,
          ...stats
        }
      }
    };
  }); },
  
  addXP: (amount) => { set((state) => {
    if (!state.player) return state;
    const newXP = state.player.experience + amount;
    return {
      player: {
        ...state.player,
        experience: newXP
      }
    };
  }); },
  
  levelUp: () => { set((state) => {
    if (!state.player) return state;
    return {
      player: {
        ...state.player,
        level: state.player.level + 1,
        statPoints: state.player.statPoints + 5,
        skillPoints: state.player.skillPoints + 1
      }
    };
  }); },
  
  allocateStatPoint: (stat) => { set((state) => {
    if (!state.player || state.player.statPoints <= 0) return state;
    return {
      player: {
        ...state.player,
        statPoints: state.player.statPoints - 1,
        coreStats: {
          ...state.player.coreStats,
          [stat]: state.player.coreStats[stat] + 1
        }
      }
    };
  }); },
  
  allocateSkillPoint: (_skillId) => { set((state) => {
    if (!state.player || state.player.skillPoints <= 0) return state;
    // TODO: Implement skill point allocation logic
    return {
      player: {
        ...state.player,
        skillPoints: state.player.skillPoints - 1
      }
    };
  }); },
  
  setComboOrder: (order) => { set((state) => {
    if (!state.player) return state;
    return {
      player: {
        ...state.player,
        comboOrder: order
      }
    };
  }); },
  
  reset: () => { set(initialState); }
}));
