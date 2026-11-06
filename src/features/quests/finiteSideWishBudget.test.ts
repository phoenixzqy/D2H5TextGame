/** Authored finite budgets, not earned campaign/economy acceptance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { claimQuestReward } from './claimReward';
const ids = ['quests/side-act1-rogue-merc-unlock','quests/side-act2-greiz-merc-roster',
  'quests/side-act3-asheara-merc','quests/side-act4-tyraels-blessing',
  'quests/side-act4-halbus-soul','quests/side-act5-qual-kehk-merc',
  'quests/side-act1-gheeds-gamble','quests/side-act2-fara-favored',
  'quests/side-act3-alkors-experiment','quests/side-act3-jade-statuette',
  'quests/side-act4-jamella-trade','quests/side-act5-malahs-elixir',
  'quests/side-act1-pandemonium-cow-rumor','quests/side-act2-lost-caravan',
  'quests/side-act2-drognan-tome','quests/side-act2-summoners-secret',
  'quests/side-act3-ormus-charm','quests/side-act5-larzuks-sockets',
  'quests/side-act5-anyas-gift','quests/side-act5-nihlathaks-treasure'];
beforeEach(() => {
  __resetPersistenceForTests();
  for (const store of [usePlayerStore,useInventoryStore,useMapStore,useMercStore,useCombatStore]) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Finite side', 'sorceress'));
});
afterEach(() => { vi.restoreAllMocks(); __resetPersistenceForTests(); });
describe('finite side and repeatable bounty wish budgets', () => {
  it.each(ids)('%s authors10 additional wishes', id => {
    expect(loadQuests().find(row => row.id === id)?.rewards?.wishstones).toBe(10);
  });
  it('keeps every repeatable bounty at one gem-shard with zero direct wishes', () => {
    const rows = loadQuests().filter(row => row.type === 'bounty'); expect(rows).toHaveLength(5);
    for (const row of rows) expect(row.rewards).toEqual({ gemShards: 1 });
  });
  it('grants Tyrael wishes alongside its unchanged two skill points once', () => {
    const id = 'quests/side-act4-tyraels-blessing';
    useMapStore.setState({ questProgress: { [id]: { id, status: 'completed', rewardClaimed: false, objectives: { 'obj-talk': true } } } });
    const before = usePlayerStore.getState().player?.skillPoints ?? 0;
    expect(claimQuestReward(id)).toBe('ok');
    expect(usePlayerStore.getState().player?.skillPoints).toBe(before + 2);
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
    expect(claimQuestReward(id)).toBe('already-claimed');
    expect(usePlayerStore.getState().player?.skillPoints).toBe(before + 2);
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });
  it('restores Tyrael skill points, wishes and claim after silent claimed publication', () => {
    const id = 'quests/side-act4-tyraels-blessing';
    useMapStore.setState({ questProgress: { [id]: { id, status: 'completed', rewardClaimed: false, objectives: { 'obj-talk': true } } } });
    const data = () => JSON.stringify([usePlayerStore,useInventoryStore,useMapStore,useMercStore].map(store => store.getState()));
    const before = data();
    const mock = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(() => undefined);
    expect(claimQuestReward(id)).toBe('grant-failed'); expect(data()).toBe(before);
    mock.mockRestore(); expect(claimQuestReward(id)).toBe('ok');
  });

});
