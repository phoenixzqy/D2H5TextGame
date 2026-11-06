/** Constructed real source proofs isolate claims; no earned campaign acceptance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore, __resetPersistenceForTests } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import * as questLoader from '@/data/loaders/quests';
import { CAIN_QUEST, CAIN_SIDE_QUEST, CAIN_SCROLL_SOURCE } from '@/engine/map/cain-quest';
import { MALUS_QUEST, MALUS_SIDE_QUEST, MALUS_SOURCE, MALUS_ITEM } from '@/engine/map/malus-quest';
import { ACT1_QUEST_RECEIPTS as R } from '@/engine/map/act1-quest-sources';
import { claimQuestReward } from './claimReward';

const cases = [
  [CAIN_QUEST, 20], [CAIN_SIDE_QUEST, 10],
  [MALUS_QUEST, 15], [MALUS_SIDE_QUEST, 10]
] as const;
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests(); useCombatStore.getState().reset();
  usePlayerStore.getState().reset(); useMapStore.getState().reset();
  useInventoryStore.getState().reset(); useMercStore.getState().reset();
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Finite wishes', 'sorceress'));
  useMapStore.setState({ currentAct: 1, questProgress: {
    [CAIN_QUEST]: { id: CAIN_QUEST, status: 'completed', rewardClaimed: false,
      objectives: { 'obj-inifuss-tree': true, 'obj-decode': true, 'obj-rescue-cain': true } },
    [CAIN_SIDE_QUEST]: { id: CAIN_SIDE_QUEST, status: 'completed', rewardClaimed: false, objectives: { 'obj-talk': true } },
    [MALUS_QUEST]: { id: MALUS_QUEST, status: 'completed', rewardClaimed: false,
      objectives: { 'obj-recover-malus': true, 'obj-imbue-ready': true } },
    [MALUS_SIDE_QUEST]: { id: MALUS_SIDE_QUEST, status: 'completed', rewardClaimed: false, objectives: { 'obj-bring-item': true } }
  }, questReceipts: { [R.rescueCain]: true, [R.cainTalk]: true, [R.presentItem]: true } });
  useInventoryStore.setState({ questItems: {
    [CAIN_SCROLL_SOURCE]: { itemId: 'quest/scroll_of_inifuss', state: 'consumed' },
    [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'consumed' }
  } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

function snapshot() {
  const map = useMapStore.getState(), inventory = useInventoryStore.getState();
  return structuredClone({ hero: usePlayerStore.getState().player, progress: map.questProgress,
    receipts: map.questReceipts, items: inventory.questItems, services: inventory.questServices,
    currencies: inventory.currencies });
}

describe('finite Cain and Malus wish bundles', () => {
  it.each(cases)('%s authors and pays exactly %i canonical wishes once', (quest, amount) => {
    expect(questLoader.loadQuests().find(row => row.id === quest)?.rewards?.wishstones).toBe(amount);
    useInventoryStore.setState({ currencies: { wishstones: Number.MAX_SAFE_INTEGER, 'gem-shard': 8 } });
    expect(claimQuestReward(quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ wishstones: Number.MAX_SAFE_INTEGER, 'gem-shard': 8, wishstone: amount });
    expect(claimQuestReward(quest)).toBe('already-claimed');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(amount);
  });

  it.each(cases)('%s pays its wishes through the native source publisher', (quest, amount) => {
    expect(claimQuestReward(quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(amount);
  });
  it.each(cases)('%s keeps independent additions when claimed publication throws', (quest, amount) => {
    const before = snapshot(); let fired = false;
    const stop = useMapStore.subscribe(state => {
      if (fired || !state.questProgress[quest]?.rewardClaimed) return;
      fired = true;
      useInventoryStore.getState().addCurrency('wishstone', 7);
      useInventoryStore.getState().addCurrency('opaque', 3);
      throw new Error('claimed observer');
    });
    try { expect(claimQuestReward(quest)).toBe('grant-failed'); } finally { stop(); }
    expect(snapshot()).toEqual({ ...before, currencies: { wishstone: 7, opaque: 3 } });
    expect(claimQuestReward(quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 7 + amount, opaque: 3 });
  });

  it.each(cases)('%s preserves nested additions when an inventory observer throws', (quest, amount) => {
    const before = snapshot(); let fired = false;
    const stop = useInventoryStore.subscribe(state => {
      if (fired || state.currencies.wishstone !== amount) return;
      fired = true; state.addCurrency('wishstone', 4);
      throw new Error('currency observer');
    });
    try { expect(claimQuestReward(quest)).toBe('grant-failed'); } finally { stop(); }
    expect(snapshot()).toEqual({ ...before, currencies: { wishstone: 4 } });
  });

  it.each(cases)('%s rolls back silent currency ingress and retries once', (quest, amount) => {
    const before = snapshot();
    const mock = vi.spyOn(useInventoryStore.getState(), 'addQuestCurrency').mockImplementation(() => undefined);
    expect(claimQuestReward(quest)).toBe('grant-failed'); expect(snapshot()).toEqual(before);
    mock.mockRestore();
    expect(claimQuestReward(quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(amount);
  });

  it.each(cases)('%s blocks spending and holds the quest lease through rollback', (quest, amount) => {
    const before = snapshot(); const nested: string[] = []; let fired = false;
    const stop = useInventoryStore.subscribe(state => {
      nested.push(claimQuestReward(quest));
      if (fired || state.currencies.wishstone !== amount) return;
      fired = true; state.spendCurrency('wishstone', 1);
    });
    try { expect(claimQuestReward(quest)).toBe('grant-failed'); } finally { stop(); }
    expect(snapshot()).toEqual(before); expect(nested.length).toBeGreaterThan(1);
    expect(new Set(nested)).toEqual(new Set(['claim-in-progress']));
    expect(claimQuestReward(quest)).toBe('ok');
    expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });

  it.each(cases)('%s refuses unsafe headroom without XP, service or claim writes', (quest, amount) => {
    useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER - amount + 1 } });
    const before = snapshot();
    expect(claimQuestReward(quest)).toBe('unsupported-rewards'); expect(snapshot()).toEqual(before);
    useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER - amount } });
    expect(claimQuestReward(quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(Number.MAX_SAFE_INTEGER);
  });

  it.each(cases)('%s refuses an unauthored bonus without writes', (quest, amount) => {
    const definitions = questLoader.loadQuests();
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(definitions.map(row => row.id === quest
      ? { ...row, rewards: { ...row.rewards, wishstones: amount + 1 } } : row));
    const before = snapshot();
    expect(claimQuestReward(quest)).toBe('unsupported-rewards'); expect(snapshot()).toEqual(before);
  });

  it.each([undefined, 0, 9])('restores balance presence %s on a failed side claim', baseline => {
    useInventoryStore.setState({ currencies: baseline === undefined ? {} : { wishstone: baseline } });
    const before = snapshot();
    const mock = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(() => undefined);
    expect(claimQuestReward(CAIN_SIDE_QUEST)).toBe('grant-failed'); expect(snapshot()).toEqual(before);
    mock.mockRestore(); expect(claimQuestReward(CAIN_SIDE_QUEST)).toBe('ok');
  });

  it.each(cases)('%s reports a restoration observer failure and releases both owners', (quest, amount) => {
    const before = snapshot();
    const mark = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(() => undefined);
    const restore = useInventoryStore.getState().restoreQuestCurrency;
    const mock = vi.spyOn(useInventoryStore.getState(), 'restoreQuestCurrency').mockImplementation(owner => {
      restore(owner); throw new Error('restore currency observer');
    });
    expect(() => claimQuestReward(quest)).toThrow(AggregateError); expect(snapshot()).toEqual(before);
    mark.mockRestore(); mock.mockRestore();
    expect(claimQuestReward(quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(amount);
  });

  it.each([
    [CAIN_QUEST, CAIN_SIDE_QUEST, 30], [CAIN_SIDE_QUEST, CAIN_QUEST, 30],
    [MALUS_QUEST, MALUS_SIDE_QUEST, 25], [MALUS_SIDE_QUEST, MALUS_QUEST, 25]
  ] as const)('claims %s then %s once for %i wishes', (first, second, amount) => {
    expect(claimQuestReward(first)).toBe('ok'); expect(claimQuestReward(second)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(amount);
    const after = snapshot(); expect(claimQuestReward(first)).toBe('already-claimed');
    expect(claimQuestReward(second)).toBe('already-claimed'); expect(snapshot()).toEqual(after);
  });

});
