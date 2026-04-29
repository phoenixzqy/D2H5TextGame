/**
 * Rarity rules loader
 * Loads item rarity drop weights and affix distributions
 * @module data/loaders/rarity
 */

export interface AffixRange {
  min: number;
  max: number;
}

export interface RarityTier {
  dropWeight: number;
  affixCount: {
    prefix: AffixRange;
    suffix: AffixRange;
  };
}

export interface RarityRules {
  id: string;
  tiers: {
    normal: RarityTier;
    magic: RarityTier;
    rare: RarityTier;
    set: RarityTier;
    unique: RarityTier;
  };
}

import rarityRulesData from '../items/rarity-rules.json';

/**
 * Load rarity rules configuration
 */
export function loadRarityRules(): Readonly<RarityRules> {
  return Object.freeze(rarityRulesData as unknown as RarityRules);
}
