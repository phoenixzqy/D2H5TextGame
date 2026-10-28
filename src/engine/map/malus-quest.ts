import type { QuestItemLedger, QuestProgressData } from '@/engine/types/save';

export const MALUS_QUEST = 'quests/act1-tools-of-the-trade';
export const MALUS_SOURCE = `${MALUS_QUEST}#objective:obj-recover-malus`;
export const MALUS_ITEM = 'quest/horadric_malus';
export const MALUS_AREA = 'areas/act1-catacombs';
export const MALUS_OBJECT = 'objects/horadric_malus_cache';
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

/** Validate only the finite current physical graph, preserving sparse historical journals. */
export function validateMalusQuestGraph(items: QuestItemLedger, progress: Progress): void {
  if (!Object.hasOwn(items, MALUS_SOURCE)) return;
  const malus = items[MALUS_SOURCE];
  if (malus?.itemId !== MALUS_ITEM || !flag(progress, 'obj-recover-malus') ||
    !isMalusState(malus.state) ||
    (malus.state === 'consumed' && !hasMalusHandIn(progress, items))) {
    throw new Error('Invalid save: contradictory Malus physical source graph');
  }
}
