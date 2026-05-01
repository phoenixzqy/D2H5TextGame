/**
 * Player store
 * Manages player character state
 */

import { create } from 'zustand';
import type { Player } from '@/engine/types/entities';
import type { CoreStats } from '@/engine/types/attributes';
import type { Item } from '@/engine/types/items';
import { aggregateEquipmentMods, applyEquipmentCoreMods, equipmentModsToDerivedModifiers } from '@/engine/progression/equipment-mods';
import { deriveStats } from '@/engine/progression/stats';
import { awardXp, xpRequired, xpTotal, LEVEL_CAP } from '@/engine/progression/xp';
import {
  canonicalSkillIdFromData,
  getAllocatedSkillLevel,
  getSkillRequiredLevel,
  getSkillsForClass,
  skillIdAliases,
  type SkillTemplate
} from './skillsHelpers';

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

export interface GainExperienceResult {
  readonly levelsGained: number;
  readonly newLevel: number;
  readonly statPointsGranted: number;
  readonly skillPointsGranted: number;
}

interface PlayerState {
  player: Player | null;
  
  // Actions
  setPlayer: (player: Player) => void;
  updateStats: (stats: Partial<CoreStats>) => void;
  addXP: (amount: number) => void;
  gainExperience: (amount: number) => GainExperienceResult;
  levelUp: () => void;
  allocateStatPoint: (stat: keyof CoreStats) => void;
  /**
   * Spend one skill point on the given skill. Validates the player level
   * meets `minLevel`, every prerequisite has ≥1 allocated point, and the
   * skill is not already at `maxLevel`. Returns a status code rather than
   * throwing so the UI can render a tooltip.
   */
  allocateSkillPoint: (skillId: string) => AllocateSkillResult;
  /** Recompute derived player stats from base stats and equipped item mods. */
  recomputeDerived: (equipped: Record<string, Item | null>) => void;
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
  gainExperience: (amount) => {
    const state = get();
    const player = state.player;
    if (!player || amount <= 0) {
      return { levelsGained: 0, newLevel: player?.level ?? 1, statPointsGranted: 0, skillPointsGranted: 0 };
    }
    // Player.experience is "XP earned into the current level" (CharacterScreen
    // renders experience / experienceToNextLevel). Convert to cumulative XP for
    // `awardXp`, then convert back.
    const cumulative = xpTotal(player.level) + player.experience;
    const result = awardXp(cumulative, amount);
    const cappedLevel = Math.min(LEVEL_CAP, result.level);
    const intoLevel = Math.max(0, result.totalXp - xpTotal(cappedLevel));
    const xpForNext = cappedLevel >= LEVEL_CAP ? Math.max(1, intoLevel) : xpRequired(cappedLevel);
    const newDerived = deriveStats(player.coreStats, cappedLevel);
    const preservedLife = Math.min(newDerived.lifeMax, player.derivedStats.life);
    const preservedMana = Math.min(newDerived.manaMax, player.derivedStats.mana);
    const levelsGained = cappedLevel - player.level;
    set({
      player: {
        ...player,
        level: cappedLevel,
        experience: intoLevel,
        experienceToNextLevel: xpForNext,
        statPoints: player.statPoints + result.statPointsGranted,
        skillPoints: player.skillPoints + result.skillPointsGranted,
        derivedStats: {
          ...newDerived,
          life: preservedLife,
          mana: preservedMana
        }
      }
    });
    return {
      levelsGained,
      newLevel: cappedLevel,
      statPointsGranted: result.statPointsGranted,
      skillPointsGranted: result.skillPointsGranted
    };
  },
  
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
    const requestedAliases = skillIdAliases(skillId);
    const tmpl: SkillTemplate | undefined = allSkills.find((s) => requestedAliases.includes(s.id));
    if (!tmpl) return 'unknown-skill';

    if (player.level < getSkillRequiredLevel(tmpl)) return 'level-too-low';

    const allocated = player.skillLevels ?? {};
    const current = getAllocatedSkillLevel(allocated, tmpl.id);
    const max = tmpl.maxLevel || 20;
    if (current >= max) return 'maxed';

    if (tmpl.prerequisites) {
      for (const prereqId of tmpl.prerequisites) {
        if (getAllocatedSkillLevel(allocated, prereqId) <= 0) return 'prereq-missing';
      }
    }

    const aliases = skillIdAliases(tmpl.id);
    const targetSkillId = aliases.find((id) => allocated[id] !== undefined)
      ?? canonicalSkillIdFromData(tmpl.id)
      ?? tmpl.id;
    const aliasSet = new Set<string>(aliases);
    const nextSkillLevels = Object.fromEntries(
      Object.entries(allocated).filter(([id]) => id === targetSkillId || !aliasSet.has(id))
    );
    nextSkillLevels[targetSkillId] = current + 1;

    set({
      player: {
        ...player,
        skillPoints: player.skillPoints - 1,
        skillLevels: nextSkillLevels
      }
    });
    return 'ok';
  },

  recomputeDerived: (equipped) => { set((state) => {
    if (!state.player) return state;
    const equipmentMods = aggregateEquipmentMods(equipped);
    const coreWithEquipment = applyEquipmentCoreMods(state.player.coreStats, equipmentMods);
    const fresh = deriveStats(
      coreWithEquipment,
      state.player.level,
      equipmentModsToDerivedModifiers(equipmentMods)
    );
    // Preserve current life/mana pools across recompute (equip / unequip
    // must not silently full-heal). Clamp down to new caps if the new max
    // dropped below current (e.g. unequipping a vitality-boosting item).
    const prev = state.player.derivedStats;
    return {
      player: {
        ...state.player,
        derivedStats: {
          ...fresh,
          life: Math.min(fresh.lifeMax, prev.life),
          mana: Math.min(fresh.manaMax, prev.mana)
        }
      }
    };
  }); },

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
