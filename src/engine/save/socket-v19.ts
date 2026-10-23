import type { ItemBase } from '../types/items';
import { validateCanonicalSocketItem, type CanonicalSocketItem } from '../items/socket-contents';
import type { HistoricalItem } from './historical-items';
import { historicalSocketBases, validateItemServiceFields } from './historical-sockets';

/**
 * Project a valid v18 item without changing its payload or inferring materials.
 * Null means preserve the exact original in version-tagged quarantine; invalid
 * predecessors throw. The save migration owns provenance, slot removal and
 * recovery. This helper does not install a new save version or refund anything.
 */
export function convertV18SocketItem(item: HistoricalItem, base: ItemBase | undefined): CanonicalSocketItem | null {
  if ('socketContents' in item) throw new Error('Reserved canonical sockets in v18 item');
  const historicalBase = historicalSocketBases.find(row => row.id === item.baseId);
  if (!historicalBase) throw new Error('Unknown historical socket base');
  validateItemServiceFields(item, historicalBase);
  if (!base) return null;
  const { runes, ...rest } = item;
  const projected: CanonicalSocketItem = {
    ...rest,
    ...(runes ? { socketContents: runes.map(id => ({ kind: 'rune' as const, id })) } : {})
  };
  try {
    validateCanonicalSocketItem(projected, base);
    return projected;
  } catch {
    return null;
  }
}
