import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { COW } from '@/engine/map/cow-quest';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { LEVEL_CAP, xpRequired, xpTotal } from '@/engine/progression/xp';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercXpForLevel } from '@/stores/mercStore';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { canClaim, claimQuestReward } from './claimReward';
import { canSelectCowEncounter } from './cowQuestActions';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Cow Claim fixture'); return value; }
const hero = () => required(usePlayerStore.getState().player);
const totalHero = () => xpTotal(hero().level) + hero().experience;
function prepare(won = true, claimed = false) {
  const staff = 'quests/act2-horadric-staff';
  useMapStore.setState({ currentAct: 1, currentSubAreaId: 'areas/act1-blood-moor', selectedDifficulty: 'hell', questProgress: {
    [COW.quest]: { id: COW.quest, status: 'completed', rewardClaimed: claimed, objectives: { [COW.legObjective]: true, [COW.portalObjective]: true } },
    [staff]: { id: staff, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } } },
    questReceipts: { [COW.tomeSource]: true, [COW.openProof]: true, ...(won ? { [COW.victoryProof]: true } : {}) } });
  useInventoryStore.setState({ questItems: { [COW.legSource]: { itemId: COW.legItemId, state: 'consumed' },
    [COW.tomeSource]: { itemId: COW.tomeItemId, state: 'consumed' }, [COW.cubeSource]: { itemId: COW.cubeItemId, state: 'owned' } } });
}
function hire(name = 'actual-cow') {
  const fresh = createMercFromDef(required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee')), name);
  const actor = { ...fresh, derivedStats: { ...fresh.derivedStats, life: 7, mana: 3 } };
  useMercStore.getState().addMerc(actor); useMercStore.getState().setFieldedMerc(actor.id); return actor;
}
function totalMerc(id: string) {
  const state = useMercStore.getState(), actor = required(state.ownedMercs.find(row => row.id === id));
  let value = state.getMercProgress(id).experience;
  for (let level = 1; level < actor.level; level++) value += mercXpForLevel(level);
  return value;
}
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); }); useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Cow Claim', 'sorceress'), player = { ...fresh, level: 35, experience: 0, experienceToNextLevel: xpRequired(35), equipment: [] };
  const canonical = deriveEquippedPlayerStats(player, 35, {});
  usePlayerStore.getState().setPlayer({ ...player, derivedStats: { ...canonical, defense: canonical.defense + 7, life: 7, mana: 3 } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });

  it('settles finite side wishes once alongside the full existing reward', () => {
    prepare(); const qid = COW.quest;
    useInventoryStore.setState({ currencies: { wishstone: 7, wishstones: 23, opaque: 4 } });
    expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 17, wishstones: 23, opaque: 4 });
    expect(claimQuestReward(qid)).toBe('already-claimed');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(17);
  });


  function wishParticipants() {
    const p = usePlayerStore.getState().player, inv = useInventoryStore.getState(), map = useMapStore.getState();
    return structuredClone({ heroProgress: p && [p.level, p.experience, p.statPoints, p.skillPoints, p.derivedStats.life, p.derivedStats.mana],
      rows: map.questProgress, receipts: map.questReceipts, items: inv.questItems, services: inv.questServices,
      backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped });
  }
  it.each(['before', 'after', 'noop'] as const)('restores finite side wish ingress %s with all old rewards and permits one full retry', mode => {
    prepare(); const qid = COW.quest;
    const before = wishParticipants(), real = useInventoryStore.getState().addQuestCurrency;
    const mock = vi.spyOn(useInventoryStore.getState(), 'addQuestCurrency').mockImplementation(owner => {
      if (mode === 'before') throw new Error('before wishes');
      if (mode === 'after') { real(owner); throw new Error('after wishes'); }
    });
    expect(claimQuestReward(qid)).toBe('grant-failed'); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({});
    mock.mockRestore(); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
    expect(claimQuestReward(qid)).toBe('already-claimed');
  });
  it('preflights finite side wish overflow before publishing any old reward and releases the reservation', () => {
    prepare(); const qid = COW.quest;
    const before = wishParticipants(); useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER } });
    expect(claimQuestReward(qid)).toBe('unsupported-rewards'); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: Number.MAX_SAFE_INTEGER });
    useInventoryStore.setState({ currencies: {} }); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });
  it('settles finite side wishes before claimed-last, preserves independent additions, and restores source after currency observers', () => {
    prepare(); const qid = COW.quest;
    const before = wishParticipants(), real = useMapStore.getState().markQuestRewardClaimed;
    const mock = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
      real(id); useInventoryStore.getState().addCurrency('wishstone', 3); throw new Error('claimed-last');
    });
    let restored = false;
    const stop = useInventoryStore.subscribe(state => {
      if (restored || state.currencies.wishstone !== 3) return; restored = true;
      const row = useMapStore.getState().questProgress[qid]; if (row) row.rewardClaimed = true;
    });
    try { expect(claimQuestReward(qid)).toBe('grant-failed'); } finally { stop(); }
    expect(restored).toBe(true); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 3 });
    mock.mockRestore(); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(13);
  });
  it('reports an unknown finite side wish overwrite while restoring every other participant and releasing the owner', () => {
    prepare(); const qid = COW.quest;
    const before = wishParticipants(), real = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      real(id); useInventoryStore.setState({ currencies: { wishstone: 123 } }); throw new Error('unknown overwrite');
    });
    expect(() => claimQuestReward(qid)).toThrow(AggregateError); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 123 });
    expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });

describe('public Cow victory Claim', () => {
  it('refuses bare completed objectives without the consumed portal graph and real victory', () => {
    useMapStore.setState({ questProgress: { [COW.quest]: { id: COW.quest, status: 'completed', rewardClaimed: false,
      objectives: { [COW.legObjective]: true, [COW.portalObjective]: true } } } });
    const before = structuredClone(hero()); expect(canClaim(COW.quest)).toBe(false); expect(claimQuestReward(COW.quest)).toBe('not-completed'); expect(hero()).toEqual(before);
  });
  it('refuses an open portal before victory and never turns objective completion into income', () => {
    prepare(false); const before = structuredClone(hero()); expect(canClaim(COW.quest)).toBe(false);
    expect(claimQuestReward(COW.quest)).toBe('not-completed'); expect(hero()).toEqual(before);
  });
  it.each([false, true])('pays exactly 6000 hero and only actual fielded 4500 merc XP once, away from source (merc=%s)', withMerc => {
    prepare(); const actor = withMerc ? hire() : null, before = totalHero(), beforeMerc = actor ? totalMerc(actor.id) : 0;
    const graph = structuredClone({ items: useInventoryStore.getState().questItems, receipts: useMapStore.getState().questReceipts });
    expect(canClaim(COW.quest)).toBe(true); expect(claimQuestReward(COW.quest)).toBe('ok'); expect(totalHero() - before).toBe(6000);
    if (actor) expect(totalMerc(actor.id) - beforeMerc).toBe(4500); else expect(useMercStore.getState().ownedMercs).toEqual([]);
    expect(hero().derivedStats).toEqual(deriveEquippedPlayerStats(hero(), hero().level, {}, useMapStore.getState().questProgress,
      useInventoryStore.getState().questItems, useMapStore.getState().questReceipts));
    expect(hero().derivedStats.life).toBe(7); expect(hero().derivedStats.mana).toBe(3);
    expect({ items: useInventoryStore.getState().questItems, receipts: useMapStore.getState().questReceipts }).toEqual(graph);
    expect(useInventoryStore.getState().backpack).toEqual([]); expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 10 });
    expect(useMapStore.getState().questProgress[COW.quest]?.rewardClaimed).toBe(true); const after = structuredClone(hero());
    expect(claimQuestReward(COW.quest)).toBe('already-claimed'); expect(hero()).toEqual(after); expect(canSelectCowEncounter()).toBe(false);
  });
  it('uses real level growth across thresholds without healing', () => {
    prepare(); usePlayerStore.setState({ player: { ...hero(), level: 1, experience: 0, experienceToNextLevel: xpRequired(1), statPoints: 11, skillPoints: 3 } });
    expect(claimQuestReward(COW.quest)).toBe('ok'); expect(totalHero()).toBe(6000); expect(hero().level).toBeGreaterThan(1);
    expect(hero().statPoints).toBe(11 + (hero().level - 1) * 5); expect(hero().skillPoints).toBe(3 + hero().level - 1);
    expect(hero().derivedStats.life).toBe(7); expect(hero().derivedStats.mana).toBe(3);
  });
  it('at the cap retains exact finite XP without granting level points', () => {
    prepare(); usePlayerStore.setState({ player: { ...hero(), level: LEVEL_CAP, experience: 0, experienceToNextLevel: 1 } });
    const before = totalHero(), stat = hero().statPoints, skill = hero().skillPoints;
    expect(claimQuestReward(COW.quest)).toBe('ok'); expect(totalHero() - before).toBe(6000); expect(hero().statPoints).toBe(stat); expect(hero().skillPoints).toBe(skill);
  });
  it.each(['missing', 'duplicate', 'unsafe-xp', 'unsafe-stat'] as const)('refuses %s actual destination before any grant', fault => {
    prepare(); const actor = hire();
    if (fault === 'missing') useMercStore.setState({ ownedMercs: [] });
    if (fault === 'duplicate') useMercStore.setState({ ownedMercs: [actor, { ...actor }] });
    if (fault === 'unsafe-xp') usePlayerStore.setState({ player: { ...hero(), experience: Number.MAX_SAFE_INTEGER } });
    if (fault === 'unsafe-stat') usePlayerStore.setState({ player: { ...hero(), statPoints: Number.MAX_SAFE_INTEGER + 1 } });
    const before = structuredClone(hero()), grant = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    expect(claimQuestReward(COW.quest)).toBe('unsupported-rewards'); expect(grant).not.toHaveBeenCalled(); expect(hero()).toEqual(before);
    expect(useMapStore.getState().questProgress[COW.quest]?.rewardClaimed).toBe(false);
  });
  it('claimed legacy victory never pays a second fixed reward', () => {
    prepare(true, true); const before = structuredClone(hero()); expect(canClaim(COW.quest)).toBe(false);
    expect(claimQuestReward(COW.quest)).toBe('already-claimed'); expect(hero()).toEqual(before);
  });
});
describe('Cow Claim scoped compensation', () => {
  it.each(['prewrite', 'postwrite', 'claimed-last'] as const)('restores accepted stale caches and actual merc after %s; retry pays once', fault => {
    prepare(); const actor = hire(), before = structuredClone(hero()), beforeMerc = structuredClone({ ownedMercs: useMercStore.getState().ownedMercs, mercProgress: useMercStore.getState().mercProgress });
    const original = usePlayerStore.getState().gainExperience;
    if (fault === 'prewrite') vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(() => { throw new Error('before XP'); });
    if (fault === 'postwrite') vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => { original(amount); throw new Error('after XP'); });
    if (fault === 'claimed-last') vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(() => { throw new Error('claim failed'); });
    expect(claimQuestReward(COW.quest)).toBe('grant-failed'); expect(hero()).toEqual(before);
    expect(useMercStore.getState().ownedMercs).toEqual(beforeMerc.ownedMercs); expect(useMercStore.getState().mercProgress).toEqual(beforeMerc.mercProgress);
    expect(useMapStore.getState().questProgress[COW.quest]?.rewardClaimed).toBe(false); expect(canClaim(COW.quest)).toBe(true);
    const xp = totalHero(), mercXp = totalMerc(actor.id); vi.restoreAllMocks(); expect(claimQuestReward(COW.quest)).toBe('ok');
    expect(totalHero() - xp).toBe(6000); expect(totalMerc(actor.id) - mercXp).toBe(4500);
  });
  it.each(['real-xp', 'raw-xp', 'damage', 'equipment'] as const)('preserves independent hero %s and unrelated currencies after claimed-last failure', mode => {
    prepare(); const beforeXp = totalHero(), before = structuredClone(hero());
    const original = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      original(id); expect(claimQuestReward(COW.quest)).toBe('claim-in-progress');
      if (mode === 'real-xp') usePlayerStore.getState().gainExperience(2);
      if (mode === 'raw-xp') usePlayerStore.getState().addXP(2);
      if (mode === 'damage') Object.assign(hero().derivedStats, { life: 1, mana: 2 });
      if (mode === 'equipment') { useInventoryStore.setState({ equipped: { chest: { id: 'independent-cow-chest', baseId: 'items/base/armor-quilted', rarity: 'normal',
        level: 1, identified: true, equipped: true, equipSlot: 'chest', baseRolls: { defense: 9 } } } }); usePlayerStore.getState().gainExperience(0); }
      useInventoryStore.getState().addCurrency('wishstone', 3); throw new Error('claimed-last');
    });
    expect(claimQuestReward(COW.quest)).toBe('grant-failed'); expect(totalHero()).toBe(beforeXp + (mode === 'real-xp' || mode === 'raw-xp' ? 2 : 0));
    expect(hero().derivedStats).toEqual(mode === 'real-xp' || mode === 'equipment'
      ? deriveEquippedPlayerStats(hero(), hero().level, useInventoryStore.getState().equipped, useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts)
      : { ...before.derivedStats, life: mode === 'damage' ? 1 : 7, mana: mode === 'damage' ? 2 : 3 });
    expect(useInventoryStore.getState().currencies.wishstone).toBe(3); expect(useMapStore.getState().questProgress[COW.quest]?.rewardClaimed).toBe(false);
  });
  it.each([2, 2000])('preserves independent actual-recipient XP %s across native merc thresholds', independent => {
    prepare(); const actor = hire(), before = totalMerc(actor.id); let fired = false;
    stops.push(useMercStore.subscribe(() => { if (fired) return; fired = true; useMercStore.getState().addExperience(actor.id, independent); throw new Error('merc observer'); }));
    expect(claimQuestReward(COW.quest)).toBe('grant-failed'); expect(totalMerc(actor.id)).toBe(before + independent);
    expect(useMapStore.getState().questProgress[COW.quest]?.rewardClaimed).toBe(false);
  });
  it.each(['removed', 'foreign-id', 'fielded-changed'] as const)('preserves independent recipient %s on failed Claim', mode => {
    prepare(); const actor = hire(), before = totalHero(); let fired = false;
    stops.push(useMercStore.subscribe(() => { if (fired) return; fired = true;
      if (mode === 'removed') useMercStore.setState({ ownedMercs: [], mercProgress: {}, fieldedMercId: null });
      if (mode === 'foreign-id') useMercStore.setState({ ownedMercs: [{ ...structuredClone(actor), name: 'foreign replacement' }] });
      if (mode === 'fielded-changed') useMercStore.setState({ fieldedMercId: null });
      throw new Error('recipient changed');
    }));
    expect(claimQuestReward(COW.quest)).toBe('grant-failed'); expect(totalHero()).toBe(before);
    const state = useMercStore.getState(); if (mode === 'removed') expect(state.ownedMercs).toEqual([]);
    if (mode === 'foreign-id') expect(state.ownedMercs[0]?.name).toBe('foreign replacement');
    if (mode === 'fielded-changed' || mode === 'removed') expect(state.fieldedMercId).toBeNull();
    if (mode === 'removed') expect(Object.hasOwn(state.mercProgress, actor.id)).toBe(false);
  });
});

it('reports ambiguous raw progression deletion explicitly while still restoring hero and unclaimed source', () => {
  prepare(); const actor = hire(), before = totalHero(); let fired = false;
  stops.push(useMercStore.subscribe(() => { if (fired) return; fired = true; useMercStore.setState({ mercProgress: {} }); throw new Error('raw recipient progression deletion'); }));
  let failure: unknown; try { claimQuestReward(COW.quest); } catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(AggregateError);
  if (!(failure instanceof AggregateError)) throw new Error('Expected explicit compensation failure');
  expect(failure.cause).toBeInstanceOf(Error); expect(totalHero()).toBe(before);
  expect(Object.hasOwn(useMercStore.getState().mercProgress, actor.id)).toBe(false);
  expect(useMapStore.getState().questProgress[COW.quest]?.rewardClaimed).toBe(false);
});
it('restores initially absent recipient progress without inventing a zero key', () => {
  prepare(); const actor = hire(); useMercStore.setState({ mercProgress: {} });
  vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(() => { throw new Error('claim failure'); });
  expect(claimQuestReward(COW.quest)).toBe('grant-failed'); expect(Object.hasOwn(useMercStore.getState().mercProgress, actor.id)).toBe(false);
});
