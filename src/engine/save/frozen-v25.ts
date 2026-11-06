import snapshot from './frozen-v25-quests.json';
import itemBases from './frozen-v25-item-bases.json';
import type { ItemBase } from '../types/items';
import type { FrozenNativeQuestDomain } from './quest-domain';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Accepted actual25 authority, before Larzuk adds a new finite Present proof. */
export const FROZEN_V25: FrozenNativeQuestDomain = deepFreeze(snapshot as unknown as FrozenNativeQuestDomain);
/** Literal25 includes the canonical charm base; future live edits cannot redefine it. */
export const FROZEN_V25_ITEM_BASES: ReadonlyMap<string, ItemBase> = new Map(
  deepFreeze(itemBases as readonly ItemBase[]).map(base => [base.id, base]));
