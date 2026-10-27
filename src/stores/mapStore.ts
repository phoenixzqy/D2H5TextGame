import { CAIN_QUEST } from '@/engine/map/cain-quest';
import { talkToCain } from '@/features/quests/cainQuestActions';
import type { CurrentMapSaveData } from '@/engine/types/save';
import { emptyEndgameState } from '@/engine/endgame/state';
import type { EndgameState } from '@/engine/endgame/types';
import { ACT5_ENCOUNTERS, PRISON_QUEST } from '@/engine/map/act5-admission';
import { THAW_PROOF } from '@/engine/save/act5-state';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useInventoryStore } from './inventoryStore';
import { ACT4_ENCOUNTERS } from '@/engine/map/act4-admission';
/**
 * Map store
 * Manages map progress, current location, and quest state
 */

import { create } from 'zustand';
import { questObjectivePrerequisitesMet } from '@/engine/map/questStages';
import { loadQuests } from '@/data/loaders/quests';
import { loadTownNpcs } from '@/data/loaders/towns';
import { isActUnlocked as engineIsActUnlocked, isSubAreaUnlocked as engineIsSubAreaUnlocked } from '@/engine/map/unlock';
import { subAreas } from '@/data/index';
import { applyObjectInteraction, type InteractionProgress, type ObjectInteraction } from '@/engine/map/questInteractions';
import { resolveSubArea } from './subAreaResolver';
import type { WaveSource } from '@/engine/combat/sub-area-run';
import type { QuestActionReceipts } from '@/engine/types/save';
import { GUARDIAN_QUEST_ID } from '@/engine/map/guardian-admission';

type QuestProgress = InteractionProgress;

interface MapState extends Pick<CurrentMapSaveData, 'questTitles' | 'questDifficulties' | 'selectedTitle' | 'selectedDifficulty' | 'nightmareClearedSubAreas' | 'challengeOrdinals'> {
  endgame: EndgameState;
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
  questReceipts: QuestActionReceipts;
  
  // Actions
  discoverArea: (areaId: string) => void;
  setCurrentLocation: (actNumber: number, subAreaId: string) => void;
  updateQuestProgress: (questId: string, progress: Partial<QuestProgress>) => void;
  completeQuest: (questId: string) => void;
  /** Bug #9 — flip the rewardClaimed flag for a completed quest. */
  markQuestRewardClaimed: (questId: string) => void;
  /** Record a qualified area clear and advance tracked clear-area objectives atomically. Idempotent. */
  markCleared: (subAreaId: string) => void;
  /** Advance eligible ordered talk objectives for an exact current-town NPC. Never awards rewards. */
  recordNpcTalk: (npcId: string) => void;
  /** Record an ordered canonical current-area object event, without granting rewards. */
  recordObjectInteraction: (event: ObjectInteraction) => void;
  /** Advance tracked, unclaimed, ordered boss objectives for an exact qualified kill. Never awards rewards. */
  recordBossKill: (event: {
    readonly actId: string;
    readonly areaId: string;
    readonly bossArchetypeId: string;
    /** Authored origin supplied by qualified settlement, never inferred from archetype alone. */
    readonly source?: WaveSource;
  }) => void;
  /** Advance ordered boolean kill objectives from one qualified settlement batch. Never awards rewards. */
  recordMonsterKills: (event: {
    readonly actId: string;
    readonly areaId: string;
    readonly archetypeIds: readonly string[];
    /** Authored origin supplied by qualified settlement; not a durable action receipt. */
    readonly source?: WaveSource;
  }) => void;
  isCleared: (subAreaId: string) => boolean;
  /** Convenience selector for the act-unlock engine predicate. */
  isActUnlocked: (actNumber: number) => boolean;
  /** Sub-area unlock — currently follows act-level gating. */
  isAreaUnlocked: (act: number) => boolean;
  reset: () => void;
}

const initialState = {
  endgame: emptyEndgameState(),
  currentAct: 1,
  currentSubAreaId: null,
  discoveredAreas: [] as string[],
  clearedSubAreas: [] as string[],
  questProgress: {} as Record<string, QuestProgress>,
  questReceipts: {} as QuestActionReceipts,
  questTitles: {}, questDifficulties: {}, selectedTitle: null, selectedDifficulty: 'normal' as const,
  nightmareClearedSubAreas: [] as string[], challengeOrdinals: { normal: 0, nightmare: 0 }
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
    const clearedSubAreas = state.clearedSubAreas.includes(subAreaId)
      ? state.clearedSubAreas
      : [...state.clearedSubAreas, subAreaId];
    let questProgress = state.questProgress;
    for (const quest of loadQuests()) {
      const progress = state.questProgress[quest.id];
      if (progress?.status !== 'inProgress' || progress.rewardClaimed) continue;
      const matching = quest.objectives.filter((objective) =>
        objective.type === 'clear-area' && objective.areaId === subAreaId &&
        !progress.objectives[objective.id] && questObjectivePrerequisitesMet(quest, progress.objectives, objective.id)
      );
      if (matching.length === 0) continue;
      const objectives = {
        ...progress.objectives,
        ...Object.fromEntries(matching.map((objective) => [objective.id, true]))
      };
      questProgress = {
        ...questProgress,
        [quest.id]: {
          ...progress,
          objectives,
          status: quest.objectives.every((objective) => objectives[objective.id])
            ? 'completed'
            : 'inProgress'
        }
      };
    }
    if (clearedSubAreas === state.clearedSubAreas && questProgress === state.questProgress) return state;
    return { clearedSubAreas, questProgress };
  }); },

  isCleared: (subAreaId) => get().clearedSubAreas.includes(subAreaId),

  recordNpcTalk: (npcId) => {
    if (npcId === 'npc/cain' && get().currentAct === 1) { talkToCain(); return; }
    set((state) => {
    if (npcId === 'npc/anya' && (state.currentAct !== 5 || !Object.hasOwn(state.questReceipts, THAW_PROOF))) return state;
    if (npcId === 'npc/anya') {
      try { validateQuestItemLedger(useInventoryStore.getState().questItems, state.questProgress, state.questReceipts); }
      catch { return state; }
    }
    if (!loadTownNpcs(state.currentAct).some((npc) => npc.id === npcId)) return state;
    let questProgress = state.questProgress;
    for (const quest of loadQuests()) {
      if (quest.actId !== `acts/act${String(state.currentAct)}`) continue;
      const progress = state.questProgress[quest.id];
      if (progress?.status !== 'inProgress' || progress.rewardClaimed) continue;
      const matching = quest.objectives.filter((objective) =>
        objective.type === 'talk' && objective.npcId === npcId && !progress.objectives[objective.id] &&
        questObjectivePrerequisitesMet(quest, progress.objectives, objective.id)
      );
      if (matching.length === 0) continue;
      const objectives = {
        ...progress.objectives,
        ...Object.fromEntries(matching.map((objective) => [objective.id, true]))
      };
      questProgress = {
        ...questProgress,
        [quest.id]: {
          ...progress,
          objectives,
          status: quest.objectives.every((objective) => objectives[objective.id]) ? 'completed' : 'inProgress'
        }
      };
    }
    return questProgress === state.questProgress ? state : { questProgress };
  }); },
  
  recordBossKill: (event) => { set((state) => {
    let questProgress = state.questProgress;
    for (const quest of loadQuests()) {
      // Guardian needs the accepted original post-Orb settlement, beyond event metadata.
      if (quest.id === GUARDIAN_QUEST_ID || (ACT4_ENCOUNTERS.some(row => row.questId === quest.id) || ACT5_ENCOUNTERS.some(row => row.questId === quest.id))) continue;
      if (quest.actId !== event.actId) continue;
      const progress = state.questProgress[quest.id];
      if (progress?.status !== 'inProgress' || progress.rewardClaimed) continue;
      const matching = quest.objectives.filter((objective) =>
        objective.type === 'kill-boss' && objective.areaId === event.areaId &&
        objective.targetId === event.bossArchetypeId && !progress.objectives[objective.id] &&
        questObjectivePrerequisitesMet(quest, progress.objectives, objective.id)
      );
      if (matching.length === 0) continue;
      const objectives = {
        ...progress.objectives,
        ...Object.fromEntries(matching.map((objective) => [objective.id, true]))
      };
      questProgress = {
        ...questProgress,
        [quest.id]: {
          ...progress,
          objectives,
          status: quest.objectives.every((objective) => objectives[objective.id]) ? 'completed' : 'inProgress'
        }
      };
    }
    return questProgress === state.questProgress ? state : { questProgress };
  }); },

  recordObjectInteraction: (event) => { set((state) => {
    const current = resolveSubArea(state.currentAct, state.currentSubAreaId);
    if (event.actId !== `acts/act${String(state.currentAct)}` || current?.actId !== event.actId ||
      current.id !== event.areaId) return state;
    const questProgress = applyObjectInteraction(loadQuests().filter(quest => quest.id !== PRISON_QUEST && quest.id !== CAIN_QUEST), subAreas, state.questProgress, event);
    return questProgress === state.questProgress ? state : { questProgress };
  }); },

  recordMonsterKills: (event) => { set((state) => {
    let questProgress = state.questProgress;
    const targets = new Set(event.archetypeIds);
    for (const quest of loadQuests()) {
      if ((ACT4_ENCOUNTERS.some(row => row.questId === quest.id) || ACT5_ENCOUNTERS.some(row => row.questId === quest.id))) continue;
      if (quest.actId !== event.actId) continue;
      const progress = state.questProgress[quest.id];
      if (progress?.status !== 'inProgress' || progress.rewardClaimed) continue;
      const matching = quest.objectives.filter((objective) =>
        objective.type === 'kill' && objective.areaId === event.areaId &&
        typeof objective.targetId === 'string' && targets.has(objective.targetId) &&
        (objective.count === undefined || objective.count === 1) && !progress.objectives[objective.id] &&
        questObjectivePrerequisitesMet(quest, progress.objectives, objective.id)
      );
      if (matching.length === 0) continue;
      const objectives = { ...progress.objectives,
        ...Object.fromEntries(matching.map((objective) => [objective.id, true])) };
      questProgress = { ...questProgress, [quest.id]: { ...progress, objectives,
        status: quest.objectives.every((objective) => objectives[objective.id]) ? 'completed' : 'inProgress' } };
    }
    return questProgress === state.questProgress ? state : { questProgress };
  }); },

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
