/**
 * Meta store
 * Manages app settings, idle state, gacha state, and UI preferences
 */

import { create } from 'zustand';
import type { Settings, IdleState, GachaState } from '@/engine/types/save';

interface MetaState {
  settings: Settings;
  idleState: IdleState;
  gachaState: GachaState;
  
  // Actions
  updateSettings: (settings: Partial<Settings>) => void;
  setLocale: (locale: 'zh-CN' | 'en') => void;
  toggleStealthMode: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleAutoCombat: () => void;
  updateIdleState: (idleState: Partial<IdleState>) => void;
  updateGachaState: (gachaState: Partial<GachaState>) => void;
  addGachaCurrency: (amount: number) => void;
  spendGachaCurrency: (amount: number) => boolean;
  incrementPity: () => void;
  resetPity: () => void;
  reset: () => void;
}

const initialSettings: Settings = {
  locale: 'zh-CN',
  stealthMode: false,
  soundEnabled: true,
  musicEnabled: true,
  combatSpeed: 1,
  autoCombat: true
};

const initialIdleState: IdleState = {
  lastOnline: Date.now(),
  offlineTime: 0,
  multiplierSecondsRemaining: 0,
  activeMultiplier: 1.0
};

const initialGachaState: GachaState = {
  currency: 0,
  ownedMercIds: [],
  pityCounter: 0
};

export const useMetaStore = create<MetaState>((set, get) => ({
  settings: initialSettings,
  idleState: initialIdleState,
  gachaState: initialGachaState,
  
  updateSettings: (settings) => { set((state) => ({
    settings: {
      ...state.settings,
      ...settings
    }
  })); },
  
  setLocale: (locale) => { set((state) => ({
    settings: {
      ...state.settings,
      locale
    }
  })); },
  
  toggleStealthMode: () => { set((state) => ({
    settings: {
      ...state.settings,
      stealthMode: !state.settings.stealthMode
    }
  })); },
  
  toggleSound: () => { set((state) => ({
    settings: {
      ...state.settings,
      soundEnabled: !state.settings.soundEnabled
    }
  })); },
  
  toggleMusic: () => { set((state) => ({
    settings: {
      ...state.settings,
      musicEnabled: !state.settings.musicEnabled
    }
  })); },
  
  toggleAutoCombat: () => { set((state) => ({
    settings: {
      ...state.settings,
      autoCombat: !state.settings.autoCombat
    }
  })); },
  
  updateIdleState: (idleState) => { set((state) => ({
    idleState: {
      ...state.idleState,
      ...idleState
    }
  })); },
  
  updateGachaState: (gachaState) => { set((state) => ({
    gachaState: {
      ...state.gachaState,
      ...gachaState
    }
  })); },
  
  addGachaCurrency: (amount) => { set((state) => ({
    gachaState: {
      ...state.gachaState,
      currency: state.gachaState.currency + amount
    }
  })); },
  
  spendGachaCurrency: (amount) => {
    const state = get();
    if (state.gachaState.currency < amount) {
      return false;
    }
    
    set((state) => ({
      gachaState: {
        ...state.gachaState,
        currency: state.gachaState.currency - amount
      }
    }));
    
    return true;
  },
  
  incrementPity: () => { set((state) => ({
    gachaState: {
      ...state.gachaState,
      pityCounter: state.gachaState.pityCounter + 1
    }
  })); },
  
  resetPity: () => { set((state) => ({
    gachaState: {
      ...state.gachaState,
      pityCounter: 0
    }
  })); },
  
  reset: () => { set({
    settings: initialSettings,
    idleState: initialIdleState,
    gachaState: initialGachaState
  }); }
}));
