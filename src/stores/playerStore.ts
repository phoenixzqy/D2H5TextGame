/**
 * Player store
 * Manages player character state
 */

import { create } from 'zustand';
import type { Player } from '@/engine/types/entities';
import type { CoreStats } from '@/engine/types/attributes';
import { getSkillsForClass, type SkillTemplate } from './skillsHelpers';

/**
 * Cost in gold to fully respec all skill points.
 *
 * Decision: scale linearly with player level so early-game respecs are
 * cheap (≤ a few thousand gold) while late-game respecs require commitment.
 * Formula: `1000 * level`, capped at 50,000. Documented here as the single
 * source of truth.
 */
export function respecCost(level: number): number {
  return Math.min(50000, Math.max(1000, 1000 * Math.max(1, level)));
}

/** Result codes returned by {@link PlayerState.allocateSkillPoint}. */
export type AllocateSkillResult =
  | 'ok'
  | 'no-player'
  | 'no-points'
  | 'unknown-skill'
  | 'level-too-low'
  | 'prereq-missing'
  | 'maxed';

/** Result codes returned by {@link PlayerState.respec}. */
export type RespecResult = 'ok' | 'no-player' | 'no-allocations' | 'insufficient-gold';

interface PlayerState {
  player: Player | null;
  
  // Actions
  setPlayer: (player: Player) => void;
  updateStats: (stats: Partial<CoreStats>) => void;
  addXP: (amount: number) => void;
  levelUp: () => void;
  allocateStatPoint: (stat: keyof CoreStats) => void;
  /**
   * Spend one skill point on the given skill. Validates the player level
   * meets `minLevel`, every prerequisite has ≥1 allocated point, and the
   * skill is not already at `maxLevel`. Returns a status code rather than
   * throwing so the UI can render a tooltip.
   */
  allocateSkillPoint: (skillId: string) => AllocateSkillResult;
  /**
   * Refund every allocated skill point at the cost of {@link respecCost}
   * gold. Caller supplies `getGold` / `spendGold` callbacks (the inventory
   * store owns gold currency).
   */
  respec: (deps: { getGold: () => number; spendGold: (amount: number) => boolean }) => RespecResult;
  setComboOrder: (order: string[]) => void;
  reset: () => void;
}

const initialState = {
  player: null
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
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
  
  allocateSkillPoint: (skillId) => {
    const state = get();
    const player = state.player;
    if (!player) return 'no-player';
    if (player.skillPoints <= 0) return 'no-points';

    const allSkills = getSkillsForClass(player.class);
    const tmpl: SkillTemplate | undefined = allSkills.find((s) => s.id === skillId);
    if (!tmpl) return 'unknown-skill';

    if (tmpl.minLevel && player.level < tmpl.minLevel) return 'level-too-low';

    const allocated = player.skillLevels ?? {};
    const current = allocated[skillId] ?? 0;
    const max = tmpl.maxLevel || 20;
    if (current >= max) return 'maxed';

    if (tmpl.prerequisites) {
      for (const prereqId of tmpl.prerequisites) {
        if ((allocated[prereqId] ?? 0) <= 0) return 'prereq-missing';
      }
    }

    set({
      player: {
        ...player,
        skillPoints: player.skillPoints - 1,
        skillLevels: { ...allocated, [skillId]: current + 1 }
      }
    });
    return 'ok';
  },

  respec: (deps) => {
    const state = get();
    const player = state.player;
    if (!player) return 'no-player';
    const allocated = player.skillLevels ?? {};
    const totalPoints = Object.values(allocated).reduce((s, v) => s + v, 0);
    if (totalPoints <= 0) return 'no-allocations';

    const cost = respecCost(player.level);
    if (deps.getGold() < cost) return 'insufficient-gold';
    if (!deps.spendGold(cost)) return 'insufficient-gold';

    set({
      player: {
        ...player,
        skillPoints: player.skillPoints + totalPoints,
        skillLevels: {}
      }
    });
    return 'ok';
  },
  
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
