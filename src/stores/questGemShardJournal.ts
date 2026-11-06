/** Existing finite +1 gem contract over the shared currency participant. */
import {
  beginQuestCurrencyPublication, prepareQuestCurrencyGrant, prepareQuestCurrencyRestoration,
  questCurrencyKey, type QuestCurrencyPublication
} from './questCurrencyJournal';
export {
  assertQuestCurrencyDebitAllowed as assertQuestGemShardDebitAllowed,
  prepareIndependentQuestCurrencyAddition as prepareIndependentQuestGemShardAddition,
  verifyQuestCurrencyPublication as verifyQuestGemShardPublication,
  endQuestCurrencyPublication as endQuestGemShardPublication
} from './questCurrencyJournal';
export type QuestGemShardPublication = QuestCurrencyPublication;

/** Retain the original allowlisted source and exact +1 contract. */
export function beginQuestGemShardPublication(source: string, wallet: Readonly<Record<string, number>>): QuestGemShardPublication {
  return beginQuestCurrencyPublication(source, 'gem-shard', 1, wallet);
}
/** Inventory-only compatibility hook for the original gem ingress. */
export function prepareQuestGemShardGrant(owner: QuestGemShardPublication, wallet: Readonly<Record<string, number>>): number {
  if (questCurrencyKey(owner) !== 'gem-shard') throw new Error('Invalid gem-shard owner');
  return prepareQuestCurrencyGrant(owner, wallet);
}
/** Inventory-only compatibility hook for the original gem restoration. */
export function prepareQuestGemShardRestoration(owner: QuestGemShardPublication, wallet: Readonly<Record<string, number>>) {
  if (questCurrencyKey(owner) !== 'gem-shard') throw new Error('Invalid gem-shard owner');
  return prepareQuestCurrencyRestoration(owner, wallet);
}
