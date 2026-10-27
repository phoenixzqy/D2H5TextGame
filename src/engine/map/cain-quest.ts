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
type Progress = Readonly<Record<string, QuestProgressData>>;

// This boundary also receives untrusted save input before normalization.
function isScrollState(value: unknown): value is 'owned' | 'consumed' {
  return value === 'owned' || value === 'consumed';
}

/** Only canonical tracked Cain rows can earn new physical/action proof. */
export function isCainProgress(progress: Progress, questId: string): boolean {
  const row = Object.hasOwn(progress, questId) ? progress[questId] : undefined;
  return (questId === CAIN_QUEST || questId === CAIN_SIDE_QUEST) && row?.id === questId &&
    (row.status === 'inProgress' || row.status === 'completed') &&
    (row.rewardClaimed !== true || row.status === 'completed');
}
function flag(progress: Progress, questId: string, objectiveId: string): boolean {
  const row = progress[questId];
  return isCainProgress(progress, questId) && row !== undefined &&
    Object.hasOwn(row.objectives, objectiveId) && row.objectives[objectiveId] === true;
}
/** Finite partial legacy repair: require only real predecessors of the selected source. */
export function canEarnCainObjective(progress: Progress, questId: string, objectiveId: string,
  items: QuestItemLedger, receipts: QuestActionReceipts): boolean {
  if (!isCainProgress(progress, questId)) return false;
  if (questId === CAIN_SIDE_QUEST) return objectiveId === 'obj-talk' && hasCainRescue(progress, items, receipts);
  if (objectiveId === 'obj-inifuss-tree') return true;
  const scroll = Object.hasOwn(items, CAIN_SCROLL_SOURCE) ? items[CAIN_SCROLL_SOURCE] : undefined;
  if (scroll?.itemId !== CAIN_SCROLL_ITEM || !flag(progress, CAIN_QUEST, 'obj-inifuss-tree')) return false;
  if (objectiveId === 'obj-decode') return isScrollState(scroll.state);
  return objectiveId === 'obj-rescue-cain' && scroll.state === 'consumed' && flag(progress, CAIN_QUEST, 'obj-decode');
}
/** Durable rescue authority is the consumed physical source plus the exact real action. */
export function hasCainRescue(progress: Progress, items: QuestItemLedger, receipts: QuestActionReceipts): boolean {
  return canEarnCainObjective(progress, CAIN_QUEST, 'obj-rescue-cain', items, receipts) &&
    flag(progress, CAIN_QUEST, 'obj-rescue-cain') &&
    progress[CAIN_QUEST]?.status === 'completed' &&
    Object.hasOwn(receipts, ACT1_QUEST_RECEIPTS.rescueCain) && receipts[ACT1_QUEST_RECEIPTS.rescueCain] === true;
}
/** First Claims need actual graphs; preserved legacy Claim flags never create proof. */
export function hasCainCompletion(questId: string, progress: Progress, items: QuestItemLedger,
  receipts: QuestActionReceipts): boolean {
  if (questId !== CAIN_QUEST && questId !== CAIN_SIDE_QUEST) return true;
  if (!hasCainRescue(progress, items, receipts) || progress[questId]?.status !== 'completed') return false;
  return questId === CAIN_QUEST || flag(progress, CAIN_SIDE_QUEST, 'obj-talk') &&
    Object.hasOwn(receipts, ACT1_QUEST_RECEIPTS.cainTalk) && receipts[ACT1_QUEST_RECEIPTS.cainTalk] === true;
}
/** Validate current finite sources without changing sparse completed/claimed legacy history. */
export function validateCainQuestGraph(items: QuestItemLedger, progress: Progress, receipts: QuestActionReceipts): void {
  const fail = () => { throw new Error('Invalid save: contradictory Cain source graph'); };
  if (Object.hasOwn(items, CAIN_SCROLL_SOURCE)) {
    const scroll = items[CAIN_SCROLL_SOURCE];
    if (scroll?.itemId !== CAIN_SCROLL_ITEM || !flag(progress, CAIN_QUEST, 'obj-inifuss-tree') ||
      !isScrollState(scroll.state) ||
      (scroll.state === 'consumed' && !flag(progress, CAIN_QUEST, 'obj-decode'))) fail();
  }
  if (Object.hasOwn(receipts, ACT1_QUEST_RECEIPTS.rescueCain) && !hasCainRescue(progress, items, receipts)) fail();
  if (Object.hasOwn(receipts, ACT1_QUEST_RECEIPTS.cainTalk) &&
    !hasCainCompletion(CAIN_SIDE_QUEST, progress, items, receipts)) fail();
}
