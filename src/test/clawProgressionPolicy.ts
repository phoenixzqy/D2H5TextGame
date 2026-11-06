/** Historical test reconstruction only; production uses the authored loot JSON. */
import policy from '../../tests/fixtures/claw-progression-v1.json';

/** Remove only BUG790's declared appended rows for predecessor comparisons. */
export function restorePreClawProgression<T extends {
  id: string; entries: readonly { type: string; rarity?: string }[];
}>(tables: readonly T[]) {
  return tables.map(table => {
    const count = policy.tables.find(row => row.id === table.id)?.additions.length ?? 0;
    return { ...table, entries: table.entries.slice(0, table.entries.length - count) };
  });
}
