/** Historical test reconstruction only; production reads the authored loot JSON. */
import { restorePreArmorProgression } from './armorProgressionPolicy';
import policy from '../../tests/fixtures/shield-progression-v1.json';

/** Remove later armor additions, then BUG791's frozen suffixes for exact predecessor checks. */
export function restorePreShieldProgression<T extends {
  id: string; entries: readonly { type: string; rarity?: string }[];
}>(tables: readonly T[]) {
  return restorePreArmorProgression(tables).map(table => {
    const count = policy.tables.find(row => row.id === table.id)?.additions.length ?? 0;
    return { ...table, entries: table.entries.slice(0, table.entries.length - count) };
  });
}
