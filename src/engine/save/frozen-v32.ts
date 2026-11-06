import additions from './frozen-v32-additions.json';
import { FROZEN_V31, FROZEN_V31_ITEM_BASES } from './frozen-v31';
import type { FrozenNativeQuestDomain } from './quest-domain';
import type { ItemBase } from '../types/items';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
const captured = deepFreeze(additions);

/** Literal32 additions captured before recruitment state or rate authoring. */
export const FROZEN_V32: FrozenNativeQuestDomain = Object.freeze({ ...FROZEN_V31,
  quests: Object.freeze([...FROZEN_V31.quests.filter(old => !captured.quests.some(row => row.id === old.id)),
    ...captured.quests]) as FrozenNativeQuestDomain['quests'],
  items: Object.freeze([...FROZEN_V31.items.filter(old => !captured.items.some(row => row.id === old.id)),
    ...captured.items]) as FrozenNativeQuestDomain['items'],
  actions: FROZEN_V31.actions,
  anya: captured.anya,
  cow: captured.cow,
  fara: captured.fara,
  act2Caches: captured.act2Caches as NonNullable<FrozenNativeQuestDomain['act2Caches']>,
  serviceSources: captured.serviceSources as FrozenNativeQuestDomain['serviceSources']
});

/** Capture includes the six ranged bases added after31; no live loader is consulted. */
export const FROZEN_V32_ITEM_BASES: ReadonlyMap<string, ItemBase> = new Map([
  ...FROZEN_V31_ITEM_BASES,
  ...(captured.itemBases as readonly ItemBase[]).map(row => [row.id, row] as const)
]);
