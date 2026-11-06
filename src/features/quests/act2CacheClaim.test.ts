import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import { ACT2_CACHES, type Act2CacheKey } from '@/engine/map/act2-cache-quests';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { xpRequired, xpTotal } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercXpForLevel } from '@/stores/mercStore';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { recoverQuestTool } from './interactObject';
import { canClaim, claimQuestReward } from './claimReward';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing cache fixture'); return value; }
const hero = () => required(usePlayerStore.getState().player);
const totalHero = () => xpTotal(hero().level) + hero().experience;
function prepare(key: Act2CacheKey, recover = true) {
  const d = ACT2_CACHES[key];
  useMapStore.setState(state => ({ currentAct: 2, currentSubAreaId: d.areaId, selectedDifficulty: 'normal',
    clearedSubAreas: ['areas/act1-catacombs'], questProgress: { ...state.questProgress,
      [d.quest]: { id: d.quest, status: 'inProgress', rewardClaimed: false, objectives: { [d.objective]: false } } } }));
  if (recover) expect(recoverQuestTool(d.source)).toBe('ok');
  return d;
}
function hire() {
  const actor = createMercFromDef(required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee')), 'actual-cache');
  const damaged = { ...actor, derivedStats: { ...actor.derivedStats, life: 7, mana: 3 } };
  useMercStore.getState().addMerc(damaged); useMercStore.getState().setFieldedMerc(damaged.id); return damaged;
}
function totalMerc(id: string) {
  const state = useMercStore.getState(), actor = required(state.ownedMercs.find(row => row.id === id));
  let value = state.getMercProgress(id).experience;
  for (let level = 1; level < actor.level; level++) value += mercXpForLevel(level);
  return value;
}
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Cache owner', 'sorceress');
  const player = { ...fresh, level: 35, equipment: [], experience: 0, experienceToNextLevel: xpRequired(35) };
  const derivedStats = deriveEquippedPlayerStats(player, 35, {});
  usePlayerStore.getState().setPlayer({ ...player, derivedStats: { ...derivedStats, defense: derivedStats.defense + 7, life: 7, mana: 3 } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });
describe.each(['horazon', 'elzix'] as const)('cache %s whole-bag composition', key => {
  function wishParticipants() {
    const p = usePlayerStore.getState().player, inv = useInventoryStore.getState(), map = useMapStore.getState();
    return structuredClone({ heroProgress: p && [p.level, p.experience, p.statPoints, p.skillPoints, p.derivedStats.life, p.derivedStats.mana],
      rows: map.questProgress, receipts: map.questReceipts, items: inv.questItems, services: inv.questServices,
      backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped });
  }
  it.each(['before', 'after', 'noop'] as const)('restores finite side wish ingress %s with all old rewards and permits one full retry', mode => {
    const qid = prepare(key).quest;
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
    const qid = prepare(key).quest;
    const before = wishParticipants(); useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER } });
    expect(claimQuestReward(qid)).toBe('unsupported-rewards'); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: Number.MAX_SAFE_INTEGER });
    useInventoryStore.setState({ currencies: {} }); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });
  it('settles finite side wishes before claimed-last, preserves independent additions, and restores source after currency observers', () => {
    const qid = prepare(key).quest;
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
    const qid = prepare(key).quest;
    const before = wishParticipants(), real = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      real(id); useInventoryStore.setState({ currencies: { wishstone: 123 } }); throw new Error('unknown overwrite');
    });
    expect(() => claimQuestReward(qid)).toThrow(AggregateError); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 123 });
    expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });

  it('settles finite side wishes once alongside the full existing reward', () => {
    const qid = prepare(key).quest;
    useInventoryStore.setState({ currencies: { wishstone: 7, wishstones: 23, opaque: 4 } });
    expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 17, wishstones: 23, opaque: 4 });
    expect(claimQuestReward(qid)).toBe('already-claimed');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(17);
  });

  it('actual Recover grants zero; separate public Claim pays exact real unique/hero/merc XP once', () => {
    const actor = hire(), before = totalHero(), beforeMerc = totalMerc(actor.id), beforeHero = structuredClone(hero());
    const d = prepare(key);
    expect(totalHero()).toBe(before); expect(totalMerc(actor.id)).toBe(beforeMerc); expect(hero()).toEqual(beforeHero);
    expect(canClaim(d.quest)).toBe(true); expect(claimQuestReward(d.quest)).toBe('ok');
    expect(totalHero() - before).toBe(d.xp); expect(totalMerc(actor.id) - beforeMerc).toBe(d.mercXp);
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
    expect(useInventoryStore.getState().backpack[0]).toMatchObject({ uniqueId: d.uniqueId, ilvl: d.ilvl, equipped: false });
    expect(useInventoryStore.getState().questItems[d.source]).toEqual({ itemId: d.itemId, state: 'owned' });
    expect(hero().derivedStats).toEqual(deriveEquippedPlayerStats(hero(), hero().level, {}, useMapStore.getState().questProgress,
      useInventoryStore.getState().questItems, useMapStore.getState().questReceipts));
    expect(hero().derivedStats.life).toBe(7); expect(hero().derivedStats.mana).toBe(3);
    expect(claimQuestReward(d.quest)).toBe('already-claimed');
  });
  it.each([2, 2000])('preserves independent real actual-recipient XP %s after the owned share fails', independent => {
    const actor = hire(), d = prepare(key), before = totalMerc(actor.id); let fired = false;
    stops.push(useMercStore.subscribe(() => { if (fired) return; fired = true;
      useMercStore.getState().addExperience(actor.id, independent);
      throw new Error('independent recipient publication');
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed');
    expect(totalMerc(actor.id)).toBe(before + independent);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
  });
  it.each(([false, true] as const).flatMap(supported => (['own-cleanup', 'independent-xp', 'raw-xp', 'damage', 'independent-gear'] as const).map(mode => ({ supported, mode }))))('scopes physical cleanup ($supported supported equip) and $mode recomposition', ({ supported, mode }) => {
    const d = prepare(key), before = structuredClone(hero()), baseXp = totalHero(); let fired = false;
    stops.push(useInventoryStore.subscribe(() => {
      const reward = useInventoryStore.getState().backpack.find(item => item.uniqueId === d.uniqueId);
      if (fired || !reward) return; fired = true;
      if (supported) {
        // Supported equip independently normalizes the hero before cleanup.
        expect(useInventoryStore.getState().equipItem(reward).ok).toBe(true);
      } else {
        // Stage only physical ownership; cleanup must cause the first recomposition.
        const slot = key === 'horazon' ? 'ring-left' as const : 'amulet' as const;
        const equipped = { ...reward, equipped: true, equipSlot: slot };
        useInventoryStore.setState(state => ({ backpack: state.backpack.filter(item => item !== reward), equipped: { ...state.equipped, [slot]: equipped } }));
        const live = hero(); usePlayerStore.setState({ player: { ...live, equipment: [...live.equipment, equipped] } });
      }
      if (mode === 'independent-xp') usePlayerStore.getState().gainExperience(2);
      if (mode === 'raw-xp') usePlayerStore.getState().addXP(2);
      if (mode === 'damage') {
        Object.assign(hero().derivedStats, { life: 3, mana: 2 });
      }
      if (mode === 'independent-gear') {
        useInventoryStore.setState(state => ({ equipped: { ...state.equipped, chest: { id: 'independent-chest',
          baseId: 'items/base/armor-quilted', rarity: 'normal', level: 1, identified: true, equipped: true,
          equipSlot: 'chest', baseRolls: { defense: 9 } } } }));
        usePlayerStore.getState().gainExperience(0);
      }
      throw new Error('fault after actual reward equip');
    }));
    expect(claimQuestReward(d.quest)).toBe('grant-failed'); expect(fired).toBe(true);
    expect(totalHero()).toBe(baseXp + (mode === 'independent-xp' || mode === 'raw-xp' ? 2 : 0));
    expect(useInventoryStore.getState().backpack.some(item => item.uniqueId === d.uniqueId)).toBe(false);
    expect(Object.values(useInventoryStore.getState().equipped).some(item => item?.uniqueId === d.uniqueId)).toBe(false);
    expect(hero().derivedStats).toEqual(supported || mode === 'independent-xp' || mode === 'independent-gear'
      ? deriveEquippedPlayerStats(hero(), hero().level, useInventoryStore.getState().equipped,
        useMapStore.getState().questProgress, useInventoryStore.getState().questItems, useMapStore.getState().questReceipts)
      : { ...before.derivedStats, life: mode === 'damage' ? 3 : 7, mana: mode === 'damage' ? 2 : 3 });
    expect(useMapStore.getState().questProgress[d.quest]?.rewardClaimed).toBe(false);
  });
});
it('pays independent caches sequentially and preserves other paid proof/item on failed second Claim', () => {
  const first = prepare('horazon'); expect(claimQuestReward(first.quest)).toBe('ok');
  const firstItem = structuredClone(useInventoryStore.getState().backpack[0]), paidRow = structuredClone(useMapStore.getState().questProgress[first.quest]);
  const second = prepare('elzix'), before = totalHero();
  const original = useMapStore.getState().markQuestRewardClaimed;
  vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => { original(id); throw new Error('claimed-last'); });
  expect(claimQuestReward(second.quest)).toBe('grant-failed');
  expect(totalHero()).toBe(before); expect(useInventoryStore.getState().backpack).toEqual([firstItem]);
  expect(useMapStore.getState().questProgress[first.quest]).toEqual(paidRow);
  expect(useInventoryStore.getState().questItems[first.source]).toEqual({ itemId: first.itemId, state: 'owned' });
  vi.restoreAllMocks(); expect(claimQuestReward(second.quest)).toBe('ok');
  expect(totalHero() - before).toBe(second.xp); expect(useInventoryStore.getState().backpack).toHaveLength(2);
});
