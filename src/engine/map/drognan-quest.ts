import type { QuestItemLedger, QuestProgressData } from '../types/save';

/** Persisted physical source authority for Drognan's retained manuscript. */
export interface DrognanQuestDomain {
  readonly quest: string;
  readonly objective: string;
  readonly source: string;
  readonly itemId: string;
}
export const DROGNAN = Object.freeze({ quest: 'quests/side-act2-drognan-tome', objective: 'obj-fetch',
  source: 'quests/side-act2-drognan-tome#objective:obj-fetch', itemId: 'quest/sun_cult_tome',
  actId: 'acts/act2', areaId: 'areas/act2-lost-city', targetId: 'objects/sun_cult_tome_cache', npc: 'npc/drognan' });
type Progress = Readonly<Record<string, QuestProgressData>>;
function jsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || (Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null)) return false;
  return Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
  });
}
/** Require a physically owned source and the terminal completed objective. */
export function hasDrognanTome(progress: Progress, items: QuestItemLedger,
  domain: DrognanQuestDomain = DROGNAN): boolean {
  if (!jsonRecord(items) || !jsonRecord(progress) || !Object.hasOwn(items, domain.source) ||
    !Object.hasOwn(progress, domain.quest)) return false;
  const item = items[domain.source], row = progress[domain.quest];
  if (!jsonRecord(item) || Object.keys(item).length !== 2 || !Object.hasOwn(item, 'itemId') ||
    !Object.hasOwn(item, 'state') || item.itemId !== domain.itemId || item.state !== 'owned' || !jsonRecord(row) ||
    !Object.hasOwn(row, 'id') || !Object.hasOwn(row, 'status') || !Object.hasOwn(row, 'objectives') ||
    row.id !== domain.quest || row.status !== 'completed' || !jsonRecord(row.objectives) ||
    ('rewardClaimed' in row && (!Object.hasOwn(row, 'rewardClaimed') || typeof row.rewardClaimed !== 'boolean'))) return false;
  return Object.keys(row.objectives).length === 1 && Object.hasOwn(row.objectives, domain.objective) &&
    row.objectives[domain.objective] === true;
}
/** Proofless legacy rows stay inert history; contradictory physical ownership is invalid. */
export function validateDrognanQuestGraph(progress: Progress, items: QuestItemLedger,
  domain: DrognanQuestDomain = DROGNAN): void {
  if (!jsonRecord(items) || (Object.hasOwn(items, domain.source) && !hasDrognanTome(progress, items, domain))) {
    throw new Error('Invalid save: Drognan tome requires its owned source and exact completed objective');
  }
}
