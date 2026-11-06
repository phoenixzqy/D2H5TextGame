import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as quests from '@/data/loaders/quests';
import { loadMercPool } from '@/data/loaders/mercs';
import { hasWarbandEnlistment, WARBAND } from '@/engine/map/warband-quest';
import { LIVE_ACT5_DOMAIN } from '@/engine/save/act5-state';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { createMercFromDef } from '@/stores/mercFactory';
import { abortSubAreaRun, hasActiveSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, snapshotStores, useHydrationStore } from '@/stores/persistence';
import { canClaim, claimQuestReward } from './claimReward';
import { withQuestTransaction } from './questTransaction';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Warband Claim fixture'); return value; }
const def = required(loadMercPool().pool.find(row => row.id === WARBAND.mercId));
const map = () => useMapStore.getState(), mercs = () => useMercStore.getState();
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
function own(suffix = 'retained') {
  const merc = createMercFromDef(def, suffix); Object.assign(merc.derivedStats, { life: 3, mana: 2 });
  mercs().addMerc(merc); return merc;
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Warband Claim', 'sorceress'), equipment: [] });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: null,
    questProgress: {
      [WARBAND.prerequisite]: { id: WARBAND.prerequisite, status: 'completed', rewardClaimed: false, objectives: { [LIVE_ACT5_DOMAIN.rescueObjective]: true } },
      [WARBAND.quest]: { id: WARBAND.quest, status: 'completed', rewardClaimed: false, objectives: { [WARBAND.objective]: true } }
    }, questReceipts: { ...Object.fromEntries(LIVE_ACT5_DOMAIN.cageProofs.map(proof => [proof, true as const])), [WARBAND.proof]: true } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });
describe('Warband separate one-time ensure-owned Claim', () => {
  it.each([null, 'unrelated'] as const)('creates one dismissed recruit with10 wishes and preserves prior fielding=%s', field => {
    const other = own('other'); Object.assign(other, { id: 'mercs/act1-rogue-fire#existing' });
    mercs().setFieldedMerc(field ? other.id : null);
    const before = structuredClone({ hero: usePlayerStore.getState().player, inv: useInventoryStore.getState().currencies, field: mercs().fieldedMercId });
    expect(canClaim(WARBAND.quest)).toBe(true); expect(claimQuestReward(WARBAND.quest)).toBe('ok');
    expect(mercs().ownedMercs).toEqual([other, createMercFromDef(def)]); expect(mercs().fieldedMercId).toBe(before.field);
    expect(usePlayerStore.getState().player).toEqual(before.hero); expect(useInventoryStore.getState().currencies).toEqual({ ...before.inv, wishstone: 10 });
    expect(map().questProgress[WARBAND.prerequisite]?.rewardClaimed).toBe(false);
    const bytesBefore = bytes(); expect(claimQuestReward(WARBAND.quest)).toBe('already-claimed'); expect(bytes()).toBe(bytesBefore);
    mercs().removeMerc(def.id); expect(hasWarbandEnlistment(map().questProgress, map().questReceipts, {})).toBe(true);
    expect(claimQuestReward(WARBAND.quest)).toBe('already-claimed'); expect(mercs().ownedMercs).toEqual([other]);
  });
  it('preserves multiple owned suffixed copies and their exact gear/XP/resources without roster publication', () => {
    const first = own('first'), chosen = own('chosen'); mercs().setFieldedMerc(chosen.id);
    const before = structuredClone({ owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress });
    let writes = 0; stops.push(useMercStore.subscribe(() => { writes++; }));
    expect(claimQuestReward(WARBAND.quest)).toBe('ok'); expect(writes).toBe(0);
    expect({ owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress }).toEqual(before);
    expect(mercs().ownedMercs[0]).toBe(first); expect(mercs().ownedMercs[1]).toBe(chosen); expect(mercs().fieldedMercId).toBe(chosen.id);
  });
  it.each(['proofless', 'missing-cage', 'false-objective', 'nightmare', 'combat', 'loading', 'no-player', 'extra-reward', 'wrong-reward', 'orphan-progress'] as const)('refuses %s without granting or marking claimed', fault => {
    if (fault === 'proofless') useMapStore.setState(state => { const proofs = { ...state.questReceipts }; Reflect.deleteProperty(proofs, WARBAND.proof); return { questReceipts: proofs }; });
    if (fault === 'missing-cage') useMapStore.setState(state => { const proofs = { ...state.questReceipts }; Reflect.deleteProperty(proofs, required(LIVE_ACT5_DOMAIN.cageProofs[0])); return { questReceipts: proofs }; });
    if (fault === 'false-objective') map().updateQuestProgress(WARBAND.quest, { objectives: { [WARBAND.objective]: false } });
    if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
    if (fault === 'no-player') usePlayerStore.getState().reset();
    if (fault === 'extra-reward' || fault === 'wrong-reward') {
      const all = quests.loadQuests(); vi.spyOn(quests, 'loadQuests').mockReturnValue(all.map(row => row.id === WARBAND.quest
        ? { ...row, rewards: fault === 'extra-reward' ? { ...row.rewards, mercenaryUnlock: def.id, xp: 1 } : { ...row.rewards, mercenaryUnlock: 'wrong' } } : row));
    }
    if (fault === 'orphan-progress') useMercStore.setState({ mercProgress: { [def.id]: { experience: 99, experienceToNextLevel: 777 } } });
    const before = bytes(); expect(canClaim(WARBAND.quest)).toBe(false); expect(claimQuestReward(WARBAND.quest)).not.toBe('ok'); expect(bytes()).toBe(before);
  });
  it('keeps already-claimed proofless legacy history inert even if the recruit is absent', () => {
    useMapStore.setState({ questReceipts: {} }); map().updateQuestProgress(WARBAND.quest, { rewardClaimed: true });
    const before = bytes(); expect(claimQuestReward(WARBAND.quest)).toBe('already-claimed'); expect(bytes()).toBe(before);
  });
  it.each(['giver', 'type', 'act', 'prerequisite', 'objective', 'merc-id'] as const)('refuses canonical definition drift in %s despite retaining the reward', fault => {
    const all = quests.loadQuests(); vi.spyOn(quests, 'loadQuests').mockReturnValue(all.map(row => row.id !== WARBAND.quest ? row : { ...row,
      ...(fault === 'giver' ? { giver: 'npc/malah' } : fault === 'type' ? { type: 'main' as const } : fault === 'act' ? { actId: 'acts/act1' }
        : fault === 'prerequisite' ? { prerequisites: [] } : { objectives: row.objectives.map(objective => ({ ...objective,
          ...(fault === 'objective' ? { id: 'wrong' } : { mercId: 'wrong' }) })) }) }));
    const before = bytes(); expect(canClaim(WARBAND.quest)).toBe(false); expect(claimQuestReward(WARBAND.quest)).toBe('not-completed'); expect(bytes()).toBe(before);
  });
  it('refuses an actual active run even with inCombat=false', () => {
    map().setCurrentLocation(1, 'areas/act1-blood-moor'); expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    useCombatStore.setState({ inCombat: false }); expect(hasActiveSubAreaRun()).toBe(true);
    const before = bytes(); expect(canClaim(WARBAND.quest)).toBe(false); expect(claimQuestReward(WARBAND.quest)).toBe('not-completed'); expect(bytes()).toBe(before);
  });
  it.each(['throw-after-roster', 'silent-roster', 'throw-after-claimed'] as const)('removes a fresh replacement after %s', fault => {
    const before = structuredClone({ rows: map().questProgress, proofs: map().questReceipts });
    if (fault === 'throw-after-claimed') {
      const real = useMapStore.setState;
      vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => { real(...args); throw new Error('after publication'); });
    } else {
      const real = useMercStore.setState;
      vi.spyOn(useMercStore, 'setState').mockImplementationOnce((...args) => { if (fault === 'silent-roster') return; real(...args); throw new Error('after publication'); });
    }
    expect(claimQuestReward(WARBAND.quest)).toBe('grant-failed'); expect(mercs().ownedMercs).toEqual([]); expect(mercs().mercEquipment).toEqual({}); expect(mercs().mercProgress).toEqual({}); expect(mercs().fieldedMercId).toBeNull();
    expect(map().questProgress).toEqual(before.rows); expect(map().questReceipts).toEqual(before.proofs);
  });
  it.each(['throw-before', 'throw-after', 'silent', 'dismiss', 'claimed-mutation', 'field-mutation'] as const)('restores scoped source/merc participants after %s', fault => {
    const chosen = own(); mercs().setFieldedMerc(chosen.id);
    const before = structuredClone({ merc: chosen, rows: map().questProgress, proofs: map().questReceipts });
    if (fault === 'throw-before' || fault === 'throw-after' || fault === 'silent') {
      const real = useMapStore.setState;
      vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => { if (fault === 'throw-before') throw new Error('before'); if (fault === 'silent') return; real(update); throw new Error('after'); });
    } else {
      let fired = false;
      stops.push(useMapStore.subscribe(() => {
        if (fired) return; fired = true;
        useInventoryStore.setState(state => ({ currencies: { ...state.currencies, gems: 7 } }));
        if (fault === 'dismiss') mercs().removeMerc(chosen.id);
        if (fault === 'claimed-mutation') required(map().questProgress[WARBAND.quest]).rewardClaimed = false;
        if (fault === 'field-mutation') mercs().setFieldedMerc(null);
      }));
    }
    expect(claimQuestReward(WARBAND.quest)).toBe('grant-failed'); expect(mercs().ownedMercs).toEqual([before.merc]); expect(mercs().fieldedMercId).toBe(chosen.id);
    expect(map().questProgress).toEqual(before.rows); expect(map().questReceipts).toEqual(before.proofs);
  });
  it('keeps the common lease through publication and reports restoration failure explicitly', () => {
    expect(withQuestTransaction(() => claimQuestReward(WARBAND.quest))).toBe('claim-in-progress');
    const real = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementation(update => { real(update); throw new Error('publication or rollback'); });
    expect(() => claimQuestReward(WARBAND.quest)).toThrow(AggregateError);
    vi.mocked(useMapStore.setState).mockRestore(); expect(() => snapshotStores()).not.toThrow();
  });
  it('refuses changed hero context while preserving independently earned hero XP', () => {
    const before = structuredClone({ rows: map().questProgress, proofs: map().questReceipts });
    let fired = false;
    stops.push(useMapStore.subscribe(() => {
      if (fired) return; fired = true;
      usePlayerStore.getState().gainExperience(5);
    }));
    expect(claimQuestReward(WARBAND.quest)).toBe('grant-failed');
    expect(usePlayerStore.getState().player?.experience).toBe(5);
    expect(map().questProgress).toEqual(before.rows); expect(map().questReceipts).toEqual(before.proofs);
    expect(mercs().ownedMercs).toEqual([]); expect(mercs().fieldedMercId).toBeNull();
  });
  it('pays10 Warband wishes exactly once alongside ensure-owned recruitment', () => {
    expect(claimQuestReward(WARBAND.quest)).toBe('ok'); expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
    expect(claimQuestReward(WARBAND.quest)).toBe('already-claimed'); expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });

  it.each([false, true])('preserves independent wishes through claimed failure; retained=%s', retained => {
    if (retained) own();
    const before = JSON.parse(bytes()) as { currencies?: Record<string, number> }[]; let fired = false;
    const stop = useMapStore.subscribe(state => {
      if (fired || !state.questProgress[WARBAND.quest]?.rewardClaimed) return;
      fired = true;
      useInventoryStore.getState().addCurrency('wishstone', 7);
      useInventoryStore.getState().addCurrency('opaque', 3);
      throw new Error('claimed wish observer');
    });
    try { expect(claimQuestReward(WARBAND.quest)).toBe('grant-failed'); } finally { stop(); }
    required(before[1]).currencies = { ...required(before[1]).currencies, wishstone: 7, opaque: 3 };
    expect(JSON.parse(bytes()) as unknown).toEqual(before);
    expect(claimQuestReward(WARBAND.quest)).toBe('ok'); expect(useInventoryStore.getState().currencies.wishstone).toBe(17);
  });
  it.each([false, true])('restores a silent wish grant with the whole source; retained=%s', retained => {
    if (retained) own();
    const before = bytes();
    const mock = vi.spyOn(useInventoryStore.getState(), 'addQuestCurrency').mockImplementation(() => undefined);
    expect(claimQuestReward(WARBAND.quest)).toBe('grant-failed'); expect(bytes()).toBe(before);
    mock.mockRestore(); expect(claimQuestReward(WARBAND.quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });
  it.each([false, true])('refuses overflow before roster writes; retained=%s', retained => {
    if (retained) own();
    useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER - 9 } });
    const before = bytes(); expect(claimQuestReward(WARBAND.quest)).toBe('unsupported-rewards'); expect(bytes()).toBe(before);
    useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER - 10 } });
    expect(claimQuestReward(WARBAND.quest)).toBe('ok'); expect(useInventoryStore.getState().currencies.wishstone).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('holds both currency and quest guards through a failed claim and releases them for retry', () => {

    const before = bytes(), outcomes: string[] = []; let fired = false;
    const stop = useInventoryStore.subscribe(state => {
      outcomes.push(claimQuestReward(WARBAND.quest));
      if (fired || state.currencies.wishstone !== 10) return;
      fired = true; state.spendCurrency('wishstone', 1);
    });
    try { expect(claimQuestReward(WARBAND.quest)).toBe('grant-failed'); } finally { stop(); }
    expect(bytes()).toBe(before); expect(outcomes.length).toBeGreaterThan(0);
    expect(new Set(outcomes)).toEqual(new Set(['claim-in-progress']));
    expect(claimQuestReward(WARBAND.quest)).toBe('ok'); expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });
  it('attempts source and wish restoration and reports a wish-restoration observer error', () => {

    const before = bytes(), original = useInventoryStore.getState().restoreQuestCurrency;
    const stop = useMapStore.subscribe(state => { if (state.questProgress[WARBAND.quest]?.rewardClaimed) throw new Error('after claimed'); });
    const mock = vi.spyOn(useInventoryStore.getState(), 'restoreQuestCurrency').mockImplementation(owner => {
      original(owner); throw new Error('wish restoration observer');
    });
    try { expect(() => claimQuestReward(WARBAND.quest)).toThrow(AggregateError); } finally { stop(); mock.mockRestore(); }
    expect(bytes()).toBe(before); expect(claimQuestReward(WARBAND.quest)).toBe('ok');
  });
  it.each(['wrong', 'getter'] as const)('rejects canonical wish %s without publication or getter reads', fault => {

    const all = quests.loadQuests(); let reads = 0;
    const row = required(all.find(row => row.id === WARBAND.quest)), rewards = { ...row.rewards, wishstones: 11 };
    if (fault === 'getter') Object.defineProperty(rewards, 'wishstones', { enumerable: true, get: () => { reads++; return 10; } });
    vi.spyOn(quests, 'loadQuests').mockReturnValue(all.map(row => row.id === WARBAND.quest ? { ...row, rewards } : row));
    const before = bytes(); expect(canClaim(WARBAND.quest)).toBe(false); expect(claimQuestReward(WARBAND.quest)).toBe('not-completed');
    expect(bytes()).toBe(before); expect(reads).toBe(0);
  });

  it('restores a claim flag corrupted by the currency rollback observer', () => {

    const before = bytes(); let paid = false, corrupted = false;
    const mark = vi.spyOn(useMapStore, 'setState').mockImplementationOnce(() => undefined);
    const stop = useInventoryStore.subscribe(state => {
      if (state.currencies.wishstone === 10) paid = true;
      else if (paid && !corrupted) {
        corrupted = true; useMapStore.getState().updateQuestProgress(WARBAND.quest, { rewardClaimed: true });
      }
    });
    try { expect(claimQuestReward(WARBAND.quest)).toBe('grant-failed'); } finally { stop(); mark.mockRestore(); }
    expect(corrupted).toBe(true); expect(bytes()).toBe(before);
    expect(claimQuestReward(WARBAND.quest)).toBe('ok');
  });

});
