/** Historical reconstruction only; production reads authored treasure classes. */
import twoHandedPolicy from '../../tests/fixtures/two-handed-progression-v1.json';
import policy from '../../tests/fixtures/armor-progression-v1.json';

/** Remove later BUG793 rows and BUG792's frozen appended rows for predecessor comparisons. */
export function restorePreArmorProgression<T extends {
  id: string; entries: readonly { type: string; rarity?: string }[];
}>(tables: readonly T[]) {
  return tables.map(table => {
    const count = (policy.tables.find(row => row.id === table.id)?.additions.length ?? 0) +
      (twoHandedPolicy.tables.find(row => row.id === table.id)?.additions.length ?? 0);
    return { ...table, entries: table.entries.slice(0, table.entries.length - count) };
  });
}
