/** Historical test reconstruction only; never used by production loot loaders. */
import policy from '../../tests/fixtures/magic-find-rarity-v1.json';

/** Restore only the declared pre-BUG678 fixed rarities for historical comparisons. */
export function restorePreMFRarities<T extends {
  id: string; entries: readonly { type: string; rarity?: string }[];
}>(tables: readonly T[]) {
  return tables.map(table => ({ ...table, entries: table.entries.map((entry, index) => {
    const band = policy.tables.find(row => row.id === table.id)?.bands
      .find(row => row.indices.includes(index));
    return band ? { ...entry, rarity: band.previousRarity } : entry;
  }) }));
}
