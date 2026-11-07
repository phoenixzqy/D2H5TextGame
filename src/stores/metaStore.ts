/**
 * Meta store
 * Manages app settings, idle state, gacha state, and UI preferences
 */

import { create } from 'zustand';
import type { Settings, IdleState, GachaState } from '@/engine/types/save';
import type { RecruitmentHistoryState } from '@/engine/save/recruitment-state';
import type { MercDef } from '@/data/loaders/mercs';
import type { GachaRarity } from '@/engine/gacha/roller';
import { addRecruitmentCurrency, executeGachaPull, spendRecruitmentCurrency } from './gachaActions';
import { assertMaterialMutationAllowed } from './waveTransitionGuard';
import { checkpointIdleBonus } from '@/engine/idle/persisted-bonus';
import { readStartupLocale } from '@/i18n/localePreference';
import { assertLootFilterSettings } from '@/engine/loot/filter';

/** Result of a single gacha pull surfaced to the UI. */
export interface GachaPullResult {
  readonly mercDef: MercDef;
  readonly rarity: GachaRarity;
  /** True when this pull recruited a new merc; false on duplicate. */
  readonly isNew: boolean;
  readonly shardCount: number;
}

interface MetaState {
  settings: Settings;
  idleState: IdleState;
  /** Transient clock basis for the sole raw idle tuple; never persisted. */
  idleBonusAnchor: number;
  /** Read the current online bonus without publishing or mutating its basis. */
  readIdleBonus: (now?: number) => IdleState;
  gachaState: GachaState;
  recruitmentState: RecruitmentHistoryState;
  
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
   * Run an authored single/ten pull using earned wishstones plus conserved
   * legacy value. Refusal returns null; payment, roster and pity commit together.
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
const initialRecruitmentState: RecruitmentHistoryState = { srPityCounter: 0, totalPulls: 0, history: [] };

export const useMetaStore = create<MetaState>((set, get) => ({
  settings: { ...initialSettings, locale: readStartupLocale() },
  idleState: initialIdleState,
  idleBonusAnchor: initialIdleState.lastOnline,
  readIdleBonus: (now = Date.now()) => {
    const state = get();
    return checkpointIdleBonus({ ...state.idleState, lastOnline: state.idleBonusAnchor }, now);
  },
  gachaState: initialGachaState,
  recruitmentState: initialRecruitmentState,
  
  updateSettings: (settings) => {
    if (settings.lootFilter !== undefined) assertLootFilterSettings(settings.lootFilter);
    set((state) => ({
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
  
  updateGachaState: (gachaState) => { assertMaterialMutationAllowed(); set((state) => ({
    gachaState: {
      ...state.gachaState,
      ...gachaState
    }
  })); },
  
  addGachaCurrency: addRecruitmentCurrency,
  spendGachaCurrency: spendRecruitmentCurrency,
  
  incrementPity: () => { assertMaterialMutationAllowed(); set((state) => ({
    gachaState: {
      ...state.gachaState,
      pityCounter: state.gachaState.pityCounter + 1
    }
  })); },
  
  resetPity: () => { assertMaterialMutationAllowed(); set((state) => ({
    gachaState: {
      ...state.gachaState,
      pityCounter: 0
    }
  })); },

  pullGacha: executeGachaPull,

  reset: () => {
    assertMaterialMutationAllowed();
    const now = Date.now();
    if (!Number.isFinite(now)) throw new RangeError('Idle bonus arithmetic requires finite numbers');
    set({
    settings: initialSettings,
    idleState: { ...initialIdleState, lastOnline: now },
    idleBonusAnchor: now,
    gachaState: initialGachaState,
    recruitmentState: initialRecruitmentState
    });
  }
}));
