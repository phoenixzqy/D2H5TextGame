import { describe, expect, it } from 'vitest';
import { canonicalActionValue, readMaterialActionState, type MaterialActionReceipt } from './action-state';

const receipt: MaterialActionReceipt = { ordinal: 1, requestHash: 'a'.repeat(64),
  result: { itemId: 'same-instance', materials: { 'runes/el': 1 }, currencies: { 'gem-shard': 2 } } };

describe('closed latest material action ownership', () => {
  it('requires ordinal0 with absent receipt, or matching positive ordinal with one receipt', () => {
    expect(readMaterialActionState({ materialActionOrdinal: 0 })).toEqual({ ordinal: 0 });
    expect(readMaterialActionState({ materialActionOrdinal: 1, latestMaterialAction: receipt })).toEqual({ ordinal: 1, receipt });
    expect(readMaterialActionState({ materialActionOrdinal: Number.MAX_SAFE_INTEGER,
      latestMaterialAction: { ...receipt, ordinal: Number.MAX_SAFE_INTEGER } }).ordinal).toBe(Number.MAX_SAFE_INTEGER);
  });
  it.each([
    {}, { materialActionOrdinal: 0, latestMaterialAction: undefined },
    { materialActionOrdinal: 0, latestMaterialAction: receipt }, { materialActionOrdinal: 1 },
    { materialActionOrdinal: -1 }, { materialActionOrdinal: .5 }, { materialActionOrdinal: Number.MAX_SAFE_INTEGER + 1 },
    { materialActionOrdinal: 2, latestMaterialAction: receipt }
  ])('refuses invalid ordinal/receipt relation %#', value => {
    expect(() => readMaterialActionState(value)).toThrow();
  });
  it.each([
    { ...receipt, extra: true }, { ...receipt, requestHash: 'A'.repeat(64) },
    { ...receipt, requestHash: 'a'.repeat(63) }, { ...receipt, result: { materials: {} } },
    { ...receipt, result: { materials: {}, currencies: {}, itemId: '' } },
    { ...receipt, result: { materials: { 'runes/el': 0 }, currencies: {} } },
    { ...receipt, result: { materials: { 'runes/nonexistent': 1 }, currencies: {} } },
    { ...receipt, result: { materials: {}, currencies: { wishstone: 1 } } },
    { ...receipt, result: { materials: {}, currencies: { 'rune-shard': Number.MAX_SAFE_INTEGER + 1 } } },
    { ...receipt, result: { materials: {}, currencies: {}, item: {} } }
  ])('refuses open or malformed results/hashes %#', latestMaterialAction => {
    expect(() => readMaterialActionState({ materialActionOrdinal: 1, latestMaterialAction })).toThrow();
  });
  it('rejects inherited/hidden/accessor state without evaluating getters', () => {
    let reads = 0;
    for (const input of [Object.create({ materialActionOrdinal: 0 }) as object,
      Object.defineProperty({}, 'materialActionOrdinal', { value: 0 }),
      Object.defineProperty({}, 'materialActionOrdinal', { enumerable: true, get: () => { reads++; return 0; } }),
      { materialActionOrdinal: 1, latestMaterialAction: { ...receipt, result: Object.create({ materials: {}, currencies: {} }) as object } }]) {
      expect(() => readMaterialActionState(input)).toThrow();
    }
    expect(reads).toBe(0);
  });
});

describe('lossless canonical action preimage', () => {
  it('is independent of object insertion order and includes legacy affix Map values and quarantine provenance', () => {
    expect(canonicalActionValue({ b: 2, a: 1 })).toBe(canonicalActionValue({ a: 1, b: 2 }));
    const item = { id: 'gear', affixes: [{ affixId: 'legacy', values: new Map([['statMods.mana', 20]]) }] };
    expect(canonicalActionValue(item)).not.toBe(canonicalActionValue({ ...item, affixes: [] }));
    expect(canonicalActionValue(item)).not.toBe(canonicalActionValue({ ...item,
      affixes: [{ affixId: 'legacy', values: new Map([['statMods.mana', 21]]) }] }));
    expect(canonicalActionValue({ sourceVersion: 18, item, origin: { container: 'backpack', index: 0 } }))
      .not.toBe(canonicalActionValue({ sourceVersion: 18, item, origin: { container: 'stash', index: 0 } }));
    expect(canonicalActionValue({ item, sourceVersion: 18 })).not.toBe(canonicalActionValue({ item, sourceVersion: 16 }));
    expect(canonicalActionValue({ value: undefined })).not.toBe(canonicalActionValue({}));
    expect(canonicalActionValue(new Map([['a', 1]]))).not.toBe(canonicalActionValue([['a', 1]]));
  });
  it('rejects accessors, hidden properties, sparse arrays and cycles without running imported code', () => {
    let reads = 0;
    const cycle: { self?: unknown } = {}; cycle.self = cycle;
    for (const value of [cycle, new Array(1), Infinity,
      Object.defineProperty({}, 'x', { value: 1 }),
      Object.defineProperty({}, 'x', { enumerable: true, get: () => { reads++; return 1; } })]) {
      expect(() => canonicalActionValue(value)).toThrow();
    }
    expect(reads).toBe(0);
  });
});
