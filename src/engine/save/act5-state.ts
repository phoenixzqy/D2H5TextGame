import type { Act5QuestDomain } from './quest-domain';
import { act5Runtime } from '@/data/loaders/act5-runtime';
import { ACT5_ENCOUNTERS, EVE_QUEST, PRISON_QUEST, RESCUE_QUEST, THRONE_PROOF } from '../map/act5-admission';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
export const POTION_SOURCE = `${PRISON_QUEST}#action:receive-potion`;
export const SCROLL_SOURCE = `${PRISON_QUEST}#reward:questItem`;
export const INSPECT_PROOF = `${PRISON_QUEST}#action:inspect-anya`;
export const THAW_PROOF = `${PRISON_QUEST}#action:thaw-anya`;
export const READ_PROOF = `${PRISON_QUEST}#action:read-resistance-scroll`;
export const ACT5_RECEIPTS = Object.freeze([...act5Runtime.actions.map(action => action.receiptSource),
  ...ACT5_ENCOUNTERS.map(row => row.proof), THRONE_PROOF]);
export const CAGE_PROOFS = Object.freeze(act5Runtime.actions.filter(action => action.kind === 'cage').map(action => action.receiptSource));
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
/** Current gameplay defaults; historical readers supply their literal domain. */
export const LIVE_ACT5_DOMAIN: Act5QuestDomain = Object.freeze({
  actions: act5Runtime.actions, encounters: ACT5_ENCOUNTERS,
  objectiveIds: Object.freeze(Object.fromEntries<readonly string[]>([
    ...ACT5_ENCOUNTERS.map(row => [row.questId, row.questId === PRISON_QUEST
      ? ['obj-find-anya', 'obj-thaw', 'obj-kill-nihlathak'] : row.questId === EVE_QUEST
        ? ['obj-throne-waves', 'obj-kill-baal'] : [row.objectiveId]] as const),
    [RESCUE_QUEST, ['obj-free-15']]
  ])),
  receipts: ACT5_RECEIPTS, cageProofs: CAGE_PROOFS,
  prisonQuest: PRISON_QUEST, rescueQuest: RESCUE_QUEST, eveQuest: EVE_QUEST,
  potionSource: POTION_SOURCE, scrollSource: SCROLL_SOURCE, inspectProof: INSPECT_PROOF,
  thawProof: THAW_PROOF, readProof: READ_PROOF, throneProof: THRONE_PROOF,
  potionItemId: 'quest/malahs_potion', scrollItemId: 'items/scroll_of_resist',
  inspectObjective: 'obj-find-anya', thawObjective: 'obj-thaw',
  rescueObjective: 'obj-free-15', throneObjective: 'obj-throne-waves'
});
/** Canonical tracked row; completed history remains history without manufacturing source proofs. */
export function isCanonicalAct5Progress(progress: Readonly<Record<string, QuestProgressData>>, questId: string,
  domain: Act5QuestDomain = LIVE_ACT5_DOMAIN): boolean {
  const row = Object.hasOwn(progress, questId) ? progress[questId] : undefined;
  return record(progress) && record(row) && Object.hasOwn(row, 'id') && row.id === questId &&
    Object.hasOwn(row, 'status') && Object.hasOwn(row, 'objectives') && record(row.objectives) &&
    (row.status === 'inProgress' || row.status === 'completed') &&
    (row.rewardClaimed !== true || row.status === 'completed') && (domain.objectiveIds[questId] ?? ['']).every(id =>
      Object.hasOwn(row.objectives, id) && typeof row.objectives[id] === 'boolean') &&
    (row.status !== 'completed' || (domain.objectiveIds[questId] ?? ['']).every(id => row.objectives[id] === true));
}
/** Complete actual main graph required before initial Claim; legacy flags grant nothing. */
export function hasAct5Completion(questId: string, progress: Readonly<Record<string, QuestProgressData>>,
  receipts: QuestActionReceipts, items: QuestItemLedger, domain: Act5QuestDomain = LIVE_ACT5_DOMAIN): boolean {
  if (questId !== domain.rescueQuest && !domain.encounters.some(row => row.questId === questId)) return true;
  if (!isCanonicalAct5Progress(progress, questId, domain)) return false;
  const has = (source: string) => Object.hasOwn(receipts, source) && receipts[source] === true;
  if (progress[questId]?.status !== 'completed') return false;
  if (questId === domain.rescueQuest) return domain.cageProofs.every(has);
  const contract = domain.encounters.find(row => row.questId === questId);
  if (!contract || !has(contract.proof)) return false;
  if (questId === domain.prisonQuest) return [domain.inspectProof, domain.potionSource, domain.thawProof].every(has) &&
    Object.hasOwn(items, domain.potionSource) && items[domain.potionSource]?.itemId === domain.potionItemId && items[domain.potionSource]?.state === 'consumed';
  return questId !== domain.eveQuest || has(domain.throneProof);
}
/** Validate reciprocal Act V action/item/victory graph without inferring any missing source. */
export function validateAct5QuestGraph(items: QuestItemLedger, progress: Readonly<Record<string, QuestProgressData>>,
  receipts: QuestActionReceipts, domain: Act5QuestDomain = LIVE_ACT5_DOMAIN): void {
  const has = (source: string) => Object.hasOwn(receipts, source);
  const flag = (questId: string, objectiveId: string) => isCanonicalAct5Progress(progress, questId, domain) &&
    progress[questId]?.objectives[objectiveId] === true;
  const fail = () => { throw new Error('Invalid save: contradictory Act V source graph'); };
  if (!record(receipts) || domain.receipts.some(source => has(source) && receipts[source] !== true)) fail();
  for (const action of domain.actions) {
    if (!has(action.receiptSource)) continue;
    if (!isCanonicalAct5Progress(progress, action.questId, domain)) fail();
    if (action.kind === 'inspect' && !flag(domain.prisonQuest, domain.inspectObjective)) fail();
    if (action.kind === 'potion' && (!has(domain.inspectProof) || !Object.hasOwn(items, domain.potionSource))) fail();
    if (action.kind === 'thaw' && (!has(domain.inspectProof) || !has(domain.potionSource) ||
      items[domain.potionSource]?.state !== 'consumed' || !flag(domain.prisonQuest, domain.thawObjective))) fail();
    if (action.kind === 'read' && (!hasAct5Completion(domain.prisonQuest, progress, receipts, items, domain) ||
      progress[domain.prisonQuest]?.rewardClaimed !== true || items[domain.scrollSource]?.state !== 'consumed')) fail();
  }
  if (domain.cageProofs.every(has) && !flag(domain.rescueQuest, domain.rescueObjective)) fail();
  for (const encounter of domain.encounters) {
    if (!has(encounter.proof)) continue;
    if (!flag(encounter.questId, encounter.objectiveId) ||
      (encounter.questId === domain.prisonQuest && !has(domain.thawProof)) ||
      (encounter.questId === domain.eveQuest && !has(domain.throneProof))) fail();
  }
  if (has(domain.throneProof) && !flag(domain.eveQuest, domain.throneObjective)) fail();
  if (Object.hasOwn(items, domain.potionSource)) {
    const potion = items[domain.potionSource];
    if (potion?.itemId !== domain.potionItemId || !has(domain.potionSource) ||
      ((potion.state === 'consumed') !== has(domain.thawProof))) fail();
  }
  if (Object.hasOwn(items, domain.scrollSource)) {
    const scroll = items[domain.scrollSource];
    if (scroll?.itemId !== domain.scrollItemId || progress[domain.prisonQuest]?.rewardClaimed !== true ||
      !hasAct5Completion(domain.prisonQuest, progress, receipts, items, domain) || ((scroll.state === 'consumed') !== has(domain.readProof))) fail();
  }
  if (has(domain.readProof) && !Object.hasOwn(items, domain.scrollSource)) fail();
}
