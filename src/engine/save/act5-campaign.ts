import { subAreas } from '@/data/index';
import { loadQuestActions, questActionInputs } from '@/data/loaders/quest-actions';
import { loadQuests } from '@/data/loaders/quests';
import { validateQuestServiceLedger } from '../services/quest-services';
import { EVE_QUEST, PRISON_QUEST } from '../map/act5-admission';
import { HEPHASTO_PROOF } from '../map/act4-admission';
import type { CampaignMapSaveData, QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
import { hasAct5Completion, validateAct5QuestGraph } from './act5-state';
import type { Act5QuestDomain, CampaignValidationDomain } from './quest-domain';
export const BAAL_TITLE = 'titles/slayer_of_baal';
export const NIGHTMARE_UNLOCK = 'difficulty/nightmare';
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
/** Own exact finite entitlement map; inherited keys and undefined are invalid. */
function finiteMap(value: unknown, key: string): void {
  if (!record(value) || Reflect.ownKeys(value).some(name => name !== key || value[name] !== true)) {
    throw new Error('Invalid save: unknown campaign entitlement');
  }
}
/**
 * Actual completion authority for main service sources and their side prerequisites.
 * Callers first validate the reciprocal item/action graph; historical flags alone
 * never supply a victory, a physical input, or an action receipt.
 */
export function hasQuestServiceSourceGraph(questId: string, progress: Readonly<Record<string, QuestProgressData>>,
  receipts: QuestActionReceipts, items: QuestItemLedger, domain?: CampaignValidationDomain): boolean {
  const sourceQuest = domain ? (Object.hasOwn(domain.servicePrerequisites, questId)
    ? domain.servicePrerequisites[questId] ?? questId : questId) : questId === 'quests/side-act5-larzuks-sockets' ? 'quests/act5-siege-on-harrogath'
    : questId === 'quests/side-act5-anyas-gift' ? PRISON_QUEST
      : questId === 'quests/side-act4-halbus-soul' ? 'quests/act4-hellforge' : questId;
  if (sourceQuest !== (domain?.hellforgeQuestId ?? 'quests/act4-hellforge')) {
    return hasAct5Completion(sourceQuest, progress, receipts, items, domain?.act5);
  }
  const quest = (domain?.quests ?? loadQuests()).find(row => row.id === sourceQuest);
  const action = (domain?.actions ?? loadQuestActions()).find(row => row.questId === sourceQuest);
  const row = Object.hasOwn(progress, sourceQuest) ? progress[sourceQuest] : undefined;
  const has = (source: string) => Object.hasOwn(receipts, source) && receipts[source] === true;
  return quest !== undefined && action !== undefined && record(row) && Object.hasOwn(row, 'id') && row.id === sourceQuest &&
    Object.hasOwn(row, 'status') && row.status === 'completed' && Object.hasOwn(row, 'objectives') && record(row.objectives) &&
    Object.keys(row.objectives).length === quest.objectives.length && quest.objectives.every(objective =>
      Object.hasOwn(row.objectives, objective.id) && row.objectives[objective.id] === true) &&
    has(domain?.hephastoProof ?? HEPHASTO_PROOF) && has(action.receiptSource) && questActionInputs(action).every(input =>
      Object.hasOwn(items, input.inputSource) && items[input.inputSource]?.itemId === input.itemId &&
      items[input.inputSource]?.state === 'consumed');
}
/** Claimed Eve plus actual full source graph is the shared entitlement authority. */
export function hasAct5CampaignReward(progress: Readonly<Record<string, QuestProgressData>>,
  receipts: QuestActionReceipts, items: QuestItemLedger, domain?: Act5QuestDomain): boolean {
  try { validateAct5QuestGraph(items, progress, receipts, domain); } catch { return false; }
  const eveQuest = domain?.eveQuest ?? EVE_QUEST;
  return progress[eveQuest]?.rewardClaimed === true && hasAct5Completion(eveQuest, progress, receipts, items, domain);
}
/** Validate the full finite source-backed title/profile graph before any save or selection. */
export function validateAct5CampaignRewards(map: CampaignMapSaveData, items: QuestItemLedger, services: unknown,
  domain?: CampaignValidationDomain): void {
  const ledger = validateQuestServiceLedger(services, map.questProgress, domain);
  for (const source of Object.keys(ledger)) {
    const questId = source.slice(0, source.indexOf('#'));
    if (!hasQuestServiceSourceGraph(questId, map.questProgress, map.questReceipts, items, domain)) {
      throw new Error('Invalid save: service lacks actual prerequisite source graph');
    }
  }
  finiteMap(map.questTitles, BAAL_TITLE); finiteMap(map.questDifficulties, NIGHTMARE_UNLOCK);
  const ownedTitle = Object.hasOwn(map.questTitles, BAAL_TITLE), unlocked = Object.hasOwn(map.questDifficulties, NIGHTMARE_UNLOCK);
  if ((ownedTitle || unlocked) && !hasAct5CampaignReward(map.questProgress, map.questReceipts, items, domain?.act5)) throw new Error('Invalid save: unearned campaign reward');
  const selectedTitle: unknown = map.selectedTitle, selectedDifficulty: unknown = map.selectedDifficulty;
  if (selectedTitle !== null && (selectedTitle !== BAAL_TITLE || !ownedTitle)) throw new Error('Invalid save: selected title is not owned');
  if (selectedDifficulty !== 'normal' && (selectedDifficulty !== 'nightmare' || !unlocked)) throw new Error('Invalid save: selected difficulty is not unlocked');
  if (!Array.isArray(map.nightmareClearedSubAreas) || new Set(map.nightmareClearedSubAreas).size !== map.nightmareClearedSubAreas.length ||
    map.nightmareClearedSubAreas.some((id: unknown) => typeof id !== 'string' ||
      (domain ? !domain.nightmareAreaIds.includes(id) : !subAreas.some(area => area.id === id))) ||
    (!unlocked && map.nightmareClearedSubAreas.length > 0)) throw new Error('Invalid save: Nightmare clear namespace');
  if (!record(map.challengeOrdinals) || Reflect.ownKeys(map.challengeOrdinals).length !== 2 ||
    !['normal', 'nightmare'].every(profile => Object.hasOwn(map.challengeOrdinals, profile) &&
      Number.isSafeInteger(map.challengeOrdinals[profile as 'normal' | 'nightmare']) &&
      map.challengeOrdinals[profile as 'normal' | 'nightmare'] >= 0 && map.challengeOrdinals[profile as 'normal' | 'nightmare'] < 360360)) {
    throw new Error('Invalid save: challenge ordinal namespaces');
  }
  if (!unlocked && map.challengeOrdinals.nightmare !== 0) throw new Error('Invalid save: unearned Nightmare history');
}
