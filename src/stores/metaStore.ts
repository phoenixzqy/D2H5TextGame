/**
 * Meta store
 * Manages app settings, idle state, gacha state, and UI preferences
 */

import { create } from 'zustand';
import type { Settings, IdleState, GachaState } from '@/engine/types/save';
import { loadMercPool, type MercDef } from '@/data/loaders/mercs';
import { createRng } from '@/engine/rng';
import { rollMany, pickFromPool, type GachaRarity } from '@/engine/gacha/roller';
import { createMercFromDef } from './mercFactory';
import { useMercStore } from './mercStore';

/** Result of a single gacha pull surfaced to the UI. */
export interface GachaPullResult {
  readonly mercDef: MercDef;
  readonly rarity: GachaRarity;
  /** True when this pull recruited a new merc; false on duplicate. */
  readonly isNew: boolean;
}

interface MetaState {
  settings: Settings;
  idleState: IdleState;
  gachaState: GachaState;
  /**
   * Wall-clock timestamp (ms) when the page last became hidden /
   * unloaded. Bug #20 — used by `useOfflineBonus` to compute a
   * multiplier window without relying on `lastSavedAt` (the save
   * adapter does not surface that field). Not persisted to disk; it
   * resets on every fresh page load, which is the intended behavior
   * (only same-session backgrounding accrues an offline bonus).
   */
  lastClosedAt: number | null;
  
  // Actions
  updateSettings: (settings: Partial<Settings>) => void;
  setLocale: (locale: 'zh-CN' | 'en') => void;
  toggleStealthMode: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleAutoCombat: () => void;
  setIdleTarget: (areaId: string | undefined) => void;
  updateIdleState: (idleState: Partial<IdleState>) => void;
  updateGachaState: (gachaState: Partial<GachaState>) => void;
  addGachaCurrency: (amount: number) => void;
  spendGachaCurrency: (amount: number) => boolean;
  incrementPity: () => void;
  resetPity: () => void;
  /** Mark the page as backgrounded (Bug #20). */
  markClosed: (at?: number) => void;
  /**
   * Run an N-pull gacha. Returns the results, or `null` when the player
   * lacks enough currency. Spends `count × banner.cost.single` currency,
   * threads pity through every pull, and adds new mercs to `useMercStore`.
   */
  pullGacha: (count: number) => GachaPullResult[] | null;
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
  lastClosedAt: null,
  
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

  /** Persist the player's chosen idle-farming target sub-area. */
  setIdleTarget: (areaId: string | undefined) => { set((state) => {
    const nextIdle: IdleState = areaId === undefined
      ? (() => {
          const { idleTarget: _omit, ...rest } = state.idleState;
          void _omit;
          return rest as IdleState;
        })()
      : { ...state.idleState, idleTarget: areaId };
    return { idleState: nextIdle };
  }); },
  
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

  pullGacha: (count) => {
    const pool = loadMercPool();
    const totalCost = pool.banner.cost.single * count;
    const state = get();
    if (state.gachaState.currency < totalCost) return null;

    // Charge up-front so any thrown errors below leave the wallet
    // unchanged (we restore on throw via try/catch).
    set((s) => ({
      gachaState: {
        ...s.gachaState,
        currency: s.gachaState.currency - totalCost
      }
    }));

    try {
      const rng = createRng((Date.now() ^ state.gachaState.pityCounter) >>> 0);
      const { results, finalPity } = rollMany(
        rng,
        pool.rates,
        state.gachaState.pityCounter,
        pool.pity.ssr.threshold,
        count
      );
      // Build a quick lookup from id → MercDef
      const byId = new Map<string, MercDef>();
      for (const m of pool.pool) byId.set(m.id, m);

      const ownedIds = new Set(useMercStore.getState().ownedMercs.map((m) => m.id));
      const out: GachaPullResult[] = [];
      for (const roll of results) {
        const mercId = pickFromPool(rng, pool.banner.pool, roll.rarity);
        const def = byId.get(mercId);
        if (!def) continue;
        const isNew = !ownedIds.has(def.id);
        if (isNew) {
          useMercStore.getState().addMerc(createMercFromDef(def));
          ownedIds.add(def.id);
        }
        out.push({ mercDef: def, rarity: roll.rarity, isNew });
      }

      const ownedSnapshot = [...useMercStore.getState().ownedMercs.map((m) => m.id)];
      set((s) => ({
        gachaState: {
          ...s.gachaState,
          pityCounter: finalPity,
          ownedMercIds: ownedSnapshot
        }
      }));
      return out;
    } catch (err) {
      // Refund on unexpected failure.
      set((s) => ({
        gachaState: {
          ...s.gachaState,
          currency: s.gachaState.currency + totalCost
        }
      }));
      throw err;
    }
  },

  markClosed: (at) => { set({ lastClosedAt: at ?? Date.now() }); },

  reset: () => { set({
    settings: initialSettings,
    idleState: initialIdleState,
    gachaState: initialGachaState,
    lastClosedAt: null
  }); }
}));
