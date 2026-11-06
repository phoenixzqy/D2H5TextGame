import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
import type { Act5QuestDomain } from '../save/quest-domain';
import { hasAct5Completion, LIVE_ACT5_DOMAIN, validateAct5QuestGraph } from '../save/act5-state';

/** Finite physical relic authority, independent of the later unique reward instance. */
export interface NihlathakQuestDomain {
  readonly quest: string;
  readonly objective: string;
  readonly source: string;
  readonly itemId: string;
  readonly prerequisite: string;
}
export const NIHLATHAK = Object.freeze({ quest: 'quests/side-act5-nihlathaks-treasure', objective: 'obj-fetch',
  source: 'quests/side-act5-nihlathaks-treasure#objective:obj-fetch', itemId: 'quest/nihlathak_relic',
  actId: 'acts/act5', areaId: 'areas/act5-crystalline-passage', targetId: 'objects/nihlathak_relic_cache',
  npc: 'npc/cain', prerequisite: 'quests/act5-prison-of-ice' });
type Progress = Readonly<Record<string, QuestProgressData>>;
function plainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function jsonRecord(value: unknown): value is Record<string, unknown> {
  return plainRecord(value) && Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
  });
}
/** Read only a verified own data descriptor; unrelated publication state is untouched. */
function ownData(value: Record<string, unknown>, key: string): unknown {
  const field = Object.getOwnPropertyDescriptor(value, key);
  return field?.enumerable === true && Object.hasOwn(field, 'value') ? field.value : undefined;
}
function exactItem(value: unknown): value is QuestItemLedger[string] {
  return jsonRecord(value) && Object.keys(value).length === 2 && Object.hasOwn(value, 'itemId') &&
    Object.hasOwn(value, 'state') && typeof value.itemId === 'string' &&
    (value.state === 'owned' || value.state === 'consumed');
}
function completedRow(value: unknown, quest: string, objectives: readonly string[]): value is QuestProgressData {
  if (!jsonRecord(value) || !Object.hasOwn(value, 'id') || !Object.hasOwn(value, 'status') ||
    !Object.hasOwn(value, 'objectives') || value.id !== quest || value.status !== 'completed' ||
    !jsonRecord(value.objectives) || Object.keys(value.objectives).length !== objectives.length ||
    ('rewardClaimed' in value && (!Object.hasOwn(value, 'rewardClaimed') || typeof value.rewardClaimed !== 'boolean'))) return false;
  const flags = value.objectives;
  return objectives.every(id => Object.hasOwn(flags, id) && flags[id] === true);
}
/**
 * Qualified Prison constituents only: safe during the side's source-before-row publication.
 * Do not validate another quest/source or require main Claim or resistance-scroll Read.
 */
export function hasQualifiedNihlathakVictory(progress: Progress, receipts: QuestActionReceipts,
  items: QuestItemLedger, act5: Act5QuestDomain = LIVE_ACT5_DOMAIN): boolean {
  if (!plainRecord(progress) || !plainRecord(receipts) || !plainRecord(items)) return false;
  const objectives = act5.objectiveIds[act5.prisonQuest], row = ownData(progress, act5.prisonQuest);
  const encounters = act5.encounters.filter(encounter => encounter.questId === act5.prisonQuest);
  if (!objectives || objectives.length !== 3 || encounters.length !== 1 ||
    !completedRow(row, act5.prisonQuest, objectives)) return false;
  const potion = ownData(items, act5.potionSource);
  if (!exactItem(potion) || potion.itemId !== act5.potionItemId || potion.state !== 'consumed') return false;
  const prisonItems: Record<string, QuestItemLedger[string]> = { [act5.potionSource]: potion };
  if (act5.scrollSource in items) {
    const scroll = ownData(items, act5.scrollSource);
    if (!exactItem(scroll) || scroll.itemId !== act5.scrollItemId) return false;
    prisonItems[act5.scrollSource] = scroll;
  }
  const prisonReceipts: Record<string, true> = {};
  const sources = [...act5.actions.filter(action => action.questId === act5.prisonQuest)
    .map(action => action.receiptSource), ...encounters.map(encounter => encounter.proof)];
  for (const source of sources) {
    if (!(source in receipts)) continue;
    if (ownData(receipts, source) !== true) return false;
    prisonReceipts[source] = true;
  }
  const prisonProgress = { [act5.prisonQuest]: row };
  try { validateAct5QuestGraph(prisonItems, prisonProgress, prisonReceipts, act5); } catch { return false; }
  return hasAct5Completion(act5.prisonQuest, prisonProgress, prisonReceipts, prisonItems, act5);
}
/** Require the exact retained physical source, terminal side row and qualified main graph. */
export function hasNihlathakRelic(progress: Progress, items: QuestItemLedger, receipts: QuestActionReceipts,
  domain: NihlathakQuestDomain = NIHLATHAK, act5: Act5QuestDomain = LIVE_ACT5_DOMAIN): boolean {
  if (!plainRecord(progress) || !plainRecord(items) || domain.prerequisite !== act5.prisonQuest) return false;
  const item = ownData(items, domain.source), row = ownData(progress, domain.quest);
  return exactItem(item) && item.itemId === domain.itemId && item.state === 'owned' &&
    completedRow(row, domain.quest, [domain.objective]) && hasQualifiedNihlathakVictory(progress, receipts, items, act5);
}
/** Proofless legacy rows stay inert; present physical ownership must have the complete graph. */
export function validateNihlathakQuestGraph(progress: Progress, items: QuestItemLedger, receipts: QuestActionReceipts,
  domain: NihlathakQuestDomain = NIHLATHAK, act5: Act5QuestDomain = LIVE_ACT5_DOMAIN): void {
  if (!plainRecord(items) || !plainRecord(progress)) throw new Error('Invalid save: Nihlathak source graph must be plain data');
  const sourcePresent = domain.source in items;
  if (sourcePresent && !hasNihlathakRelic(progress, items, receipts, domain, act5)) {
    throw new Error('Invalid save: Nihlathak relic requires its owned source, completed objective and qualified Prison');
  }
  // Legacy flags do not earn a relic, but normalization must never evaluate or erase their descriptors.
  if (!sourcePresent && domain.quest in progress) {
    const row = ownData(progress, domain.quest);
    if (!jsonRecord(row) || !jsonRecord(ownData(row, 'objectives'))) {
      throw new Error('Invalid save: Nihlathak history must be own JSON data');
    }
  }
}
