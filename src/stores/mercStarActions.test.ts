import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { useMercStore } from './mercStore';
import { usePlayerStore } from './playerStore';
import { useMetaStore } from './metaStore';
import { useInventoryStore } from './inventoryStore';
import { useHydrationStore } from './hydrationStore';
import { useCombatStore } from './combatStore';
import { __resetPersistenceForTests, snapshotStores } from './persistence';
import { beginMaterialTransaction, endMaterialTransaction } from './waveTransitionGuard';

const id = 'mercs/act1-rogue-inner-sight';
beforeEach(() => {
  __resetPersistenceForTests(); useCombatStore.getState().reset();
  useMercStore.getState().reset(); useMetaStore.getState().reset(); useInventoryStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Stars', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  const def = loadMercPool().pool.find(row => row.id === id);
  if (!def) throw new Error('Missing native merc');
  const fresh = createMercFromDef(def, 'earned');
  useMercStore.getState().addMerc({ ...fresh,
    derivedStats: { ...fresh.derivedStats, life: 19, mana: 11 } });
  useMercStore.setState({ recruitmentProgress: { [id]: { shards: 205, stars: 0 } } });
});
afterEach(() => { __resetPersistenceForTests(); });

it('spends only the selected merc shards and persists progress without changing natural stats or resources', () => {
  const before = useMercStore.getState(), wallet = useInventoryStore.getState().currencies;
  expect(before.upgradeMercStar(id + '#earned')).toBe(true);
  const after = useMercStore.getState();
  expect(after.recruitmentProgress).toEqual({ [id]: { shards: 105, stars: 1 } });
  expect(after.ownedMercs).toBe(before.ownedMercs);
  expect(after.mercEquipment).toBe(before.mercEquipment);
  expect(after.mercProgress).toBe(before.mercProgress);
  expect(useInventoryStore.getState().currencies).toBe(wallet);
  expect(snapshotStores()?.mercs.recruitmentProgress).toEqual(after.recruitmentProgress);
  expect(after.upgradeMercStar(id + '#earned')).toBe(true);
  expect(useMercStore.getState().recruitmentProgress).toEqual({ [id]: { shards: 5, stars: 2 } });
  expect(after.upgradeMercStar(id + '#earned')).toBe(false);
});
it('requires actual instance ownership, even when canonical progress is retained', () => {
  const before = useMercStore.getState();
  expect(before.upgradeMercStar(id)).toBe(false);
  before.dismissMerc(id + '#earned');
  const dismissed = useMercStore.getState();
  expect(dismissed.upgradeMercStar(id + '#earned')).toBe(false);
  expect(useMercStore.getState().recruitmentProgress).toBe(before.recruitmentProgress);
});
it('retains all excess shards at the cap', () => {
  useMercStore.setState({ recruitmentProgress: { [id]: { shards: 900, stars: 5 } } });
  const before = useMercStore.getState();
  expect(before.upgradeMercStar(id + '#earned')).toBe(false);
  expect(useMercStore.getState()).toBe(before);
});
it.each(['combat', 'hydration', 'lease'])('refuses during %s without spending', mode => {
  if (mode === 'combat') useCombatStore.setState({ inCombat: true });
  if (mode === 'hydration') useHydrationStore.getState().setStatus('loading');
  const lease = mode === 'lease' ? beginMaterialTransaction(true) : null;
  const before = useMercStore.getState();
  try { expect(before.upgradeMercStar(id + '#earned')).toBe(false); expect(useMercStore.getState()).toBe(before); }
  finally { if (lease) endMaterialTransaction(lease); }
});
it('restores shard ownership when a synchronous observer throws after publication', () => {
  const before = useMercStore.getState();
  const stop = useMercStore.subscribe(state => {
    if (state.recruitmentProgress !== before.recruitmentProgress) throw new Error('observer failure');
  });
  try {
    expect(before.upgradeMercStar(id + '#earned')).toBe(false);
    expect(useMercStore.getState().recruitmentProgress).toBe(before.recruitmentProgress);
    expect(useMercStore.getState().ownedMercs).toBe(before.ownedMercs);
  } finally { stop(); }
});

it('applies the canonical star projection when building real combat inputs', () => {
  const state = useMercStore.getState(), merc = state.ownedMercs[0];
  if (!merc) throw new Error('Missing owned merc');
  const plain = mercToCombatUnit(merc);
  const starred = mercToCombatUnit(merc, undefined, {}, 3);
  expect(starred.stats.attack).toBeCloseTo(plain.stats.attack * 1.24, 12);
  expect(starred.life).toBeCloseTo(plain.life * 1.24, 12);
});

it('refuses reentrant spending during publication instead of spending twice', () => {
  const before = useMercStore.getState(); let nested: boolean | undefined;
  const stop = useMercStore.subscribe(state => {
    if (state.recruitmentProgress !== before.recruitmentProgress) nested = state.upgradeMercStar(id + '#earned');
  });
  try { expect(before.upgradeMercStar(id + '#earned')).toBe(true); expect(nested).toBe(false); }
  finally { stop(); }
  expect(useMercStore.getState().recruitmentProgress[id]).toEqual({ shards: 105, stars: 1 });
});
