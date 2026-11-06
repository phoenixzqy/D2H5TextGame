/** Constructed source capabilities; actual historical thaw ingress is covered separately. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import { ANYA as A } from '@/engine/map/anya-quest';
import { loadQuests } from '@/data/loaders/quests';
import * as itemRoller from '@/engine/loot/rollItem';
import { loadAwardPools } from '@/data/loaders/loot';
import { createRng } from '@/engine/rng';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { claimQuestReward } from './claimReward';
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing fixture'); return value; }
function hero() { return required(usePlayerStore.getState().player); }
function sources() { return structuredClone({ row: useMapStore.getState().questProgress[A.quest], receipts: useMapStore.getState().questReceipts, services: useInventoryStore.getState().questServices }); }
function canonical() { const map = useMapStore.getState(), inv = useInventoryStore.getState(), p = hero(); return deriveEquippedPlayerStats(p, p.level, inv.equipped, map.questProgress, inv.questItems, map.questReceipts).resistances; }
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); }); useHydrationStore.getState().setStatus('ready');
  const p = createMockPlayer('Anya Claim', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...p, derivedStats: { ...p.derivedStats, life: 3, mana: 2, defense: 999,
    resistances: { fire: 2, cold: 3, lightning: 4, poison: 5, arcane: 6, physical: 7 } } });
  useMapStore.setState({ currentAct: 5, questProgress: {
    [A.quest]: { id: A.quest, status: 'completed', rewardClaimed: false, objectives: { [A.objective]: true } },
    [A.prerequisite.quest]: { id: A.prerequisite.quest, status: 'completed', rewardClaimed: true, objectives: Object.fromEntries(A.prerequisite.objectiveIds.map(id => [id, true])) }
  }, questReceipts: { [A.proof]: true, [A.prerequisite.inspectProof]: true, [A.prerequisite.potionSource]: true, [A.prerequisite.thawProof]: true } });
  useInventoryStore.setState({ questItems: { [A.prerequisite.potionSource]: { itemId: A.prerequisite.potionItemId, state: 'consumed' } } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); __resetPersistenceForTests(); });

  it('settles finite side wishes once alongside the full existing reward', () => {
    const qid = A.quest;
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
    const qid = A.quest;
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
    const qid = A.quest;
    const before = wishParticipants(); useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER } });
    expect(claimQuestReward(qid)).toBe('unsupported-rewards'); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: Number.MAX_SAFE_INTEGER });
    useInventoryStore.setState({ currencies: {} }); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });
  it('settles finite side wishes before claimed-last, preserves independent additions, and restores source after currency observers', () => {
    const qid = A.quest;
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
    const qid = A.quest;
    const before = wishParticipants(), real = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      real(id); useInventoryStore.setState({ currencies: { wishstone: 123 } }); throw new Error('unknown overwrite');
    });
    expect(() => claimQuestReward(qid)).toThrow(AggregateError); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 123 });
    expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });

describe('Anya resistance-only Claim publication', () => {
  it('publishes six canonical resistances, the side charge and wishes with claimed last', () => {
    const before = structuredClone(hero()), gain = vi.spyOn(usePlayerStore.getState(), 'gainExperience'); let sawService = false, sawResistance = false, sawWishes = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (!state.questServices[A.serviceSource]) return;
      expect(useMapStore.getState().questProgress[A.quest]?.rewardClaimed).toBe(false);
      if (!sawService) { sawService = true; expect(hero()).toEqual(before); }
      if (state.currencies.wishstone === 10) {
        sawWishes = true; expect(sawResistance).toBe(true);
        expect(Object.values(hero().derivedStats.resistances)).toEqual([10, 10, 10, 10, 10, 10]);
        expect(state.questServices[A.serviceSource]?.state).toBe('available');
      }
    }));
    stops.push(usePlayerStore.subscribe(state => { if (!state.player || state.player.derivedStats.resistances.fire !== 10) return;
      sawResistance = true; expect(useMapStore.getState().questProgress[A.quest]?.rewardClaimed).toBe(false);
      expect(useInventoryStore.getState().questServices[A.serviceSource]?.state).toBe('available');
    }));
    expect(claimQuestReward(A.quest)).toBe('ok'); expect(sawService).toBe(true); expect(sawResistance).toBe(true); expect(sawWishes).toBe(true); expect(gain).not.toHaveBeenCalled();
    expect({ ...hero(), derivedStats: { ...hero().derivedStats, resistances: before.derivedStats.resistances } }).toEqual(before);
    expect(Object.values(hero().derivedStats.resistances)).toEqual([10, 10, 10, 10, 10, 10]);
    expect(claimQuestReward(A.quest)).toBe('already-claimed'); expect(useInventoryStore.getState().backpack).toEqual([]);
  });
  it.each(['service-noop', 'service-prethrow', 'service-postthrow', 'resistance-noop', 'resistance-prethrow', 'resistance-postthrow', 'claimed-noop', 'claimed-prethrow', 'claimed-postthrow'] as const)(
    'restores exact accepted vector/service/row after %s then cleanly retries', fault => {
      const beforeHero = structuredClone(hero()), before = sources(); let fired = false;
      if (fault === 'service-noop' || fault === 'service-prethrow') vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce(() => { if (fault.endsWith('prethrow')) throw new Error(fault); });
      if (fault === 'resistance-noop' || fault === 'resistance-prethrow') vi.spyOn(usePlayerStore, 'setState').mockImplementationOnce(() => { if (fault.endsWith('prethrow')) throw new Error(fault); });
      if (fault === 'claimed-noop' || fault === 'claimed-prethrow') vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementationOnce(() => { if (fault.endsWith('prethrow')) throw new Error(fault); });
      const observe = () => { if (fired) return;
        const reached = fault === 'service-postthrow' ? !!useInventoryStore.getState().questServices[A.serviceSource] : fault === 'resistance-postthrow' ? hero().derivedStats.resistances.fire === 10 : fault === 'claimed-postthrow' && useMapStore.getState().questProgress[A.quest]?.rewardClaimed;
        if (reached) { fired = true; throw new Error(fault); }
      };
      stops.push(useInventoryStore.subscribe(observe), usePlayerStore.subscribe(observe), useMapStore.subscribe(observe));
      expect(claimQuestReward(A.quest)).toBe('grant-failed'); expect(hero()).toEqual(beforeHero); expect(sources()).toEqual(before);
      vi.restoreAllMocks(); expect(claimQuestReward(A.quest)).toBe('ok');
    });
  it.each(['raw-xp', 'real-xp', 'core', 'source', 'equipment', 'damage', 'foreign', 'removed'] as const)(
    'preserves independent %s after resistance publication failure', action => {
      const before = structuredClone(hero()); let fired = false, applied = false; let independent: ReturnType<typeof usePlayerStore.getState>['player'] = structuredClone(hero());
      stops.push(usePlayerStore.subscribe(state => {
        if (fired || state.player?.derivedStats.resistances.fire !== 10) return; fired = true;
        if (action === 'raw-xp') usePlayerStore.getState().addXP(100000);
        if (action === 'real-xp') usePlayerStore.getState().gainExperience(100000);
        if (action === 'core') usePlayerStore.getState().updateStats({ energy: hero().coreStats.energy + 3 });
        if (action === 'source') {
          const q = required(loadQuests().find(row => row.id === 'quests/act2-tainted-sun'));
          useMapStore.setState(map => ({ questProgress: { ...map.questProgress, [q.id]: { id: q.id, status: 'completed', rewardClaimed: true,
            objectives: Object.fromEntries(q.objectives.map(objective => [objective.id, true])) } } }));
        }
        if (action === 'equipment') {
          const pools = loadAwardPools(), base = required([...pools.bases.values()].find(base => base.type === 'armor' && base.reqLevel <= 1 && base.slot === 'chest'));
          const gear = required(itemRoller.rollItem({ baseId: base.id, rarity: 'normal', ilvl: 1 }, pools, createRng(4)));
          useInventoryStore.getState().addItem(gear); expect(useInventoryStore.getState().equipItem(gear).ok).toBe(true);
        }
        if (action === 'damage') usePlayerStore.setState({ player: { ...hero(), name: 'independent name', derivedStats: { ...hero().derivedStats, life: 1, mana: 1 } } });
        if (action === 'foreign') usePlayerStore.setState({ player: createMockPlayer('Foreign', 'barbarian') });
        if (action === 'removed') usePlayerStore.setState({ player: null });
        independent = structuredClone(usePlayerStore.getState().player); applied = true; throw new Error(`independent ${action}`);
      }));
      expect(claimQuestReward(A.quest)).toBe('grant-failed'); expect(fired).toBe(true); expect(applied).toBe(true);
      expect(useInventoryStore.getState().questServices[A.serviceSource]).toBeUndefined(); expect(useMapStore.getState().questProgress[A.quest]?.rewardClaimed).toBe(false);
      if (action === 'foreign' || action === 'removed') expect(usePlayerStore.getState().player).toEqual(independent);
      else {
        const after = hero(), expected = required<NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>>(independent);
        expect({ ...after, derivedStats: { ...after.derivedStats, resistances: expected.derivedStats.resistances } }).toEqual(expected);
        expect(after.derivedStats.resistances).toEqual(['raw-xp', 'damage'].includes(action) ? before.derivedStats.resistances : canonical());
      }
    });
  it('attempts later source/service restoration after one setter throws and exposes restoration failure', () => {
    const before = structuredClone(hero()); let fired = false;
    stops.push(usePlayerStore.subscribe(state => { if (fired || state.player?.derivedStats.resistances.fire !== 10) return; fired = true;
      vi.spyOn(useMapStore, 'setState').mockImplementationOnce(() => { throw new Error('row restore failed'); }); throw new Error('trigger rollback');
    }));
    expect(() => claimQuestReward(A.quest)).toThrow(AggregateError); expect(useInventoryStore.getState().questServices[A.serviceSource]).toBeUndefined(); expect(hero()).toEqual(before);
  });
});
