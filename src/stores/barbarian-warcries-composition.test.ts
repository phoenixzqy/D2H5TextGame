import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, type BattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { Player, Mercenary } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { playerToCombatUnit } from './combatHelpers';
import { mercToCombatUnit } from './mercToCombatUnit';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { useInventoryStore } from './inventoryStore';
import { useFormationStore } from './formationStore';
import { useMapStore } from './mapStore';

function hero(fields: Partial<Player> = {}): Player {
  const fresh = createMockPlayer('Synthetic warcries fixture', 'barbarian');
  return { ...fresh, id: 'fixture-warcries-hero', level: 30, skillLevels: {}, comboOrder: [],
    derivedStats: { ...fresh.derivedStats, life: 31, mana: 17 }, ...fields };
}
function reset() {
  useInventoryStore.getState().reset(); useFormationStore.getState().reset(); useMapStore.getState().reset();
}
beforeEach(reset); afterEach(() => { reset(); resetRegistry(); loadDefaultSkills(); });
const ranks = { 'barbarian.shout': 20, 'barbarian.battle_orders': 20 };
function battle(levels: Record<string, number>, seed = 7) {
  const cap: Item = { id: 'fixture-warcries-battle-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
    socketCapacity: 0, identified: true, equipped: true,
    affixes: [{ affixId: 'fixture-imported', values: new Map([['statMods.life', 10000], ['statMods.mana', 10000]]) }] };
  useInventoryStore.setState({ equipped: { helm: cap } });
  const unit = playerToCombatUnit(hero({ skillLevels: levels }));
  const attacker: CombatUnit = { ...unit, life: unit.stats.lifeMax, mana: 0,
    stats: { ...unit.stats, attack: 1, attackSpeed: 1, critChance: 0, physDodge: 0 } };
  const dummy: CombatUnit = { ...attacker, id: 'fixture-warcries-dummy', side: 'enemy', kind: 'monster',
    life: 100000, mana: 0, manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...attacker.stats, life: 100000, lifeMax: 100000, attack: 100, attackSpeed: 110,
      defense: 0, critChance: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    skillLevels: {}, skillOrder: [], basicAttack: { damage: [200, 200], damageType: 'physical' } };
  return runBattle({ seed, playerTeam: [attacker], enemyTeam: [dummy], maxRounds: 6 });
}
describe('automatic personal Barbarian warcries from fresh native stats', () => {
  it.each([1, 20])('Shout rank%s changes only ordinary defense', rank => {
    const plain = playerToCombatUnit(hero());
    const learned = playerToCombatUnit(hero({ skillLevels: { 'barbarian.shout': rank } }));
    expect(learned.stats.defense).toBeCloseTo(plain.stats.defense * (1 + rank * 0.03), 12);
    expect({ ...learned.stats, defense: plain.stats.defense }).toEqual(plain.stats);
    expect([learned.life, learned.mana, learned.manaRegenPerSecond]).toEqual([31, 17, plain.manaRegenPerSecond]);
    expect(learned.statuses).toEqual([]); expect(learned.skillOrder).toEqual([]);
  });
  it.each([1, 20])('Orders rank%s adds life capacity and ordinary recovery without healing or max-MP bonus', rank => {
    const plain = playerToCombatUnit(hero());
    const learned = playerToCombatUnit(hero({ skillLevels: { 'skills-barbarian-battle-orders': rank } }));
    expect.soft(learned.stats.lifeMax).toBeCloseTo(plain.stats.lifeMax * (1 + rank * 0.04), 12);
    expect.soft(learned.manaRegenPerSecond).toBeCloseTo((plain.manaRegenPerSecond ?? 0) * (1 + rank * 0.01), 12);
    expect(learned.manaRegenBaselinePerSecond).toBe(learned.manaRegenPerSecond);
    expect({ ...learned.stats, lifeMax: plain.stats.lifeMax }).toEqual(plain.stats);
    expect([learned.life, learned.mana]).toEqual([31, 17]);
    expect(learned.statuses).toEqual([]); expect(learned.skillOrder).toEqual([]);
  });
  it('adds like bonuses over equipment once; removes and clamps without mutating persisted state', () => {
    const cap: Item = { id: 'fixture-warcries-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
      socketCapacity: 0, identified: true, equipped: true,
      affixes: [{ affixId: 'fixture-imported', values: new Map([['statMods.life', 100], ['statMods.defense', 100]]) }] };
    useInventoryStore.setState({ equipped: { helm: cap } });
    const player = hero({ skillLevels: { ...ranks, 'barbarian.increased_stamina': 20, 'barbarian.iron_skin': 20 } });
    const before = structuredClone({ player, cap });
    const plain = playerToCombatUnit({ ...player, skillLevels: {} });
    const learned = playerToCombatUnit(player);
    expect.soft(learned.stats.lifeMax).toBeCloseTo(plain.stats.lifeMax * 2.4, 10);
    expect.soft(learned.stats.defense).toBeCloseTo(plain.stats.defense * 2.4, 10);
    expect(playerToCombatUnit(player)).toEqual(learned);
    const overfull = { ...player, skillLevels: {}, derivedStats: { ...player.derivedStats,
      life: learned.stats.lifeMax, mana: learned.stats.manaMax + 100 } };
    const removed = playerToCombatUnit(overfull);
    expect([removed.life, removed.mana]).toEqual([plain.stats.lifeMax, plain.stats.manaMax]);
    useInventoryStore.setState({ equipped: {} });
    expect.soft(learned.stats.lifeMax - playerToCombatUnit(player).stats.lifeMax).toBeCloseTo(240, 10);
    expect({ player, cap }).toEqual(before);
  });
  it.each(['amazon', 'assassin', 'druid', 'necromancer', 'paladin', 'sorceress'] as const)(
    'rejects imported warcries on %s', classId => {
      const player = hero({ class: classId });
      const actual = playerToCombatUnit({ ...player, skillLevels: ranks }), plain = playerToCombatUnit(player);
      expect(actual.stats).toEqual(plain.stats);
      expect(actual.manaRegenPerSecond).toBe(plain.manaRegenPerSecond);
    });
  it('scales ordinary recovery before real Phoenix recovery without granting the hero passive to a merc', () => {
    const row = socketRunewords.find(word => word.id === 'runewords/phoenix');
    if (!row) throw new Error('Missing Phoenix');
    const item: Item = { id: 'fixture-warcries-phoenix', baseId: 'items/base/sh-monarch', rarity: 'runeword', level: 70,
      identified: true, equipped: true, runewordId: row.id, socketCapacity: row.sockets,
      socketContents: row.runes.map(id => ({ kind: 'rune', id })) };
    const player = hero({ skillLevels: ranks });
    const bare = playerToCombatUnit({ ...player, skillLevels: {} });
    useInventoryStore.setState({ equipped: { offhand: item } });
    const own = playerToCombatUnit(player);
    expect(own.manaRegenBaselinePerSecond).toBeCloseTo((bare.manaRegenPerSecond ?? 0) * 1.2, 12);
    expect(own.manaRegenPerSecond).toBeCloseTo((bare.manaRegenPerSecond ?? 0) * 1.2 * 1.1, 12);
    const merc: Mercenary = { ...player, id: 'fixture-warcries-merc', type: 'mercenary',
      archetype: 'front', rarity: 'R', classId: 'rogue' };
    const unallocatedMerc = { ...merc, skillLevels: {} };
    const plainMerc = mercToCombatUnit(unallocatedMerc);
    const importedMerc = mercToCombatUnit(merc);
    expect(importedMerc.stats).toEqual(plainMerc.stats);
    expect(importedMerc.manaRegenPerSecond ?? 0).toBe(plainMerc.manaRegenPerSecond ?? 0);
    useInventoryStore.setState({ equipped: {} });
    expect(playerToCombatUnit(player).manaRegenPerSecond).toBe(own.manaRegenBaselinePerSecond);
  });
  it('keeps independent authored unlocks', () => {
    const player = hero({ level: 5 });
    const actual = playerToCombatUnit({ ...player, skillLevels: ranks }), plain = playerToCombatUnit(player);
      expect(actual.stats).toEqual(plain.stats);
      expect(actual.manaRegenPerSecond).toBe(plain.manaRegenPerSecond);
    const unlockedPlain = playerToCombatUnit(hero({ level: 6 }));
    const learned = playerToCombatUnit(hero({ level: 6, skillLevels: ranks }));
    expect(learned.stats.defense).toBeCloseTo(unlockedPlain.stats.defense * 1.6, 12);
    expect(learned.stats.lifeMax).toBe(unlockedPlain.stats.lifeMax);
    expect(learned.manaRegenPerSecond).toBe(unlockedPlain.manaRegenPerSecond);
  });
});
describe('warcries reach ordinary battle consumers', () => {
  it.each([1, 20])('Shout rank%s reduces actual landed physical damage with identical seeded schedules', rank => {
    const hits = (result: ReturnType<typeof battle>) => result.events.filter(
      (e): e is Extract<BattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'fixture-warcries-dummy');
    const plain = battle({}), learned = battle({ 'barbarian.shout': rank });
    const a = hits(plain), b = hits(learned);
    expect(a.length).toBeGreaterThan(0); expect(b.length).toBe(a.length);
    let landed = 0;
    for (let i = 0; i < a.length; i++) {
      expect(b[i]?.dodged).toBe(a[i]?.dodged);
      if (!a[i]?.dodged && (a[i]?.amount ?? 0) > 0) {
        expect(b[i]?.amount).toBeLessThan(a[i]?.amount ?? 0); landed++;
      }
    }
    expect(landed).toBeGreaterThan(0);
    expect(learned.events.filter(e => e.kind === 'action').every(e => e.skillId === null)).toBe(true);
    expect(battle({ 'barbarian.shout': rank })).toEqual(learned);
  });
  it.each([1, 20])('Orders rank%s supplies useful extra HP and actual MP recovery over identical time', rank => {
    const plain = battle({}), learned = battle({ 'barbarian.battle_orders': rank });
    expect.soft(learned.playerTeam[0]?.life).toBeGreaterThan(plain.playerTeam[0]?.life ?? 0);
    expect.soft(learned.playerTeam[0]?.mana).toBeGreaterThan(plain.playerTeam[0]?.mana ?? 0);
    expect(learned.events.filter(e => e.kind === 'action').every(e => e.skillId === null)).toBe(true);
    expect(battle({ 'barbarian.battle_orders': rank })).toEqual(learned);
  });
  it.each([1, 20])('Orders rank%s permits ordinary paid healing into the extra life capacity', rank => {
    registerSkill({ id: 'fixture.warcries-heal', archetype: 'fixture', target: 'self', minLevel: 1,
      cooldown: 1, manaCost: 5, effects: [{ kind: 'heal', target: 'self', amount: 100000 }] });
    const heal = (skillLevels: Record<string, number>) => {
      const native = playerToCombatUnit(hero({ skillLevels }));
      const actor = { ...native, skillOrder: ['fixture.warcries-heal'], stats: { ...native.stats, attackSpeed: 100 } };
      const enemy: CombatUnit = { ...native, id: 'fixture-heal-observer', side: 'enemy', kind: 'monster',
        statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 0 }],
        life: 100000, stats: { ...native.stats, lifeMax: 100000 } };
      return { native, result: runBattle({ seed: 7, playerTeam: [actor], enemyTeam: [enemy], maxRounds: 1 }) };
    };
    const plain = heal({}), learned = heal({ 'barbarian.battle_orders': rank });
    const restoration = (r: ReturnType<typeof heal>) => r.result.events.filter(
      (e): e is Extract<BattleEvent, { kind: 'heal' }> => e.kind === 'heal' && e.target === r.native.id);
    expect(restoration(plain)).toHaveLength(1); expect(restoration(learned)).toHaveLength(1);
    expect(restoration(plain)[0]?.amount).toBe(plain.native.stats.lifeMax - 31);
    expect(restoration(learned)[0]?.amount).toBe(learned.native.stats.lifeMax - 31);
    expect(restoration(learned)[0]?.amount).toBeGreaterThan(restoration(plain)[0]?.amount ?? 0);
    expect(learned.result.playerTeam[0]?.life).toBe(learned.native.stats.lifeMax);
  });

});
