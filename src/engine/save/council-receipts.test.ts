import { describe, expect, it } from 'vitest';
import { COUNCIL_QUEST_ID, COUNCIL_RECEIPT_SOURCE } from '../map/council-admission';
import type { QuestProgressData } from '../types/save';
import { validateQuestActionReceipts } from './validate';

const row: QuestProgressData = { id: COUNCIL_QUEST_ID, status: 'inProgress', rewardClaimed: false,
  objectives: { 'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': false, 'obj-transmute': false } };
const proof = { [COUNCIL_RECEIPT_SOURCE]: true };

describe('finite live Council receipt boundary', () => {
  it('retains the exact proof independently of unrelated clear/component flags, without minting from history', () => {
    expect(validateQuestActionReceipts(proof, { [COUNCIL_QUEST_ID]: row })).toBe(proof);
    const completed: QuestProgressData = { ...row, status: 'completed', rewardClaimed: true,
      objectives: Object.fromEntries(Object.keys(row.objectives).map(id => [id, true])) };
    expect(validateQuestActionReceipts(proof, { [COUNCIL_QUEST_ID]: completed })).toBe(proof);
    expect(validateQuestActionReceipts({}, { [COUNCIL_QUEST_ID]: completed })).toEqual({});
  });

  it.each([null, [], new Map(), false, 'true',
    { [COUNCIL_RECEIPT_SOURCE]: false }, { [COUNCIL_RECEIPT_SOURCE]: 1 },
    { [COUNCIL_RECEIPT_SOURCE]: 'true' }, { [COUNCIL_RECEIPT_SOURCE]: {} },
    { 'quests/act3-khalims-will#action:future': true },
    { ...proof, unrelated: true }, Object.create(proof) as object,
    Object.assign({}, proof, { [Symbol('proof')]: true })
  ])('rejects noncanonical/future/malformed receipts %j before normalization', receipts => {
    expect(() => validateQuestActionReceipts(receipts, { [COUNCIL_QUEST_ID]: row })).toThrow(/receipt/);
  });

  it.each([{}, { [COUNCIL_QUEST_ID]: { ...row, id: 'quests/wrong' } },
    { [COUNCIL_QUEST_ID]: { ...row, status: 'available' } },
    { [COUNCIL_QUEST_ID]: { ...row, status: 'inProgress', rewardClaimed: true } },
    { [COUNCIL_QUEST_ID]: { ...row, objectives: { 'obj-flail': false } } },
    { [COUNCIL_QUEST_ID]: { ...row, status: 'completed', rewardClaimed: true } },
    Object.create({ [COUNCIL_QUEST_ID]: row }) as object
  ])('requires canonical retained tracked progress %j', progress => {
    expect(() => validateQuestActionReceipts(proof, progress)).toThrow();
  });
});
