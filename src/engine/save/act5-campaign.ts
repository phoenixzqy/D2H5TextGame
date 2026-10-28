import { subAreas } from '@/data/index';
import { loadQuestActions, questActionInputs } from '@/data/loaders/quest-actions';
import { loadQuests } from '@/data/loaders/quests';
import { validateQuestServiceLedger } from '../services/quest-services';
import { EVE_QUEST, PRISON_QUEST } from '../map/act5-admission';
import { HEPHASTO_PROOF } from '../map/act4-admission';
import { MALUS_QUEST, MALUS_SIDE_QUEST, hasMalusCompletion } from '../map/malus-quest';
import type { CampaignMapSaveData, Native24MapSaveData, QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
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
  const malus = domain?.act1?.malus;
  if ((domain === undefined || malus !== undefined) &&
    (questId === (malus?.quest ?? MALUS_QUEST) || questId === (malus?.sideQuest ?? MALUS_SIDE_QUEST))) {
    return hasMalusCompletion(questId, progress, items, receipts, malus);
  }
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
type CampaignRewardMap = Omit<CampaignMapSaveData, 'selectedTitle' | 'selectedDifficulty' | 'challengeOrdinals'> & {
  readonly selectedTitle: string | null
};

/** Shared source/title authority; profile contracts remain version-specific. */
function validateCampaignSourceRewards(map: CampaignRewardMap, items: QuestItemLedger,
  services: unknown, domain?: CampaignValidationDomain): boolean {
  const ledger = validateQuestServiceLedger(services, map.questProgress, domain);
  for (const source of Object.keys(ledger)) {
    const questId = source.slice(0, source.indexOf('#'));
    if (!hasQuestServiceSourceGraph(questId, map.questProgress, map.questReceipts, items, domain)) {
      throw new Error('Invalid save: service lacks actual prerequisite source graph');
    }
  }
  const title = domain?.campaignTitleId ?? BAAL_TITLE, unlock = domain?.nightmareUnlockId ?? NIGHTMARE_UNLOCK;
  finiteMap(map.questTitles, title); finiteMap(map.questDifficulties, unlock);
  const ownedTitle = Object.hasOwn(map.questTitles, title), unlocked = Object.hasOwn(map.questDifficulties, unlock);
  if ((ownedTitle || unlocked) && !hasAct5CampaignReward(map.questProgress, map.questReceipts, items, domain?.act5)) throw new Error('Invalid save: unearned campaign reward');
  const selectedTitle: unknown = map.selectedTitle;
  if (selectedTitle !== null && (selectedTitle !== title || !ownedTitle)) throw new Error('Invalid save: selected title is not owned');
  return unlocked;
}

function validateNightmareClears(map: CampaignRewardMap, unlocked: boolean, domain?: CampaignValidationDomain): void {
  if (!Array.isArray(map.nightmareClearedSubAreas) || new Set(map.nightmareClearedSubAreas).size !== map.nightmareClearedSubAreas.length ||
    map.nightmareClearedSubAreas.some((id: unknown) => typeof id !== 'string' ||
      (domain ? !domain.nightmareAreaIds.includes(id) : !subAreas.some(area => area.id === id))) ||
    (!unlocked && map.nightmareClearedSubAreas.length > 0)) throw new Error('Invalid save: Nightmare clear namespace');
}

/** Validate the frozen two-profile campaign contract; no native24 projection. */
export function validateAct5CampaignRewards(map: Omit<CampaignMapSaveData, 'selectedTitle'> & {
  readonly selectedTitle: string | null
}, items: QuestItemLedger, services: unknown,
  domain?: CampaignValidationDomain): void {
  const unlocked = validateCampaignSourceRewards(map, items, services, domain);
  const selectedDifficulty: unknown = map.selectedDifficulty;
  if (selectedDifficulty !== 'normal' && (selectedDifficulty !== 'nightmare' || !unlocked)) throw new Error('Invalid save: selected difficulty is not unlocked');
  validateNightmareClears(map, unlocked, domain);
  if (!record(map.challengeOrdinals) || Reflect.ownKeys(map.challengeOrdinals).length !== 2 ||
    !['normal', 'nightmare'].every(profile => Object.hasOwn(map.challengeOrdinals, profile) &&
      Number.isSafeInteger(map.challengeOrdinals[profile as 'normal' | 'nightmare']) &&
      map.challengeOrdinals[profile as 'normal' | 'nightmare'] >= 0 && map.challengeOrdinals[profile as 'normal' | 'nightmare'] < (domain?.challengeOrdinalLimit ?? 360360))) {
    throw new Error('Invalid save: challenge ordinal namespaces');
  }
  if (!unlocked && map.challengeOrdinals.nightmare !== 0) throw new Error('Invalid save: unearned Nightmare history');
}

/** Read only own enumerable data; never evaluate a profile/ordinal getter. */
function ownReplayData(value: Record<string, unknown>, key: string, allowMissing: boolean): unknown {
  const field = Object.getOwnPropertyDescriptor(value, key);
  if (!field && !(key in value) && allowMissing) return undefined;
  if (!field || field.enumerable !== true || !Object.hasOwn(field, 'value')) {
    throw new Error(`Invalid save: ${key} must be an own enumerable data field`);
  }
  return field.value;
}

/** Raw native24 profile fields must survive normalization exactly as supplied. */
export function validateNative24ReplayFields(value: unknown, allowMissing = false): void {
  if (!record(value)) throw new Error('Invalid save: replay map structure');
  const selected = ownReplayData(value, 'selectedDifficulty', allowMissing);
  if (!(allowMissing && !Object.hasOwn(value, 'selectedDifficulty')) &&
    selected !== 'normal' && selected !== 'nightmare' && selected !== 'hell') {
    throw new Error('Invalid save: selected replay profile');
  }
  const clears = ownReplayData(value, 'hellClearedSubAreas', allowMissing);
  if (!(allowMissing && !Object.hasOwn(value, 'hellClearedSubAreas'))) {
    if (!Array.isArray(clears) || Reflect.ownKeys(clears).length !== clears.length + 1) {
      throw new Error('Invalid save: Hell clear namespace');
    }
    const seen = new Set<string>();
    for (let index = 0; index < clears.length; index++) {
      const field = Object.getOwnPropertyDescriptor(clears, String(index));
      if (!field || field.enumerable !== true || !Object.hasOwn(field, 'value') ||
        typeof field.value !== 'string' || seen.has(field.value) || !subAreas.some(area => area.id === field.value)) {
        throw new Error('Invalid save: Hell clear namespace');
      }
      seen.add(field.value);
    }
  }
  const ordinals = ownReplayData(value, 'challengeOrdinals', allowMissing);
  if (!(allowMissing && !Object.hasOwn(value, 'challengeOrdinals'))) {
    if (!record(ordinals) || Reflect.ownKeys(ordinals).length !== 3) throw new Error('Invalid save: challenge ordinal namespaces');
    for (const profile of ['normal', 'nightmare', 'hell']) {
      const ordinal = ownReplayData(ordinals, profile, false);
      if (typeof ordinal !== 'number' || !Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= 360360) {
        throw new Error('Invalid save: challenge ordinal namespaces');
      }
    }
  }
}

/** Native24 owns its three-profile contract and source-backed Hell history. */
export function validateNative24CampaignRewards(map: Omit<Native24MapSaveData, 'selectedTitle'> & {
  readonly selectedTitle: string | null
}, items: QuestItemLedger, services: unknown): void {
  validateNative24ReplayFields(map);
  const unlocked = validateCampaignSourceRewards(map, items, services);
  if (map.selectedDifficulty === 'nightmare' && !unlocked) throw new Error('Invalid save: selected difficulty is not unlocked');
  validateNightmareClears(map, unlocked);
  if (!unlocked && map.challengeOrdinals.nightmare !== 0) throw new Error('Invalid save: unearned Nightmare history');
  if ((map.selectedDifficulty === 'hell' || map.hellClearedSubAreas.length > 0 || map.challengeOrdinals.hell !== 0) &&
    !hasAct5CampaignReward(map.questProgress, map.questReceipts, items)) {
    throw new Error('Invalid save: unearned Hell selection or history');
  }
}
