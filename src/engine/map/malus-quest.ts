import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '@/engine/types/save';
import { ACT1_QUEST_RECEIPTS } from './act1-quest-sources';

export const MALUS_QUEST = 'quests/act1-tools-of-the-trade';
export const MALUS_SOURCE = `${MALUS_QUEST}#objective:obj-recover-malus`;
export const MALUS_ITEM = 'quest/horadric_malus';
export const MALUS_AREA = 'areas/act1-catacombs';
export const MALUS_OBJECT = 'objects/horadric_malus_cache';
export const MALUS_SIDE_QUEST = 'quests/side-act1-charsis-imbue';
type Progress = Readonly<Record<string, QuestProgressData>>;

// The current validator also receives untrusted source entries before normalization.
function isMalusState(value: unknown): value is 'owned' | 'consumed' {
  return value === 'owned' || value === 'consumed';
}

/** Only canonical tracked Malus rows may explicitly earn physical proof. */
export function isMalusProgress(progress: Progress): boolean {
  const row = Object.hasOwn(progress, MALUS_QUEST) ? progress[MALUS_QUEST] : undefined;
  return row?.id === MALUS_QUEST && (row.status === 'inProgress' || row.status === 'completed') &&
    (row.rewardClaimed !== true || row.status === 'completed');
}
function flag(progress: Progress, objective: string): boolean {
  const row = progress[MALUS_QUEST];
  return isMalusProgress(progress) && row !== undefined &&
    Object.hasOwn(row.objectives, objective) && row.objectives[objective] === true;
}

/** Finite partial legacy repair requires the selected action's real predecessors. */
export function canEarnMalusObjective(progress: Progress, objective: string, items: QuestItemLedger): boolean {
  if (!isMalusProgress(progress)) return false;
  if (objective === 'obj-recover-malus') return true;
  const malus = Object.hasOwn(items, MALUS_SOURCE) ? items[MALUS_SOURCE] : undefined;
  return objective === 'obj-imbue-ready' && malus?.itemId === MALUS_ITEM &&
    isMalusState(malus.state) && flag(progress, 'obj-recover-malus');
}

/** Actual completed hand-in authority; historical completion/Claim flags alone grant none. */
export function hasMalusHandIn(progress: Progress, items: QuestItemLedger): boolean {
  return canEarnMalusObjective(progress, 'obj-imbue-ready', items) &&
    items[MALUS_SOURCE]?.state === 'consumed' && flag(progress, 'obj-imbue-ready') &&
    progress[MALUS_QUEST]?.status === 'completed';
}

/** Side presentation requires the real main hand-in, independently of either Claim. */
export function hasMalusCompletion(questId: string, progress: Progress, items: QuestItemLedger,
  receipts: QuestActionReceipts): boolean {
  if (questId !== MALUS_QUEST && questId !== MALUS_SIDE_QUEST) return true;
  if (!hasMalusHandIn(progress, items)) return false;
  if (questId === MALUS_QUEST) return true;
  const side = Object.hasOwn(progress, MALUS_SIDE_QUEST) ? progress[MALUS_SIDE_QUEST] : undefined;
  return side?.id === MALUS_SIDE_QUEST && side.status === 'completed' &&
    Object.hasOwn(side.objectives, 'obj-bring-item') && side.objectives['obj-bring-item'] === true &&
    Object.hasOwn(receipts, ACT1_QUEST_RECEIPTS.presentItem) && receipts[ACT1_QUEST_RECEIPTS.presentItem] === true;
}

/** Validate only the finite current physical graph, preserving sparse historical journals. */
export function validateMalusQuestGraph(items: QuestItemLedger, progress: Progress,
  receipts: QuestActionReceipts = {}): void {
  const malus = Object.hasOwn(items, MALUS_SOURCE) ? items[MALUS_SOURCE] : undefined;
  if (Object.hasOwn(items, MALUS_SOURCE) && (malus?.itemId !== MALUS_ITEM || !flag(progress, 'obj-recover-malus') ||
    !isMalusState(malus.state) ||
    (malus.state === 'consumed' && !hasMalusHandIn(progress, items)))) {
    throw new Error('Invalid save: contradictory Malus physical source graph');
  }
  if (Object.hasOwn(receipts, ACT1_QUEST_RECEIPTS.presentItem) &&
    !hasMalusCompletion(MALUS_SIDE_QUEST, progress, items, receipts)) {
    throw new Error('Invalid save: contradictory Charsi Present source graph');
  }
}
