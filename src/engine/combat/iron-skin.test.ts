import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import type { DamageType } from '../types/attributes';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';

const AUTHORED = 'skills-barbarian-iron-skin';
const CANONICAL = 'barbarian.iron_skin';
const HIT = 'fixture.iron-hit';
const marker = (id: string, appliedAtMs = 0): ActiveStatus =>
  ({ id, sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 18, tier: 'trash',
    life: 100, mana: 30, stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100,
      attack: 100, defense: 0, magicResist: 7, attackSpeed: 100, critChance: 0,
      critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
/** Existing-consumer controls only: defense is supplied explicitly, not runtime composition proof. */
function incoming(type: DamageType, defense = 21.84,
  extra: Partial<CombatUnit> = {}): CombatSnapshot {
  registerSkill({ id: HIT, archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 0, cooldown: 100,
    effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
  const hero = unit('hero', 'player');
  return { seed: 7, playerTeam: [{ ...hero, life: 10000,
    stats: { ...hero.stats, life: 10000, lifeMax: 10000, defense },
    statuses: [marker('stun')], ...extra }],
    enemyTeam: [{ ...unit('attacker', 'enemy'), skillOrder: [HIT],
      statuses: [marker('stun', 1701), { ...marker('poison'), dotPerStack: 50, damageType: 'poison' }] }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input);
  const result = runBattleRecorded(input);
  expect(runBattle(input)).toEqual(result.result);
  expect(runBattleRecorded(input)).toEqual(result);
  expect(input).toEqual(before);
  return result;
}
const hits = (result: ReturnType<typeof runBattleRecorded>) => result.events.filter(e => e.kind === 'damage');
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('P07a04B existing fractional-defense consumer controls', () => {
  it.each(['physical', 'fire', 'poison', 'thorns'] as const)(
    'mitigates direct%s with fractional21.84/37.8 and the existing final floor', type => {
      for (const [defense, amount] of [[21, 79], [21.84, 78], [37.8, 62]] as const) {
        const input = incoming(type, defense), result = record(input);
        expect(hits(result)).toEqual([expect.objectContaining({ source: 'attacker', target: 'hero',
          damageType: type, amount, crit: false, dodged: false, simClockMs: 1700 })]);
        expect(result.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
        expect(result.result.playerTeam[0]?.mana).toBe(30);
      }
    });

  it.each(['cold', 'lightning', 'arcane'] as const)(
    'retains magicResist7 for%s regardless of ordinary defense', type => {
      for (const defense of [21.84, 37.8, 9999]) {
        const result = record(incoming(type, defense));
        expect(hits(result)).toEqual([expect.objectContaining({ amount: 93, damageType: type })]);
      }
    });

  it('keeps the existing minimum1 after ordinary mitigation', () => {
    expect(hits(record(incoming('physical', 200)))).toEqual([expect.objectContaining({ amount: 1 })]);
  });

  it.each([{ type: 'physical' as const, amount: 106 }, { type: 'fire' as const, amount: 81 }])(
    'composes paid Armor1.6, Melt0.7 and Sight0.75 for$type with existing combos', ({ type, amount }) => {
    // Physical keeps Melt combo1.25: floor(125-21.84*1.6*.7*.75)=106; neutral fire gives81.
    const result = record(incoming(type, 21.84, {
      frozenArmor: { rank: 20, defensePct: 0.6 }, activeBuffIds: ['frozen-armor'],
      statuses: [marker('stun'), marker('armor-melt'), marker('merc-inner-sight')] }));
    expect(hits(result)).toEqual([expect.objectContaining({ amount, damageType: type })]);
    expect(result.result.playerTeam[0]?.stats.defense).toBe(21.84);
    expect(result.result.playerTeam[0]?.frozenArmor).toEqual({ rank: 20, defensePct: 0.6 });
  });

  it('leaves fixed pre-existing periodic potency unchanged at both defense values', () => {
    const results = [21.84, 37.8].map(defense => record(incoming('fire', defense, {
      statuses: [marker('stun'), { ...marker('poison'), dotPerStack: 7, damageType: 'poison' }] })));
    const dots = results.map(result => result.events.filter(e => e.kind === 'dot' && e.target === 'hero'));
    expect(dots[0]?.length).toBeGreaterThan(0);
    expect(dots[0]).toEqual(dots[1]);
    // Fixed7HP/s settles at action1700 and lethal2000, not fixed one-second ticks.
    expect(dots[0]?.map(e => [e.simClockMs, e.kind === 'dot' ? e.amount : null]))
      .toEqual([[1700, 11], [2000, 3]]);
    expect(dots[0]?.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(14);
  });

  it.each([AUTHORED, CANONICAL])('never executes the actual passive%s or adds payment/CD/markers', alias => {
    expect(getSkill(alias)).toMatchObject({ id: CANONICAL, trigger: 'passive', manaCost: 0, cooldown: 0 });
    const source = unit('hero', 'player'), target = unit('target', 'enemy');
    const passive = structuredClone(getSkill(alias));
    const result = record({ seed: 7, playerTeam: [{ ...source, skillOrder: [alias],
      skillLevels: { [alias]: 20 }, stats: { ...source.stats, defense: 37.8 } }],
      enemyTeam: [{ ...target, statuses: [marker('stun')] }] });
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: null, simClockMs: 1700 })]);
    expect(hits(result)).toEqual([expect.objectContaining({ amount: 100, damageType: 'physical' })]);
    expect(result.events.filter(e => e.kind === 'mana' || e.kind === 'buff')).toEqual([]);
    expect(result.result.playerTeam[0]?.mana).toBe(30);
    expect(result.result.playerTeam[0]?.cooldowns).toEqual({});
    expect(result.result.playerTeam[0]?.activeBuffIds).toEqual([]);
    expect(getSkill(alias)).toEqual(passive);
  });

  it.each([21.84, 37.8])('adds no RNG draws to neutral direct mitigation at defense%s', defense => {
    const random = rngModule.createRng(7);
    const chance = vi.spyOn(random, 'chance'), range = vi.spyOn(random, 'nextInt');
    vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
    runBattleRecorded(incoming('fire', defense));
    // The trash monster dies at2000; independent HP/MP orb draws remain part of this fixture.
    expect(chance.mock.calls).toEqual([[0.85], [0], [0.25], [0.25]]);
    expect(range.mock.calls).toEqual([]);
    expect(random.next()).toBe(0.5214452685322613);
  });
});
