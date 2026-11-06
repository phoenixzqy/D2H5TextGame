import type { QuestServiceLedger } from '../services/quest-services';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';

/** Literal finite authority is carried explicitly by current and historical readers. */
export interface AnyaQuestDomain {
  readonly quest: string;
  readonly objective: string;
  readonly proof: string;
  readonly serviceSource: string;
  readonly tradeProofs: { readonly 'frostburn-gauntlet': string; readonly waterwalk: string };
  readonly prerequisite: {
    readonly quest: string; readonly objectiveIds: readonly string[];
    readonly inspectProof: string; readonly potionSource: string;
    readonly thawProof: string; readonly potionItemId: string;
  };
}
const quest = 'quests/side-act5-anyas-gift', prison = 'quests/act5-prison-of-ice';
export const ANYA_DOMAIN: AnyaQuestDomain = Object.freeze({ quest, objective: 'obj-talk', proof: `${quest}#action:talk-anya`,
  serviceSource: `${quest}#reward:service`, tradeProofs: Object.freeze({
    'frostburn-gauntlet': `${quest}#trade:frostburn-gauntlet`, waterwalk: `${quest}#trade:waterwalk`
  }), prerequisite: Object.freeze({ quest: prison,
    objectiveIds: Object.freeze(['obj-find-anya', 'obj-thaw', 'obj-kill-nihlathak']),
    inspectProof: `${prison}#action:inspect-anya`, potionSource: `${prison}#action:receive-potion`,
    thawProof: `${prison}#action:thaw-anya`, potionItemId: 'quest/malahs_potion' }) });
/** Earned conversation, one protection Claim, and two independent lifetime purchases. */
export const ANYA = Object.freeze({ ...ANYA_DOMAIN, actId: 'acts/act5', npc: 'npc/anya',
  dialogueId: 'dialogue/act5/anya', greetingKey: 'town:dialogue.greetings.act5.anya', vendorId: 'vendors/anya_uniques' });

function record(value: unknown): value is Record<string, unknown> {
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
function exact(value: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length !== expected.length ||
      Reflect.ownKeys(value).length !== expected.length + 1) return false;
    return expected.every((entry, index) => {
      const field = Object.getOwnPropertyDescriptor(value, String(index));
      return field?.enumerable === true && Object.hasOwn(field, 'value') && exact(field.value, entry);
    });
  }
  if (record(expected)) return record(value) && keys(value, Object.keys(expected)) && Object.keys(expected).every(key => exact(own(value, key), own(expected, key)));
  return value === expected;
}
function canonical(domain: unknown): domain is AnyaQuestDomain { return exact(domain, ANYA_DOMAIN); }
function row(value: unknown, id: string, objectives: readonly string[], completed: boolean): value is QuestProgressData {
  if (!record(value) || !keys(value, ['id', 'status', 'objectives'], ['rewardClaimed']) || own(value, 'id') !== id ||
    Object.hasOwn(value, 'rewardClaimed') && typeof own(value, 'rewardClaimed') !== 'boolean') return false;
  const status = own(value, 'status'), flags = own(value, 'objectives');
  return (completed ? status === 'completed' : status === 'inProgress' || status === 'completed') &&
    (own(value, 'rewardClaimed') !== true || status === 'completed') && record(flags) && keys(flags, objectives) &&
    objectives.every(objective => status === 'completed' ? own(flags, objective) === true : typeof own(flags, objective) === 'boolean');
}
function thaw(progress: Record<string, unknown>, items: Record<string, unknown>, receipts: Record<string, unknown>, domain: AnyaQuestDomain): boolean {
  const p = domain.prerequisite;
  return row(own(progress, p.quest), p.quest, p.objectiveIds, true) &&
    [p.inspectProof, p.potionSource, p.thawProof].every(source => own(receipts, source) === true) &&
    exact(own(items, p.potionSource), { itemId: p.potionItemId, state: 'consumed' });
}
function service(value: unknown): boolean {
  return record(value) && own(value, 'serviceId') === 'personalize_item' &&
    (own(value, 'state') === 'available' && keys(value, ['serviceId', 'state']) ||
      own(value, 'state') === 'consumed' && keys(value, ['serviceId', 'state', 'targetItemId']) && typeof own(value, 'targetItemId') === 'string');
}
/**
 * Validate finite Talk/trade receipts without inferring historical authority.
 * Item-only prospective callers omit services; complete boundaries supply it.
 */
export function validateAnyaQuestGraph(progress: unknown, items: unknown, receipts: unknown,
  services: QuestServiceLedger | undefined, domain: AnyaQuestDomain | undefined): void {
  if (!record(progress) || !record(items) || !record(receipts) || services !== undefined && !record(services)) throw new Error('Invalid save: contradictory Anya source graph');
  if (domain !== undefined && !canonical(domain)) throw new Error('Invalid save: contradictory Anya source graph');
  const allowed = [ANYA.proof, ...Object.values(ANYA.tradeProofs)];
  if (Object.keys(receipts).some(source => source.startsWith(`${ANYA.quest}#`) && !allowed.includes(source)) ||
    Object.keys(items).some(source => source.startsWith(`${ANYA.quest}#`))) throw new Error('Invalid save: contradictory Anya source graph');
  const present = allowed.filter(source => Object.hasOwn(receipts, source));
  if (present.length === 0) return;
  if (domain === undefined || present.some(source => own(receipts, source) !== true)) throw new Error('Invalid save: contradictory Anya source graph');
  const side = own(progress, domain.quest);
  if (own(receipts, domain.proof) !== true || !row(side, domain.quest, [domain.objective], true) ||
    !thaw(progress, items, receipts, domain)) throw new Error('Invalid save: contradictory Anya source graph');
  const claimed = side.rewardClaimed === true;
  if (Object.values(domain.tradeProofs).some(source => Object.hasOwn(receipts, source)) && !claimed) throw new Error('Invalid save: contradictory Anya source graph');
  if (services !== undefined) {
    const entry = own(services, domain.serviceSource);
    if (claimed ? !service(entry) : Object.hasOwn(services, domain.serviceSource)) throw new Error('Invalid save: contradictory Anya source graph');
  }
}
/** Canonical completed Prison plus actual reciprocal thaw; historical victory need not be re-earned. */
export function hasAnyaTalkEligibility(progress: unknown, items: unknown, receipts: unknown, domain: AnyaQuestDomain | undefined): boolean {
  try {
    validateAnyaQuestGraph(progress, items, receipts, undefined, domain);
    if (domain === undefined || !record(progress) || !record(items) || !record(receipts)) return false;
    const side = own(progress, domain.quest);
    return row(side, domain.quest, [domain.objective], false) && side.rewardClaimed !== true && thaw(progress, items, receipts, domain);
  } catch { return false; }
}
/** Retained exact Talk proof, independent of later personalization and item disposal. */
export function hasAnyaTalkProof(progress: Readonly<Record<string, QuestProgressData>>, items: QuestItemLedger,
  receipts: QuestActionReceipts, domain: AnyaQuestDomain | undefined): boolean {
  try { validateAnyaQuestGraph(progress, items, receipts, undefined, domain); return domain !== undefined && Object.hasOwn(receipts, domain.proof); }
  catch { return false; }
}
/** Source-derived protection/catalog authority, never a mutable stat or vendor flag. */
export function hasAnyaEntitlement(progress: Readonly<Record<string, QuestProgressData>>, items: QuestItemLedger,
  receipts: QuestActionReceipts, domain: AnyaQuestDomain | undefined): boolean {
  return hasAnyaTalkProof(progress, items, receipts, domain) && domain !== undefined && progress[domain.quest]?.rewardClaimed === true;
}
