import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInventoryStore } from './inventoryStore';
import { beginIronGolemDebit, beginWaveTransition, endIronGolemDebit, endWaveTransition, beginMaterialTransaction, endMaterialTransaction } from './waveTransitionGuard';

beforeEach(() => { useInventoryStore.getState().reset(); });

describe('concrete inventory materials', () => {
  it('interlocks every participating material/currency helper with material publication and rollback', () => {
    const before = useInventoryStore.getState(), lease = beginMaterialTransaction(true);
    try {
      expect(() => { before.addMaterials({ 'runes/el': 1 }); }).toThrow('materialBusy');
      expect(() => { before.addCurrency('rune-shard', 1); }).toThrow('materialBusy');
      expect(() => before.spendCurrency('rune-shard', 1)).toThrow('materialBusy');
    } finally { endMaterialTransaction(lease); }
    expect(useInventoryStore.getState()).toBe(before);
  });
  it('keeps one capacity-independent ledger and merges all validated stacks in one publication', () => {
    const before = useInventoryStore.getState();
    expect(before.materials).toEqual({});
    before.addMaterials({ 'runes/ral': 2 });
    const listener = vi.fn();
    const unsubscribe = useInventoryStore.subscribe(listener);
    try { useInventoryStore.getState().addMaterials({ 'runes/ral': 3, 'gems/ruby/chipped': 1 }); }
    finally { unsubscribe(); }
    const after = useInventoryStore.getState();
    expect(after.materials).toEqual({ 'runes/ral': 5, 'gems/ruby/chipped': 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(after.currencies).toEqual(before.currencies);
    expect(after.backpack).toBe(before.backpack);
    expect(after.stash).toBe(before.stash);
    after.reset();
    expect(useInventoryStore.getState().materials).toEqual({});
  });

  it('accepts the exact safe-integer cap and refuses a whole overflowing merge', () => {
    useInventoryStore.getState().addMaterials({ 'runes/ral': Number.MAX_SAFE_INTEGER });
    const before = useInventoryStore.getState();
    expect(() => { before.addMaterials({ 'gems/ruby/chipped': 2, 'runes/ral': 1 }); }).toThrow();
    expect(useInventoryStore.getState()).toBe(before);
  });

  it('retains the existing Iron ownership guard during a native debit', () => {
    const before = useInventoryStore.getState(), lease = beginWaveTransition(true);
    beginIronGolemDebit(lease);
    try { expect(() => { before.addMaterials({ 'runes/ral': 1 }); }).toThrow('itemDebitBusy'); }
    finally { endIronGolemDebit(lease); endWaveTransition(lease); }
    expect(useInventoryStore.getState()).toBe(before);
  });

  it.each([{ 'runes/unknown': 1 }, { 'runes/ral': 0 }, { 'runes/ral': -1 }, { 'runes/ral': 0.5 },
    { 'runes/ral': Infinity }, { 'runes/ral': NaN }, JSON.parse('{"__proto__":1}') as Record<string, number>
  ])('refuses a malformed whole bag before notifying listeners: %j', invalid => {
    const before = useInventoryStore.getState();
    const listener = vi.fn(), unsubscribe = useInventoryStore.subscribe(listener);
    try { expect(() => { before.addMaterials({ 'gems/ruby/chipped': 1, ...invalid }); }).toThrow(); }
    finally { unsubscribe(); }
    expect(useInventoryStore.getState()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });
});
