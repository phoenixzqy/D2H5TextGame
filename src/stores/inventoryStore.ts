/**
 * Inventory store
 * Manages backpack, stash, equipment, and currencies
 */

import { create } from 'zustand';
import { loadItemBases } from '@/data/loaders/loot';
import type { EquipmentSlot, Item, ItemBase } from '@/engine/types/items';
import {
  checkEligibility,
  slotCandidates,
  type PlayerLike
} from '@/features/inventory/compareEquip';
import { usePlayerStore } from './playerStore';

interface EquipSuccess {
  ok: true;
}
interface EquipFailure {
  ok: false;
  reason: 'no_slot' | 'not_in_backpack';
}
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type EquipResult = EquipSuccess | EquipFailure;
interface UnequipResult {
  ok: boolean;
}

interface InventoryState {
  backpack: Item[];
  stash: Item[];
  equipped: Record<string, Item | null>; // slot -> item
  
  // Currencies (runes, gems, materials)
  currencies: Record<string, number>;
  
  // Actions
  addItem: (item: Item, toStash?: boolean) => void;
  removeItem: (itemId: string) => void;
  /**
   * Permanently discards a backpack/stash item. Functionally identical to
   * {@link removeItem} but expresses the player-visible semantic: there is
   * no currency in the game, so removed items are destroyed, not sold.
   *
   * TODO(game-designer): replace with salvage→materials when crafting ships.
   */
  discardItem: (itemId: string) => void;
  /** Bulk variant of {@link discardItem}. Removes any matching ids in either container. */
  bulkDiscard: (itemIds: readonly string[]) => void;
  equipItem: (item: Item) => EquipResult;
  unequipItem: (slot: string) => UnequipResult;
  moveToStash: (itemId: string) => void;
  moveToBackpack: (itemId: string) => void;
  /**
   * Backpack items whose base matches `slot` AND whose `reqLevel`/`reqStats`
   * the supplied player meets. Drives the `<EquipPicker>` modal's enabled
   * row list. Slot-matches that fail eligibility must be discovered via the
   * lower-level `slotCandidates` + `checkEligibility` helpers in compareEquip.ts.
   */
  eligibleForSlot: (slot: EquipmentSlot, player: PlayerLike) => Item[];
  addCurrency: (currencyId: string, amount: number) => void;
  spendCurrency: (currencyId: string, amount: number) => boolean;
  getCurrency: (currencyId: string) => number;
  reset: () => void;
}

const initialState = {
  backpack: [] as Item[],
  stash: [] as Item[],
  equipped: {} as Record<string, Item | null>,
  currencies: {} as Record<string, number>
};

function withEquippedFlag(item: Item, equipped: boolean): Item {
  return { ...item, equipped };
}

function targetSlotFor(baseSlot: EquipmentSlot, equipped: Record<string, Item | null>): EquipmentSlot {
  if (baseSlot !== 'ring-left' && baseSlot !== 'ring-right') return baseSlot;
  if (!equipped['ring-left']) return 'ring-left';
  if (!equipped['ring-right']) return 'ring-right';
  return 'ring-left';
}

function isTwoHandedBase(base: ItemBase | undefined): boolean {
  if (!base || base.slot !== 'weapon') return false;
  return (
    base.id.includes('/wp2h-') ||
    base.id === 'items/base/weapon-bow' ||
    base.id === 'items/base/weapon-crossbow' ||
    base.id === 'items/base/weapon-polearm'
  );
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  ...initialState,
  
  addItem: (item, toStash = false) => { set((state) => {
    const target = toStash ? 'stash' : 'backpack';
    const maxCapacity = toStash ? 2000 : 500;
    
    if (state[target].length >= maxCapacity) {
      console.warn(`${target} is full!`);
      return state;
    }
    
    return {
      [target]: [...state[target], item]
    };
  }); },
  
  removeItem: (itemId) => { set((state) => ({
    backpack: state.backpack.filter((i) => i.id !== itemId),
    stash: state.stash.filter((i) => i.id !== itemId)
  })); },

  discardItem: (itemId) => { set((state) => ({
    backpack: state.backpack.filter((i) => i.id !== itemId),
    stash: state.stash.filter((i) => i.id !== itemId)
  })); },

  bulkDiscard: (itemIds) => { set((state) => {
    const ids = new Set(itemIds);
    return {
      backpack: state.backpack.filter((i) => !ids.has(i.id)),
      stash: state.stash.filter((i) => !ids.has(i.id))
    };
  }); },
  
  equipItem: (item) => {
    const bases = loadItemBases();
    const base = bases.get(item.baseId);
    if (!base?.slot) return { ok: false, reason: 'no_slot' };

    const state = get();
    if (!state.backpack.some((i) => i.id === item.id)) {
      return { ok: false, reason: 'not_in_backpack' };
    }

    const targetSlot = targetSlotFor(base.slot, state.equipped);
    const nextEquipped: Record<string, Item | null> = { ...state.equipped };
    const nextBackpack = state.backpack.filter((i) => i.id !== item.id);
    const displaced: Item[] = [];

    const existingInTarget = nextEquipped[targetSlot];
    if (existingInTarget) displaced.push(withEquippedFlag(existingInTarget, false));

    if (targetSlot === 'weapon' && isTwoHandedBase(base)) {
      const offhand = nextEquipped.offhand;
      if (offhand) displaced.push(withEquippedFlag(offhand, false));
      nextEquipped.offhand = null;
    }

    if (targetSlot === 'offhand') {
      const weapon = nextEquipped.weapon;
      const weaponBase = weapon ? bases.get(weapon.baseId) : undefined;
      if (weapon && isTwoHandedBase(weaponBase)) {
        displaced.push(withEquippedFlag(weapon, false));
        nextEquipped.weapon = null;
      }
    }

    nextEquipped[targetSlot] = withEquippedFlag(item, true);

    const equippedAfter = nextEquipped;
    set({
      equipped: equippedAfter,
      backpack: [...nextBackpack, ...displaced]
    });
    usePlayerStore.getState().recomputeDerived(equippedAfter);
    return { ok: true };
  },
  
  unequipItem: (slot) => {
    const state = get();
    const item = state.equipped[slot];
    if (!item) return { ok: false };

    const equippedAfter = {
      ...state.equipped,
      [slot]: null
    };
    set({
      equipped: equippedAfter,
      backpack: [...state.backpack, withEquippedFlag(item, false)]
    });
    usePlayerStore.getState().recomputeDerived(equippedAfter);
    return { ok: true };
  },
  
  moveToStash: (itemId) => { set((state) => {
    const item = state.backpack.find((i) => i.id === itemId);
    if (!item || state.stash.length >= 2000) return state;
    
    return {
      backpack: state.backpack.filter((i) => i.id !== itemId),
      stash: [...state.stash, item]
    };
  }); },
  
  moveToBackpack: (itemId) => { set((state) => {
    const item = state.stash.find((i) => i.id === itemId);
    if (!item || state.backpack.length >= 500) return state;
    
    return {
      stash: state.stash.filter((i) => i.id !== itemId),
      backpack: [...state.backpack, item]
    };
  }); },
  
  eligibleForSlot: (slot, player) => {
    const bases = loadItemBases();
    return slotCandidates(get().backpack, slot, bases).filter(
      (it) => checkEligibility(it, player, bases).eligible
    );
  },

  addCurrency: (currencyId, amount) => { set((state) => ({
    currencies: {
      ...state.currencies,
      [currencyId]: (state.currencies[currencyId] ?? 0) + amount
    }
  })); },
  
  spendCurrency: (currencyId, amount) => {
    const state = get();
    const current = state.currencies[currencyId] ?? 0;
    
    if (current < amount) {
      return false;
    }
    
    set((state) => ({
      currencies: {
        ...state.currencies,
        [currencyId]: current - amount
      }
    }));
    
    return true;
  },
  
  getCurrency: (currencyId) => {
    const state = get();
    return state.currencies[currencyId] ?? 0;
  },
  
  reset: () => { set(initialState); }
}));
