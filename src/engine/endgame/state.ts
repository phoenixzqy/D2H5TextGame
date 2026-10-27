import { endgameDefinition } from '../../data/loaders/endgame';
import { hasAct5CampaignReward } from '../save/act5-campaign';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
import type { EndgameState } from './types';
import type { Act5QuestDomain } from '../save/quest-domain';

export interface EndgameCampaignEvidence {
  readonly questProgress: Readonly<Record<string, QuestProgressData>>;
  readonly questReceipts: QuestActionReceipts;
  readonly questItems: QuestItemLedger;
}

/** Use the actual campaign source graph; loose flags never unlock endgame. */
export function hasEndgameAccess(campaign: EndgameCampaignEvidence, domain?: Act5QuestDomain): boolean {
  return hasAct5CampaignReward(campaign.questProgress, campaign.questReceipts, campaign.questItems, domain);
}

/** New ownership is empty, independent of any legacy completion or currency. */
export function emptyEndgameState(): EndgameState {
  return Object.freeze({ attemptOrdinal: 0, clearCounts: Object.freeze({ ashen: 0, glacial: 0 }),
    achievementRewardClaimed: false });
}

function fields(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== 'object' ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) ||
    Reflect.ownKeys(value).length !== keys.length || !keys.every(key => {
      const field = Object.getOwnPropertyDescriptor(value, key);
      return field?.enumerable === true && Object.hasOwn(field, 'value');
    })) throw new Error('Invalid endgame state fields');
  return value as Record<string, unknown>;
}

function counter(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid endgame counter');
  return value;
}

/** Read strict own closed durable state before normalization; return a private immutable copy. */
export function readEndgameState(value: unknown, campaign: EndgameCampaignEvidence, domain?: Act5QuestDomain): EndgameState {
  const row = fields(value, ['attemptOrdinal', 'clearCounts', 'achievementRewardClaimed']);
  const counts = fields(row.clearCounts, ['ashen', 'glacial']);
  const attemptOrdinal = counter(row.attemptOrdinal), ashen = counter(counts.ashen), glacial = counter(counts.glacial);
  const total = ashen + glacial, claimed = row.achievementRewardClaimed;
  if (!Number.isSafeInteger(total) || total > attemptOrdinal || typeof claimed !== 'boolean' ||
    (claimed && (ashen === 0 || glacial === 0)) ||
    (!hasEndgameAccess(campaign, domain) && (attemptOrdinal !== 0 || total !== 0 || claimed))) {
    throw new Error('Invalid endgame progression or campaign authority');
  }
  return Object.freeze({ attemptOrdinal, clearCounts: Object.freeze({ ashen, glacial }), achievementRewardClaimed: claimed });
}

/** Eligibility is derived; only explicit successful Claim can own the achievement title. */
export function projectEndgameAchievement(value: unknown, campaign: EndgameCampaignEvidence): {
  readonly available: boolean; readonly claimed: boolean; readonly titleId: string | null;
} {
  const state = readEndgameState(value, campaign), claimed = state.achievementRewardClaimed;
  return Object.freeze({ available: !claimed && endgameDefinition.achievement.requiredModifiers.every(id => state.clearCounts[id] > 0),
    claimed, titleId: claimed ? endgameDefinition.achievement.reward.titleId : null });
}
