import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, type BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';

function hero(fields: Partial<Player> = {}): Player {
  const fresh = createMockPlayer('Barbarian passive fixture', 'barbarian');
  return { ...fresh, level: 30, skillLevels: {}, comboOrder: [],
    derivedStats: { ...fresh.derivedStats, life: 31, mana: 17 }, ...fields };
}
const reset = () => {
  useInventoryStore.getState().reset(); useFormationStore.getState().reset();
  useMapStore.getState().reset();
};
beforeEach(reset); afterEach(reset);

describe('Barbarian endurance passives at the native hero boundary', () => {
  it.each([1, 20])('Increased Stamina rank%s increases fresh combat max life without healing', rank => {
    const plain = playerToCombatUnit(hero());
    const learned = playerToCombatUnit(hero({ skillLevels: { 'barbarian.increased_stamina': rank } }));
    expect(learned.stats.lifeMax).toBeCloseTo(plain.stats.lifeMax * (1 + rank * 0.03), 12);
    expect({ ...learned.stats, lifeMax: plain.stats.lifeMax }).toEqual(plain.stats);
    expect([learned.life, learned.mana]).toEqual([31, 17]);
  });

  it.each([1, 20])('Increased Speed rank%s changes attack cadence and physical dodge only', rank => {
    const plain = playerToCombatUnit(hero());
    const learned = playerToCombatUnit(hero({ skillLevels: { 'skills-barbarian-increased-speed': rank } }));
    expect.soft(learned.stats.attackSpeed).toBeCloseTo(plain.stats.attackSpeed * (1 + rank * 0.01), 12);
    expect.soft(learned.stats.physDodge).toBeCloseTo(plain.stats.physDodge + rank * 0.005, 12);
    expect({ ...learned.stats, attackSpeed: plain.stats.attackSpeed, physDodge: plain.stats.physDodge }).toEqual(plain.stats);
  });

  it.each([1, 20])('Natural Resistance rank%s adds points to all six resists and magic dodge', rank => {
    const plain = playerToCombatUnit(hero());
    const learned = playerToCombatUnit(hero({ skillLevels: { 'barbarian.natural_resistance': rank } }));
    for (const type of ['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison'] as const) {
      expect.soft(learned.stats.resistances[type]).toBeCloseTo(plain.stats.resistances[type] + rank * 2, 12);
    }
    expect.soft(learned.stats.magicDodge).toBeCloseTo(plain.stats.magicDodge + rank * 0.005, 12);
    expect({ ...learned.stats, resistances: plain.stats.resistances, magicDodge: plain.stats.magicDodge }).toEqual(plain.stats);
  });

  it.each(['sorceress', 'amazon', 'paladin', 'necromancer', 'druid', 'assassin'] as const)(
    'does not grant Barbarian endurance passives to %s', classId => {
      const player = hero({ class: classId });
      expect(playerToCombatUnit({ ...player, skillLevels: { 'barbarian.increased_stamina': 20,
        'barbarian.increased_speed': 20, 'barbarian.natural_resistance': 20 } }).stats)
        .toEqual(playerToCombatUnit(player).stats);
    });

  it('uses equipment-derived maxima once, and removes bonuses without mutating persisted inputs', () => {
    const player = hero({ skillLevels: { 'barbarian.increased_stamina': 20 } });
    const cap: Item = { id: 'fixture-stamina-cap', baseId: 'items/base/helm-cap',
      rarity: 'rare', level: 1, identified: true, equipped: true,
      affixes: [{ affixId: 'fixture-imported', values: new Map([['statMods.life', 100]]) }] };
    useInventoryStore.setState({ equipped: { head: cap } });
    const before = structuredClone({ player, cap });
    const plain = playerToCombatUnit({ ...player, skillLevels: {} });
    const learned = playerToCombatUnit(player);
    expect(learned.stats.lifeMax).toBeCloseTo(plain.stats.lifeMax * 1.6, 12);
    expect(playerToCombatUnit(player)).toEqual(learned);
    expect(playerToCombatUnit({ ...player, skillLevels: {} })).toEqual(plain);
    useInventoryStore.setState({ equipped: {} });
    expect(learned.stats.lifeMax - playerToCombatUnit(player).stats.lifeMax).toBeCloseTo(160, 12);
    expect({ player, cap }).toEqual(before);
  });
});

describe('Barbarian endurance passives reach actual battle consumers', () => {
  function battle(skillLevels: Record<string, number>, seed: number, elemental = false) {
    const native = playerToCombatUnit(hero({ skillLevels }));
    const attacker: CombatUnit = { ...native, life: 10000,
      stats: { ...native.stats, life: 10000, lifeMax: 10000, attack: 1, critChance: 0 } };
    const dummy: CombatUnit = { ...attacker, id: 'fixture-endurance-dummy', side: 'enemy', kind: 'monster',
      stats: { ...attacker.stats, attack: 100, attackSpeed: 110, critChance: 0, defense: 0,
        physDodge: 0, magicDodge: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
      skillLevels: {}, skillOrder: [],
      basicAttack: { damage: [100, 100], damageType: elemental ? 'cold' : 'physical' } };
    return runBattle({ seed, playerTeam: [attacker], enemyTeam: [dummy], maxRounds: 20 });
  }

  it('Increased Speed increases actual action count without introducing passive casts', () => {
    const plain = battle({}, 1), learned = battle({ 'barbarian.increased_speed': 20 }, 1);
    const count = (result: ReturnType<typeof battle>) => result.events.filter(event =>
      event.kind === 'action' && event.actor !== 'fixture-endurance-dummy').length;
    expect(count(learned)).toBeGreaterThan(count(plain));
    expect(learned.events.filter(event => event.kind === 'action').every(event => event.skillId === null)).toBe(true);
  });

  it('Natural Resistance reduces landed cold damage and adds actual magical dodges for paired seeds', () => {
    const firstEnemyHit = (levels: Record<string, number>, seed: number) => {
      const result = battle(levels, seed, true);
      const hit = result.events.find((event): event is Extract<BattleEvent, { kind: 'damage' }> =>
        event.kind === 'damage' && event.source === 'fixture-endurance-dummy');
      if (!hit) throw new Error('Missing enemy cold hit');
      return hit;
    };
    const samples = Array.from({ length: 64 }, (_, index) => index + 1);
    let additionalDodges = 0, mitigatedHits = 0;
    for (const seed of samples) {
      const plain = firstEnemyHit({}, seed), learned = firstEnemyHit({ 'barbarian.natural_resistance': 20 }, seed);
      if (!plain.dodged && learned.dodged) additionalDodges++;
      if (!plain.dodged && !learned.dodged) {
        expect(learned.amount).toBeLessThan(plain.amount); mitigatedHits++;
      }
    }
    expect(additionalDodges).toBeGreaterThan(0);
    expect(mitigatedHits).toBeGreaterThan(0);
  });
});
