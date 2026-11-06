import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import type { DamageEffect } from '../skills/effects';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing test fixture');
  return value;
}

function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'merc' : 'monster', level: 1, tier: 'trash',
    life: 1, mana: 0, stats: { life: 1, lifeMax: 1, mana: 0, manaMax: 0, attack: 25,
      defense: 0, magicResist: 0, attackSpeed: side === 'player' ? 100 : 1,
      critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function input(id = 'mskill-basic-arrow', attack = 25, defense = 0, resistance = 0): CombatSnapshot {
  const merc = unit('merc', 'player'), target = unit('target', 'enemy');
  return { seed: 0, playerTeam: [{ ...merc, skillOrder: [id], stats: { ...merc.stats, attack } }],
    enemyTeam: [{ ...target, stats: { ...target.stats, defense,
      resistances: { ...target.stats.resistances, physical: resistance } } }] };
}
function replay(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot);
  const battle = runBattleRecorded(snapshot);
  expect(runBattleRecorded(snapshot)).toEqual(battle);
  expect(runBattle(snapshot)).toEqual(battle.result);
  expect(snapshot).toEqual(before);
  return battle;
}
function first(snapshot: CombatSnapshot) {
  const hit = replay(snapshot).events.find(event => event.kind === 'damage');
  if (!hit) throw new Error('Missing damage event');
  expect(hit).toMatchObject({ source: 'merc', dodged: false });
  return hit.amount;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('opt-in Attack contribution uses the shared damage pipeline', () => {
  it.each([
    ['mskill-basic-arrow', 25, 0, 0, 41], ['mskill-basic-arrow', 32, 0, 0, 48],
    ['mskill-pierce-arrow', 25, 0, 0, 51], ['mskill-pierce-arrow', 32, 0, 0, 58],
    ['mskill-basic-arrow', 25, 20, 0, 21], ['mskill-basic-arrow', 32, 20, 0, 28],
    ['mskill-pierce-arrow', 25, 20, 0, 31], ['mskill-pierce-arrow', 32, 20, 0, 38],
    ['mskill-basic-arrow', 25, 20, 25, 10], ['mskill-basic-arrow', 32, 20, 25, 16]
  ] as const)('%s Attack%s DEF%s resist%s => %s', (id, attack, defense, resistance, expected) => {
    expect(first(input(id, attack, defense, resistance))).toBe(expected);
  });

  it.each([
    { attackDamagePct: 25.5 },
    { attackDamagePctPerRank: 12.75 }
  ])('preserves fractional Attack percentages through the final damage floor: %j', coefficient => {
    registerSkill({ id: 'fixture.fractional-attack', archetype: 'fixture', target: 'single-enemy',
      cooldown: 1, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'damage', damageType: 'physical', base: [10, 10], ...coefficient }] });
    const snapshot = input('fixture.fractional-attack', 10001), merc = required(snapshot.playerTeam[0]);
    // Both cases add 25.5% at rank3: floor(10 + 10001 * .255) = 2560.
    expect(first({ ...snapshot, playerTeam: [{ ...merc, skillLevels: { 'fixture.fractional-attack': 3 } }] }))
      .toBe(2560);
  });

  it('adds fractional Attack before increased damage, combo, crit, resistance and final floor', () => {
    const effect: DamageEffect & { readonly attackDamagePct: number } = {
      kind: 'damage', damageType: 'physical', base: [10, 10], attackDamagePct: 25 };
    registerSkill({ id: 'fixture.attack', archetype: 'fixture', target: 'single-enemy',
      cooldown: 1, manaCost: 0, minLevel: 1, effects: [effect] });
    const snapshot = input('fixture.attack', 3, 1, 25);
    const merc = required(snapshot.playerTeam[0]), target = required(snapshot.enemyTeam[0]);
    const enriched = { ...snapshot, playerTeam: [{ ...merc, increasedDamagePct: { physical: 0.5 },
      stats: { ...merc.stats, critChance: 1 } }], enemyTeam: [{ ...target,
        statuses: [{ id: 'freeze', sourceId: 'fixture', stacks: 1, remaining: -1 }] }] };
    // floor((10 + 3*.25) *1.5*1.5*2*.75 -1) =35; early floor would give32.
    expect(first(enriched)).toBe(35);
  });

  it('preserves the complete recording and RNG state when metadata is absent or zero', () => {
    registerSkill({ id: 'fixture.ordinary-physical', archetype: 'fixture', target: 'single-enemy',
      cooldown: 1, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'damage', damageType: 'physical', base: [18, 28] }] });
    const skill = required(getSkill('fixture.ordinary-physical'));
    const snapshot = input(skill.id);
    const absent = replay(snapshot);
    registerSkill({ ...skill, effects: skill.effects.map(effect => effect.kind === 'damage'
      ? { ...effect, attackDamagePct: 0 } : effect) });
    expect(replay(snapshot)).toEqual(absent);
    expect(first(snapshot)).toBe(18); // Ordinary physical damage has no blanket weapon bonus.
  });

  it('does not add skill rank or level growth to arrow damage', () => {
    for (const id of ['mskill-basic-arrow', 'mskill-pierce-arrow']) {
      const snapshot = input(id), merc = required(snapshot.playerTeam[0]);
      expect(first({ ...snapshot, playerTeam: [{ ...merc, level: 99, skillLevels: { [id]: 20 } }] }))
        .toBe(first({ ...snapshot, playerTeam: [{ ...merc, level: 99, skillLevels: { [id]: 1 } }] }));
    }
  });

  it('adds Attack to every Pierce target, retaining all-enemy scope and one RNG sequence', () => {
    const original = rngModule.createRng;
    vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
      const rng = original(seed);
      vi.spyOn(rng, 'chance').mockImplementation(chance => chance > 0);
      vi.spyOn(rng, 'nextInt').mockImplementation(min => min);
      return rng;
    });
    const snapshot = input('mskill-pierce-arrow', 32, 20);
    const battle = replay({ ...snapshot,
      enemyTeam: Array.from({ length: 4 }, (_, i) => ({ ...required(snapshot.enemyTeam[0]), id: `target-${String(i)}` })) });
    expect(battle.events.filter(e => e.kind === 'damage').map(e => [e.target, e.amount]))
      .toEqual([[ 'target-0', 38 ], [ 'target-1', 38 ], [ 'target-2', 38 ], [ 'target-3', 38 ]]);
  });
});
