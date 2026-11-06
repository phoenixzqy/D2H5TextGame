import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { WARBAND, hasWarbandEnlistment } from '@/engine/map/warband-quest';
import { LIVE_ACT5_DOMAIN } from '@/engine/save/act5-state';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { withQuestTransaction } from '@/features/quests/questTransaction';
import { createMercFromDef } from '@/stores/mercFactory';
import { abortSubAreaRun, hasActiveSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import type { Item } from '@/engine/types/items';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, snapshotStores, useHydrationStore } from '@/stores/persistence';
import { canEnlistWarband, warbandEnlistCandidates, selectWarbandRecruit, currentWarbandRecruit, enlistWarband } from './warbandEnlist';

const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const unlock = useMapStore.getState().isActUnlocked;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Warband fixture'); return value; }
const def = required(loadMercPool().pool.find(row => row.id === WARBAND.mercId));
const map = () => useMapStore.getState(), mercs = () => useMercStore.getState();
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
const selectFresh = () => required(selectWarbandRecruit(null));
function own(suffix = 'retained') {
  const merc = createMercFromDef(def, suffix);
  Object.assign(merc.derivedStats, { life: 3, mana: 2 });
  mercs().addMerc(merc);
  useMercStore.setState(state => ({ mercProgress: { ...state.mercProgress, [merc.id]: { experience: 123, experienceToNextLevel: 777 } } }));
  return merc;
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Warband', 'sorceress'), level: 35, equipment: [] });
  useMapStore.setState({ currentAct: 5, currentSubAreaId: 'areas/act5-frigid-highlands', isActUnlocked: () => true,
    questProgress: {
      [WARBAND.prerequisite]: { id: WARBAND.prerequisite, status: 'completed', rewardClaimed: false, objectives: { [LIVE_ACT5_DOMAIN.rescueObjective]: true } },
      [WARBAND.quest]: { id: WARBAND.quest, status: 'inProgress', rewardClaimed: false, objectives: { [WARBAND.objective]: false } }
    }, questReceipts: Object.fromEntries(LIVE_ACT5_DOMAIN.cageProofs.map(proof => [proof, true as const])) });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); useMapStore.setState({ isActUnlocked: unlock }); __resetPersistenceForTests(); });

describe('Qual-Kehk explicit Warband enlistment', () => {
  it('creates/fields only the exact fresh recruit and publishes the historical proof before Rescue Claim', () => {
    const hero = structuredClone(usePlayerStore.getState().player), inv = JSON.stringify(useInventoryStore.getState());
    expect(canEnlistWarband()).toBe(true); expect(warbandEnlistCandidates()).toEqual([]);
    expect(enlistWarband(selectFresh())).toBe('ok');
    expect(mercs().ownedMercs).toEqual([createMercFromDef(def)]); expect(mercs().fieldedMercId).toBe(def.id);
    expect(mercs().mercProgress[def.id]?.experience).toBe(0);
    expect(usePlayerStore.getState().player).toEqual(hero); expect(JSON.stringify(useInventoryStore.getState())).toBe(inv);
    expect(map().questProgress[WARBAND.prerequisite]?.rewardClaimed).toBe(false);
    expect(hasWarbandEnlistment(map().questProgress, map().questReceipts, {})).toBe(true);
    const before = bytes(); expect(enlistWarband(null)).toBe('not-eligible'); expect(bytes()).toBe(before);
  });
  it.each([false, true])('re-enlists an actual suffixed choice preserving all instances/XP/resources (already fielded=%s)', fielded => {
    const first = own('first'), chosen = own('second'); mercs().setFieldedMerc(fielded ? chosen.id : first.id);
    const before = structuredClone({ owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress });
    expect(warbandEnlistCandidates()).toEqual([first, chosen]); expect(selectWarbandRecruit(null)).toBeNull();
    const selection = required(selectWarbandRecruit(chosen)); expect(currentWarbandRecruit(selection)).toBe(chosen);
    expect(enlistWarband(selection)).toBe('ok'); expect(mercs().fieldedMercId).toBe(chosen.id);
    expect({ owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress }).toEqual(before);
    expect(mercs().ownedMercs[1]).toBe(chosen);
  });
  it('ownership and generic hire never publish proof; completed proofless history still needs confirmation', () => {
    expect(mercs().hireMerc(def).ok).toBe(true); expect(map().questReceipts[WARBAND.proof]).toBeUndefined();
    map().updateQuestProgress(WARBAND.quest, { status: 'completed', objectives: { [WARBAND.objective]: true } });
    expect(enlistWarband(required(selectWarbandRecruit(required(mercs().ownedMercs[0]))))).toBe('ok');
  });
  it.each(['missing-rescue', 'missing-cage', 'incomplete', 'claimed', 'wrong-side-id', 'extra-objective', 'level', 'act', 'locked', 'nightmare', 'loading', 'no-player', 'combat', 'orphan-progress'] as const)('refuses %s without publication', fault => {
    const selection = selectFresh();
    if (fault === 'missing-rescue') useMapStore.setState(state => { const rows = { ...state.questProgress }; Reflect.deleteProperty(rows, WARBAND.prerequisite); return { questProgress: rows }; });
    if (fault === 'missing-cage') useMapStore.setState(state => { const proofs = { ...state.questReceipts }; Reflect.deleteProperty(proofs, required(LIVE_ACT5_DOMAIN.cageProofs[0])); return { questReceipts: proofs }; });
    if (fault === 'incomplete') map().updateQuestProgress(WARBAND.prerequisite, { status: 'inProgress' });
    if (fault === 'claimed') map().updateQuestProgress(WARBAND.quest, { rewardClaimed: true });
    if (fault === 'wrong-side-id') map().updateQuestProgress(WARBAND.quest, { id: 'wrong' });
    if (fault === 'extra-objective') map().updateQuestProgress(WARBAND.quest, { objectives: { [WARBAND.objective]: false, extra: false } });
    if (fault === 'level') Object.assign(required(usePlayerStore.getState().player), { level: 34 });
    if (fault === 'act') useMapStore.setState({ currentAct: 4 });
    if (fault === 'locked') useMapStore.setState({ isActUnlocked: () => false });
    if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
    if (fault === 'no-player') usePlayerStore.getState().reset();
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    if (fault === 'orphan-progress') useMercStore.setState({ mercProgress: { [def.id]: { experience: 99, experienceToNextLevel: 777 } } });
    const before = bytes(); expect(enlistWarband(selection)).toBe(fault === 'loading' ? 'not-ready' : fault === 'no-player' ? 'no-player' : fault === 'combat' ? 'combat-active' : 'not-eligible'); expect(bytes()).toBe(before);
  });
  it.each(['lookalike', 'replace', 'mutate', 'progress', 'remove', 'new-owner', 'hero'] as const)('refuses stale %s witness', fault => {
    const merc = own(), selection = required(selectWarbandRecruit(merc));
    if (fault === 'lookalike') { expect(selectWarbandRecruit(structuredClone(merc))).toBeNull(); return; }
    if (fault === 'replace') useMercStore.setState({ ownedMercs: [structuredClone(merc)] });
    if (fault === 'mutate') Object.assign(merc.derivedStats, { life: merc.derivedStats.life + 1 });
    if (fault === 'progress') required(mercs().mercProgress[merc.id]).experience++;
    if (fault === 'remove') mercs().removeMerc(merc.id);
    if (fault === 'new-owner') { const fresh = selectWarbandRecruit(null); expect(fresh).toBeNull(); return; }
    if (fault === 'hero') usePlayerStore.setState({ player: structuredClone(usePlayerStore.getState().player) });
    const before = bytes(); expect(currentWarbandRecruit(selection)).toBeNull(); expect(enlistWarband(selection)).toBe('not-eligible'); expect(bytes()).toBe(before);
  });
  it('holds the shared lease through roster/proof publication and releases it after faults', () => {
    const selection = selectFresh(); expect(withQuestTransaction(() => enlistWarband(selection))).toBe('claim-in-progress');
    stops.push(useMercStore.subscribe(() => { expect(enlistWarband(selection)).toBe('claim-in-progress'); expect(() => snapshotStores()).toThrow('questBusy'); }));
    expect(enlistWarband(selection)).toBe('ok');
  });
  it('refuses a retained fresh choice after matching ownership appears', () => {
    const selection = selectFresh(), actual = own('arrived-after-preview'), before = bytes();
    expect(enlistWarband(selection)).toBe('not-eligible'); expect(bytes()).toBe(before);
    expect(mercs().ownedMercs).toEqual([actual]); expect(map().questReceipts[WARBAND.proof]).toBeUndefined();
  });
  it('rejects and removes a silent duplicate of participating gear while preserving unrelated currency', () => {
    const chosen = own(), blade: Item = { id: 'owned-warband-blade', baseId: 'items/base/wp1h-short-sword', rarity: 'normal',
      level: 1, equipped: true, identified: true, affixes: [] };
    Object.assign(chosen, { equipment: [blade] });
    useMercStore.setState({ mercEquipment: { [chosen.id]: { weapon: blade } } });
    const selection = required(selectWarbandRecruit(chosen)), before = structuredClone({ owned: mercs().ownedMercs,
      equipment: mercs().mercEquipment, progress: mercs().mercProgress, field: mercs().fieldedMercId,
      rows: map().questProgress, proofs: map().questReceipts, stash: useInventoryStore.getState().stash });
    let fired = false;
    stops.push(useMapStore.subscribe(() => {
      if (fired) return; fired = true;
      useInventoryStore.setState(state => ({ stash: [...state.stash, structuredClone(blade)], currencies: { ...state.currencies, gems: 7 } }));
    }));
    expect(enlistWarband(selection)).toBe('grant-failed');
    expect({ owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress, field: mercs().fieldedMercId,
      rows: map().questProgress, proofs: map().questReceipts, stash: useInventoryStore.getState().stash }).toEqual(before);
    expect(useInventoryStore.getState().currencies.gems).toBe(7);
  });
  it('refuses an actual active run even while combat presentation is paused', () => {
    const selection = selectFresh(); useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    useCombatStore.setState({ inCombat: false }); expect(hasActiveSubAreaRun()).toBe(true);
    const before = bytes(); expect(enlistWarband(selection)).toBe('combat-active'); expect(bytes()).toBe(before);
  });
  it('refuses a deep equipment Map mutation after actual owned selection', () => {
    const chosen = own(), values = new Map([['statMods.life', 7]]), blade: Item = { id: 'retained-blade', baseId: 'items/base/wp1h-short-sword', rarity: 'magic',
      level: 1, equipped: true, identified: true, affixes: [{ affixId: 'retained', values }] };
    useMercStore.setState({ mercEquipment: { [chosen.id]: { weapon: blade } } });
    const selection = required(selectWarbandRecruit(chosen)); values.set('statMods.life', 999);
    const before = bytes(); expect(currentWarbandRecruit(selection)).toBeNull(); expect(enlistWarband(selection)).toBe('not-eligible'); expect(bytes()).toBe(before);
  });
  it.each(['throw-after-roster', 'silent-roster', 'throw-after-proof', 'rename-created'] as const)('restores absent ownership after fresh %s', fault => {
    const selection = selectFresh(), before = structuredClone({ merc: { owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress, field: mercs().fieldedMercId }, rows: map().questProgress, proofs: map().questReceipts });
    if (fault === 'rename-created') {
      let fired = false; stops.push(useMercStore.subscribe(() => { if (!fired && mercs().ownedMercs.length > 0) { fired = true; Object.assign(required(mercs().ownedMercs[0]), { id: 'renamed-created' }); } }));
    } else if (fault === 'throw-after-proof') {
      const real = useMapStore.setState;
      vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => { real(...args); throw new Error('after publication'); });
    } else {
      const real = useMercStore.setState;
      vi.spyOn(useMercStore, 'setState').mockImplementationOnce((...args) => { if (fault === 'silent-roster') return; real(...args); throw new Error('after publication'); });
    }
    expect(enlistWarband(selection)).toBe('grant-failed');
    expect({ merc: { owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress, field: mercs().fieldedMercId }, rows: map().questProgress, proofs: map().questReceipts }).toEqual(before);
  });
  it.each(['throw-before', 'throw-after', 'silent', 'merc-mutate', 'proof-mutate', 'field-mutate'] as const)('rolls back %s with unrelated currencies/journal preserved', fault => {
    const chosen = own(), selection = required(selectWarbandRecruit(chosen));
    const before = structuredClone({ owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress, field: mercs().fieldedMercId,
      rows: map().questProgress, proofs: map().questReceipts });
    if (fault === 'throw-before' || fault === 'throw-after' || fault === 'silent') {
      const real = useMercStore.setState;
      vi.spyOn(useMercStore, 'setState').mockImplementationOnce(update => { if (fault === 'throw-before') throw new Error('before'); if (fault === 'silent') return; real(update); throw new Error('after'); });
    } else {
      let fired = false;
      stops.push(useMapStore.subscribe(() => {
        if (fired) return; fired = true;
        useInventoryStore.setState(state => ({ currencies: { ...state.currencies, gems: 7 } }));
        if (fault === 'merc-mutate') Object.assign(chosen.derivedStats, { life: 999 });
        if (fault === 'proof-mutate') useMapStore.setState(state => { const proofs = { ...state.questReceipts }; Reflect.deleteProperty(proofs, WARBAND.proof); return { questReceipts: proofs }; });
        if (fault === 'field-mutate') mercs().setFieldedMerc(null);
      }));
    }
    expect(enlistWarband(selection)).toBe('grant-failed');
    expect({ owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress, field: mercs().fieldedMercId,
      rows: map().questProgress, proofs: map().questReceipts }).toEqual(before);
    if (fault.endsWith('mutate')) expect(useInventoryStore.getState().currencies.gems).toBe(7);
  });
});
