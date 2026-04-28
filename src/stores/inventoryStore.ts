/**
 * Inventory store
 * Manages backpack, stash, equipment, and currencies
 */

import { create } from 'zustand';
import type { Item } from '@/engine/types/items';

interface InventoryState {
  backpack: Item[];
  stash: Item[];
  equipped: Record<string, Item | null>; // slot -> item
  
  // Currencies (runes, gems, materials)
  currencies: Record<string, number>;
  
  // Actions
  addItem: (item: Item, toStash?: boolean) => void;
  removeItem: (itemId: string) => void;
  equipItem: (item: Item, slot: string) => void;
  unequipItem: (slot: string) => void;
  moveToStash: (itemId: string) => void;
  moveToBackpack: (itemId: string) => void;
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
  
  equipItem: (item, slot) => { set((state) => ({
    equipped: {
      ...state.equipped,
      [slot]: item
    },
    backpack: state.backpack.filter((i) => i.id !== item.id)
  })); },
  
  unequipItem: (slot) => { set((state) => {
    const item = state.equipped[slot];
    if (!item) return state;
    
    return {
      equipped: {
        ...state.equipped,
        [slot]: null
      },
      backpack: [...state.backpack, item]
    };
  }); },
  
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
