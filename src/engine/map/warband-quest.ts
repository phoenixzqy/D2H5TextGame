import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
import { hasAct5Completion, LIVE_ACT5_DOMAIN, validateAct5QuestGraph } from '../save/act5-state';
import type { Act5QuestDomain } from '../save/quest-domain';

/** Finite historical enlistment authority, independent of continued ownership or fielding. */
export interface WarbandQuestDomain {
  readonly quest: string;
  readonly objective: string;
  readonly proof: string;
  readonly prerequisite: string;
}
export const WARBAND = Object.freeze({ quest: 'quests/side-act5-qual-kehk-merc', objective: 'obj-hire',
  proof: 'quests/side-act5-qual-kehk-merc#action:enlist-recruit', prerequisite: 'quests/act5-rescue-on-mount-arreat',
  mercId: 'mercs/act5-barbarian-recruit', actId: 'acts/act5', npc: 'npc/qual-kehk' });
type Progress = Readonly<Record<string, QuestProgressData>>;
function jsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || (Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null)) return false;
  return Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
  });
}
/** Durable proof needs the exact completed side objective and qualified Rescue/all cages. */
export function hasWarbandEnlistment(progress: Progress, receipts: QuestActionReceipts, items: QuestItemLedger,
  domain: WarbandQuestDomain = WARBAND, act5: Act5QuestDomain = LIVE_ACT5_DOMAIN): boolean {
  if (!jsonRecord(progress) || !jsonRecord(receipts) || !jsonRecord(items) ||
    !Object.values(progress).every(row => jsonRecord(row) && Object.hasOwn(row, 'id') && Object.hasOwn(row, 'status') &&
      Object.hasOwn(row, 'objectives') && jsonRecord(row.objectives) &&
      (!('rewardClaimed' in row) || (Object.hasOwn(row, 'rewardClaimed') && typeof row.rewardClaimed === 'boolean'))) ||
    !Object.values(items).every(item => jsonRecord(item) && Object.hasOwn(item, 'itemId') && Object.hasOwn(item, 'state'))) return false;
  const row = Object.hasOwn(progress, domain.quest) ? progress[domain.quest] : undefined;
  if (!row || !Object.hasOwn(row, 'id') || !Object.hasOwn(row, 'status') || !Object.hasOwn(row, 'objectives') ||
    row.id !== domain.quest || row.status !== 'completed' ||
    ('rewardClaimed' in row && (!Object.hasOwn(row, 'rewardClaimed') || typeof row.rewardClaimed !== 'boolean')) ||
    Object.keys(row.objectives).length !== 1 || !Object.hasOwn(row.objectives, domain.objective) || row.objectives[domain.objective] !== true ||
    !Object.hasOwn(receipts, domain.proof) || receipts[domain.proof] !== true || domain.prerequisite !== act5.rescueQuest) return false;
  try { validateAct5QuestGraph(items, progress, receipts, act5); } catch { return false; }
  return hasAct5Completion(domain.prerequisite, progress, receipts, items, act5);
}
/** Proofless legacy rows stay inert history; present but contradictory proof is invalid. */
export function validateWarbandQuestGraph(progress: Progress, receipts: QuestActionReceipts, items: QuestItemLedger,
  domain: WarbandQuestDomain = WARBAND, act5: Act5QuestDomain = LIVE_ACT5_DOMAIN): void {
  if (Object.hasOwn(receipts, domain.proof) && !hasWarbandEnlistment(progress, receipts, items, domain, act5)) {
    throw new Error('Invalid save: Warband enlistment proof requires its completed objective and qualified Rescue');
  }
}
