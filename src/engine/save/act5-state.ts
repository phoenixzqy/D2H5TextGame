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
const objectiveIds = (questId: string): readonly string[] => questId === PRISON_QUEST
  ? ['obj-find-anya', 'obj-thaw', 'obj-kill-nihlathak'] : questId === RESCUE_QUEST ? ['obj-free-15']
    : questId === EVE_QUEST ? ['obj-throne-waves', 'obj-kill-baal']
      : [ACT5_ENCOUNTERS.find(row => row.questId === questId)?.objectiveId ?? ''];
/** Canonical tracked row; completed history remains history without manufacturing source proofs. */
export function isCanonicalAct5Progress(progress: Readonly<Record<string, QuestProgressData>>, questId: string): boolean {
  const row = Object.hasOwn(progress, questId) ? progress[questId] : undefined;
  return record(progress) && record(row) && Object.hasOwn(row, 'id') && row.id === questId &&
    Object.hasOwn(row, 'status') && Object.hasOwn(row, 'objectives') && record(row.objectives) &&
    (row.status === 'inProgress' || row.status === 'completed') &&
    (row.rewardClaimed !== true || row.status === 'completed') && objectiveIds(questId).every(id =>
      Object.hasOwn(row.objectives, id) && typeof row.objectives[id] === 'boolean') &&
    (row.status !== 'completed' || objectiveIds(questId).every(id => row.objectives[id] === true));
}
/** Complete actual main graph required before initial Claim; legacy flags grant nothing. */
export function hasAct5Completion(questId: string, progress: Readonly<Record<string, QuestProgressData>>,
  receipts: QuestActionReceipts, items: QuestItemLedger): boolean {
  if (questId !== RESCUE_QUEST && !ACT5_ENCOUNTERS.some(row => row.questId === questId)) return true;
  if (!isCanonicalAct5Progress(progress, questId)) return false;
  const has = (source: string) => Object.hasOwn(receipts, source) && receipts[source] === true;
  if (progress[questId]?.status !== 'completed') return false;
  if (questId === RESCUE_QUEST) return CAGE_PROOFS.every(has);
  const contract = ACT5_ENCOUNTERS.find(row => row.questId === questId);
  if (!contract || !has(contract.proof)) return false;
  if (questId === PRISON_QUEST) return [INSPECT_PROOF, POTION_SOURCE, THAW_PROOF].every(has) &&
    Object.hasOwn(items, POTION_SOURCE) && items[POTION_SOURCE]?.itemId === 'quest/malahs_potion' && items[POTION_SOURCE].state === 'consumed';
  return questId !== EVE_QUEST || has(THRONE_PROOF);
}
/** Validate reciprocal Act V action/item/victory graph without inferring any missing source. */
export function validateAct5QuestGraph(items: QuestItemLedger, progress: Readonly<Record<string, QuestProgressData>>,
  receipts: QuestActionReceipts): void {
  const has = (source: string) => Object.hasOwn(receipts, source);
  const flag = (questId: string, objectiveId: string) => isCanonicalAct5Progress(progress, questId) &&
    progress[questId]?.objectives[objectiveId] === true;
  const fail = () => { throw new Error('Invalid save: contradictory Act V source graph'); };
  if (!record(receipts) || ACT5_RECEIPTS.some(source => has(source) && receipts[source] !== true)) fail();
  for (const action of act5Runtime.actions) {
    if (!has(action.receiptSource)) continue;
    if (!isCanonicalAct5Progress(progress, action.questId)) fail();
    if (action.kind === 'inspect' && !flag(PRISON_QUEST, 'obj-find-anya')) fail();
    if (action.kind === 'potion' && (!has(INSPECT_PROOF) || !Object.hasOwn(items, POTION_SOURCE))) fail();
    if (action.kind === 'thaw' && (!has(INSPECT_PROOF) || !has(POTION_SOURCE) ||
      items[POTION_SOURCE]?.state !== 'consumed' || !flag(PRISON_QUEST, 'obj-thaw'))) fail();
    if (action.kind === 'read' && (!hasAct5Completion(PRISON_QUEST, progress, receipts, items) ||
      progress[PRISON_QUEST]?.rewardClaimed !== true || items[SCROLL_SOURCE]?.state !== 'consumed')) fail();
  }
  if (CAGE_PROOFS.every(has) && !flag(RESCUE_QUEST, 'obj-free-15')) fail();
  for (const encounter of ACT5_ENCOUNTERS) {
    if (!has(encounter.proof)) continue;
    if (!flag(encounter.questId, encounter.objectiveId) ||
      (encounter.questId === PRISON_QUEST && !has(THAW_PROOF)) ||
      (encounter.questId === EVE_QUEST && !has(THRONE_PROOF))) fail();
  }
  if (has(THRONE_PROOF) && !flag(EVE_QUEST, 'obj-throne-waves')) fail();
  if (Object.hasOwn(items, POTION_SOURCE)) {
    const potion = items[POTION_SOURCE];
    if (potion?.itemId !== 'quest/malahs_potion' || !has(POTION_SOURCE) ||
      ((potion.state === 'consumed') !== has(THAW_PROOF))) fail();
  }
  if (Object.hasOwn(items, SCROLL_SOURCE)) {
    const scroll = items[SCROLL_SOURCE];
    if (scroll?.itemId !== 'items/scroll_of_resist' || progress[PRISON_QUEST]?.rewardClaimed !== true ||
      !hasAct5Completion(PRISON_QUEST, progress, receipts, items) || ((scroll.state === 'consumed') !== has(READ_PROOF))) fail();
  }
  if (has(READ_PROOF) && !Object.hasOwn(items, SCROLL_SOURCE)) fail();
}
