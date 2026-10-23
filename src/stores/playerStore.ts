/**
 * Player store
 * Manages player character state
 */

import { create } from 'zustand';
import type { Player } from '@/engine/types/entities';
import type { CoreStats } from '@/engine/types/attributes';
import type { Item } from '@/engine/types/items';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { CORE_STAT_HARD_CAP } from '@/engine/progression/stats';
import { resolveEligibleMightRank } from '@/engine/skills/might';
import { resolveEligibleMeditationRank } from '@/engine/skills/meditation';
import { awardXp, xpRequired, xpTotal, LEVEL_CAP } from '@/engine/progression/xp';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { clearCombatForHeroReplacement } from './combatRunLifecycle';
import { assertWaveRestoreOwner, assertWaveSnapshotAllowed, type WaveRestoreLease } from './waveTransitionGuard';
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

/** Whole-draft refusal codes, checked before any player publication. */
export type AllocateStatsResult = 'ok' | 'no-player' | 'stale-player' | 'invalid-deltas'
  | 'empty-draft' | 'insufficient-points' | 'stat-cap';

const CORE_STAT_KEYS = ['strength', 'dexterity', 'vitality', 'energy'] as const;

/** Result codes returned by {@link PlayerState.respec}. */
export type RespecResult = 'ok' | 'no-player' | 'no-allocations' | 'insufficient-gold';

/** Result of an explicit aura selection request; refusals never publish player state. */
export type SelectAuraResult = 'ok' | 'no-player' | 'unsupported-aura' | 'ineligible';

export interface GainExperienceResult {
  readonly levelsGained: number;
  readonly newLevel: number;
  readonly statPointsGranted: number;
  readonly skillPointsGranted: number;
}

interface PlayerState {
  player: Player | null;
  
  // Actions
  /** Replace the hero and discard run/recording/selection; throws WaveGuardError before changes while owned. */
  setPlayer: (player: Player) => void;
  updateStats: (stats: Partial<CoreStats>) => void;
  addXP: (amount: number) => void;
  gainExperience: (amount: number) => GainExperienceResult;
  levelUp: () => void;
  /** Spend one available point below the base cap, publishing coherent equipped stats without healing. */
  allocateStatPoint: (stat: keyof CoreStats) => void;
  /** Commit a validated whole draft against its exact player basis in one publication, without healing. */
  allocateStatPoints: (deltas: CoreStats, expectedPlayer: Player) => AllocateStatsResult;
  /**
   * Spend one skill point on the given skill. Validates the player level
   * meets `minLevel`, every prerequisite has ≥1 allocated point, and the
   * skill is not already at `maxLevel`. Returns a status code rather than
   * throwing so the UI can render a tooltip.
   */
  allocateSkillPoint: (skillId: string) => AllocateSkillResult;
  /** Select canonical eligible Might/Meditation or null for None. Clearing omits the saved property. */
  selectAura: (request: unknown) => SelectAuraResult;
  /** Recompute derived player stats from base stats and equipped item mods. */
  recomputeDerived: (equipped: Record<string, Item | null>) => void;
  /**
   * Refund every allocated skill point at the cost of {@link respecCost}
   * gold. Caller supplies `getGold` / `spendGold` callbacks (the inventory
   * store owns gold currency).
   */
  respec: (deps: { getGold: () => number; spendGold: (amount: number) => boolean }) => RespecResult;
  setComboOrder: (order: string[]) => void;
  /** Clear hero and run/recording/selection, even without a hero; throws WaveGuardError before changes while owned. */
  reset: () => void;
}

const initialState = {
  player: null
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initialState,
  
  setPlayer: (player) => {
    assertWaveSnapshotAllowed();
    clearCombatForHeroReplacement();
    set({ player });
  },
  
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
    // Read the authoritative gear only when the action runs, after both stores
    // initialize. The legacy player.equipment array does not track equip actions.
    const equipped = useInventoryStore.getState().equipped;
    const newDerived = deriveEquippedPlayerStats(player, cappedLevel, equipped, useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts);
    const levelsGained = cappedLevel - player.level;
    set({
      player: {
        ...player,
        level: cappedLevel,
        experience: intoLevel,
        experienceToNextLevel: xpForNext,
        statPoints: player.statPoints + result.statPointsGranted,
        skillPoints: player.skillPoints + result.skillPointsGranted,
        derivedStats: newDerived
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
    const player = state.player;
    if (!player || player.statPoints < 1 || player.coreStats[stat] + 1 > CORE_STAT_HARD_CAP) return state;
    const nextPlayer: Player = {
      ...player,
      statPoints: player.statPoints - 1,
      coreStats: {
        ...player.coreStats,
        [stat]: player.coreStats[stat] + 1
      }
    };
    return {
      player: {
        ...nextPlayer,
        derivedStats: deriveEquippedPlayerStats(nextPlayer, nextPlayer.level, useInventoryStore.getState().equipped, useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts)
      }
    };
  }); },
  
  allocateStatPoints: (deltas, expectedPlayer) => {
    const player = get().player;
    if (!player) return 'no-player';
    if (player !== expectedPlayer) return 'stale-player';
    const input: unknown = deltas;
    if (input === null || typeof input !== 'object') return 'invalid-deltas';
    let total = 0;
    for (const stat of CORE_STAT_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(deltas, stat)
        || !Number.isSafeInteger(deltas[stat]) || deltas[stat] < 0) return 'invalid-deltas';
      total += deltas[stat];
    }
    if (!Number.isSafeInteger(total)) return 'invalid-deltas';
    if (total === 0) return 'empty-draft';
    if (total > Math.floor(player.statPoints)) return 'insufficient-points';
    if (CORE_STAT_KEYS.some(stat => deltas[stat] > 0
      && player.coreStats[stat] + deltas[stat] > CORE_STAT_HARD_CAP)) return 'stat-cap';
    const coreStats = { ...player.coreStats };
    for (const stat of CORE_STAT_KEYS) coreStats[stat] += deltas[stat];
    const nextPlayer = { ...player, coreStats, statPoints: player.statPoints - total };
    set({ player: { ...nextPlayer,
      derivedStats: deriveEquippedPlayerStats(nextPlayer, nextPlayer.level, useInventoryStore.getState().equipped, useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts)
    } });
    return 'ok';
  },

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

  selectAura: (request) => {
    const player = get().player;
    if (!player) return 'no-player';
    if (request !== null && request !== 'paladin.might' && request !== 'paladin.meditation') return 'unsupported-aura';
    if (request === null) {
      if (!Object.hasOwn(player, 'selectedAuraId')) return 'ok';
      const { selectedAuraId: _selected, ...withoutAura } = player;
      set({ player: withoutAura });
      return 'ok';
    }
    const rank = request === 'paladin.might' ? resolveEligibleMightRank(player) : resolveEligibleMeditationRank(player);
    if (rank === 0) return 'ineligible';
    if (player.selectedAuraId !== request) set({ player: { ...player, selectedAuraId: request } });
    return 'ok';
  },

  recomputeDerived: (equipped) => { set((state) => {
    if (!state.player) return state;
    return {
      player: {
        ...state.player,
        derivedStats: deriveEquippedPlayerStats(state.player, state.player.level, equipped, useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts)
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

    const { selectedAuraId: _selected, ...withoutAura } = player;
    set({
      player: {
        ...withoutAura,
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
  
  reset: () => {
    assertWaveSnapshotAllowed();
    clearCombatForHeroReplacement();
    set(initialState);
  }
}));

/** Restore-only hero replacement; validate the exact live reservation before publication. */
export function replacePlayerAfterRestore(player: Player | null, lease: WaveRestoreLease): void {
  assertWaveRestoreOwner(lease);
  usePlayerStore.setState({ player });
}
