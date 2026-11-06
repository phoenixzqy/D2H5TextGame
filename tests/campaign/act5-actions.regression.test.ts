/** Constructed earlier combat isolates native Act V Claim and retention, never earned wins. */
import assert from 'node:assert/strict';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { useMercStore } from '@/stores/mercStore';
import * as lootAward from '@/engine/loot/award';
import * as nativeClaim from '@/features/quests/claimReward';
import { loadAwardPools } from '@/data/loaders/loot';
import { hasAct5CampaignReward } from '@/engine/save/act5-campaign';
import { hasEndgameAccess } from '@/engine/endgame/state';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { campaignState } from './campaign-state';
import { constructActFivePrefix, publishConstructedActFiveWave } from './act5-fixture';

const eve = 'quests/act5-eve-of-destruction';
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
function ready() {
  const f = constructActFivePrefix(); f.actions.start(eve);
  for (let index = 0; index < 8; index++) publishConstructedActFiveWave(index);
  return f;
}

it('retains the native40000/30000XP cache and exact title/unlock bundle at the Claim boundary', () => {
  const f = ready(), before = observeEarnedState(), roll = vi.spyOn(lootAward, 'rollQuestTableRewards');
  f.actions.claim(eve);
  expect(roll).toHaveBeenCalledTimes(1);
  const call = roll.mock.calls[0]; assert.ok(call);
  expect(call).toHaveLength(3); expect(call[0]).toEqual({ tableId: 'loot/baal-q', ilvl: 82, picks: 5 });
  expect(call[1]).toEqual(loadAwardPools());
  for (const key of ['next', 'nextInt', 'pick', 'chance', 'fork'] as const)
    expect(typeof call[2][key]).toBe('function');
  const result = roll.mock.results[0]; assert.ok(result?.type === 'return' && result.value);
  const entry = f.actions.entries.at(-1), mercId = useMercStore.getState().fieldedMercId;
  assert.ok(entry?.delta && mercId);
  expect(entry.delta.xp).toBe(40000); expect(entry.delta.mercXp).toEqual({ [mercId]: 30000 });
  expect(entry.delta.addedItems).toEqual(result.value.items); expect(entry.delta.materials).toEqual(result.value.materials);
  const after = observeEarnedState(), campaign = campaignState(after.map);
  expect(entry.before).toHaveProperty('campaign', campaignState(before.map));
  expect(entry.after).toHaveProperty('campaign', campaign);
  expect(campaign).toEqual({ ...campaignState(before.map),
    questTitles: { 'titles/slayer_of_baal': true }, questDifficulties: { 'difficulty/nightmare': true } });
  expect(after.inventory.questItems).toEqual(before.inventory.questItems);
  expect(after.map.questReceipts).toEqual(before.map.questReceipts);
  expect(hasAct5CampaignReward(after.map.questProgress, after.map.questReceipts, after.inventory.questItems)).toBe(true);
  expect(hasEndgameAccess({ questProgress: after.map.questProgress, questReceipts: after.map.questReceipts,
    questItems: after.inventory.questItems })).toBe(true);
  expect(() => { f.actions.claim(eve); }).toThrow('already-claimed');
  expect(observeEarnedState()).toEqual(after); expect(roll).toHaveBeenCalledTimes(1);
});

it.each([3, 4, 6])('refuses Claim after constructed wave index%s without changing ownership or income', index => {
  const f = constructActFivePrefix(); f.actions.start(eve);
  for (let wave = 0; wave <= index; wave++) publishConstructedActFiveWave(wave);
  const before = observeEarnedState(); expect(() => { f.actions.claim(eve); }).toThrow('not-completed');
  expect(observeEarnedState()).toEqual(before);
});

it.each(['recorder', 'native'] as const)('retains actual successful entitlement publication after %s throws', fault => {
  const f = ready(), failure = new Error(`constructed ${fault} failure`);
  if (fault === 'recorder') f.hook(row => { if (row.kind === 'quest-action') throw failure; });
  else {
    const claim = nativeClaim.claimQuestReward;
    vi.spyOn(nativeClaim, 'claimQuestReward').mockImplementation(id => {
      expect(claim(id)).toBe('ok'); throw failure;
    });
  }
  expect(() => { f.actions.claim(eve); }).toThrow(failure);
  const entry = f.actions.entries.at(-1); assert.ok(entry);
  expect(entry).toMatchObject({ result: fault === 'native' ? 'threw' : 'ok', delta: { xp: 40000 } });
  expect(entry.after).toHaveProperty('campaign.questTitles', { 'titles/slayer_of_baal': true });
  expect(entry.after).toHaveProperty('campaign.questDifficulties', { 'difficulty/nightmare': true });
});
