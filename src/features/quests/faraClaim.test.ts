import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import { FARA } from '@/engine/map/fara-quest';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { xpRequired, xpTotal } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { claimQuestReward, canClaim } from './claimReward';
import { talkToFara } from './faraQuestActions';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function hero() { const result = usePlayerStore.getState().player; if (!result) throw new Error('Missing Fara hero'); return result; }
function setupTalk() { useMapStore.getState().recordNpcTalk(FARA.npc); expect(useMapStore.getState().questReceipts[FARA.proof]).toBe(true); }
function balance() { return useInventoryStore.getState().getCurrency('gem-shard'); }
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); }); useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Fara actor', 'sorceress'), player = { ...fresh, level: 35, equipment: [], experience: 0, experienceToNextLevel: xpRequired(35) };
  const stats = deriveEquippedPlayerStats(player, 35, {});
  usePlayerStore.getState().setPlayer({ ...player, derivedStats: { ...stats, defense: stats.defense + 7, life: 3, mana: 2 } });
  useMapStore.setState({ currentAct: 2, currentSubAreaId: 'areas/act2-far-oasis', clearedSubAreas: ['areas/act1-catacombs'], questProgress: {
    [FARA.quest]: { id: FARA.quest, status: 'inProgress', rewardClaimed: false, objectives: { [FARA.objective]: false } },
    [FARA.prerequisite.quest]: { id: FARA.prerequisite.quest, status: 'completed', rewardClaimed: false, objectives: { 'obj-kill-radament': true } }
  } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });
describe('Fara public one-shard Claim', () => {
  it('pays ten canonical wishes with the catalyst once and leaves historical aliases untouched', () => {
    setupTalk(); useInventoryStore.setState({ currencies: { wishstone: 7, wishstones: 23, opaque: 4 } });
    expect(claimQuestReward(FARA.quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 17, wishstones: 23, opaque: 4, 'gem-shard': 1 });
    expect(claimQuestReward(FARA.quest)).toBe('already-claimed');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(17);
  });
  it.each(['before', 'after', 'noop'] as const)('restores both currencies after %s wish ingress and retries once', mode => {
    setupTalk(); const real = useInventoryStore.getState().addQuestCurrency;
    const mock = vi.spyOn(useInventoryStore.getState(), 'addQuestCurrency').mockImplementation(owner => {
      if (mode === 'before') throw new Error('before wishes');
      if (mode === 'after') { real(owner); throw new Error('after wishes'); }
    });
    expect(claimQuestReward(FARA.quest)).toBe('grant-failed');
    expect(useInventoryStore.getState().currencies).toEqual({});
    expect(useMapStore.getState().questReceipts[FARA.proof]).toBe(true);
    expect(useMapStore.getState().questProgress[FARA.quest]?.rewardClaimed).toBe(false);
    mock.mockRestore(); expect(claimQuestReward(FARA.quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 1, wishstone: 10 });
  });
  it('settles both keys before claimed-last and retains independent additions during failed claim and restoration', () => {
    setupTalk(); const real = useMapStore.getState().markQuestRewardClaimed;
    const mock = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 1, wishstone: 10 });
      real(id); useInventoryStore.getState().addCurrency('wishstone', 3); useInventoryStore.getState().addCurrency('gem-shard', 4);
      throw new Error('claimed-last');
    });
    let restored = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (restored || state.currencies.wishstone !== 3) return; restored = true;
      state.addCurrency('wishstone', 2); state.addCurrency('gem-shard', 1);
    }));
    expect(claimQuestReward(FARA.quest)).toBe('grant-failed'); expect(restored).toBe(true);
    expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 5, wishstone: 5 });
    expect(useMapStore.getState().questProgress[FARA.quest]?.rewardClaimed).toBe(false);
    mock.mockRestore(); expect(claimQuestReward(FARA.quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 6, wishstone: 15 });
  });
  it('refuses unsafe wishes before the catalyst and releases its partial reservation', () => {
    setupTalk(); useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER } });
    expect(claimQuestReward(FARA.quest)).toBe('unsupported-rewards');
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: Number.MAX_SAFE_INTEGER });
    useInventoryStore.setState({ currencies: {} }); expect(claimQuestReward(FARA.quest)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ 'gem-shard': 1, wishstone: 10 });
  });
  it('restores the source after a currency-rollback observer and reports an unknown wish overwrite without erasing it', () => {
    setupTalk(); const real = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      real(id); useInventoryStore.setState({ currencies: { ...useInventoryStore.getState().currencies, wishstone: 123 } });
      throw new Error('unknown overwrite');
    });
    let restored = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (restored || Object.hasOwn(state.currencies, 'gem-shard')) return; restored = true;
      const row = useMapStore.getState().questProgress[FARA.quest]; if (row) row.rewardClaimed = true;
    }));
    expect(() => claimQuestReward(FARA.quest)).toThrow(AggregateError); expect(restored).toBe(true);
    expect(useMapStore.getState().questProgress[FARA.quest]?.rewardClaimed).toBe(false);
    expect(useMapStore.getState().questReceipts[FARA.proof]).toBe(true);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 123 });
    expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });
  it('refuses real direct spend before debit during +1 publication, rolls back, releases, then retries once', () => {
    setupTalk(); let fired = false, debitError: unknown, debitResult: unknown, duringBalance: unknown;
    stops.push(useInventoryStore.subscribe(() => {
      if (fired || balance() !== 1) return; fired = true;
      try { debitResult = useInventoryStore.getState().spendCurrency('gem-shard', 1); } catch (error) { debitError = error; }
      duringBalance = balance(); throw new Error('direct-spend observer fault');
    }));
    let result: unknown; try { result = claimQuestReward(FARA.quest); } catch (error) { result = error; }
    expect(fired).toBe(true); expect(debitError).toMatchObject({ code: 'questBusy' }); expect(debitResult).toBeUndefined(); expect(duringBalance).toBe(1);
    expect(result).toBe('grant-failed'); expect(Object.hasOwn(useInventoryStore.getState().currencies, 'gem-shard')).toBe(false);
    expect(useMapStore.getState().questReceipts[FARA.proof]).toBe(true); expect(useMapStore.getState().questProgress[FARA.quest]?.rewardClaimed).toBe(false);
    expect(claimQuestReward(FARA.quest)).toBe('ok'); expect(balance()).toBe(1);
    expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true); expect(balance()).toBe(0);
    expect(claimQuestReward(FARA.quest)).toBe('already-claimed'); expect(talkToFara()).toBe('already-talked'); expect(balance()).toBe(0);
  });
  it('has a separate one-shard Claim anywhere without actor writes, XP, healing or cache normalization', () => {
    const before = structuredClone(hero());
    const playerWrite = vi.spyOn(usePlayerStore, 'setState'), mercWrite = vi.spyOn(useMercStore, 'setState');
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    setupTalk(); expect(balance()).toBe(0); expect(hero()).toEqual(before); expect(canClaim(FARA.quest)).toBe(true);
    useMapStore.setState({ currentAct: 1, selectedDifficulty: 'nightmare', clearedSubAreas: [], currentSubAreaId: null });
    expect(claimQuestReward(FARA.quest)).toBe('ok'); expect(balance()).toBe(1); expect(hero()).toEqual(before);
    expect(playerWrite).not.toHaveBeenCalled(); expect(mercWrite).not.toHaveBeenCalled(); expect(xp).not.toHaveBeenCalled();
    expect(useInventoryStore.getState().currencies.gemShards).toBeUndefined(); expect(useInventoryStore.getState().backpack).toEqual([]);
  });
  it.each(['before', 'after', 'noop'] as const)('handles owned ingress %s faults and retries cleanly', mode => {
    setupTalk(); const before = structuredClone(hero()), original = useInventoryStore.getState().addQuestGemShard;
    const spy = vi.spyOn(useInventoryStore.getState(), 'addQuestGemShard').mockImplementation(owner => {
      if (mode === 'before') throw new Error('before ingress');
      if (mode === 'after') { original(owner); throw new Error('after ingress'); }
    });
    expect(claimQuestReward(FARA.quest)).toBe('grant-failed'); expect(hero()).toEqual(before); expect(balance()).toBe(0);
    expect(Object.hasOwn(useInventoryStore.getState().currencies, 'gem-shard')).toBe(false);
    expect(useMapStore.getState().questProgress[FARA.quest]?.rewardClaimed).toBe(false);
    spy.mockRestore(); expect(claimQuestReward(FARA.quest)).toBe('ok'); expect(balance()).toBe(1);
  });
  it.each(['absent', 'own-zero', 'own-five'] as const)('preserves independent same-key additions/unrelated keys and %s baseline presence after fault', baseline => {
    setupTalk(); if (baseline !== 'absent') useInventoryStore.getState().addCurrency('gem-shard', baseline === 'own-zero' ? 0 : 5);
    let fired = false; const before = balance();
    stops.push(useInventoryStore.subscribe(() => { if (fired || balance() !== before + 1) return; fired = true;
      useInventoryStore.getState().addCurrency('gem-shard', 2); useInventoryStore.getState().addCurrency('opaque-independent', 7); throw new Error('independent wallet addition'); }));
    expect(claimQuestReward(FARA.quest)).toBe('grant-failed'); expect(balance()).toBe(before + 2);
    expect(useInventoryStore.getState().currencies['opaque-independent']).toBe(7);
    expect(claimQuestReward(FARA.quest)).toBe('ok'); expect(balance()).toBe(before + 3);
  });
  it.each([{ mode: 'real-xp', amount: 2 }, { mode: 'raw-xp', amount: 2 },
    { mode: 'real-xp', amount: xpRequired(35) + 2 }, { mode: 'raw-xp', amount: xpRequired(35) + 2 },
    { mode: 'damage', amount: 0 }] as const)('keeps actual independent $mode +$amount unchanged when claimed-last fails', ({ mode, amount }) => {
    setupTalk(); const beforeXp = xpTotal(hero().level) + hero().experience; let expected = structuredClone(hero());
    const original = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      original(id);
      if (mode === 'real-xp') usePlayerStore.getState().gainExperience(amount);
      if (mode === 'raw-xp') usePlayerStore.getState().addXP(amount);
      if (mode === 'damage') Object.assign(hero().derivedStats, { life: 1, mana: 1 });
      expected = structuredClone(hero()); throw new Error('claimed-last observer');
    });
    expect(claimQuestReward(FARA.quest)).toBe('grant-failed'); expect(hero()).toEqual(expected);
    expect(xpTotal(hero().level) + hero().experience).toBe(beforeXp + amount); expect(balance()).toBe(0);
  });
  it('refuses unsafe destination before publication and preserves completed proof for retry', () => {
    setupTalk(); useInventoryStore.getState().addCurrency('gem-shard', Number.MAX_SAFE_INTEGER);
    const claimed = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed'), grant = vi.spyOn(useInventoryStore.getState(), 'addQuestGemShard');
    expect(claimQuestReward(FARA.quest)).toBe('unsupported-rewards'); expect(balance()).toBe(Number.MAX_SAFE_INTEGER);
    expect(grant).not.toHaveBeenCalled(); expect(claimed).not.toHaveBeenCalled(); expect(useMapStore.getState().questReceipts[FARA.proof]).toBe(true);
  });
});
