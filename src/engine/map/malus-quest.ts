import type { MalusQuestDomain } from '../save/quest-domain';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '@/engine/types/save';
import { ACT1_QUEST_RECEIPTS } from './act1-quest-sources';

export const MALUS_QUEST = 'quests/act1-tools-of-the-trade';
export const MALUS_SOURCE = `${MALUS_QUEST}#objective:obj-recover-malus`;
export const MALUS_ITEM = 'quest/horadric_malus';
export const MALUS_AREA = 'areas/act1-catacombs';
export const MALUS_OBJECT = 'objects/horadric_malus_cache';
export const MALUS_SIDE_QUEST = 'quests/side-act1-charsis-imbue';
export const LIVE_MALUS_DOMAIN: MalusQuestDomain = Object.freeze({
  quest: MALUS_QUEST, sideQuest: MALUS_SIDE_QUEST, source: MALUS_SOURCE, itemId: MALUS_ITEM,
  recoverObjective: 'obj-recover-malus', handInObjective: 'obj-imbue-ready', presentObjective: 'obj-bring-item',
  presentReceipt: ACT1_QUEST_RECEIPTS.presentItem
});
type Progress = Readonly<Record<string, QuestProgressData>>;

// The current validator also receives untrusted source entries before normalization.
function isMalusState(value: unknown): value is 'owned' | 'consumed' {
  return value === 'owned' || value === 'consumed';
}

/** Only canonical tracked Malus rows may explicitly earn physical proof. */
export function isMalusProgress(progress: Progress, domain: MalusQuestDomain = LIVE_MALUS_DOMAIN): boolean {
  const row = Object.hasOwn(progress, domain.quest) ? progress[domain.quest] : undefined;
  return row?.id === domain.quest && (row.status === 'inProgress' || row.status === 'completed') &&
    (row.rewardClaimed !== true || row.status === 'completed');
}
function flag(progress: Progress, objective: string, domain: MalusQuestDomain): boolean {
  const row = progress[domain.quest];
  return isMalusProgress(progress, domain) && row !== undefined &&
    Object.hasOwn(row.objectives, objective) && row.objectives[objective] === true;
}

/** Finite partial legacy repair requires the selected action's real predecessors. */
export function canEarnMalusObjective(progress: Progress, objective: string, items: QuestItemLedger, domain: MalusQuestDomain = LIVE_MALUS_DOMAIN): boolean {
  if (!isMalusProgress(progress, domain)) return false;
  if (objective === domain.recoverObjective) return true;
  const malus = Object.hasOwn(items, domain.source) ? items[domain.source] : undefined;
  return objective === domain.handInObjective && malus?.itemId === domain.itemId &&
    isMalusState(malus.state) && flag(progress, domain.recoverObjective, domain);
}

/** Actual completed hand-in authority; historical completion/Claim flags alone grant none. */
export function hasMalusHandIn(progress: Progress, items: QuestItemLedger, domain: MalusQuestDomain = LIVE_MALUS_DOMAIN): boolean {
  return canEarnMalusObjective(progress, domain.handInObjective, items, domain) &&
    items[domain.source]?.state === 'consumed' && flag(progress, domain.handInObjective, domain) &&
    progress[domain.quest]?.status === 'completed';
}

/** Side presentation requires the real main hand-in, independently of either Claim. */
export function hasMalusCompletion(questId: string, progress: Progress, items: QuestItemLedger,
  receipts: QuestActionReceipts, domain: MalusQuestDomain = LIVE_MALUS_DOMAIN): boolean {
  if (questId !== domain.quest && questId !== domain.sideQuest) return true;
  if (!hasMalusHandIn(progress, items, domain)) return false;
  if (questId === domain.quest) return true;
  const side = Object.hasOwn(progress, domain.sideQuest) ? progress[domain.sideQuest] : undefined;
  return side?.id === domain.sideQuest && side.status === 'completed' &&
    Object.hasOwn(side.objectives, domain.presentObjective) && side.objectives[domain.presentObjective] === true &&
    Object.hasOwn(receipts, domain.presentReceipt) && receipts[domain.presentReceipt] === true;
}

/** Validate only the finite current physical graph, preserving sparse historical journals. */
export function validateMalusQuestGraph(items: QuestItemLedger, progress: Progress,
  receipts: QuestActionReceipts = {}, domain: MalusQuestDomain = LIVE_MALUS_DOMAIN): void {
  const malus = Object.hasOwn(items, domain.source) ? items[domain.source] : undefined;
  if (Object.hasOwn(items, domain.source) && (malus?.itemId !== domain.itemId || !flag(progress, domain.recoverObjective, domain) ||
    !isMalusState(malus.state) ||
    (malus.state === 'consumed' && !hasMalusHandIn(progress, items, domain)))) {
    throw new Error('Invalid save: contradictory Malus physical source graph');
  }
  if (Object.hasOwn(receipts, domain.presentReceipt) &&
    !hasMalusCompletion(domain.sideQuest, progress, items, receipts, domain)) {
    throw new Error('Invalid save: contradictory Charsi Present source graph');
  }
}
