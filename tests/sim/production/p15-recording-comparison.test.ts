import { expect, it } from 'vitest';
import type { P15Attempt } from './p15-build-screen';
import { compareP15Attempts } from './p15-build-screen';
import type { EarnedAttempt } from './earned-adapter';
import { compareEarnedAttempts } from './earned-comparison';

it('includes skill projections in raw recording equality even when events and outcomes match', () => {
  // Only comparison fields are constructed; this represents no native run or earned provenance.
  const first = { build: 'fire', seed: 19, preparation: {}, waves: [{
    initialPlayerTeam: [], initialEnemyTeam: [], events: [], outcome: {}, metrics: {}, advanceResult: 'victory',
    engineInput: { seed: 19, playerTeam: [], enemyTeam: [], findPotion: [{ sourceHeroId: 'hero', rank: 20 }] },
    rawRewardDelta: { items: [] }, actualDelta: { addedItems: [] }
  }] } as unknown as P15Attempt;
  const second = structuredClone(first);
  const wave = second.waves[0];
  if (!wave) throw new Error('Missing constructed comparison wave');
  expect(compareP15Attempts(first, second).rawRecordingsEqual).toBe(true);
  Reflect.deleteProperty(wave, 'engineInput');
  expect(compareP15Attempts(first, second)).toMatchObject({ rawRecordingsEqual: false,
    rawRewardsEqual: true, semanticRewardsIgnoringOnlyTopLevelItemIdEqual: true });
  const original = first.waves[0];
  if (!original) throw new Error('Missing original comparison wave');
  Reflect.deleteProperty(original, 'engineInput');
  expect(compareP15Attempts(first, second).rawRecordingsEqual).toBe(true);
});

it('includes the full input in earned raw wave comparisons', () => {
  // Comparator-only constructed fields; no recipe, realm or saved fixture is executed.
  const wave = { index: 0, engineInput: { seed: 19, playerTeam: [], enemyTeam: [],
    findPotion: [{ sourceHeroId: 'hero', rank: 20 }] },
    opening: { playerTeam: [], enemyTeam: [] }, played: { playerTeam: [], enemyTeam: [] },
    rawRewardDelta: { items: [], materials: {}, runeShards: 0, runes: 0, gems: 0, wishstones: 0 },
    actualDelta: { xp: 0, mercXp: {}, currencies: {}, materials: {}, addedItems: [], removedItemIds: [], addedClears: [] }
  };
  const first = { sourceBefore: {}, sourceAfter: {}, actions: [], acquisitionJournal: [], timings: {},
    target: { handle: {}, waves: [wave], rawRunRewards: wave.rawRewardDelta }
  } as unknown as EarnedAttempt;
  const second = structuredClone(first), other = second.target?.waves[0];
  if (!other) throw new Error('Missing constructed earned wave');
  expect(compareEarnedAttempts(first, second).rawWaveRecordingsEqual).toBe(true);
  Reflect.set(other.engineInput, 'findPotion', [{ sourceHeroId: 'hero', rank: 1 }]);
  expect(compareEarnedAttempts(first, second)).toMatchObject({ rawWaveRecordingsEqual: false,
    rawRewardsEqual: true, semanticRewardsIgnoringOnlyTopLevelItemIdEqual: true });
  Reflect.deleteProperty(other, 'engineInput');
  expect(compareEarnedAttempts(first, second).rawWaveRecordingsEqual).toBe(false);
  Reflect.deleteProperty(wave, 'engineInput');
  expect(compareEarnedAttempts(first, second).rawWaveRecordingsEqual).toBe(true);
});
