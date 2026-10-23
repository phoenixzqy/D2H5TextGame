import type { MaterialLedger } from '../loot/materials';

export type EndgameModifierId = 'ashen' | 'glacial';
export interface EndgameDefinition {
  readonly version: 1;
  readonly id: 'endgame/worldstone-remnant';
  readonly nameKey: string;
  readonly monsterLevel: number;
  readonly mode: 'manual';
  readonly entryCost: Readonly<Record<string, never>>;
  readonly lootProfile: { readonly act: 5; readonly difficulty: 'normal' };
  readonly defaultLootTable: string;
  readonly waves: readonly {
    readonly id: string;
    readonly spawns: readonly (
      | { readonly kind: 'monster'; readonly archetypeId: string; readonly count: number; readonly tier: 'trash' | 'boss' }
      | { readonly kind: 'modifier'; readonly count: number; readonly tier: 'trash' }
    )[];
  }[];
  readonly modifiers: readonly {
    readonly id: EndgameModifierId;
    readonly nameKey: string;
    readonly descriptionKey: string;
    readonly archetypeId: string;
    readonly completionMaterials: MaterialLedger;
  }[];
  readonly achievement: {
    readonly id: 'achievements/worldstone-adapt';
    readonly requiredModifiers: readonly EndgameModifierId[];
    readonly reward: { readonly titleId: 'titles/worldstone-adapt'; readonly materials: MaterialLedger };
  };
}

/** Durable proposal only; native persistence is introduced by the dedicated successor migration. */
export interface EndgameState {
  readonly attemptOrdinal: number;
  readonly clearCounts: Readonly<Record<EndgameModifierId, number>>;
  readonly achievementRewardClaimed: boolean;
}
