import { describe, expect, it } from 'vitest';
import type { QuestActionReceipts, QuestProgressData } from '../types/save';
import { ORMUS, canEarnOrmusClear, canTalkToOrmus, canClaimOrmusCharm,
  hasOrmusClear, validateOrmusQuestGraph } from './ormus-quest';

const id = 'quests/side-act3-ormus-charm';
const first = 'obj-kill-shamans', talk = 'obj-return-ormus';
const proof = `${id}#action:flayer-jungle-victory`;
const receipts: QuestActionReceipts = { [proof]: true };
function progress(overrides: Partial<QuestProgressData> = {}) {
  return { [id]: { id, status: 'inProgress' as const, objectives: {}, ...overrides } };
}
const cleared = () => progress({ objectives: { [first]: true, [talk]: false } });
const completed = () => progress({ status: 'completed', objectives: { [first]: true, [talk]: true } });

describe('finite Ormus clear and Talk authority', () => {
  it('uses the preserved quest/objective and exact finite proof identities', () => {
    expect(ORMUS).toMatchObject({ quest: id, first, talk, proof });
  });
  it.each(['inProgress', 'completed'] as const)('allows fresh proof for unclaimed %s legacy rows without rewriting history', status => {
    const rows = progress({ status, objectives: { [first]: true, [talk]: true, legacy: true } });
    const before = structuredClone(rows);
    expect(canEarnOrmusClear(rows, {})).toBe(true);
    expect(canTalkToOrmus(rows, {})).toBe(false);
    expect(canClaimOrmusCharm(rows, {})).toBe(false);
    expect(() => { validateOrmusQuestGraph(rows, {}); }).not.toThrow();
    expect(rows).toEqual(before);
  });
  it('refuses missing, mismatched, untracked, claimed or inherited rows', () => {
    for (const rows of [{}, progress({ id: 'other' }), progress({ status: 'available' }),
      progress({ status: 'locked' }), progress({ rewardClaimed: true }),
      progress({ status: 'completed', rewardClaimed: true }), Object.create(progress()) as ReturnType<typeof progress>]) {
      expect(canEarnOrmusClear(rows, {})).toBe(false);
      expect(canTalkToOrmus(rows, receipts)).toBe(false);
      expect(canClaimOrmusCharm(rows, receipts)).toBe(false);
    }
  });
  it('requires absence of an own proof key, including invalid proof values', () => {
    expect(canEarnOrmusClear(progress(), receipts)).toBe(false);
    expect(canEarnOrmusClear(progress(), { [proof]: false } as unknown as QuestActionReceipts)).toBe(false);
    expect(canEarnOrmusClear(progress(), Object.create(receipts) as QuestActionReceipts)).toBe(true);
    expect(hasOrmusClear(cleared(), Object.create(receipts) as QuestActionReceipts)).toBe(false);
  });
  it('accepts a real clear, then requires actual ordered Talk before Claim', () => {
    expect(hasOrmusClear(cleared(), receipts)).toBe(true);
    expect(canTalkToOrmus(cleared(), receipts)).toBe(true);
    expect(canClaimOrmusCharm(cleared(), receipts)).toBe(false);
    expect(canTalkToOrmus(completed(), receipts)).toBe(false);
    expect(canClaimOrmusCharm(completed(), receipts)).toBe(true);
    expect(() => { validateOrmusQuestGraph(cleared(), receipts); }).not.toThrow();
    expect(() => { validateOrmusQuestGraph(completed(), receipts); }).not.toThrow();
  });
  it('retains durable validity after Claim without permitting any further action', () => {
    const rows = progress({ ...completed()[id], rewardClaimed: true });
    expect(hasOrmusClear(rows, receipts)).toBe(true);
    expect(canEarnOrmusClear(rows, receipts)).toBe(false);
    expect(canTalkToOrmus(rows, receipts)).toBe(false);
    expect(canClaimOrmusCharm(rows, receipts)).toBe(false);
    expect(() => { validateOrmusQuestGraph(rows, receipts); }).not.toThrow();
  });
  it.each([
    {}, progress(), progress({ id: 'other' }), progress({ status: 'available' }),
    progress({ objectives: { [first]: true, [talk]: true } }),
    progress({ status: 'completed', objectives: { [first]: true } }),
    progress({ status: 'completed', objectives: { [talk]: true } }),
    progress({ objectives: Object.create({ [first]: true }) as Record<string, boolean> }),
    progress({ status: 'completed', objectives: Object.assign(Object.create({ [talk]: true }) as Record<string, boolean>, { [first]: true }) })
  ])('rejects orphan/contradictory proof graph %#', rows => {
    expect(hasOrmusClear(rows, receipts)).toBe(false);
    expect(() => { validateOrmusQuestGraph(rows, receipts); }).toThrow(/Ormus/);
  });
});
