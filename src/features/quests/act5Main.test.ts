import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadQuests } from '@/data/loaders/quests';
import * as towns from '@/data/loaders/towns';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useMetaStore,
  useFormationStore, useCombatStore } from '@/stores';
import { __resetPersistenceForTests, snapshotStores, useHydrationStore } from '@/stores/persistence';
import { reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';
import { ACT5_ENCOUNTERS, EVE_QUEST, PRISON_QUEST, RESCUE_QUEST, THRONE_PROOF } from '@/engine/map/act5-admission';
import { CAGE_PROOFS, INSPECT_PROOF, POTION_SOURCE, READ_PROOF, SCROLL_SOURCE, THAW_PROOF } from '@/engine/save/act5-state';
import { BAAL_TITLE, NIGHTMARE_UNLOCK } from '@/engine/save/act5-campaign';
import { validateQuestItemLedger, decodeSave } from '@/engine/save/validate';
import { xpTotal } from '@/engine/progression/xp';
import { loadMercPool } from '@/data/loaders/mercs';
import { mercXpForLevel } from '@/stores/mercStore';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { claimQuestReward, canClaim, readQuestItem } from './claimReward';
import { executeAct5QuestAction, act5QuestActionStatus, isAnyaThawed, rescuedBarbarianCount } from './act5QuestActions';
import { hasAreaObjects, travelToAreaObjects, areaObjectTargets, interactWithAreaObject } from './interactObject';
import { selectQuestTitle } from './questTitles';

const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useMetaStore,
  useFormationStore, useCombatStore] as const;
const unlock = useMapStore.getState().isActUnlocked;
const originalTownNpcs = towns.loadTownNpcs;
const subscriptions: (() => void)[] = [];
function required<T>(value: T | undefined | null): T { if (value == null) throw new Error('Missing Act V fixture'); return value; }
const player = () => required(usePlayerStore.getState().player);
const xp = () => xpTotal(player().level) + player().experience;
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
function track(id: string, completed = false, claimed = false): void {
  const quest = required(loadQuests().find(row => row.id === id));
  useMapStore.getState().updateQuestProgress(id, { id, status: completed ? 'completed' : 'inProgress', rewardClaimed: claimed,
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, completed])) });
}
function proof(id: string): void {
  track(id, true);
  const encounter = required(ACT5_ENCOUNTERS.find(row => row.questId === id));
  useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts, [encounter.proof]: true,
    ...(id === EVE_QUEST ? { [THRONE_PROOF]: true } : {}) } }));
}
function thaw(): void {
  track(PRISON_QUEST);
  useMapStore.setState({ currentSubAreaId: 'areas/act5-crystalline-passage' });
  expect(executeAct5QuestAction(INSPECT_PROOF)).toBe('ok');
  useMapStore.setState({ currentSubAreaId: null });
  expect(executeAct5QuestAction(POTION_SOURCE)).toBe('ok');
  useMapStore.setState({ currentSubAreaId: 'areas/act5-crystalline-passage' });
  expect(executeAct5QuestAction(THAW_PROOF)).toBe('ok');
}
function rescue(): void {
  track(RESCUE_QUEST);
  useMapStore.setState({ currentSubAreaId: 'areas/act5-frigid-highlands', clearedSubAreas: ['areas/act5-frigid-highlands'] });
  for (const source of [...CAGE_PROOFS].reverse()) expect(executeAct5QuestAction(source)).toBe('ok');
}
beforeEach(() => {
  __resetPersistenceForTests(); for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  const hero = createMockPlayer('Act V fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, equipment: [], derivedStats: { ...hero.derivedStats, life: 17, mana: 11 } });
  useMapStore.setState({ currentAct: 5, currentSubAreaId: null, isActUnlocked: () => true });
  vi.spyOn(towns, 'loadTownNpcs').mockImplementation(act => act === 5
    ? [{ id: 'npc/malah', portraitId: 'malah', nameKey: 'town.npc.malah' }] : originalTownNpcs(act));
});
afterEach(() => { subscriptions.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); useMapStore.setState({ isActUnlocked: unlock }); __resetPersistenceForTests(); });

describe('Act V five main source-backed rewards', () => {
  it('settles the five-main budget once:85000 hero/63750 merc XP, two quest skill points and15 all-six resistance', () => {
    const merc = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight'));
    const hired = useMercStore.getState().hireMerc(merc); if (!hired.ok) throw new Error('Hire failed');
    const mercId = required(hired.mercId); useMercStore.getState().setFieldedMerc(mercId);
    const mercXp = () => {
      const owned = required(useMercStore.getState().ownedMercs.find(row => row.id === mercId));
      let total = useMercStore.getState().getMercProgress(mercId).experience;
      for (let level = 1; level < owned.level; level++) total += mercXpForLevel(level);
      return total;
    };
    const before = player(), priorXp = xp(), priorMerc = mercXp();
    const ids = ['quests/act5-siege-on-harrogath', RESCUE_QUEST, PRISON_QUEST, 'quests/act5-rite-of-passage', EVE_QUEST];
    for (const id of ids) {
      if (id === RESCUE_QUEST) rescue(); else if (id === PRISON_QUEST) { thaw(); proof(id); } else proof(id);
      expect(claimQuestReward(id)).toBe('ok');
    }
    expect(xp()).toBe(priorXp + 85000); expect(mercXp()).toBe(priorMerc + 63750);
    expect(player().skillPoints).toBe(before.skillPoints + player().level - before.level + 2);
    expect(readQuestItem(SCROLL_SOURCE)).toBe('ok');
    expect(Object.values(player().derivedStats.resistances)).toEqual([15, 15, 15, 15, 15, 15]);
    const settled = bytes(); for (const id of ids) expect(claimQuestReward(id)).toBe('already-claimed');
    expect(bytes()).toBe(settled);
  });
  it.each(['quests/act5-siege-on-harrogath', RESCUE_QUEST, PRISON_QUEST, 'quests/act5-rite-of-passage', EVE_QUEST])(
    'refuses completed historical flags as initial reward authority for %s', id => {
      track(id, true); const before = bytes(); expect(canClaim(id)).toBe(false);
      expect(claimQuestReward(id)).toBe('not-completed'); expect(bytes()).toBe(before);
    });
  it('discovers action-only areas and frees three unique groups after actual clear, in any order', () => {
    track(RESCUE_QUEST); const first = required(CAGE_PROOFS[0]);
    expect(hasAreaObjects(5, 'areas/act5-frigid-highlands')).toBe(true);
    expect(travelToAreaObjects(5, 'areas/act5-frigid-highlands')).toBe('ok');
    expect(executeAct5QuestAction(first)).toBe('not-eligible');
    useMapStore.setState({ clearedSubAreas: ['areas/act5-frigid-highlands'] });
    expect(executeAct5QuestAction(first)).toBe('ok'); expect(rescuedBarbarianCount()).toBe(5);
    expect(executeAct5QuestAction(first)).toBe('already-consumed'); expect(rescuedBarbarianCount()).toBe(5);
    for (const source of CAGE_PROOFS.slice(1).reverse()) expect(executeAct5QuestAction(source)).toBe('ok');
    expect(rescuedBarbarianCount()).toBe(15); const prior = xp(), before = player();
    expect(claimQuestReward(RESCUE_QUEST)).toBe('ok'); expect(xp()).toBe(prior + 8000);
    expect(player().skillPoints).toBe(before.skillPoints + player().level - before.level + 1);
    expect(Object.values(player().derivedStats.resistances)).toEqual([5, 5, 5, 5, 5, 5]);
    expect(player().derivedStats.life).toBe(17); expect(player().derivedStats.mana).toBe(11);
    expect(claimQuestReward(RESCUE_QUEST)).toBe('already-claimed');
  });
  it('requires Inspect, actual current-town Malah and the exact potion for Thaw', () => {
    track(PRISON_QUEST); useMapStore.setState({ currentSubAreaId: 'areas/act5-crystalline-passage' });
    expect(areaObjectTargets(5, 'areas/act5-crystalline-passage')).not.toContain('objects/frozen_anya');
    expect(interactWithAreaObject('objects/frozen_anya')).toBe('not-eligible');
    expect(executeAct5QuestAction(THAW_PROOF)).toBe('not-eligible');
    expect(executeAct5QuestAction(INSPECT_PROOF)).toBe('ok');
    vi.mocked(towns.loadTownNpcs).mockImplementation(act => act === 5 ? [] : originalTownNpcs(act));
    expect(executeAct5QuestAction(POTION_SOURCE)).toBe('not-eligible');
    vi.mocked(towns.loadTownNpcs).mockImplementation(act => act === 5
      ? [{ id: 'npc/malah', portraitId: 'malah', nameKey: 'town.npc.malah' }] : originalTownNpcs(act));
    useMapStore.setState({ currentSubAreaId: null });
    expect(executeAct5QuestAction(POTION_SOURCE)).toBe('ok');
    expect(executeAct5QuestAction(THAW_PROOF)).toBe('not-eligible');
    useMapStore.setState({ currentSubAreaId: 'areas/act5-crystalline-passage' });
    expect(executeAct5QuestAction(THAW_PROOF)).toBe('ok'); expect(isAnyaThawed()).toBe(true);
    expect(useInventoryStore.getState().questItems[POTION_SOURCE]?.state).toBe('consumed');
    expect(canClaim(PRISON_QUEST)).toBe(false); expect(xp()).toBe(0);
  });
  it('pays Prison once with unread actual scroll, grants ten resistance only at Read, and preserves all six on recomposition', () => {
    rescue(); expect(claimQuestReward(RESCUE_QUEST)).toBe('ok'); thaw(); proof(PRISON_QUEST);
    const before = xp(); expect(claimQuestReward(PRISON_QUEST)).toBe('ok'); expect(xp()).toBe(before + 12000);
    expect(useInventoryStore.getState().questServices[`${PRISON_QUEST}#reward:service`]).toEqual({ serviceId: 'personalize_item', state: 'available' });
    expect(useInventoryStore.getState().questItems[SCROLL_SOURCE]).toEqual({ itemId: 'items/scroll_of_resist', state: 'owned' });
    expect(Object.values(player().derivedStats.resistances)).toEqual([5, 5, 5, 5, 5, 5]);
    expect(readQuestItem(SCROLL_SOURCE)).toBe('ok');
    expect(Object.values(player().derivedStats.resistances)).toEqual([15, 15, 15, 15, 15, 15]);
    expect(player().derivedStats.magicResist).toBe(0); expect(player().derivedStats.life).toBe(17);
    const settled = bytes(); expect(readQuestItem(SCROLL_SOURCE)).toBe('already-consumed'); expect(bytes()).toBe(settled);
    const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
    expect(deriveEquippedPlayerStats(player(), player().level, {}, map.questProgress, items, map.questReceipts).resistances)
      .toEqual(player().derivedStats.resistances);
    expect(decodeSave(required(snapshotStores())).map.questReceipts[READ_PROOF]).toBe(true);
  });
  it('permits fresh explicit thaw repair of claimed history without recreating its missing scroll or reward', () => {
    track(PRISON_QUEST, true, true); const before = xp();
    useMapStore.setState({ currentSubAreaId: 'areas/act5-crystalline-passage' });
    expect(executeAct5QuestAction(INSPECT_PROOF)).toBe('ok'); expect(executeAct5QuestAction(POTION_SOURCE)).toBe('ok');
    expect(executeAct5QuestAction(THAW_PROOF)).toBe('ok');
    expect(isAnyaThawed()).toBe(true); expect(claimQuestReward(PRISON_QUEST)).toBe('already-claimed');
    expect(useInventoryStore.getState().questItems[SCROLL_SOURCE]).toBeUndefined(); expect(xp()).toBe(before);
    expect(useInventoryStore.getState().questServices).toEqual({});
  });
  it('grants source-specific Siege service and exact Eve title/profile ownership only at Claim', () => {
    proof('quests/act5-siege-on-harrogath'); expect(claimQuestReward('quests/act5-siege-on-harrogath')).toBe('ok');
    expect(useInventoryStore.getState().questServices['quests/act5-siege-on-harrogath#reward:service'])
      .toEqual({ serviceId: 'socket_item', state: 'available' });
    proof(EVE_QUEST); expect(useMapStore.getState().questTitles).toEqual({});
    expect(claimQuestReward(EVE_QUEST)).toBe('ok');
    expect(useMapStore.getState().questTitles).toEqual({ [BAAL_TITLE]: true });
    expect(useMapStore.getState().questDifficulties).toEqual({ [NIGHTMARE_UNLOCK]: true });
    expect(selectQuestTitle(BAAL_TITLE)).toBe('ok'); expect(useMapStore.getState().selectedTitle).toBe(BAAL_TITLE);
    expect(selectQuestTitle(null)).toBe('ok'); expect(useMapStore.getState().selectedTitle).toBeNull();
  });
  it('refuses Normal quest actions under Nightmare selection without writing', () => {
    track(PRISON_QUEST); useMapStore.setState({ selectedDifficulty: 'nightmare', currentSubAreaId: 'areas/act5-crystalline-passage' });
    const before = bytes(); expect(act5QuestActionStatus(INSPECT_PROOF)).toBe('unavailable');
    expect(executeAct5QuestAction(INSPECT_PROOF)).toBe('not-eligible'); expect(bytes()).toBe(before);
  });
});

describe('Act V reciprocal source validation and shared transaction guard', () => {
  it.each(['claim', 'read'] as const)('guards every %s publication and rollback, preserving retry and unrelated writes', operation => {
    thaw(); proof(PRISON_QUEST);
    if (operation === 'read') expect(claimQuestReward(PRISON_QUEST)).toBe('ok');
    const before = bytes(), attempts: string[] = [];
    const observe = () => { expect(() => snapshotStores()).toThrow('questBusy');
      expect(() => reserveWaveRestore()).toThrow('questBusy'); attempts.push('guarded'); };
    subscriptions.push(usePlayerStore.subscribe(observe), useInventoryStore.subscribe(observe), useMapStore.subscribe(observe));
    if (operation === 'claim') {
      const original = useMapStore.getState().markQuestRewardClaimed;
      vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementationOnce(id => { original(id); throw new Error('claim receipt'); });
    } else {
      const real = useMapStore.setState;
      vi.spyOn(useMapStore, 'setState').mockImplementationOnce(value => { real(value); throw new Error('Read receipt'); });
    }
    const execute = () => operation === 'claim' ? claimQuestReward(PRISON_QUEST) : readQuestItem(SCROLL_SOURCE);
    expect(execute()).toBe('grant-failed'); subscriptions.splice(0).forEach(stop => { stop(); });
    expect(attempts.length).toBeGreaterThanOrEqual(5); expect(bytes()).toBe(before);
    vi.restoreAllMocks(); expect(execute()).toBe('ok');
  });
  it.each(['inspect', 'potion', 'thaw', 'victory', 'read'])('rejects missing %s graph edge before Claim or Read', fault => {
    thaw(); proof(PRISON_QUEST); expect(claimQuestReward(PRISON_QUEST)).toBe('ok');
    const map = useMapStore.getState(), receipts = { ...map.questReceipts }, items = { ...useInventoryStore.getState().questItems };
    const source = fault === 'inspect' ? INSPECT_PROOF : fault === 'potion' ? POTION_SOURCE : fault === 'thaw' ? THAW_PROOF
      : fault === 'victory' ? required(ACT5_ENCOUNTERS.find(row => row.questId === PRISON_QUEST)).proof : READ_PROOF;
    if (fault === 'read') items[SCROLL_SOURCE] = { itemId: 'items/scroll_of_resist', state: 'consumed' };
    else Reflect.deleteProperty(receipts, source);
    expect(() => validateQuestItemLedger(items, map.questProgress, receipts)).toThrow();
  });
  it('excludes supported snapshots/restores during every action publication and its rollback, then permits a retry', () => {
    track(PRISON_QUEST); useMapStore.setState({ currentSubAreaId: 'areas/act5-crystalline-passage' });
    const before = bytes(), attempts: string[] = [];
    const observe = () => {
      expect(() => snapshotStores()).toThrow('questBusy');
      expect(() => reserveWaveRestore()).toThrow('questBusy'); attempts.push('guarded');
    };
    const stopInventory = useInventoryStore.subscribe(observe), stopMap = useMapStore.subscribe(observe);
    subscriptions.push(stopInventory, stopMap);
    const real = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce(value => { real(value); throw new Error('after publication'); });
    expect(executeAct5QuestAction(INSPECT_PROOF)).toBe('grant-failed');
    stopInventory(); stopMap(); expect(attempts.length).toBeGreaterThanOrEqual(4); expect(bytes()).toBe(before);
    vi.restoreAllMocks(); const lease = reserveWaveRestore(); releaseWaveRestore(lease);
    expect(executeAct5QuestAction(INSPECT_PROOF)).toBe('ok');
  });
});
