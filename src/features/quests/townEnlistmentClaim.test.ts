import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import * as quests from '@/data/loaders/quests';
import { TOWN_ENLISTMENTS, type TownEnlistmentKey } from '@/engine/map/town-enlistment-quest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { createMercFromDef } from '@/stores/mercFactory';
import { abortSubAreaRun, hasActiveSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { canClaim, claimQuestReward } from './claimReward';
import { withQuestTransaction } from './questTransaction';

const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const map = () => useMapStore.getState(), mercs = () => useMercStore.getState();
const stops: (() => void)[] = [];
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing town Claim fixture'); return value; }
function prepare(key: TownEnlistmentKey) {
  const c = TOWN_ENLISTMENTS[key], prerequisite = c.prerequisite;
  useMapStore.setState({ currentAct: 5, questProgress: {
    ...(prerequisite ? { [prerequisite.quest]: { id: prerequisite.quest, status: 'completed' as const, rewardClaimed: false,
      objectives: Object.fromEntries(prerequisite.objectiveIds.map(id => [id, true])) } } : {}),
    [c.quest]: { id: c.quest, status: 'completed', rewardClaimed: false, objectives: { [c.objective]: true } }
  }, questReceipts: { [c.proof]: true } });
  return c;
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); }); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Claim', 'sorceress'), level: 1, equipment: [] });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });
describe('finite captain separate ensure-owned Claim', () => {
  it.each(['kashya', 'greiz', 'asheara'] as const)('creates one dismissed %s recruit away from its captain without hero gate or auto-fielding', key => {
    const c = prepare(key), def = required(loadMercPool().pool.find(row => row.id === c.mercId));
    expect(canClaim(c.quest)).toBe(true); expect(claimQuestReward(c.quest)).toBe('ok');
    expect(mercs().ownedMercs).toEqual([createMercFromDef(def)]); expect(mercs().fieldedMercId).toBeNull();
    expect(map().questProgress[c.quest]?.rewardClaimed).toBe(true); expect(map().questReceipts[c.proof]).toBe(true);
    mercs().removeMerc(c.mercId); expect(claimQuestReward(c.quest)).toBe('already-claimed'); expect(mercs().ownedMercs).toEqual([]);
  });
  it.each(['kashya', 'greiz', 'asheara'] as const)('preserves multiple invested %s instances and fielding without a merc store write', key => {
    const c = prepare(key), def = required(loadMercPool().pool.find(row => row.id === c.mercId));
    const first = createMercFromDef(def, 'first'), selected = createMercFromDef(def, 'selected');
    mercs().addMerc(first); mercs().addMerc(selected); mercs().setFieldedMerc(selected.id);
    Object.assign(selected.derivedStats, { life: 3, mana: 2 });
    const before = structuredClone({ owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress });
    let writes = 0; stops.push(useMercStore.subscribe(() => { writes++; }));
    expect(claimQuestReward(c.quest)).toBe('ok'); expect(writes).toBe(0);
    expect({ owned: mercs().ownedMercs, equipment: mercs().mercEquipment, progress: mercs().mercProgress }).toEqual(before);
    expect(mercs().ownedMercs[0]).toBe(first); expect(mercs().ownedMercs[1]).toBe(selected); expect(mercs().fieldedMercId).toBe(selected.id);
  });
  it('preserves an unrelated fielded actual ID when ensure-owned creates a dismissed recruit', () => {
    const c = prepare('greiz'), def = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee'));
    const other = createMercFromDef(def, 'unrelated'); mercs().addMerc(other); mercs().setFieldedMerc(other.id);
    expect(claimQuestReward(c.quest)).toBe('ok'); expect(mercs().fieldedMercId).toBe(other.id); expect(mercs().ownedMercs[0]).toBe(other);
  });
  it.each(['proofless', 'false-proof', 'missing-main', 'main-flag', 'side-flag', 'extra-objective', 'nightmare', 'loading', 'no-player', 'combat', 'orphan-progress', 'duplicate-id'] as const)('refuses %s without granting or marking claimed', fault => {
    const c = prepare('greiz');
    if (fault === 'proofless') useMapStore.setState({ questReceipts: {} });
    if (fault === 'false-proof') Reflect.set(map().questReceipts, c.proof, false);
    if (fault === 'missing-main') useMapStore.setState(state => { const rows = { ...state.questProgress }; Reflect.deleteProperty(rows, required(c.prerequisite).quest); return { questProgress: rows }; });
    if (fault === 'main-flag') required(map().questProgress[required(c.prerequisite).quest]).objectives['obj-kill-radament'] = false;
    if (fault === 'side-flag') map().updateQuestProgress(c.quest, { objectives: { [c.objective]: false } });
    if (fault === 'extra-objective') map().updateQuestProgress(c.quest, { objectives: { [c.objective]: true, extra: true } });
    if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
    if (fault === 'no-player') usePlayerStore.getState().reset();
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    if (fault === 'orphan-progress') useMercStore.setState({ mercProgress: { [c.mercId]: { experience: 99, experienceToNextLevel: 777 } } });
    if (fault === 'duplicate-id') { const merc = createMercFromDef(required(loadMercPool().pool.find(row => row.id === c.mercId))); useMercStore.setState({ ownedMercs: [merc, merc] }); }
    const before = bytes(); expect(canClaim(c.quest)).toBe(false); expect(claimQuestReward(c.quest)).not.toBe('ok'); expect(bytes()).toBe(before);
  });
  it.each(['giver', 'type', 'act', 'prerequisite', 'objective', 'merc-id', 'reward', 'extra-reward'] as const)('refuses canonical %s drift', fault => {
    const c = prepare('greiz'), all = quests.loadQuests();
    vi.spyOn(quests, 'loadQuests').mockReturnValue(all.map(row => row.id !== c.quest ? row : { ...row,
      ...(fault === 'giver' ? { giver: 'npc/atma' } : fault === 'type' ? { type: 'main' as const }
        : fault === 'act' ? { actId: 'acts/act1' } : fault === 'prerequisite' ? { prerequisites: [] }
          : fault === 'reward' ? { rewards: { ...row.rewards, mercenaryUnlock: 'wrong' } }
            : fault === 'extra-reward' ? { rewards: { ...row.rewards, mercenaryUnlock: c.mercId, xp: 1 } }
              : { objectives: row.objectives.map(objective => ({ ...objective, ...(fault === 'objective' ? { id: 'wrong' } : { mercId: 'wrong' }) })) }) }));
    const before = bytes(); expect(canClaim(c.quest)).toBe(false); expect(claimQuestReward(c.quest)).toBe('not-completed'); expect(bytes()).toBe(before);
  });
  it('keeps already-claimed proofless legacy history inert when the recruit is absent', () => {
    const c = prepare('greiz'); useMapStore.setState({ questReceipts: {} }); map().updateQuestProgress(c.quest, { rewardClaimed: true });
    const before = bytes(); expect(claimQuestReward(c.quest)).toBe('already-claimed'); expect(bytes()).toBe(before);
  });
  it.each(['hidden', 'getter'] as const)('rejects a %s reward field without executing a getter', fault => {
    const c = prepare('greiz'), all = quests.loadQuests(), rewards = { mercenaryUnlock: c.mercId, wishstones: 10 }; let reads = 0;
    Object.defineProperty(rewards, 'mercenaryUnlock', fault === 'hidden'
      ? { value: c.mercId, enumerable: false } : { enumerable: true, get: () => { reads++; return c.mercId; } });
    if (fault === 'hidden') Object.defineProperty(rewards, 'xp', { value: 1, enumerable: true });
    vi.spyOn(quests, 'loadQuests').mockReturnValue(all.map(row => row.id === c.quest ? { ...row, rewards } : row));
    expect(canClaim(c.quest)).toBe(false); expect(claimQuestReward(c.quest)).toBe('not-completed'); expect(reads).toBe(0);
  });
  it('refuses a paused actual active run without imposing current captain gates', () => {
    const c = prepare('greiz'); map().setCurrentLocation(1, 'areas/act1-blood-moor'); expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    useCombatStore.setState({ inCombat: false }); expect(hasActiveSubAreaRun()).toBe(true);
    expect(canClaim(c.quest)).toBe(false); expect(claimQuestReward(c.quest)).toBe('not-completed');
  });
  it.each(['throw-before-merc', 'throw-after-merc', 'silent-merc', 'throw-after-claimed'] as const)('removes a fresh replacement after %s and permits a single complete retry', fault => {
    const c = prepare('greiz'), side = structuredClone(map().questProgress[c.quest]);
    if (fault === 'throw-after-claimed') {
      const real = useMapStore.setState; vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => { real(update); throw new Error('after claimed'); });
    } else {
      const real = useMercStore.setState; vi.spyOn(useMercStore, 'setState').mockImplementationOnce(update => {
        if (fault === 'throw-before-merc') throw new Error('before merc'); if (fault === 'silent-merc') return; real(update); throw new Error('after merc');
      });
    }
    expect(claimQuestReward(c.quest)).toBe('grant-failed'); expect(mercs().ownedMercs).toEqual([]); expect(mercs().mercEquipment).toEqual({}); expect(mercs().mercProgress).toEqual({});
    expect(map().questProgress[c.quest]).toEqual(side); expect(map().questReceipts[c.proof]).toBe(true);
    vi.restoreAllMocks(); expect(claimQuestReward(c.quest)).toBe('ok'); expect(mercs().ownedMercs).toHaveLength(1); expect(claimQuestReward(c.quest)).toBe('already-claimed');
  });
  it.each(['dismiss', 'field', 'hero-xp', 'main-change', 'claimed-mutation'] as const)('retained Claim restores its flag and preserves independent %s without merc restoration writes', fault => {
    const c = prepare('greiz'), chosen = createMercFromDef(required(loadMercPool().pool.find(row => row.id === c.mercId)), 'retained');
    mercs().addMerc(chosen); mercs().setFieldedMerc(chosen.id);
    let fired = false; stops.push(useMapStore.subscribe(() => {
      if (fired) return; fired = true;
      if (fault === 'dismiss') mercs().removeMerc(chosen.id);
      if (fault === 'field') mercs().setFieldedMerc(null);
      if (fault === 'hero-xp') usePlayerStore.getState().gainExperience(5);
      if (fault === 'main-change') required(map().questProgress[required(c.prerequisite).quest]).objectives.legacy = true;
      if (fault === 'claimed-mutation') required(map().questProgress[c.quest]).rewardClaimed = false;
    }));
    const set = vi.spyOn(useMercStore, 'setState');
    expect(claimQuestReward(c.quest)).toBe('grant-failed'); expect(set).not.toHaveBeenCalled();
    expect(map().questProgress[c.quest]?.rewardClaimed).toBe(false); expect(map().questReceipts[c.proof]).toBe(true);
    if (fault === 'dismiss') { expect(mercs().ownedMercs).toEqual([]); expect(mercs().fieldedMercId).toBeNull(); }
    else { expect(mercs().ownedMercs[0]).toBe(chosen); if (fault === 'field') expect(mercs().fieldedMercId).toBeNull(); }
    if (fault === 'hero-xp') expect(usePlayerStore.getState().player?.experience).toBe(5);
    if (fault === 'main-change') expect(map().questProgress[required(c.prerequisite).quest]?.objectives.legacy).toBe(true);
  });
  it('holds the lease through source/merc restoration and reports failed restoration explicitly', () => {
    const c = prepare('greiz'); expect(withQuestTransaction(() => claimQuestReward(c.quest))).toBe('claim-in-progress');
    const real = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementation(update => { real(update); throw new Error('source publication/restore observer'); });
    expect(() => claimQuestReward(c.quest)).toThrow(AggregateError); expect(mercs().ownedMercs).toEqual([]);
    vi.restoreAllMocks(); expect(claimQuestReward(c.quest)).toBe('ok');
  });
  it.each(['kashya', 'greiz', 'asheara'] as const)('pays10 %s wishes exactly once with ensure-owned Claim', key => {
    const c = prepare(key);
    expect(claimQuestReward(c.quest)).toBe('ok'); expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
    expect(claimQuestReward(c.quest)).toBe('already-claimed'); expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });

  it.each([false, true])('preserves independent wishes through claimed failure; retained=%s', retained => {
    const c = prepare('greiz');
    if (retained) mercs().addMerc(createMercFromDef(required(loadMercPool().pool.find(row => row.id === c.mercId)), 'retained'));
    const before = JSON.parse(bytes()) as { currencies?: Record<string, number> }[]; let fired = false;
    const stop = useMapStore.subscribe(state => {
      if (fired || !state.questProgress[c.quest]?.rewardClaimed) return;
      fired = true;
      useInventoryStore.getState().addCurrency('wishstone', 7);
      useInventoryStore.getState().addCurrency('opaque', 3);
      throw new Error('claimed wish observer');
    });
    try { expect(claimQuestReward(c.quest)).toBe('grant-failed'); } finally { stop(); }
    required(before[1]).currencies = { ...required(before[1]).currencies, wishstone: 7, opaque: 3 };
    expect(JSON.parse(bytes()) as unknown).toEqual(before);
    expect(claimQuestReward(c.quest)).toBe('ok'); expect(useInventoryStore.getState().currencies.wishstone).toBe(17);
  });
  it.each([false, true])('restores a silent wish grant with the whole source; retained=%s', retained => {
    const c = prepare('greiz');
    if (retained) mercs().addMerc(createMercFromDef(required(loadMercPool().pool.find(row => row.id === c.mercId)), 'retained'));
    const before = bytes();
    const mock = vi.spyOn(useInventoryStore.getState(), 'addQuestCurrency').mockImplementation(() => undefined);
    expect(claimQuestReward(c.quest)).toBe('grant-failed'); expect(bytes()).toBe(before);
    mock.mockRestore(); expect(claimQuestReward(c.quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });
  it.each([false, true])('refuses overflow before roster writes; retained=%s', retained => {
    const c = prepare('greiz');
    if (retained) mercs().addMerc(createMercFromDef(required(loadMercPool().pool.find(row => row.id === c.mercId)), 'retained'));
    useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER - 9 } });
    const before = bytes(); expect(claimQuestReward(c.quest)).toBe('unsupported-rewards'); expect(bytes()).toBe(before);
    useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER - 10 } });
    expect(claimQuestReward(c.quest)).toBe('ok'); expect(useInventoryStore.getState().currencies.wishstone).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('holds both currency and quest guards through a failed claim and releases them for retry', () => {
    const c = prepare('greiz');
    const before = bytes(), outcomes: string[] = []; let fired = false;
    const stop = useInventoryStore.subscribe(state => {
      outcomes.push(claimQuestReward(c.quest));
      if (fired || state.currencies.wishstone !== 10) return;
      fired = true; state.spendCurrency('wishstone', 1);
    });
    try { expect(claimQuestReward(c.quest)).toBe('grant-failed'); } finally { stop(); }
    expect(bytes()).toBe(before); expect(outcomes.length).toBeGreaterThan(0);
    expect(new Set(outcomes)).toEqual(new Set(['claim-in-progress']));
    expect(claimQuestReward(c.quest)).toBe('ok'); expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });
  it('attempts source and wish restoration and reports a wish-restoration observer error', () => {
    const c = prepare('greiz');
    const before = bytes(), original = useInventoryStore.getState().restoreQuestCurrency;
    const stop = useMapStore.subscribe(state => { if (state.questProgress[c.quest]?.rewardClaimed) throw new Error('after claimed'); });
    const mock = vi.spyOn(useInventoryStore.getState(), 'restoreQuestCurrency').mockImplementation(owner => {
      original(owner); throw new Error('wish restoration observer');
    });
    try { expect(() => claimQuestReward(c.quest)).toThrow(AggregateError); } finally { stop(); mock.mockRestore(); }
    expect(bytes()).toBe(before); expect(claimQuestReward(c.quest)).toBe('ok');
  });
  it.each(['wrong', 'getter'] as const)('rejects canonical wish %s without publication or getter reads', fault => {
    const c = prepare('greiz');
    const all = quests.loadQuests(); let reads = 0;
    const row = required(all.find(row => row.id === c.quest)), rewards = { ...row.rewards, wishstones: 11 };
    if (fault === 'getter') Object.defineProperty(rewards, 'wishstones', { enumerable: true, get: () => { reads++; return 10; } });
    vi.spyOn(quests, 'loadQuests').mockReturnValue(all.map(row => row.id === c.quest ? { ...row, rewards } : row));
    const before = bytes(); expect(canClaim(c.quest)).toBe(false); expect(claimQuestReward(c.quest)).toBe('not-completed');
    expect(bytes()).toBe(before); expect(reads).toBe(0);
  });

  it('restores a claim flag corrupted by the currency rollback observer', () => {
    const c = prepare('greiz');
    const before = bytes(); let paid = false, corrupted = false;
    const mark = vi.spyOn(useMapStore, 'setState').mockImplementationOnce(() => undefined);
    const stop = useInventoryStore.subscribe(state => {
      if (state.currencies.wishstone === 10) paid = true;
      else if (paid && !corrupted) {
        corrupted = true; useMapStore.getState().updateQuestProgress(c.quest, { rewardClaimed: true });
      }
    });
    try { expect(claimQuestReward(c.quest)).toBe('grant-failed'); } finally { stop(); mark.mockRestore(); }
    expect(corrupted).toBe(true); expect(bytes()).toBe(before);
    expect(claimQuestReward(c.quest)).toBe('ok');
  });

});
