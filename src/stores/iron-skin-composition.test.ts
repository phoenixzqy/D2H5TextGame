import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';

const AUTHORED = 'skills-barbarian-iron-skin';
const CANONICAL = 'barbarian.iron_skin';
function player(fields: Partial<Player> = {}): Player {
  const fresh = createMockPlayer('IronBoundary', 'barbarian');
  return { ...fresh, level: 18, comboOrder: [], skillLevels: {},
    derivedStats: { ...fresh.derivedStats, defense: 999, life: 31, mana: 17 }, ...fields };
}
function gear(): Item {
  // Explicit imported adapter fixture: L18 base71 + cap7 -56.25 =21.75; base derivation floors21.
  return { id: 'fixture-iron-cap', baseId: 'items/base/helm-cap', rarity: 'rare',
    level: 1, identified: true, equipped: true, affixes: [{ affixId: 'fixture-imported',
      values: new Map([['statMods.defense', -56.25], ['statMods.magicResist', 11]]) }] };
}
beforeEach(() => { useInventoryStore.getState().reset(); useFormationStore.getState().reset(); });
afterEach(() => { useInventoryStore.getState().reset(); useFormationStore.getState().reset(); });

describe('P07a04B fresh combat-only Iron Skin adapter', () => {
  it('applies Exile after flat equipment and before Iron Skin, without intermediate flooring or pool changes', () => {
    const shield: Item = { id: 'iron-exile', baseId: 'items/base/sh-monarch', rarity: 'runeword',
      runewordId: 'runewords/exile', level: 60, socketCapacity: 4, baseRolls: { defense: 64 },
      identified: true, equipped: true,
      socketContents: ['vex', 'ohm', 'ist', 'dol'].map(id => ({ kind: 'rune', id: `runes/${id}` })) };
    useInventoryStore.setState({ equipped: { offhand: shield } });
    const hero = player({ level: 60, skillLevels: { [CANONICAL]: 1 } });
    const before = structuredClone(hero);
    const unit = playerToCombatUnit(hero);
    // (L60def197 + shield64 + word220)×1.20×1.04.
    expect(unit.stats.defense).toBeCloseTo(600.288, 12);
    expect([unit.life, unit.mana]).toEqual([31, 17]);
    expect(playerToCombatUnit(hero)).toEqual(unit); expect(hero).toEqual(before);
    useInventoryStore.setState({ equipped: {} });
    expect(playerToCombatUnit(hero).stats.defense).toBeCloseTo(204.88, 12);
    expect(unit.stats.defense).toBeCloseTo(600.288, 12);
  });
  it.each([AUTHORED, CANONICAL])('uses allocated%s once at ranks1/10/20 and cap', alias => {
    const hero = player();
    expect(playerToCombatUnit(hero).stats.defense).toBe(71);
    for (const [rank, defense] of [[1, 73.84], [10, 99.4], [20, 127.8], [99, 127.8]] as const) {
      expect.soft(playerToCombatUnit({ ...hero, skillLevels: { [alias]: rank } }).stats.defense)
        .toBeCloseTo(defense, 12);
    }
    expect(hero.derivedStats.defense).toBe(999);
  });

  it('uses the maximum alias once in either order, never their sum', () => {
    for (const skillLevels of [{ [AUTHORED]: 2, [CANONICAL]: 20 },
      { [CANONICAL]: 2, [AUTHORED]: 20 }, { [AUTHORED]: 20, [CANONICAL]: 20 }]) {
      expect.soft(playerToCombatUnit(player({ skillLevels })).stats.defense).toBeCloseTo(127.8, 12);
    }
  });

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true])(
    'ignores invalid%s but retains a valid second alias', invalid => {
      const levels = { [AUTHORED]: invalid, [CANONICAL]: 1 } as unknown as NonNullable<Player['skillLevels']>;
      expect.soft(playerToCombatUnit(player({ skillLevels: levels })).stats.defense).toBeCloseTo(73.84, 12);
      expect(playerToCombatUnit(player({ skillLevels: { [AUTHORED]: invalid } as unknown as NonNullable<Player['skillLevels']> }))
        .stats.defense).toBe(71);
    });

  it('uses authored unlock18, preserving unboosted defense below it', () => {
    const hero = player({ skillLevels: { [CANONICAL]: 20 } });
    expect(playerToCombatUnit({ ...hero, level: 17 }).stats.defense).toBe(68);
    expect.soft(playerToCombatUnit(hero).stats.defense).toBeCloseTo(127.8, 12);
    expect.soft(playerToCombatUnit({ ...hero, level: 19 }).stats.defense).toBeCloseTo(133.2, 12);
  });

  it.each(['sorceress', 'paladin', 'amazon', 'necromancer', 'druid', 'assassin'] as const)(
    'does not grant imported Iron Skin to%s', classId => {
      const hero = player({ class: classId, skillLevels: { [AUTHORED]: 20 } });
      expect(playerToCombatUnit(hero).stats).toEqual(playerToCombatUnit({ ...hero, skillLevels: {} }).stats);
    });

  it.each([NaN, Infinity, -Infinity])('adds no Iron Skin at nonfinite level%s without sanitizing other formulas', level => {
    const hero = player({ level });
    const plain = playerToCombatUnit(hero);
    const learned = playerToCombatUnit({ ...hero, skillLevels: { [AUTHORED]: 20 } });
    expect(learned.stats).toEqual(plain.stats);
    expect(learned.manaRegenPerSecond).toBe(plain.manaRegenPerSecond);
  });

  it('retains fractional defense after existing fresh equipment floor, preserving every other field', () => {
    const cap = gear(); useInventoryStore.setState({ equipped: { head: cap } });
    const hero = player();
    const plain = playerToCombatUnit(hero);
    const before = structuredClone({ hero, equipped: useInventoryStore.getState().equipped });
    const learned = playerToCombatUnit({ ...hero, skillLevels: { [CANONICAL]: 1 } });
    expect(plain.stats.defense).toBe(21);
    expect.soft(learned.stats.defense).toBeCloseTo(21.84, 12);
    expect(learned.stats.magicResist).toBe(11);
    const profiles = plain.battleCommandPassives;
    if (!profiles) throw new Error('Missing native passive profiles');
    expect(learned.battleCommandPassives).toEqual({
      baseline: { ...profiles.baseline, stats: { ...profiles.baseline.stats, defense: 21.84 } },
      boosted: { ...profiles.boosted, stats: { ...profiles.boosted.stats, defense: 22.68 } }
    });
    expect({ ...learned, stats: { ...learned.stats, defense: plain.stats.defense },
      skillLevels: plain.skillLevels, battleCommandPassives: profiles }).toEqual(plain);
    expect([learned.life, learned.mana, learned.manaRegenCarry, learned.manaRegenCompensation,
      learned.manaRegenExactCarry]).toEqual([31, 17, 0, 0, '0']);
    expect({ hero, equipped: useInventoryStore.getState().equipped }).toEqual(before);
  });

  it('recomposes from fresh equipment repeatedly and removes allocation without retained multipliers', () => {
    const cap = gear(); useInventoryStore.setState({ equipped: { head: cap } });
    const hero = player({ skillLevels: { [AUTHORED]: 20 } });
    const before = structuredClone(hero);
    const first = playerToCombatUnit(hero);
    expect.soft(first.stats.defense).toBeCloseTo(37.8, 12);
    for (let repeat = 0; repeat < 3; repeat++) {
      const next = playerToCombatUnit(hero);
      expect(next).toEqual(first); expect(next.stats).not.toBe(first.stats);
    }
    expect(playerToCombatUnit({ ...hero, skillLevels: {} }).stats.defense).toBe(21);
    useInventoryStore.setState({ equipped: {} });
    expect.soft(playerToCombatUnit(hero).stats.defense).toBeCloseTo(127.8, 12);
    expect(hero).toEqual(before);
    expect(first.stats.defense).toBeCloseTo(37.8, 12);
  });

  it('never infers allocation from legacy skills, combo, equipment, statuses or similar aliases', () => {
    const hero = player({ skills: [{ id: AUTHORED, name: 'fixture', description: 'fixture',
      trigger: 'passive', target: 'self', cooldown: 0, cost: {}, minLevel: 1, level: 20, maxLevel: 20 }],
      comboOrder: [CANONICAL],
      skillLevels: { 'barbarian.iron-skin': 20, 'skills-barbarian-iron_skin': 20 },
      statusEffects: [{ id: AUTHORED, name: 'fixture', type: 'buff', duration: -1,
        maxStacks: 1, stacks: 1, remaining: -1, statMods: { defense: 999 } }] });
    const cap = gear(); useInventoryStore.setState({ equipped: { head: cap } });
    const input = playerToCombatUnit(hero);
    expect(input.stats.defense).toBe(21);
    expect(input.activeBuffIds).toEqual([]);
    expect(input).not.toHaveProperty('ironSkin');
  });
});
