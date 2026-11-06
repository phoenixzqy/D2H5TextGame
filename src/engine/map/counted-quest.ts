import type { QuestItemLedger, QuestProgressData } from '../types/save';

export type CountedQuestKey = 'alkor' | 'jade' | 'jamella' | 'malah' | 'gheed';
export type CountedQuestProgress = Readonly<Record<string, QuestProgressData>>;

/** Durable authority only; runtime placement and reward data are supplied separately. */
export interface CountedQuestDomain {
  readonly key: CountedQuestKey;
  readonly quest: string;
  readonly objective: string;
  readonly objectiveType: 'collect' | 'deliver';
  readonly itemId: string;
  readonly sink: 'claim' | 'town-delivery';
  readonly sources: readonly string[];
}
export interface CountedQuestCounts {
  readonly recovered: number;
  readonly held: number;
  readonly consumed: number;
  readonly total: number;
}

function jsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) return false;
  return Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
  });
}
function ownData(value: Record<string, unknown>, key: string): unknown {
  return Object.getOwnPropertyDescriptor(value, key)?.value as unknown;
}
function trackedRow(progress: unknown, domain: CountedQuestDomain): QuestProgressData | undefined {
  if (!jsonRecord(progress)) return undefined;
  const row = ownData(progress, domain.quest);
  const status = jsonRecord(row) ? ownData(row, 'status') : undefined;
  if (!jsonRecord(row) || ownData(row, 'id') !== domain.quest ||
    (status !== 'inProgress' && status !== 'completed') ||
    (Object.hasOwn(row, 'rewardClaimed') && typeof ownData(row, 'rewardClaimed') !== 'boolean')) return undefined;
  const objectives = ownData(row, 'objectives');
  if (!jsonRecord(objectives) || Object.keys(objectives).length !== 1 ||
    typeof ownData(objectives, domain.objective) !== 'boolean') return undefined;
  const terminal = ownData(row, 'status') === 'completed';
  if (ownData(objectives, domain.objective) !== terminal) return undefined;
  return row as unknown as QuestProgressData;
}

/** Counts come from literal identities; malformed participating data never becomes an absent source. */
export function countCountedQuestSources(items: QuestItemLedger, domain: CountedQuestDomain): CountedQuestCounts {
  if (!jsonRecord(items)) throw new Error('Invalid save: counted sources require an own JSON ledger');
  let held = 0, consumed = 0;
  for (const source of domain.sources) {
    if (!Object.hasOwn(items, source)) continue;
    const entry = ownData(items, source);
    const state = jsonRecord(entry) ? ownData(entry, 'state') : undefined;
    if (!jsonRecord(entry) || Object.keys(entry).length !== 2 || ownData(entry, 'itemId') !== domain.itemId ||
      (state !== 'owned' && state !== 'consumed')) {
      throw new Error('Invalid save: counted source requires its exact item and state');
    }
    if (ownData(entry, 'state') === 'owned') held++; else consumed++;
  }
  return { held, consumed, recovered: held + consumed, total: domain.sources.length };
}

/** Raw finite graphs are checked before normalization; source-free history remains inert. */
export function validateCountedQuestGraphs(progress: unknown, items: unknown,
  domains: readonly CountedQuestDomain[]): void {
  if (!jsonRecord(progress) || !jsonRecord(items)) throw new Error('Invalid save: counted history requires own JSON records');
  for (const domain of domains) {
    if (Object.keys(items).some(source => source.startsWith(`${domain.quest}#`) && !domain.sources.includes(source))) {
      throw new Error('Invalid save: unknown counted source');
    }
    const counts = countCountedQuestSources(items as QuestItemLedger, domain);
    if (counts.recovered === 0) continue;
    const row = trackedRow(progress, domain);
    if (!row) throw new Error('Invalid save: counted source requires its canonical tracked objective');
    const fullConsumed = counts.consumed === counts.total;
    if (counts.consumed > 0 && !fullConsumed || row.rewardClaimed === true && !fullConsumed ||
      fullConsumed && (row.status !== 'completed' || domain.sink === 'claim' && row.rewardClaimed !== true) ||
      counts.held === counts.total && domain.sink === 'claim' && row.status !== 'completed') {
      throw new Error('Invalid save: counted ownership and consumption contradict quest progress');
    }
  }
}

/** Exact unclaimed ingredient exchange (collect) or proven Give (Jade), without location gates. */
export function hasCountedQuestClaimCompletion(progress: CountedQuestProgress, items: QuestItemLedger,
  domain: CountedQuestDomain): boolean {
  try {
    validateCountedQuestGraphs(progress, items, [domain]);
    const row = trackedRow(progress, domain), counts = countCountedQuestSources(items, domain);
    return row?.status === 'completed' && row.rewardClaimed !== true &&
      (domain.sink === 'claim' ? counts.held === counts.total : counts.consumed === counts.total);
  } catch { return false; }
}

/** Completed full-consumption proof, independent of the separate Claim flag. */
export function hasCountedQuestConsumption(progress: CountedQuestProgress, items: QuestItemLedger,
  domain: CountedQuestDomain): boolean {
  try {
    return trackedRow(progress, domain)?.status === 'completed' &&
      countCountedQuestSources(items, domain).consumed === domain.sources.length;
  } catch { return false; }
}

/** Source-derived paid entitlement; legacy flags alone never grant a new stat bonus. */
export function hasCountedQuestClaimedConsumption(progress: CountedQuestProgress, items: QuestItemLedger,
  domain: CountedQuestDomain): boolean {
  return hasCountedQuestConsumption(progress, items, domain) && trackedRow(progress, domain)?.rewardClaimed === true;
}
