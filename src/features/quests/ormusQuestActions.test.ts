/** Constructed valid clear graph; native earning is covered in ormus-native.test.ts. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { ORMUS } from '@/engine/map/ormus-quest';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { __resetPersistenceForTests, snapshotStores, useHydrationStore } from '@/stores/persistence';
import { withQuestTransaction } from './questTransaction';
import { isOrmusTownPresent, ormusTalkStatus, talkToOrmus } from './ormusQuestActions';

const stores = [useMapStore, usePlayerStore, useInventoryStore, useMercStore,
  useCombatStore, useMetaStore, useFormationStore] as const;
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function arrange() {
  usePlayerStore.getState().setPlayer(createMockPlayer('Ormus Talk', 'sorceress'));
  useMapStore.setState({ currentAct: 3, currentSubAreaId: ORMUS.area, selectedDifficulty: 'normal',
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'],
    questProgress: { [ORMUS.quest]: { id: ORMUS.quest, status: 'inProgress', rewardClaimed: false,
      objectives: { [ORMUS.first]: true, [ORMUS.talk]: false } } }, questReceipts: { [ORMUS.proof]: true } });
}
function state() {
  return structuredClone(stores.map(store => Object.fromEntries(Object.entries(store.getState())
    .filter(([, value]) => typeof value !== 'function'))));
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); arrange(); });
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });

describe('protected actual current-town Ormus Talk', () => {
  it('completes ordered Talk with remembered field selection, no income, and durable proof', () => {
    expect(isOrmusTownPresent()).toBe(true); expect(ormusTalkStatus()).toBe('ready');
    const hero = structuredClone(usePlayerStore.getState().player), inventory = useInventoryStore.getState();
    expect(talkToOrmus()).toBe('ok');
    expect(useMapStore.getState().questProgress[ORMUS.quest]).toMatchObject({ status: 'completed', rewardClaimed: false,
      objectives: { [ORMUS.first]: true, [ORMUS.talk]: true } });
    expect(useMapStore.getState().questReceipts).toEqual({ [ORMUS.proof]: true });
    expect(usePlayerStore.getState().player).toEqual(hero);
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(ormusTalkStatus()).toBe('completed');
    const save = snapshotStores(); if (!save) throw new Error('Missing Talk save');
    expect(decodeSave(toJsonSafe(save))).toEqual(save);
    const before = state(); expect(talkToOrmus()).toBe('already-read'); expect(state()).toEqual(before);
  });
  it.each(['proofless', 'copied-talk', 'claimed', 'wrong-act', 'locked-act', 'nightmare'] as const)(
    'does not complete Talk for %s history/context', context => {
      const map = useMapStore.getState();
      if (context === 'proofless' || context === 'copied-talk') useMapStore.setState({ questReceipts: {} });
      if (context === 'copied-talk') useMapStore.setState({ questProgress: { [ORMUS.quest]: {
        id: ORMUS.quest, status: 'completed', rewardClaimed: false, objectives: { [ORMUS.first]: true, [ORMUS.talk]: true } } } });
      if (context === 'claimed') useMapStore.setState({ questProgress: { [ORMUS.quest]: {
        id: ORMUS.quest, status: 'completed', rewardClaimed: true, objectives: { [ORMUS.first]: true, [ORMUS.talk]: true } } } });
      if (context === 'wrong-act') useMapStore.setState({ currentAct: 2 });
      if (context === 'locked-act') useMapStore.setState({ clearedSubAreas: [] });
      if (context === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
      const before = state(); expect(ormusTalkStatus()).toBe('unavailable');
      expect(talkToOrmus()).toBe('not-eligible'); expect(state()).toEqual(before);
      expect(map.questReceipts[ORMUS.proof]).toBe(true);
    });
  it('refuses readiness/combat/hero absence and nested actions before writes', () => {
    useHydrationStore.getState().setStatus('loading'); let before = state();
    expect(talkToOrmus()).toBe('not-ready'); expect(state()).toEqual(before);
    useHydrationStore.getState().setStatus('ready'); useCombatStore.setState({ inCombat: true }); before = state();
    expect(talkToOrmus()).toBe('combat-active'); expect(state()).toEqual(before);
    useCombatStore.setState({ inCombat: false }); usePlayerStore.setState({ player: null }); before = state();
    expect(talkToOrmus()).toBe('no-player'); expect(state()).toEqual(before);
    arrange(); before = state();
    expect(withQuestTransaction(() => talkToOrmus())).toBe('claim-in-progress'); expect(state()).toEqual(before);
  });
  it.each(['throw', 'silent', 'mutate-row', 'mutate-proof'] as const)(
    'restores deep own row/proof values on %s publication failure and preserves unrelated writes', fault => {
      const before = structuredClone(useMapStore.getState().questProgress[ORMUS.quest]);
      const set = useMapStore.setState; let triggered = false;
      vi.spyOn(useMapStore, 'setState').mockImplementation((...args) => {
        if (triggered) { set(...args); return; }
        const current = useMapStore.getState(), update = args[0];
        const next = typeof update === 'function' ? update(current) : update;
        if (next.questProgress?.[ORMUS.quest]?.objectives[ORMUS.talk] !== true) { set(...args); return; }
        triggered = true;
        if (fault === 'silent') return;
        set(...args);
        set(state => ({ questProgress: { ...state.questProgress,
          observer: { id: 'observer', status: 'inProgress', objectives: {} } } }));
        if (fault === 'throw') throw new Error('Talk setter failed');
        if (fault === 'mutate-row') {
          const row = useMapStore.getState().questProgress[ORMUS.quest];
          if (row) Object.assign(row.objectives, { [ORMUS.first]: false });
        }
        if (fault === 'mutate-proof') Reflect.deleteProperty(useMapStore.getState().questReceipts, ORMUS.proof);
      });
      expect(talkToOrmus()).toBe('grant-failed'); expect(triggered).toBe(true);
      expect(useMapStore.getState().questProgress[ORMUS.quest]).toEqual(before);
      expect(useMapStore.getState().questReceipts[ORMUS.proof]).toBe(true);
      if (fault !== 'silent') expect(useMapStore.getState().questProgress).toHaveProperty('observer');
    });
  it('reports restoration failure explicitly after attempting both own journal participants', () => {
    const set = useMapStore.setState; let written = false;
    vi.spyOn(useMapStore, 'setState').mockImplementation((...args) => {
      if (written) return;
      written = true; set(...args); throw new Error('Talk write then refused restore');
    });
    expect(() => talkToOrmus()).toThrow(AggregateError);
  });
});
