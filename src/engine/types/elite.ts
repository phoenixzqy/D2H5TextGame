/**
 * Elite spawn configuration types.
 * @module engine/types/elite
 */

/** Skill-bearing elite affix selected at wave-build time. */
export interface EliteAffixDef {
  readonly id: string;
  readonly nameKey: string;
  readonly skillId: string;
}

/** Multipliers applied to level-scaled monster stats. */
export interface EliteStatMultipliers {
  readonly life: number;
  readonly attack: number;
  readonly defense: number;
}

/** Data-driven elite spawn and affix configuration. */
export interface EliteConfigDef {
  readonly id: 'elite/default';
  readonly normalChampionChance: number;
  readonly normalRareEliteChance: number;
  readonly rareEliteMagicFindBonus: number;
  readonly rareEliteResistanceBonus: number;
  readonly chapterBossHpMultiplier: number;
  readonly multipliers: {
    readonly champion: EliteStatMultipliers;
    readonly rareElite: EliteStatMultipliers;
    readonly rareMinion: EliteStatMultipliers;
  };
  readonly affixes: readonly EliteAffixDef[];
}
