/**
 * useIdleTicker tests — Bug #6 idle deltas must be applied to stores every tick.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deriveStats } from '@/engine/progression/stats';
import type { CoreStats } from '@/engine/types/attributes';
import { useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { rollKillRewards } from '@/engine/loot/award';
import { useIdleTickerStore } from './useIdleTicker';

vi.mock('@/engine/loot/award', () => ({
  rollKillRewards: vi.fn(() => ({
    items: [{
      id: 'idle-drop',
      baseId: 'items/base/weapon-short-sword',
      rarity: 'normal',
      level: 1,
      identified: true,
      equipped: false
    }],
    runeShards: 2,
    runes: 1,
    gems: 1,
    wishstones: 1
  }))
}));

const core: CoreStats = { strength: 10, dexterity: 10, vitality: 10, energy: 10 };

beforeEach(() => {
  vi.clearAllMocks();
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

describe('useIdleTickerStore.applyTick', () => {
  it('applies XP, currencies, rolled loot, and bonus state on every tick', () => {
    useIdleTickerStore.getState().applyTick();
    const afterFirstXp = usePlayerStore.getState().player?.experience ?? 0;

    expect(afterFirstXp).toBeGreaterThan(0);
    expect(useInventoryStore.getState().getCurrency('rune-shard')).toBe(4);
    expect(useInventoryStore.getState().getCurrency('gem-shard')).toBe(1);
    expect(useInventoryStore.getState().getCurrency('wishstone')).toBe(1);
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
    expect(useIdleTickerStore.getState().tickCount).toBe(1);

    useIdleTickerStore.getState().applyTick();

    expect(usePlayerStore.getState().player?.experience ?? 0).toBeGreaterThan(afterFirstXp);
    expect(useInventoryStore.getState().getCurrency('rune-shard')).toBe(8);
    expect(useInventoryStore.getState().getCurrency('gem-shard')).toBe(2);
    expect(useInventoryStore.getState().getCurrency('wishstone')).toBe(2);
    expect(useInventoryStore.getState().backpack).toHaveLength(2);
    expect(vi.mocked(rollKillRewards)).toHaveBeenCalledTimes(2);
  });
});
