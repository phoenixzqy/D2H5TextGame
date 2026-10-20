/**
 * Inventory store
 * Manages backpack, stash, equipment, and currencies
 */

import { create } from 'zustand';
import { loadItemBases } from '@/data/loaders/loot';
import type { EquipmentSlot, Item, ItemBase } from '@/engine/types/items';
import { isTwoHanded } from '@/engine/inventory/equipValidator';
import {
  checkEligibility,
  resolveAutoEquipSlot,
  slotCandidates,
  type PlayerLike
} from '@/features/inventory/compareEquip';
import { usePlayerStore } from './playerStore';
import { BACKPACK_CAPACITY, STASH_CAPACITY } from './inventoryCapacity';

interface EquipSuccess {
  ok: true;
}
export interface EquipFailure {
  ok: false;
  reason: 'no_slot' | 'not_in_backpack' | 'requirements_not_met' | 'backpack_full';
}
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type EquipResult = EquipSuccess | EquipFailure;
type UnequipResult = { ok: true } | { ok: false; reason: 'not_found' | 'backpack_full' };
type TransferResult = { ok: true } | {
  ok: false;
  reason: 'not_found' | 'backpack_full' | 'stash_full';
};

interface InventoryState {
  backpack: Item[];
  stash: Item[];
  equipped: Record<string, Item | null>; // slot -> item
  
  // Currencies (runes, gems, materials)
  currencies: Record<string, number>;
  
  // Actions
  /** Retain earned/returned items, including visible recovery overflow. Never rejects by length. */
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
  /** Move one backpack item if stash has room; refusal leaves all state unchanged. */
  moveToStash: (itemId: string) => TransferResult;
  /** Move one stash item if backpack has room; overflow sources can still recover. */
  moveToBackpack: (itemId: string) => TransferResult;
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
  return resolveAutoEquipSlot(baseSlot, equipped);
}

function isTwoHandedBase(base: ItemBase | undefined): boolean {
  return isTwoHanded(base);
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  ...initialState,
  
  addItem: (item, toStash = false) => { set((state) => {
    const target = toStash ? 'stash' : 'backpack';
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
  
  equipItem: (requestedItem) => {
    const state = get();
    const sourceIndex = state.backpack.findIndex((item) => item.id === requestedItem.id);
    const item = state.backpack[sourceIndex];
    if (!item) return { ok: false, reason: 'not_in_backpack' };

    const bases = loadItemBases();
    const base = bases.get(item.baseId);
    if (!base?.slot) return { ok: false, reason: 'no_slot' };

    const player = usePlayerStore.getState().player;
    if (player) {
      const eligibility = checkEligibility(
        item,
        { level: player.level, coreStats: player.coreStats, derivedStats: player.derivedStats },
        bases
      );
      if (!eligibility.eligible) return { ok: false, reason: 'requirements_not_met' };
    }

    const targetSlot = targetSlotFor(base.slot, state.equipped);
    const nextEquipped: Record<string, Item | null> = { ...state.equipped };
    const nextBackpack = state.backpack.filter((_, index) => index !== sourceIndex);
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

    if (nextBackpack.length + displaced.length > Math.max(BACKPACK_CAPACITY, state.backpack.length)) {
      return { ok: false, reason: 'backpack_full' };
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
    if (!item) return { ok: false, reason: 'not_found' };
    if (state.backpack.length >= BACKPACK_CAPACITY) return { ok: false, reason: 'backpack_full' };

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
  
  moveToStash: (itemId) => {
    const state = get();
    const index = state.backpack.findIndex((item) => item.id === itemId);
    const item = state.backpack[index];
    if (!item) return { ok: false, reason: 'not_found' };
    if (state.stash.length >= STASH_CAPACITY) return { ok: false, reason: 'stash_full' };
    set({
      backpack: state.backpack.filter((_, i) => i !== index),
      stash: [...state.stash, item]
    });
    return { ok: true };
  },
  
  moveToBackpack: (itemId) => {
    const state = get();
    const index = state.stash.findIndex((item) => item.id === itemId);
    const item = state.stash[index];
    if (!item) return { ok: false, reason: 'not_found' };
    if (state.backpack.length >= BACKPACK_CAPACITY) return { ok: false, reason: 'backpack_full' };
    set({
      stash: state.stash.filter((_, i) => i !== index),
      backpack: [...state.backpack, item]
    });
    return { ok: true };
  },
  
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
