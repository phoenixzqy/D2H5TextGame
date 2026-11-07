import type { Item, ItemBase } from '../types/items';
import type { KillRewards } from './award';
import { mergeRewards } from './reward-plan';
import { salvageYield } from '../crafting/salvage-yield';
import { materialRecipeRules } from '@/data/loaders/material-recipes';

export const LOOT_FILTER_RARITIES = ['normal', 'magic', 'rare', 'unique', 'set'] as const;
export type LootFilterAction = 'keep' | 'salvage' | 'discard';

/** Opt-in handling of newly generated gear. Zero cutoff applies at every item level. */
export interface LootFilterSettings {
  readonly enabled: boolean;
  readonly maxItemLevel: number;
  readonly actions: Readonly<Record<typeof LOOT_FILTER_RARITIES[number], LootFilterAction>>;
}

export const DEFAULT_LOOT_FILTER: LootFilterSettings = Object.freeze({
  enabled: false, maxItemLevel: 0,
  actions: Object.freeze({ normal: 'keep', magic: 'keep', rare: 'keep', unique: 'keep', set: 'keep' })
});

/** Reject unsafe preference updates at the store boundary before publication. */
export function assertLootFilterSettings(settings: unknown): asserts settings is LootFilterSettings {
  if (typeof settings !== 'object' || settings === null || !('enabled' in settings) ||
    !('maxItemLevel' in settings) || !('actions' in settings) ||
    typeof settings.enabled !== 'boolean' || typeof settings.maxItemLevel !== 'number' ||
    !Number.isSafeInteger(settings.maxItemLevel) || settings.maxItemLevel < 0 ||
    typeof settings.actions !== 'object' || settings.actions === null ||
    !LOOT_FILTER_RARITIES.every(rarity => {
      const action = (settings.actions as Record<string, unknown>)[rarity];
      return action === 'keep' || action === 'salvage' || action === 'discard';
    })) {
    throw new Error('Invalid loot filter settings');
  }
}

function actionFor(item: Item, settings: LootFilterSettings, bases: ReadonlyMap<string, ItemBase>): LootFilterAction {
  const base = bases.get(item.baseId);
  const level = item.ilvl ?? item.level;
  if (!base || !['weapon', 'armor', 'jewelry'].includes(base.type) || !base.slot || item.equipped ||
    item.rarity === 'runeword' || item.runewordId !== undefined || item.personalizedBy !== undefined ||
    (item.socketContents?.length ?? 0) > 0 || !Number.isSafeInteger(level) || level < 1 ||
    settings.maxItemLevel > 0 && level > settings.maxItemLevel ||
    !LOOT_FILTER_RARITIES.some(rarity => rarity === item.rarity)) return 'keep';
  return settings.actions[item.rarity];
}

/**
 * Transform a private, preflighted combat bag, preserving RNG and ordinary rewards.
 * Callers must validate raw ownership before filtering, then preflight this output
 * before publishing any domain. Existing inventory and quest grants never enter here.
 */
export function filterGeneratedLoot(rewards: KillRewards, settings: LootFilterSettings | undefined,
  bases: ReadonlyMap<string, ItemBase>): { rewards: KillRewards; salvaged: number; discarded: number } {
  if (!settings) return { rewards, salvaged: 0, discarded: 0 };
  assertLootFilterSettings(settings);
  if (!settings.enabled) return { rewards, salvaged: 0, discarded: 0 };
  let salvaged = 0, discarded = 0, scrap = 0;
  const items = rewards.items.filter(item => {
    const action = actionFor(item, settings, bases);
    if (action === 'keep') return true;
    if (action === 'salvage') { scrap += salvageYield(item); salvaged++; }
    else discarded++;
    return false;
  });
  const filtered = { ...rewards, items };
  return { rewards: scrap > 0 ? mergeRewards(filtered, { items: [], runeShards: 0, wishstones: 0,
    runes: 0, gems: 0, materials: { [materialRecipeRules.salvage.materialId]: scrap } }) : filtered,
    salvaged, discarded };
}
