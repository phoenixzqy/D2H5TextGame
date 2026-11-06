import { afterEach, describe, expect, it } from 'vitest';
import type { Item } from '@/engine/types/items';
import { useInventoryStore } from './inventoryStore';
import { BACKPACK_CAPACITY } from './inventoryCapacity';
import { beginMaterialTransaction, endMaterialTransaction } from './waveTransitionGuard';
import { beginAnyaTradeCostPublication, endAnyaTradeCostPublication, prepareAnyaTradeItem,
  verifyAnyaTradeCostPublication } from './anyaTradeJournal';

const item: Item = { id: 'anya-paid-unique', baseId: 'items/base/glove-vampirebone',
  uniqueId: 'items/unique/frostburn-gauntlet', rarity: 'unique', level: 66,
  identified: true, equipped: false, socketCapacity: 3 };
afterEach(() => { useInventoryStore.getState().reset(); });
function transact(operation: (handle: ReturnType<typeof beginAnyaTradeCostPublication>) => void, scrap = 40, shards = 2000) {
  useInventoryStore.setState({ backpack: [], currencies: { 'rune-shard': shards, wishstone: 9 },
    materials: { 'materials/scrap': scrap, 'runes/el': 7 } });
  const lease = beginMaterialTransaction(true), inv = useInventoryStore.getState();
  const handle = beginAnyaTradeCostPublication(lease, 'frostburn-gauntlet', inv.currencies, inv.materials);
  try { prepareAnyaTradeItem(handle, item); operation(handle); }
  finally { endAnyaTradeCostPublication(handle); endMaterialTransaction(lease); }
}
describe('finite Anya cost and physical ingress', () => {
  it('pays exactly both costs, deletes spent scrap and appends the exact prepared unique once', () => {
    transact(handle => {
      useInventoryStore.getState().debitAnyaTradeCosts(handle);
      useInventoryStore.getState().addAnyaTradeItem(handle, item);
      const inv = useInventoryStore.getState();
      expect(inv.currencies).toEqual({ 'rune-shard': 0, wishstone: 9 });
      expect(inv.materials).toEqual({ 'runes/el': 7 });
      expect(inv.backpack).toEqual([item]); expect(inv.backpack[0]).toBe(item);
      verifyAnyaTradeCostPublication(handle, inv.currencies, inv.materials, true);
      expect(() => { inv.debitAnyaTradeCosts(handle); }).toThrow();
      expect(() => { inv.addAnyaTradeItem(handle, item); }).toThrow();
    });
  });
  it('attributes payment before an observer throws, then restores exact participating funds and retains unrelated writes', () => {
    transact(handle => {
      let fired = false;
      const stop = useInventoryStore.subscribe(next => {
        if (fired || next.currencies['rune-shard'] !== 1) return;
        fired = true;
        useInventoryStore.setState(state => ({ currencies: { ...state.currencies, wishstone: 31 },
          materials: { ...state.materials, 'runes/el': 11 } }));
        throw new Error('injected paid observer');
      });
      try { expect(() => { useInventoryStore.getState().debitAnyaTradeCosts(handle); }).toThrow('injected'); }
      finally { stop(); }
      useInventoryStore.getState().restoreAnyaTradeCosts(handle);
      const inv = useInventoryStore.getState();
      expect(inv.currencies).toEqual({ 'rune-shard': 2001, wishstone: 31 });
      expect(inv.materials).toEqual({ 'materials/scrap': 41, 'runes/el': 11 });
      verifyAnyaTradeCostPublication(handle, inv.currencies, inv.materials, false);
    }, 41, 2001);
  });
  it('refuses ambiguous participating-wallet mutation without overwriting it', () => {
    transact(handle => {
      useInventoryStore.getState().debitAnyaTradeCosts(handle);
      useInventoryStore.setState(state => ({ currencies: { ...state.currencies, 'rune-shard': 8 } }));
      expect(() => { useInventoryStore.getState().restoreAnyaTradeCosts(handle); }).toThrow('Unattributed');
      expect(useInventoryStore.getState().currencies['rune-shard']).toBe(8);
    });
  });
  it('does not append a copied item and fences ordinary spending during payment', () => {
    transact(handle => {
      useInventoryStore.getState().debitAnyaTradeCosts(handle);
      expect(() => { useInventoryStore.getState().addAnyaTradeItem(handle, { ...item }); }).toThrow();
      expect(() => useInventoryStore.getState().spendCurrency('rune-shard', 1)).toThrow('materialBusy');
      expect(() => { useInventoryStore.getState().addItem(item); }).toThrow('materialBusy');
      useInventoryStore.getState().restoreAnyaTradeCosts(handle);
      expect(useInventoryStore.getState().backpack).toEqual([]);
    });
  });
  it('refuses a slot filled after payment and refunds without removing the independent items', () => {
    transact(handle => {
      useInventoryStore.getState().debitAnyaTradeCosts(handle);
      const filler = Array.from({ length: BACKPACK_CAPACITY }, (_, n) => ({ ...item, id: `independent-${String(n)}` }));
      useInventoryStore.setState({ backpack: filler });
      expect(() => { useInventoryStore.getState().addAnyaTradeItem(handle, item); }).toThrow('backpack');
      useInventoryStore.getState().restoreAnyaTradeCosts(handle);
      expect(useInventoryStore.getState().backpack).toBe(filler);
    });
  });
  it.each([undefined, 0, -1, 1999, Number.MAX_VALUE])('refuses invalid or insufficient shard balance %s before payment', amount => {
    const lease = beginMaterialTransaction(true);
    try {
      const wallet = amount === undefined ? {} : { 'rune-shard': amount };
      expect(() => beginAnyaTradeCostPublication(lease, 'waterwalk', wallet, { 'materials/scrap': 40 })).toThrow();
    } finally { endMaterialTransaction(lease); }
  });
});
