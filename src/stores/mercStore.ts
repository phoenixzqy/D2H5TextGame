/**
 * Mercenary store
 * Manages owned mercenaries and fielded selection
 */

import { create } from 'zustand';
import type { Mercenary } from '@/engine/types/entities';

interface MercState {
  ownedMercs: Mercenary[];
  fieldedMercId: string | null;
  
  // Actions
  addMerc: (merc: Mercenary) => void;
  removeMerc: (mercId: string) => void;
  setFieldedMerc: (mercId: string | null) => void;
  getFieldedMerc: () => Mercenary | null;
  upgradeMerc: (mercId: string) => void;
  reset: () => void;
}

const initialState = {
  ownedMercs: [] as Mercenary[],
  fieldedMercId: null
};

export const useMercStore = create<MercState>((set, get) => ({
  ...initialState,
  
  addMerc: (merc) => { set((state) => {
    // Check if already owned
    if (state.ownedMercs.some((m) => m.id === merc.id)) {
      console.warn('Mercenary already owned:', merc.id);
      return state;
    }
    return {
      ownedMercs: [...state.ownedMercs, merc]
    };
  }); },
  
  removeMerc: (mercId) => { set((state) => ({
    ownedMercs: state.ownedMercs.filter((m) => m.id !== mercId),
    fieldedMercId: state.fieldedMercId === mercId ? null : state.fieldedMercId
  })); },
  
  setFieldedMerc: (mercId) => { set((state) => {
    if (mercId && !state.ownedMercs.some((m) => m.id === mercId)) {
      console.warn('Cannot field mercenary not owned:', mercId);
      return state;
    }
    return { fieldedMercId: mercId };
  }); },
  
  getFieldedMerc: () => {
    const state = get();
    if (!state.fieldedMercId) return null;
    return state.ownedMercs.find((m) => m.id === state.fieldedMercId) ?? null;
  },
  
  upgradeMerc: (mercId) => { set((state) => {
    // TODO: Implement merc upgrade logic (star level, etc.)
    return {
      ownedMercs: state.ownedMercs.map((m) =>
        m.id === mercId
          ? {
              ...m,
              level: m.level + 1
            }
          : m
      )
    };
  }); },
  
  reset: () => { set(initialState); }
}));
