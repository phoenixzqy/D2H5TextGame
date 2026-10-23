import { describe, expect, it } from 'vitest';
import { isQuestUniqueProfileRewardInput } from './quest-unique';

describe('closed unique-profile reward reference boundary', () => {
  const reference = { profileId: 'quest-rewards/act3-gidbinn-ring-v1' };
  it('accepts only the one versioned reference', () => {
    expect(isQuestUniqueProfileRewardInput(reference)).toBe(true);
  });

  it.each([
    null, undefined, reference.profileId, {}, { profileId: 'quest-rewards/unknown' },
    { ...reference, ilvl: 34 }, { ...reference, entries: [] },
    { ...reference, uniqueId: 'items/unique/nagelring' }, Object.create(reference) as unknown
  ])('rejects unknown, inherited and override-bearing inputs: %j', input => {
    expect(isQuestUniqueProfileRewardInput(input)).toBe(false);
  });
});
