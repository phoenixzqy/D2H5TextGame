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
import { checkpointIdleBonus } from '@/engine/idle/persisted-bonus';

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
  /** Transient clock basis for the sole raw idle tuple; never persisted. */
  idleBonusAnchor: number;
  /** Read the current online bonus without publishing or mutating its basis. */
  readIdleBonus: (now?: number) => IdleState;
  gachaState: GachaState;
  
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
  idleBonusAnchor: initialIdleState.lastOnline,
  readIdleBonus: (now = Date.now()) => {
    const state = get();
    return checkpointIdleBonus({ ...state.idleState, lastOnline: state.idleBonusAnchor }, now);
  },
  gachaState: initialGachaState,
  
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
    if (state.idleState.idleTarget === areaId) return state;
    const nextIdle: IdleState = areaId === undefined
      ? (() => {
          const { idleTarget: _omit, ...rest } = state.idleState;
          void _omit;
          return rest as IdleState;
        })()
      : { ...state.idleState, idleTarget: areaId };
    return { idleState: nextIdle };
  }); },
  
  /**
   * Explicit lastOnline supplies the merged tuple's basis. Partial bonus edits
   * project before merging; target/counter-only and no-op edits keep the basis.
   * No-op means the entire patch is identical. Numeric/basis fields included
   * in a changed mixed patch deliberately replace those values, even when equal
   * to raw history; metadata-only callers should omit them.
   * Nonfinite values reject before publication.
   */
  updateIdleState: (patch) => { set((state) => {
    for (const field of ['lastOnline', 'offlineTime', 'activeMultiplier', 'multiplierSecondsRemaining'] as const) {
      if (field in patch && !Number.isFinite(patch[field])) {
        throw new RangeError('Idle bonus arithmetic requires finite numbers');
      }
    }
    if (Object.entries(patch).every(([key, value]) => state.idleState[key as keyof IdleState] === value)) {
      return state;
    }
    if (patch.lastOnline !== undefined) {
      return {
        idleState: checkpointIdleBonus({ ...state.idleState, ...patch }, patch.lastOnline),
        idleBonusAnchor: patch.lastOnline
      };
    }
    if ('activeMultiplier' in patch || 'multiplierSecondsRemaining' in patch) {
      const now = Date.now();
      return {
        idleState: checkpointIdleBonus({ ...state.readIdleBonus(now), ...patch }, now),
        idleBonusAnchor: now
      };
    }
    return { idleState: { ...state.idleState, ...patch } };
  }); },
  
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

  reset: () => {
    const now = Date.now();
    if (!Number.isFinite(now)) throw new RangeError('Idle bonus arithmetic requires finite numbers');
    set({
    settings: initialSettings,
    idleState: { ...initialIdleState, lastOnline: now },
    idleBonusAnchor: now,
    gachaState: initialGachaState
    });
  }
}));
