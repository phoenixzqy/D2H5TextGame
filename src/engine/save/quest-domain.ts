import type { AnyaQuestDomain } from '../map/anya-quest';
import type { Act2CacheDomain } from '../map/act2-cache-quests';
import type { FaraQuestDomain } from '../map/fara-quest';
import type { CowQuestDomain } from '../map/cow-quest';
import type { QuestItemActionDef } from '../../data/loaders/quest-actions';
import type { QuestItemDef } from '../../data/loaders/quest-items';
import type { QuestDef } from '../../data/loaders/quests';
import type { QuestServiceId } from '../services/quest-services';
import type { OrmusQuestDomain } from '../map/ormus-quest';
import type { LarzukQuestDomain } from '../map/larzuk-quest';
import type { WarbandQuestDomain } from '../map/warband-quest';
import type { DrognanQuestDomain } from '../map/drognan-quest';
import type { NihlathakQuestDomain } from '../map/nihlathak-quest';
import type { TownEnlistmentQuestDomain } from '../map/town-enlistment-quest';
import type { CountedQuestDomain } from '../map/counted-quest';

/** Persisted victory authority needs identities, never combat-generation data. */
export interface QuestVictorySource {
  readonly questId: string;
  readonly objectiveId: string;
  readonly proof: string;
}

/** Save authority only: runtime encounter and presentation data stay live. */
export interface CainQuestDomain {
  readonly quest: string; readonly sideQuest: string; readonly source: string; readonly itemId: string;
  readonly treeObjective: string; readonly decodeObjective: string; readonly rescueObjective: string;
  readonly talkObjective: string; readonly rescueReceipt: string; readonly talkReceipt: string;
}
export interface MalusQuestDomain {
  readonly quest: string; readonly sideQuest: string; readonly source: string; readonly itemId: string;
  readonly recoverObjective: string; readonly handInObjective: string; readonly presentObjective: string;
  readonly presentReceipt: string;
}
export interface CountessQuestDomain {
  readonly quest: string; readonly objective: string; readonly receipt: string;
}
export interface CouncilQuestDomain {
  readonly quest: string; readonly receipt: string; readonly objectiveIds: readonly string[];
  readonly transmuteObjective: string;
}
export interface Act1QuestDomain {
  readonly cain: CainQuestDomain; readonly malus: MalusQuestDomain; readonly countess: CountessQuestDomain;
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
  readonly anya?: AnyaQuestDomain;
  readonly cow?: CowQuestDomain;
  readonly fara?: FaraQuestDomain;
  readonly act2Caches?: readonly Act2CacheDomain[];
  readonly countedSources?: readonly CountedQuestDomain[];
  readonly townEnlistments?: readonly TownEnlistmentQuestDomain[];
  readonly nihlathak?: NihlathakQuestDomain;
  readonly drognan?: DrognanQuestDomain;
  readonly warband?: WarbandQuestDomain;
  readonly larzuk?: LarzukQuestDomain;
  readonly ormus?: OrmusQuestDomain;
  readonly actions: readonly QuestItemActionDef[];
  readonly items: readonly QuestItemDef[];
  readonly quests: readonly QuestDef[];
  readonly victories?: readonly QuestVictorySource[];
  readonly act5?: Act5QuestDomain;
  readonly act1?: Act1QuestDomain;
  readonly council?: CouncilQuestDomain;
}

/** Claimed rows and their exact source-to-service mapping form one contract. */
export interface QuestServiceValidationDomain {
  readonly anya?: AnyaQuestDomain;
  readonly quests: readonly QuestDef[];
  readonly serviceSources: Readonly<Record<string, QuestServiceId>>;
}

/** Campaign and nested endgame checks must share the same historical authority. */
export interface CampaignValidationDomain extends QuestServiceValidationDomain {
  readonly selectedDifficulties?: readonly string[];
  readonly actions: readonly QuestItemActionDef[];
  readonly act5: Act5QuestDomain;
  readonly nightmareAreaIds: readonly string[];
  readonly achievementTitleId: string;
  readonly servicePrerequisites: Readonly<Record<string, string>>;
  readonly hellforgeQuestId: string;
  readonly hephastoProof: string;
  readonly act1?: Act1QuestDomain;
  readonly campaignTitleId?: string;
  readonly nightmareUnlockId?: string;
  readonly challengeOrdinalLimit?: number;
}

export interface NativeQuestDomain extends CampaignValidationDomain {
  readonly cow?: CowQuestDomain;
  readonly fara?: FaraQuestDomain;
  readonly act2Caches?: readonly Act2CacheDomain[];
  readonly countedSources?: readonly CountedQuestDomain[];
  readonly townEnlistments?: readonly TownEnlistmentQuestDomain[];
  readonly nihlathak?: NihlathakQuestDomain;
  readonly drognan?: DrognanQuestDomain;
  readonly warband?: WarbandQuestDomain;
  readonly larzuk?: LarzukQuestDomain;
  readonly ormus?: OrmusQuestDomain;
  readonly items: readonly QuestItemDef[];
  readonly victories: readonly QuestVictorySource[];
  readonly council?: CouncilQuestDomain;
}

export interface FrozenNativeQuestDomain extends NativeQuestDomain {
  readonly act1: Act1QuestDomain;
  readonly council: CouncilQuestDomain;
  readonly auraIds: readonly string[];
  readonly selectedDifficulties: readonly string[];
}
export type FrozenV23Domain = FrozenNativeQuestDomain;
