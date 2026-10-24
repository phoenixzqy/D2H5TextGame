import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { runBattle, type BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Item } from '@/engine/types/items';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const cases = [
  ['sword', 'items/base/wp1h-short-sword'],
  ['axe', 'items/base/weapon-axe'],
  ['mace', 'items/base/weapon-mace'],
] as const;
const allRanks = Object.fromEntries(cases.map(([key]) => ['barbarian.' + key + '_mastery', 20]));
function item(baseId: string): Item {
  return { id: 'fixture-mastery-weapon', baseId, rarity: 'normal', level: 1,
    identified: true, equipped: true, affixes: [] };
}
function hero(skillLevels: Record<string, number> = {}) {
  const fresh = createMockPlayer('Weapon mastery functional fixture', 'barbarian');
  return { ...fresh, id: 'fixture-mastery-hero', level: 30, comboOrder: [], skillLevels };
}
// Allocation maps differ intentionally; compare every other wave projection field.
function project(player: ReturnType<typeof hero>) {
  return { ...playerToCombatUnit(player), skillLevels: {} };
}
function reset() {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
}
beforeEach(reset); afterEach(reset);

describe('Barbarian mastery at the canonical equipment boundary', () => {
  it.each(cases)('applies %s mastery once at ranks one and twenty without changing Attack or resources', (key, baseId) => {
    useInventoryStore.setState({ equipped: { weapon: item(baseId) } });
    const plain = project(hero());
    for (const rank of [1, 20]) {
      const learned = project(hero({ ['barbarian.' + key + '_mastery']: rank }));
      expect.soft(learned.increasedDamagePct?.physical).toBeCloseTo(rank * 0.03, 12);
      expect.soft(learned.stats.critChance).toBeCloseTo(plain.stats.critChance + rank * 0.005, 12);
      expect({ ...learned.stats, critChance: plain.stats.critChance }).toEqual(plain.stats);
      expect([learned.life, learned.mana]).toEqual([plain.life, plain.mana]);
      expect(project(hero({ ['barbarian.' + key + '_mastery']: rank }))).toEqual(learned);
    }
  });

  it.each(cases)('does not stack other learned masteries with the equipped %s', (key, baseId) => {
    useInventoryStore.setState({ equipped: { weapon: item(baseId) } });
    const matching = project(hero({ ['skills-barbarian-' + key + '-mastery']: 20 }));
    expect.soft(matching.increasedDamagePct?.physical).toBeCloseTo(0.6, 12);
    expect(project(hero(allRanks))).toEqual(matching);
    const others = Object.fromEntries(Object.entries(allRanks).filter(([id]) => !id.includes(key)));
    expect(project(hero(others))).toEqual(project(hero()));
  });

  it('recomposes after swaps/removal and ignores offhand, name hints and unknown bases', () => {
    const player = hero({ 'barbarian.sword_mastery': 20 });
    useInventoryStore.setState({ equipped: { weapon: item(cases[0][1]) } });
    const sword = project(player), frozen = structuredClone(sword);
    expect.soft(sword.increasedDamagePct?.physical).toBeCloseTo(0.6, 12);
    for (const equipped of [{}, { offhand: item(cases[0][1]) },
      { weapon: item('items/base/wp2h-war-pike') },
      { weapon: item('unknown-sword'), offhand: item(cases[0][1]) },
      { weapon: { ...item(cases[1][1]), id: 'skills-barbarian-sword-mastery' } }]) {
      useInventoryStore.setState({ equipped });
      expect(project(player)).toEqual(project({ ...player, skillLevels: {} }));
      expect(sword).toEqual(frozen);
    }
  });

  it('accepts two-handed swords and caps duplicate aliases rather than stacking', () => {
    useInventoryStore.setState({ equipped: { weapon: item('items/base/wp2h-two-handed-sword') } });
    const player = hero({ 'barbarian.sword_mastery': 99, 'skills-barbarian-sword-mastery': 3 });
    const projected = project(player), plain = project(hero());
    expect.soft(projected.increasedDamagePct?.physical).toBeCloseTo(0.6, 12);
    expect.soft(projected.stats.critChance).toBeCloseTo(plain.stats.critChance + 0.1, 12);
    expect(player.skillLevels).toEqual({ 'barbarian.sword_mastery': 99, 'skills-barbarian-sword-mastery': 3 });
  });

  it('preserves independent item damage/recovery/reflection while composing mastery', () => {
    const word = socketRunewords.find(row => row.id === 'runewords/dream');
    if (!word) throw new Error('Missing authored Dream');
    const head: Item = { ...item('items/base/helm-war-hat'), id: 'fixture-mastery-dream',
      rarity: 'runeword', runewordId: word.id, socketCapacity: word.sockets,
      socketContents: word.runes.map(id => ({ kind: 'rune', id })) };
    useInventoryStore.setState({ equipped: { head, weapon: item(cases[0][1]) } });
    const plain = playerToCombatUnit(hero()), learned = playerToCombatUnit(hero(allRanks));
    expect(plain.increasedDamagePct?.lightning).toBe(0.15);
    expect(learned.increasedDamagePct).toEqual({ ...plain.increasedDamagePct, physical: 0.6 });
    expect([learned.manaRegenPerSecond, learned.manaRegenBaselinePerSecond, learned.physicalReflectionPct])
      .toEqual([plain.manaRegenPerSecond, plain.manaRegenBaselinePerSecond, plain.physicalReflectionPct]);
  });

  it.each(['amazon', 'sorceress', 'paladin', 'necromancer', 'druid', 'assassin'] as const)(
    'grants no imported mastery to %s', classId => {
      useInventoryStore.setState({ equipped: { weapon: item(cases[0][1]) } });
      const player = { ...hero(allRanks), class: classId };
      expect(project(player)).toEqual(project({ ...player, skillLevels: {} }));
    });
});

describe('mastery reaches direct damage and critical-hit consumers', () => {
  function firstHit(rank: number, seed: number, type: 'physical' | 'arcane', critical = false) {
    useInventoryStore.setState({ equipped: { weapon: item(cases[0][1]) } });
    const native = playerToCombatUnit(hero({ 'barbarian.sword_mastery': rank }));
    const source: CombatUnit = { ...native, life: 10000, mana: 10000,
      stats: { ...native.stats, lifeMax: 10000, life: 10000, attackSpeed: 150,
        critChance: critical ? native.stats.critChance : 0 },
      basicAttack: { damage: [100, 100], damageType: type } };
    const target: CombatUnit = { ...source, id: 'fixture-mastery-dummy', side: 'enemy', kind: 'monster',
      skillLevels: {}, skillOrder: [], increasedDamagePct: {},
      stats: { ...source.stats, attackSpeed: 1, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
        resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
    const result = runBattle({ seed, playerTeam: [source], enemyTeam: [target], maxRounds: 1 });
    const damage = result.events.find((event): event is Extract<BattleEvent, { kind: 'damage' }> =>
      event.kind === 'damage' && event.source === source.id);
    if (!damage) throw new Error('Missing original hero hit');
    return { damage, result };
  }

  it('raises physical direct damage by sixty percent, leaves noncritical arcane hits unchanged, and never casts a passive', () => {
    expect(firstHit(0, 1, 'physical').damage.amount).toBe(100);
    expect(firstHit(20, 1, 'physical').damage.amount).toBe(160);
    expect(firstHit(20, 1, 'arcane').damage).toEqual(firstHit(0, 1, 'arcane').damage);
    expect(firstHit(20, 1, 'physical').result.events.filter(e => e.kind === 'action')
      .every(e => e.skillId === null)).toBe(true);
  });

  it('increases actual crit outcomes across fixed paired seeds with matching equipment', () => {
    const seeds = Array.from({ length: 64 }, (_, index) => index + 1);
    const counts = [0, 20].map(rank => seeds.filter(seed => firstHit(rank, seed, 'physical', true).damage.crit).length);
    expect(counts[1]).toBeGreaterThan(counts[0] ?? 0);
  });
});
