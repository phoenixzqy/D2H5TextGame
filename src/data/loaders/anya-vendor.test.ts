import { describe, expect, it } from 'vitest';
import { loadAnyaUniqueCatalog, validateAnyaUniqueCatalog } from './anya-vendor';

describe('finite Anya catalog loading', () => {
  it('pins two ordered named lifetime trades at fixed prices', () => {
    const catalog = loadAnyaUniqueCatalog();
    expect(catalog.entries.map(entry => [entry.id, entry.uniqueId, entry.ilvl, entry.stock])).toEqual([
      ['frostburn-gauntlet', 'items/unique/frostburn-gauntlet', 66, 1], ['waterwalk', 'items/unique/waterwalk', 66, 1]
    ]);
    expect(catalog.entries.map(entry => entry.costs)).toEqual([
      { materials: { 'materials/scrap': 40 }, currencies: { 'rune-shard': 2000 } },
      { materials: { 'materials/scrap': 40 }, currencies: { 'rune-shard': 2000 } },
    ]);
    expect(loadAnyaUniqueCatalog()).toBe(catalog);
  });
  it.each(['discount', 'extra-stock', 'wrong-unique', 'reorder', 'extra-cost', 'extra-entry'] as const)('rejects %s authoring', fault => {
    const catalog = structuredClone(loadAnyaUniqueCatalog()), entry = catalog.entries[0];
    if (!entry) throw new Error('Missing fixture entry');
    if (fault === 'discount') Reflect.set(entry.costs.materials, 'materials/scrap', 39);
    if (fault === 'extra-stock') Reflect.set(entry, 'stock', 2);
    if (fault === 'wrong-unique') Reflect.set(entry, 'uniqueId', 'items/unique/waterwalk');
    if (fault === 'reorder') Reflect.set(catalog, 'entries', [...catalog.entries].reverse());
    if (fault === 'extra-cost') Reflect.set(entry.costs.currencies, 'gold', 1);
    if (fault === 'extra-entry') Reflect.set(catalog, 'entries', [...catalog.entries, entry]);
    expect(() => validateAnyaUniqueCatalog(catalog)).toThrow('Invalid');
  });
  it('rejects price accessors before execution', () => {
    const catalog = structuredClone(loadAnyaUniqueCatalog()), entry = catalog.entries[0]; let reads = 0;
    if (!entry) throw new Error('Missing fixture entry');
    Object.defineProperty(entry.costs.materials, 'materials/scrap', { enumerable: true, get() { reads++; return 40; } });
    expect(() => validateAnyaUniqueCatalog(catalog)).toThrow('Invalid'); expect(reads).toBe(0);
  });
});
