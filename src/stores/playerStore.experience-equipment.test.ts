import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '@/engine/progression/stats';
import { xpRequired } from '@/engine/progression/xp';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';

function helm(): Item {
  return {
    id: 'xp-equipment-helm', baseId: 'items/base/helm-cap', rarity: 'magic',
    level: 1, identified: true, equipped: false, baseRolls: { defense: 13 },
    affixes: [{ affixId: 'controlled-equipment-mods', values: new Map([
      ['coreStats.strength', 4], ['coreStats.dexterity', 3],
      ['coreStats.vitality', 5], ['coreStats.energy', 6],
      ['statMods.life', 25], ['statMods.mana', 17], ['statMods.attack', 11],
      ['statMods.attackSpeed', 9], ['statMods.critChance', 0.07],
      ['statMods.critDamage', 0.5], ['statMods.physDodge', 0.03],
      ['statMods.magicDodge', 0.04], ['statMods.magicFind', 37],
      ['statMods.goldFind', 19], ['resistances.all', 5], ['resistances.fire', 10]
    ]) }]
  };
}

function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing equipment XP player');
  return current;
}

function equip(level = 1): Player {
  const fresh = createMockPlayer('Equipment XP', 'sorceress');
  usePlayerStore.getState().setPlayer({
    ...fresh, level, experienceToNextLevel: xpRequired(level),
    derivedStats: deriveStats(fresh.coreStats, level),
    // This legacy array is deliberately inconsistent with authoritative inventory.
    equipment: [{ ...helm(), id: 'stale-player-helm', affixes: [{
      affixId: 'stale-player-mods', values: new Map([['statMods.magicFind', 999]])
    }] }]
  });
  const gear = helm();
  useInventoryStore.getState().addItem(gear);
  expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  const equipped = player();
  expect(equipped.derivedStats).toMatchObject({
    lifeMax: 155 + (level - 1) * 8,
    manaMax: 128 + (level - 1) * 4,
    attack: 35 + (level - 1) * 2,
    defense: 33 + (level - 1) * 3,
    attackSpeed: 137, magicFind: 37, goldFind: 19,
    resistances: { fire: 15, cold: 5, lightning: 5, poison: 5, arcane: 5, physical: 5 }
  });
  usePlayerStore.getState().setPlayer({
    ...equipped, derivedStats: { ...equipped.derivedStats, life: 11, mana: 7 }
  });
  return player();
}

function expectStatsAtLevel(before: Player, targetLevel: number): void {
  const growth = targetLevel - before.level;
  expect(player().derivedStats).toEqual({
    ...before.derivedStats,
    lifeMax: before.derivedStats.lifeMax + growth * 8,
    manaMax: before.derivedStats.manaMax + growth * 4,
    attack: before.derivedStats.attack + growth * 2,
    defense: before.derivedStats.defense + growth * 3
  });
}

beforeEach(() => {
  usePlayerStore.getState().reset();
  useInventoryStore.getState().reset();
});

afterEach(() => {
  usePlayerStore.getState().reset();
  useInventoryStore.getState().reset();
});

describe('positive XP retains authoritative equipped stats (BUG-023)', () => {
  it.each([
    { amount: 1, level: 1, remainder: 1, statPoints: 0, skillPoints: 0 },
    { amount: 100, level: 2, remainder: 0, statPoints: 5, skillPoints: 1 },
    { amount: 700, level: 3, remainder: 35, statPoints: 10, skillPoints: 2 }
  ])('composes gear at level $level after awarding $amount XP', (award) => {
    const before = equip();
    const inventory = useInventoryStore.getState();
    const contents = structuredClone(inventory.equipped);
    const core = structuredClone(before.coreStats);
    const equippedItem = inventory.equipped.head;
    const equippedAffix = equippedItem?.affixes?.[0];
    const affixValues = equippedAffix && 'values' in equippedAffix ? equippedAffix.values : undefined;
    const published: (Player | null)[] = [];
    const unsubscribe = usePlayerStore.subscribe((state) => { published.push(state.player); });
    try {
      expect(usePlayerStore.getState().gainExperience(award.amount)).toEqual({
        levelsGained: award.level - 1, newLevel: award.level,
        statPointsGranted: award.statPoints, skillPointsGranted: award.skillPoints
      });
    } finally {
      unsubscribe();
    }

    expectStatsAtLevel(before, award.level);
    expect(player()).toMatchObject({
      level: award.level, experience: award.remainder,
      experienceToNextLevel: xpRequired(award.level),
      statPoints: before.statPoints + award.statPoints,
      skillPoints: before.skillPoints + award.skillPoints
    });
    expect(published).toEqual([player()]);
    expect(player().coreStats).toBe(before.coreStats);
    expect(player().coreStats).toEqual(core);
    expect(player().equipment).toBe(before.equipment);
    expect(player().skillLevels).toBe(before.skillLevels);
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(inventory.equipped).toEqual(contents);
    expect(inventory.equipped.head).toBe(equippedItem);
    const afterAffix = inventory.equipped.head?.affixes?.[0];
    expect(afterAffix && 'values' in afterAffix ? afterAffix.values : undefined).toBe(affixValues);
  });

  it('does not accumulate modifiers through repeated awards or recomputation', () => {
    const before = equip();
    for (let index = 0; index < 3; index++) {
      usePlayerStore.getState().gainExperience(1);
      expectStatsAtLevel(before, 1);
      usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
      expectStatsAtLevel(before, 1);
    }
    expect(player().experience).toBe(3);
  });

  it('keeps authoritative empty equipment after unequip despite stale player gear', () => {
    const before = equip();
    expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    const withoutGear = player();
    expect(withoutGear.derivedStats.magicFind).toBe(0);
    expect(withoutGear.derivedStats.goldFind).toBe(0);
    usePlayerStore.getState().gainExperience(100);

    expectStatsAtLevel(withoutGear, 2);
    expect(player().equipment).toBe(before.equipment);
    expect(useInventoryStore.getState().equipped).toEqual({ head: null });
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
  });

  it('retains gear at the level cap while preserving existing XP and point behavior', () => {
    const before = equip(90);
    const result = usePlayerStore.getState().gainExperience(10);
    expectStatsAtLevel(before, 90);
    expect(result).toEqual({ levelsGained: 0, newLevel: 90, statPointsGranted: 0, skillPointsGranted: 0 });
    expect(player()).toMatchObject({
      level: 90, experience: 10, experienceToNextLevel: 10,
      statPoints: before.statPoints, skillPoints: before.skillPoints
    });
  });

  it('clamps current resources to equipment-aware caps instead of healing or keeping excess', () => {
    const before = equip();
    usePlayerStore.getState().setPlayer({
      ...before, derivedStats: { ...before.derivedStats, life: 1_000, mana: 1_000 }
    });
    usePlayerStore.getState().gainExperience(100);
    expect(player().derivedStats).toMatchObject({ life: 163, lifeMax: 163, mana: 132, manaMax: 132 });
    expect(player().derivedStats.magicFind).toBe(37);
  });

  it('keeps the existing base derivation for a player with no authoritative equipment', () => {
    const fresh = createMockPlayer('No gear', 'sorceress');
    usePlayerStore.getState().setPlayer({
      ...fresh, derivedStats: { ...fresh.derivedStats, life: 1, mana: 2 }
    });
    usePlayerStore.getState().gainExperience(100);
    expect(player().derivedStats).toEqual({ ...deriveStats(fresh.coreStats, 2), life: 1, mana: 2 });
  });

  it.each([0, -1])('keeps a nonpositive XP award (%s) a reference-preserving no-op', (amount) => {
    equip();
    const before = usePlayerStore.getState();
    const inventory = useInventoryStore.getState();
    expect(before.gainExperience(amount)).toEqual({
      levelsGained: 0, newLevel: 1, statPointsGranted: 0, skillPointsGranted: 0
    });
    expect(usePlayerStore.getState()).toBe(before);
    expect(useInventoryStore.getState()).toBe(inventory);
  });

  it('keeps a positive XP award without a player a no-op', () => {
    const before = usePlayerStore.getState();
    const inventory = useInventoryStore.getState();
    expect(before.gainExperience(100)).toEqual({
      levelsGained: 0, newLevel: 1, statPointsGranted: 0, skillPointsGranted: 0
    });
    expect(usePlayerStore.getState()).toBe(before);
    expect(useInventoryStore.getState()).toBe(inventory);
  });
});

describe('player/inventory module entry order', () => {
  it.each(['player-first', 'inventory-first'] as const)('supports %s without an initialization cycle failure', async (order) => {
    vi.resetModules();
    if (order === 'player-first') await import('./playerStore');
    else await import('./inventoryStore');
    const { usePlayerStore: currentPlayers } = await import('./playerStore');
    const { useInventoryStore: currentInventory } = await import('./inventoryStore');
    try {
      currentPlayers.getState().setPlayer(createMockPlayer('Entry order', 'sorceress'));
      const gear = helm();
      currentInventory.getState().addItem(gear);
      expect(currentInventory.getState().equipItem(gear)).toEqual({ ok: true });
      currentPlayers.getState().gainExperience(1);
      expect(currentPlayers.getState().player?.derivedStats).toMatchObject({ magicFind: 37, goldFind: 19 });
    } finally {
      currentPlayers.getState().reset();
      currentInventory.getState().reset();
      vi.resetModules();
    }
  });
});
