import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as mercData from '@/data/loaders/mercs';
import { createRng } from '@/engine/rng';
import { createRecruitmentState, planRecruitment } from '@/engine/gacha/recruitment-state';
import { deriveStats } from '@/engine/progression/stats';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMetaStore } from './metaStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore, mercXpForLevel } from './mercStore';
import { usePlayerStore } from './playerStore';
import { useCombatStore } from './combatStore';
import { useHydrationStore } from './hydrationStore';
import { createMercFromDef } from './mercFactory';
import { __resetPersistenceForTests, snapshotStores } from './persistence';
import { beginMaterialTransaction, endMaterialTransaction, reserveWaveRestore, releaseWaveRestore } from './waveTransitionGuard';

const NOW = 1750000000123;
function participants() {
  const merc = useMercStore.getState();
  return { currencies: useInventoryStore.getState().currencies, gacha: useMetaStore.getState().gachaState,
    recruitmentState: useMetaStore.getState().recruitmentState, recruitmentProgress: merc.recruitmentProgress,
    ownedMercs: merc.ownedMercs, mercEquipment: merc.mercEquipment, mercProgress: merc.mercProgress,
    fieldedMercId: merc.fieldedMercId };
}
function fund(wishstone: number, legacy = 0) {
  useInventoryStore.setState({ currencies: { wishstone, 'rune-shard': 19, historical: 23 } });
  useMetaStore.getState().updateGachaState({ currency: legacy });
}
beforeEach(() => {
  __resetPersistenceForTests();
  useCombatStore.getState().reset(); useInventoryStore.getState().reset();
  useMercStore.getState().reset(); useMetaStore.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Recruitment', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});
afterEach(() => { vi.restoreAllMocks(); __resetPersistenceForTests(); });

describe('earned wishstone recruitment', () => {
  it.each([1, 70, 90])('starts new paid identities at hero level %s with L1 natural growth and exact save state', level => {
    const hero = { ...createMockPlayer('Recruitment', 'sorceress'), level };
    usePlayerStore.getState().setPlayer(hero);
    fund(90);
    const results = useMetaStore.getState().pullGacha(10);
    expect(results).toHaveLength(10);
    const merc = useMercStore.getState();
    expect(merc.ownedMercs.length).toBeGreaterThan(0);
    // Independent class gain rows; do not construct the oracle through the factory/growth helper.
    const gains: Record<string, readonly [number, number, number, number]> = {
      rogue: [8, 1, 3, 1], 'desert-merc': [14, 3, 1, 1], 'iron-wolf': [6, 1, 1, 4],
      barbarian: [16, 3, 2, 0], paladin: [12, 2, 1, 1], militia: [10, 2, 1, 1],
      thief: [7, 1, 3, 1], acolyte: [6, 1, 1, 4]
    };
    for (const recruit of merc.ownedMercs) {
      const def = mercData.loadMercPool().pool.find(candidate => candidate.id === recruit.id);
      if (!def) throw new Error('Missing paid identity');
      const gain = gains[def.classRef];
      if (!gain) throw new Error('Missing independent class gain');
      expect(recruit.level).toBe(level);
      const core = { strength: def.baseStats.strength + gain[1] * (level - 1),
        dexterity: def.baseStats.dexterity + gain[2] * (level - 1), vitality: def.baseStats.vitality,
        energy: def.baseStats.energy + gain[3] * (level - 1) };
      const bare = deriveStats(core, level);
      const lifeMax = 100 + def.baseStats.vitality * 2 + gain[0] * (level - 1);
      expect(recruit.coreStats).toEqual(core);
      expect(recruit.derivedStats).toEqual({ ...bare, life: lifeMax, lifeMax });
      expect(merc.mercProgress[recruit.id]).toEqual({ experience: 0, experienceToNextLevel: mercXpForLevel(level) });
      expect(merc.mercEquipment[recruit.id]).toEqual({});
    }
    expect(usePlayerStore.getState().player).toBe(hero);
    expect(merc.fieldedMercId).toBeNull();
    expect(useInventoryStore.getState().currencies.wishstone).toBe(0);
    const saved = snapshotStores();
    expect(saved).not.toBeNull();
    expect(decodeSave(toJsonSafe(saved)).mercs).toEqual(saved?.mercs);
  });

  it.each([0, -1, 1.5, 91, NaN, Infinity])('refuses invalid hero level %s before drawing or payment', level => {
    usePlayerStore.getState().setPlayer({ ...createMockPlayer('Recruitment', 'sorceress'), level });
    fund(90); const before = participants();
    vi.mocked(Date.now).mockClear();
    expect(useMetaStore.getState().pullGacha(10)).toBeNull();
    expect(Date.now).not.toHaveBeenCalled();
    expect(participants()).toEqual(before);
  });

  it('forces the next paid draw from legacy 89 misses and records the result once', () => {
    fund(20); useMetaStore.getState().updateGachaState({ pityCounter: 89 });
    expect(useMetaStore.getState().recruitmentState.history).toEqual([]);
    const result = useMetaStore.getState().pullGacha(1);
    expect(result?.[0]?.rarity).toBe('SSR');
    expect(useInventoryStore.getState().currencies.wishstone).toBe(10);
    expect(useMetaStore.getState().gachaState.pityCounter).toBe(0);
    expect(useMetaStore.getState().recruitmentState).toMatchObject({ srPityCounter: 0, totalPulls: 1 });
    expect(useMetaStore.getState().recruitmentState.history[0]).toMatchObject({ ordinal: 1, timestamp: NOW, rarity: 'SSR' });
  });
  it('credits real duplicate shards without making another roster entry or upgrading automatically', () => {
    usePlayerStore.getState().setPlayer({ ...createMockPlayer('Recruitment', 'sorceress'), level: 70 });
    const pool = mercData.loadMercPool();
    for (const def of pool.pool) {
      const recruit = createMercFromDef(def);
      useMercStore.getState().addMerc({ ...recruit, alive: false,
        derivedStats: { ...recruit.derivedStats, life: 3, mana: 2 } });
    }
    const before = useMercStore.getState();
    fund(90);
    const results = useMetaStore.getState().pullGacha(10);
    expect(results).toHaveLength(10);
    expect(useMercStore.getState().ownedMercs).toHaveLength(25);
    expect(useMercStore.getState().ownedMercs).toBe(before.ownedMercs);
    expect(useMercStore.getState().mercEquipment).toBe(before.mercEquipment);
    expect(useMercStore.getState().mercProgress).toBe(before.mercProgress);
    const expected: Record<string, { shards: number; stars: number }> = {};
    for (const result of results ?? []) {
      expect(result.isNew).toBe(false);
      expect(result.shardCount).toBe(pool.banner.shardConversion.perDuplicate[result.rarity]);
      const current = expected[result.mercDef.id] ?? { shards: 0, stars: 0 };
      expected[result.mercDef.id] = { stars: 0, shards: current.shards + result.shardCount };
    }
    expect(useMercStore.getState().recruitmentProgress).toEqual(expected);
    expect(useMetaStore.getState().recruitmentState.history.map(row => row.shardCount))
      .toEqual(results?.map(row => row.shardCount));
    expect(snapshotStores()?.mercs.recruitmentProgress).toEqual(expected);
  });
  it('spends the actual earned wallet instead of requiring a second balance', () => {
    fund(8790);
    expect(useMetaStore.getState().pullGacha(1)).toHaveLength(1);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 8780, 'rune-shard': 19, historical: 23 });
    expect(useMetaStore.getState().gachaState.currency).toBe(0);
    expect(useMercStore.getState().ownedMercs).toHaveLength(1);
  });
  it('charges the authored 90 for ten, including an exact-balance purchase', () => {
    fund(90);
    expect(useMetaStore.getState().pullGacha(10)).toHaveLength(10);
    expect(useInventoryStore.getState().currencies.wishstone).toBe(0);
  });
  it('preserves spendability of a genuine legacy-only wallet', () => {
    fund(0, 95);
    expect(useMetaStore.getState().pullGacha(10)).toHaveLength(10);
    expect(useInventoryStore.getState().currencies.wishstone).toBe(5);
    expect(useMetaStore.getState().gachaState.currency).toBe(0);
  });
  it('conserves mixed legacy value on payment without rewriting it on read', () => {
    fund(80, 15);
    const before = participants();
    expect(snapshotStores()?.meta.gachaState.currency).toBe(15);
    expect(participants()).toEqual(before);
    expect(useMetaStore.getState().pullGacha(10)).toHaveLength(10);
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 5, 'rune-shard': 19, historical: 23 });
    expect(useMetaStore.getState().gachaState.currency).toBe(0);
    expect(useMetaStore.getState().pullGacha(1)).toBeNull();
    expect(useInventoryStore.getState().currencies.wishstone).toBe(5);
  });
  it('uses the version33 draw stream while retaining existing roster, equipment and progression', () => {
    const pool = mercData.loadMercPool(), rng = createRng((NOW ^ 89) >>> 0);
    const rolled = planRecruitment(rng, pool.banner, createRecruitmentState(89), {}, new Set(), 10, NOW);
    const ids = rolled.results.map(r => r.mercId);
    const existingDef = pool.pool.find(d => d.id === ids[0]);
    if (!existingDef) throw new Error('Missing actual pool definition');
    const existing = createMercFromDef(existingDef, 'earned');
    useMercStore.getState().addMerc(existing);
    useMercStore.getState().setFieldedMerc(existing.id);
    const before = useMercStore.getState();
    fund(100); useMetaStore.getState().updateGachaState({ pityCounter: 89 });
    const results = useMetaStore.getState().pullGacha(10);
    expect(results?.map(r => r.mercDef.id)).toEqual(ids);
    expect(results?.map(r => r.rarity)).toEqual(rolled.results.map(r => r.rarity));
    const seen = new Set([existingDef.id]);
    for (const result of results ?? []) {
      expect(result.isNew).toBe(!seen.has(result.mercDef.id)); seen.add(result.mercDef.id);
    }
    const merc = useMercStore.getState();
    expect(merc.fieldedMercId).toBe(existing.id);
    expect(merc.ownedMercs[0]).toBe(existing);
    expect(merc.mercEquipment[existing.id]).toBe(before.mercEquipment[existing.id]);
    expect(merc.mercProgress[existing.id]).toBe(before.mercProgress[existing.id]);
    expect(merc.ownedMercs).toHaveLength(seen.size);
    for (const recruit of merc.ownedMercs.slice(1)) {
      expect(merc.mercEquipment[recruit.id]).toEqual({});
      expect(merc.mercProgress[recruit.id]).toEqual({ experience: 0, experienceToNextLevel: mercXpForLevel(recruit.level) });
    }
    expect(useMetaStore.getState().gachaState).toEqual({ currency: 0, pityCounter: rolled.state.pityCounter,
      ownedMercIds: merc.ownedMercs.map(m => m.id) });
    const saved = snapshotStores();
    expect(saved?.meta.gachaState).toEqual(useMetaStore.getState().gachaState);
    expect(saved?.meta.recruitmentState).toEqual(useMetaStore.getState().recruitmentState);
    expect(saved?.mercs.recruitmentProgress).toEqual(useMercStore.getState().recruitmentProgress);
    expect(saved?.inventory.currencies.wishstone).toBe(10);
  });
  it.each([-1, 0, 2, 9, 11, 1.5, NaN, Infinity])('refuses unsupported count %s before RNG or publication', count => {
    fund(100, 100); const before = participants();
    const now = vi.mocked(Date.now); now.mockClear();
    expect(useMetaStore.getState().pullGacha(count)).toBeNull();
    expect(now).not.toHaveBeenCalled(); expect(participants()).toEqual(before);
  });
  it.each([[-1, 100], [0.5, 100], [NaN, 100], [Infinity, 100], [100, -1], [100, 0.5],
    [100, NaN], [100, Infinity], [Number.MAX_SAFE_INTEGER, 1]])('refuses invalid wallet %s + %s', (earned, legacy) => {
    fund(earned, legacy); const before = participants();
    expect(useMetaStore.getState().pullGacha(1)).toBeNull(); expect(participants()).toEqual(before);
  });
  it('leaves an insufficient mixed wallet and pity exact', () => {
    fund(80, 9); const before = participants();
    expect(useMetaStore.getState().pullGacha(10)).toBeNull(); expect(participants()).toEqual(before);
  });
  it('grants new currency to the canonical wallet and spends conserved legacy once', () => {
    fund(5, 7); useMetaStore.getState().addGachaCurrency(3);
    expect(useInventoryStore.getState().currencies.wishstone).toBe(8);
    expect(useMetaStore.getState().gachaState.currency).toBe(7);
    expect(useMetaStore.getState().spendGachaCurrency(10)).toBe(true);
    expect(useInventoryStore.getState().currencies.wishstone).toBe(5);
    expect(useMetaStore.getState().gachaState.currency).toBe(0);
    expect(useMetaStore.getState().spendGachaCurrency(10)).toBe(false);
  });
  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])('rejects invalid/overflowing grants %s', amount => {
    fund(10); const before = participants();
    expect(() => { useMetaStore.getState().addGachaCurrency(amount); }).toThrow(); expect(participants()).toEqual(before);
  });
});

describe('recruitment transaction boundary', () => {
  it.each(['inventory', 'merc', 'meta'] as const)('restores all references after a %s publication observer fails', domain => {
    usePlayerStore.getState().setPlayer({ ...createMockPlayer('Recruitment', 'sorceress'), level: 70 });
    fund(100, 5); const before = participants(); let fail = true;
    const store = domain === 'inventory' ? useInventoryStore : domain === 'merc' ? useMercStore : useMetaStore;
    const unsubscribe = store.subscribe(() => { if (fail) { fail = false; throw new Error('publication observer'); } });
    try { expect(useMetaStore.getState().pullGacha(10)).toBeNull(); } finally { unsubscribe(); }
    for (const key of Object.keys(before) as (keyof typeof before)[]) expect(participants()[key]).toBe(before[key]);
    expect(() => snapshotStores()).not.toThrow();
  });
  it('prepares complete content before payment rather than silently omitting recruits', () => {
    fund(100, 100); const before = participants(), pool = mercData.loadMercPool();
    vi.spyOn(mercData, 'loadMercPool').mockReturnValue({ ...pool, pool: [] });
    expect(() => useMetaStore.getState().pullGacha(10)).toThrow(); expect(participants()).toEqual(before);
  });
  it('detects a publication observer replacing the final pity reference and restores everything', () => {
    fund(100); const before = participants(); let replace = true;
    const unsubscribe = useMetaStore.subscribe(() => {
      if (replace) { replace = false; useMetaStore.setState({ gachaState: { ...useMetaStore.getState().gachaState } }); }
    });
    try { expect(useMetaStore.getState().pullGacha(10)).toBeNull(); } finally { unsubscribe(); }
    expect(participants()).toEqual(before);
  });
  it('blocks saving and further recruitment if restoration itself cannot finish cleanly', () => {
    fund(100); const before = participants();
    const unsubscribe = useMercStore.subscribe(() => { throw new Error('persistent observer failure'); });
    try { expect(() => useMetaStore.getState().pullGacha(10)).toThrow('Recruitment restoration failed'); }
    finally { unsubscribe(); }
    expect(participants()).toEqual(before);
    expect(useHydrationStore.getState().status).toBe('error');
    expect(useMetaStore.getState().pullGacha(1)).toBeNull();
  });
  it('excludes snapshots, restore, nested payments and supported metadata/roster writes', () => {
    fund(100); let checks = 0;
    const hireable = mercData.loadMercPool().pool[0];
    if (!hireable) throw new Error('Missing hireable test fixture');
    const unsubscribe = useInventoryStore.subscribe(() => {
      checks++;
      expect(() => snapshotStores()).toThrow(); expect(() => reserveWaveRestore()).toThrow();
      expect(() => useMetaStore.getState().pullGacha(1)).toThrow();
      expect(() => useMetaStore.getState().spendGachaCurrency(1)).toThrow();
      expect(() => { useMetaStore.getState().addGachaCurrency(1); }).toThrow();
      expect(() => { useMetaStore.getState().updateGachaState({ currency: 999 }); }).toThrow();
      expect(() => { useMetaStore.getState().incrementPity(); }).toThrow();
      expect(() => { useMetaStore.getState().resetPity(); }).toThrow();
      expect(() => { useMetaStore.getState().reset(); }).toThrow();
      expect(() => useInventoryStore.getState().spendCurrency('wishstone', 1)).toThrow();
      expect(() => useMercStore.getState().hireMerc(hireable)).toThrow();
    });
    try { expect(useMetaStore.getState().pullGacha(10)).toHaveLength(10); } finally { unsubscribe(); }
    expect(checks).toBe(1); expect(() => snapshotStores()).not.toThrow();
  });
  it('refuses unresolved restore or material ownership without payment', () => {
    fund(100); const before = participants();
    const restore = reserveWaveRestore();
    try { expect(() => useMetaStore.getState().pullGacha(1)).toThrow(); } finally { releaseWaveRestore(restore); }
    const lease = beginMaterialTransaction(true);
    try { expect(() => useMetaStore.getState().pullGacha(1)).toThrow(); } finally { endMaterialTransaction(lease); }
    expect(participants()).toEqual(before);
  });
  it.each(['loading', 'error', 'idle'] as const)('refuses hydration %s', status => {
    fund(100); useHydrationStore.getState().setStatus(status); const before = participants();
    expect(useMetaStore.getState().pullGacha(1)).toBeNull(); expect(participants()).toEqual(before);
  });
  it('refuses combat and missing hero', () => {
    fund(100); const before = participants(); useCombatStore.setState({ inCombat: true });
    expect(useMetaStore.getState().pullGacha(1)).toBeNull();
    useCombatStore.setState({ inCombat: false }); usePlayerStore.getState().reset();
    expect(useMetaStore.getState().pullGacha(1)).toBeNull(); expect(participants()).toEqual(before);
  });
});
