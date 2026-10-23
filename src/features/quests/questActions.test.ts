/** Constructed source/clear fixture; actual recovery, assembly and Orb runtime are exercised. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore } from '@/stores/mercStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import * as persistence from '@/stores/persistence';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { recoverQuestTool, assembleQuestItem, hasAreaObjects, travelToAreaObjects } from './interactObject';
import { claimQuestReward } from './claimReward';
import { areaQuestActions, executeQuestAction, questActionStatus } from './questActions';

const KHALIM = 'quests/act3-khalims-will', GUARDIAN = 'quests/act3-guardian';
const STAFF = 'quests/act2-horadric-staff', CUBE = `${STAFF}#objective:obj-cube`;
const WILL = `${KHALIM}#objective:obj-transmute`, ORB = `${GUARDIAN}#action:break-compelling-orb`;
const COUNCIL = `${KHALIM}#action:council-victory`, AREA = 'areas/act3-travincal';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useMercStore] as const;
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Orb fixture');
  return value;
}
function reset(): void { abortSubAreaRun(); for (const store of stores) store.getState().reset(); }
function state() { return stores.map(store => Object.fromEntries(Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function'))); }
function assembleWill(): void {
  expect(recoverQuestTool(CUBE)).toBe('ok');
  for (const [objective, area] of [['obj-heart', 'areas/act3-flayer-jungle'], ['obj-brain', 'areas/act3-great-marsh'],
    ['obj-eye', 'areas/act3-kurast-bazaar'], ['obj-flail', AREA]]) {
    useMapStore.getState().setCurrentLocation(3, required(area));
    expect(recoverQuestTool(`${KHALIM}#objective:${required(objective)}`)).toBe('ok');
  }
  expect(assembleQuestItem(WILL)).toBe('ok');
}
beforeEach(() => {
  reset(); persistence.useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Orb functional fixture', 'sorceress'));
  useMapStore.setState({ currentAct: 2, currentSubAreaId: 'areas/act2-dry-hills',
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-flayer-jungle',
      'areas/act3-great-marsh', 'areas/act3-kurast-bazaar', AREA], questReceipts: { [COUNCIL]: true },
    questProgress: {
      [STAFF]: { id: STAFF, status: 'inProgress', objectives: { 'obj-cube': false, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } },
      [KHALIM]: { id: KHALIM, status: 'inProgress', rewardClaimed: false, objectives: {
        'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': false, 'obj-transmute': false } },
      [GUARDIAN]: { id: GUARDIAN, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-kill-mephisto': false } }
    } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); persistence.useHydrationStore.getState().setStatus('idle'); });

describe('Guardian-owned explicit Compelling Orb action', () => {
  it.each([false, true])('uses actual assembled Will independent of Khalim Claim first=%s', claimFirst => {
    assembleWill(); if (claimFirst) expect(claimQuestReward(KHALIM)).toBe('ok');
    expect(areaQuestActions(3, AREA)).toEqual([expect.objectContaining({ id: 'actions/act3-break-compelling-orb',
      questId: GUARDIAN, receiptSource: ORB, inputSource: WILL, itemId: 'items/khalims_will' })]);
    expect(hasAreaObjects(3, AREA)).toBe(true);
    expect(questActionStatus(ORB)).toBe('ready');
    const hero = usePlayerStore.getState().player, mercs = useMercStore.getState(), map = useMapStore.getState();
    const beforeItems = useInventoryStore.getState().questItems;
    expect(executeQuestAction(ORB)).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual({ ...beforeItems, [WILL]: { itemId: 'items/khalims_will', state: 'consumed' } });
    expect(useMapStore.getState().questReceipts).toEqual({ [COUNCIL]: true, [ORB]: true });
    expect(useMapStore.getState().questProgress).toEqual(map.questProgress);
    expect(usePlayerStore.getState().player).toBe(hero); expect(useMercStore.getState()).toBe(mercs);
    expect(questActionStatus(ORB)).toBe('consumed');
    const consumed = state(); expect(executeQuestAction(ORB)).toBe('already-consumed'); expect(state()).toEqual(consumed);
    if (!claimFirst) expect(claimQuestReward(KHALIM)).toBe('ok');
    expect(useInventoryStore.getState().questItems[WILL]?.state).toBe('consumed');
    expect(assembleQuestItem(WILL)).toBe('already-owned');
    const save = required(persistence.snapshotStores()); expect(decodeSave(toJsonSafe(save))).toEqual(save);
    useMapStore.getState().updateQuestProgress(GUARDIAN, { status: 'completed', objectives: { 'obj-kill-mephisto': true } });
    expect(questActionStatus(ORB)).toBe('consumed');
    expect(executeQuestAction(ORB)).toBe('already-consumed');
  });

  it.each(['unstarted', 'completed', 'claimed', 'wrong-id', 'true-objective'] as const)('refuses %s Guardian without changes', fault => {
    assembleWill();
    const row = required(useMapStore.getState().questProgress[GUARDIAN]);
    if (fault === 'unstarted') useMapStore.setState(state => ({ questProgress: Object.fromEntries(Object.entries(state.questProgress).filter(([id]) => id !== GUARDIAN)) }));
    else useMapStore.getState().updateQuestProgress(GUARDIAN, fault === 'completed'
      ? { status: 'completed', objectives: { 'obj-kill-mephisto': true } }
      : fault === 'claimed' ? { rewardClaimed: true }
      : fault === 'wrong-id' ? { ...row, id: KHALIM } : { objectives: { 'obj-kill-mephisto': true } });
    const before = state(); expect(questActionStatus(ORB)).toBe('unavailable');
    expect(executeQuestAction(ORB)).toBe('not-eligible'); expect(state()).toEqual(before);
  });

  it.each(['missing', 'wrong-source', 'wrong-item', 'consumed', 'missing-cube', 'flag-only'] as const)('refuses %s actual Will graph', fault => {
    assembleWill();
    const { [WILL]: will, ...rest } = useInventoryStore.getState().questItems;
    useInventoryStore.setState({ questItems: fault === 'missing' ? rest : fault === 'wrong-source' ? { ...rest, 'quests/wrong#objective:obj-transmute': required(will) }
      : fault === 'wrong-item' ? { ...rest, [WILL]: { itemId: 'quest/horadric_staff', state: 'owned' } }
      : fault === 'consumed' ? { ...rest, [WILL]: { itemId: 'items/khalims_will', state: 'consumed' } }
      : fault === 'flag-only' ? {} : Object.fromEntries(Object.entries({ ...rest, [WILL]: required(will) }).filter(([source]) => source !== CUBE)) });
    const before = state(); expect(questActionStatus(ORB)).toBe('unavailable');
    expect(executeQuestAction(ORB)).toBe('not-eligible'); expect(state()).toEqual(before);
  });

  it.each(['wrong-act', 'wrong-area', 'locked', 'unknown-source'] as const)('refuses %s context without changes', fault => {
    assembleWill();
    if (fault === 'wrong-act') useMapStore.setState({ currentAct: 2 });
    if (fault === 'wrong-area') useMapStore.setState({ currentSubAreaId: 'areas/act3-kurast-bazaar' });
    if (fault === 'locked') useMapStore.setState({ clearedSubAreas: [] });
    const source = fault === 'unknown-source' ? `${KHALIM}#action:break-compelling-orb` : ORB;
    const before = state(); expect(questActionStatus(source)).toBe('unavailable');
    expect(executeQuestAction(source)).toBe('not-eligible'); expect(state()).toEqual(before);
    expect(areaQuestActions(2, AREA)).toEqual([]); expect(areaQuestActions(3, 'unknown')).toEqual([]);
  });

  it('lists and visits the action without consuming anything', () => {
    assembleWill(); useMapStore.getState().setCurrentLocation(3, 'areas/act3-kurast-docks');
    const items = useInventoryStore.getState().questItems, receipts = useMapStore.getState().questReceipts;
    areaQuestActions(3, AREA); expect(travelToAreaObjects(3, AREA)).toBe('ok');
    expect(useInventoryStore.getState().questItems).toBe(items); expect(useMapStore.getState().questReceipts).toBe(receipts);
    expect(questActionStatus(ORB)).toBe('ready');
  });

  it('preserves readiness, replacement, player and combat guards', () => {
    assembleWill(); persistence.useHydrationStore.getState().setStatus('loading');
    expect(executeQuestAction(ORB)).toBe('not-ready'); persistence.useHydrationStore.getState().setStatus('ready');
    const replacing = vi.spyOn(persistence, 'isReplacingSave').mockReturnValue(true);
    expect(executeQuestAction(ORB)).toBe('not-ready'); replacing.mockRestore();
    const player = required(usePlayerStore.getState().player); usePlayerStore.getState().reset();
    expect(executeQuestAction(ORB)).toBe('no-player'); usePlayerStore.getState().setPlayer(player);
    useCombatStore.setState({ inCombat: true }); expect(executeQuestAction(ORB)).toBe('combat-active');
    useCombatStore.setState({ inCombat: false }); expect(executeQuestAction(ORB)).toBe('ok');
  });

  it.each(['inventory', 'map'] as const)('rolls back a %s observer failure, preserving unrelated writes and refusing reentry', domain => {
    assembleWill(); const items = useInventoryStore.getState().questItems, progress = useMapStore.getState().questProgress;
    const nested: string[] = []; let fail = true;
    const unsubscribe = (domain === 'inventory' ? useInventoryStore : useMapStore).subscribe(() => {
      nested.push(executeQuestAction(ORB), claimQuestReward(KHALIM));
      if (!fail) return; fail = false;
      useMapStore.getState().updateQuestProgress('quests/act3-lam-esens-tome', { status: 'inProgress', objectives: { 'obj-find-tome': false, 'obj-return': false } });
      throw new Error('Orb observer failure');
    });
    try { expect(executeQuestAction(ORB)).toBe('grant-failed'); } finally { unsubscribe(); }
    expect(nested.length).toBeGreaterThan(0); expect(nested.every(result => result === 'claim-in-progress')).toBe(true);
    expect(useInventoryStore.getState().questItems).toEqual(items);
    expect(useMapStore.getState().questReceipts).toEqual({ [COUNCIL]: true });
    expect(useMapStore.getState().questProgress[GUARDIAN]).toEqual(progress[GUARDIAN]);
    expect(useMapStore.getState().questProgress['quests/act3-lam-esens-tome']).toBeDefined();
    expect(executeQuestAction(ORB)).toBe('ok');
  });
});
