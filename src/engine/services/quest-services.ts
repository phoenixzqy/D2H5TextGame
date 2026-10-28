import { loadQuests, type QuestDef } from '@/data/loaders/quests';
import type { QuestProgressData } from '../types/save';
import type { QuestServiceValidationDomain } from '../save/quest-domain';
import { ACT1_IMBUE_SOURCES } from '../map/act1-quest-sources';

/** Literal17–22 selected-item service vocabulary never widens with current authoring. */
export type HistoricalQuestServiceId = 'socket_item' | 'socket_armor' | 'personalize_item';
/** Current selected-item services include independently earned Act I imbues. */
export type QuestServiceId = HistoricalQuestServiceId | 'imbue_item';

/** One source charge or its historical selected-instance use, including after salvage. */
export type QuestServiceEntry<Service extends QuestServiceId = QuestServiceId> =
  | { readonly serviceId: Service; readonly state: 'available'; readonly targetItemId?: never }
  | { readonly serviceId: Service; readonly state: 'consumed'; readonly targetItemId: string };

/** Exact authored reward sources, never an inferred counter or a generated item ID. */
export type QuestServiceLedger = Readonly<Record<string, QuestServiceEntry>>;
/** Historical save types retain their literal selected-item service entries. */
export type HistoricalQuestServiceLedger = Readonly<Record<string, QuestServiceEntry<HistoricalQuestServiceId>>>;

/** Independently usable charges; current saves admit these seven exact sources. */
export const QUEST_SERVICE_SOURCES = Object.freeze({
  [ACT1_IMBUE_SOURCES.main]: 'imbue_item',
  [ACT1_IMBUE_SOURCES.side]: 'imbue_item',
  'quests/act5-siege-on-harrogath#reward:service': 'socket_item',
  'quests/side-act5-larzuks-sockets#reward:service': 'socket_item',
  'quests/side-act4-halbus-soul#reward:service': 'socket_armor',
  'quests/act5-prison-of-ice#reward:service': 'personalize_item',
  'quests/side-act5-anyas-gift#reward:service': 'personalize_item'
} as const satisfies Readonly<Record<string, QuestServiceId>>);

/** Native inputs must be own enumerable JSON data, before normalization erases shape. */
function jsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) && Reflect.ownKeys(value).every(key => {
    if (typeof key !== 'string') return false;
    const property = Object.getOwnPropertyDescriptor(value, key);
    return property?.enumerable === true && Object.hasOwn(property, 'value');
  });
}

function claimedSource(value: unknown, quest: QuestDef): value is QuestProgressData {
  if (!jsonRecord(value) || value.id !== quest.id || value.status !== 'completed' || value.rewardClaimed !== true ||
    !Object.hasOwn(value, 'id') || !Object.hasOwn(value, 'status') || !Object.hasOwn(value, 'rewardClaimed') ||
    !Object.hasOwn(value, 'objectives') || !jsonRecord(value.objectives)) return false;
  const objectives = value.objectives;
  return Object.keys(objectives).length === quest.objectives.length && quest.objectives.every(objective =>
    Object.hasOwn(objectives, objective.id) && objectives[objective.id] === true);
}

/**
 * Validate the finite service wallet against actual authored, claimed source rows.
 * Returns the original ledger without mutation or inferred grants. The caller must
 * first validate the full victory/item/action receipt graph: these two arguments
 * cannot prove encounter authority or the actual selected-instance transformation.
 * Consumed target IDs use the existing persisted Item.id string boundary (including
 * legacy IDs); runtime consumers must select the actual uniquely owned instance.
 * A consumed target need not remain present after later salvage.
 */
export function validateQuestServiceLedger(services: unknown, progress: unknown,
  domain?: QuestServiceValidationDomain): QuestServiceLedger {
  if (!jsonRecord(services) || !jsonRecord(progress)) throw new Error('Invalid quest service ledger/progress record');
  const quests = domain?.quests ?? loadQuests();
  const sources: Readonly<Record<string, QuestServiceId>> = domain?.serviceSources ?? QUEST_SERVICE_SOURCES;
  for (const [source, entry] of Object.entries(services)) {
    if (!Object.hasOwn(sources, source) || !jsonRecord(entry)) {
      throw new Error('Invalid quest service source or entry');
    }
    const service = sources[source];
    if (!Object.hasOwn(entry, 'serviceId') || !Object.hasOwn(entry, 'state') || entry.serviceId !== service ||
      !(entry.state === 'available' && Object.keys(entry).length === 2 && !Object.hasOwn(entry, 'targetItemId') ||
        entry.state === 'consumed' && Object.keys(entry).length === 3 && Object.hasOwn(entry, 'targetItemId') &&
        typeof entry.targetItemId === 'string')) throw new Error('Invalid quest service entry shape or service');
    const questId = source.slice(0, -'#reward:service'.length);
    const quest = quests.find(row => row.id === questId);
    if (!quest?.rewards || !Object.hasOwn(quest.rewards, 'service') || quest.rewards.service !== service ||
      !Object.hasOwn(progress, questId) || !claimedSource(progress[questId], quest)) {
      throw new Error('Invalid quest service claimed source');
    }
  }
  return services as QuestServiceLedger;
}
