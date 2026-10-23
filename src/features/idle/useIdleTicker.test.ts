/**
 * useIdleTicker tests — Bug #6 idle deltas must be applied to stores every tick.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deriveStats } from '@/engine/progression/stats';
import type { CoreStats } from '@/engine/types/attributes';
import { useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { rollKillRewards } from '@/engine/loot/award';
import { useIdleTickerStore } from './useIdleTicker';
import { snapshotStores, useHydrationStore } from '@/stores/persistence';
import { getIdleEliteMisses } from '@/stores/idleElitePity';

vi.mock('@/engine/loot/award', () => {
  let sequence = 0;
  return {
  rollKillRewards: vi.fn(() => ({
    items: [{
      id: `idle-drop-${String(sequence++)}`,
      baseId: 'items/base/weapon-short-sword',
      rarity: 'normal',
      level: 1,
      identified: true,
      equipped: false
    }],
    runeShards: 2,
    runes: 1,
    gems: 1,
    wishstones: 1,
    materials: { 'runes/ral': 1, 'gems/ruby/chipped': 1 }
  }))
  };
});

const core: CoreStats = { strength: 10, dexterity: 10, vitality: 10, energy: 10 };

beforeEach(() => {
  vi.clearAllMocks();
  useHydrationStore.getState().setStatus('ready');
  useIdleTickerStore.getState().reset();
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useMapStore.getState().setCurrentLocation(1, 'a1-blood-moor');
  usePlayerStore.getState().reset();
  usePlayerStore.getState().setPlayer({
    id: 'player-1',
    name: 'Tester',
    type: 'player',
    team: 'player',
    class: 'necromancer',
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    statPoints: 0,
    skillPoints: 0,
    coreStats: core,
    derivedStats: deriveStats(core, 1),
    statusEffects: [],
    cooldowns: [],
    skills: [],
    comboOrder: [],
    alive: true,
    turnOrder: 0,
    equipment: []
  });
});
afterEach(() => { vi.restoreAllMocks(); });

function snapshot() {
  return structuredClone({ hero: usePlayerStore.getState().player,
    backpack: useInventoryStore.getState().backpack, currencies: useInventoryStore.getState().currencies,
    materials: useInventoryStore.getState().materials, pity: getIdleEliteMisses(),
    tick: Object.fromEntries(Object.entries(useIdleTickerStore.getState()).filter(([, value]) => typeof value !== 'function')) });
}

describe('useIdleTickerStore.applyTick', () => {
  it('applies XP, currencies, rolled loot, and bonus state on every tick', () => {
    useIdleTickerStore.getState().applyTick();
    const afterFirstXp = usePlayerStore.getState().player?.experience ?? 0;

    expect(afterFirstXp).toBeGreaterThan(0);
    expect(useInventoryStore.getState().getCurrency('rune-shard')).toBe(3);
    expect(useInventoryStore.getState().getCurrency('gem-shard')).toBe(0);
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/ral': 1, 'gems/ruby/chipped': 1 });
    expect(useInventoryStore.getState().getCurrency('wishstone')).toBe(1);
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
    expect(useIdleTickerStore.getState().tickCount).toBe(1);

    useIdleTickerStore.getState().applyTick();

    expect(usePlayerStore.getState().player?.experience ?? 0).toBeGreaterThan(afterFirstXp);
    expect(useInventoryStore.getState().getCurrency('rune-shard')).toBe(6);
    expect(useInventoryStore.getState().getCurrency('gem-shard')).toBe(0);
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/ral': 2, 'gems/ruby/chipped': 2 });
    expect(useInventoryStore.getState().getCurrency('wishstone')).toBe(2);
    expect(useInventoryStore.getState().backpack).toHaveLength(2);
    expect(vi.mocked(rollKillRewards)).toHaveBeenCalledTimes(2);
  });

  it('stages all loot before XP or other writes when generation throws', () => {
    vi.mocked(rollKillRewards).mockImplementationOnce(() => { throw new Error('loot generation'); });
    const before = snapshot(); let writes = 0;
    const stops = [usePlayerStore, useInventoryStore, useIdleTickerStore].map(store => store.subscribe(() => { writes++; }));
    try {
      expect(() => { useIdleTickerStore.getState().applyTick(); }).toThrow('loot generation');
      expect(snapshot()).toEqual(before); expect(writes).toBe(0);
    } finally { stops.forEach(stop => { stop(); }); }
  });

  it('refuses material overflow before all participating state changes', () => {
    useInventoryStore.getState().addMaterials({ 'runes/ral': Number.MAX_SAFE_INTEGER });
    const before = snapshot();
    expect(() => { useIdleTickerStore.getState().applyTick(); }).toThrow(/overflow/i);
    expect(snapshot()).toEqual(before);
  });

  it.each(['hero', 'inventory', 'ticker'] as const)('restores the entire tick after a %s subscriber mutates then throws, holding the guard', domain => {
    const before = snapshot(); let fired = false;
    const store = domain === 'hero' ? usePlayerStore : domain === 'inventory' ? useInventoryStore : useIdleTickerStore;
    const stop = store.subscribe(() => {
      if (fired) return;
      fired = true;
      expect(() => { snapshotStores(); }).toThrow();
      expect(() => { useIdleTickerStore.getState().applyTick(); }).toThrow();
      throw new Error('tick publication');
    });
    try {
      expect(() => { useIdleTickerStore.getState().applyTick(); }).toThrow('tick publication');
      expect(fired).toBe(true); expect(snapshot()).toEqual(before);
    } finally { stop(); }
    expect(() => { useIdleTickerStore.getState().applyTick(); }).not.toThrow();
    expect(useIdleTickerStore.getState().tickCount).toBe(1);
    expect(useInventoryStore.getState().materials['runes/ral']).toBe(1);
  });

  it('uses the actual selected replay difficulty for live material pools', () => {
    useMapStore.setState({ selectedDifficulty: 'nightmare' });
    useIdleTickerStore.getState().applyTick();
    expect(vi.mocked(rollKillRewards).mock.calls[0]?.[0].difficulty).toBe('nightmare');
  });
});
