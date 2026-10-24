import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, type BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Item } from '@/engine/types/items';
import type { Player } from '@/engine/types/entities';
import { playerToCombatUnit } from './combatHelpers';
import { useFormationStore } from './formationStore';
import { useInventoryStore } from './inventoryStore';

function hero(fields: Partial<Player> = {}): Player {
  const fresh = createMockPlayer('Amazon passive boundary', 'amazon');
  return { ...fresh, level: 30, skillLevels: {}, comboOrder: [],
    derivedStats: { ...fresh.derivedStats, life: 31, mana: 17 }, ...fields };
}

beforeEach(() => { useInventoryStore.getState().reset(); useFormationStore.getState().reset(); });
afterEach(() => { useInventoryStore.getState().reset(); useFormationStore.getState().reset(); });

describe('authored Amazon passives at the native hero boundary', () => {
  it.each([1, 20])('Critical Strike rank%s adds one percentage point of crit chance per rank', rank => {
    const plain = playerToCombatUnit(hero());
    const learned = playerToCombatUnit(hero({ skillLevels: { 'skills-amazon-critical-strike': rank } }));
    expect(learned.stats.critChance).toBeCloseTo(plain.stats.critChance + rank * 0.01, 12);
    expect({ ...learned.stats, critChance: plain.stats.critChance }).toEqual(plain.stats);
    expect([learned.life, learned.mana]).toEqual([31, 17]);
  });

  it.each([1, 20])('Dodge rank%s adds one percentage point of physical dodge per rank', rank => {
    const plain = playerToCombatUnit(hero());
    const learned = playerToCombatUnit(hero({ skillLevels: { 'amazon.dodge': rank } }));
    expect(learned.stats.physDodge).toBeCloseTo(plain.stats.physDodge + rank * 0.01, 12);
    expect({ ...learned.stats, physDodge: plain.stats.physDodge }).toEqual(plain.stats);
  });

  it.each([1, 20])('Penetrate rank%s increases fresh Attack by three percent per rank', rank => {
    const plain = playerToCombatUnit(hero({ skillLevels: { 'amazon.critical_strike': 1 } }));
    const learned = playerToCombatUnit(hero({ skillLevels: {
      'amazon.critical_strike': 1, 'skills-amazon-penetrate': rank,
    } }));
    expect(learned.stats.attack).toBeCloseTo(plain.stats.attack * (1 + rank * 0.03), 12);
    expect({ ...learned.stats, attack: plain.stats.attack }).toEqual(plain.stats);
  });

  it.each(['sorceress', 'barbarian', 'paladin', 'necromancer', 'druid', 'assassin'] as const)(
    'does not grant imported Amazon passives to %s', classId => {
      const player = hero({ class: classId });
      const learned = playerToCombatUnit({ ...player, skillLevels: {
        'amazon.critical_strike': 20, 'amazon.penetrate': 20, 'amazon.dodge': 20,
      } });
      expect(learned.stats).toEqual(playerToCombatUnit(player).stats);
    });
});


describe('Amazon passives reach native damage consumers', () => {
  it('recomposes equipment Attack once, removing gear/allocation without accumulation or persisted mutations', () => {
    const player = hero({ skillLevels: { 'amazon.penetrate': 20, 'amazon.critical_strike': 1 } });
    const cap: Item = { id: 'fixture-amazon-attack-cap', baseId: 'items/base/helm-cap',
      rarity: 'rare', level: 1, identified: true, equipped: true,
      affixes: [{ affixId: 'fixture-imported', values: new Map([['statMods.attack', 13]]) }] };
    useInventoryStore.setState({ equipped: { head: cap } });
    const before = structuredClone({ player, cap });
    const plain = playerToCombatUnit({ ...player, skillLevels: {} });
    const first = playerToCombatUnit(player);
    expect(plain.stats.attack).toBe(93);
    expect(first.stats.attack).toBeCloseTo(148.8, 12);
    expect(playerToCombatUnit(player)).toEqual(first);
    expect(playerToCombatUnit({ ...player, skillLevels: {} }).stats).toEqual(plain.stats);
    useInventoryStore.setState({ equipped: {} });
    expect(playerToCombatUnit(player).stats.attack).toBe(128);
    expect({ player, cap }).toEqual(before);
    expect([first.life, first.mana, first.manaRegenExactCarry]).toEqual([31, 17, '0']);
  });

  // Labeled synthetic opponents/pools isolate actual hit, crit and dodge consumers;
  // this finite deterministic oracle does not certify balance or an earned campaign.
  function firstHit(skillLevels: Record<string, number>, seed: number, source: 'hero' | 'enemy') {
    const native = playerToCombatUnit(hero({ skillLevels }));
    const attacker: CombatUnit = { ...native, life: 10000,
      stats: { ...native.stats, life: 10000, lifeMax: 10000, attackSpeed: 300 } };
    const dummy: CombatUnit = { ...attacker, id: 'fixture-amazon-dummy', side: 'enemy', kind: 'monster',
      stats: { ...attacker.stats, attack: 40, attackSpeed: 1, critChance: 0, defense: 0,
        physDodge: 0, magicDodge: 0 }, skillLevels: {}, skillOrder: [] };
    const result = runBattle({ seed, playerTeam: [attacker], enemyTeam: [dummy], maxRounds: 2 });
    const event = result.events.find((event): event is Extract<BattleEvent, { kind: 'damage' }> =>
      event.kind === 'damage' && event.source === (source === 'hero' ? attacker.id : dummy.id));
    if (!event) throw new Error('Missing actual basic attack');
    expect(result.events.filter(event => event.kind === 'action').every(event => event.skillId === null)).toBe(true);
    expect(result.playerTeam[0]?.statuses).toEqual([]);
    return event;
  }

  it('Penetrate increases actual basic damage through fresh Attack', () => {
    const before = firstHit({}, 1, 'hero');
    const after = firstHit({ 'amazon.penetrate': 20, 'amazon.critical_strike': 1 }, 1, 'hero');
    expect(before).toMatchObject({ amount: 160, crit: true, dodged: false });
    expect(after).toMatchObject({ amount: 256, crit: true, dodged: false });
  });

  it('Critical Strike produces additional crits and Dodge produces additional physical misses for fixed seeds', () => {
    const samples = Array.from({ length: 64 }, (_, index) => index + 1);
    const critical = (levels: Record<string, number>) => samples.filter(seed => firstHit(levels, seed, 'hero').crit).length;
    const dodged = (levels: Record<string, number>) => samples.filter(seed => firstHit(levels, seed, 'enemy').dodged).length;
    expect(critical({ 'amazon.critical_strike': 20 })).toBeGreaterThan(critical({}));
    expect(dodged({ 'amazon.dodge': 20 })).toBeGreaterThan(dodged({}));
  });
});
