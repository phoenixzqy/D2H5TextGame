import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, type BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const cases = [
  ['pole_arm', 'items/base/wp2h-war-pike', 0.03, 0.005, 0],
  ['spear', 'items/base/weapon-spear', 0.03, 0.005, 0],
  ['throwing', 'items/base/weapon-throwing-knife', 0.025, 0, 0.01],
] as const;
const allRanks = Object.fromEntries(['sword', 'axe', 'mace', 'pole_arm', 'spear', 'throwing']
  .map(key => ['barbarian.' + key + '_mastery', 20]));
function reset() {
  for (const store of [useInventoryStore, useMapStore, useFormationStore]) store.getState().reset();
}
function hero(skillLevels: Record<string, number> = {}, level = 30) {
  return { ...createMockPlayer('Remaining mastery functional fixture', 'barbarian'),
    id: 'fixture-remaining-mastery-hero', level, skillLevels, comboOrder: [] };
}
function equip(baseId: string) {
  useInventoryStore.setState({ equipped: { weapon: { id: 'fixture-remaining-mastery-weapon', baseId,
    rarity: 'normal', level: 1, socketCapacity: 0, identified: true, equipped: true, affixes: [] } } });
}
function project(player: ReturnType<typeof hero>) {
  return { ...playerToCombatUnit(player), skillLevels: {} };
}
beforeEach(reset); afterEach(reset);

describe('remaining Barbarian masteries reach fresh canonical composition', () => {
  it.each(cases)('applies %s at ranks one/twenty and never stacks other masteries', (key, base, damage, critical, speed) => {
    equip(base);
    const plain = project(hero());
    for (const rank of [1, 20]) {
      const learned = project(hero({ ['barbarian.' + key + '_mastery']: rank }));
      expect.soft(learned.increasedDamagePct?.physical).toBeCloseTo(rank * damage, 12);
      expect.soft(learned.stats.critChance).toBeCloseTo(plain.stats.critChance + rank * critical, 12);
      expect.soft(learned.stats.attackSpeed).toBeCloseTo(plain.stats.attackSpeed * (1 + rank * speed), 12);
      expect({ ...learned.stats, critChance: plain.stats.critChance, attackSpeed: plain.stats.attackSpeed }).toEqual(plain.stats);
      expect([learned.life, learned.mana]).toEqual([plain.life, plain.mana]);
      expect(project(hero({ ['barbarian.' + key + '_mastery']: rank }))).toEqual(learned);
    }
    expect(project(hero(allRanks))).toEqual(project(hero({ ['barbarian.' + key + '_mastery']: 20 })));
  });

  it.each(cases)('respects exact %s aliases, cap, level-six gate and weapon-only eligibility', (key, base) => {
    equip(base);
    const canonical = 'barbarian.' + key + '_mastery', authored = 'skills-barbarian-' + key.replaceAll('_', '-') + '-mastery';
    const expected = project(hero({ [canonical]: 20 }));
    expect.soft(expected.increasedDamagePct?.physical).toBeGreaterThan(0);
    expect(project(hero({ [canonical]: 99, [authored]: 3 }))).toEqual(expected);
    expect(project(hero({ [authored]: 20 }))).toEqual(expected);
    for (const level of [1, 5, NaN, Infinity]) expect(project(hero({ [canonical]: 20 }, level))).toEqual(project(hero({}, level)));
    expect.soft(project(hero({ [canonical]: 1 }, 6)).increasedDamagePct?.physical).toBeGreaterThan(0);
    for (const rank of [0, -1, 1.5, NaN, Infinity]) expect(project(hero({ [canonical]: rank }))).toEqual(project(hero()));
    expect(project(hero({ [canonical + '-lookalike']: 20 }))).toEqual(project(hero()));
    const wrongClass = { ...hero({ [canonical]: 20 }), class: 'amazon' as const };
    expect(project(wrongClass)).toEqual(project({ ...wrongClass, skillLevels: {} }));
    for (const id of ['items/base/wp1h-short-sword', 'unknown-' + key]) {
      equip(id); expect(project(hero({ [canonical]: 20 }))).toEqual(project(hero()));
    }
    const offhand = useInventoryStore.getState().equipped.weapon ?? null;
    useInventoryStore.setState({ equipped: { offhand } });
    expect(project(hero(allRanks))).toEqual(project(hero()));
  });

  it('keeps Polearm and Spear identity separate despite War Pike naming', () => {
    equip('items/base/wp2h-war-pike');
    expect(project(hero({ 'barbarian.spear_mastery': 20 }))).toEqual(project(hero()));
    equip('items/base/weapon-spear');
    expect(project(hero({ 'barbarian.pole_arm_mastery': 20 }))).toEqual(project(hero()));
  });
});

describe('remaining mastery direct-hit and cadence consumers', () => {
  function battle(key: string, base: string, rank: number, seed: number, crit = false) {
    equip(base);
    const native = playerToCombatUnit(hero({ ['barbarian.' + key + '_mastery']: rank }));
    const source: CombatUnit = { ...native, life: 100000, mana: 0,
      stats: { ...native.stats, lifeMax: 100000, life: 100000,
        critChance: crit ? native.stats.critChance : 0 },
      basicAttack: { damage: [100, 100], damageType: 'physical' } };
    const target: CombatUnit = { ...source, id: 'fixture-target', name: 'fixture-target', side: 'enemy', kind: 'monster',
      increasedDamagePct: {}, stats: { ...source.stats, attackSpeed: 1, critChance: 0,
        physDodge: 0, defense: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
      basicAttack: { damage: [0, 0], damageType: 'physical' } };
    return runBattle({ seed, playerTeam: [source], enemyTeam: [target] }).events.filter(
      (event): event is Extract<BattleEvent, { kind: 'damage' }> =>
        event.kind === 'damage' && event.source === source.id);
  }
  it.each(cases)('%s changes real physical hits and retains deterministic recordings', (key, base, damage, critical) => {
    let gainedCritical = false;
    for (let seed = 1; seed <= 32; seed++) {
      const plain = battle(key, base, 0, seed), learned = battle(key, base, 20, seed);
      expect(plain.length).toBeGreaterThan(0); expect(learned.length).toBeGreaterThan(0);
      expect.soft(learned[0]?.amount).toBeCloseTo((plain[0]?.amount ?? 0) * (1 + 20 * damage), 8);
      expect(battle(key, base, 20, seed)).toEqual(learned);
      if (critical > 0) {
        const original = battle(key, base, 0, seed, true)[0], enhanced = battle(key, base, 20, seed, true)[0];
        if (!original?.crit && enhanced?.crit) gainedCritical = true;
      }
    }
    if (critical > 0) expect(gainedCritical).toBe(true);
  });
  it('Throwing increases actual attack count and multiplies with Increased Speed', () => {
    const plain = battle('throwing', cases[2][1], 0, 7), learned = battle('throwing', cases[2][1], 20, 7);
    expect.soft(learned.length).toBeGreaterThan(plain.length);
    equip(cases[2][1]);
    const speed = project(hero({ 'barbarian.increased_speed': 20 }));
    const both = project(hero({ 'barbarian.increased_speed': 20, 'barbarian.throwing_mastery': 20 }));
    expect.soft(both.stats.attackSpeed).toBeCloseTo(speed.stats.attackSpeed * 1.2, 12);
    expect(both.stats.critChance).toBe(speed.stats.critChance);
  });
});
