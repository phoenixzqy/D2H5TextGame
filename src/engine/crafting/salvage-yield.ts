import { materialRecipeRules } from '@/data/loaders/material-recipes';
import type { Item } from '../types/items';

/** Shared, JSON-backed scrap yield for manual salvage and automatic loot handling. */
export function salvageYield(item: Pick<Item, 'rarity' | 'level' | 'ilvl'>): number {
  const level = item.ilvl ?? item.level;
  if (!Number.isSafeInteger(level) || level < 1) throw new Error('Invalid salvage item level');
  const amount = materialRecipeRules.salvage.rarityYields[item.rarity] *
    (1 + Math.floor((level - 1) / materialRecipeRules.salvage.levelBandSize));
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('Salvage output overflow');
  return amount;
}
