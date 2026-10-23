import { subAreas } from '@/data/index';
import { validateQuestServiceLedger } from '../services/quest-services';
import { EVE_QUEST, PRISON_QUEST } from '../map/act5-admission';
import type { CampaignMapSaveData, QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
import { hasAct5Completion, validateAct5QuestGraph } from './act5-state';
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
/** Claimed Eve plus actual full source graph is the shared entitlement authority. */
export function hasAct5CampaignReward(progress: Readonly<Record<string, QuestProgressData>>,
  receipts: QuestActionReceipts, items: QuestItemLedger): boolean {
  try { validateAct5QuestGraph(items, progress, receipts); } catch { return false; }
  return progress[EVE_QUEST]?.rewardClaimed === true && hasAct5Completion(EVE_QUEST, progress, receipts, items);
}
/** Validate the full finite source-backed title/profile graph before any save or selection. */
export function validateAct5CampaignRewards(map: CampaignMapSaveData, items: QuestItemLedger, services: unknown): void {
  const ledger = validateQuestServiceLedger(services, map.questProgress);
  for (const source of Object.keys(ledger)) {
    const questId = source.slice(0, source.indexOf('#'));
    if (questId === PRISON_QUEST || questId === 'quests/act5-siege-on-harrogath') {
      if (!hasAct5Completion(questId, map.questProgress, map.questReceipts, items)) throw new Error('Invalid save: service lacks actual main source graph');
    }
  }
  finiteMap(map.questTitles, BAAL_TITLE); finiteMap(map.questDifficulties, NIGHTMARE_UNLOCK);
  const ownedTitle = Object.hasOwn(map.questTitles, BAAL_TITLE), unlocked = Object.hasOwn(map.questDifficulties, NIGHTMARE_UNLOCK);
  if ((ownedTitle || unlocked) && !hasAct5CampaignReward(map.questProgress, map.questReceipts, items)) throw new Error('Invalid save: unearned campaign reward');
  const selectedTitle: unknown = map.selectedTitle, selectedDifficulty: unknown = map.selectedDifficulty;
  if (selectedTitle !== null && (selectedTitle !== BAAL_TITLE || !ownedTitle)) throw new Error('Invalid save: selected title is not owned');
  if (selectedDifficulty !== 'normal' && (selectedDifficulty !== 'nightmare' || !unlocked)) throw new Error('Invalid save: selected difficulty is not unlocked');
  if (!Array.isArray(map.nightmareClearedSubAreas) || new Set(map.nightmareClearedSubAreas).size !== map.nightmareClearedSubAreas.length ||
    map.nightmareClearedSubAreas.some(id => !subAreas.some(area => area.id === id)) ||
    (!unlocked && map.nightmareClearedSubAreas.length > 0)) throw new Error('Invalid save: Nightmare clear namespace');
  if (!record(map.challengeOrdinals) || Reflect.ownKeys(map.challengeOrdinals).length !== 2 ||
    !['normal', 'nightmare'].every(profile => Object.hasOwn(map.challengeOrdinals, profile) &&
      Number.isSafeInteger(map.challengeOrdinals[profile as 'normal' | 'nightmare']) &&
      map.challengeOrdinals[profile as 'normal' | 'nightmare'] >= 0 && map.challengeOrdinals[profile as 'normal' | 'nightmare'] < 360360)) {
    throw new Error('Invalid save: challenge ordinal namespaces');
  }
  if (!unlocked && map.challengeOrdinals.nightmare !== 0) throw new Error('Invalid save: unearned Nightmare history');
}
