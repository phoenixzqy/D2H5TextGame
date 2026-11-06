import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as quests from '@/data/loaders/quests';
import { loadMercPool } from '@/data/loaders/mercs';
import { awardXp, LEVEL_CAP, xpTotal } from '@/engine/progression/xp';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { mercXpForLevel } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { canClaim, claimQuestReward } from './claimReward';
import { withQuestTransaction } from './questTransaction';

const quest = 'quests/side-act2-drognan-tome', source = `${quest}#objective:obj-fetch`, itemId = 'quest/sun_cult_tome';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Drognan Claim fixture'); return value; }
const hero = () => required(usePlayerStore.getState().player), map = () => useMapStore.getState(), mercs = () => useMercStore.getState();
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
function own(suffix: string) {
  const definition = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee'));
  const merc = createMercFromDef(definition, suffix); mercs().addMerc(merc); return merc;
}
function mercXp(id: string) {
  const merc = required(mercs().ownedMercs.find(row => row.id === id));
  let total = mercs().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Drognan Claim', 'sorceress'), equipment: [] });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: null, selectedDifficulty: 'hell',
    questProgress: { [quest]: { id: quest, status: 'completed', objectives: { 'obj-fetch': true }, rewardClaimed: false } } });
  useInventoryStore.setState({ questItems: { [source]: { itemId, state: 'owned' } } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });


  it('settles finite side wishes once alongside the full existing reward', () => {
    const qid = quest;
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
    const qid = quest;
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
    const qid = quest;
    const before = wishParticipants(); useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER } });
    expect(claimQuestReward(qid)).toBe('unsupported-rewards'); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: Number.MAX_SAFE_INTEGER });
    useInventoryStore.setState({ currencies: {} }); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });
  it('settles finite side wishes before claimed-last, preserves independent additions, and restores source after currency observers', () => {
    const qid = quest;
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
    const qid = quest;
    const before = wishParticipants(), real = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      real(id); useInventoryStore.setState({ currencies: { wishstone: 123 } }); throw new Error('unknown overwrite');
    });
    expect(() => claimQuestReward(qid)).toThrow(AggregateError); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 123 });
    expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });

describe('Drognan separate source-bound numeric Claim', () => {
  it('refuses completed flag-only history without publication', () => {
    useInventoryStore.setState({ questItems: {} });
    const before = bytes(); expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).toBe('not-completed'); expect(bytes()).toBe(before);
  });
  it.each([false, true])('awards authored 4000 XP/+1 point and prior-fielded 3000 XP exactly once; merc=%s', fielded => {
    const recipient = fielded ? own('actual') : null;
    if (recipient) mercs().setFieldedMerc(recipient.id);
    const before = structuredClone(hero()), growth = awardXp(xpTotal(before.level) + before.experience, 4000);
    const priorMercXp = recipient ? mercXp(recipient.id) : 0;
    expect(canClaim(quest)).toBe(true); expect(claimQuestReward(quest)).toBe('ok');
    expect(xpTotal(hero().level) + hero().experience).toBe(xpTotal(before.level) + before.experience + 4000);
    expect(hero().skillPoints).toBe(before.skillPoints + growth.skillPointsGranted + 1);
    expect(hero().statPoints).toBe(before.statPoints + growth.statPointsGranted);
    if (recipient) expect(mercXp(recipient.id)).toBe(priorMercXp + 3000);
    expect(mercs().fieldedMercId).toBe(recipient?.id ?? null);
    expect(useInventoryStore.getState().questItems).toEqual({ [source]: { itemId, state: 'owned' } });
    expect(map().questProgress[quest]?.rewardClaimed).toBe(true);
    const earned = bytes(); expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).toBe('already-claimed'); expect(bytes()).toBe(earned);
  });
  it('keeps existing hero level-cap semantics and adds the one direct skill point', () => {
    usePlayerStore.setState({ player: { ...hero(), level: LEVEL_CAP, experience: 0, skillPoints: 7 } });
    expect(claimQuestReward(quest)).toBe('ok'); expect(hero().level).toBe(LEVEL_CAP); expect(hero().skillPoints).toBe(8); expect(hero().experience).toBe(4000);
  });
  it('uses the captured actual recipient when an observer independently changes fielding', () => {
    const recipient = own('prior'), other = own('other'); mercs().setFieldedMerc(recipient.id);
    const before = mercXp(recipient.id), otherBefore = mercXp(other.id);
    let fired = false; stops.push(usePlayerStore.subscribe(() => { if (!fired) { fired = true; mercs().setFieldedMerc(other.id); } }));
    expect(claimQuestReward(quest)).toBe('ok'); expect(mercXp(recipient.id)).toBe(before + 3000); expect(mercXp(other.id)).toBe(otherBefore); expect(mercs().fieldedMercId).toBe(other.id);
  });
  it('does not redirect XP when the recorded fielded ID has no actual recipient', () => {
    const other = own('unfielded'), before = mercXp(other.id); useMercStore.setState({ fieldedMercId: 'foreign-absent' });
    expect(claimQuestReward(quest)).toBe('ok'); expect(mercXp(other.id)).toBe(before); expect(mercs().fieldedMercId).toBe('foreign-absent');
  });
  it.each(['wrong-item', 'consumed', 'false-objective', 'wrong-row', 'combat', 'loading', 'no-player', 'unsafe-points', 'unsafe-merc'] as const)('refuses %s without participating writes', fault => {
    if (fault === 'wrong-item') useInventoryStore.setState({ questItems: { [source]: { itemId: 'quest/horadric_cube', state: 'owned' } } });
    if (fault === 'consumed') useInventoryStore.setState({ questItems: { [source]: { itemId, state: 'consumed' } } });
    if (fault === 'false-objective') map().updateQuestProgress(quest, { objectives: { 'obj-fetch': false } });
    if (fault === 'wrong-row') Object.assign(required(map().questProgress[quest]), { id: 'foreign' });
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
    if (fault === 'no-player') usePlayerStore.getState().reset();
    if (fault === 'unsafe-points') usePlayerStore.setState({ player: { ...hero(), skillPoints: Number.MAX_SAFE_INTEGER } });
    if (fault === 'unsafe-merc') { const merc = own('unsafe'); mercs().setFieldedMerc(merc.id); useMercStore.setState({ mercProgress: { [merc.id]: { experience: Number.MAX_SAFE_INTEGER, experienceToNextLevel: 100 } } }); }
    const before = bytes();
    if (fault !== 'unsafe-points' && fault !== 'unsafe-merc') expect(canClaim(quest)).toBe(false);
    expect(claimQuestReward(quest)).not.toBe('ok'); expect(bytes()).toBe(before);
  });
  it('refuses active runs and reentry while retaining ordinary source readiness', () => {
    useMapStore.setState({ selectedDifficulty: 'normal', currentSubAreaId: 'areas/act1-blood-moor' });
    expect(startSubAreaRun({ runSeed: 11, challengeOrdinal: 0 })).toBeTruthy(); useCombatStore.setState({ inCombat: false });
    const before = bytes(); expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).not.toBe('ok'); expect(bytes()).toBe(before);
    abortSubAreaRun(); expect(withQuestTransaction(() => claimQuestReward(quest))).toBe('claim-in-progress');
  });
  it('keeps proofless claimed legacy history inert', () => {
    useInventoryStore.setState({ questItems: {} }); map().updateQuestProgress(quest, { rewardClaimed: true });
    const before = bytes(); expect(claimQuestReward(quest)).toBe('already-claimed'); expect(bytes()).toBe(before);
  });
  it('refuses authored numeric reward drift', () => {
    const all = quests.loadQuests(); vi.spyOn(quests, 'loadQuests').mockReturnValue(all.map(row => row.id === quest ? { ...row, rewards: { xp: 4001, skillPoints: 1 } } : row));
    const before = bytes(); expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).not.toBe('ok'); expect(bytes()).toBe(before);
  });
  it.each(['hero', 'merc', 'claimed'] as const)('restores deep participating progress/source after a %s publication fault', boundary => {
    const recipient = own('recipient'); mercs().setFieldedMerc(recipient.id);
    const before = structuredClone({ hero: hero(), merc: recipient, progress: mercs().mercProgress, row: map().questProgress[quest], item: useInventoryStore.getState().questItems[source] });
    let fired = false;
    const fault = () => {
      if (fired) return; fired = true;
      Object.assign(required(map().questProgress[quest]), { rewardClaimed: true });
      Object.assign(required(useInventoryStore.getState().questItems[source]), { itemId: 'foreign-mutated' });
      throw new Error('after participating write');
    };
    if (boundary === 'hero') stops.push(usePlayerStore.subscribe(fault));
    if (boundary === 'merc') stops.push(useMercStore.subscribe(fault));
    if (boundary === 'claimed') stops.push(useMapStore.subscribe(fault));
    expect(claimQuestReward(quest)).toBe('grant-failed'); expect(hero()).toEqual(before.hero); expect(mercs().ownedMercs).toEqual([before.merc]);
    expect(mercs().mercProgress).toEqual(before.progress); expect(map().questProgress[quest]).toEqual(before.row); expect(useInventoryStore.getState().questItems[source]).toEqual(before.item);
  });
  it('preserves independent currency, journal, nonrecipient XP and equipped gear during rollback', () => {
    const recipient = own('recipient'), other = own('other'); mercs().setFieldedMerc(recipient.id);
    const before = structuredClone(hero()), recipientBefore = structuredClone(recipient);
    const cap = { id: 'independent-cap', baseId: 'items/base/helm-cap', rarity: 'normal' as const, level: 1, identified: true, equipped: false, baseRolls: { defense: 5 } };
    useInventoryStore.setState({ backpack: [cap] });
    let fired = false; stops.push(usePlayerStore.subscribe(() => {
      if (fired) return; fired = true;
      useInventoryStore.getState().addCurrency('gems', 7); expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
      useMapStore.setState(state => ({ questProgress: { ...state.questProgress, 'quests/act1-den-of-evil': { id: 'quests/act1-den-of-evil', status: 'inProgress', objectives: {} } } }));
      mercs().addExperience(other.id, 9); throw new Error('after independent writes');
    }));
    expect(claimQuestReward(quest)).toBe('grant-failed');
    expect(useInventoryStore.getState().currencies.gems).toBe(7); expect(useInventoryStore.getState().equipped.head?.id).toBe(cap.id); expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(map().questProgress['quests/act1-den-of-evil']?.status).toBe('inProgress'); expect(mercs().getMercProgress(other.id).experience).toBe(9);
    expect(mercs().ownedMercs.find(row => row.id === recipient.id)).toEqual(recipientBefore);
    expect(hero()).toEqual({ ...before, derivedStats: deriveEquippedPlayerStats(before, before.level, useInventoryStore.getState().equipped, map().questProgress, useInventoryStore.getState().questItems, map().questReceipts) });
  });
  it('preserves an independent dismissal instead of recreating the numeric recipient', () => {
    const recipient = own('dismissed'); mercs().setFieldedMerc(recipient.id);
    const before = structuredClone(hero());
    let fired = false; stops.push(usePlayerStore.subscribe(() => { if (!fired) { fired = true; mercs().removeMerc(recipient.id); } }));
    expect(claimQuestReward(quest)).toBe('grant-failed'); expect(hero()).toEqual(before);
    expect(mercs().ownedMercs).toEqual([]); expect(mercs().mercProgress).toEqual({}); expect(mercs().mercEquipment).toEqual({}); expect(mercs().fieldedMercId).toBeNull();
    expect(map().questProgress[quest]?.rewardClaimed).toBe(false); expect(useInventoryStore.getState().questItems[source]).toEqual({ itemId, state: 'owned' });
  });
  it('preserves independent combo-order settings when a reward observer changes them and throws', () => {
    const before = structuredClone(hero()), comboOrder = ['sorceress.ice_bolt', 'sorceress.frost_nova'];
    let fired = false;
    stops.push(usePlayerStore.subscribe(() => {
      if (fired) return; fired = true;
      usePlayerStore.getState().setComboOrder(comboOrder);
      throw new Error('after independent combo setting');
    }));
    expect(claimQuestReward(quest)).toBe('grant-failed');
    expect(hero()).toEqual({ ...before, comboOrder });
    expect(map().questProgress[quest]?.rewardClaimed).toBe(false);
    expect(useInventoryStore.getState().questItems[source]).toEqual({ itemId, state: 'owned' });
  });
  it('detects a silently omitted claimed-last publication and restores all numeric grants', () => {
    const before = structuredClone(hero()); vi.spyOn(map(), 'markQuestRewardClaimed').mockImplementation(() => undefined);
    expect(claimQuestReward(quest)).toBe('grant-failed'); expect(hero()).toEqual(before); expect(map().questProgress[quest]?.rewardClaimed).toBe(false);
    expect(useInventoryStore.getState().questItems[source]).toEqual({ itemId, state: 'owned' });
  });
  it('reports restoration observer failure explicitly', () => {
    stops.push(usePlayerStore.subscribe(() => { throw new Error('grant or restore fault'); }));
    expect(() => claimQuestReward(quest)).toThrow(AggregateError);
  });
  it('reports silent recipient progression mutation during restoration explicitly', () => {
    const recipient = own('restoration'); mercs().setFieldedMerc(recipient.id);
    let writes = 0;
    stops.push(usePlayerStore.subscribe(() => {
      writes++;
      if (writes === 1) throw new Error('grant fault');
      Object.assign(required(mercs().ownedMercs.find(row => row.id === recipient.id)), { level: 99 });
    }));
    expect(() => claimQuestReward(quest)).toThrow(AggregateError);
  });
});
