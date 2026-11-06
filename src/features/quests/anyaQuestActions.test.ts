/** Constructed Anya capabilities; no owner-earned campaign or pacing claim. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadQuests } from '@/data/loaders/quests';
import { ACT5_ENCOUNTERS, PRISON_QUEST } from '@/engine/map/act5-admission';
import { INSPECT_PROOF, POTION_SOURCE, THAW_PROOF } from '@/engine/save/act5-state';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore,
  useMetaStore, usePlayerStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { executeAct5QuestAction } from './act5QuestActions';
import { canClaim, claimQuestReward } from './claimReward';
import { talkToAnya } from './anyaQuestActions';

const Q = 'quests/side-act5-anyas-gift', TALK = `${Q}#action:talk-anya`;
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore] as const;
const stops: (() => void)[] = [];
const originalUnlock = useMapStore.getState().isActUnlocked;
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Anya capability fixture');
  return value;
}
function track(id: string, completed: boolean, claimed = false): void {
  const definition = required(loadQuests().find(row => row.id === id));
  useMapStore.getState().updateQuestProgress(id, { id, status: completed ? 'completed' : 'inProgress', rewardClaimed: claimed,
    objectives: Object.fromEntries(definition.objectives.map(objective => [objective.id, completed])) });
}
function repairedHistoricalThaw(): void {
  track(PRISON_QUEST, true, true); track(Q, false);
  useMapStore.setState({ currentSubAreaId: 'areas/act5-crystalline-passage' });
  expect(executeAct5QuestAction(INSPECT_PROOF)).toBe('ok');
  expect(executeAct5QuestAction(POTION_SOURCE)).toBe('ok');
  expect(executeAct5QuestAction(THAW_PROOF)).toBe('ok');
  expect(useInventoryStore.getState().questItems[POTION_SOURCE]?.state).toBe('consumed');
  expect(Object.hasOwn(useMapStore.getState().questReceipts, required(ACT5_ENCOUNTERS.find(row => row.questId === PRISON_QUEST)).proof)).toBe(false);
}
function payments() {
  const inv = useInventoryStore.getState();
  return structuredClone({ hero: usePlayerStore.getState().player, mercs: useMercStore.getState().ownedMercs,
    progress: useMercStore.getState().mercProgress, currencies: inv.currencies, materials: inv.materials,
    backpack: inv.backpack, services: inv.questServices });
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  const actor = createMockPlayer('Anya source', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...actor, derivedStats: { ...actor.derivedStats, life: 7, mana: 2 } });
  useMapStore.setState({ currentAct: 5, currentSubAreaId: null, isActUnlocked: () => true });
});
afterEach(() => {
  stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); useMapStore.setState({ isActUnlocked: originalUnlock }); __resetPersistenceForTests();
});

describe('actual Anya Talk and separate resistance-only Claim', () => {
  it('earns exact Talk proof from real thaw repair of completed historical Prison without paying anything', () => {
    repairedHistoricalThaw(); const before = payments();
    useMapStore.getState().recordNpcTalk('npc/anya');
    expect(useMapStore.getState().questProgress[Q]).toMatchObject({ status: 'completed', objectives: { 'obj-talk': true }, rewardClaimed: false });
    expect(useMapStore.getState().questReceipts[TALK]).toBe(true);
    expect(payments()).toEqual(before);
  });

  it('separately claims the side protection and charge after real historical-main thaw without reearning its victory', () => {
    repairedHistoricalThaw(); useMapStore.getState().recordNpcTalk('npc/anya');
    const before = payments(), oldHero = required(before.hero);
    expect(claimQuestReward(Q)).toBe('ok');
    const next = required(usePlayerStore.getState().player);
    expect(Object.values(next.derivedStats.resistances)).toEqual([10, 10, 10, 10, 10, 10]);
    expect({ ...next, derivedStats: { ...next.derivedStats, resistances: oldHero.derivedStats.resistances } }).toEqual(oldHero);
    expect(useInventoryStore.getState().questServices[`${Q}#reward:service`]).toEqual({ serviceId: 'personalize_item', state: 'available' });
    expect(useInventoryStore.getState().questServices[`${PRISON_QUEST}#reward:service`]).toBeUndefined();
    expect(useInventoryStore.getState().currencies).toEqual(before.currencies);
    expect(useInventoryStore.getState().backpack).toEqual(before.backpack);
  });
});

describe('Anya actual Talk context and scoped fault handling', () => {
  it('repairs completed unclaimed side only through actual Anya and rejects repeated or claimed legacy Talk', () => {
    repairedHistoricalThaw(); track(Q, true); useMapStore.getState().recordNpcTalk('npc/malah');
    expect(canClaim(Q)).toBe(false); expect(talkToAnya()).toBe('ok'); expect(talkToAnya()).toBe('already-talked');
    expect(claimQuestReward(Q)).toBe('ok'); expect(talkToAnya()).toBe('already-talked');
  });
  it.each(['wrong-act', 'locked-act', 'untracked', 'legacy-claimed', 'missing-thaw', 'dead', 'hydrating', 'combat'] as const)(
    'refuses %s without payment or proof', fault => {
      repairedHistoricalThaw();
      if (fault === 'wrong-act') useMapStore.setState({ currentAct: 4 });
      if (fault === 'locked-act') useMapStore.setState({ isActUnlocked: () => false });
      if (fault === 'untracked') useMapStore.setState(state => { const progress = { ...state.questProgress }; Reflect.deleteProperty(progress, Q); return { questProgress: progress }; });
      if (fault === 'legacy-claimed') track(Q, true, true);
      if (fault === 'missing-thaw') useMapStore.setState(state => { const receipts = { ...state.questReceipts }; Reflect.deleteProperty(receipts, THAW_PROOF); return { questReceipts: receipts }; });
      if (fault === 'dead') Reflect.set(required(usePlayerStore.getState().player).derivedStats, 'life', 0);
      if (fault === 'hydrating') useHydrationStore.getState().setStatus('loading');
      if (fault === 'combat') useCombatStore.setState({ inCombat: true });
      const before = payments(); expect(talkToAnya()).not.toBe('ok');
      expect(useMapStore.getState().questReceipts[TALK]).toBeUndefined(); expect(payments()).toEqual(before);
    });
  it.each(['postthrow', 'silent-proof', 'independent-xp'] as const)('restores own Talk after %s and permits clean retry', fault => {
    repairedHistoricalThaw(); const row = structuredClone(useMapStore.getState().questProgress[Q]); let fired = false, nested: unknown;
    let expectedHero = structuredClone(usePlayerStore.getState().player);
    stops.push(useMapStore.subscribe(state => {
      if (fired || !state.questReceipts[TALK]) return; fired = true; nested = talkToAnya();
      useInventoryStore.getState().addCurrency('independent-talk', 3);
      if (fault === 'independent-xp') { usePlayerStore.getState().gainExperience(2); expectedHero = structuredClone(usePlayerStore.getState().player); }
      if (fault === 'silent-proof') { useMapStore.setState(next => { const receipts = { ...next.questReceipts }; Reflect.set(receipts, TALK, false); return { questReceipts: receipts }; }); }
      else throw new Error('Talk observer failure');
    }));
    expect(talkToAnya()).toBe('grant-failed'); expect(nested).toBe('claim-in-progress');
    expect(useMapStore.getState().questProgress[Q]).toEqual(row); expect(useMapStore.getState().questReceipts[TALK]).toBeUndefined();
    expect(useInventoryStore.getState().currencies['independent-talk']).toBe(3); expect(usePlayerStore.getState().player).toEqual(expectedHero);
    expect(talkToAnya()).toBe('ok');
  });
});
