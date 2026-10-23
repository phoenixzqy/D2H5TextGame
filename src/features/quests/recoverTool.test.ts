import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore } from '@/stores/mercStore';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import * as persistence from '@/stores/persistence';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save';
import { claimQuestReward, readQuestItem } from './claimReward';
import * as actions from './interactObject';

const quest = 'quests/act2-horadric-staff', source = `${quest}#objective:obj-cube`;
const area = 'areas/act2-dry-hills';
const domains = [useMapStore, usePlayerStore, useInventoryStore, useMercStore] as const;
const hydration = persistence.useHydrationStore.getState();
function reset() {
  abortSubAreaRun(); useCombatStore.getState().reset();
  for (const domain of domains) domain.getState().reset();
}
function data() { return domains.map(domain => Object.fromEntries(Object.entries(domain.getState())
  .filter(([, value]) => typeof value !== 'function'))); }
beforeEach(() => {
  reset(); persistence.useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Cube recovery', 'sorceress'));
  useMapStore.setState({ currentAct: 2, currentSubAreaId: area, clearedSubAreas: ['areas/act1-catacombs'],
    questProgress: { [quest]: { id: quest, status: 'inProgress', objectives: {
      'obj-cube': false, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } } } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); persistence.useHydrationStore.setState(hydration); });

describe('explicit objective-bound tool recovery', () => {
  it('visits the source without credit, then grants only owned Cube and its flag once', () => {
    useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
    const flags = useMapStore.getState().questProgress;
    expect(actions.travelToAreaObjects(2, area)).toBe('ok');
    expect(useMapStore.getState().questProgress).toBe(flags);
    const before = data(), inventory = useInventoryStore.getState();
    expect(actions.recoverQuestTool(source)).toBe('ok');
    expect(data()).toEqual([{ ...before[0], questProgress: { ...flags,
      [quest]: { ...flags[quest], objectives: { ...flags[quest]?.objectives, 'obj-cube': true } } } },
    before[1], { ...before[2], questItems: { [source]: { itemId: 'quest/horadric_cube', state: 'owned' } } }, before[3]]);
    expect(useInventoryStore.getState().backpack).toBe(inventory.backpack);
    const owned = data();
    expect(actions.recoverQuestTool(source)).toBe('already-owned');
    expect(readQuestItem(source)).toBe('unsupported-rewards');
    expect(claimQuestReward(quest)).toBe('not-completed');
    expect(data()).toEqual(owned);
    const save = persistence.snapshotStores();
    if (!save) throw new Error('Missing save');
    expect(decodeSave(toJsonSafe(save))).toEqual(save);
  });

  it('recovers a legacy true flag without a receipt, preserving later flags', () => {
    useMapStore.getState().updateQuestProgress(quest, { objectives: { 'obj-cube': true, 'obj-shaft': true } });
    expect(actions.recoverQuestTool(source)).toBe('ok');
    expect(useMapStore.getState().questProgress[quest]).toMatchObject({ status: 'inProgress',
      objectives: { 'obj-cube': true, 'obj-shaft': true } });
  });

  it.each(['locked', 'available', 'completed'] as const)('refuses %s quests without writes', status => {
    useMapStore.getState().updateQuestProgress(quest, { status });
    const before = data(); expect(actions.recoverQuestTool(source)).toBe('not-eligible'); expect(data()).toEqual(before);
  });

  it('refuses missing, claimed, wrong-source and wrong-area entitlements without writes', () => {
    for (const patch of [
      { questProgress: {} },
      { questProgress: { ...useMapStore.getState().questProgress,
        [quest]: { id: quest, status: 'inProgress' as const, objectives: {}, rewardClaimed: true } } }
    ]) {
      const old = useMapStore.getState(); useMapStore.setState(patch); const before = data();
      expect(actions.recoverQuestTool(source)).toBe('not-eligible'); expect(data()).toEqual(before);
      useMapStore.setState(old);
    }
    expect(actions.recoverQuestTool(source + ':wrong')).toBe('not-eligible');
    useMapStore.getState().setCurrentLocation(2, 'a2-rocky-waste');
    const before = data(); expect(actions.recoverQuestTool(source)).toBe('not-eligible'); expect(data()).toEqual(before);
  });

  it.each(['inventory', 'map'])('restores both writes after %s mutates then throws', domain => {
    const before = data(); let thrown = false;
    const observe = () => {
      const changed = domain === 'inventory' ? useInventoryStore.getState().questItems[source]
        : useMapStore.getState().questProgress[quest]?.objectives['obj-cube'];
      if (changed && !thrown) { thrown = true; throw new Error('observer failure'); }
    };
    const unsubscribe = domain === 'inventory' ? useInventoryStore.subscribe(observe) : useMapStore.subscribe(observe);
    try { expect(actions.recoverQuestTool(source)).toBe('grant-failed'); }
    finally { unsubscribe(); }
    expect(thrown).toBe(true); expect(data()).toEqual(before);
    expect(actions.recoverQuestTool(source)).toBe('ok');
  });
  it('recovers without replacing full gear containers or awarding rewards', () => {
    const gear = { id: 'gear', baseId: 'items/base/helm-cap', rarity: 'normal' as const,
      level: 1, identified: true, equipped: false };
    useInventoryStore.setState({ backpack: Array.from({ length: 100 }, (_, n) => ({ ...gear, id: `bag-${String(n)}` })),
      stash: Array.from({ length: 500 }, (_, n) => ({ ...gear, id: `stash-${String(n)}` })) });
    const { backpack, stash, currencies } = useInventoryStore.getState();
    const hero = usePlayerStore.getState().player, mercs = useMercStore.getState();
    expect(actions.recoverQuestTool(source)).toBe('ok');
    expect(useInventoryStore.getState()).toMatchObject({ backpack, stash, currencies });
    expect(useInventoryStore.getState().backpack).toBe(backpack);
    expect(useInventoryStore.getState().stash).toBe(stash);
    expect(usePlayerStore.getState().player).toBe(hero); expect(useMercStore.getState()).toBe(mercs);
  });

  it('refuses hydration, replacement, missing hero and locked access without writes', () => {
    for (const status of ['idle', 'loading', 'error'] as const) {
      persistence.useHydrationStore.getState().setStatus(status); const before = data();
      expect(actions.recoverQuestTool(source)).toBe('not-ready'); expect(data()).toEqual(before);
    }
    persistence.useHydrationStore.getState().setStatus('ready');
    const replacing = vi.spyOn(persistence, 'isReplacingSave').mockReturnValue(true);
    let before = data(); expect(actions.recoverQuestTool(source)).toBe('not-ready'); expect(data()).toEqual(before);
    replacing.mockRestore();
    const hero = usePlayerStore.getState().player; usePlayerStore.getState().reset(); before = data();
    expect(actions.recoverQuestTool(source)).toBe('no-player'); expect(data()).toEqual(before);
    if (!hero) throw new Error('Missing hero'); usePlayerStore.getState().setPlayer(hero);
    useMapStore.setState({ clearedSubAreas: [] }); before = data();
    expect(actions.recoverQuestTool(source)).toBe('not-eligible'); expect(data()).toEqual(before);
  });

  it('refuses active combat and an active run after playback ends', () => {
    useCombatStore.setState({ inCombat: true }); let before = data();
    expect(actions.recoverQuestTool(source)).toBe('combat-active'); expect(data()).toEqual(before);
    useCombatStore.getState().reset();
    expect(startSubAreaRun({ subAreaId: area, act: 2, runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    useCombatStore.setState({ inCombat: false }); before = data();
    expect(actions.recoverQuestTool(source)).toBe('combat-active'); expect(data()).toEqual(before);
  });

  it('refuses wave/restore ownership and invalid ledger entries before writes', () => {
    const wave = beginWaveTransition(true);
    try { const before = data(); expect(() => actions.recoverQuestTool(source)).toThrow('waveBusy'); expect(data()).toEqual(before); }
    finally { endWaveTransition(wave); }
    const restore = reserveWaveRestore();
    try { const before = data(); expect(() => actions.recoverQuestTool(source)).toThrow('restorePending'); expect(data()).toEqual(before); }
    finally { releaseWaveRestore(restore); }
    useInventoryStore.setState({ questItems: { [source]: { itemId: 'quest/horadric_cube', state: 'consumed' } } });
    const before = data(); expect(actions.recoverQuestTool(source)).toBe('not-eligible'); expect(data()).toEqual(before);
  });

  it('blocks nested Claim, Read and Recover through failure restoration while preserving unrelated journal writes', () => {
    const before = data(), nested: string[] = []; let first = true;
    const unsubscribe = useInventoryStore.subscribe(() => {
      nested.push(claimQuestReward(quest), readQuestItem(source), actions.recoverQuestTool(source));
      if (first) {
        first = false;
        useMapStore.getState().updateQuestProgress('quests/act2-arcane-sanctuary', {
          status: 'inProgress', objectives: { 'obj-find-summoner': true } });
        throw new Error('publication failure');
      }
    });
    try { expect(actions.recoverQuestTool(source)).toBe('grant-failed'); } finally { unsubscribe(); }
    expect(nested).toEqual(Array.from({ length: 6 }, () => 'claim-in-progress'));
    expect(useMapStore.getState().questProgress[quest]).toEqual((before[0]?.questProgress as ReturnType<typeof useMapStore.getState>['questProgress'])[quest]);
    expect(useMapStore.getState().questProgress['quests/act2-arcane-sanctuary']?.objectives['obj-find-summoner']).toBe(true);
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(actions.recoverQuestTool(source)).toBe('ok');
  });

  it.each(['Claim', 'Read'])('refuses nested Recover during %s and unlocks afterward', action => {
    const bookQuest = 'quests/act2-radaments-lair', bookSource = `${bookQuest}#reward:questItem`;
    useMapStore.getState().updateQuestProgress(bookQuest, { status: 'completed', rewardClaimed: action === 'Read',
      objectives: { 'obj-kill-radament': true } });
    if (action === 'Read') useInventoryStore.setState({ questItems: { [bookSource]: { itemId: 'items/book_of_skill', state: 'owned' } } });
    const nested: string[] = []; const unsubscribe = usePlayerStore.subscribe(() => { nested.push(actions.recoverQuestTool(source)); });
    try { expect(action === 'Read' ? readQuestItem(bookSource) : claimQuestReward(bookQuest)).toBe('ok'); }
    finally { unsubscribe(); }
    expect(nested.length).toBeGreaterThan(0); expect(nested.every(result => result === 'claim-in-progress')).toBe(true);
    expect(useInventoryStore.getState().questItems[source]).toBeUndefined();
    expect(actions.recoverQuestTool(source)).toBe('ok');
  });

  it('attempts every restoration, reports restoration errors and releases the shared lock', () => {
    const before = data(); let updates = 0;
    const unsubscribe = useInventoryStore.subscribe(() => { updates++; throw new Error(`inventory observer ${String(updates)}`); });
    try { expect(() => actions.recoverQuestTool(source)).toThrow(AggregateError); } finally { unsubscribe(); }
    expect(updates).toBe(2); expect(data()).toEqual(before);
    expect(actions.recoverQuestTool(source)).toBe('ok');
  });

});
