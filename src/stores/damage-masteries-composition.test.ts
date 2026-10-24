import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { runBattle } from '@/engine/combat/combat';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';

const cases = [
  { classId: 'necromancer', authored: 'skills-necromancer-poison-mastery', canonical: 'necromancer.poison_mastery',
    damage: { poison: 0.04, arcane: 0.02 }, dodge: 0 },
  { classId: 'druid', authored: 'skills-druid-elemental-mastery', canonical: 'druid.elemental_mastery',
    damage: { fire: 0.03, cold: 0.03 }, dodge: 0.005 },
] as const;
function hero(classId: Parameters<typeof createMockPlayer>[1], skillLevels: Record<string, number> = {}, level = 30): Player {
  const fresh = createMockPlayer('Constructed mastery boundary fixture', classId);
  return { ...fresh, id: 'fixture-damage-mastery-hero', level, skillLevels, comboOrder: [],
    derivedStats: { ...fresh.derivedStats, life: 31, mana: 17 } };
}
function mechanics(player: Player) {
  const unit = playerToCombatUnit(player);
  return { stats: unit.stats, life: unit.life, mana: unit.mana,
    increasedDamagePct: unit.increasedDamagePct, manaRegen: unit.manaRegenPerSecond };
}
beforeEach(() => { useInventoryStore.getState().reset(); useFormationStore.getState().reset(); });
afterEach(() => {
  useInventoryStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});

describe('Poison and Elemental Mastery at the fresh hero boundary', () => {
  for (const c of cases) {
    it.each([1, 20])(`${c.canonical} rank%s reaches exactly its damage types and magical dodge`, rank => {
      const baseline = playerToCombatUnit(hero(c.classId));
      const player = hero(c.classId, { [c.authored]: rank });
      const before = structuredClone(player), learned = playerToCombatUnit(player);
      for (const [type, bonus] of Object.entries(c.damage)) {
        expect.soft(Reflect.get(learned.increasedDamagePct ?? {}, type)).toBeCloseTo(bonus * rank, 12);
      }
      for (const type of ['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns']) {
        if (!(type in c.damage)) expect(Reflect.get(learned.increasedDamagePct ?? {}, type))
          .toEqual(Reflect.get(baseline.increasedDamagePct ?? {}, type));
      }
      expect.soft(learned.stats.magicDodge).toBeCloseTo(baseline.stats.magicDodge + rank * c.dodge, 12);
      expect({ ...learned.stats, magicDodge: baseline.stats.magicDodge }).toEqual(baseline.stats);
      expect([learned.life, learned.mana, learned.manaRegenExactCarry]).toEqual([31, 17, '0']);
      expect(playerToCombatUnit(player)).toEqual(learned);
      expect(mechanics({ ...player, skillLevels: {} })).toEqual(mechanics(hero(c.classId)));
      expect(player).toEqual(before);
    });

    it(`${c.canonical} supports exact aliases, max-once and the authored cap`, () => {
      const atCap = mechanics(hero(c.classId, { [c.canonical]: 20 }));
      expect(atCap).toEqual(mechanics(hero(c.classId, { [c.authored]: 20 })));
      expect(atCap).toEqual(mechanics(hero(c.classId, { [c.authored]: 99, [c.canonical]: 20 })));
      expect(mechanics(hero(c.classId, { [c.authored]: 2, [c.canonical]: 7 })))
        .toEqual(mechanics(hero(c.classId, { [c.canonical]: 7 })));
    });

    it(`${c.canonical} ignores under-level, foreign-class, malformed and similar allocations`, () => {
      for (const level of [1, 29, NaN, Infinity]) {
        expect(mechanics(hero(c.classId, { [c.canonical]: 20 }, level)))
          .toEqual(mechanics(hero(c.classId, {}, level)));
      }
      for (const other of ['amazon', 'assassin', 'barbarian', 'paladin', 'sorceress',
        c.classId === 'druid' ? 'necromancer' : 'druid'] as const) {
        expect(mechanics(hero(other, { [c.authored]: 20, [c.canonical]: 20 })))
          .toEqual(mechanics(hero(other)));
      }
      for (const value of [0, -1, 1.5, NaN, Infinity]) {
        expect(mechanics(hero(c.classId, { [c.authored]: value, [c.canonical]: value })))
          .toEqual(mechanics(hero(c.classId)));
      }
      expect(mechanics(hero(c.classId, { [c.canonical.replace('_', '-')]: 20 })))
        .toEqual(mechanics(hero(c.classId)));
    });
  }
  it.each(cases)('$canonical adds to real Infinity grants and fresh equipment dodge once', c => {
    const row = socketRunewords.find(word => word.id === 'runewords/infinity');
    if (!row) throw new Error('Missing real Infinity');
    const weapon: Item = { id: 'fixture-mastery-infinity', baseId: 'items/base/wp2h-giant-thresher', rarity: 'runeword',
      level: 70, identified: true, equipped: true, runewordId: row.id, socketCapacity: row.sockets,
      socketContents: row.runes.map(id => ({ kind: 'rune', id })) };
    const cap: Item = { id: 'fixture-mastery-dodge-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
      level: 1, identified: true, equipped: true,
      affixes: [{ affixId: 'fixture-imported', values: new Map([['statMods.magicDodge', 0.04]]) }] };
    useInventoryStore.setState({ equipped: { head: cap, weapon } });
    const player = hero(c.classId, { [c.canonical]: 20 });
    const before = structuredClone({ player, cap, weapon });
    const plain = playerToCombatUnit({ ...player, skillLevels: {} }), learned = playerToCombatUnit(player);
    expect(plain.stats.magicDodge).toBeCloseTo(0.09, 12);
    expect(learned.stats.magicDodge).toBeCloseTo(0.09 + 20 * c.dodge, 12);
    for (const [type, coefficient] of Object.entries(c.damage)) {
      expect(Reflect.get(learned.increasedDamagePct ?? {}, type)).toBeCloseTo(
        Number(Reflect.get(plain.increasedDamagePct ?? {}, type)) + coefficient * 20, 12);
    }
    expect(playerToCombatUnit(player)).toEqual(learned);
    useInventoryStore.setState({ equipped: {} });
    const bare = playerToCombatUnit(player);
    for (const [type, coefficient] of Object.entries(c.damage)) {
      expect(Reflect.get(bare.increasedDamagePct ?? {}, type)).toBeCloseTo(coefficient * 20, 12);
    }
    expect({ player, cap, weapon }).toEqual(before);
  });
  it('Elemental Mastery produces additional magical misses through the existing dodge consumer', () => {
    const spell = 'fixture.mastery-magic-dodge';
    registerSkill({ id: spell, archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      cooldown: 1, manaCost: 0, effects: [{ kind: 'damage', damageType: 'lightning', base: [100, 100] }] });
    const misses = (rank: number) => Array.from({ length: 64 }, (_, index) => {
      const native = playerToCombatUnit(hero('druid', { 'druid.elemental_mastery': rank }));
      const target = { ...native, life: 10000, stats: { ...native.stats, lifeMax: 10000, attackSpeed: 1 } };
      const enemy = { ...target, id: 'fixture-dodge-caster', side: 'enemy' as const, kind: 'monster' as const,
        stats: { ...target.stats, attackSpeed: 300, magicDodge: 0, critChance: 0 },
        skillOrder: [spell], skillLevels: {}, increasedDamagePct: {} };
      const event = runBattle({ seed: index + 1, playerTeam: [target], enemyTeam: [enemy], maxRounds: 1 })
        .events.find(e => e.kind === 'damage' && e.source === enemy.id);
      if (event?.kind !== 'damage') throw new Error('Missing actual magical attack');
      return event.dodged;
    }).filter(Boolean).length;
    expect(misses(20)).toBeGreaterThan(misses(0));
  });
});
