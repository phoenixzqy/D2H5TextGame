/**
 * Elite spawn configuration types.
 * @module engine/types/elite
 */

import type { Resistances } from './attributes';
import type { MonsterDef } from './monsters';

/** Skill-bearing elite affix selected at wave-build time. */
export interface EliteAffixDef {
  readonly id: string;
  readonly nameKey: string;
  readonly skillId: string;
  /** Multiplies the archetype attack speed once; absent preserves base speed. */
  readonly attackSpeedMultiplier?: number;
  /** Added to base and tier resistance before clamping; omitted types add zero. */
  readonly resistanceBonuses?: Partial<Resistances>;
  /** Receiving-hit lightning bolt tuning; absent disables the reaction. */
  readonly lightningRetaliation?: import('../combat/lightning-retaliation').LightningRetaliation;
  /** Passive cold pulses for the carrier; absent preserves its archetype aura. */
  readonly frostAura?: MonsterDef['frostAura'];
}

/** Multipliers applied to level-scaled monster stats. */
export interface EliteStatMultipliers {
  readonly life: number;
  readonly attack: number;
  readonly defense: number;
}

/** Online-idle elite spawn and pity configuration. */
export interface IdleEliteConfig {
  readonly enabled: boolean;
  readonly baseEliteChance: number;
  readonly championShareOfEliteRoll: number;
  readonly rareShareOfEliteRoll: number;
  readonly pityStartMisses: number;
  readonly pityStep: number;
  readonly pityChanceCap: number;
  readonly hardPityMisses: number;
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
  readonly idle: IdleEliteConfig;
  readonly affixes: readonly EliteAffixDef[];
}
