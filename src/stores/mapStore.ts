/**
 * Map store
 * Manages map progress, current location, and quest state
 */

import { create } from 'zustand';
import { isActUnlocked as engineIsActUnlocked, isSubAreaUnlocked as engineIsSubAreaUnlocked } from '@/engine/map/unlock';

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
  /** Convenience selector for the act-unlock engine predicate. */
  isActUnlocked: (actNumber: number) => boolean;
  /** Sub-area unlock — currently follows act-level gating. */
  isAreaUnlocked: (act: number) => boolean;
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
  
  isActUnlocked: (actNumber) => {
    const state = get();
    const completed = new Set<string>();
    for (const [qid, qp] of Object.entries(state.questProgress)) {
      if (qp.status === 'completed') completed.add(qid);
    }
    return engineIsActUnlocked(actNumber, completed);
  },

  isAreaUnlocked: (act) => {
    const state = get();
    const completed = new Set<string>();
    for (const [qid, qp] of Object.entries(state.questProgress)) {
      if (qp.status === 'completed') completed.add(qid);
    }
    return engineIsSubAreaUnlocked(act, completed);
  },
  
  reset: () => { set(initialState); }
}));
