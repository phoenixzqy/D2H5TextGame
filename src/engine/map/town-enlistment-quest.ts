import type { QuestActionReceipts, QuestProgressData } from '../types/save';

/** Exactly the three authored Act I–III captain contracts. */
export type TownEnlistmentKey = 'kashya' | 'greiz' | 'asheara';

/** Historical proof authority; continued possession, town and hero level are not prerequisites. */
export interface TownEnlistmentQuestDomain {
  readonly quest: string;
  readonly objective: string;
  readonly proof: string;
  readonly prerequisite?: { readonly quest: string; readonly objectiveIds: readonly string[] };
}

/** Runtime identities extend the small independently frozen save authority. */
export interface TownEnlistmentMetadata extends TownEnlistmentQuestDomain {
  readonly mercId: string;
  readonly actId: string;
  readonly npc: string;
}

/** Hero gates belong to the hire roster; fresh levels/stats belong to the mercenary factory. */
export const TOWN_ENLISTMENTS: Readonly<Record<TownEnlistmentKey, TownEnlistmentMetadata>> = Object.freeze({
  kashya: Object.freeze({ quest: 'quests/side-act1-rogue-merc-unlock', objective: 'obj-hire',
    proof: 'quests/side-act1-rogue-merc-unlock#action:enlist-recruit', mercId: 'mercs/act1-rogue-trainee',
    actId: 'acts/act1', npc: 'npc/kashya', prerequisite: Object.freeze({ quest: 'quests/act1-sisters-burial-grounds',
      objectiveIds: Object.freeze(['obj-kill-blood-raven', 'obj-return']) }) }),
  greiz: Object.freeze({ quest: 'quests/side-act2-greiz-merc-roster', objective: 'obj-hire',
    proof: 'quests/side-act2-greiz-merc-roster#action:enlist-recruit', mercId: 'mercs/act2-blessed-aim',
    actId: 'acts/act2', npc: 'npc/greiz', prerequisite: Object.freeze({ quest: 'quests/act2-radaments-lair',
      objectiveIds: Object.freeze(['obj-kill-radament']) }) }),
  asheara: Object.freeze({ quest: 'quests/side-act3-asheara-merc', objective: 'obj-hire',
    proof: 'quests/side-act3-asheara-merc#action:enlist-recruit', mercId: 'mercs/act3-iron-wolf-frozen-armor',
    actId: 'acts/act3', npc: 'npc/asheara' })
});

type Progress = Readonly<Record<string, QuestProgressData>>;
function jsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || (Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null)) return false;
  return Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
  });
}
function ownData(value: Record<string, unknown>, key: string): unknown {
  const field = Object.getOwnPropertyDescriptor(value, key);
  return field?.enumerable === true && Object.hasOwn(field, 'value') ? field.value as unknown : undefined;
}
function trackedRow(value: unknown): value is QuestProgressData {
  if (!jsonRecord(value)) return false;
  const status = ownData(value, 'status');
  if (typeof ownData(value, 'id') !== 'string' || typeof status !== 'string' ||
    !['locked', 'available', 'inProgress', 'completed'].includes(status) ||
    ('rewardClaimed' in value && typeof ownData(value, 'rewardClaimed') !== 'boolean')) return false;
  const objectives = ownData(value, 'objectives');
  return jsonRecord(objectives) && Object.values(objectives).every(flag => typeof flag === 'boolean');
}

/** Require own completed canonical main flags, without Claim/Book Read or a new victory receipt. */
export function hasTownEnlistmentPrerequisite(progress: Progress, domain: TownEnlistmentQuestDomain): boolean {
  if (!jsonRecord(progress)) return false;
  if (!domain.prerequisite) return true;
  const { quest, objectiveIds } = domain.prerequisite, row = ownData(progress, quest);
  return trackedRow(row) && row.id === quest && row.status === 'completed' &&
    objectiveIds.every(id => Object.hasOwn(row.objectives, id) && row.objectives[id] === true);
}

/** Durable enlistment survives dismissal and Claim; the exact side objective and main graph remain required. */
export function hasTownEnlistmentProof(progress: Progress, receipts: QuestActionReceipts,
  domain: TownEnlistmentQuestDomain): boolean {
  if (!jsonRecord(progress) || !jsonRecord(receipts) || ownData(receipts, domain.proof) !== true) return false;
  const row = ownData(progress, domain.quest);
  return trackedRow(row) && row.id === domain.quest && row.status === 'completed' &&
    Object.keys(row.objectives).length === 1 && Object.hasOwn(row.objectives, domain.objective) &&
    row.objectives[domain.objective] === true && hasTownEnlistmentPrerequisite(progress, domain);
}

/** Validate raw finite family graphs before normalization; proofless history grants no proof or ownership. */
export function validateTownEnlistmentGraphs(progress: Progress, receipts: QuestActionReceipts,
  domains: readonly TownEnlistmentQuestDomain[] = Object.values(TOWN_ENLISTMENTS)): void {
  if (!jsonRecord(progress)) throw new Error('Invalid save: town enlistment progress requires own JSON records');
  if (!jsonRecord(receipts)) throw new Error('Invalid save: questReceipts requires a closed JSON action receipt map');
  for (const domain of domains) {
    for (const quest of [domain.quest, ...(domain.prerequisite ? [domain.prerequisite.quest] : [])]) {
      if (quest in progress && !trackedRow(ownData(progress, quest))) {
        throw new Error('Invalid save: town enlistment history requires own JSON rows and boolean objectives');
      }
    }
    if (domain.proof in receipts && !hasTownEnlistmentProof(progress, receipts, domain)) {
      throw new Error('Invalid save: town enlistment proof requires its completed objective and main prerequisite');
    }
  }
}
