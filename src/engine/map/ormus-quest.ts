import type { QuestActionReceipts, QuestProgressData } from '../types/save';

/** Persisted Ormus identities; historical validators opt into their own domain. */
export interface OrmusQuestDomain {
  readonly quest: string;
  readonly first: string;
  readonly talk: string;
  readonly proof: string;
}
export const ORMUS = Object.freeze({
  quest: 'quests/side-act3-ormus-charm', first: 'obj-kill-shamans', talk: 'obj-return-ormus',
  proof: 'quests/side-act3-ormus-charm#action:flayer-jungle-victory',
  actId: 'acts/act3', area: 'areas/act3-flayer-jungle', npc: 'npc/ormus'
});
type Progress = Readonly<Record<string, QuestProgressData>>;
function plain(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function ownData(value: object, key: string): unknown {
  const field = Object.getOwnPropertyDescriptor(value, key);
  return field?.enumerable === true && Object.hasOwn(field, 'value') ? field.value as unknown : undefined;
}
function optionalBoolean(value: object, key: string): boolean {
  return !(key in value) || typeof ownData(value, key) === 'boolean';
}
function tracked(progress: Progress, domain: OrmusQuestDomain): QuestProgressData | undefined {
  if (!plain(progress)) return undefined;
  const row = ownData(progress, domain.quest);
  if (!plain(row)) return undefined;
  const status = ownData(row, 'status'), objectives = ownData(row, 'objectives');
  return ownData(row, 'id') === domain.quest && (status === 'inProgress' || status === 'completed') &&
    optionalBoolean(row, 'rewardClaimed') && (ownData(row, 'rewardClaimed') !== true || status === 'completed') &&
    plain(objectives) && optionalBoolean(objectives, domain.first) && optionalBoolean(objectives, domain.talk)
    ? row as unknown as QuestProgressData : undefined;
}
function flag(row: QuestProgressData, key: string): boolean {
  return ownData(row.objectives, key) === true;
}
/** Proofless legacy flags remain inert history; an unclaimed tracked row may earn a fresh clear. */
export function canEarnOrmusClear(progress: Progress, receipts: QuestActionReceipts, domain: OrmusQuestDomain = ORMUS): boolean {
  const row = tracked(progress, domain);
  return row !== undefined && row.rewardClaimed !== true && !Object.hasOwn(receipts, domain.proof);
}
/** Durable clear validity survives Claim and requires reciprocal, ordered objective state. */
export function hasOrmusClear(progress: Progress, receipts: QuestActionReceipts, domain: OrmusQuestDomain = ORMUS): boolean {
  const row = tracked(progress, domain);
  return row !== undefined && ownData(receipts, domain.proof) === true &&
    flag(row, domain.first) && (row.status === 'completed') === flag(row, domain.talk);
}
/** Only the protected current-town interaction may complete the ordered Talk. */
export function canTalkToOrmus(progress: Progress, receipts: QuestActionReceipts, domain: OrmusQuestDomain = ORMUS): boolean {
  const row = tracked(progress, domain);
  return row !== undefined && row.rewardClaimed !== true && !flag(row, domain.talk) &&
    hasOrmusClear(progress, receipts, domain);
}
/** Shared preview/execution boundary for the first exact charm reward. */
export function canClaimOrmusCharm(progress: Progress, receipts: QuestActionReceipts, domain: OrmusQuestDomain = ORMUS): boolean {
  const row = tracked(progress, domain);
  return row !== undefined && row.rewardClaimed !== true && row.status === 'completed' &&
    flag(row, domain.talk) && hasOrmusClear(progress, receipts, domain);
}
/** Validate present proof without interpreting or rewriting proofless legacy history. */
export function validateOrmusQuestGraph(progress: Progress, receipts: QuestActionReceipts, domain: OrmusQuestDomain = ORMUS): void {
  if (Object.hasOwn(receipts, domain.proof) && !hasOrmusClear(progress, receipts, domain)) {
    throw new Error('Invalid save: Ormus victory proof requires its canonical ordered quest graph');
  }
}
