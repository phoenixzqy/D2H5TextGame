/** Constructed completed-cycle controls; native source is exercised separately. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { REGIONAL_BOUNTY_DOMAIN, REGIONAL_BOUNTY_MAX_CLAIMS } from '@/engine/map/regional-bounties';
import { loadMercPool } from '@/data/loaders/mercs';
import * as quests from '@/data/loaders/quests';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { createMercFromDef } from '@/stores/mercFactory';
import { __resetPersistenceForTests, exportCurrentSave, importIntoStores, useHydrationStore } from '@/stores/persistence';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { canClaim, claimQuestReward } from './claimReward';
import { repeatRegionalBounty } from './bountyQuestActions';
import { withQuestTransaction } from './questTransaction';

const first = REGIONAL_BOUNTY_DOMAIN[0], other = REGIONAL_BOUNTY_DOMAIN[1];
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing bounty test fixture'); return value; }
function stopObservers() { stops.splice(0).forEach(stop => { stop(); }); }
function actors() {
  const mercs = useMercStore.getState();
  return structuredClone({ hero: usePlayerStore.getState().player, ownedMercs: mercs.ownedMercs, mercProgress: mercs.mercProgress,
    fieldedMercId: mercs.fieldedMercId, mercEquipment: mercs.mercEquipment });
}
function state() {
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  return structuredClone({ ...actors(), rows: map.questProgress, entries: map.bounties, receipts: map.questReceipts,
    currencies: inv.currencies, materials: inv.materials, questItems: inv.questItems, backpack: inv.backpack, equipped: inv.equipped });
}
function ready(claims = 0) {
  useMapStore.setState({ questProgress: { [first.quest]: { id: first.quest, status: 'completed',
    objectives: { [first.objective]: true }, rewardClaimed: false } },
  bounties: { [first.quest]: { claims, victoryOrdinal: claims + 1 } } });
}
function onShard(operation: () => void) {
  const baseline = useInventoryStore.getState().currencies['gem-shard'] ?? 0; let fired = false;
  stops.push(useInventoryStore.subscribe(current => {
    if (fired || current.currencies['gem-shard'] !== baseline + 1) return; fired = true; operation();
  }));
  return () => { expect(fired).toBe(true); };
}
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready'); usePlayerStore.getState().setPlayer(createMockPlayer('Bounty Claim', 'sorceress'));
  useInventoryStore.setState({ currencies: { gold: 41, gemShards: 17, unrelated: 9 } }); ready();
});
afterEach(() => { stopObservers(); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });

describe('currency-only separate public regional bounty Claim', () => {
  it('pays exactly one canonical shard and counter, anywhere/difficulty, with no actor mutation or XP calls', async () => {
    const hero = required(usePlayerStore.getState().player);
    usePlayerStore.setState({ player: { ...hero, derivedStats: { ...hero.derivedStats, defense: hero.derivedStats.defense + 7 } } });
    const actor = createMercFromDef(required(loadMercPool().pool[0]), 'bounty-stale-merc');
    useMercStore.getState().addMerc({ ...actor, derivedStats: { ...actor.derivedStats, defense: actor.derivedStats.defense + 11 } });
    useMercStore.getState().setFieldedMerc(actor.id);
    const accepted = state(); await importIntoStores(required(exportCurrentSave())); expect(state()).toEqual(accepted);
    useMapStore.setState({ currentAct: 5, currentSubAreaId: null, selectedDifficulty: 'hell' });
    const before = state(), heroXp = vi.spyOn(usePlayerStore.getState(), 'gainExperience'), mercXp = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    expect(canClaim(first.quest)).toBe(true); expect(claimQuestReward(first.quest)).toBe('ok');
    expect(actors()).toEqual({ hero: before.hero, ownedMercs: before.ownedMercs, mercProgress: before.mercProgress,
      fieldedMercId: before.fieldedMercId, mercEquipment: before.mercEquipment });
    expect(heroXp).not.toHaveBeenCalled(); expect(mercXp).not.toHaveBeenCalled();
    expect(useInventoryStore.getState().currencies).toEqual({ ...before.currencies, 'gem-shard': 1 });
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 1, victoryOrdinal: 1 });
    expect(useMapStore.getState().questProgress[first.quest]?.rewardClaimed).toBe(true);
    const paid = state(); expect(claimQuestReward(first.quest)).toBe('already-claimed'); expect(state()).toEqual(paid);
    expect(useInventoryStore.getState().backpack).toEqual(before.backpack); expect(useInventoryStore.getState().materials).toEqual(before.materials);
  });

  it('refuses real direct spend before debit inside the actual grant observer and releases for retry', () => {
    const before = state(); let refusal: unknown, balance: number | undefined;
    const fired = onShard(() => {
      try { useInventoryStore.getState().spendCurrency('gem-shard', 1); } catch (error) { refusal = error; }
      balance = useInventoryStore.getState().currencies['gem-shard']; throw new Error('abort bounty publication');
    });
    expect(claimQuestReward(first.quest)).toBe('grant-failed'); fired();
    expect(refusal).toBeInstanceOf(WaveGuardError); expect(refusal).toMatchObject({ code: 'questBusy' });
    expect(balance).toBe(1); expect(state()).toEqual(before); stopObservers();
    expect(claimQuestReward(first.quest)).toBe('ok'); expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true);
  });

  it.each([undefined, 0, 7])('preserves independent same-wallet additions with baseline%s through own rollback', baseline => {
    useInventoryStore.setState(current => ({ currencies: { ...current.currencies,
      ...(baseline === undefined ? {} : { 'gem-shard': baseline }) } }));
    const before = actors(); const fired = onShard(() => {
      useInventoryStore.getState().addCurrency('gem-shard', 3); useInventoryStore.getState().addCurrency('unrelated', 5);
      useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [other.quest]: {
        id: other.quest, status: 'inProgress', rewardClaimed: false, objectives: { [other.objective]: false } } },
      bounties: { ...state.bounties, [other.quest]: { claims: 0, victoryOrdinal: 0 } } }));
      throw new Error('after independent wallet/source changes');
    });
    expect(claimQuestReward(first.quest)).toBe('grant-failed'); fired(); expect(actors()).toEqual(before);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe((baseline ?? 0) + 3);
    expect(useInventoryStore.getState().currencies.unrelated).toBe(14);
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 0, victoryOrdinal: 1 });
    expect(useMapStore.getState().bounties[other.quest]).toEqual({ claims: 0, victoryOrdinal: 0 });
    stopObservers(); expect(claimQuestReward(first.quest)).toBe('ok');
  });

  it('retains additions during restoration and fences nested Claim/Repeat until exact owner release', () => {
    let granted = false, restored = false; const nested: string[] = [];
    stops.push(useInventoryStore.subscribe(current => {
      if (!granted && current.currencies['gem-shard'] === 1) {
        granted = true; current.addCurrency('gem-shard', 2); throw new Error('grant observer');
      }
      if (granted && !restored && current.currencies['gem-shard'] === 2) {
        restored = true; nested.push(claimQuestReward(first.quest), repeatRegionalBounty(first.quest));
        current.addCurrency('gem-shard', 3);
      }
    }));
    expect(claimQuestReward(first.quest)).toBe('grant-failed'); expect(restored).toBe(true);
    expect(nested).toEqual(['claim-in-progress', 'claim-in-progress']);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(5); stopObservers();
    expect(claimQuestReward(first.quest)).toBe('ok'); expect(useInventoryStore.getState().spendCurrency('gem-shard', 6)).toBe(true);
  });

  it.each(['shard-before', 'shard-after', 'shard-noop', 'row-before', 'row-after', 'row-noop'] as const)(
    'restores exact unpaid row/counters after %s and permits one successful retry', fault => {
      const before = state(); let reached = false;
      if (fault.startsWith('shard')) {
        const real = useInventoryStore.getState().addQuestGemShard;
        vi.spyOn(useInventoryStore.getState(), 'addQuestGemShard').mockImplementation(owner => {
          reached = true; if (fault.endsWith('before')) throw new Error('before shard'); if (fault.endsWith('noop')) return;
          real(owner); throw new Error('after shard');
        });
      } else {
        const real = useMapStore.setState;
        vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => {
          reached = true; if (fault.endsWith('before')) throw new Error('before paid row'); if (fault.endsWith('noop')) return;
          real(update); throw new Error('after paid row');
        });
      }
      expect(claimQuestReward(first.quest)).toBe('grant-failed'); expect(reached).toBe(true); expect(state()).toEqual(before);
      vi.restoreAllMocks(); expect(claimQuestReward(first.quest)).toBe('ok'); expect(claimQuestReward(first.quest)).toBe('already-claimed');
    });

  it('refuses unsafe destination before source writes and still pays the final legal cycle once', () => {
    useInventoryStore.getState().addCurrency('gem-shard', Number.MAX_SAFE_INTEGER);
    const before = state(), shard = vi.spyOn(useInventoryStore.getState(), 'addQuestGemShard'), publish = vi.spyOn(useMapStore, 'setState');
    expect(claimQuestReward(first.quest)).toBe('unsupported-rewards'); expect(state()).toEqual(before);
    expect(shard).not.toHaveBeenCalled(); expect(publish).not.toHaveBeenCalled(); vi.restoreAllMocks();
    useInventoryStore.setState({ currencies: {} }); ready(REGIONAL_BOUNTY_MAX_CLAIMS - 1);
    expect(claimQuestReward(first.quest)).toBe('ok');
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: REGIONAL_BOUNTY_MAX_CLAIMS, victoryOrdinal: REGIONAL_BOUNTY_MAX_CLAIMS });
    expect(repeatRegionalBounty(first.quest)).toBe('exhausted');
  });

  it('reports ambiguous overwrites and restoration errors explicitly while releasing owners', () => {
    const fired = onShard(() => {
      useInventoryStore.setState(state => ({ currencies: { ...state.currencies, 'gem-shard': 500 } }));
      throw new Error('raw ambiguous overwrite');
    });
    expect(() => claimQuestReward(first.quest)).toThrow(AggregateError); fired(); stopObservers();
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(500);
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 0, victoryOrdinal: 1 });
    expect(useInventoryStore.getState().spendCurrency('gem-shard', 1)).toBe(true);
    expect(withQuestTransaction(() => 'released')).toBe('released');
    const restore = useInventoryStore.getState().restoreQuestGemShard;
    vi.spyOn(useInventoryStore.getState(), 'restoreQuestGemShard').mockImplementation(owner => { restore(owner); throw new Error('restore observer'); });
    const reached = onShard(() => { throw new Error('abort again'); });
    expect(() => claimQuestReward(first.quest)).toThrow(AggregateError); reached(); stopObservers(); vi.restoreAllMocks();
    expect(claimQuestReward(first.quest)).toBe('ok');
  });

  it.each([{ gemShards: 2 }, { gemShards: 1, xp: 0 }, { gemShards: 1, gold: 0 }])('refuses whole bag drift%j before writes', bag => {
    const changed = quests.loadQuests().map(quest => quest.id === first.quest ? { ...quest, rewards: bag } : quest);
    vi.spyOn(quests, 'loadQuests').mockReturnValue(changed); const before = state();
    expect(canClaim(first.quest)).toBe(false); expect(claimQuestReward(first.quest)).toBe('unsupported-rewards'); expect(state()).toEqual(before);
  });
});
