import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { COW } from '@/engine/map/cow-quest';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { recoverQuestTool, questToolStatus } from './interactObject';
import { canClaim } from './claimReward';
import { canSelectCowEncounter, canStartCowEncounter, cowQuestStage, cowRecoveryStatus, cowTomeStatus, cowTransmuteStatus,
  receiveCowTome, transmuteCowPortal, travelToCowEncounter } from './cowQuestActions';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Cow source fixture'); return value; }
const hero = () => required(usePlayerStore.getState().player);
function cube() {
  const id = 'quests/act2-horadric-staff';
  useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [id]: { id, status: 'inProgress', rewardClaimed: false,
    objectives: { 'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } } } }));
  useInventoryStore.setState(state => ({ questItems: { ...state.questItems, [COW.cubeSource]: { itemId: COW.cubeItemId, state: 'owned' } } }));
}
function leg() { expect(recoverQuestTool(COW.legSource)).toBe('ok'); }
function tome() { leg(); expect(receiveCowTome()).toBe('ok'); }
function open() { tome(); cube(); expect(transmuteCowPortal()).toBe('ok'); }
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  const player = createMockPlayer('Cow source', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, equipment: [], derivedStats: { ...player.derivedStats, defense: 777, life: 3, mana: 2 } });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: COW.area, selectedDifficulty: 'normal', clearedSubAreas: [COW.area],
    questProgress: { [COW.quest]: { id: COW.quest, status: 'inProgress', rewardClaimed: false,
      objectives: { [COW.legObjective]: false, [COW.portalObjective]: false } } } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });
describe('public Cow physical chain', () => {
  it('recovers the exact Leg once after the exact clear without changing accepted caches, resources or income', () => {
    const before = structuredClone(hero()); expect(cowRecoveryStatus()).toBe('ready');
    expect(questToolStatus(COW.legSource)).toBe('ready'); leg();
    expect(useInventoryStore.getState().questItems[COW.legSource]).toEqual({ itemId: COW.legItemId, state: 'owned' });
    expect(useMapStore.getState().questProgress[COW.quest]?.objectives[COW.legObjective]).toBe(true);
    expect(hero()).toEqual(before); expect(recoverQuestTool(COW.legSource)).toBe('already-owned');
    expect(useInventoryStore.getState().currencies).toEqual({}); expect(useInventoryStore.getState().backpack).toEqual([]);
  });
  it.each(['no-clear', 'wrong-area', 'wrong-act', 'wrong-difficulty', 'dead', 'hydrating'] as const)('refuses Leg at %s without publication', fault => {
    if (fault === 'no-clear') useMapStore.setState({ clearedSubAreas: [] });
    if (fault === 'wrong-area') useMapStore.setState({ currentSubAreaId: 'areas/act1-blood-moor' });
    if (fault === 'wrong-act') useMapStore.setState({ currentAct: 2 });
    if (fault === 'wrong-difficulty') useMapStore.setState({ selectedDifficulty: 'hell' });
    if (fault === 'dead') Object.assign(hero().derivedStats, { life: 0 });
    if (fault === 'hydrating') useHydrationStore.getState().setStatus('idle');
    const before = structuredClone({ hero: hero(), items: useInventoryStore.getState().questItems, rows: useMapStore.getState().questProgress });
    expect(cowRecoveryStatus()).toBe('unavailable'); expect(recoverQuestTool(COW.legSource)).not.toBe('ok');
    expect({ hero: hero(), items: useInventoryStore.getState().questItems, rows: useMapStore.getState().questProgress }).toEqual(before);
  });
  it('receives the real Tome with its exact proof before Cube, then consumes exactly both inputs and retains Cube', () => {
    const before = structuredClone(hero()); expect(cowQuestStage()).toBe('need-leg');
    expect(receiveCowTome()).toBe('not-eligible'); leg(); expect(cowQuestStage()).toBe('need-tome');
    expect(cowTomeStatus()).toBe('ready'); expect(receiveCowTome()).toBe('ok');
    expect(cowQuestStage()).toBe('need-cube'); expect(receiveCowTome()).toBe('already-owned');
    expect(useMapStore.getState().questReceipts).toEqual({ [COW.tomeSource]: true });
    expect(transmuteCowPortal()).toBe('not-eligible'); cube(); expect(cowTransmuteStatus()).toBe('ready');
    const location = useMapStore.getState().currentSubAreaId; expect(transmuteCowPortal()).toBe('ok');
    expect(useInventoryStore.getState().questItems).toEqual({ [COW.legSource]: { itemId: COW.legItemId, state: 'consumed' },
      [COW.tomeSource]: { itemId: COW.tomeItemId, state: 'consumed' }, [COW.cubeSource]: { itemId: COW.cubeItemId, state: 'owned' } });
    expect(useMapStore.getState().questReceipts).toEqual({ [COW.tomeSource]: true, [COW.openProof]: true });
    expect(useMapStore.getState().questProgress[COW.quest]).toMatchObject({ status: 'completed', rewardClaimed: false });
    expect(cowQuestStage()).toBe('portal-open'); expect(canClaim(COW.quest)).toBe(false); expect(transmuteCowPortal()).toBe('already-opened');
    expect(hero()).toEqual(before); expect(useMapStore.getState().currentSubAreaId).toBe(location);
    expect(useInventoryStore.getState().backpack).toEqual([]); expect(useInventoryStore.getState().currencies).toEqual({});
  });
  it.each(['wrong-act', 'wrong-difficulty', 'consumed-cube', 'wrong-cube', 'forged-tome'] as const)('refuses portal transmutation with %s', fault => {
    tome(); cube();
    if (fault === 'wrong-act') useMapStore.setState({ currentAct: 2 });
    if (fault === 'wrong-difficulty') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    if (fault === 'consumed-cube') useInventoryStore.setState(state => ({ questItems: { ...state.questItems, [COW.cubeSource]: { itemId: COW.cubeItemId, state: 'consumed' } } }));
    if (fault === 'wrong-cube') useInventoryStore.setState(state => ({ questItems: { ...state.questItems, [COW.cubeSource]: { itemId: COW.legItemId, state: 'owned' } } }));
    if (fault === 'forged-tome') useMapStore.setState({ questReceipts: {} });
    const before = structuredClone(useInventoryStore.getState().questItems); expect(transmuteCowPortal()).toBe('not-eligible');
    expect(useInventoryStore.getState().questItems).toEqual(before); expect(useMapStore.getState().questReceipts).not.toHaveProperty(COW.openProof);
  });
  it.each([false, true])('repairs sparse completed legacy physical chain without clearing later flags (claimed=%s)', claimed => {
    useMapStore.setState({ questProgress: { [COW.quest]: { id: COW.quest, status: 'completed', rewardClaimed: claimed, objectives: {} } } });
    expect(cowQuestStage()).toBe('need-leg'); open(); expect(canSelectCowEncounter()).toBe(true);
    expect(useMapStore.getState().questProgress[COW.quest]).toEqual({ id: COW.quest, status: 'completed', rewardClaimed: claimed,
      objectives: { [COW.legObjective]: true, [COW.portalObjective]: true } }); expect(canClaim(COW.quest)).toBe(false);
  });
  it('travels only after a full open graph; a victory proof closes both selection and entry', () => {
    expect(travelToCowEncounter()).toBe(false); open(); useMapStore.setState({ currentSubAreaId: 'areas/act1-blood-moor' });
    expect(canSelectCowEncounter()).toBe(true); expect(canStartCowEncounter()).toBe(false); expect(travelToCowEncounter()).toBe(true);
    expect(canStartCowEncounter()).toBe(true); useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts, [COW.victoryProof]: true } }));
    expect(cowQuestStage()).toBe('victorious'); expect(canSelectCowEncounter()).toBe(false); expect(travelToCowEncounter()).toBe(false);
  });
});
describe('scoped Cow source compensation', () => {
  it.each(['recover', 'receive', 'open'] as const)('restores %s source after observer failure, holding lease and preserving unrelated writes', action => {
    if (action !== 'recover') leg(); if (action === 'open') { expect(receiveCowTome()).toBe('ok'); cube(); }
    const before = structuredClone({ row: useMapStore.getState().questProgress[COW.quest], items: useInventoryStore.getState().questItems, receipts: useMapStore.getState().questReceipts });
    const beforeHero = structuredClone(hero()); let fired = false;
    stops.push(useInventoryStore.subscribe(() => { if (fired) return; fired = true;
      expect(receiveCowTome()).toBe('claim-in-progress'); useInventoryStore.getState().addCurrency('wishstone', 3);
      Object.assign(hero().derivedStats, { life: 1 }); throw new Error('source observer failure');
    }));
    const result = action === 'recover' ? recoverQuestTool(COW.legSource) : action === 'receive' ? receiveCowTome() : transmuteCowPortal();
    expect(result).toBe('grant-failed'); expect(fired).toBe(true);
    expect(useInventoryStore.getState().questItems).toEqual(before.items); expect(useMapStore.getState().questReceipts).toEqual(before.receipts);
    expect(useMapStore.getState().questProgress[COW.quest]).toEqual(before.row); expect(useInventoryStore.getState().currencies.wishstone).toBe(3);
    expect(hero()).toEqual({ ...beforeHero, derivedStats: { ...beforeHero.derivedStats, life: 1 } });
  });
  it('reports failed source restoration explicitly', () => {
    const original = useInventoryStore.setState; let calls = 0;
    vi.spyOn(useInventoryStore, 'setState').mockImplementation((...args) => { calls++; if (calls > 1) throw new Error('restore failed'); original(...args); throw new Error('publish failed'); });
    expect(() => recoverQuestTool(COW.legSource)).toThrow(AggregateError);
  });
});
