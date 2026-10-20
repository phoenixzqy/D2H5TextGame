import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer, CHARACTER_CLASSES } from '@/features/character/createMockPlayer';
import { deriveStats } from '@/engine/progression/stats';
import type { CoreStats } from '@/engine/types/attributes';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';

function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing allocation fixture');
  return current;
}

function arrange(extra: Partial<Player> = {}): Player {
  const fresh = createMockPlayer('Allocation', 'sorceress');
  usePlayerStore.getState().setPlayer({
    ...fresh, level: 4, experience: 1417, experienceToNextLevel: 3200,
    statPoints: 15, equipment: [],
    derivedStats: { ...deriveStats(fresh.coreStats, 4), life: 120, mana: 102 },
    ...extra
  });
  return player();
}

function equip(): Player {
  const current = arrange();
  const helm: Item = {
    id: 'allocation-helm', baseId: 'items/base/helm-cap', rarity: 'magic',
    level: 1, identified: true, equipped: false, baseRolls: { defense: 13 },
    affixes: [{ affixId: 'controlled-allocation-mods', values: new Map([
      ['coreStats.strength', 4], ['coreStats.dexterity', 3],
      ['coreStats.vitality', 5], ['coreStats.energy', 6],
      ['statMods.life', 25], ['statMods.mana', 17], ['statMods.attack', 11],
      ['statMods.attackSpeed', 9], ['statMods.critChance', 0.07],
      ['statMods.critDamage', 0.5], ['statMods.physDodge', 0.03],
      ['statMods.magicDodge', 0.04], ['statMods.magicFind', 37],
      ['statMods.goldFind', 19], ['resistances.all', 5], ['resistances.fire', 10]
    ]) }]
  };
  usePlayerStore.getState().setPlayer({ ...current, equipment: [{
    ...helm, id: 'legacy-decoy', affixes: [{ affixId: 'stale',
      values: new Map([['statMods.magicFind', 999]]) }]
  }] });
  useInventoryStore.getState().addItem(helm);
  expect(useInventoryStore.getState().equipItem(helm)).toEqual({ ok: true });
  return player();
}

beforeEach(() => {
  useInventoryStore.getState().reset();
  usePlayerStore.getState().reset();
});
afterEach(() => {
  useInventoryStore.getState().reset();
  usePlayerStore.getState().reset();
});

describe('coherent one-point attribute allocation (BUG-045)', () => {
  it.each([
    ['strength', 11, { attack: 28, attackSpeed: 125, lifeMax: 144, manaMax: 114, physDodge: 0.1 }],
    ['dexterity', 26, { attack: 29, attackSpeed: 126, lifeMax: 144, manaMax: 114, physDodge: 0.102 }],
    ['vitality', 11, { attack: 28, attackSpeed: 125, lifeMax: 146, manaMax: 114, physDodge: 0.1 }],
    ['energy', 36, { attack: 28, attackSpeed: 125, lifeMax: 144, manaMax: 116, physDodge: 0.1 }]
  ] as const)('spends only %s and publishes its complete L4 Sorceress stats once', (stat, value, expected) => {
    const before = arrange();
    const inventory = useInventoryStore.getState();
    const published: (Player | null)[] = [];
    const stop = usePlayerStore.subscribe(state => { published.push(structuredClone(state.player)); });
    const allocate: (stat: keyof CoreStats) => unknown = usePlayerStore.getState().allocateStatPoint;
    try { expect(allocate(stat)).toBeUndefined(); }
    finally { stop(); }
    const physDodge: unknown = expect.closeTo(expected.physDodge, 12);
    const derived = { ...before.derivedStats, ...expected, physDodge };
    expect(player()).toEqual({
      ...before, statPoints: 14, coreStats: { ...before.coreStats, [stat]: value },
      derivedStats: derived
    });
    expect(published).toEqual([player()]);
    expect(published[0]?.derivedStats).toEqual(derived);
    expect(useInventoryStore.getState()).toBe(inventory);
  });

  it.each([0, -1, 0.5])('refuses an insufficient balance %s without publication', points => {
    arrange({ statPoints: points });
    const before = usePlayerStore.getState();
    const published: unknown[] = [];
    const stop = usePlayerStore.subscribe(state => { published.push(state); });
    try { before.allocateStatPoint('energy'); } finally { stop(); }
    expect(usePlayerStore.getState()).toBe(before);
    expect(published).toEqual([]);
  });

  it('keeps allocation without a player an identical no-publication no-op', () => {
    const before = usePlayerStore.getState();
    const published: unknown[] = [];
    const stop = usePlayerStore.subscribe(state => { published.push(state); });
    try { before.allocateStatPoint('energy'); } finally { stop(); }
    expect(usePlayerStore.getState()).toBe(before);
    expect(published).toEqual([]);
  });

  it.each(['strength', 'dexterity', 'vitality', 'energy'] as const)(
    'refuses prospective %s beyond500 while preserving accepted legacy values', stat => {
      for (const value of [499.5, 500, 501]) {
        const fresh = arrange();
        arrange({ coreStats: { ...fresh.coreStats, [stat]: value } });
        const before = usePlayerStore.getState();
        const published: unknown[] = [];
        const stop = usePlayerStore.subscribe(state => { published.push(state); });
        try { before.allocateStatPoint(stat); } finally { stop(); }
        expect.soft(usePlayerStore.getState()).toBe(before);
        expect.soft(published).toEqual([]);
      }
    }
  );

  it('uses current authoritative gear once through repeated allocations, preserving all other data', () => {
    const before = equip();
    const inventory = useInventoryStore.getState();
    const contents = structuredClone(inventory.equipped);
    expect(before.derivedStats).toMatchObject({ lifeMax: 179, manaMax: 140, attack: 41, defense: 42 });
    for (let index = 1; index <= 3; index++) {
      usePlayerStore.getState().allocateStatPoint('vitality');
      expect(player()).toEqual({ ...before, statPoints: 15 - index,
        coreStats: { ...before.coreStats, vitality: 10 + index },
        derivedStats: { ...before.derivedStats, lifeMax: 179 + 2 * index } });
    }
    expect(player().derivedStats).toMatchObject({ life: 120, mana: 102, manaMax: 140,
      attackSpeed: 137, magicFind: 37, goldFind: 19, critDamage: 2.5,
      resistances: { fire: 15, cold: 5, lightning: 5, poison: 5, arcane: 5, physical: 5 } });
    expect(player().equipment).toBe(before.equipment);
    expect(player().skillLevels).toBe(before.skillLevels);
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(inventory.equipped).toEqual(contents);
  });

  it.each(CHARACTER_CLASSES)('recomposes %s vitality with its actual class baseline', cls => {
    const maxima = { barbarian: 152, sorceress: 122, necromancer: 132,
      paladin: 152, amazon: 142, druid: 152, assassin: 142 };
    const fresh = createMockPlayer('Class allocation', cls);
    usePlayerStore.getState().setPlayer({ ...fresh, statPoints: 1 });
    usePlayerStore.getState().allocateStatPoint('vitality');
    expect(player()).toEqual({ ...fresh, statPoints: 0,
      coreStats: { ...fresh.coreStats, vitality: fresh.coreStats.vitality + 1 },
      derivedStats: { ...fresh.derivedStats, lifeMax: maxima[cls] } });
  });

  it.each(['strength', 'dexterity', 'vitality', 'energy'] as const)(
    'permits base %s499→500 even with gear bonuses beyond500', stat => {
      const before = equip();
      usePlayerStore.getState().setPlayer({ ...before, statPoints: 1,
        coreStats: { ...before.coreStats, [stat]: 499 } });
      usePlayerStore.getState().allocateStatPoint(stat);
      expect(player().coreStats).toEqual({ ...before.coreStats, [stat]: 500 });
      expect(player().statPoints).toBe(0);
      const capped = player();
      usePlayerStore.getState().allocateStatPoint(stat);
      expect(player()).toBe(capped);
      expect(useInventoryStore.getState().equipped.head?.id).toBe('allocation-helm');
    }
  );

  it('preserves the half-point remainder of an accepted fractional balance', () => {
    arrange({ statPoints: 1.5 });
    usePlayerStore.getState().allocateStatPoint('energy');
    expect(player()).toMatchObject({ statPoints: 0.5, coreStats: { energy: 36 },
      derivedStats: { manaMax: 116, mana: 102 } });
  });

  it('preserves accepted fractional base values below the prospective cap', () => {
    const before = arrange();
    usePlayerStore.getState().setPlayer({ ...before,
      coreStats: { ...before.coreStats, vitality: 498.5 } });
    usePlayerStore.getState().allocateStatPoint('vitality');
    expect(player()).toMatchObject({ statPoints: 14, coreStats: { vitality: 499.5 },
      derivedStats: { lifeMax: 823, life: 120 } });
  });

  it('rebuilds a stale full cache coherently before the single subscriber publication', () => {
    const before = equip();
    usePlayerStore.getState().setPlayer({ ...before, derivedStats: {
      ...before.derivedStats, lifeMax: 999, manaMax: 999, attack: 999,
      defense: 999, attackSpeed: 999, magicFind: 999,
      life: 11, mana: 7
    } });
    const published: (Player | null)[] = [];
    const stop = usePlayerStore.subscribe(state => { published.push(structuredClone(state.player)); });
    try { usePlayerStore.getState().allocateStatPoint('energy'); } finally { stop(); }
    const expected = { ...before, statPoints: 14, coreStats: { ...before.coreStats, energy: 36 },
      derivedStats: { ...before.derivedStats, life: 11, mana: 7, manaMax: 142 } };
    expect(player()).toEqual(expected);
    expect(published).toEqual([expected]);
  });

  it('retains authoritative empty gear despite legacy player equipment', () => {
    const before = equip();
    expect(useInventoryStore.getState().unequipItem('head')).toEqual({ ok: true });
    usePlayerStore.getState().allocateStatPoint('vitality');
    expect(player().equipment).toBe(before.equipment);
    expect(player().derivedStats).toEqual({ life: 120, lifeMax: 146,
      mana: 102, manaMax: 114, attack: 28, defense: 29, attackSpeed: 125,
      critChance: 0.05, critDamage: 2, physDodge: 0.1, magicDodge: 0.05,
      magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } });
  });

  it('retains existing softcap200→201 behavior without healing', () => {
    const before = arrange();
    usePlayerStore.getState().setPlayer({ ...before, coreStats: { ...before.coreStats, vitality: 200 },
      derivedStats: { ...before.derivedStats, lifeMax: 524 } });
    usePlayerStore.getState().allocateStatPoint('vitality');
    expect(player()).toMatchObject({ coreStats: { vitality: 201 }, derivedStats: { lifeMax: 525, life: 120 } });
  });

  it.each([0, 1_000])('preserves depleted pools or clamps excessive current pools (%s)', amount => {
    const before = arrange();
    usePlayerStore.getState().setPlayer({ ...before,
      derivedStats: { ...before.derivedStats, life: amount, mana: amount } });
    usePlayerStore.getState().allocateStatPoint('energy');
    expect(player().derivedStats).toMatchObject({ lifeMax: 144, manaMax: 116,
      life: amount === 0 ? 0 : 144, mana: amount === 0 ? 0 : 116 });
  });
});
