import { create } from 'zustand';
import type { FormationPreferences } from '@/engine/types/save';
import type { GridPosition } from '@/engine/combat/types';

export const DEFAULT_FORMATION: FormationPreferences = Object.freeze({
  playerPosition: { row: 1, col: 1 },
  mercPosition: { row: 0, col: 0 },
  summonPositions: [
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 1, col: 0 },
    { row: 1, col: 2 },
    { row: 0, col: 0 }
  ]
});

function clampPosition(pos: GridPosition): GridPosition {
  return {
    row: Math.min(2, Math.max(0, Math.floor(pos.row))),
    col: Math.min(2, Math.max(0, Math.floor(pos.col)))
  };
}

export interface FormationState extends FormationPreferences {
  setPlayerPosition: (position: GridPosition) => void;
  setMercPosition: (position: GridPosition) => void;
  setSummonPosition: (index: number, position: GridPosition) => void;
  hydrate: (formation: FormationPreferences) => void;
  reset: () => void;
}

export const useFormationStore = create<FormationState>((set) => ({
  ...DEFAULT_FORMATION,
  setPlayerPosition: (position) => {
    set({ playerPosition: clampPosition(position) });
  },
  setMercPosition: (position) => {
    set({ mercPosition: clampPosition(position) });
  },
  setSummonPosition: (index, position) => {
    set((state) => {
      const summonPositions = [...state.summonPositions];
      summonPositions[Math.max(0, Math.floor(index))] = clampPosition(position);
      return { summonPositions };
    });
  },
  hydrate: (formation) => {
    set({
      playerPosition: clampPosition(formation.playerPosition),
      mercPosition: clampPosition(formation.mercPosition),
      summonPositions: formation.summonPositions.map(clampPosition)
    });
  },
  reset: () => {
    set({
      playerPosition: DEFAULT_FORMATION.playerPosition,
      mercPosition: DEFAULT_FORMATION.mercPosition,
      summonPositions: [...DEFAULT_FORMATION.summonPositions]
    });
  }
}));
