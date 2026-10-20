import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mainDocument from '@/data/quests/main.json';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { xpRequired, xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { loadAwardPools } from '@/data/loaders/loot';
import uniqueItems from '@/data/items/uniques.json';
import * as itemRoll from '@/engine/loot/rollItem';
import { createRng, hashSeed } from '@/engine/rng';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import type { Item } from '@/engine/types/items';
import { canClaim, claimQuestReward } from './claimReward';

const DEN = 'quests/act1-den-of-evil';
const BLOOD_RAVEN = 'quests/act1-sisters-burial-grounds';
const CAIN = 'quests/side-act1-cains-favor';
const JADE = 'quests/side-act3-jade-statuette';
const SUN = 'quests/act2-tainted-sun';
const domains = [usePlayerStore, useInventoryStore, useMercStore, useMapStore,
  useMetaStore, useFormationStore] as const;

function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing claim fixture');
  return value;
}
function data() {
  return structuredClone(domains.map(store => Object.fromEntries(
    Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function')
  )));
}
function complete(id = DEN): void {
  useMapStore.getState().updateQuestProgress(id, {
    status: 'completed', objectives: { 'obj-clear-den': true, 'obj-return': true }
  });
}
function hire(): string {
  const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight'));
  const hired = useMercStore.getState().hireMerc(def);
  expect(hired.ok).toBe(true);
  const id = required(hired.mercId);
  useMercStore.getState().setFieldedMerc(id);
  return id;
}
function playerXp(): number {
  const hero = required(usePlayerStore.getState().player);
  return xpTotal(hero.level) + hero.experience;
}
function mercXp(id: string): number {
  const merc = required(useMercStore.getState().ownedMercs.find(row => row.id === id));
  let total = useMercStore.getState().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function withRewards(rewards: Record<string, unknown>, check: () => void): void {
  const quest = required(mainDocument.quests.find(row => row.id === DEN));
  const original = required(Object.getOwnPropertyDescriptor(quest, 'rewards'));
  try {
    Object.defineProperty(quest, 'rewards', { ...original, value: rewards });
    check();
  } finally { Object.defineProperty(quest, 'rewards', original); }
}
function reset(): void {
  __resetPersistenceForTests();
  for (const store of domains) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
}
beforeEach(() => {
  reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Claim fixture', 'sorceress'));
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

function expectRefusal(id: string, result: string): void {
  const before = domains.map(store => store.getState());
  const bytes = data();
  let publications = 0;
  const unsubs = domains.map(store => store.subscribe(() => { publications++; }));
  try {
    expect(claimQuestReward(id)).toBe(result);
    expect(data()).toEqual(bytes);
    domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(publications).toBe(0);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).not.toBe(true);
  } finally { unsubs.forEach(unsub => { unsub(); }); }
}

describe('shared quest claim safety and actual Den contract', () => {
  it('refuses unknown completed progress without writes', () => {
    const id = 'quests/not-authored';
    complete(id);
    expect(canClaim(id)).toBe(false);
    expectRefusal(id, 'unknown-quest');
  });

  it('refuses missing progress without writes', () => {
    expect(canClaim(DEN)).toBe(false);
    expectRefusal(DEN, 'not-completed');
  });

  it.each(['locked', 'available', 'inProgress'] as const)('refuses %s progress without writes', status => {
    useMapStore.getState().updateQuestProgress(DEN, { status, objectives: {} });
    expect(canClaim(DEN)).toBe(false);
    expectRefusal(DEN, 'not-completed');
  });

  it.each([false, true])('refuses actual Den without a player, fielded merc=%s', fielded => {
    if (fielded) hire();
    usePlayerStore.getState().reset();
    complete();
    expectRefusal(DEN, 'no-player');
  });

  it.each([CAIN, BLOOD_RAVEN, JADE])('refuses the entire actual unsupported bundle %s', id => {
    hire();
    complete(id);
    expect(canClaim(id)).toBe(true);
    expectRefusal(id, 'unsupported-rewards');
  });

  it.each(['idle', 'loading', 'error'] as const)('refuses before writes while hydration is %s', status => {
    complete();
    useHydrationStore.getState().setStatus(status);
    expect(canClaim(DEN)).toBe(true);
    expectRefusal(DEN, 'not-ready');
  });

  it('grants actual Den exactly once, separating level rewards and the quest point', () => {
    const id = hire();
    complete();
    const inventory = useInventoryStore.getState();
    const before = required(usePlayerStore.getState().player);
    const xpBefore = playerXp();
    const mercBefore = mercXp(id);
    expect(canClaim(DEN)).toBe(true);
    expect(claimQuestReward(DEN)).toBe('ok');
    const after = required(usePlayerStore.getState().player);
    expect(playerXp()).toBe(xpBefore + 500);
    expect(after.level).toBe(2);
    expect(after.experience).toBe(400);
    expect(after.statPoints).toBe(before.statPoints + 5);
    expect(after.skillPoints).toBe(before.skillPoints + 1 + 1);
    expect(mercXp(id)).toBe(mercBefore + 375);
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(useMapStore.getState().questProgress[DEN]?.rewardClaimed).toBe(true);
    const settled = data();
    expect(canClaim(DEN)).toBe(false);
    expect(claimQuestReward(DEN)).toBe('already-claimed');
    expect(data()).toEqual(settled);
  });

  it('keeps automatic milestone points separate from the extra Den point without a fielded merc', () => {
    const hero = required(usePlayerStore.getState().player);
    usePlayerStore.getState().setPlayer({ ...hero, level: 11, experience: xpRequired(11) - 250,
      statPoints: 37, skillPoints: 4 });
    complete();
    const xpBefore = playerXp();
    expect(claimQuestReward(DEN)).toBe('ok');
    const after = required(usePlayerStore.getState().player);
    expect(playerXp()).toBe(xpBefore + 500);
    expect(after.level).toBe(12);
    expect(after.experience).toBe(250);
    expect(after.statPoints).toBe(42);
    expect(after.skillPoints).toBe(7); // level + milestone + quest
    expect(useMercStore.getState().ownedMercs).toEqual([]);
  });

  for (const publication of ['player', 'merc'] as const) {
    it(`refuses synchronous same-quest reentry from the ${publication} publication`, () => {
      const id = hire();
      complete();
      const initialPlayer = required(usePlayerStore.getState().player);
      const xpBefore = playerXp();
      const mercBefore = mercXp(id);
      let nested = '';
      let entered = false;
      const store = publication === 'player' ? usePlayerStore : useMercStore;
      const unsub = store.subscribe(() => {
        if (entered) return;
        entered = true;
        nested = claimQuestReward(DEN);
      });
      try { expect(claimQuestReward(DEN)).toBe('ok'); }
      finally { unsub(); }
      expect(entered).toBe(true);
      expect(nested).toBe('claim-in-progress');
      expect(playerXp()).toBe(xpBefore + 500);
      expect(required(usePlayerStore.getState().player).skillPoints).toBe(initialPlayer.skillPoints + 2);
      expect(mercXp(id)).toBe(mercBefore + 375);
      expect(useMapStore.getState().questProgress[DEN]?.rewardClaimed).toBe(true);
    });
  }

  it('refuses a different supported quest nested inside Den and permits it after settlement', () => {
    complete();
    complete(SUN);
    let entered = false;
    let nested = '';
    const unsub = usePlayerStore.subscribe(() => {
      if (entered) return;
      entered = true;
      nested = claimQuestReward(SUN);
    });
    try { expect(claimQuestReward(DEN)).toBe('ok'); }
    finally { unsub(); }
    expect(nested).toBe('claim-in-progress');
    expect(useMapStore.getState().questProgress[SUN]?.rewardClaimed).not.toBe(true);
    expect(playerXp()).toBe(500);
    expect(claimQuestReward(SUN)).toBe('ok');
    expect(playerXp()).toBe(5000);
  });

  for (const failAt of ['player', 'merc', 'currency', 'flag'] as const) {
    for (const claimedKey of ['absent', 'false'] as const) {
      it(`restores data after controlled ${failAt} mutation then throw with claimed key ${claimedKey}`, () => {
        const id = hire();
        const mercBefore = mercXp(id);
        complete();
        if (claimedKey === 'false') useMapStore.getState().updateQuestProgress(DEN, { rewardClaimed: false });
        complete(CAIN);
        const unrelated = useMapStore.getState().questProgress[CAIN];
        const gain = usePlayerStore.getState().gainExperience;
        const share = useMercStore.getState().shareExperienceWithFielded;
        const currency = useInventoryStore.getState().addCurrency;
        const mark = useMapStore.getState().markQuestRewardClaimed;
        const originalPlayer = usePlayerStore.getState().player;
        const originalMerc = useMercStore.getState();
        const originalCurrencies = useInventoryStore.getState().currencies;
        const originalProgress = useMapStore.getState().questProgress[DEN];
        let threw = false;
        const failOnce = () => {
          if (!threw) { threw = true; throw new Error(`Controlled after real ${failAt} mutation`); }
        };
        if (failAt === 'player') usePlayerStore.setState({ gainExperience: amount => {
          const result = gain(amount); failOnce(); return result;
        } });
        if (failAt === 'merc') useMercStore.setState({ shareExperienceWithFielded: amount => {
          share(amount); failOnce();
        } });
        if (failAt === 'currency') useInventoryStore.setState({ addCurrency: (key, amount) => {
          currency(key, amount); failOnce();
        } });
        if (failAt === 'flag') useMapStore.setState({ markQuestRewardClaimed: questId => {
          mark(questId); failOnce();
        } });
        const before = data();
        const actions = [usePlayerStore.getState().gainExperience,
          useMercStore.getState().shareExperienceWithFielded,
          useInventoryStore.getState().addCurrency, useMapStore.getState().markQuestRewardClaimed];
        let rollbackNested = '';
        const unsub = usePlayerStore.subscribe(state => {
          if (threw && state.player === originalPlayer && !rollbackNested) {
            rollbackNested = claimQuestReward(SUN);
          }
        });
        try {
          withRewards({ xp: 500, gold: 0, skillPoints: 1, runeShards: 10 }, () => {
            let result = '';
            expect(() => { result = claimQuestReward(DEN); }).not.toThrow();
            expect(result).toBe('grant-failed');
            expect(threw).toBe(true);
            expect(data()).toEqual(before);
            expect(usePlayerStore.getState().player).toBe(originalPlayer);
            expect(useMercStore.getState().ownedMercs).toBe(originalMerc.ownedMercs);
            expect(useMercStore.getState().mercProgress).toBe(originalMerc.mercProgress);
            expect(useInventoryStore.getState().currencies).toBe(originalCurrencies);
            expect(useMapStore.getState().questProgress[DEN]).toBe(originalProgress);
            expect(useMapStore.getState().questProgress[CAIN]).toBe(unrelated);
            expect(Object.hasOwn(required(useMapStore.getState().questProgress[DEN]), 'rewardClaimed'))
              .toBe(claimedKey === 'false');
            expect([usePlayerStore.getState().gainExperience,
              useMercStore.getState().shareExperienceWithFielded,
              useInventoryStore.getState().addCurrency, useMapStore.getState().markQuestRewardClaimed])
              .toEqual(actions);
            expect(rollbackNested).toBe('claim-in-progress');
            expect(claimQuestReward(DEN)).toBe('ok');
            expect(playerXp()).toBe(500);
            expect(mercXp(id)).toBe(mercBefore + 375);
            expect(useInventoryStore.getState().currencies).toEqual({ runeShards: 10 });
            expect(useMapStore.getState().questProgress[DEN]?.rewardClaimed).toBe(true);
            const paid = data();
            expect(claimQuestReward(DEN)).toBe('already-claimed');
            expect(data()).toEqual(paid);
          });
        } finally {
          unsub();
          usePlayerStore.setState({ gainExperience: gain });
          useMercStore.setState({ shareExperienceWithFielded: share });
          useInventoryStore.setState({ addCurrency: currency });
          useMapStore.setState({ markQuestRewardClaimed: mark });
        }
      });
    }
  }

  it('attempts remaining restores, reports restoration failure and releases the guard', () => {
    const id = hire();
    const mercBefore = mercXp(id);
    complete();
    const player = usePlayerStore.getState().player;
    const merc = useMercStore.getState();
    const progress = useMapStore.getState().questProgress[DEN];
    const currencies = useInventoryStore.getState().currencies;
    const mark = useMapStore.getState().markQuestRewardClaimed;
    let flagFailed = false;
    useMapStore.setState({ markQuestRewardClaimed: questId => {
      mark(questId); flagFailed = true; throw new Error('Controlled failure after real final flag');
    } });
    const originalSetState = usePlayerStore.setState;
    const restore = vi.spyOn(usePlayerStore, 'setState').mockImplementation((...args) => {
      if (flagFailed) throw new Error('Controlled player restoration failure');
      originalSetState(...args);
    });
    try {
      withRewards({ xp: 500, skillPoints: 1, runeShards: 10 }, () => {
        expect(() => claimQuestReward(DEN)).toThrow('Quest reward restoration failed');
      });
      expect(useMercStore.getState().ownedMercs).toBe(merc.ownedMercs);
      expect(useMercStore.getState().mercProgress).toBe(merc.mercProgress);
      expect(useInventoryStore.getState().currencies).toBe(currencies);
      expect(useMapStore.getState().questProgress[DEN]).toBe(progress);
      // Restoration did fail for player data; never describe this as unchanged.
      expect(usePlayerStore.getState().player).not.toBe(player);
      expect(mercXp(id)).toBe(mercBefore);
    } finally {
      restore.mockRestore();
      useMapStore.setState({ markQuestRewardClaimed: mark });
      usePlayerStore.setState({ player });
    }
    expect(claimQuestReward(DEN)).toBe('ok'); // guard released despite failed restoration
    expect(playerXp()).toBe(500);
    expect(mercXp(id)).toBe(mercBefore + 375);
  });

  it.each([
    { xp: 0, gold: 0, skillPoints: 0, statPoints: 0, runes: 0, runeShards: 0, gems: 0, wishstones: 0 },
    {}
  ])('does not consume an empty or all-zero bundle %#', rewards => {
    complete();
    withRewards(rewards, () => { expectRefusal(DEN, 'no-rewards'); });
  });

  it.each([
    { xp: 5, itemDrop: 'items/quest-token' },
    { itemDrop: 'items/quest-token', xp: 5 },
    { xp: 5, gold: 1 },
    { gold: 1, xp: 5 },
    { stat: {} }
  ])('preflights all entries before any grant %#', rewards => {
    complete();
    withRewards(rewards, () => { expectRefusal(DEN, 'unsupported-rewards'); });
  });

  it('preserves executable numeric reward kinds and harmless gold zero', () => {
    complete();
    const before = required(usePlayerStore.getState().player);
    withRewards({ xp: 0, gold: 0, skillPoints: 2, statPoints: 3,
      runes: 4, runeShards: 5, gems: 6, wishstones: 7 }, () => {
      expect(claimQuestReward(DEN)).toBe('ok');
      const after = required(usePlayerStore.getState().player);
      expect(after.skillPoints).toBe(before.skillPoints + 2);
      expect(after.statPoints).toBe(before.statPoints + 3);
      expect(playerXp()).toBe(0);
      expect(useInventoryStore.getState().currencies).toEqual({ runes: 4, runeShards: 5, gems: 6, wishstones: 7 });
    });
  });
});


const COIF_REWARD = { uniqueId: 'items/unique/coif-of-glory', ilvl: 19 };
function ordinaryItem(): Item {
  return required(itemRoll.rollItem({ baseId: 'items/base/sh-buckler', rarity: 'normal', ilvl: 19 },
    loadAwardPools(), createRng(5048)));
}
function expectedQuestItem(): Item {
  const player = required(usePlayerStore.getState().player);
  return required(itemRoll.rollUniqueItem(COIF_REWARD, loadAwardPools(), createRng(hashSeed(
    JSON.stringify(['quest-unique-v1', player.id, DEN, COIF_REWARD.uniqueId, COIF_REWARD.ilvl])
  ))));
}

describe('explicit unique quest claim capability (P04a07b)', () => {
  it('pays a mixed bundle exactly once with the named seeded item and unmultiplied hero/merc XP', () => {
    const mercId = hire();
    complete();
    const hero = required(usePlayerStore.getState().player);
    usePlayerStore.getState().setPlayer({ ...hero, id: 'unique-claim-fixed-hero' });
    useMetaStore.getState().updateIdleState({ activeMultiplier: 3, multiplierSecondsRemaining: 300 });
    const before = required(usePlayerStore.getState().player);
    const beforeMerc = mercXp(mercId);
    itemRoll.__resetRollItemSeqForTests();
    const expected = expectedQuestItem();
    itemRoll.__resetRollItemSeqForTests();
    withRewards({ xp: 8000, skillPoints: 0, gold: 0, runeShards: 7, itemDrop: COIF_REWARD }, () => {
      expect(canClaim(DEN)).toBe(true);
      expect(claimQuestReward(DEN)).toBe('ok');
      expect(useInventoryStore.getState().backpack).toEqual([expected]);
      expect(expected).toMatchObject({ uniqueId: COIF_REWARD.uniqueId, baseId: 'items/base/helm-skull-cap',
        rarity: 'unique', ilvl: 19, level: 19, identified: true, equipped: false, statRolls: {} });
      expect(playerXp()).toBe(8000);
      expect(mercXp(mercId)).toBe(beforeMerc + 6000);
      const after = required(usePlayerStore.getState().player);
      expect(after.statPoints).toBe(before.statPoints + (after.level - before.level) * 5);
      expect(after.skillPoints).toBe(before.skillPoints + (after.level - before.level));
      expect(useInventoryStore.getState().currencies).toEqual({ runeShards: 7 });
      expect(useMapStore.getState().questProgress[DEN]?.rewardClaimed).toBe(true);
      const paid = data();
      expect(claimQuestReward(DEN)).toBe('already-claimed');
      expect(data()).toEqual(paid);
    });
  });

  it('counts an item-only reward without touching player, merc or currencies', () => {
    complete();
    const player = usePlayerStore.getState();
    const merc = useMercStore.getState();
    const inventory = useInventoryStore.getState();
    withRewards({ itemDrop: COIF_REWARD }, () => {
      expect(claimQuestReward(DEN)).toBe('ok');
      expect(useInventoryStore.getState().backpack).toHaveLength(1);
      expect(useInventoryStore.getState().backpack[0]?.uniqueId).toBe(COIF_REWARD.uniqueId);
      expect(usePlayerStore.getState()).toBe(player);
      expect(useMercStore.getState()).toBe(merc);
      expect(useInventoryStore.getState().currencies).toBe(inventory.currencies);
      expect(useInventoryStore.getState().stash).toBe(inventory.stash);
      expect(useInventoryStore.getState().equipped).toBe(inventory.equipped);
      const paid = data();
      expect(claimQuestReward(DEN)).toBe('already-claimed');
      expect(data()).toEqual(paid);
    });
  });
});


function noAllocationRefusal(rewards: Record<string, unknown>): void {
  itemRoll.__resetRollItemSeqForTests();
  const baseline = ordinaryItem();
  itemRoll.__resetRollItemSeqForTests();
  withRewards(rewards, () => { expectRefusal(DEN, 'unsupported-rewards'); });
  expect(ordinaryItem()).toEqual(baseline); // No reset after refused construction.
}

describe('explicit unique whole-bundle refusals', () => {
  for (const unsupported of [{ lootTable: 'loot/act1_andariel' }, { service: 'identify_free' }, { gold: 1 }]) {
    it.each([false, true])(`refuses ${Object.keys(unsupported)[0] ?? ''} before allocation in reverse=%s`, reverse => {
      complete();
      const entries = [['itemDrop', COIF_REWARD], ['xp', 8000], ...Object.entries(unsupported)] as const;
      noAllocationRefusal(Object.fromEntries(reverse ? [...entries].reverse() : entries));
    });
  }
  it.each([false, true])('keeps legacy strings unsupported before grants in reverse=%s', reverse => {
    complete();
    noAllocationRefusal(reverse ? { itemDrop: 'items/unique/coif-of-glory', xp: 8000 }
      : { xp: 8000, itemDrop: 'items/unique/coif-of-glory' });
  });
  it.each(['unknown', 'low-level', 'duplicate'] as const)('refuses semantic %s without allocation/publication', kind => {
    complete();
    const template = required(uniqueItems.find(item => item.id === COIF_REWARD.uniqueId));
    if (kind === 'duplicate') uniqueItems.push(template);
    try {
      noAllocationRefusal({ xp: 8000, itemDrop: { ...COIF_REWARD,
        ...(kind === 'unknown' ? { uniqueId: 'items/unique/not-in-catalog' } : {}),
        ...(kind === 'low-level' ? { ilvl: 1 } : {}) } });
    } finally { if (kind === 'duplicate') expect(uniqueItems.pop()).toBe(template); }
  });
});

describe('unique preparation and retained overflow', () => {
  it('maps a constructor exception to grant-failed, holds the guard during preparation and permits retry', () => {
    complete(); complete(SUN);
    const actual = itemRoll.rollUniqueItem;
    let nested = '';
    const spy = vi.spyOn(itemRoll, 'rollUniqueItem').mockImplementationOnce((...args) => {
      actual(...args); // Real construction can consume a private allocation before throwing.
      nested = claimQuestReward(SUN);
      throw new Error('Controlled constructor failure');
    });
    try {
      withRewards({ xp: 8000, itemDrop: COIF_REWARD }, () => {
        expectRefusal(DEN, 'grant-failed');
        expect(nested).toBe('claim-in-progress');
        expect(spy).toHaveBeenCalledTimes(1);
        expect(claimQuestReward(DEN)).toBe('ok');
        expect(useInventoryStore.getState().backpack).toHaveLength(1);
        expect(playerXp()).toBe(8000);
      });
    } finally { spy.mockRestore(); }
  });

  it('retains the reward beyond full backpack capacity and preserves every existing item/stash/equipment', () => {
    complete();
    const backpack = Array.from({ length: BACKPACK_CAPACITY }, () => ordinaryItem());
    const stash = [ordinaryItem()];
    const equipped = { offhand: { ...ordinaryItem(), equipped: true } };
    useInventoryStore.setState({ backpack, stash, equipped });
    withRewards({ itemDrop: COIF_REWARD }, () => {
      expect(claimQuestReward(DEN)).toBe('ok');
      const after = useInventoryStore.getState();
      expect(after.backpack).toHaveLength(BACKPACK_CAPACITY + 1);
      backpack.forEach((item, index) => { expect(after.backpack[index]).toBe(item); });
      expect(after.backpack[BACKPACK_CAPACITY]?.uniqueId).toBe(COIF_REWARD.uniqueId);
      expect(after.stash).toBe(stash);
      expect(after.equipped).toBe(equipped);
      const paid = data();
      expect(claimQuestReward(DEN)).toBe('already-claimed');
      expect(data()).toEqual(paid);
    });
  });
});


describe('explicit unique grant rollback and deterministic retry', () => {
  for (const itemOnly of [false, true]) {
    for (const failAt of ['item', 'flag'] as const) {
      it.each(['absent', 'false'] as const)(`restores ${failAt} mutation, itemOnly=${String(itemOnly)}, claimed=%s`, claimed => {
        const mercId = hire();
        complete(); complete(SUN);
        if (claimed === 'false') useMapStore.getState().updateQuestProgress(DEN, { rewardClaimed: false });
        useInventoryStore.setState({ backpack: [ordinaryItem()], stash: [ordinaryItem()], currencies: { runeShards: 2 } });
        const inventory = useInventoryStore.getState();
        const heroState = usePlayerStore.getState();
        const mercState = useMercStore.getState();
        const progress = useMapStore.getState().questProgress[DEN];
        const unrelated = useMapStore.getState().questProgress[SUN];
        const before = data();
        const beforeMerc = mercXp(mercId);
        const add = inventory.addItem;
        const mark = useMapStore.getState().markQuestRewardClaimed;
        const attempts: Item[] = [];
        let threw = false;
        const failOnce = () => { if (!threw) { threw = true; throw new Error('Controlled unique grant mutation'); } };
        useInventoryStore.setState({ addItem: item => {
          attempts.push(item); add(item); if (failAt === 'item') failOnce();
        } });
        useMapStore.setState({ markQuestRewardClaimed: id => { mark(id); if (failAt === 'flag') failOnce(); } });
        const addAction = useInventoryStore.getState().addItem;
        const markAction = useMapStore.getState().markQuestRewardClaimed;
        const restorePublications: boolean[][] = [];
        let grantNested = '';
        let restoreNested = '';
        const unsub = useInventoryStore.subscribe(state => {
          if (!threw && !grantNested) {
            expect(useMapStore.getState().questProgress[DEN]?.rewardClaimed).not.toBe(true);
            grantNested = claimQuestReward(DEN);
          }
          if (threw && (state.backpack === inventory.backpack || state.currencies === inventory.currencies)) {
            restorePublications.push([state.backpack === inventory.backpack, state.currencies === inventory.currencies]);
            restoreNested = claimQuestReward(SUN);
          }
        });
        try {
          withRewards(itemOnly ? { itemDrop: COIF_REWARD }
            : { xp: 8000, runeShards: 7, itemDrop: COIF_REWARD }, () => {
              expect(claimQuestReward(DEN)).toBe('grant-failed');
              expect(threw).toBe(true);
              expect(data()).toEqual(before);
              expect(useInventoryStore.getState().backpack).toBe(inventory.backpack);
              expect(useInventoryStore.getState().currencies).toBe(inventory.currencies);
              expect(useInventoryStore.getState().stash).toBe(inventory.stash);
              expect(useInventoryStore.getState().equipped).toBe(inventory.equipped);
              expect(useInventoryStore.getState().addItem).toBe(addAction);
              expect(useMapStore.getState().markQuestRewardClaimed).toBe(markAction);
              expect(usePlayerStore.getState().player).toBe(heroState.player);
              expect(useMercStore.getState().ownedMercs).toBe(mercState.ownedMercs);
              expect(useMercStore.getState().mercProgress).toBe(mercState.mercProgress);
              if (itemOnly) {
                expect(usePlayerStore.getState()).toBe(heroState);
                expect(useMercStore.getState()).toBe(mercState);
              }
              expect(useMapStore.getState().questProgress[DEN]).toBe(progress);
              expect(useMapStore.getState().questProgress[SUN]).toBe(unrelated);
              expect(grantNested).toBe('claim-in-progress');
              expect(restoreNested).toBe('claim-in-progress');
              expect(restorePublications).toEqual([[true, true]]);
              expect(attempts).toHaveLength(1);
              expect(claimQuestReward(DEN)).toBe('ok');
              expect(attempts).toHaveLength(2);
              const first = required(attempts[0]);
              const retry = required(attempts[1]);
              expect(retry.id).not.toBe(first.id);
              expect(retry).toEqual({ ...first, id: retry.id });
              expect(useInventoryStore.getState().backpack).toEqual([...inventory.backpack, retry]);
              expect(useInventoryStore.getState().currencies).toEqual({ runeShards: itemOnly ? 2 : 9 });
              expect(playerXp()).toBe(itemOnly ? 0 : 8000);
              expect(mercXp(mercId)).toBe(beforeMerc + (itemOnly ? 0 : 6000));
              const paid = data();
              expect(claimQuestReward(DEN)).toBe('already-claimed');
              expect(data()).toEqual(paid);
            });
        } finally {
          unsub();
          useInventoryStore.setState({ addItem: add });
          useMapStore.setState({ markQuestRewardClaimed: mark });
        }
      });
    }
  }
});


describe('unique claim exceptional boundaries', () => {
  it('maps a throwing RNG draw inside real construction to grant-failed without publications', () => {
    complete();
    const actual = itemRoll.rollUniqueItem;
    const spy = vi.spyOn(itemRoll, 'rollUniqueItem').mockImplementationOnce((input, pools, rng) =>
      actual(input, pools, { ...rng, nextInt: () => { throw new Error('Controlled RNG draw'); } }));
    try {
      withRewards({ itemDrop: COIF_REWARD }, () => {
        expectRefusal(DEN, 'grant-failed');
        expect(spy).toHaveBeenCalledTimes(1);
        expect(claimQuestReward(DEN)).toBe('ok');
      });
    } finally { spy.mockRestore(); }
  });

  it('attempts all other restores, reports inventory restore failure and releases the guard', () => {
    const mercId = hire();
    const beforeMerc = mercXp(mercId);
    complete();
    const before = data();
    const inventory = useInventoryStore.getState();
    const hero = usePlayerStore.getState().player;
    const merc = useMercStore.getState();
    const progress = useMapStore.getState().questProgress[DEN];
    const mark = useMapStore.getState().markQuestRewardClaimed;
    const grantError = new Error('Controlled final unique flag failure');
    const restoreError = new Error('Controlled inventory restoration failure');
    let flagFailed = false;
    useMapStore.setState({ markQuestRewardClaimed: id => { mark(id); flagFailed = true; throw grantError; } });
    const originalSet = useInventoryStore.setState;
    const restore = vi.spyOn(useInventoryStore, 'setState').mockImplementation((...args) => {
      if (flagFailed) throw restoreError;
      originalSet(...args);
    });
    try {
      withRewards({ xp: 8000, runeShards: 7, itemDrop: COIF_REWARD }, () => {
        let failure: unknown;
        try { claimQuestReward(DEN); } catch (error) { failure = error; }
        expect(failure).toBeInstanceOf(AggregateError);
        if (!(failure instanceof AggregateError)) throw new Error('Expected restoration AggregateError');
        expect(failure.message).toBe('Quest reward restoration failed');
        expect(failure.cause).toBe(grantError);
        expect(failure.errors).toEqual([restoreError]);
        expect(usePlayerStore.getState().player).toBe(hero);
        expect(useMercStore.getState().ownedMercs).toBe(merc.ownedMercs);
        expect(useMercStore.getState().mercProgress).toBe(merc.mercProgress);
        expect(useMapStore.getState().questProgress[DEN]).toBe(progress);
        // Inventory restore failed: this state must never be described as recovered.
        expect(useInventoryStore.getState().backpack).toHaveLength(1);
        expect(useInventoryStore.getState().currencies).toEqual({ runeShards: 7 });
      });
    } finally {
      restore.mockRestore();
      useMapStore.setState({ markQuestRewardClaimed: mark });
      useInventoryStore.setState({ backpack: inventory.backpack, currencies: inventory.currencies });
    }
    expect(data()).toEqual(before);
    withRewards({ xp: 8000, itemDrop: COIF_REWARD }, () => { expect(claimQuestReward(DEN)).toBe('ok'); });
    expect(mercXp(mercId)).toBe(beforeMerc + 6000);
  });
});
