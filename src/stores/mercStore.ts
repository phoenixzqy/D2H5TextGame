/**
 * Mercenary store
 * Manages owned mercenaries, fielded selection, per-merc equipment, and
 * progression (Bugs #7, #8, #12).
 */

import { create } from 'zustand';
import { assertIronGolemOwnershipMutationAllowed, assertWaveSnapshotAllowed, WaveGuardError } from './waveTransitionGuard';
import { useCombatStore } from './combatStore';
import { combatRunLifecycle } from './combatRunLifecycle';
import { getMercConfiguredSkillOrder } from './mercToCombatUnit';
import type { Mercenary } from '@/engine/types/entities';
import type { MercRecruitmentProgress } from '@/engine/gacha/recruitment-state';
import type { EquipmentSlot, Item, ItemBase } from '@/engine/types/items';
import { loadItemBases } from '@/data/loaders/loot';
import type { MercDef } from '@/data/loaders/mercs';
import { createMercFromDef } from './mercFactory';
import { executeMercStarUpgrade } from './mercStarActions';
import { projectMercenaryStars } from '@/engine/progression/merc-stars';
import { growMercenary, repairMercenaryGrowth } from '@/engine/progression/merc-growth';
import { useInventoryStore } from './inventoryStore';
import { BACKPACK_CAPACITY } from './inventoryCapacity';
import { checkEligibility } from '@/features/inventory/compareEquip';
import { hasUniqueCharmOwnership } from '@/engine/inventory/equipValidator';
import { MERC_XP_POLICY } from '@/data/loaders/merc-xp';

/**
 * Mercenary XP curve (canonical).
 *
 * `mercXpForLevel(L)` = XP required to advance **from level L to L+1**.
 *
 * Preserve original costs through the authored anchor, then grow as L^2.5
 * to match later kill rewards. See docs/design/merc-xp-policy.md (BUG-709).
 * Existing explicit saved thresholds are consumed before using this policy.
 */
export function mercXpForLevel(level: number): number {
  const L = Math.max(1, level);
  const { basePerLevel, earlyGrowthBase, growthStartLevel, growthExponent } = MERC_XP_POLICY;
  const earlyLevel = Math.min(L, growthStartLevel);
  const earlyCost = Math.floor(basePerLevel * earlyLevel * earlyGrowthBase ** (earlyLevel - 1));
  return L <= growthStartLevel ? earlyCost
    : Math.floor(earlyCost * (L / growthStartLevel) ** growthExponent);
}

/**
 * Share of player kill-XP credited to the currently-fielded mercenary.
 *
 * 0.75 = 75%. In classic D2 a hireling gets full party XP at the same area;
 * we apply a small 25% tax so soloing without a merc is never strictly
 * inferior on raw XP/hr while keeping merc progression meaningful.
 *
 * Cited: PureDiablo / Arreat Summit hireling notes (party XP share at same
 * level / area). We deliberately do *not* model D2's level-difference XP
 * penalty — the merc is treated as same-area for this game.
 */
export const MERC_XP_SHARE = 0.75;

export { getPerLevelGain } from '@/engine/progression/merc-growth';

interface MercProgress {
  experience: number;
  experienceToNextLevel: number;
}

/** Bug #8 — full slot set, mirrors player equipment. */
export const MERC_EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  'head',
  'amulet',
  'chest',
  'gloves',
  'belt',
  'boots',
  'ring-left',
  'ring-right',
  'weapon',
  'offhand'
] as const;

export type MercEquipment = Partial<Record<EquipmentSlot, Item | null>>;

/** Settled transfer result; refusal publishes neither inventory nor merc state. */
export type MercEquipmentResult = { ok: true } | {
  ok: false;
  reason: 'merc_not_owned' | 'not_in_backpack' | 'incompatible_slot' | 'requirements_not_met' | 'not_found' | 'backpack_full';
};

interface MercState {
  ownedMercs: Mercenary[];
  fieldedMercId: string | null;
  /** Bug #8 — keyed by merc id → slot → equipped item. */
  mercEquipment: Record<string, MercEquipment>;
  /** Bug #12 — keyed by merc id → XP progress. */
  mercProgress: Record<string, MercProgress>;
  recruitmentProgress: MercRecruitmentProgress;
  
  // Actions
  addMerc: (merc: Mercenary) => void;
  hireMerc: (def: MercDef) => { ok: boolean; mercId?: string; reason?: 'already-owned' };
  removeMerc: (mercId: string) => void;
  setFieldedMerc: (mercId: string | null) => void;
  getFieldedMerc: () => Mercenary | null;
  /** Reorder existing owned skills with signature first; refuse busy or invalid requests atomically. */
  setSkillOrder: (mercId: string, order: readonly string[]) => boolean;
  upgradeMerc: (mercId: string) => void;
  /** Spend 100 owned shards for one star, refusing busy, unowned and capped requests atomically. */
  upgradeMercStar: (mercId: string) => boolean;
  /**
   * Dismiss a merc only when all equipment has been removed first. Returns
   * false when the merc still has gear so UI can show a blocking warning.
   */
  dismissMerc: (mercId: string) => boolean;
  hasEquippedItems: (mercId: string) => boolean;
  /**
   * Transfer the first current backpack item matching the requested ID to an
   * owned merc. Validate its stored base/slot and return displaced gear once.
   * Caller fields never replace stored contents. Callers perform no item moves.
   */
  equipOnMerc: (mercId: string, slot: EquipmentSlot, item: Item) => MercEquipmentResult;
  /** Transfer current owned-merc gear if backpack has room, clearing equipped metadata. */
  unequipFromMerc: (mercId: string, slot: EquipmentSlot) => MercEquipmentResult;
  getMercEquipment: (mercId: string) => MercEquipment;
  /**
   * Bug #12 — credit a merc with `amount` XP, levelling up across as
   * many thresholds as the XP covers. Stat/HP gains apply per level.
   */
  addExperience: (mercId: string, amount: number) => { levelsGained: number; newLevel: number };
  /** Read saved progress or a level-aware default without publishing state. */
  getMercProgress: (mercId: string) => MercProgress;
  /**
   * Share `amount` XP using {@link MERC_XP_SHARE}. Omitted recipient uses
   * the currently fielded merc; a captured ID retains a reward's original
   * recipient across synchronous observers. Explicit null grants no merc XP.
   */
  shareExperienceWithFielded: (amount: number, recipientId?: string | null) => void;
  reset: () => void;
}

const initialState = {
  ownedMercs: [] as Mercenary[],
  fieldedMercId: null,
  mercEquipment: {} as Record<string, MercEquipment>,
  mercProgress: {} as Record<string, MercProgress>,
  recruitmentProgress: {} as MercRecruitmentProgress
};

/** Canonical mercenary slot eligibility shared by native transfers and gear selection. */
export function isMercEquipmentSlotCompatible(base: ItemBase | undefined, slot: EquipmentSlot): boolean {
  if (!base?.slot) return false;
  if (slot === 'charm' || base.id === 'items/base/small-charm' || base.type === 'charm' || base.slot === 'charm') return false;
  if (base.slot === slot) return true;
  // Rings are interchangeable across the two ring slots.
  if (base.slot === 'ring-left' || base.slot === 'ring-right') {
    return slot === 'ring-left' || slot === 'ring-right';
  }
  return false;
}

function initialProgress(level: number): MercProgress {
  return { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
}

function assertFiniteProgress(progress: MercProgress): void {
  if (!Number.isFinite(progress.experience) ||
      !Number.isFinite(progress.experienceToNextLevel) || progress.experienceToNextLevel <= 0) {
    throw new Error('Invalid mercenary XP progress');
  }
}

function returnedItem(item: Item): Item {
  const { equipSlot: _equipSlot, ...fields } = item;
  return { ...fields, equipped: false };
}

/** Ownership actions throw WaveGuardError(itemDebitBusy) during the sole Iron debit write. */
export const useMercStore = create<MercState>((set, get) => ({
  ...initialState,
  
  addMerc: (merc) => {
    assertIronGolemOwnershipMutationAllowed();
    set((state) => {
    if (state.ownedMercs.some((m) => m.id === merc.id)) {
      console.warn('Mercenary already owned:', merc.id);
      return state;
    }
    return {
      ownedMercs: [...state.ownedMercs, merc],
      mercEquipment: { ...state.mercEquipment, [merc.id]: state.mercEquipment[merc.id] ?? {} },
      mercProgress: { ...state.mercProgress, [merc.id]: state.mercProgress[merc.id] ?? initialProgress(merc.level) }
    };
  }); },

  hireMerc: (def) => {
    assertIronGolemOwnershipMutationAllowed();
    const state = get();
    if (state.ownedMercs.some((merc) => merc.id.split('#')[0] === def.id)) {
      return { ok: false, reason: 'already-owned' };
    }
    const merc = createMercFromDef(def);
    state.addMerc(merc);
    state.setFieldedMerc(merc.id);
    return { ok: true, mercId: merc.id };
  },
  
  removeMerc: (mercId) => {
    assertIronGolemOwnershipMutationAllowed();
    set((state) => {
    const { [mercId]: _eq, ...restEq } = state.mercEquipment;
    void _eq;
    const { [mercId]: _pg, ...restPg } = state.mercProgress;
    void _pg;
    return {
      ownedMercs: state.ownedMercs.filter((m) => m.id !== mercId),
      fieldedMercId: state.fieldedMercId === mercId ? null : state.fieldedMercId,
      mercEquipment: restEq,
      mercProgress: restPg
    };
  }); },
  
  setFieldedMerc: (mercId) => { set((state) => {
    if (mercId && !state.ownedMercs.some((m) => m.id === mercId)) {
      console.warn('Cannot field mercenary not owned:', mercId);
      return state;
    }
    return { fieldedMercId: mercId };
  }); },
  
  getFieldedMerc: () => {
    const state = get();
    if (!state.fieldedMercId) return null;
    return state.ownedMercs.find((m) => m.id === state.fieldedMercId) ?? null;
  },

  setSkillOrder: (mercId, order) => {
    try {
      assertWaveSnapshotAllowed();
      assertIronGolemOwnershipMutationAllowed();
    } catch (error) {
      if (error instanceof WaveGuardError) return false;
      throw error;
    }
    if (combatRunLifecycle.activeRun !== null || useCombatStore.getState().inCombat) return false;
    const merc = get().ownedMercs.find(candidate => candidate.id === mercId);
    if (!merc) return false;
    const current = getMercConfiguredSkillOrder(merc, get().mercEquipment[mercId]);
    const requested = new Set(order);
    if (order.length !== current.length || requested.size !== current.length ||
      current.some(id => !requested.has(id)) ||
      (merc.signatureSkillId && order[0] !== merc.signatureSkillId)) return false;
    const comboOrder = [...order];
    set(state => ({ ownedMercs: state.ownedMercs.map(candidate =>
      candidate.id === mercId ? { ...candidate, comboOrder } : candidate) }));
    return true;
  },
  
  upgradeMercStar: executeMercStarUpgrade,

  upgradeMerc: (mercId) => { set((state) => {
    const current = state.ownedMercs.find(m => m.id === mercId);
    if (!current) return state;
    const progress = state.mercProgress[mercId];
    const nextProgress = progress?.experienceToNextLevel === mercXpForLevel(current.level)
      ? { ...progress, experienceToNextLevel: mercXpForLevel(current.level + 1) } : progress;
    if (nextProgress) assertFiniteProgress(nextProgress);
    return {
      ownedMercs: state.ownedMercs.map(m => m === current
        ? growMercenary(repairMercenaryGrowth(m), 1) : m),
      mercProgress: nextProgress && nextProgress !== progress
        ? { ...state.mercProgress, [mercId]: nextProgress }
        : state.mercProgress
    };
  }); },

  dismissMerc: (mercId) => {
    assertIronGolemOwnershipMutationAllowed();
    const state = get();
    if (state.hasEquippedItems(mercId)) return false;
    state.removeMerc(mercId);
    return true;
  },

  hasEquippedItems: (mercId) => {
    const equipped = get().mercEquipment[mercId] ?? {};
    return MERC_EQUIPMENT_SLOTS.some((slot) => equipped[slot] !== undefined && equipped[slot] !== null);
  },

  equipOnMerc: (mercId, slot, requestedItem) => {
    assertIronGolemOwnershipMutationAllowed();
    const state = get();
    const merc = state.ownedMercs.find(owned => owned.id === mercId);
    if (!merc) return { ok: false, reason: 'merc_not_owned' };
    const inventory = useInventoryStore.getState();
    const sourceIndex = inventory.backpack.findIndex(item => item.id === requestedItem.id);
    const item = inventory.backpack[sourceIndex];
    if (!item) return { ok: false, reason: 'not_in_backpack' };
    if (!isMercEquipmentSlotCompatible(loadItemBases().get(item.baseId), slot)) return { ok: false, reason: 'incompatible_slot' };
    if (!hasUniqueCharmOwnership(inventory, state.mercEquipment)) return { ok: false, reason: 'incompatible_slot' };
    if (!checkEligibility(item, projectMercenaryStars(merc, state.recruitmentProgress[merc.id.split('#')[0] ?? merc.id]?.stars ?? 0)).eligible) return { ok: false, reason: 'requirements_not_met' };

    const current = state.mercEquipment[mercId] ?? {};
    const displaced = current[slot];
    const backpack = inventory.backpack.filter((_, index) => index !== sourceIndex);
    if (displaced) backpack.push(returnedItem(displaced));
    const mercEquipment = { ...state.mercEquipment,
      [mercId]: { ...current, [slot]: { ...item, equipped: true, equipSlot: slot } } };
    // Complete preflight precedes both synchronous domain publications.
    useInventoryStore.setState({ backpack });
    set({ mercEquipment });
    return { ok: true };
  },

  unequipFromMerc: (mercId, slot) => {
    assertIronGolemOwnershipMutationAllowed();
    const state = get();
    if (!state.ownedMercs.some(merc => merc.id === mercId)) return { ok: false, reason: 'merc_not_owned' };
    const current = state.mercEquipment[mercId] ?? {};
    const item = current[slot];
    if (!item) return { ok: false, reason: 'not_found' };
    const inventory = useInventoryStore.getState();
    if (!hasUniqueCharmOwnership(inventory, state.mercEquipment)) return { ok: false, reason: 'not_found' };
    if (inventory.backpack.length >= BACKPACK_CAPACITY) return { ok: false, reason: 'backpack_full' };
    const backpack = [...inventory.backpack, returnedItem(item)];
    const mercEquipment = { ...state.mercEquipment, [mercId]: { ...current, [slot]: null } };
    useInventoryStore.setState({ backpack });
    set({ mercEquipment });
    return { ok: true };
  },

  getMercEquipment: (mercId) => get().mercEquipment[mercId] ?? {},

  addExperience: (mercId, amount) => {
    if (amount <= 0) {
      const m = get().ownedMercs.find((x) => x.id === mercId);
      return { levelsGained: 0, newLevel: m?.level ?? 1 };
    }
    if (!Number.isFinite(amount)) throw new Error('Invalid mercenary XP');
    const state = get();
    const merc = state.ownedMercs.find((m) => m.id === mercId);
    if (!merc) return { levelsGained: 0, newLevel: 1 };
    let progress = state.mercProgress[mercId] ?? initialProgress(merc.level);
    let level = merc.level;
    let levelsGained = 0;
    let xpRemaining = progress.experience + amount;
    assertFiniteProgress({ ...progress, experience: xpRemaining });
    while (xpRemaining >= progress.experienceToNextLevel) {
      xpRemaining -= progress.experienceToNextLevel;
      level += 1;
      levelsGained += 1;
      progress = { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
      assertFiniteProgress(progress);
    }
    progress = { experience: xpRemaining, experienceToNextLevel: progress.experienceToNextLevel };
    set((s) => {
      const updatedMercs = s.ownedMercs.map((m) => {
        if (m.id !== mercId) return m;
        return growMercenary(repairMercenaryGrowth(m), levelsGained);
      });
      return {
        ownedMercs: updatedMercs,
        mercProgress: { ...s.mercProgress, [mercId]: progress }
      };
    });
    return { levelsGained, newLevel: level };
  },

  getMercProgress: (mercId) => {
    const state = get();
    return state.mercProgress[mercId] ?? initialProgress(
      state.ownedMercs.find((merc) => merc.id === mercId)?.level ?? 1
    );
  },

  shareExperienceWithFielded: (amount, recipientId) => {
    const state = get();
    const id = recipientId === undefined ? state.fieldedMercId : recipientId;
    if (!id || amount <= 0) return;
    const share = Math.floor(amount * MERC_XP_SHARE);
    if (share <= 0) return;
    state.addExperience(id, share);
  },
  
  reset: () => { assertIronGolemOwnershipMutationAllowed(); set(initialState); }
}));
