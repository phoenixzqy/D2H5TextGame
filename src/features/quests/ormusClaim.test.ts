/** Constructed completion capabilities; earning the clear is tested at the native boundary. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import sideDocument from '@/data/quests/side.json';
import { ORMUS } from '@/engine/map/ormus-quest';
import { xpTotal } from '@/engine/progression/xp';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import * as rolls from '@/engine/loot/rollItem';
import { canClaim, claimQuestReward } from './claimReward';

const stores = [useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore] as const;
const quest = sideDocument.quests.find(row => row.id === ORMUS.quest);
if (!quest) throw new Error('Missing authored Ormus quest');
const rewardDescriptor = Object.getOwnPropertyDescriptor(quest, 'rewards');
if (!rewardDescriptor) throw new Error('Missing Ormus reward');
function hero() { const value = usePlayerStore.getState().player; if (!value) throw new Error('No hero'); return value; }
function state() {
  return structuredClone(stores.map(store => Object.fromEntries(Object.entries(store.getState())
    .filter(([, value]) => typeof value !== 'function'))));
}
function hire() {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee'); if (!definition) throw new Error('No mercenary');
  const merc = createMercFromDef(definition, String(useMercStore.getState().ownedMercs.length)); useMercStore.getState().addMerc(merc);
  useMercStore.getState().setFieldedMerc(merc.id); return merc.id;
}
function totalMercXp(id: string) {
  const merc = useMercStore.getState().ownedMercs.find(row => row.id === id); if (!merc) throw new Error('Missing merc');
  let total = useMercStore.getState().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function reset() {
  __resetPersistenceForTests(); for (const store of stores) store.getState().reset();
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  Object.defineProperty(quest, 'rewards', { ...rewardDescriptor,
    value: { xp: 5000, itemDrop: { uniqueId: 'items/unique/ormus-charm', ilvl: 32 }, wishstones: 10 } });
  usePlayerStore.getState().setPlayer(createMockPlayer('Ormus Claim', 'sorceress'));
  useMapStore.setState({ currentAct: 3, currentSubAreaId: ORMUS.area, selectedDifficulty: 'normal',
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha'],
    questProgress: { [ORMUS.quest]: { id: ORMUS.quest, status: 'completed', rewardClaimed: false,
      objectives: { [ORMUS.first]: true, [ORMUS.talk]: true } } }, questReceipts: { [ORMUS.proof]: true } });
});
afterEach(() => {
  vi.restoreAllMocks(); Object.defineProperty(quest, 'rewards', rewardDescriptor); reset();
  useHydrationStore.getState().setStatus('idle');
});


  it('settles finite side wishes once alongside the full existing reward', () => {
    const qid = ORMUS.quest;
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
    const qid = ORMUS.quest;
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
    const qid = ORMUS.quest;
    const before = wishParticipants(); useInventoryStore.setState({ currencies: { wishstone: Number.MAX_SAFE_INTEGER } });
    expect(claimQuestReward(qid)).toBe('unsupported-rewards'); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: Number.MAX_SAFE_INTEGER });
    useInventoryStore.setState({ currencies: {} }); expect(claimQuestReward(qid)).toBe('ok');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
  });
  it('settles finite side wishes before claimed-last, preserves independent additions, and restores source after currency observers', () => {
    const qid = ORMUS.quest;
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
    const qid = ORMUS.quest;
    const before = wishParticipants(), real = useMapStore.getState().markQuestRewardClaimed;
    vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(id => {
      real(id); useInventoryStore.setState({ currencies: { wishstone: 123 } }); throw new Error('unknown overwrite');
    });
    expect(() => claimQuestReward(qid)).toThrow(AggregateError); expect(wishParticipants()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 123 });
    expect(useInventoryStore.getState().spendCurrency('wishstone', 1)).toBe(true);
  });

describe('protected exact Ormus Claim', () => {
  it.each([false, true])('grants one exact charm and 5000/3750 XP once; fielded=%s', fielded => {
    const id = fielded ? hire() : undefined;
    const mercBefore = id ? totalMercXp(id) : 0;
    const beforeXp = xpTotal(hero().level) + hero().experience;
    expect(canClaim(ORMUS.quest)).toBe(true); expect(claimQuestReward(ORMUS.quest)).toBe('ok');
    expect(xpTotal(hero().level) + hero().experience).toBe(beforeXp + 5000);
    if (id) expect(totalMercXp(id)).toBe(mercBefore + 3750);
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
    expect(useInventoryStore.getState().backpack[0]).toMatchObject({ uniqueId: 'items/unique/ormus-charm',
      baseId: 'items/base/small-charm', ilvl: 32, identified: true, equipped: false });
    const before = state(); expect(canClaim(ORMUS.quest)).toBe(false);
    expect(claimQuestReward(ORMUS.quest)).toBe('already-claimed'); expect(state()).toEqual(before);
  });
  it.each(['proofless', 'talk-missing', 'first-missing', 'wrong-difficulty', 'combat'] as const)(
    'refuses %s before unique allocation or publications', fault => {
      if (fault === 'proofless') useMapStore.setState({ questReceipts: {} });
      const row = useMapStore.getState().questProgress[ORMUS.quest]; if (!row) throw new Error('No row');
      if (fault === 'talk-missing') Object.assign(row.objectives, { [ORMUS.talk]: false });
      if (fault === 'first-missing') Object.assign(row.objectives, { [ORMUS.first]: false });
      if (fault === 'wrong-difficulty') useMapStore.setState({ selectedDifficulty: 'nightmare' });
      if (fault === 'combat') useCombatStore.setState({ inCombat: true });
      const allocate = vi.spyOn(rolls, 'rollUniqueItem'), before = state();
      expect(canClaim(ORMUS.quest)).toBe(false); expect(claimQuestReward(ORMUS.quest)).toBe('not-completed');
      expect(allocate).not.toHaveBeenCalled(); expect(state()).toEqual(before);
    });
  it('retains the earned charm in visible overflow without removing existing items', () => {
    const item = { id: 'existing', baseId: 'items/base/helm-cap', rarity: 'normal' as const, level: 1,
      identified: true, equipped: false };
    useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY + 1 }, (_, index) => ({ ...item, id: `existing-${String(index)}` })) });
    const before = structuredClone(useInventoryStore.getState().backpack);
    expect(claimQuestReward(ORMUS.quest)).toBe('ok');
    expect(useInventoryStore.getState().backpack.slice(0, -1)).toEqual(before);
    expect(useInventoryStore.getState().backpack).toHaveLength(BACKPACK_CAPACITY + 2);
  });
  it.each(['stash', 'equip'] as const)('conserves ownership when real addItem subscriber moves to %s then throws, and permits retry', destination => {
    const before = state(); let moved = false;
    const unsub = useInventoryStore.subscribe(current => {
      const item = current.backpack.find(row => row.uniqueId === 'items/unique/ormus-charm');
      if (!item || moved) return; moved = true;
      if (destination === 'stash') current.moveToStash(item.id); else current.equipItem(item);
      throw new Error('observer transfer then throw');
    });
    try { expect(claimQuestReward(ORMUS.quest)).toBe('grant-failed'); } finally { unsub(); }
    expect(moved).toBe(true); expect(state()).toEqual(before);
    expect(claimQuestReward(ORMUS.quest)).toBe('ok');
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
  });
  it.each(['mutate-hero', 'mutate-source', 'silent-claimed', 'mutate-proof'] as const)(
    'restores deep participating values after %s and retains unrelated journals', fault => {
      const id = hire(), beforeHero = structuredClone(hero()), beforeMerc = structuredClone(useMercStore.getState().ownedMercs),
        beforeProgress = structuredClone(useMercStore.getState().mercProgress), beforeRow = structuredClone(useMapStore.getState().questProgress[ORMUS.quest]);
      const beforeXp = totalMercXp(id);
      const addItem = useInventoryStore.getState().addItem;
      if (fault === 'silent-claimed') vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(() => undefined);
      else vi.spyOn(useInventoryStore.getState(), 'addItem').mockImplementation(item => {
        addItem(item);
        useMapStore.setState(state => ({ questProgress: { ...state.questProgress, unrelated: { id: 'unrelated', status: 'inProgress', objectives: {} } } }));
        if (fault === 'mutate-hero') Object.assign(hero().coreStats, { strength: -1 });
        if (fault === 'mutate-source') Object.assign(useMapStore.getState().questProgress[ORMUS.quest]?.objectives ?? {}, { [ORMUS.first]: false });
        if (fault === 'mutate-proof') Reflect.deleteProperty(useMapStore.getState().questReceipts, ORMUS.proof);
      });
      expect(claimQuestReward(ORMUS.quest)).toBe('grant-failed');
      expect(hero()).toEqual(beforeHero); expect(useMercStore.getState().ownedMercs).toEqual(beforeMerc);
      expect(useMercStore.getState().mercProgress).toEqual(beforeProgress); expect(totalMercXp(id)).toBe(beforeXp);
      expect(useInventoryStore.getState().backpack).toEqual([]);
      expect(useMapStore.getState().questProgress[ORMUS.quest]).toEqual(beforeRow);
      expect(useMapStore.getState().questReceipts[ORMUS.proof]).toBe(true);
      if (fault !== 'silent-claimed') expect(useMapStore.getState().questProgress).toHaveProperty('unrelated');
    });
  it('keeps the original mercenary recipient if a grant observer changes the fielded selection', () => {
    const original = hire(), other = hire(); useMercStore.getState().setFieldedMerc(original);
    const originalXp = totalMercXp(original), otherXp = totalMercXp(other);
    const gain = usePlayerStore.getState().gainExperience;
    vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => { const result = gain(amount); useMercStore.getState().setFieldedMerc(other); return result; });
    expect(claimQuestReward(ORMUS.quest)).toBe('ok'); expect(totalMercXp(original)).toBe(originalXp + 3750); expect(totalMercXp(other)).toBe(otherXp);
  });
  it.each([false, true])('preserves independent noncharm equip and recomposes the restored hero; observer throws=%s', throws => {
    const cap = { id: 'existing-cap', baseId: 'items/base/helm-cap', rarity: 'normal' as const, level: 1,
      identified: true, equipped: false, baseRolls: { defense: 5 },
      affixes: [{ affixId: 'life', values: new Map([['statMods.life', 7]]) }] };
    useInventoryStore.setState({ backpack: [cap] }); const beforeHero = structuredClone(hero());
    let triggered = false;
    const unsub = useInventoryStore.subscribe(current => {
      if (triggered || !current.backpack.some(row => row.uniqueId === 'items/unique/ormus-charm')) return;
      triggered = true; expect(current.equipItem(cap)).toEqual({ ok: true });
      if (throws) throw new Error('Unrelated equip then throw');
    });
    try { expect(claimQuestReward(ORMUS.quest)).toBe('grant-failed'); } finally { unsub(); }
    expect(triggered).toBe(true); expect(useInventoryStore.getState().equipped.head?.id).toBe(cap.id);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    const map = useMapStore.getState();
    expect(hero()).toEqual({ ...beforeHero, derivedStats: deriveEquippedPlayerStats(beforeHero, beforeHero.level,
      useInventoryStore.getState().equipped, map.questProgress, useInventoryStore.getState().questItems, map.questReceipts) });
    expect(hero().derivedStats.lifeMax).toBe(beforeHero.derivedStats.lifeMax + 7);
    expect(map.questProgress[ORMUS.quest]?.rewardClaimed).toBe(false);
  });
  it('restores an existing equipped charm and removes its displaced copy after reward equip failure', () => {
    const existing = { id: 'original-charm', baseId: 'items/base/small-charm', uniqueId: 'items/unique/ormus-charm',
      rarity: 'unique' as const, level: 32, ilvl: 32, identified: true, equipped: false };
    useInventoryStore.getState().addItem(existing); expect(useInventoryStore.getState().equipItem(existing)).toEqual({ ok: true });
    const before = state(); let triggered = false;
    const unsub = useInventoryStore.subscribe(current => {
      const reward = current.backpack.find(candidate => candidate.id !== existing.id);
      if (!reward || triggered) return; triggered = true; current.equipItem(reward); throw new Error('Swapped then failed');
    });
    try { expect(claimQuestReward(ORMUS.quest)).toBe('grant-failed'); } finally { unsub(); }
    expect(triggered).toBe(true); expect(state()).toEqual(before);
  });
  it('restores the captured recipient and its authoritative gear after a callback removes the mercenary', () => {
    const id = hire(), cap = { id: 'merc-cap', baseId: 'items/base/helm-cap', rarity: 'normal' as const,
      level: 1, identified: true, equipped: false, baseRolls: { defense: 5 } };
    useInventoryStore.getState().addItem(cap); expect(useMercStore.getState().equipOnMerc(id, 'head', cap)).toEqual({ ok: true });
    const beforeHero = structuredClone(hero()), beforeMercs = structuredClone(useMercStore.getState().ownedMercs),
      beforeGear = structuredClone(useMercStore.getState().mercEquipment), beforeProgress = structuredClone(useMercStore.getState().mercProgress);
    const gain = usePlayerStore.getState().gainExperience;
    vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => { const result = gain(amount); useMercStore.getState().removeMerc(id); return result; });
    expect(claimQuestReward(ORMUS.quest)).toBe('grant-failed'); expect(hero()).toEqual(beforeHero);
    expect(useMercStore.getState().ownedMercs).toEqual(beforeMercs); expect(useMercStore.getState().mercProgress).toEqual(beforeProgress);
    expect(useMercStore.getState().mercEquipment).toEqual(beforeGear);
    expect(useInventoryStore.getState().backpack).toEqual([]);
  });
});
