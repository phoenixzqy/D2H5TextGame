import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadMercPool } from '@/data/loaders/mercs';
import { awardXp, xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import * as persistence from '@/stores/persistence';
import { beginWaveTransition, endWaveTransition, beginIronGolemDebit,
  endIronGolemDebit } from '@/stores/waveTransitionGuard';
import type { QuestItemLedger } from '@/engine/types/save';
import * as actions from './claimReward';

const questId = 'quests/act2-radaments-lair';
const source = `${questId}#reward:questItem`;
const bookId = 'items/book_of_skill';
const den = 'quests/act1-den-of-evil';
const domains = [usePlayerStore, useInventoryStore, useMapStore, useMercStore] as const;
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing book fixture');
  return value;
}
function read(key = source) { return actions.readQuestItem(key); }
function hero() { return required(usePlayerStore.getState().player); }
function data() {
  return structuredClone(domains.map(store => Object.fromEntries(
    Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function'))));
}
function owned(state: 'owned' | 'consumed' = 'owned') {
  useMapStore.setState({ questProgress: { [questId]: { id: questId, status: 'completed',
    objectives: { 'obj-kill-radament': true }, rewardClaimed: true } } });
  useInventoryStore.setState({ questItems: { [source]: { itemId: bookId, state } } });
}
function hire() {
  const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight'));
  const result = useMercStore.getState().hireMerc(def);
  const id = required(result.mercId);
  useMercStore.getState().setFieldedMerc(id);
  return id;
}
function totalMercXp(id: string): number {
  const merc = required(useMercStore.getState().ownedMercs.find(row => row.id === id));
  let total = useMercStore.getState().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function reset() {
  __resetPersistenceForTests();
  for (const store of domains) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
}
beforeEach(() => {
  reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Book reader', 'sorceress'));
  useMapStore.setState({ questProgress: { [questId]: { id: questId, status: 'completed',
    objectives: { 'obj-kill-radament': true } } } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('source-bound Book of Skill transactions', () => {
  it('claims authored XP and unread book independently of full gear containers, then Reads once', () => {
    const id = hire();
    const mercBefore = totalMercXp(id);
    const item = { id: 'gear', baseId: 'items/base/helm-cap', rarity: 'normal' as const,
      level: 1, identified: true, equipped: false };
    useInventoryStore.setState({ backpack: Array.from({ length: 100 }, (_, n) => ({ ...item, id: `bag-${String(n)}` })),
      stash: Array.from({ length: 500 }, (_, n) => ({ ...item, id: `stash-${String(n)}` })) });
    const inventory = useInventoryStore.getState();
    const before = hero();
    const expected = awardXp(xpTotal(before.level) + before.experience, 5000);
    expect(actions.claimQuestReward(questId)).toBe('ok');
    expect(xpTotal(hero().level) + hero().experience).toBe(expected.totalXp);
    expect(hero().skillPoints).toBe(before.skillPoints + expected.skillPointsGranted);
    expect(useInventoryStore.getState().questItems).toEqual({ [source]: { itemId: bookId, state: 'owned' } });
    expect(useMapStore.getState().questProgress[questId]?.rewardClaimed).toBe(true);
    expect(totalMercXp(id)).toBe(mercBefore + 3750);
    const beforeRead = data();
    const claimedHero = hero();
    expect(actions.claimQuestReward(questId)).toBe('already-claimed');
    expect(data()).toEqual(beforeRead);
    expect(read()).toBe('ok');
    expect(hero()).toEqual({ ...claimedHero, skillPoints: claimedHero.skillPoints + 1 });
    expect(useInventoryStore.getState().questItems).toEqual({ [source]: { itemId: bookId, state: 'consumed' } });
    expect(useInventoryStore.getState().backpack).toBe(inventory.backpack);
    expect(useInventoryStore.getState().stash).toBe(inventory.stash);
    const consumed = data();
    expect(read()).toBe('already-consumed');
    expect(data()).toEqual(consumed);
  });

  it.each(['idle', 'loading', 'error'] as const)('refuses Read during %s hydration without writes', status => {
    owned(); useHydrationStore.getState().setStatus(status);
    const before = data(); expect(read()).toBe('not-ready'); expect(data()).toEqual(before);
  });
  it('refuses Read without a current hero', () => {
    owned(); usePlayerStore.getState().reset();
    const before = data(); expect(read()).toBe('no-player'); expect(data()).toEqual(before);
  });
  it('refuses both actions while a save replacement owns installation', () => {
    vi.spyOn(persistence, 'isReplacingSave').mockReturnValue(true);
    const before = data(); expect(actions.claimQuestReward(questId)).toBe('not-ready');
    expect(read()).toBe('not-ready'); expect(data()).toEqual(before);
  });
  it('permits the exact safe-point boundary and rejects nested successful grants', () => {
    owned(); usePlayerStore.setState({ player: { ...hero(), skillPoints: Number.MAX_SAFE_INTEGER - 1 } });
    const nested: unknown[] = [];
    const unsub = usePlayerStore.subscribe(() => { nested.push(read(), actions.claimQuestReward(questId)); });
    try { expect(read()).toBe('ok'); } finally { unsub(); }
    expect(hero().skillPoints).toBe(Number.MAX_SAFE_INTEGER);
    expect(nested).toEqual(['claim-in-progress', 'claim-in-progress']);
  });
  it('does not manufacture an unread item from a historical claimed quest', () => {
    owned(); useInventoryStore.setState({ questItems: {} });
    const before = data(); expect(read()).toBe('not-owned'); expect(data()).toEqual(before);
  });
  it('uses the exact source key rather than an item or quest alias', () => {
    owned(); const before = data();
    expect(read(bookId)).toBe('unsupported-rewards');
    expect(read(questId)).toBe('unsupported-rewards'); expect(data()).toEqual(before);
  });
  it.each([null, [], new Map(), new Date(1000), { unknown: { itemId: bookId, state: 'owned' } },
    { [source]: { itemId: bookId, state: 'owned', extra: true } }])(
    'refuses corrupted live ledgers in both actions (%j)', ledger => {
      useInventoryStore.setState({ questItems: ledger as unknown as QuestItemLedger });
      const before = data();
      expect(actions.claimQuestReward(questId)).toBe('unsupported-rewards');
      expect(read()).toBe('unsupported-rewards'); expect(data()).toEqual(before);
    }
  );
  it('rejects corruption in an unrelated ledger entry before a normal numeric claim', () => {
    owned();
    useInventoryStore.setState({ questItems: { ...useInventoryStore.getState().questItems,
      unknown: { itemId: bookId, state: 'owned' } } });
    useMapStore.getState().updateQuestProgress(den, { status: 'completed', objectives: {} });
    const before = data(); expect(actions.claimQuestReward(den)).toBe('unsupported-rewards');
    expect(read()).toBe('unsupported-rewards'); expect(data()).toEqual(before);
  });
  it.each(['owned', 'consumed'] as const)('refuses an existing %s receipt for an unclaimed source', state => {
    useInventoryStore.setState({ questItems: { [source]: { itemId: bookId, state } } });
    const before = data(); expect(actions.claimQuestReward(questId)).toBe('unsupported-rewards'); expect(data()).toEqual(before);
  });
  it.each(['id', 'objective'] as const)('requires canonical source progress: %s', bad => {
    useMapStore.getState().updateQuestProgress(questId, bad === 'id' ? { id: 'other' }
      : { objectives: { 'obj-kill-radament': false } });
    const before = data(); expect(actions.claimQuestReward(questId)).toBe('unsupported-rewards'); expect(data()).toEqual(before);
  });
  it.each([Number.MAX_SAFE_INTEGER, NaN, -1, 0.5])('refuses unsafe Read points (%s)', skillPoints => {
    owned(); usePlayerStore.setState({ player: { ...hero(), skillPoints } });
    const before = data(); expect(read()).toBe('unsupported-rewards'); expect(data()).toEqual(before);
  });
  it.each(['skillPoints', 'statPoints', 'experience', 'level'] as const)('preflights claim arithmetic: %s', key => {
    usePlayerStore.setState({ player: { ...hero(), [key]: Number.MAX_SAFE_INTEGER } });
    const before = data(); expect(actions.claimQuestReward(questId)).toBe('unsupported-rewards'); expect(data()).toEqual(before);
  });
  it('preflights XP-derived plus explicit points together', () => {
    usePlayerStore.setState({ player: { ...hero(), skillPoints: Number.MAX_SAFE_INTEGER - 1 } });
    useMapStore.getState().updateQuestProgress(den, { status: 'completed', objectives: {} });
    const before = data(); expect(actions.claimQuestReward(den)).toBe('unsupported-rewards'); expect(data()).toEqual(before);
  });
  it('preflights the fielded mercenary XP sum before any player write', () => {
    const id = hire();
    useMercStore.setState({ mercProgress: { [id]: { experience: Number.MAX_SAFE_INTEGER, experienceToNextLevel: 60 } } });
    const before = data(); expect(actions.claimQuestReward(questId)).toBe('unsupported-rewards'); expect(data()).toEqual(before);
  });

  for (const failAt of ['player', 'merc', 'ledger', 'flag'] as const) {
    it(`restores every participating field after ${failAt} publishes then throws, and retries`, () => {
      hire(); const before = data();
      const store = failAt === 'player' ? usePlayerStore : failAt === 'merc' ? useMercStore
        : failAt === 'ledger' ? useInventoryStore : useMapStore;
      let failed = false;
      const nested: unknown[] = [];
      const unsub = store.subscribe(() => {
        nested.push(read());
        if (!failed) { failed = true; throw new Error('Controlled book grant failure'); }
      });
      try { expect(actions.claimQuestReward(questId)).toBe('grant-failed'); }
      finally { unsub(); }
      expect(failed).toBe(true); expect(data()).toEqual(before);
      expect(nested.length).toBeGreaterThan(1);
      expect(nested.every(value => value === 'claim-in-progress')).toBe(true);
      expect(actions.claimQuestReward(questId)).toBe('ok'); expect(read()).toBe('ok');
    });
  }
  for (const failAt of ['player', 'ledger'] as const) {
    it(`restores Read after ${failAt} publishes then throws; nested Claim/Read cannot escape rollback`, () => {
      owned(); useMapStore.getState().updateQuestProgress(den, { status: 'completed', objectives: {} });
      const before = data();
      const store = failAt === 'player' ? usePlayerStore : useInventoryStore;
      let failed = false; const nested: unknown[] = [];
      const unsub = store.subscribe(() => {
        nested.push(actions.claimQuestReward(den), read());
        if (!failed) { failed = true; throw new Error('Controlled book read failure'); }
      });
      try { expect(read()).toBe('grant-failed'); } finally { unsub(); }
      expect(failed).toBe(true); expect(data()).toEqual(before);
      expect(nested.length).toBeGreaterThan(2);
      expect(nested.every(value => value === 'claim-in-progress')).toBe(true);
      expect(read()).toBe('ok'); expect(actions.claimQuestReward(den)).toBe('ok');
    });
  }
  it('attempts remaining Read restoration after player restore fails, throws explicitly and releases the lock', () => {
    owned(); const player = hero(); const ledger = useInventoryStore.getState().questItems;
    let failed = false;
    const original = usePlayerStore.setState;
    const spy = vi.spyOn(usePlayerStore, 'setState').mockImplementation((...args) => {
      if (failed) throw new Error('Controlled Read restoration failure');
      original(...args);
    });
    const unsub = useInventoryStore.subscribe(() => {
      if (!failed) { failed = true; throw new Error('Controlled Read receipt failure'); }
    });
    try {
      expect(read).toThrow(AggregateError);
      expect(useInventoryStore.getState().questItems).toBe(ledger);
      expect(hero()).toEqual({ ...player, skillPoints: player.skillPoints + 1 });
    } finally { unsub(); spy.mockRestore(); usePlayerStore.setState({ player }); }
    expect(read()).toBe('ok');
  });
  it('guards both actions before store reads only during exact Iron Golem debit', () => {
    const lease = beginWaveTransition(true);
    beginIronGolemDebit(lease);
    const spy = vi.spyOn(useInventoryStore, 'getState');
    try {
      expect(() => actions.claimQuestReward(questId)).toThrow('itemDebitBusy');
      expect(read).toThrow('itemDebitBusy'); expect(spy).not.toHaveBeenCalled();
    } finally { spy.mockRestore(); endIronGolemDebit(lease); endWaveTransition(lease); }
    const ordinary = beginWaveTransition(true);
    try { expect(actions.claimQuestReward(questId)).toBe('ok'); expect(read()).toBe('ok'); }
    finally { endWaveTransition(ordinary); }
  });
});
