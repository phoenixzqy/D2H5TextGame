/** Constructed playback effects test retention only, never earned combat provenance. */
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { captureEarnedRestorers, resetEarnedStores, observeEarnedState, observeStore,
  earnedDelta } from '../sim/production/earned-state';
import { playEarnedWave, type EarnedRunHandle, type EarnedWave } from '../sim/production/earned-playback';
import { playCampaignQuestWave, type CampaignQuestSettlement } from './quest-settlement';
import { campaignState } from './campaign-state';

vi.mock('../sim/production/earned-playback', () => ({ playEarnedWave: vi.fn() }));
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Retention test', 'sorceress').ok).toBe(true);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
const council = 'quests/act3-khalims-will#action:council-victory';
const context = { act: 3, area: 'areas/act3-travincal', ordinal: 17, index: 4, actionIndex: 25 };
const handle: EarnedRunHandle = { runId: 'constructed-retention', runSeed: 0, challengeOrdinal: 17, totalWaves: 1 };
function returned(beforeAward = observeEarnedState(), afterAward = beforeAward): EarnedWave {
  const combat = observeStore(useCombatStore);
  // Only the retention wrapper reads this dummy unit. No real recording or win is represented.
  const hero = { id: 'hero', kind: 'hero', life: 9 } as EarnedWave['opening']['playerTeam'][number];
  return { index: context.index, advanceResult: 'victory',
    engineInput: { seed: 0, playerTeam: [hero], enemyTeam: [] },
    opening: { ...combat, playerTeam: [hero] },
    played: { ...combat, outcome: { winner: 'player', finalPlayerTeam: [hero], finalEnemyTeam: [] } },
    beforeAward, afterAward, afterAdvance: combat, terminalSimClockMs: 1,
    rawRewardDelta: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} },
    actualDelta: earnedDelta(beforeAward, afterAward) };
}

it('retains the actual changed graph before returning to any fallible observer or recorder', () => {
  const entries: CampaignQuestSettlement[] = [];
  const before = observeEarnedState();
  let native = returned();
  vi.mocked(playEarnedWave).mockImplementationOnce(() => {
    useMapStore.setState({ questReceipts: { [council]: true } });
    native = returned(before, observeEarnedState()); return native;
  });
  const actual = playCampaignQuestWave(handle, context, entries);
  expect(actual).toBe(native);
  expect(entries).toEqual([{ ...context, nativeReturned: true, winner: 'player', heroLife: 9,
    advance: 'victory', before: { items: {}, progress: {}, receipts: {}, campaign: campaignState(before.map) },
    after: { items: {}, progress: {}, receipts: { [council]: true }, campaign: campaignState(before.map) } }]);
  useMapStore.setState({ questReceipts: {} });
  expect(entries[0]?.after.receipts).toEqual({ [council]: true });
});

it('retains exceptional residual publication and rethrows the exact original error', () => {
  const entries: CampaignQuestSettlement[] = [], failure = new Error('after native publication');
  vi.mocked(playEarnedWave).mockImplementationOnce(() => {
    useMapStore.setState({ questReceipts: { [council]: true } }); throw failure;
  });
  expect(() => playCampaignQuestWave(handle, context, entries)).toThrow(failure);
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({ ...context, nativeReturned: false,
    winner: null, heroLife: null, advance: null, after: { receipts: { [council]: true } } });
});

it('observes unexpected item/progress mutations without labeling them qualified proof', () => {
  const entries: CampaignQuestSettlement[] = [];
  vi.mocked(playEarnedWave).mockImplementationOnce(() => {
    const before = observeEarnedState();
    useInventoryStore.setState({ questItems: { wrong: { itemId: 'wrong', state: 'owned' } } });
    useMapStore.setState({ questProgress: { wrong: { id: 'wrong', status: 'inProgress', objectives: {} } } });
    return returned(before, observeEarnedState());
  });
  playCampaignQuestWave(handle, context, entries);
  expect(entries[0]?.after).toEqual({ items: { wrong: { itemId: 'wrong', state: 'owned' } },
    progress: { wrong: { id: 'wrong', status: 'inProgress', objectives: {} } }, receipts: {},
    campaign: campaignState(useMapStore.getState()) });
});

it('does not duplicate unchanged graphs or swallow native exceptions', () => {
  const entries: CampaignQuestSettlement[] = [], failure = new Error('before native mutation');
  const native = returned();
  vi.mocked(playEarnedWave).mockReturnValueOnce(native).mockImplementationOnce(() => { throw failure; });
  expect(playCampaignQuestWave(handle, context, entries)).toBe(native);
  expect(() => playCampaignQuestWave(handle, context, entries)).toThrow(failure);
  expect(entries).toEqual([]);
});

it('retains the live graph before rejecting inconsistent returned award observations', () => {
  const entries: CampaignQuestSettlement[] = [];
  const state = observeEarnedState();
  vi.mocked(playEarnedWave).mockImplementationOnce(() => {
    useMapStore.setState({ questReceipts: { [council]: true } });
    return returned(state, state);
  });
  expect(() => playCampaignQuestWave(handle, context, entries)).toThrow('Returned award quest graph');
  expect(entries).toHaveLength(1);
  expect(entries[0]?.after.receipts).toEqual({ [council]: true });
});

it.each([false, true])('retains campaign-only mutation before fallible continuation (native throw=%s)', thrown => {
  const entries: CampaignQuestSettlement[] = [], failure = new Error('Constructed entitlement publication');
  vi.mocked(playEarnedWave).mockImplementationOnce(() => {
    const before = observeEarnedState();
    useMapStore.setState({ questTitles: { 'titles/slayer_of_baal': true } });
    if (thrown) throw failure;
    return returned(before, observeEarnedState());
  });
  if (thrown) expect(() => playCampaignQuestWave(handle, context, entries)).toThrow(failure);
  else playCampaignQuestWave(handle, context, entries);
  expect(entries).toHaveLength(1);
  expect(entries[0]?.before).toHaveProperty('campaign.questTitles', {});
  expect(entries[0]?.after).toHaveProperty('campaign.questTitles', { 'titles/slayer_of_baal': true });
  expect(entries[0]?.nativeReturned).toBe(!thrown);
});

it('retains an unchanged successful native Throne retry checkpoint',()=>{
  const source='quests/act5-eve-of-destruction#action:throne-waves-victory';
  useMapStore.setState({questReceipts:{[source]:true}});
  const native={...returned(),index:4,advanceResult:'next-wave' as const};
  vi.mocked(playEarnedWave).mockReturnValueOnce(native);
  const entries:CampaignQuestSettlement[]=[];
  playCampaignQuestWave(handle,{act:5,area:'areas/act5-throne-of-destruction',index:4,ordinal:17,actionIndex:63},entries);
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({index:4,nativeReturned:true,winner:'player',advance:'next-wave'});
  expect(entries[0]?.after).toEqual(entries[0]?.before);
});
