/** Constructed source capabilities; native victory and Recover are verified separately. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import sideDocument from '@/data/quests/side.json';
import { loadMercPool } from '@/data/loaders/mercs';
import { loadUniques } from '@/data/loaders/loot';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercXpForLevel } from '@/stores/mercStore';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import * as rolls from '@/engine/loot/rollItem';
import type { Item } from '@/engine/types/items';
import { LEVEL_CAP, xpTotal } from '@/engine/progression/xp';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { canClaim, claimQuestReward } from './claimReward';

const quest = 'quests/side-act5-nihlathaks-treasure', source = `${quest}#objective:obj-fetch`;
const prison = 'quests/act5-prison-of-ice', potion = `${prison}#action:receive-potion`;
const proofs = [`${prison}#action:inspect-anya`, potion, `${prison}#action:thaw-anya`, `${prison}#action:nihlathak-victory`];
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore] as const;
const stops: (() => void)[] = [];
const definition = required(sideDocument.quests.find(row => row.id === quest));
const rewardDescriptor = required(Object.getOwnPropertyDescriptor(definition, 'rewards'));
function hire() {
  const row = required(loadMercPool().pool.find(merc => merc.id === 'mercs/act1-rogue-trainee'));
  const merc = createMercFromDef(row, String(mercs().ownedMercs.length)); mercs().addMerc(merc); mercs().setFieldedMerc(merc.id); return merc.id;
}
function totalMercXp(id: string) {
  const merc = required(mercs().ownedMercs.find(row => row.id === id));
  let total = mercs().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Nihlathak Claim fixture'); return value; }
const hero = () => required(usePlayerStore.getState().player), inv = () => useInventoryStore.getState();
const map = () => useMapStore.getState(), mercs = () => useMercStore.getState();
const snapshot = () => structuredClone(stores.map(store => Object.fromEntries(Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function'))));
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Nihlathak Claim', 'sorceress'), equipment: [] });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: null, selectedDifficulty: 'normal', questProgress: {
    [quest]: { id: quest, status: 'completed', objectives: { 'obj-fetch': true }, rewardClaimed: false },
    [prison]: { id: prison, status: 'completed', objectives: { 'obj-find-anya': true, 'obj-thaw': true, 'obj-kill-nihlathak': true }, rewardClaimed: false }
  }, questReceipts: Object.fromEntries(proofs.map(proof => [proof, true as const])) });
  useInventoryStore.setState({ questItems: { [potion]: { itemId: 'quest/malahs_potion', state: 'consumed' },
    [source]: { itemId: 'quest/nihlathak_relic', state: 'owned' } } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); Object.defineProperty(definition, 'rewards', rewardDescriptor); abortSubAreaRun(); __resetPersistenceForTests(); });


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

describe('Nihlathak separate source-bound unique and XP Claim', () => {
  it('refuses completed flag-only history before allocating or publishing a reward', () => {
    useInventoryStore.setState({ questItems: { [potion]: { itemId: 'quest/malahs_potion', state: 'consumed' } } });
    const before = snapshot(); expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).toBe('not-completed'); expect(snapshot()).toEqual(before);
  });
  it('claims the exact Mara plus 12000 XP away from the recovery area and retains the relic', () => {
    const beforeXp = xpTotal(hero().level) + hero().experience, beforeItems = structuredClone(inv().questItems);
    expect(canClaim(quest)).toBe(true); expect(claimQuestReward(quest)).toBe('ok');
    expect(xpTotal(hero().level) + hero().experience).toBe(beforeXp + 12000);
    expect(inv().backpack).toHaveLength(1);
    expect(inv().backpack[0]).toMatchObject({ uniqueId: 'items/unique/mara-kaleidoscope', baseId: 'items/base/amu-obsidian', ilvl: 82, identified: true, equipped: false });
    const mara = loadUniques().find(row => row.id === 'items/unique/mara-kaleidoscope');
    expect(mara).toMatchObject({ reqLevel: 67, stats: { coreStats: { strength: 5, dexterity: 5, vitality: 5, energy: 5 }, resistances: { fire: 25, cold: 25, lightning: 25, poison: 25, arcane: 25 } } });
    expect(mara?.stats?.resistances).not.toHaveProperty('physical');
    expect(hero().level).toBeLessThan(67); expect(inv().equipped).toEqual({});
    expect(inv().questItems).toEqual(beforeItems); expect(mercs().ownedMercs).toEqual([]);
    const paid = snapshot(); expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).toBe('already-claimed'); expect(snapshot()).toEqual(paid);
  });
});


describe('Nihlathak Claim guards and progression', () => {
  it.each(['missing-source', 'consumed-source', 'wrong-item', 'missing-receipt', 'unconsumed-potion', 'incomplete-main', 'combat', 'hydrating', 'absent-hero', 'wrong-definition'] as const)('refuses %s before private allocation', fault => {
    if (fault === 'missing-source') useInventoryStore.setState({ questItems: { [potion]: required(inv().questItems[potion]) } });
    if (fault === 'consumed-source') Object.assign(required(inv().questItems[source]), { state: 'consumed' });
    if (fault === 'wrong-item') Object.assign(required(inv().questItems[source]), { itemId: 'quest/malahs_potion' });
    if (fault === 'missing-receipt') useMapStore.setState({ questReceipts: Object.fromEntries(proofs.slice(0, -1).map(proof => [proof, true as const])) });
    if (fault === 'unconsumed-potion') Object.assign(required(inv().questItems[potion]), { state: 'owned' });
    if (fault === 'incomplete-main') Object.assign(required(map().questProgress[prison]).objectives, { 'obj-thaw': false });
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    if (fault === 'hydrating') useHydrationStore.getState().setStatus('loading');
    if (fault === 'absent-hero') usePlayerStore.setState({ player: null });
    if (fault === 'wrong-definition') Object.defineProperty(definition, 'rewards', { ...rewardDescriptor, value: { xp: 12001, itemDrop: { uniqueId: 'items/unique/mara-kaleidoscope', ilvl: 82 } } });
    const allocate = vi.spyOn(rolls, 'rollUniqueItem'), before = snapshot();
    expect(canClaim(quest)).toBe(false); expect(claimQuestReward(quest)).toBe('not-completed');
    expect(allocate).not.toHaveBeenCalled(); expect(snapshot()).toEqual(before);
  });
  it('uses the captured actual merc recipient and existing 75 percent share without changing fielding', () => {
    const recipient = hire(), other = hire(); mercs().setFieldedMerc(recipient);
    const before = totalMercXp(recipient), otherBefore = totalMercXp(other);
    let switched = false;
    stops.push(usePlayerStore.subscribe(() => { if (!switched) { switched = true; mercs().setFieldedMerc(other); } }));
    expect(claimQuestReward(quest)).toBe('ok');
    expect(totalMercXp(recipient)).toBe(before + 9000); expect(totalMercXp(other)).toBe(otherBefore); expect(mercs().fieldedMercId).toBe(other);
  });
  it('does not redirect a foreign fielded ID or auto-field a reserve', () => {
    const id = hire(), before = totalMercXp(id); useMercStore.setState({ fieldedMercId: 'foreign' });
    expect(claimQuestReward(quest)).toBe('ok'); expect(totalMercXp(id)).toBe(before); expect(mercs().fieldedMercId).toBe('foreign');
  });
  it('retains the reward in visible overflow and Claim cannot replay after discard', () => {
    const backpack = Array.from({ length: BACKPACK_CAPACITY + 1 }, (_, index) => ({ id: `before-${String(index)}`, baseId: 'items/base/helm-cap', rarity: 'normal' as const, level: 1, identified: true, equipped: false }));
    useInventoryStore.setState({ backpack }); expect(claimQuestReward(quest)).toBe('ok');
    expect(inv().backpack.slice(0, -1)).toEqual(backpack); expect(inv().backpack).toHaveLength(BACKPACK_CAPACITY + 2);
    inv().discardItem(required(inv().backpack.at(-1)).id); const before = snapshot();
    expect(claimQuestReward(quest)).toBe('already-claimed'); expect(snapshot()).toEqual(before);
  });
  it('uses existing current-cap XP behavior without extra level or points', () => {
    usePlayerStore.setState({ player: { ...hero(), level: LEVEL_CAP, experience: 0, experienceToNextLevel: 1 } });
    const points = { stat: hero().statPoints, skill: hero().skillPoints };
    expect(claimQuestReward(quest)).toBe('ok'); expect(hero()).toMatchObject({ level: LEVEL_CAP, experience: 12000, experienceToNextLevel: 12000, statPoints: points.stat, skillPoints: points.skill });
  });
  it('keeps constructor failure private and does not roll back a constructor-replaced claimant', () => {
    const writes = [vi.spyOn(usePlayerStore, 'setState'), vi.spyOn(useInventoryStore, 'setState'), vi.spyOn(useMapStore, 'setState'), vi.spyOn(useMercStore, 'setState')];
    const allocate = vi.spyOn(rolls, 'rollUniqueItem').mockImplementationOnce(() => { throw new Error('private allocation'); });
    const before = snapshot(); expect(claimQuestReward(quest)).toBe('grant-failed'); expect(snapshot()).toEqual(before);
    writes.forEach(write => { expect(write).not.toHaveBeenCalled(); }); allocate.mockRestore();
    const real = rolls.rollUniqueItem;
    vi.spyOn(rolls, 'rollUniqueItem').mockImplementationOnce((...args) => { usePlayerStore.setState({ player: { ...hero(), id: 'replacement' } }); return real(...args); });
    expect(claimQuestReward(quest)).toBe('grant-failed'); expect(hero().id).toBe('replacement'); expect(inv().backpack).toEqual([]);
  });
});

describe('Nihlathak Claim publication faults', () => {
  it.each(['hero', 'merc', 'item', 'claimed'] as const)('deeply restores scoped participants after %s mutates then throws and allows deterministic retry', phase => {
    const recipient = hire(), before = snapshot(); let failed = false;
    const fail = () => { if (!failed) { failed = true; throw new Error(`${phase} fault`); } };
    if (phase === 'hero') stops.push(usePlayerStore.subscribe(fail));
    if (phase === 'merc') stops.push(useMercStore.subscribe(state => { if ((state.mercProgress[recipient]?.experience ?? 0) > 0) fail(); }));
    if (phase === 'item') stops.push(useInventoryStore.subscribe(state => { if (state.backpack.length) fail(); }));
    if (phase === 'claimed') stops.push(useMapStore.subscribe(state => { if (state.questProgress[quest]?.rewardClaimed) fail(); }));
    const allocate = vi.spyOn(rolls, 'rollUniqueItem');
    expect(claimQuestReward(quest)).toBe('grant-failed'); expect(snapshot()).toEqual(before);
    expect(claimQuestReward(quest)).toBe('ok');
    const first = required(allocate.mock.results[0]?.value as Item | undefined), second = required(allocate.mock.results[1]?.value as Item | undefined);
    expect({ ...second, id: first.id }).toEqual(first);
  });
  it.each(['hero', 'merc', 'item', 'claimed'] as const)('detects silent %s publication mutation', phase => {
    const recipient = hire(), before = snapshot(); let changed = false;
    const mutate = () => { if (changed) return; changed = true;
      if (phase === 'hero') Object.assign(hero(), { experience: hero().experience + 1 });
      if (phase === 'merc') Object.assign(required(mercs().mercProgress[recipient]), { experience: 1 });
      if (phase === 'item') Object.assign(required(inv().backpack[0]), { baseId: 'items/base/helm-cap' });
      if (phase === 'claimed') Object.assign(required(map().questProgress[quest]), { rewardClaimed: false });
    };
    if (phase === 'hero') stops.push(usePlayerStore.subscribe(mutate));
    if (phase === 'merc') stops.push(useMercStore.subscribe(state => { if ((state.mercProgress[recipient]?.experience ?? 0) > 0) mutate(); }));
    if (phase === 'item') stops.push(useInventoryStore.subscribe(state => { if (state.backpack.length) mutate(); }));
    if (phase === 'claimed') stops.push(useMapStore.subscribe(state => { if (state.questProgress[quest]?.rewardClaimed) mutate(); }));
    expect(claimQuestReward(quest)).toBe('grant-failed'); expect(snapshot()).toEqual(before);
  });
  it('preserves independent currency, journal, settings, core/resources, reserve XP and fielding on rollback', () => {
    const recipient = hire(), reserve = hire(); mercs().setFieldedMerc(recipient);
    const recipientBefore = totalMercXp(recipient); let failed = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (!state.backpack.length || failed) return; failed = true;
      inv().addCurrency('wishstone', 17); mercs().addExperience(reserve, 31); mercs().setFieldedMerc(reserve);
      useMapStore.setState(state => ({ questProgress: { ...state.questProgress, unrelated: { id: 'unrelated', status: 'available', objectives: {} } } }));
      usePlayerStore.setState({ player: { ...hero(), name: 'Independent name', coreStats: { ...hero().coreStats, vitality: 13 }, derivedStats: { ...hero().derivedStats, life: 3, mana: 4 } } });
      throw new Error('after independent writes');
    }));
    expect(claimQuestReward(quest)).toBe('grant-failed'); expect(hero().name).toBe('Independent name');
    expect(hero().coreStats.vitality).toBe(13); expect(hero().derivedStats).toMatchObject({ life: 3, mana: 4 });
    expect(inv().currencies.wishstone).toBe(17); expect(map().questProgress.unrelated?.status).toBe('available');
    expect(totalMercXp(reserve)).toBeGreaterThan(31); expect(totalMercXp(recipient)).toBe(recipientBefore); expect(mercs().fieldedMercId).toBe(reserve);
    expect(hero().derivedStats).toEqual(deriveEquippedPlayerStats(hero(), hero().level, inv().equipped, map().questProgress, inv().questItems, map().questReceipts));
  });
  it.each(['removed', 'foreign'] as const)('does not resurrect a %s hero or a dismissed recipient after publication failure', replacement => {
    const recipient = hire(); let failed = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (!state.backpack.length || failed) return; failed = true;
      mercs().removeMerc(recipient); usePlayerStore.setState({ player: replacement === 'removed' ? null : { ...hero(), id: 'foreign', experience: 71 } });
      throw new Error('actor departure');
    }));
    expect(claimQuestReward(quest)).toBe('grant-failed'); expect(mercs().ownedMercs).toEqual([]); expect(mercs().mercProgress).not.toHaveProperty(recipient);
    if (replacement === 'removed') expect(usePlayerStore.getState().player).toBeNull();
    else expect(hero()).toMatchObject({ id: 'foreign', experience: 71 });
  });
  it('blocks nested Claim under the shared lease', () => {
    const nested: string[] = []; let entered = false;
    stops.push(usePlayerStore.subscribe(() => { if (!entered) { entered = true; nested.push(claimQuestReward(quest)); } }));
    expect(claimQuestReward(quest)).toBe('ok'); expect(nested).toEqual(['claim-in-progress']);
  });
  it('throws an explicit AggregateError when restoration writes fail', () => {
    let failed = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (!state.backpack.length || failed) return; failed = true;
      vi.spyOn(useMapStore, 'setState').mockImplementation(() => { throw new Error('rollback write denied'); });
      throw new Error('award failed');
    }));
    expect(() => claimQuestReward(quest)).toThrow(AggregateError);
  });
});

describe('Nihlathak actual actor continuity', () => {
  it.each(['hero', 'merc'] as const)('does not rewind a fresh same-ID %s replacement during reward publication', actor => {
    const recipient = hire(); let failed = false;
    const foreignHero = structuredClone({ ...hero(), experience: 77, name: 'Foreign hero' });
    const foreignMerc = structuredClone({ ...required(mercs().ownedMercs.find(row => row.id === recipient)), name: 'Foreign merc', level: 23 });
    stops.push(useInventoryStore.subscribe(state => {
      if (!state.backpack.length || failed) return; failed = true;
      if (actor === 'hero') usePlayerStore.setState({ player: foreignHero });
      else useMercStore.setState({ ownedMercs: [foreignMerc], mercProgress: { [recipient]: { experience: 77, experienceToNextLevel: 9999 } } });
      throw new Error('foreign replacement');
    }));
    expect(claimQuestReward(quest)).toBe('grant-failed');
    if (actor === 'hero') expect(usePlayerStore.getState().player).toBe(foreignHero);
    else { expect(mercs().ownedMercs[0]).toBe(foreignMerc); expect(mercs().mercProgress[recipient]).toEqual({ experience: 77, experienceToNextLevel: 9999 }); }
  });
  it.each(['hero', 'merc'] as const)('does not mistake a nested same-ID %s replacement for its own emitted progression actor', actor => {
    const recipient = hire(); let failed = false;
    const foreignHero = structuredClone({ ...hero(), experience: 77, name: 'Foreign hero' });
    const foreignMerc = structuredClone({ ...required(mercs().ownedMercs.find(row => row.id === recipient)), name: 'Foreign merc', level: 23 });
    if (actor === 'hero') stops.push(usePlayerStore.subscribe(() => {
      if (failed) return; failed = true; usePlayerStore.setState({ player: foreignHero });
    }));
    else stops.push(useMercStore.subscribe(state => {
      if (failed || (state.mercProgress[recipient]?.experience ?? 0) === 0) return; failed = true;
      useMercStore.setState({ ownedMercs: [foreignMerc], mercProgress: { [recipient]: { experience: 77, experienceToNextLevel: 9999 } } });
    }));
    expect(claimQuestReward(quest)).toBe('grant-failed');
    if (actor === 'hero') expect(usePlayerStore.getState().player).toBe(foreignHero);
    else { expect(mercs().ownedMercs[0]).toBe(foreignMerc); expect(mercs().mercProgress[recipient]).toEqual({ experience: 77, experienceToNextLevel: 9999 }); }
  });
  it('preserves independent recipient spread settings and resources while reverting only its earned progression', () => {
    const recipient = hire(), before = structuredClone(required(mercs().ownedMercs.find(row => row.id === recipient)));
    const beforeXp = totalMercXp(recipient); let failed = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (!state.backpack.length || failed) return; failed = true;
      useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => row.id === recipient ? {
        ...row, name: 'Independent recipient', comboOrder: ['independent'], derivedStats: { ...row.derivedStats, life: 3, mana: 4 }
      } : row) }));
      throw new Error('independent recipient edit');
    }));
    expect(claimQuestReward(quest)).toBe('grant-failed');
    expect(required(mercs().ownedMercs.find(row => row.id === recipient))).toMatchObject({ name: 'Independent recipient', comboOrder: ['independent'],
      level: before.level, coreStats: before.coreStats, derivedStats: { life: 3, mana: 4, lifeMax: before.derivedStats.lifeMax, manaMax: before.derivedStats.manaMax } });
    expect(totalMercXp(recipient)).toBe(beforeXp);
  });
  it('clamps a surviving recipient resource pool to the restored bare capacities without healing', () => {
    const recipient = hire(), before = structuredClone(required(mercs().ownedMercs.find(row => row.id === recipient))); let failed = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (!state.backpack.length || failed) return; failed = true;
      const current = required(mercs().ownedMercs.find(row => row.id === recipient));
      Object.assign(current.derivedStats, { life: 100000, mana: 100000 }); throw new Error('resource edit');
    }));
    expect(claimQuestReward(quest)).toBe('grant-failed');
    expect(required(mercs().ownedMercs.find(row => row.id === recipient)).derivedStats).toMatchObject({ life: before.derivedStats.life, mana: before.derivedStats.manaMax });
  });
});

describe('Nihlathak Claim physical transaction integration', () => {
  it.each(['stash', 'hero', 'merc', 'orphan', 'legacy', 'socket', 'removed'] as const)('rolls back a subscriber-transferred reward in %s and keeps displaced originals', destination => {
    const recipient = hire();
    usePlayerStore.setState({ player: { ...hero(), level: 90 } });
    usePlayerStore.getState().recomputeDerived(inv().equipped);
    useMercStore.setState(state => ({ ownedMercs: state.ownedMercs.map(row => ({ ...row, level: 90 })) }));
    const original: Item = { id: 'original-amulet', baseId: 'items/base/amu-obsidian', rarity: 'normal', level: 1, identified: true, equipped: true, equipSlot: 'amulet',
      affixes: [{ affixId: 'legacy', values: new Map([['life', 13]]) }] };
    if (destination === 'hero') { useInventoryStore.setState({ equipped: { amulet: original } }); usePlayerStore.getState().recomputeDerived(inv().equipped); }
    if (destination === 'merc') useMercStore.setState(state => ({ mercEquipment: { ...state.mercEquipment, [recipient]: { amulet: original } } }));
    const before = snapshot(); let failed = false;
    stops.push(useInventoryStore.subscribe(state => {
      const award = state.backpack.find(row => row.uniqueId === 'items/unique/mara-kaleidoscope');
      if (!award || failed) return; failed = true;
      if (destination === 'stash') expect(inv().moveToStash(award.id)).toEqual({ ok: true });
      if (destination === 'hero') expect(inv().equipItem(award, 'amulet')).toEqual({ ok: true });
      if (destination === 'merc') expect(mercs().equipOnMerc(recipient, 'amulet', award)).toEqual({ ok: true });
      if (destination === 'orphan') { useInventoryStore.setState({ backpack: [] }); useMercStore.setState(state => ({ mercEquipment: { ...state.mercEquipment, orphan: { amulet: { ...award, equipped: true, equipSlot: 'amulet' } } } })); }
      if (destination === 'legacy') useInventoryStore.setState({ backpack: [], legacyGearQuarantine: [{ item: award, origin: { container: 'stash', index: 42 } }] });
      if (destination === 'socket') useInventoryStore.setState({ backpack: [], socketQuarantine: [{ sourceVersion: 18, item: award, origin: { container: 'stash', index: 17 } }] });
      if (destination === 'removed') inv().discardItem(award.id);
      // A silent move/removal must fail the exact physical publication witness.
    }));
    expect(claimQuestReward(quest)).toBe('grant-failed');
    if (destination === 'hero') {
      // Canonical equipment also repairs the formerly empty legacy actor mirror.
      const after = hero(); expect(after.equipment).toEqual([original]);
      expect(inv().equipped).toEqual({ amulet: original }); expect(inv().backpack).toEqual([]);
    } else if (destination === 'merc') {
      expect(required(mercs().ownedMercs.find(row => row.id === recipient)).equipment).toEqual([original]);
      expect(mercs().mercEquipment[recipient]).toEqual({ amulet: original }); expect(inv().backpack).toEqual([]);
    } else if (destination !== 'orphan') expect(snapshot()).toEqual(before);
    else { expect(mercs().mercEquipment.orphan).toEqual({}); expect(inv().backpack).toEqual([]); }
    expect(map().questProgress[quest]?.rewardClaimed).toBe(false); expect(inv().questItems[source]?.state).toBe('owned');
  });
  it.each(['legacy', 'socket', 'mirror'] as const)('refuses private prepared ID collisions in %s without rollback publications', destination => {
    const old: Item = { id: 'collision', baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, identified: true, equipped: false };
    if (destination === 'legacy') useInventoryStore.setState({ legacyGearQuarantine: [{ item: old, origin: { container: 'stash', index: 0 } }] });
    if (destination === 'socket') useInventoryStore.setState({ socketQuarantine: [{ sourceVersion: 18, item: old, origin: { container: 'stash', index: 0 } }] });
    if (destination === 'mirror') usePlayerStore.setState({ player: { ...hero(), equipment: [old] } });
    const real = rolls.rollUniqueItem;
    vi.spyOn(rolls, 'rollUniqueItem').mockImplementationOnce((...args) => { const result = real(...args); return result && { ...result, id: 'collision' }; });
    const before = snapshot(), writes = [vi.spyOn(useInventoryStore, 'setState'), vi.spyOn(useMercStore, 'setState'), vi.spyOn(usePlayerStore, 'setState'), vi.spyOn(useMapStore, 'setState')];
    expect(claimQuestReward(quest)).toBe('unsupported-rewards'); expect(snapshot()).toEqual(before); writes.forEach(write => { expect(write).not.toHaveBeenCalled(); });
  });
});

it('preserves a post-XP independent collision with the private prepared ID', () => {
  const real = rolls.rollUniqueItem;
  vi.spyOn(rolls, 'rollUniqueItem').mockImplementationOnce((...args) => { const result = real(...args); return result && { ...result, id: 'prepared-id' }; });
  const independent: Item = { id: 'prepared-id', baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, identified: true, equipped: false };
  let inserted = false; const xp = xpTotal(hero().level) + hero().experience;
  stops.push(usePlayerStore.subscribe(() => { if (!inserted) { inserted = true; inv().addItem(independent); } }));
  expect(claimQuestReward(quest)).toBe('grant-failed'); expect(inv().backpack).toEqual([independent]);
  expect(xpTotal(hero().level) + hero().experience).toBe(xp); expect(map().questProgress[quest]?.rewardClaimed).toBe(false);
});
it('restores earned progression through a legitimate independent spread that replaces one actor array', () => {
  const xp = xpTotal(hero().level) + hero().experience; let changed = false;
  stops.push(usePlayerStore.subscribe(() => {
    if (changed) return; changed = true;
    usePlayerStore.setState({ player: { ...hero(), skills: [...hero().skills], name: 'Independent skills edit' } });
    throw new Error('after legitimate independent spread');
  }));
  expect(claimQuestReward(quest)).toBe('grant-failed'); expect(hero().name).toBe('Independent skills edit');
  expect(xpTotal(hero().level) + hero().experience).toBe(xp);
});
