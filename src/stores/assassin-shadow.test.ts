import { beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { runBattleRecorded } from '@/engine/combat/combat';
import { resolveDamage } from '@/engine/combat/damage';
import { createRng } from '@/engine/rng';
import { socketRunewords } from '@/data/loaders/socket-effects';
import type { Item } from '@/engine/types/items';
import type { CombatUnit } from '@/engine/combat/types';

beforeEach(() => {
  useInventoryStore.getState().reset();
  usePlayerStore.getState().reset();
});
const learned = { 'assassin.burst_of_speed': 1, 'assassin.fade': 1, 'assassin.venom': 1 };
function owner(skillLevels: Record<string, number> = {}) {
  return {
    ...createMockPlayer('Constructed shadow fixture', 'assassin'),
    level: 30,
    comboOrder: [],
    skillLevels
  };
}
it('applies learned Fade resistance points and magical dodge from fresh player composition', () => {
  const plain = playerToCombatUnit(owner()),
    actual = playerToCombatUnit(owner(learned));
  for (const type of ['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane'] as const) {
    expect.soft(actual.stats.resistances[type]).toBe(plain.stats.resistances[type] + 2);
  }
  expect.soft(actual.stats.magicDodge).toBeCloseTo(plain.stats.magicDodge + 0.005, 12);
});
it('applies authored Venom poison increase without adding passive casts or resource refill', () => {
  const plain = playerToCombatUnit(owner()),
    actual = playerToCombatUnit(owner(learned));
  expect(actual.increasedDamagePct?.poison).toBeCloseTo(0.03, 12);
  expect(actual.skillOrder).toEqual(plain.skillOrder);
  expect([actual.life, actual.mana]).toEqual([plain.life, plain.mana]);
});
it('produces actual poison from eligible basic hits instead of a marker-only passive', () => {
  const native = playerToCombatUnit(owner(learned));
  const hero: CombatUnit = {
    ...native,
    life: 10000,
    mana: 10000,
    stats: {
      ...native.stats,
      attack: 100,
      defense: 0,
      lifeMax: 10000,
      attackSpeed: 100,
      critChance: 0
    }
  };
  const enemy: CombatUnit = {
    ...hero,
    id: 'poison-target',
    side: 'enemy',
    kind: 'monster',
    skillOrder: [],
    stats: {
      ...hero.stats,
      defense: 0,
      physDodge: 0,
      magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    },
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }]
  };
  const snapshot = {
    seed: 7,
    playerTeam: [hero],
    enemyTeam: [enemy],
    maxRounds: 2,
    assassinVenom: { sourceHeroId: hero.id, rank: 1 }
  };
  const result = runBattleRecorded(snapshot);
  expect(
    result.events.some(
      (e) => e.kind === 'status' && e.statusId === 'poison' && e.target === enemy.id
    )
  ).toBe(true);
});

it.each(['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane'] as const)(
  'Fade reduces actual incoming %s damage through its resistance points',
  (type) => {
    const plain = playerToCombatUnit(owner()),
      fade = playerToCombatUnit(owner(learned));
    const hit = (target: CombatUnit) =>
      resolveDamage(
        {
          baseMin: 1000,
          baseMax: 1000,
          flatBonus: 0,
          increasedPct: 0,
          comboMult: 1,
          type,
          critChance: 0,
          critMult: 2,
          defenderResistances: target.stats.resistances,
          defenderArmor: target.stats.defense,
          defenderMagicResist: target.stats.magicResist,
          defenderDodge: 0,
          ignoreDodge: true
        },
        createRng(7)
      );
    expect(hit(fade).final).toBe(hit(plain).final - 20);
  }
);
function word(id: string, base: string): Item {
  const row = socketRunewords.find((w) => w.id === 'runewords/' + id);
  if (!row) throw new Error('Missing actual runeword');
  return {
    id: 'owned-' + id,
    baseId: 'items/base/' + base,
    rarity: 'runeword',
    level: 70,
    identified: true,
    equipped: false,
    runewordId: row.id,
    socketCapacity: row.sockets,
    socketContents: row.runes.map((id) => ({ kind: 'rune', id }))
  };
}
it('adds learned Fade over genuine Last Wish grants exactly once without persistent stat drift or healing', () => {
  useInventoryStore.setState({ equipped: { weapon: word('last-wish', 'wp1h-legend-sword') } });
  const player = { ...owner(learned), level: 70 },
    before = structuredClone(player);
  const bare = playerToCombatUnit({ ...player, skillLevels: {} }),
    actual = playerToCombatUnit(player);
  for (const type of ['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane'] as const) {
    expect(actual.stats.resistances[type]).toBe(bare.stats.resistances[type] + 2);
  }
  expect(actual.stats.magicDodge).toBeCloseTo(bare.stats.magicDodge + 0.005, 12);
  expect([actual.life, actual.mana]).toEqual([bare.life, bare.mana]);
  expect(playerToCombatUnit(player)).toEqual(actual);
  expect(player).toEqual(before);
});
it('adds Venom to the existing equipped poison damage bucket without multiplying grants', () => {
  useInventoryStore.setState({ equipped: { weapon: word('infinity', 'wp2h-giant-thresher') } });
  const result = playerToCombatUnit({ ...owner({ 'assassin.venom': 20 }), level: 70 });
  expect(result.increasedDamagePct?.poison).toBeCloseTo(0.7, 12);
  expect(result.increasedDamagePct?.fire).toBe(0.1);
});
