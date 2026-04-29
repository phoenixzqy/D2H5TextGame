/**
 * Mercenary store
 * Manages owned mercenaries, fielded selection, per-merc equipment, and
 * progression (Bugs #7, #8, #12).
 */

import { create } from 'zustand';
import type { Mercenary } from '@/engine/types/entities';
import type { EquipmentSlot, Item, ItemBase } from '@/engine/types/items';
import { loadItemBases } from '@/data/loaders/loot';

/**
 * Mercenary XP curve (canonical).
 *
 * `mercXpForLevel(L)` = XP required to advance **from level L to L+1**.
 *
 * Formula:  `floor(60 * L * 1.30^(L-1))`
 *
 * Rationale:
 *  - L=1 → 60 XP. With Act-1 fallen kills granting ~20-30 XP (× 0.75 merc
 *    share ≈ 15-22 XP/kill) a fielded trainee dings to L2 in 3-4 fights.
 *  - L=10 → 6,362 XP. At ~80 monster XP × 0.75 share ≈ 60/kill, that is
 *    ~106 kills to clear L10→L11 — within the 100-200 kill design target.
 *  - L=99 → ≈ 8.6e14 XP. Comfortably below `Number.MAX_SAFE_INTEGER`
 *    (≈ 9.0e15) so all arithmetic remains exact integer.
 *
 * Inspired by classic D2 monster-XP scaling (per-area XP grows ~1.25-1.35×
 * per level), with a per-level linear `L` factor to keep the early game
 * brisk without trivialising the late game. Curve was tuned by hand to the
 * targets above; if `qa-engineer` runs a sim, we can revisit the 1.30 base.
 *
 * Monotonic: `mercXpForLevel(L+1) > mercXpForLevel(L)` for all L ≥ 1.
 */
export function mercXpForLevel(level: number): number {
  const L = Math.max(1, level);
  return Math.floor(60 * L * Math.pow(1.30, L - 1));
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

/** Per-level gain block applied on each merc level-up. */
interface PerLevelGain {
  readonly life: number;
  readonly strength: number;
  readonly dexterity: number;
  readonly energy: number;
}

/**
 * Per-class per-level stat gains, keyed by `Mercenary.classId` (which mirrors
 * `MercDef.classRef`). Values picked to give each class a distinct identity:
 *  - rogue / thief   → dex-heavy archers / skirmishers
 *  - desert-merc     → str + life polearm tank
 *  - iron-wolf       → caster (low life, high energy)
 *  - barbarian       → highest life pool, str-heavy
 *  - paladin         → balanced front-line
 *  - militia         → unremarkable generalist
 *  - acolyte         → caster healer (energy-focused)
 *
 * Class IDs not present in this table fall through to {@link DEFAULT_PER_LEVEL_GAIN}.
 */
const PER_LEVEL_GAIN_BY_CLASS: Readonly<Record<string, PerLevelGain>> = Object.freeze({
  'rogue':        { life: 8,  strength: 1, dexterity: 3, energy: 1 },
  'desert-merc':  { life: 14, strength: 3, dexterity: 1, energy: 1 },
  'iron-wolf':    { life: 6,  strength: 1, dexterity: 1, energy: 4 },
  'barbarian':    { life: 16, strength: 3, dexterity: 2, energy: 0 },
  'paladin':      { life: 12, strength: 2, dexterity: 1, energy: 1 },
  'militia':      { life: 10, strength: 2, dexterity: 1, energy: 1 },
  'thief':        { life: 7,  strength: 1, dexterity: 3, energy: 1 },
  'acolyte':      { life: 6,  strength: 1, dexterity: 1, energy: 4 }
});

/** Fallback gains for unknown / legacy classes. */
const DEFAULT_PER_LEVEL_GAIN: PerLevelGain = Object.freeze({
  life: 10, strength: 2, dexterity: 1, energy: 1
});

/** Resolve gains for a merc class id (case-sensitive). */
export function getPerLevelGain(classId: string | undefined): PerLevelGain {
  if (!classId) return DEFAULT_PER_LEVEL_GAIN;
  return PER_LEVEL_GAIN_BY_CLASS[classId] ?? DEFAULT_PER_LEVEL_GAIN;
}

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

interface MercState {
  ownedMercs: Mercenary[];
  fieldedMercId: string | null;
  /** Bug #8 — keyed by merc id → slot → equipped item. */
  mercEquipment: Record<string, MercEquipment>;
  /** Bug #12 — keyed by merc id → XP progress. */
  mercProgress: Record<string, MercProgress>;
  
  // Actions
  addMerc: (merc: Mercenary) => void;
  removeMerc: (mercId: string) => void;
  setFieldedMerc: (mercId: string | null) => void;
  getFieldedMerc: () => Mercenary | null;
  upgradeMerc: (mercId: string) => void;
  /**
   * Bug #7 — dismiss a merc. Returns every equipped item to the supplied
   * `returnItem` callback (typically `useInventoryStore.addItem`) and
   * removes the merc from the roster. No-ops on unknown id.
   */
  dismissMerc: (mercId: string, returnItem: (item: Item) => void) => void;
  /**
   * Bug #8 — equip an item on a merc in the given slot. Returns the
   * displaced item if any (caller is responsible for returning it to the
   * inventory). Validates that the item's base slot matches the target.
   */
  equipOnMerc: (mercId: string, slot: EquipmentSlot, item: Item) => Item | null;
  /** Bug #8 — unequip a merc's slot, returning the item (or null). */
  unequipFromMerc: (mercId: string, slot: EquipmentSlot) => Item | null;
  getMercEquipment: (mercId: string) => MercEquipment;
  /**
   * Bug #12 — credit a merc with `amount` XP, levelling up across as
   * many thresholds as the XP covers. Stat/HP gains apply per level.
   */
  addExperience: (mercId: string, amount: number) => { levelsGained: number; newLevel: number };
  getMercProgress: (mercId: string) => MercProgress;
  /**
   * Bug #12 — share `amount` XP with the currently fielded merc using
   * {@link MERC_XP_SHARE}. Safe no-op when no merc is fielded.
   */
  shareExperienceWithFielded: (amount: number) => void;
  reset: () => void;
}

const initialState = {
  ownedMercs: [] as Mercenary[],
  fieldedMercId: null,
  mercEquipment: {} as Record<string, MercEquipment>,
  mercProgress: {} as Record<string, MercProgress>
};

function isCompatibleSlot(base: ItemBase | undefined, slot: EquipmentSlot): boolean {
  if (!base?.slot) return false;
  if (base.slot === slot) return true;
  // Rings are interchangeable across the two ring slots.
  if (base.slot === 'ring-left' || base.slot === 'ring-right') {
    return slot === 'ring-left' || slot === 'ring-right';
  }
  return false;
}

function initialProgress(): MercProgress {
  return { experience: 0, experienceToNextLevel: mercXpForLevel(1) };
}

export const useMercStore = create<MercState>((set, get) => ({
  ...initialState,
  
  addMerc: (merc) => { set((state) => {
    if (state.ownedMercs.some((m) => m.id === merc.id)) {
      console.warn('Mercenary already owned:', merc.id);
      return state;
    }
    return {
      ownedMercs: [...state.ownedMercs, merc],
      mercEquipment: { ...state.mercEquipment, [merc.id]: state.mercEquipment[merc.id] ?? {} },
      mercProgress: { ...state.mercProgress, [merc.id]: state.mercProgress[merc.id] ?? initialProgress() }
    };
  }); },
  
  removeMerc: (mercId) => { set((state) => {
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
  
  upgradeMerc: (mercId) => { set((state) => {
    return {
      ownedMercs: state.ownedMercs.map((m) =>
        m.id === mercId ? { ...m, level: m.level + 1 } : m
      )
    };
  }); },

  dismissMerc: (mercId, returnItem) => {
    const state = get();
    const equipped = state.mercEquipment[mercId] ?? {};
    for (const slot of MERC_EQUIPMENT_SLOTS) {
      const it = equipped[slot];
      if (it) returnItem({ ...it, equipped: false });
    }
    state.removeMerc(mercId);
  },

  equipOnMerc: (mercId, slot, item) => {
    const bases = loadItemBases();
    const base = bases.get(item.baseId);
    if (!isCompatibleSlot(base, slot)) {
      console.warn('Item base not compatible with slot:', item.baseId, slot);
      return null;
    }
    let displaced: Item | null = null;
    set((state) => {
      const current = state.mercEquipment[mercId] ?? {};
      displaced = current[slot] ?? null;
      const next: MercEquipment = { ...current, [slot]: { ...item, equipped: true, equipSlot: slot } };
      return { mercEquipment: { ...state.mercEquipment, [mercId]: next } };
    });
    return displaced;
  },

  unequipFromMerc: (mercId, slot) => {
    const state = get();
    const current = state.mercEquipment[mercId] ?? {};
    const item = current[slot] ?? null;
    if (!item) return null;
    set((s) => ({
      mercEquipment: {
        ...s.mercEquipment,
        [mercId]: { ...current, [slot]: null }
      }
    }));
    return { ...item, equipped: false };
  },

  getMercEquipment: (mercId) => get().mercEquipment[mercId] ?? {},

  addExperience: (mercId, amount) => {
    if (amount <= 0) {
      const m = get().ownedMercs.find((x) => x.id === mercId);
      return { levelsGained: 0, newLevel: m?.level ?? 1 };
    }
    const state = get();
    const merc = state.ownedMercs.find((m) => m.id === mercId);
    if (!merc) return { levelsGained: 0, newLevel: 1 };
    let progress = state.mercProgress[mercId] ?? initialProgress();
    let level = merc.level;
    let levelsGained = 0;
    let xpRemaining = progress.experience + amount;
    while (xpRemaining >= progress.experienceToNextLevel) {
      xpRemaining -= progress.experienceToNextLevel;
      level += 1;
      levelsGained += 1;
      progress = { experience: 0, experienceToNextLevel: mercXpForLevel(level) };
    }
    progress = { experience: xpRemaining, experienceToNextLevel: progress.experienceToNextLevel };
    set((s) => {
      const updatedMercs = s.ownedMercs.map((m) => {
        if (m.id !== mercId) return m;
        if (levelsGained === 0) return m;
        const gain = getPerLevelGain(m.classId);
        const ds = m.derivedStats;
        const cs = m.coreStats;
        const lifeBonus = gain.life * levelsGained;
        return {
          ...m,
          level,
          coreStats: {
            ...cs,
            strength: cs.strength + gain.strength * levelsGained,
            dexterity: cs.dexterity + gain.dexterity * levelsGained,
            energy: cs.energy + gain.energy * levelsGained
          },
          derivedStats: {
            ...ds,
            lifeMax: ds.lifeMax + lifeBonus,
            life: Math.min(ds.lifeMax + lifeBonus, ds.life + lifeBonus)
          }
        };
      });
      return {
        ownedMercs: updatedMercs,
        mercProgress: { ...s.mercProgress, [mercId]: progress }
      };
    });
    return { levelsGained, newLevel: level };
  },

  getMercProgress: (mercId) => get().mercProgress[mercId] ?? initialProgress(),

  shareExperienceWithFielded: (amount) => {
    const state = get();
    const id = state.fieldedMercId;
    if (!id || amount <= 0) return;
    const share = Math.floor(amount * MERC_XP_SHARE);
    if (share <= 0) return;
    state.addExperience(id, share);
  },
  
  reset: () => { set(initialState); }
}));
