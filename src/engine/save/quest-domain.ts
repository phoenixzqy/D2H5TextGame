import type { QuestItemActionDef } from '../../data/loaders/quest-actions';
import type { QuestItemDef } from '../../data/loaders/quest-items';
import type { QuestDef } from '../../data/loaders/quests';
import type { QuestServiceId } from '../services/quest-services';

/** Persisted victory authority needs identities, never combat-generation data. */
export interface QuestVictorySource {
  readonly questId: string;
  readonly objectiveId: string;
  readonly proof: string;
}

/** All catalog-dependent identities used by the reciprocal Act V validator. */
export interface Act5QuestDomain {
  readonly actions: readonly { readonly id: string; readonly kind: string;
    readonly questId: string; readonly receiptSource: string }[];
  readonly encounters: readonly QuestVictorySource[];
  readonly objectiveIds: Readonly<Record<string, readonly string[]>>;
  readonly receipts: readonly string[];
  readonly cageProofs: readonly string[];
  readonly prisonQuest: string;
  readonly rescueQuest: string;
  readonly eveQuest: string;
  readonly potionSource: string;
  readonly scrollSource: string;
  readonly inspectProof: string;
  readonly thawProof: string;
  readonly readProof: string;
  readonly throneProof: string;
  readonly potionItemId: string;
  readonly scrollItemId: string;
  readonly inspectObjective: string;
  readonly thawObjective: string;
  readonly rescueObjective: string;
  readonly throneObjective: string;
}

/** One domain follows a save through every nested authority check. */
export interface QuestStateDomain {
  readonly actions: readonly QuestItemActionDef[];
  readonly items: readonly QuestItemDef[];
  readonly quests: readonly QuestDef[];
  readonly victories?: readonly QuestVictorySource[];
  readonly act5?: Act5QuestDomain;
}

/** Claimed rows and their exact source-to-service mapping form one contract. */
export interface QuestServiceValidationDomain {
  readonly quests: readonly QuestDef[];
  readonly serviceSources: Readonly<Record<string, QuestServiceId>>;
}

/** Campaign and nested endgame checks must share the same historical authority. */
export interface CampaignValidationDomain extends QuestServiceValidationDomain {
  readonly actions: readonly QuestItemActionDef[];
  readonly act5: Act5QuestDomain;
  readonly nightmareAreaIds: readonly string[];
  readonly achievementTitleId: string;
  readonly servicePrerequisites: Readonly<Record<string, string>>;
  readonly hellforgeQuestId: string;
  readonly hephastoProof: string;
}

export interface NativeQuestDomain extends CampaignValidationDomain {
  readonly items: readonly QuestItemDef[];
  readonly victories: readonly QuestVictorySource[];
}
