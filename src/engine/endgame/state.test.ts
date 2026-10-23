import { describe, expect, it } from 'vitest';
import { emptyEndgameState, readEndgameState, projectEndgameAchievement } from './state';
import { EVE_QUEST } from '../map/act5-admission';
import { hasAct5CampaignReward } from '../save/act5-campaign';
import { campaignEvidence } from '../../../tests/helpers/endgame';
const locked = { questProgress: {}, questReceipts: {}, questItems: {} };

describe('D14 durable-state proposal boundary', () => {
  it('accepts explicit empty state while locked and never infers campaign ownership', () => {
    expect(readEndgameState(emptyEndgameState(), locked)).toEqual({ attemptOrdinal: 0,
      clearCounts: { ashen: 0, glacial: 0 }, achievementRewardClaimed: false });
    const campaign = campaignEvidence();
    expect(hasAct5CampaignReward(campaign.questProgress, campaign.questReceipts, campaign.questItems)).toBe(true);
    const value = { attemptOrdinal: 5, clearCounts: { ashen: 2, glacial: 1 }, achievementRewardClaimed: true };
    const before = structuredClone(value);
    const parsed = readEndgameState(value, campaignEvidence());
    expect(parsed).toEqual(value);
    expect(value).toEqual(before);
    expect(Object.isFrozen(parsed.clearCounts)).toBe(true);
    value.clearCounts.ashen = 4;
    expect(parsed.clearCounts.ashen).toBe(2);
  });
  it.each([
    undefined, null, [], {},
    { ...emptyEndgameState(), extra: true },
    { ...emptyEndgameState(), attemptOrdinal: undefined },
    { ...emptyEndgameState(), attemptOrdinal: -1 },
    { ...emptyEndgameState(), attemptOrdinal: 0.5 },
    { ...emptyEndgameState(), attemptOrdinal: Number.MAX_SAFE_INTEGER + 1 },
    { ...emptyEndgameState(), attemptOrdinal: NaN },
    { ...emptyEndgameState(), clearCounts: { ashen: 0 } },
    { ...emptyEndgameState(), clearCounts: { ashen: 0, glacial: 0, other: 0 } },
    { ...emptyEndgameState(), clearCounts: { ashen: 1, glacial: 0 } },
    { ...emptyEndgameState(), attemptOrdinal: 1, clearCounts: { ashen: 1, glacial: 1 } },
    { ...emptyEndgameState(), attemptOrdinal: Number.MAX_SAFE_INTEGER,
      clearCounts: { ashen: Number.MAX_SAFE_INTEGER, glacial: 1 } },
    { ...emptyEndgameState(), achievementRewardClaimed: 'true' },
    { ...emptyEndgameState(), achievementRewardClaimed: true },
    { attemptOrdinal: 1, clearCounts: { ashen: 1, glacial: 0 }, achievementRewardClaimed: true }
  ])('rejects malformed or contradictory durable state %#', value => {
    expect(() => readEndgameState(value, campaignEvidence())).toThrow('endgame');
  });
  it('rejects inherited, hidden, symbol and getter state without evaluating getters', () => {
    let reads = 0;
    const getter = Object.defineProperty({ ...emptyEndgameState() }, 'attemptOrdinal',
      { enumerable: true, get: () => { reads++; return 0; } });
    const inherited = Object.assign(Object.create({ attemptOrdinal: 0 }) as object,
      { clearCounts: { ashen: 0, glacial: 0 }, achievementRewardClaimed: false });
    const hidden = Object.defineProperty({ ...emptyEndgameState() }, 'attemptOrdinal', { enumerable: false, value: 0 });
    for (const value of [getter, inherited, hidden, { ...emptyEndgameState(), [Symbol('extra')]: true },
      { ...emptyEndgameState(), clearCounts: Object.create({ ashen: 0, glacial: 0 }) as object }]) {
      expect(() => readEndgameState(value, campaignEvidence())).toThrow();
    }
    expect(reads).toBe(0);
  });
  it('requires actual campaign authority for any history, including a failed entry with no clear', () => {
    const attempted = { ...emptyEndgameState(), attemptOrdinal: 1 };
    expect(() => readEndgameState(attempted, locked)).toThrow();
    const evidence = campaignEvidence();
    expect(() => readEndgameState(attempted, { ...evidence, questReceipts: {} })).toThrow();
    expect(() => readEndgameState(attempted, { ...evidence,
      questProgress: { [EVE_QUEST]: { ...evidence.questProgress[EVE_QUEST], rewardClaimed: false } } })).toThrow();
    for (const source of Object.keys(evidence.questReceipts)) {
      const missing = { ...evidence.questReceipts }; Reflect.deleteProperty(missing, source);
      expect(() => readEndgameState(attempted, { ...evidence, questReceipts: missing })).toThrow();
    }
  });
  it('derives eligibility from both modifiers and title ownership from the explicit claimed reward', () => {
    const earned = { attemptOrdinal: 3, clearCounts: { ashen: 2, glacial: 1 }, achievementRewardClaimed: false };
    expect(projectEndgameAchievement({ ...earned, clearCounts: { ashen: 3, glacial: 0 } }, campaignEvidence()))
      .toEqual({ available: false, claimed: false, titleId: null });
    expect(projectEndgameAchievement(earned, campaignEvidence())).toEqual({ available: true, claimed: false, titleId: null });
    expect(projectEndgameAchievement({ ...earned, achievementRewardClaimed: true }, campaignEvidence()))
      .toEqual({ available: false, claimed: true, titleId: 'titles/worldstone-adapt' });
  });
});
