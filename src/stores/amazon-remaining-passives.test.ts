import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, type BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { DamageType } from '@/engine/types/attributes';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const cases = [['avoid', 12, 0, 0.01, 0, 0], ['evade', 24, 0.005, 0.005, 0, 0],
  ['pierce', 30, 0, 0, 0.01, 0.02]] as const;
function hero(skillLevels: Record<string, number> = {}, level = 30) {
  const fresh = createMockPlayer('Remaining Amazon passive fixture', 'amazon');
  return { ...fresh, id: 'fixture-amazon-passives', level, skillLevels, comboOrder: [],
    derivedStats: { ...fresh.derivedStats, life: 31, mana: 17 } };
}
function project(player: ReturnType<typeof hero>) {
  return { ...playerToCombatUnit(player), skillLevels: {} };
}
function reset() {
  for (const store of [useInventoryStore, useMapStore, useFormationStore]) store.getState().reset();
}
beforeEach(reset); afterEach(reset);

describe('Avoid, Evade and Pierce fresh player composition', () => {
  it.each(cases)('%s applies only its authored stats at rank one and twenty', (key, _unlock, physical, magic, attack, damage) => {
    const plain = project(hero());
    for (const rank of [1, 20]) {
      const learned = project(hero({ ['amazon.' + key]: rank }));
      expect.soft(learned.stats.physDodge).toBeCloseTo(plain.stats.physDodge + rank * physical, 12);
      expect.soft(learned.stats.magicDodge).toBeCloseTo(plain.stats.magicDodge + rank * magic, 12);
      expect.soft(learned.stats.attack).toBeCloseTo(plain.stats.attack * (1 + rank * attack), 12);
      expect.soft(learned.increasedDamagePct?.physical ?? 0).toBeCloseTo(rank * damage, 12);
      expect({ ...learned.stats, physDodge: plain.stats.physDodge, magicDodge: plain.stats.magicDodge,
        attack: plain.stats.attack }).toEqual(plain.stats);
      expect(learned.increasedDamagePct?.fire ?? 0).toBe(plain.increasedDamagePct?.fire ?? 0);
      expect([learned.life, learned.mana]).toEqual([31, 17]);
      expect(project(hero({ ['amazon.' + key]: rank }))).toEqual(learned);
    }
  });

  it.each(cases)('%s respects aliases, cap, unlock and class without changing saved inputs', (key, unlock) => {
    const learned = hero({ ['amazon.' + key]: 20 });
    const before = structuredClone(learned), expected = project(learned);
    expect(project(hero({ ['amazon.' + key]: 99, ['skills-amazon-' + key]: 1 }))).toEqual(expected);
    expect(project(hero({ ['skills-amazon-' + key]: 20 }))).toEqual(expected);
    for (const rank of [0, -1, 1.5, NaN, Infinity]) {
      expect(project(hero({ ['amazon.' + key]: rank }))).toEqual(project(hero()));
    }
    for (const level of [unlock - 1, NaN, Infinity]) {
      expect(project(hero({ ['amazon.' + key]: 20 }, level))).toEqual(project(hero({}, level)));
    }
    expect.soft(project(hero({ ['amazon.' + key]: 1 }, unlock))).not.toEqual(project(hero({}, unlock)));
    expect(project(hero({ ['amazon.' + key + '-lookalike']: 20 }))).toEqual(project(hero()));
    for (const classId of ['barbarian', 'sorceress', 'necromancer', 'paladin', 'druid', 'assassin'] as const) {
      expect(project({ ...learned, class: classId })).toEqual(project({ ...learned, class: classId, skillLevels: {} }));
    }
    expect(learned).toEqual(before);
  });

  it('adds Pierce and Penetrate Attack over fresh equipment and removes bonuses without accumulation', () => {
    useInventoryStore.setState({ equipped: { head: { id: 'fixture-amazon-remaining-cap',
      baseId: 'items/base/helm-cap', rarity: 'rare', level: 1, identified: true, equipped: true,
      affixes: [{ affixId: 'fixture-imported', values: new Map([['statMods.attack', 13]]) }] } } });
    const plain = project(hero()), learned = hero({ 'amazon.penetrate': 20, 'amazon.pierce': 20 });
    expect.soft(project(learned).stats.attack).toBeCloseTo(plain.stats.attack * 1.8, 12);
    const first = project(learned); expect(project(learned)).toEqual(first);
    useInventoryStore.getState().reset();
    expect.soft(project(learned).stats.attack).toBeCloseTo(project(hero()).stats.attack * 1.8, 12);
    expect(project({ ...learned, skillLevels: {} })).toEqual(project(hero()));
  });
});

describe('real direct-hit consumers for the remaining Amazon passives', () => {
  function firstHit(levels: Record<string, number>, seed: number, type: DamageType, defending = false) {
    const native = playerToCombatUnit(hero(levels));
    const source: CombatUnit = { ...native, life: 100000, mana: 0,
      stats: { ...native.stats, life: 100000, lifeMax: 100000, critChance: 0 },
      basicAttack: { damage: [100, 100], damageType: type } };
    const target: CombatUnit = { ...source, id: 'fixture-amazon-remaining-target', side: 'enemy', kind: 'monster',
      skillLevels: {}, skillOrder: [], increasedDamagePct: {},
      stats: { ...source.stats, attackSpeed: 1, physDodge: 0, magicDodge: 0, defense: 0, magicResist: 0,
        resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
    const result = runBattle({ seed, playerTeam: [source], enemyTeam: [target], maxRounds: 2 });
    const event = result.events.find((event): event is Extract<BattleEvent, { kind: 'damage' }> =>
      event.kind === 'damage' && event.source === (defending ? target.id : source.id));
    if (!event) throw new Error('Missing actual direct hit');
    expect(result.events.filter(event => event.kind === 'action').every(event => event.skillId === null)).toBe(true);
    return event;
  }
  it('Pierce increases fixed physical bases while leaving fixed elemental bases unchanged', () => {
    expect.soft(firstHit({ 'amazon.pierce': 20 }, 1, 'physical').amount).toBe(140);
    expect(firstHit({}, 1, 'physical').amount).toBe(100);
    for (const type of ['fire', 'cold', 'lightning', 'poison', 'arcane'] as const) {
      expect(firstHit({ 'amazon.pierce': 20 }, 1, type)).toEqual(firstHit({}, 1, type));
    }
  });
  it.each(['avoid', 'evade'] as const)('%s causes additional magical misses over fixed seeds', key => {
    const seeds = Array.from({ length: 64 }, (_, index) => index + 1);
    const misses = (levels: Record<string, number>, type: DamageType) =>
      seeds.filter(seed => firstHit(levels, seed, type, true).dodged).length;
    expect.soft(misses({ ['amazon.' + key]: 20 }, 'cold')).toBeGreaterThan(misses({}, 'cold'));
    if (key === 'evade') expect.soft(misses({ 'amazon.evade': 20 }, 'physical')).toBeGreaterThan(misses({}, 'physical'));
    else for (const seed of seeds) expect(firstHit({ 'amazon.avoid': 20 }, seed, 'physical', true)).toEqual(firstHit({}, seed, 'physical', true));
    expect(firstHit({ ['amazon.' + key]: 20 }, 7, 'cold', true)).toEqual(firstHit({ ['amazon.' + key]: 20 }, 7, 'cold', true));
  });
});
