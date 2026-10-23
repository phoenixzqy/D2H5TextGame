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
import { xpTotal } from '@/engine/progression/xp';
import { claimQuestReward, readQuestItem } from './claimReward';
import * as actions from './interactObject';

const quest = 'quests/act2-horadric-staff', tombQuest = 'quests/act2-seven-tombs';
const cube = `${quest}#objective:obj-cube`, shaft = `${quest}#objective:obj-shaft`;
const amulet = `${quest}#objective:obj-amulet`, staff = `${quest}#objective:obj-transmute`;
const tomb = 'areas/act2-tomb-of-tal-rasha';
const domains = [useMapStore, usePlayerStore, useInventoryStore, useMercStore] as const;
const hydration = persistence.useHydrationStore.getState();
const ownedParts = {
  [cube]: { itemId: 'quest/horadric_cube', state: 'owned' as const },
  [shaft]: { itemId: 'quest/staff_of_kings', state: 'owned' as const },
  [amulet]: { itemId: 'quest/viper_amulet', state: 'owned' as const }
};
function reset() {
  abortSubAreaRun(); useCombatStore.getState().reset();
  for (const domain of domains) domain.getState().reset();
}
function data() { return domains.map(domain => Object.fromEntries(Object.entries(domain.getState())
  .filter(([, value]) => typeof value !== 'function'))); }
function prepareParts() {
  useInventoryStore.setState({ questItems: ownedParts });
  useMapStore.getState().updateQuestProgress(quest, { objectives: {
    'obj-cube': true, 'obj-shaft': true, 'obj-amulet': true, 'obj-transmute': false } });
}
beforeEach(() => {
  reset(); persistence.useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Staff acquisition', 'sorceress'));
  useMapStore.setState({ currentAct: 2, currentSubAreaId: 'areas/act2-dry-hills',
    clearedSubAreas: ['areas/act1-catacombs'], questProgress: {
      [quest]: { id: quest, status: 'inProgress', objectives: {
        'obj-cube': false, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } },
      [tombQuest]: { id: tombQuest, status: 'inProgress', objectives: {
        'obj-open-tomb': false, 'obj-kill-duriel': false } }
    } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); persistence.useHydrationStore.setState(hydration); });

describe('Horadric Staff acquisition through insertion', () => {
  it('recovers components in authored order, assembles and inserts once with exact receipts and no rewards', () => {
    const hero = usePlayerStore.getState().player, inventory = useInventoryStore.getState();
    expect(actions.recoverQuestTool(cube)).toBe('ok');
    expect(actions.travelToAreaObjects(2, 'areas/act2-lost-city')).toBe('ok');
    expect(actions.recoverQuestTool(amulet)).toBe('not-eligible');
    expect(actions.travelToAreaObjects(2, 'areas/act2-far-oasis')).toBe('ok');
    expect(actions.recoverQuestTool(shaft)).toBe('ok');
    expect(actions.travelToAreaObjects(2, 'areas/act2-lost-city')).toBe('ok');
    expect(actions.recoverQuestTool(amulet)).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual(ownedParts);
    expect(actions.assembleQuestItem(staff)).toBe('ok');
    const assembled = {
      ...ownedParts,
      [shaft]: { ...ownedParts[shaft], state: 'consumed' },
      [amulet]: { ...ownedParts[amulet], state: 'consumed' },
      [staff]: { itemId: 'quest/horadric_staff', state: 'owned' }
    };
    expect(useInventoryStore.getState().questItems).toEqual(assembled);
    expect(useMapStore.getState().questProgress[quest]).toEqual({ id: quest, status: 'completed',
      objectives: { 'obj-cube': true, 'obj-shaft': true, 'obj-amulet': true, 'obj-transmute': true } });
    expect(usePlayerStore.getState().player).toBe(hero);
    expect(useInventoryStore.getState().backpack).toBe(inventory.backpack);
    expect(useInventoryStore.getState().currencies).toBe(inventory.currencies);
    const before = data();
    expect(actions.assembleQuestItem(staff)).toBe('already-owned');
    expect(actions.recoverQuestTool(amulet)).toBe('already-owned');
    expect(actions.insertQuestItem(staff)).toBe('not-eligible');
    expect(readQuestItem(staff)).toBe('unsupported-rewards');
    expect(data()).toEqual(before);
    expect(actions.travelToAreaObjects(2, tomb)).toBe('ok');
    expect(actions.insertQuestItem(staff)).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual({ ...assembled,
      [staff]: { itemId: 'quest/horadric_staff', state: 'consumed' } });
    expect(useMapStore.getState().questProgress[tombQuest]).toEqual({ id: tombQuest, status: 'inProgress',
      objectives: { 'obj-open-tomb': true, 'obj-kill-duriel': false } });
    expect(useMapStore.getState().isActUnlocked(3)).toBe(false);
    const inserted = data();
    expect(actions.insertQuestItem(staff)).toBe('already-consumed');
    expect(actions.assembleQuestItem(staff)).toBe('already-owned'); expect(data()).toEqual(inserted);
    const save = persistence.snapshotStores(); if (!save) throw new Error('Missing save');
    expect(decodeSave(toJsonSafe(save))).toEqual(save);
  });

  it.each([false, true])('repairs completed legacy Staff and Tombs explicitly, preserving claimed=%s', rewardClaimed => {
    for (const id of [quest, tombQuest]) {
      const progress = useMapStore.getState().questProgress[id];
      if (!progress) throw new Error('Missing progress');
      useMapStore.getState().updateQuestProgress(id, { status: 'completed', rewardClaimed,
        objectives: Object.fromEntries(Object.keys(progress.objectives).map(key => [key, true])) });
    }
    const progress = useMapStore.getState().questProgress, hero = usePlayerStore.getState().player;
    expect(actions.recoverQuestTool(cube)).toBe('ok');
    expect(actions.travelToAreaObjects(2, 'areas/act2-far-oasis')).toBe('ok');
    expect(actions.recoverQuestTool(shaft)).toBe('ok');
    expect(actions.travelToAreaObjects(2, 'areas/act2-lost-city')).toBe('ok');
    expect(actions.recoverQuestTool(amulet)).toBe('ok');
    expect(actions.assembleQuestItem(staff)).toBe('ok');
    expect(actions.travelToAreaObjects(2, tomb)).toBe('ok'); expect(actions.insertQuestItem(staff)).toBe('ok');
    expect(useMapStore.getState().questProgress).toEqual(progress); expect(usePlayerStore.getState().player).toBe(hero);
    const save = persistence.snapshotStores(); if (!save) throw new Error('Missing save');
    expect(decodeSave(toJsonSafe(save))).toEqual(save);
  });

  it('keeps the authored 6000 XP claim separate from assembly and pays it once', () => {
    prepareParts(); const before = usePlayerStore.getState().player;
    if (!before) throw new Error('Missing player');
    expect(actions.assembleQuestItem(staff)).toBe('ok'); expect(usePlayerStore.getState().player).toBe(before);
    const items = useInventoryStore.getState().questItems;
    expect(claimQuestReward(quest)).toBe('ok');
    const after = usePlayerStore.getState().player; if (!after) throw new Error('Missing player');
    expect(xpTotal(after.level) + after.experience - xpTotal(before.level) - before.experience).toBe(6000);
    expect(useInventoryStore.getState().questItems).toBe(items);
    const claimed = data(); expect(claimQuestReward(quest)).toBe('already-claimed'); expect(data()).toEqual(claimed);
  });

  it('permits independent Destroy altar without recovering the amulet or claiming either quest', () => {
    const sun = 'quests/act2-tainted-sun';
    useMapStore.getState().updateQuestProgress(sun, { status: 'inProgress', objectives: { 'obj-destroy-altar': false } });
    expect(actions.travelToAreaObjects(2, 'areas/act2-lost-city')).toBe('ok');
    const before = data();
    expect(actions.interactWithAreaObject('objects/serpent_altar')).toBe('ok');
    expect(useMapStore.getState().questProgress[sun]).toEqual({ id: sun, status: 'completed',
      objectives: { 'obj-destroy-altar': true } });
    expect(useMapStore.getState().questProgress[quest]).toEqual((before[0]?.questProgress as ReturnType<typeof useMapStore.getState>['questProgress'])[quest]);
    expect(data().slice(1)).toEqual(before.slice(1));
    expect(actions.recoverQuestTool(amulet)).toBe('not-eligible');
    expect(actions.recoverQuestTool(cube)).toBe('not-eligible');
  });

  it.each([cube, shaft, amulet])('refuses assembly without actual owned input %s even with true flags', missing => {
    prepareParts();
    useInventoryStore.setState({ questItems: Object.fromEntries(Object.entries(ownedParts).filter(([key]) => key !== missing)) });
    const before = data(); expect(actions.assembleQuestItem(staff)).toBe('not-eligible'); expect(data()).toEqual(before);
  });

  it('refuses assembly and recovery for malformed completed/claimed flag histories', () => {
    prepareParts();
    useMapStore.getState().updateQuestProgress(quest, { status: 'completed', rewardClaimed: true });
    const before = data(); expect(actions.assembleQuestItem(staff)).toBe('not-eligible');
    expect(actions.recoverQuestTool(cube)).toBe('not-eligible'); expect(data()).toEqual(before);
  });

  it.each(['assemble', 'insert'] as const)('refuses %s while unready, replacing, hero absent, combat active or access locked', operation => {
    prepareParts(); if (operation === 'insert') {
      expect(actions.assembleQuestItem(staff)).toBe('ok'); actions.travelToAreaObjects(2, tomb);
    }
    const act = () => operation === 'assemble' ? actions.assembleQuestItem(staff) : actions.insertQuestItem(staff);
    persistence.useHydrationStore.getState().setStatus('loading'); let before = data();
    expect(act()).toBe('not-ready'); expect(data()).toEqual(before); persistence.useHydrationStore.getState().setStatus('ready');
    const replacing = vi.spyOn(persistence, 'isReplacingSave').mockReturnValue(true);
    before = data(); expect(act()).toBe('not-ready'); expect(data()).toEqual(before); replacing.mockRestore();
    const player = usePlayerStore.getState().player; usePlayerStore.getState().reset(); before = data();
    expect(act()).toBe('no-player'); expect(data()).toEqual(before); if (!player) throw new Error('Missing player'); usePlayerStore.getState().setPlayer(player);
    useCombatStore.setState({ inCombat: true }); before = data(); expect(act()).toBe('combat-active'); expect(data()).toEqual(before);
    useCombatStore.setState({ inCombat: false });
    expect(startSubAreaRun({ subAreaId: tomb, act: 2, runSeed: 17, challengeOrdinal: 0 })).toBeTruthy();
    useCombatStore.setState({ inCombat: false }); before = data(); expect(act()).toBe('combat-active'); expect(data()).toEqual(before); abortSubAreaRun();
    useMapStore.setState({ clearedSubAreas: [] }); before = data(); expect(act()).toBe('not-eligible'); expect(data()).toEqual(before);
  });

  it.each(['assemble', 'insert'] as const)('restores both %s domains on mutate-then-throw and keeps the lock during rollback', operation => {
    prepareParts(); if (operation === 'insert') { expect(actions.assembleQuestItem(staff)).toBe('ok'); actions.travelToAreaObjects(2, tomb); }
    const act = () => operation === 'assemble' ? actions.assembleQuestItem(staff) : actions.insertQuestItem(staff);
    const before = data(), nested: string[] = []; let first = true;
    const unsubscribe = useMapStore.subscribe(() => {
      nested.push(actions.assembleQuestItem(staff), actions.insertQuestItem(staff), actions.recoverQuestTool(cube), claimQuestReward(quest), readQuestItem(cube));
      if (first) { first = false; throw new Error('map observer failure'); }
    });
    try { expect(act()).toBe('grant-failed'); } finally { unsubscribe(); }
    expect(first).toBe(false); expect(nested.length).toBeGreaterThan(0);
    expect(nested.every(result => result === 'claim-in-progress')).toBe(true); expect(data()).toEqual(before);
    expect(act()).toBe('ok');
  });

  it.each(['Recover', 'Claim', 'Read'] as const)('refuses nested Assemble/Insert during %s and unlocks afterward', action => {
    const bookQuest = 'quests/act2-radaments-lair', bookSource = `${bookQuest}#reward:questItem`;
    useMapStore.getState().updateQuestProgress(bookQuest, { status: 'completed', rewardClaimed: action === 'Read',
      objectives: { 'obj-kill-radament': true } });
    if (action === 'Read') useInventoryStore.setState({ questItems: { [bookSource]: { itemId: 'items/book_of_skill', state: 'owned' } } });
    const nested: string[] = []; const unsubs = [useInventoryStore, usePlayerStore].map(domain => domain.subscribe(() => {
      nested.push(actions.assembleQuestItem(staff), actions.insertQuestItem(staff));
    }));
    try { expect(action === 'Read' ? readQuestItem(bookSource) : action === 'Claim'
      ? claimQuestReward(bookQuest) : actions.recoverQuestTool(cube)).toBe('ok'); }
    finally { unsubs.forEach(unsub => { unsub(); }); }
    expect(nested.length).toBeGreaterThan(0); expect(nested.every(result => result === 'claim-in-progress')).toBe(true);
    prepareParts(); expect(actions.assembleQuestItem(staff)).toBe('ok');
  });

  it.each(['assemble', 'insert'] as const)('holds %s restoration through every restoration failure and releases afterward', operation => {
    prepareParts(); if (operation === 'insert') { expect(actions.assembleQuestItem(staff)).toBe('ok'); actions.travelToAreaObjects(2, tomb); }
    const act = () => operation === 'assemble' ? actions.assembleQuestItem(staff) : actions.insertQuestItem(staff);
    const before = data(); let calls = 0;
    const unsubscribe = useInventoryStore.subscribe(() => { calls++; throw new Error('inventory observer failure'); });
    try { expect(act).toThrow(AggregateError); } finally { unsubscribe(); }
    expect(calls).toBe(2); expect(data()).toEqual(before); expect(act()).toBe('ok');
  });

  it.each(['assemble', 'insert'] as const)('refuses %s under wave/restore ownership before any writes', operation => {
    prepareParts(); const act = () => operation === 'assemble' ? actions.assembleQuestItem(staff) : actions.insertQuestItem(staff);
    const before = data(), wave = beginWaveTransition(true);
    try { expect(act).toThrow('waveBusy'); expect(data()).toEqual(before); } finally { endWaveTransition(wave); }
    const restore = reserveWaveRestore();
    try { expect(act).toThrow('restorePending'); expect(data()).toEqual(before); } finally { releaseWaveRestore(restore); }
  });
});
