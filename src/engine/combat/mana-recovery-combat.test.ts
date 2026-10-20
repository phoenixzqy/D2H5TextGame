import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRng } from '../rng';
import * as rngModule from '../rng';
import { composeHeroRecovery } from '../progression/warmth';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { registerSummon } from '../skills/summons';
import { MAX_ACTIONS, runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

function status(id: string, extra: Partial<ActiveStatus> = {}): ActiveStatus {
  return { id, stacks: 1, remaining: -1, sourceId: 'fixture', ...extra };
}
function unit(id: string, side: CombatUnit['side'], extra: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'summon', level: 30,
    tier: 'trash', life: 100_000, mana: 0,
    stats: { life: 100_000, lifeMax: 100_000, mana: 10_000, manaMax: 10_000,
      attack: 1, defense: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    statuses: [status('stun')], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...extra };
}
function clock(ms: number, extra: Partial<CombatUnit> = {}): CombatUnit {
  // A controlled summoned enemy supplies an exact real periodic terminal, without kill orbs.
  return unit('clock', 'enemy', { life: ms, statuses: [status('stun'),
    status('burn', { dotPerStack: 1000, expiresAtMs: ms })], ...extra });
}
function snapshot(ms: number, hero: CombatUnit, others: CombatUnit[] = []): CombatSnapshot {
  return { seed: 7, playerTeam: [hero, ...others], enemyTeam: [clock(ms)] };
}
function hero(result: RecordedBattleResult): CombatUnit {
  const found = result.result.playerTeam[0];
  if (!found) throw new Error('Missing real final hero');
  return found;
}
function regen(result: RecordedBattleResult, target = 'hero') {
  return result.events.filter(e => e.kind === 'mana' && e.target === target && e.reason === 'regeneration');
}
function spend(cost: number): string {
  const id = `fixture.recovery-spend-${String(cost)}`;
  registerSkill({ id, archetype: 'fixture', target: 'self', manaCost: cost, cooldown: 100,
    minLevel: 1, effects: [{ kind: 'buff', id, duration: -1 }] });
  return id;
}
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('continuous mana on actual combat boundaries', () => {
  it.each([[0, 5, 0], [1, 5, 0.2], [2, 5, 0.4], [20, 9, 0]] as const)(
    'consumes actual E20 Warmth rank%s composition for 1250ms: MP%s/carry%s', (rank, mp, carry) => {
      const composed = composeHeroRecovery({ classId: 'sorceress', level: 1, effectiveEnergy: 20,
        skillLevels: { 'skills-sorceress-warmth': rank } });
      const input = snapshot(1250, unit('hero', 'player', composed));
      const before = structuredClone(input);
      const result = runBattleRecorded(input);
      expect.soft(hero(result).mana).toBe(mp);
      expect.soft(hero(result).manaRegenCarry).toBeCloseTo(carry, 12);
      expect.soft(regen(result)).toEqual([expect.objectContaining({ mana: mp, simClockMs: 1250 })]);
      expect(result.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 1250 });
      expect(runBattleRecorded(input)).toEqual(result);
      expect(runBattle(input)).toEqual(result.result);
      expect(input).toEqual(before);
    });

  it.each([[4.16, 104], [43.68, 1092]] as const)('grants exactly rate%s × 25000ms = %s', (rate, mp) => {
    const result = runBattleRecorded(snapshot(25_000, unit('hero', 'player', { manaRegenPerSecond: rate })));
    expect(hero(result).mana).toBe(mp);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0, 12);
  });

  it('settles exactly 4.16 MP/s × 1000ms as four whole MP and .16 carry', () => {
    const result = runBattleRecorded(snapshot(1000, unit('hero', 'player', { manaRegenPerSecond: 4.16 })));
    expect(hero(result).mana).toBe(4);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0.16, 12);
    expect(regen(result)).toEqual([expect.objectContaining({ mana: 4, simClockMs: 1000 })]);
  });

  it('funds the actual eight-MP Fire Bolt from seven MP before its exact 1000ms boundary action', () => {
    expect(getSkill('sorceress.fire_bolt')).toMatchObject({ manaCost: 8 });
    const base = unit('hero', 'player');
    // AS250 acts every500ms; freeze blocks500ms and expires before the1000ms action.
    // The clock has one HP left at1000ms, so the actual Fire Bolt ends this battle then.
    const result = runBattleRecorded(snapshot(1001, { ...base, mana: 7, manaRegenPerSecond: 1,
      stats: { ...base.stats, attackSpeed: 250 },
      statuses: [status('freeze', { expiresAtMs: 1000 })],
      skillOrder: ['skills-sorceress-fire-bolt'], skillLevels: { 'skills-sorceress-fire-bolt': 1 } }));
    expect(result.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'hero', simClockMs: 500 }));
    const index = result.events.findIndex(e => e.kind === 'action' && e.actor === 'hero');
    expect(result.events.slice(index - 1, index + 2)).toEqual([
      expect.objectContaining({ kind: 'mana', target: 'hero', reason: 'regeneration', mana: 8, simClockMs: 1000 }),
      expect.objectContaining({ kind: 'action', actor: 'hero', skillId: 'sorceress.fire_bolt', simClockMs: 1000 }),
      expect.objectContaining({ kind: 'mana', target: 'hero', reason: 'cast', mana: 0, simClockMs: 1000 })
    ]);
    expect(hero(result).mana).toBe(0);
    expect(result.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 1000 });
  });

  it('continues earning while freeze blocks every scheduled action', () => {
    const base = unit('hero', 'player');
    const result = runBattleRecorded(snapshot(1250, { ...base, manaRegenPerSecond: 4.16,
      stats: { ...base.stats, attackSpeed: 250 }, statuses: [status('freeze')],
      skillOrder: ['skills-sorceress-fire-bolt'] }));
    expect(result.events.filter(e => e.kind === 'stunned' && e.target === 'hero').map(e => e.simClockMs))
      .toEqual([500, 1000]);
    expect(result.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([]);
    expect(hero(result).mana).toBe(5);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0.2, 12);
  });

  it('forbids recovery and Fire Bolt when periodic death occurs at its would-be cast boundary', () => {
    const base = unit('hero', 'player');
    const result = runBattleRecorded(snapshot(1250, { ...base, life: 1000, mana: 7, manaRegenPerSecond: 1,
      stats: { ...base.stats, attackSpeed: 250 },
      statuses: [status('freeze', { expiresAtMs: 1000 }),
        status('burn', { dotPerStack: 1000, expiresAtMs: 1000 })],
      skillOrder: ['skills-sorceress-fire-bolt'] }));
    expect(hero(result).life).toBe(0);
    expect(hero(result).mana).toBe(7);
    expect(result.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([]);
    expect(regen(result)).toEqual([]);
    expect(result.events.at(-1)).toMatchObject({ winner: 'enemy', simClockMs: 1000 });
  });

  it.each([1, 17, 250])('ignores extra status boundaries spaced %sms apart', step => {
    const input = snapshot(1250, unit('hero', 'player', { manaRegenPerSecond: 7.2 }));
    const enemy = input.enemyTeam[0];
    if (!enemy) throw new Error('Missing clock');
    const markers = Array.from({ length: Math.floor(1249 / step) }, (_, i) =>
      status(`marker-${String(i)}`, { expiresAtMs: (i + 1) * step }));
    const result = runBattleRecorded({ ...input, enemyTeam: [{ ...enemy, statuses: [...enemy.statuses, ...markers] }] });
    expect(hero(result).mana).toBe(9);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0, 12);
  });

  it('keeps the ninth MP when fractional status boundaries split 0ms → .1ms → .3ms → 1250ms', () => {
    const player = unit('hero', 'player', { manaRegenPerSecond: 7.2 });
    const unsplit = runBattleRecorded(snapshot(1250, player));
    const split = runBattleRecorded({ ...snapshot(1250, player), enemyTeam: [clock(1250, {
      statuses: [status('stun'), status('burn', { dotPerStack: 1000, expiresAtMs: 1250 }),
        status('marker-a', { expiresAtMs: 0.1 }), status('marker-b', { expiresAtMs: 0.3 })]
    })] });
    expect(hero(unsplit).mana).toBe(9);
    expect(hero(split).mana).toBe(9);
    expect(hero(split).manaRegenCarry).toBeCloseTo(0, 12);
  });

  it('makes earned MP available to an exact boundary cast and emits absolute MP before its action', () => {
    const id = spend(7);
    const result = runBattleRecorded(snapshot(2000, unit('hero', 'player', {
      manaRegenPerSecond: 4.16, statuses: [], skillOrder: [id] })));
    const index = result.events.findIndex(e => e.kind === 'action' && e.actor === 'hero');
    expect(regen(result)).toContainEqual(expect.objectContaining({ mana: 7, simClockMs: 1700 }));
    const earned = result.events.findIndex(e => e.kind === 'mana' && e.reason === 'regeneration');
    expect(earned).toBeLessThan(index);
    expect(result.events.slice(index, index + 2)).toEqual([
      expect.objectContaining({ kind: 'action', skillId: id, simClockMs: 1700 }),
      expect.objectContaining({ kind: 'mana', mana: 0, reason: 'cast', simClockMs: 1700 })
    ]);
    expect(hero(result).mana).toBe(1);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0.32, 12);
  });

  it('discards full time and overflow, then earns only the next 250ms after spending eight MP', () => {
    const base = unit('hero', 'player');
    const result = runBattleRecorded(snapshot(1250, { ...base, mana: 98, manaRegenPerSecond: 4.16,
      stats: { ...base.stats, manaMax: 100, attackSpeed: 250 },
      statuses: [status('stun', { expiresAtMs: 1000 })], skillOrder: [spend(8)] }));
    expect(regen(result).map(e => [e.simClockMs, e.kind === 'mana' ? e.mana : -1]))
      .toEqual([[500, 100], [1250, 93]]);
    expect(hero(result).mana).toBe(93);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0.04, 12);
    expect(hero(result).manaRegenExactCarry).toBe('0.04');
  });

  it('preserves fractional carry when a cast remains below cap', () => {
    const result = runBattleRecorded(snapshot(2000, unit('hero', 'player', {
      mana: 10, manaRegenPerSecond: 0.25, statuses: [], skillOrder: [spend(8)] })));
    expect(hero(result).mana).toBe(2);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0.5, 12);
  });

  it('seeds qualified fractional carry and signed compensation without granting a whole carried MP twice', () => {
    const result = runBattleRecorded(snapshot(125, unit('hero', 'player', {
      manaRegenPerSecond: 1, manaRegenCarry: 0.75, manaRegenCompensation: -0.125 })));
    expect(hero(result).mana).toBe(1);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0, 12);
  });

  it('preserves the ninth MP across actual 695ms and 555ms battle carry handoff at 7.2 MP/s', () => {
    const first = hero(runBattleRecorded(snapshot(695, unit('hero', 'player', { manaRegenPerSecond: 7.2 }))));
    const second = hero(runBattleRecorded(snapshot(555, unit('hero', 'player', {
      manaRegenPerSecond: 7.2, manaRegenCarry: first.manaRegenCarry ?? 0,
      manaRegenCompensation: first.manaRegenCompensation ?? 0 }))));
    expect(first.mana).toBe(5);
    expect.soft(second.mana).toBe(4);
    expect.soft(first.mana + second.mana).toBe(9);
    expect(second.manaRegenCarry).toBeCloseTo(0, 12);
  });

  it('preserves the ninth MP and exact metadata across actual 976ms and 274ms battle handoff', () => {
    const first = hero(runBattleRecorded(snapshot(976, unit('hero', 'player', { manaRegenPerSecond: 7.2 }))));
    const second = hero(runBattleRecorded(snapshot(274, unit('hero', 'player', {
      manaRegenPerSecond: 7.2, manaRegenCarry: first.manaRegenCarry ?? 0,
      manaRegenCompensation: first.manaRegenCompensation ?? 0,
      ...(first.manaRegenExactCarry === undefined ? {} : { manaRegenExactCarry: first.manaRegenExactCarry }) }))));
    expect(first.mana).toBe(7);
    expect.soft(first.manaRegenExactCarry).toBe('0.0272');
    expect.soft(second.mana).toBe(2);
    expect.soft(first.mana + second.mana).toBe(9);
    expect(second.manaRegenExactCarry).toBe('0');
  });

  it.each([1, -0.5])('resets invalid combined incoming legacy credit with compensation %s', compensation => {
    const result = runBattleRecorded(snapshot(100, unit('hero', 'player', {
      manaRegenPerSecond: 1, manaRegenCarry: 0.75, manaRegenCompensation: compensation })));
    expect.soft(hero(result).mana).toBe(0);
    expect.soft(hero(result).manaRegenCarry).toBeCloseTo(0.1, 12);
    expect(hero(result).manaRegenExactCarry).toBe('0.1');
  });

  it('prefers qualified exact incoming credit over contradictory legacy carry views', () => {
    const result = runBattleRecorded(snapshot(996, unit('hero', 'player', {
      manaRegenPerSecond: 1, manaRegenCarry: 0.75, manaRegenCompensation: -0.125,
      manaRegenExactCarry: '0.004' })));
    expect.soft(hero(result).mana).toBe(1);
    expect.soft(hero(result).manaRegenCarry).toBe(0);
    expect(hero(result).manaRegenExactCarry).toBe('0');
  });

  it('falls back to qualified legacy credit for malformed exact incoming credit', () => {
    const result = runBattleRecorded(snapshot(125, unit('hero', 'player', {
      manaRegenPerSecond: 1, manaRegenCarry: 0.75, manaRegenCompensation: -0.125,
      manaRegenExactCarry: '0.10' })));
    expect(hero(result).mana).toBe(1);
    expect(hero(result).manaRegenCarry).toBe(0);
    expect(hero(result).manaRegenExactCarry).toBe('0');
  });

  it.each([-1, 1, 1.5, NaN, Infinity, -Infinity])('ignores malformed incoming carry %s', carry => {
    const result = runBattleRecorded(snapshot(250, unit('hero', 'player', {
      manaRegenPerSecond: 4, manaRegenCarry: carry })));
    expect(hero(result).mana).toBe(1);
    expect(hero(result).manaRegenCarry).toBe(0);
  });

  it.each([NaN, Infinity, -Infinity])('ignores malformed incoming compensation %s', compensation => {
    const result = runBattleRecorded(snapshot(250, unit('hero', 'player', {
      manaRegenPerSecond: 1, manaRegenCarry: 0.75, manaRegenCompensation: compensation })));
    expect(hero(result).mana).toBe(1);
    expect(hero(result).manaRegenCompensation).toBe(0);
  });

  it.each([undefined, 0, -1, NaN, Infinity, -Infinity])('does not recover or add carry fields for rate %s', rate => {
    const base = unit('hero', 'player');
    const result = runBattleRecorded(snapshot(1000, { ...base,
      ...(rate === undefined ? {} : { manaRegenPerSecond: rate }) }));
    expect(regen(result)).toEqual([]);
    expect(hero(result).mana).toBe(0);
    expect(hero(result)).not.toHaveProperty('manaRegenCarry');
    expect(hero(result)).not.toHaveProperty('manaRegenCompensation');
    expect(hero(result)).not.toHaveProperty('manaRegenExactCarry');
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('does not recover or add carry fields for invalid manaMax %s', manaMax => {
    const base = unit('hero', 'player');
    const result = runBattleRecorded(snapshot(1000, { ...base, manaRegenPerSecond: 7.2,
      stats: { ...base.stats, manaMax } }));
    expect(regen(result)).toEqual([]);
    expect(hero(result).mana).toBe(0);
    expect(hero(result)).not.toHaveProperty('manaRegenCarry');
    expect(hero(result)).not.toHaveProperty('manaRegenExactCarry');
  });

  it('grants no zero-time recovery when a battle already has its winner', () => {
    const player = unit('hero', 'player', { manaRegenPerSecond: 7.2, manaRegenCarry: 0.5 });
    const result = runBattleRecorded({ seed: 7, playerTeam: [player], enemyTeam: [] });
    expect(hero(result).mana).toBe(0);
    expect(hero(result).manaRegenCarry).toBe(0.5);
    expect(regen(result)).toEqual([]);
    expect(result.events.at(-1)?.simClockMs).toBe(0);
  });

  it('recovers only through the inclusive simulation deadline, including a final partial interval', () => {
    const result = runBattleRecorded({ seed: 7, playerTeam: [unit('hero', 'player', { manaRegenPerSecond: 4.16 })],
      enemyTeam: [unit('enemy', 'enemy')] });
    expect(result.events.at(-1)).toMatchObject({ simClockMs: 60_000, winner: null });
    expect(hero(result).mana).toBe(249);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0.6, 12);
  });

  it('does not fabricate deadline recovery after the action cap', () => {
    const fast = unit('hero', 'player', { manaRegenPerSecond: 1 });
    const actors = Array.from({ length: 10 }, (_, i) => ({ ...fast, id: `unit-${String(i)}`,
      kind: i === 0 ? 'hero' as const : 'merc' as const,
      side: i === 9 ? 'enemy' as const : 'player' as const,
      stats: { ...fast.stats, attackSpeed: 263 } }));
    const result = runBattleRecorded({ seed: 7, playerTeam: actors.slice(0, 9), enemyTeam: actors.slice(9) });
    expect(result.events.filter(e => e.kind === 'stunned')).toHaveLength(MAX_ACTIONS);
    expect(result.events.at(-1)).toMatchObject({ simClockMs: 40_000, winner: null });
    expect(hero(result).mana).toBe(40);
  });
});

describe('death, spawn, cap side effects and determinism', () => {
  it('clears every existing carry view while MP remains full', () => {
    const base = unit('hero', 'player');
    const result = runBattleRecorded(snapshot(100, { ...base, mana: 100, manaRegenPerSecond: 1,
      manaRegenCarry: 0.75, manaRegenCompensation: -0.125, manaRegenExactCarry: '0.004',
      stats: { ...base.stats, manaMax: 100 } }));
    expect(hero(result).mana).toBe(100);
    expect(hero(result).manaRegenCarry).toBe(0);
    expect(hero(result).manaRegenCompensation).toBe(0);
    expect(hero(result).manaRegenExactCarry).toBe('0');
    expect(regen(result)).toEqual([]);
  });

  it('retains corpse carry snapshots without crediting the terminal interval', () => {
    const result = runBattleRecorded(snapshot(100, unit('hero', 'player', {
      life: 100, manaRegenPerSecond: 1, manaRegenCarry: 0.75,
      manaRegenCompensation: -0.125, manaRegenExactCarry: '0.004',
      statuses: [status('stun'), status('burn', { dotPerStack: 1000, expiresAtMs: 100 })] })));
    expect(hero(result).life).toBe(0);
    expect(hero(result).mana).toBe(0);
    expect(hero(result).manaRegenCarry).toBe(0.75);
    expect(hero(result).manaRegenCompensation).toBe(-0.125);
    expect(hero(result).manaRegenExactCarry).toBe('0.004');
    expect(regen(result)).toEqual([]);
  });

  it('settles periodic death/orphan closure before recovery while crediting living survivors through the terminal', () => {
    const doomed = unit('hero', 'player', { life: 1250, manaRegenPerSecond: 7.2,
      statuses: [status('stun'), status('poison', { dotPerStack: 1000, expiresAtMs: 1250 })] });
    const child = unit('child', 'player', { kind: 'summon', summonOwnerId: 'hero', manaRegenPerSecond: 7.2 });
    const merc = unit('merc', 'player', { kind: 'merc', manaRegenPerSecond: 4 });
    const result = runBattleRecorded({ seed: 7, playerTeam: [doomed, child, merc], enemyTeam: [unit('enemy', 'enemy')] });
    expect(result.result.playerTeam.map(u => [u.id, u.life, u.mana])).toEqual([
      ['hero', 0, 0], ['child', 0, 0], ['merc', 100_000, 5]
    ]);
    expect(regen(result)).toEqual([]);
    expect(regen(result, 'child')).toEqual([]);
    const death = result.events.findIndex(e => e.kind === 'death');
    const recovery = result.events.findIndex(e => e.kind === 'mana' && e.target === 'merc');
    expect(recovery).toBeGreaterThan(death);
    expect(result.events.at(-1)).toMatchObject({ winner: 'enemy', simClockMs: 1250 });
  });

  it('gives equal survivor MP at the same terminal time for action and periodic kills', () => {
    const base = unit('hero', 'player', { mana: 10, manaRegenPerSecond: 4.16 });
    const periodic = runBattleRecorded(snapshot(1700, base));
    const action = runBattleRecorded({ seed: 7, playerTeam: [{ ...base, statuses: [] }],
      enemyTeam: [unit('enemy', 'enemy', { life: 1 })] });
    for (const result of [periodic, action]) {
      expect(result.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 1700 });
      expect(hero(result).mana).toBe(17);
      expect(hero(result).manaRegenCarry).toBeCloseTo(0.072, 12);
    }
  });

  it('deletes the cumulative integral when a periodic kill orb caps MP before a later spend', () => {
    const base = unit('hero', 'player');
    const player = { ...base, mana: 99, manaRegenPerSecond: 1,
      stats: { ...base.stats, manaMax: 100, attackSpeed: 250 },
      statuses: [status('stun', { expiresAtMs: 1000 })], skillOrder: [spend(8)] };
    const orbSource = clock(750, { id: 'orb-source', kind: 'monster', tier: 'boss' });
    const result = runBattleRecorded({ ...snapshot(1250, player), enemyTeam: [orbSource, clock(1250)] });
    expect(result.events).toContainEqual(expect.objectContaining({ kind: 'mana', target: 'hero',
      reason: 'orb', mana: 100, simClockMs: 750 }));
    expect(hero(result).mana).toBe(92);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0.25, 12);
    expect(hero(result).manaRegenExactCarry).toBe('0.25');
  });

  it('deletes the cumulative integral when a summon refund caps its living owner', () => {
    registerSummon('fixture.recovery-refund-child', () => {
      const child = clock(750);
      return { ...child, stats: { ...child.stats, lifeMax: 750 } };
    });
    registerSkill({ id: 'fixture.recovery-summon', archetype: 'fixture', target: 'self', summonOnStart: true,
      minLevel: 1, manaCost: 50, cooldown: 100,
      effects: [{ kind: 'summon', summonId: 'fixture.recovery-refund-child', maxCount: 1 }] });
    const base = unit('hero', 'player');
    const result = runBattleRecorded(snapshot(1250, { ...base, mana: 100, manaRegenPerSecond: 1,
      stats: { ...base.stats, manaMax: 100, attackSpeed: 250 },
      statuses: [status('stun', { expiresAtMs: 1000 })], skillOrder: ['fixture.recovery-summon'] }));
    expect(result.events).toContainEqual(expect.objectContaining({ kind: 'mana', target: 'hero',
      reason: 'summon-refund', mana: 100, simClockMs: 750 }));
    expect(hero(result).mana).toBe(50);
    expect(hero(result).manaRegenCarry).toBeCloseTo(0.25, 12);
    expect(hero(result).manaRegenExactCarry).toBe('0.25');
  });

  it('starts recovery at an actual summon birth and never inherits the owner rate', () => {
    const base = unit('template', 'player');
    registerSummon('fixture.recovery-born-child', () => ({ ...base, manaRegenPerSecond: 4,
      stats: { ...base.stats, manaMax: 10, attackSpeed: 250 }, statuses: [], skillOrder: [spend(10)] }));
    registerSkill({ id: 'fixture.recovery-birth', archetype: 'fixture', target: 'self', summonOnStart: true,
      minLevel: 1, manaCost: 2, cooldown: 100,
      effects: [{ kind: 'summon', summonId: 'fixture.recovery-born-child', maxCount: 1 }] });
    const result = runBattleRecorded(snapshot(1250, { ...base, id: 'hero', manaRegenPerSecond: 4,
      stats: { ...base.stats, attackSpeed: 250 }, statuses: [status('stun', { appliedAtMs: 501 })],
      skillOrder: ['fixture.recovery-birth'] }));
    const birth = result.events.find(e => e.kind === 'summon');
    expect(birth).toMatchObject({ simClockMs: 500 });
    if (birth?.kind !== 'summon') throw new Error('Missing actual spawn');
    const child = result.result.playerTeam.find(u => u.id === birth.unit.id);
    expect(child?.mana).toBe(1);
    expect(child?.manaRegenCarry).toBeCloseTo(0, 12);
    expect(regen(result, birth.unit.id).map(e => e.simClockMs)).toEqual([1250]);
    // Ordinary production skeleton has no authored per-unit rate despite its recovering owner.
    const ordinary = runBattleRecorded(snapshot(1250, unit('hero', 'player', { mana: 15,
      manaRegenPerSecond: 7.2, skillOrder: ['necromancer.raise_skeleton'] })));
    const skeleton = ordinary.result.playerTeam.find(u => u.kind === 'summon');
    expect(skeleton).toBeDefined();
    expect(skeleton).not.toHaveProperty('manaRegenPerSecond');
    expect(regen(ordinary, skeleton?.id)).toEqual([]);
  });

  it('keeps stochastic results and the next combat RNG draw unchanged when recovery cannot affect actions', () => {
    const originalCreateRng = createRng;
    const streams: ReturnType<typeof createRng>[] = [];
    vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
      const rng = originalCreateRng(seed);
      streams.push(rng);
      return rng;
    });
    const base = unit('hero', 'player', { statuses: [], stats: {
      ...unit('stats', 'player').stats, attack: 20, critChance: 0.5, magicDodge: 0.25 } });
    const input = snapshot(5000, base);
    const plain = runBattleRecorded(input);
    const plainNext = streams[0]?.next();
    const recovered = runBattleRecorded({ ...input, playerTeam: [{ ...base, manaRegenPerSecond: 7.2 }] });
    const recoveredNext = streams[1]?.next();
    expect(plainNext).toBeDefined();
    expect(recoveredNext).toBe(plainNext);
    const gameplay = (r: RecordedBattleResult) => r.events.filter(e => e.kind !== 'mana')
      .map(e => ({ ...e, uiDelayMs: 0 }));
    expect(gameplay(recovered)).toEqual(gameplay(plain));
    expect(hero(recovered).mana).toBeGreaterThan(0);
  });
});
