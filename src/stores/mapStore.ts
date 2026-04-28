/**
 * Map store
 * Manages map progress, current location, and quest state
 */

import { create } from 'zustand';

interface QuestProgress {
  id: string;
  status: 'locked' | 'available' | 'inProgress' | 'completed';
  objectives: Record<string, boolean>;
}

interface MapState {
  currentAct: number;
  currentSubAreaId: string | null;
  discoveredAreas: string[];
  questProgress: Record<string, QuestProgress>;
  
  // Actions
  discoverArea: (areaId: string) => void;
  setCurrentLocation: (actNumber: number, subAreaId: string) => void;
  updateQuestProgress: (questId: string, progress: Partial<QuestProgress>) => void;
  completeQuest: (questId: string) => void;
  isAreaUnlocked: (areaId: string) => boolean;
  reset: () => void;
}

const initialState = {
  currentAct: 1,
  currentSubAreaId: null,
  discoveredAreas: [] as string[],
  questProgress: {} as Record<string, QuestProgress>
};

export const useMapStore = create<MapState>((set, get) => ({
  ...initialState,
  
  discoverArea: (areaId) => { set((state) => {
    if (state.discoveredAreas.includes(areaId)) return state;
    return {
      discoveredAreas: [...state.discoveredAreas, areaId]
    };
  }); },
  
  setCurrentLocation: (actNumber, subAreaId) => { set({
    currentAct: actNumber,
    currentSubAreaId: subAreaId
  }); },
  
  updateQuestProgress: (questId, progress) => { set((state) => ({
    questProgress: {
      ...state.questProgress,
      [questId]: {
        ...(state.questProgress[questId] ?? {
          id: questId,
          status: 'available',
          objectives: {}
        }),
        ...progress
      }
    }
  })); },
  
  completeQuest: (questId) => { set((state) => {
    const existing = state.questProgress[questId] ?? {
      id: questId,
      status: 'available' as const,
      objectives: {}
    };
    return {
      questProgress: {
        ...state.questProgress,
        [questId]: {
          ...existing,
          status: 'completed' as const
        }
      }
    };
  }); },
  
  isAreaUnlocked: (areaId) => {
    const state = get();
    // TODO: Implement unlock logic based on quest progress
    return state.discoveredAreas.includes(areaId);
  },
  
  reset: () => { set(initialState); }
}));
