import type { CainQuestDomain } from '../save/quest-domain';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '@/engine/types/save';
import { ACT1_QUEST_RECEIPTS } from '@/engine/map/act1-quest-sources';

export const CAIN_QUEST = 'quests/act1-search-for-cain';
export const CAIN_SIDE_QUEST = 'quests/side-act1-cains-favor';
export const CAIN_SCROLL_SOURCE = `${CAIN_QUEST}#objective:obj-inifuss-tree`;
export const CAIN_SCROLL_ITEM = 'quest/scroll_of_inifuss';
export const CAIN_AREA = 'areas/act1-dark-wood';
export const CAIN_CAGE = 'objects/cain_cage';
export const CAIN_RECEIPTS: readonly string[] = Object.freeze([
  ACT1_QUEST_RECEIPTS.rescueCain, ACT1_QUEST_RECEIPTS.cainTalk
]);
export const LIVE_CAIN_DOMAIN: CainQuestDomain = Object.freeze({
  quest: CAIN_QUEST, sideQuest: CAIN_SIDE_QUEST, source: CAIN_SCROLL_SOURCE, itemId: CAIN_SCROLL_ITEM,
  treeObjective: 'obj-inifuss-tree', decodeObjective: 'obj-decode', rescueObjective: 'obj-rescue-cain',
  talkObjective: 'obj-talk', rescueReceipt: ACT1_QUEST_RECEIPTS.rescueCain, talkReceipt: ACT1_QUEST_RECEIPTS.cainTalk
});
type Progress = Readonly<Record<string, QuestProgressData>>;

// This boundary also receives untrusted save input before normalization.
function isScrollState(value: unknown): value is 'owned' | 'consumed' {
  return value === 'owned' || value === 'consumed';
}

/** Only canonical tracked Cain rows can earn new physical/action proof. */
export function isCainProgress(progress: Progress, questId: string, domain: CainQuestDomain = LIVE_CAIN_DOMAIN): boolean {
  const row = Object.hasOwn(progress, questId) ? progress[questId] : undefined;
  return (questId === domain.quest || questId === domain.sideQuest) && row?.id === questId &&
    (row.status === 'inProgress' || row.status === 'completed') &&
    (row.rewardClaimed !== true || row.status === 'completed');
}
function flag(progress: Progress, questId: string, objectiveId: string, domain: CainQuestDomain): boolean {
  const row = progress[questId];
  return isCainProgress(progress, questId, domain) && row !== undefined &&
    Object.hasOwn(row.objectives, objectiveId) && row.objectives[objectiveId] === true;
}
/** Finite partial legacy repair: require only real predecessors of the selected source. */
export function canEarnCainObjective(progress: Progress, questId: string, objectiveId: string,
  items: QuestItemLedger, receipts: QuestActionReceipts, domain: CainQuestDomain = LIVE_CAIN_DOMAIN): boolean {
  if (!isCainProgress(progress, questId, domain)) return false;
  if (questId === domain.sideQuest) return objectiveId === domain.talkObjective && hasCainRescue(progress, items, receipts, domain);
  if (objectiveId === domain.treeObjective) return true;
  const scroll = Object.hasOwn(items, domain.source) ? items[domain.source] : undefined;
  if (scroll?.itemId !== domain.itemId || !flag(progress, domain.quest, domain.treeObjective, domain)) return false;
  if (objectiveId === domain.decodeObjective) return isScrollState(scroll.state);
  return objectiveId === domain.rescueObjective && scroll.state === 'consumed' && flag(progress, domain.quest, domain.decodeObjective, domain);
}
/** Durable rescue authority is the consumed physical source plus the exact real action. */
export function hasCainRescue(progress: Progress, items: QuestItemLedger, receipts: QuestActionReceipts, domain: CainQuestDomain = LIVE_CAIN_DOMAIN): boolean {
  return canEarnCainObjective(progress, domain.quest, domain.rescueObjective, items, receipts, domain) &&
    flag(progress, domain.quest, domain.rescueObjective, domain) &&
    progress[domain.quest]?.status === 'completed' &&
    Object.hasOwn(receipts, domain.rescueReceipt) && receipts[domain.rescueReceipt] === true;
}
/** First Claims need actual graphs; preserved legacy Claim flags never create proof. */
export function hasCainCompletion(questId: string, progress: Progress, items: QuestItemLedger,
  receipts: QuestActionReceipts, domain: CainQuestDomain = LIVE_CAIN_DOMAIN): boolean {
  if (questId !== domain.quest && questId !== domain.sideQuest) return true;
  if (!hasCainRescue(progress, items, receipts, domain) || progress[questId]?.status !== 'completed') return false;
  return questId === domain.quest || flag(progress, domain.sideQuest, domain.talkObjective, domain) &&
    Object.hasOwn(receipts, domain.talkReceipt) && receipts[domain.talkReceipt] === true;
}
/** Validate current finite sources without changing sparse completed/claimed legacy history. */
export function validateCainQuestGraph(items: QuestItemLedger, progress: Progress, receipts: QuestActionReceipts, domain: CainQuestDomain = LIVE_CAIN_DOMAIN): void {
  const fail = () => { throw new Error('Invalid save: contradictory Cain source graph'); };
  if (Object.hasOwn(items, domain.source)) {
    const scroll = items[domain.source];
    if (scroll?.itemId !== domain.itemId || !flag(progress, domain.quest, domain.treeObjective, domain) ||
      !isScrollState(scroll.state) ||
      (scroll.state === 'consumed' && !flag(progress, domain.quest, domain.decodeObjective, domain))) fail();
  }
  if (Object.hasOwn(receipts, domain.rescueReceipt) && !hasCainRescue(progress, items, receipts, domain)) fail();
  if (Object.hasOwn(receipts, domain.talkReceipt) &&
    !hasCainCompletion(domain.sideQuest, progress, items, receipts, domain)) fail();
}
