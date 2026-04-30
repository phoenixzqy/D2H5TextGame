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
  /** Bug #9 — set true when the player claims rewards for a completed quest. */
  rewardClaimed?: boolean;
}

interface MapState {
  currentAct: number;
  currentSubAreaId: string | null;
  discoveredAreas: string[];
  /**
   * Bug #5 — sub-areas the player has cleared (main quest done OR boss
   * defeated). Engine should call `markCleared(subAreaId)` when those
   * triggers fire; until that wires up, the run-victory flow can also
   * call it directly. UI uses this set to render the "✓ 已通过" badge
   * vs the "未通过" accent border.
   */
  clearedSubAreas: string[];
  questProgress: Record<string, QuestProgress>;
  
  // Actions
  discoverArea: (areaId: string) => void;
  setCurrentLocation: (actNumber: number, subAreaId: string) => void;
  updateQuestProgress: (questId: string, progress: Partial<QuestProgress>) => void;
  completeQuest: (questId: string) => void;
  /** Bug #9 — flip the rewardClaimed flag for a completed quest. */
  markQuestRewardClaimed: (questId: string) => void;
  /** Bug #5 — record a sub-area as cleared. Idempotent. */
  markCleared: (subAreaId: string) => void;
  isCleared: (subAreaId: string) => boolean;
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
  clearedSubAreas: [] as string[],
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

  markQuestRewardClaimed: (questId) => { set((state) => {
    const existing = state.questProgress[questId];
    if (!existing) return state;
    return {
      questProgress: {
        ...state.questProgress,
        [questId]: { ...existing, rewardClaimed: true }
      }
    };
  }); },

  markCleared: (subAreaId) => { set((state) => {
    if (state.clearedSubAreas.includes(subAreaId)) return state;
    return { clearedSubAreas: [...state.clearedSubAreas, subAreaId] };
  }); },

  isCleared: (subAreaId) => get().clearedSubAreas.includes(subAreaId),
  
  isActUnlocked: (actNumber) => {
    const state = get();
    const completed = new Set<string>();
    for (const [qid, qp] of Object.entries(state.questProgress)) {
      if (qp.status === 'completed') completed.add(qid);
    }
    return engineIsActUnlocked(actNumber, completed, new Set(state.clearedSubAreas));
  },

  isAreaUnlocked: (act) => {
    const state = get();
    const completed = new Set<string>();
    for (const [qid, qp] of Object.entries(state.questProgress)) {
      if (qp.status === 'completed') completed.add(qid);
    }
    return engineIsSubAreaUnlocked(act, completed, new Set(state.clearedSubAreas));
  },
  
  reset: () => { set(initialState); }
}));
