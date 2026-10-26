import { beforeEach, afterEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';

const id = 'skills-necromancer-poison-dagger';
const runtime = 'necromancer.poison_dagger';
const hold = (at = 0): ActiveStatus => ({
  id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs: at
});
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

/** Actual learned authority; HP, resistance and cadence are unearned isolation scaffolding. */
function fixture(rank: number): CombatSnapshot {
  const projected = playerToCombatUnit({
    ...createMockPlayer('Synthetic native Poison Dagger', 'necromancer'),
    level: 30, skillLevels: { [id]: rank }, comboOrder: [id]
  });
  const hero: CombatUnit = {
    ...projected, id: 'hero', life: 500, mana: 5,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [hold(401)],
    stats: {
      ...projected.stats, life: 500, lifeMax: 500, mana: 100, manaMax: 100,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 263,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    }
  };
  const enemy: CombatUnit = {
    ...hero, id: 'target', kind: 'monster', side: 'enemy', tier: 'trash',
    skillOrder: [], skillLevels: {}, statuses: [hold()], mana: 0
  };
  return { seed: 1, playerTeam: [hero], enemyTeam: [enemy] };
}

it.each([[1, 25, 5, 470], [20, 120, 30, 350]])('native paid rank%s deals literal direct and full finite periodic Poison HP', (rank, direct, dot, finalHP) => {
  const input = fixture(rank), before = structuredClone(input);
  const out = runBattleRecorded(input);
  const actions = out.events.filter(e => e.kind === 'action' && e.actor === 'hero');
  const payments = out.events.filter(e => e.kind === 'mana' && e.reason === 'cast');
  const statuses = out.events.filter(e => e.kind === 'status' && e.statusId === 'poison');
  const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.target === 'target');
  const periodic = out.events.filter(e => e.kind === 'dot' && e.target === 'target');
  expect(actions).toEqual([expect.objectContaining({ skillId: runtime, simClockMs: 400 })]);
  expect(payments).toEqual([expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })]);
  expect(statuses).toEqual([expect.objectContaining({ target: 'target', simClockMs: 400 })]);
  expect(hits).toEqual([expect.objectContaining({ amount: direct, damageType: 'poison',
    simClockMs: 400, crit: false, dodged: false })]);
  expect(out.result.enemyTeam[0]?.life).toBe(finalHP);
  expect(out.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(periodic.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(dot);
  expect(periodic.every(e => e.simClockMs > 400 && e.simClockMs <= 5400)).toBe(true);
  const states = out.events.filter(e => e.kind === 'status-state' && e.target === 'target');
  expect(states.some(e => e.kind === 'status-state' && e.statuses.some(s =>
    s.id === 'poison' && s.stacks === 1 && s.appliedAtMs === 400 &&
    s.expiresAtMs === 5400 && s.dotPerStack === dot / 5 && s.sourceId === 'hero'))).toBe(true);
});

it('native insufficient MP cannot buy Poison Dagger status or damage', () => {
  const input = fixture(1);
  const out = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, mana: 4 })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === runtime)).toBe(false);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'poison')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'dot')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(4);
});

it('native wrong-class, unlearned and malformed ranks grant no Dagger authority', () => {
  const original = { ...createMockPlayer('Native authority', 'necromancer'), level: 30,
    skillLevels: { [id]: 1 }, comboOrder: [id] };
  expect(playerToCombatUnit(original).skillOrder).toEqual([id]);
  for (const patch of [{ class: 'barbarian' as const }, { level: 5 }, { skillLevels: {} },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { [id]: rank } }))])
    expect(playerToCombatUnit({ ...original, ...patch }).skillOrder).toEqual([]);
});

it('a dodged real paid Dagger cast spends5MP but applies no Poison or periodic damage', () => {
  const initial = fixture(20), input = { ...initial, seed: 4 };
  const out = runBattleRecorded(input);
  expect(out.events.filter(e => e.kind === 'action' && e.skillId === runtime)).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
    expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })
  ]);
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ source: 'hero', target: 'target', amount: 0, dodged: true })
  ]);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'poison')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'dot')).toEqual([]);
  expect(out.result.enemyTeam[0]?.life).toBe(500);
});

it('an active Dagger cooldown refuses the skill without spending mana or buying Poison', () => {
  const initial = fixture(1);
  const input = { ...initial, playerTeam: initial.playerTeam.map(unit => ({
    ...unit, cooldowns: { [runtime]: 500000 }
  })) };
  const out = runBattleRecorded(input);
  expect(out.events.some(e => e.kind === 'action' && e.skillId === runtime)).toBe(false);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'poison')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'dot')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(5);
});

it('uses Poison resistance and Defense once, retaining magic-resist independence for periodic damage', () => {
  const initial = fixture(20);
  const input = { ...initial, enemyTeam: initial.enemyTeam.map(unit => ({
    ...unit, stats: { ...unit.stats, defense: 10, magicResist: 9999,
      resistances: { ...unit.stats.resistances, poison: 50 } }
  })) };
  const out = runBattleRecorded(input);
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ source: 'hero', target: 'target', amount: 50, dodged: false })
  ]);
  expect(out.events.filter(e => e.kind === 'dot').reduce((sum,e) =>
    sum + e.amount, 0)).toBe(10);
  expect(out.result.enemyTeam[0]?.life).toBe(440);
  expect(out.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
  const withoutMR = { ...input, enemyTeam: input.enemyTeam.map(unit => ({
    ...unit, stats: { ...unit.stats, magicResist: 0 }
  })) };
  expect(runBattleRecorded(withoutMR).events).toEqual(out.events);
});

it('fresh damaging Dagger promotes a Poison marker prospectively without retroactive damage', () => {
  const initial = fixture(20);
  const marker: ActiveStatus = { id: 'poison', sourceId: 'old-marker', stacks: 3,
    remaining: 5, appliedAtMs: 0, expiresAtMs: 5000 };
  const input = { ...initial, enemyTeam: initial.enemyTeam.map(unit => ({
    ...unit, statuses: [...unit.statuses, marker]
  })) };
  const out = runBattleRecorded(input);
  const total = out.events.reduce((sum,e) => sum + (e.kind === 'dot' ? e.amount : 0), 0);
  // Existing three-stack Poison combo:120 * (1 + .15 * 3) =174;floor(174 * .05)=8HP/s.
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ amount: 174, damageType: 'poison', dodged: false })
  ]);
  expect(total).toBe(160);
  expect(out.result.enemyTeam[0]?.life).toBe(166);
  expect(out.events.some(e => e.kind === 'status-state' && e.statuses.some(s =>
    s.id === 'poison' && s.stacks === 4 && s.dotPerStack === 8 && s.sourceId === 'hero' &&
    s.appliedAtMs === 0 && s.expiresAtMs === 5400))).toBe(true);
  expect(out.events.filter(e => e.kind === 'dot').every(e => e.simClockMs > 400)).toBe(true);
});

it('a capped valid Poison retains its first rate/source and integrates the old interval once', () => {
  const initial = fixture(20);
  const marker: ActiveStatus = { id: 'poison', sourceId: 'first-damaging-source', stacks: 10,
    remaining: 5, appliedAtMs: 0, expiresAtMs: 5000, dotPerStack: 1, damageType: 'poison' };
  const input = { ...initial, enemyTeam: initial.enemyTeam.map(unit => ({
    ...unit, statuses: [...unit.statuses, marker]
  })) };
  const out = runBattleRecorded(input);
  expect(out.events.reduce((sum,e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(54);
  // Existing capped Poison combo:120 * (1 + .15 * 10) =300;the valid1HP/s rate stays.
  expect(out.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ amount: 300, damageType: 'poison', dodged: false })
  ]);
  expect(out.result.enemyTeam[0]?.life).toBe(146);
  expect(out.events.some(e => e.kind === 'status-state' && e.statuses.some(s =>
    s.id === 'poison' && s.stacks === 10 && s.dotPerStack === 1 &&
    s.sourceId === 'first-damaging-source' && s.appliedAtMs === 0 && s.expiresAtMs === 5400))).toBe(true);
});
