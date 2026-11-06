import type { QuestActionReceipts, QuestProgressData } from '../types/save';

/** Durable authority is supplied explicitly by each current or historical reader. */
export interface FaraQuestDomain {
  readonly quest: string;
  readonly objective: string;
  readonly proof: string;
  readonly prerequisite: { readonly quest: string; readonly objectiveIds: readonly string[] };
}
export const FARA_DOMAIN: FaraQuestDomain = Object.freeze({ quest: 'quests/side-act2-fara-favored', objective: 'obj-talk',
  proof: 'quests/side-act2-fara-favored#action:talk-fara', prerequisite: Object.freeze({ quest: 'quests/act2-radaments-lair',
    objectiveIds: Object.freeze(['obj-kill-radament']) }) });
/** One actual conversation, then a separate currency-only Claim. */
export const FARA = Object.freeze({ ...FARA_DOMAIN, actId: 'acts/act2', npc: 'npc/fara',
  dialogueId: 'dialogue/act2/fara', greetingKey: 'town:dialogue.greetings.act2.fara' });

function jsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) && Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
  });
}
function own(value: Record<string, unknown>, key: string): unknown { return Object.getOwnPropertyDescriptor(value, key)?.value as unknown; }
function keys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
function canonicalDomain(domain: unknown): domain is FaraQuestDomain {
  if (!jsonRecord(domain) || !keys(domain, ['quest', 'objective', 'proof', 'prerequisite']) ||
    own(domain, 'quest') !== FARA.quest || own(domain, 'objective') !== FARA.objective || own(domain, 'proof') !== FARA.proof) return false;
  const prerequisite = own(domain, 'prerequisite');
  if (!jsonRecord(prerequisite) || !keys(prerequisite, ['quest', 'objectiveIds']) || own(prerequisite, 'quest') !== FARA.prerequisite.quest) return false;
  const objectives = own(prerequisite, 'objectiveIds');
  if (!Array.isArray(objectives) || Object.getPrototypeOf(objectives) !== Array.prototype || objectives.length !== 1 ||
    Reflect.ownKeys(objectives).some(key => key !== 'length' && key !== '0')) return false;
  const objective = Object.getOwnPropertyDescriptor(objectives, '0');
  return objective?.enumerable === true && Object.hasOwn(objective, 'value') && objective.value === FARA.prerequisite.objectiveIds[0];
}
function row(value: unknown, quest: string, objectiveIds: readonly string[], completed: boolean): value is QuestProgressData {
  if (!jsonRecord(value) || !keys(value, ['id', 'status', 'objectives'], ['rewardClaimed']) || own(value, 'id') !== quest ||
    Object.hasOwn(value, 'rewardClaimed') && typeof own(value, 'rewardClaimed') !== 'boolean') return false;
  const status = own(value, 'status'), objectives = own(value, 'objectives');
  return (completed ? status === 'completed' : status === 'inProgress' || status === 'completed') &&
    jsonRecord(objectives) && keys(objectives, objectiveIds) && objectiveIds.every(id => completed || status === 'completed'
      ? own(objectives, id) === true : typeof own(objectives, id) === 'boolean');
}
/** Canonical completed main flags suffice; reward Claim, Read and new kill receipts are irrelevant. */
export function hasFaraPrerequisite(progress: unknown, domain: FaraQuestDomain): boolean {
  return canonicalDomain(domain) && jsonRecord(progress) && row(own(progress, domain.prerequisite.quest),
    domain.prerequisite.quest, domain.prerequisite.objectiveIds, true);
}
/** Exact tracked unclaimed side row, including completed proofless historical rows. */
export function hasFaraTalkEligibility(progress: unknown, domain: FaraQuestDomain): boolean {
  if (!canonicalDomain(domain) || !jsonRecord(progress)) return false;
  const value = own(progress, domain.quest);
  return row(value, domain.quest, [domain.objective], false) && value.rewardClaimed !== true && hasFaraPrerequisite(progress, domain);
}
/** Explicit absence disables future Talk proof; it never consults live loaders. */
export function validateFaraQuestGraph(progress: unknown, receipts: unknown, domain: FaraQuestDomain | undefined): void {
  if (!jsonRecord(progress) || !jsonRecord(receipts)) throw new Error('Invalid save: Fara maps require own JSON records');
  if (domain !== undefined && !canonicalDomain(domain)) throw new Error('Invalid save: changed Fara domain');
  if (Object.keys(receipts).some(source => source.startsWith(`${FARA.quest}#`) && source !== FARA.proof)) {
    throw new Error('Invalid save: unknown Fara source');
  }
  if (!Object.hasOwn(receipts, FARA.proof)) return;
  if (domain === undefined || own(receipts, FARA.proof) !== true || !row(own(progress, domain.quest), domain.quest, [domain.objective], true) ||
    !hasFaraPrerequisite(progress, domain)) throw new Error('Invalid save: Fara Talk proof requires its completed side and main prerequisite');
}
/** Retained actual Talk proof survives Claim and later shard spending. */
export function hasFaraTalkProof(progress: Readonly<Record<string, QuestProgressData>>, receipts: QuestActionReceipts,
  domain: FaraQuestDomain | undefined): boolean {
  try { validateFaraQuestGraph(progress, receipts, domain); return domain !== undefined && Object.hasOwn(receipts, domain.proof); }
  catch { return false; }
}
