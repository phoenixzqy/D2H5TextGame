import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { legacyRecording } from '@/test/combat-oracle';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import type { DamageType, DerivedStats } from '../types/attributes';
import { composeHeroRecovery } from '../progression/warmth';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';

/** Compare legacy fire output while permitting only an own, exact-zero Lightning projection. */
function fireDamageProjection(actual: Readonly<Partial<Record<string, number>>> | undefined) {
  if (!actual || !Object.prototype.hasOwnProperty.call(actual, 'lightning')) return actual;
  expect(actual.lightning).toBe(0);
  const { lightning: _zero, ...remaining } = actual;
  return remaining;
}

const MASTERY = 'skills-sorceress-fire-mastery';
const WARMTH = 'skills-sorceress-warmth';
const stats: DerivedStats = {
  life: 200, lifeMax: 200, mana: 200, manaMax: 200, attack: 1, defense: 0, magicResist: 0,
  attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
  magicFind: 0, goldFind: 0,
  resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
};
const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs
});
const unit = (id: string, side: CombatUnit['side'], overrides: Partial<CombatUnit> = {}): CombatUnit =>
  ({ id, name: id, side, level: 40, tier: 'trash', stats, life: 200, mana: 200,
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...overrides });

/** Imported ranks/stun/resources isolate real spell consumption, never campaign balance. */
function snapshot(masteryRank = 20, warmthRank = 0): CombatSnapshot {
  const skillLevels = { [MASTERY]: masteryRank, [WARMTH]: warmthRank, 'skills-sorceress-fire-bolt': 20 };
  const { increasedDamagePct } = composeHeroRecovery({
    classId: 'sorceress', level: 40, effectiveEnergy: 20, skillLevels
  });
  return { seed: 7,
    playerTeam: [unit('sorceress', 'player', { kind: 'hero', mana: 8, skillLevels,
      increasedDamagePct, skillOrder: ['skills-sorceress-fire-bolt'], statuses: [hold(1701)] })],
    enemyTeam: [unit('target', 'enemy', { life: 500,
      stats: { ...stats, life: 500, lifeMax: 500 }, statuses: [hold()] })] };
}
const withHero = (input: CombatSnapshot, fields: Partial<CombatUnit>): CombatSnapshot =>
  ({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, ...fields })) });
const withTarget = (input: CombatSnapshot, fields: Partial<CombatUnit>): CombatSnapshot =>
  ({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, ...fields })) });

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('P07a02B real Fire Bolt with automatic Fire Mastery and Warmth', () => {
  it.each([
    { rank: 0, warmth: 0, hit: 106, dots: [[3400, 17], [4700, 13]], hp: 364 },
    { rank: 1, warmth: 0, hit: 110, dots: [[3400, 18], [4700, 15]], hp: 357 },
    { rank: 10, warmth: 0, hit: 148, dots: [[3400, 23], [4700, 19]], hp: 310 },
    { rank: 20, warmth: 0, hit: 190, dots: [[3400, 32], [4700, 25]], hp: 253 },
    { rank: 1, warmth: 1, hit: 111, dots: [[3400, 18], [4700, 15]], hp: 356 },
    { rank: 20, warmth: 20, hit: 212, dots: [[3400, 35], [4700, 28]], hp: 225 }
  ])('uses literal rank$rank/Warmth$warmth direct fire and Burn once', ({ rank, warmth, hit, dots, hp }) => {
    expect(getSkill('skills-sorceress-fire-bolt')).toMatchObject({ id: 'sorceress.fire_bolt',
      manaCost: 8, effects: [{ kind: 'damage', damageType: 'fire', base: [30, 45],
        perRank: [4, 4], applyStatus: { id: 'burn', dotPctOfDamage: 0.1 } }] });
    const input = snapshot(rank, warmth);
    const before = structuredClone(input);
    const spell = structuredClone(getSkill('sorceress.fire_bolt'));
    const passive = structuredClone(getSkill('sorceress.fire_mastery'));
    const result = runBattleRecorded(input);
    // Seed7 range106; final floor(106*(1+.04*rank+.01*warmth)). Burn rate=floor(hit*.1).
    expect.soft(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: 'sorceress.fire_bolt', simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'sorceress', target: 'target', amount: hit,
        damageType: 'fire', crit: false, dodged: false, simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount])).toEqual(dots);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(hp);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
    expect(result.result.playerTeam[0]?.activeBuffIds).toEqual([]);
    expect(runBattle(input)).toEqual(result.result);
    expect(runBattleRecorded(input)).toEqual(result);
    expect(input).toEqual(before);
    expect(getSkill('sorceress.fire_bolt')).toEqual(spell);
    expect(getSkill('sorceress.fire_mastery')).toEqual(passive);
  });

  it('adds both passives before combo, crit, resistance, ordinary defense and floor', () => {
    const input = withTarget(withHero(snapshot(20, 20), { stats: { ...stats, critChance: 1, critDamage: 2 } }), {
      stats: { ...stats, life: 500, lifeMax: 500, defense: 7,
        resistances: { ...stats.resistances, fire: 25 } },
      statuses: [hold(), { id: 'paralyze', sourceId: 'fixture', stacks: 1, remaining: -1 }]
    });
    const result = runBattleRecorded(input);
    // floor(106*2*1.2*2*.75-7)=374. Burn37/s integrates1700ms then1300ms.
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 374, crit: true, dodged: false, simClockMs: 1700 })
    ]);
    expect.soft(result.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount]))
      .toEqual([[3400, 62], [4700, 49]]);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(15);
  });

  it.each(['skills-sorceress-fire-mastery', 'sorceress.fire_mastery'])(
    'never executes imported passive %s or spends a passive action/resource/CD/marker', id => {
      expect(getSkill(id)).toMatchObject({ trigger: 'passive', manaCost: 0, cooldown: 0 });
      const result = runBattleRecorded(withHero(snapshot(), { skillOrder: [id, 'skills-sorceress-fire-bolt'] }));
      expect.soft(result.events.filter(e => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: 'sorceress.fire_bolt', simClockMs: 1700 })
      ]);
      expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 190 })]);
      expect(result.events.filter(e => e.kind === 'buff')).toEqual([]);
      expect(result.result.playerTeam[0]?.activeBuffIds).toEqual([]);
      expect(result.result.playerTeam[0]?.cooldowns).toEqual({});
      expect(result.result.playerTeam[0]?.mana).toBe(0);
    });

  it('retains the same hit/range/crit/status RNG stream with unchanged action/death topology', () => {
    const random = rngModule.createRng(7);
    const range = vi.spyOn(random, 'nextInt');
    const chance = vi.spyOn(random, 'chance');
    vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
    expect.soft(runBattle(snapshot(20, 20)).enemyTeam[0]?.life).toBe(225);
    expect(range.mock.calls).toEqual([[106, 121]]);
    expect(chance.mock.calls).toEqual([[0.85], [0], [1]]);
    expect(random.next()).toBe(0.5214452685322613);
  });

  it.each(['cold', 'lightning', 'arcane', 'poison', 'physical', 'thorns'] as const)(
    'does not increase fixed100 %s probe damage or mutate attack', (damageType: DamageType) => {
      registerSkill({ id: 'fixture.mastery-probe', archetype: 'fixture', target: 'single-enemy',
        manaCost: 0, cooldown: 0, minLevel: 1, effects: [{ kind: 'damage', damageType, base: [100, 100] }] });
      const result = runBattleRecorded(withHero(snapshot(20, 20), { skillOrder: ['fixture.mastery-probe'] }));
      expect(result.events.filter(e => e.kind === 'damage')).toEqual([
        expect.objectContaining({ damageType, amount: 100, crit: false, dodged: false, simClockMs: 1700 })
      ]);
      expect(result.result.enemyTeam[0]?.life).toBe(400);
      expect(result.result.playerTeam[0]?.stats).toEqual(stats);
      expect(result.result.playerTeam[0]?.mana).toBe(8);
    });

  it('preserves pre-existing Burn potency/source/start/longer expiry and caps stacks', () => {
    const legacy: ActiveStatus = { id: 'burn', sourceId: 'old', appliedAtMs: 0,
      expiresAtMs: 100000, remaining: 100, stacks: 4, dotPerStack: 7, damageType: 'fire' };
    const input = withTarget(withHero(snapshot(20, 20), { mana: 16, statuses: [hold(3401)] }), {
      life: 10000, stats: { ...stats, life: 10000, lifeMax: 10000 }, statuses: [hold(), legacy]
    });
    const result = runBattleRecorded(input);
    // Two real spell hits212+224; existing rate7/stacks4→5 integrates2088; no replacement/multiplication.
    expect.soft(result.events.filter(e => e.kind === 'damage').map(e => [e.simClockMs, e.amount]))
      .toEqual([[1700, 212], [3400, 224]]);
    expect.soft(result.events.filter(e => e.kind === 'dot').reduce((sum, e) => sum + e.amount, 0)).toBe(2088);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(7476);
    expect(result.result.enemyTeam[0]?.statuses).toEqual([hold(), { ...legacy, stacks: 5 }]);
  });
});

describe('P07a02B canonical fresh Burn and allied boundaries', () => {
  it('retains initial enhanced Burn rate21 when second hit224 refreshes its stacks/expiry', () => {
    const input = withTarget(withHero(snapshot(20, 20), { mana: 16, statuses: [hold(3401)] }), {
      life: 1000, stats: { ...stats, life: 1000, lifeMax: 1000 }
    });
    const before = structuredClone(input);
    const result = runBattleRecorded(input);
    expect.soft(result.events.filter(e => e.kind === 'damage').map(e => [e.simClockMs, e.amount]))
      .toEqual([[1700, 212], [3400, 224]]);
    // Initial21/s survives refresh: floor cumulative35.7+71.4+54.6=161, no second fire multiplier.
    expect.soft(result.events.filter(e => e.kind === 'dot').map(e => [e.simClockMs, e.amount]))
      .toEqual([[3400, 35], [5100, 72], [6400, 54]]);
    expect.soft(result.result.enemyTeam[0]?.life).toBe(403);
    expect(result.result.enemyTeam[0]?.statuses).toEqual([hold()]);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
    expect(input).toEqual(before);
  });

  it('does not inherit hero Mastery/Warmth on a second actual allied Fire Bolt', () => {
    const input = snapshot(20, 20);
    const result = runBattleRecorded({ ...input, playerTeam: [...input.playerTeam,
      unit('ally', 'player', { kind: 'merc', mana: 8, stats: { ...stats, attackSpeed: 87 },
        skillOrder: ['skills-sorceress-fire-bolt'], skillLevels: { 'sorceress.fire_bolt': 20 },
        statuses: [hold(1805)] })] });
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'sorceress', amount: 212, simClockMs: 1700 }),
      expect.objectContaining({ source: 'ally', amount: 112, simClockMs: 1804 })
    ]);
    expect(result.result.playerTeam[1]?.increasedDamagePct).toBeUndefined();
    expect(result.result.playerTeam.map(u => u.mana)).toEqual([0, 0]);
  });
});

// Complete actual prepatch recording: Stage A 2fe7f4e, seed7, Mastery0/Warmth1.
// Captured once before runtime changes; frozen literal is independent of the new composition.
describe('P07a02B unaffected prepatch full recording', () => {
  it('preserves every recorded event and final field for Warmth-only input', () => {
    const expected = {"events":[{"kind":"turn-start","turn":1,"simClockMs":0,"uiDelayMs":200},{"kind":"stunned","target":"target","simClockMs":1700,"uiDelayMs":1700},{"kind":"action","actor":"sorceress","skillId":"sorceress.fire_bolt","simClockMs":1700,"uiDelayMs":50},{"kind":"mana","target":"sorceress","mana":0,"reason":"cast","simClockMs":1700,"uiDelayMs":50},{"kind":"damage","source":"sorceress","target":"target","damageType":"fire","amount":107,"crit":false,"dodged":false,"simClockMs":1700,"uiDelayMs":50},{"kind":"status","target":"target","statusId":"burn","simClockMs":1700,"uiDelayMs":50},{"kind":"dot","target":"target","amount":17,"simClockMs":3400,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":3400,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":3400,"uiDelayMs":50},{"kind":"dot","target":"target","amount":13,"simClockMs":4700,"uiDelayMs":1300},{"kind":"turn-start","turn":2,"simClockMs":5100,"uiDelayMs":400},{"kind":"stunned","target":"target","simClockMs":5100,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":5100,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":6800,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":6800,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":8500,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":8500,"uiDelayMs":50},{"kind":"turn-start","turn":3,"simClockMs":10200,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":10200,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":10200,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":11900,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":11900,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":13600,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":13600,"uiDelayMs":50},{"kind":"turn-start","turn":4,"simClockMs":15300,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":15300,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":15300,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":17000,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":17000,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":18700,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":18700,"uiDelayMs":50},{"kind":"turn-start","turn":5,"simClockMs":20400,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":20400,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":20400,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":22100,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":22100,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":23800,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":23800,"uiDelayMs":50},{"kind":"turn-start","turn":6,"simClockMs":25500,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":25500,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":25500,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":27200,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":27200,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":28900,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":28900,"uiDelayMs":50},{"kind":"turn-start","turn":7,"simClockMs":30600,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":30600,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":30600,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":32300,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":32300,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":34000,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":34000,"uiDelayMs":50},{"kind":"turn-start","turn":8,"simClockMs":35700,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":35700,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":35700,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":37400,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":37400,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":39100,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":39100,"uiDelayMs":50},{"kind":"turn-start","turn":9,"simClockMs":40800,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":40800,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":40800,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":42500,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":42500,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":44200,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":44200,"uiDelayMs":50},{"kind":"turn-start","turn":10,"simClockMs":45900,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":45900,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":45900,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":47600,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":47600,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":49300,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":49300,"uiDelayMs":50},{"kind":"turn-start","turn":11,"simClockMs":51000,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":51000,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":51000,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":52700,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":52700,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":54400,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":54400,"uiDelayMs":50},{"kind":"turn-start","turn":12,"simClockMs":56100,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":56100,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":56100,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":57800,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":57800,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":59500,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":59500,"uiDelayMs":50},{"kind":"turn-start","turn":13,"simClockMs":60000,"uiDelayMs":500},{"kind":"end","winner":null,"simClockMs":60000,"uiDelayMs":50}],"result":{"events":[{"kind":"turn-start","turn":1},{"kind":"stunned","target":"target"},{"kind":"action","actor":"sorceress","skillId":"sorceress.fire_bolt"},{"kind":"mana","target":"sorceress","mana":0,"reason":"cast"},{"kind":"damage","source":"sorceress","target":"target","damageType":"fire","amount":107,"crit":false,"dodged":false},{"kind":"status","target":"target","statusId":"burn"},{"kind":"dot","target":"target","amount":17},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"dot","target":"target","amount":13},{"kind":"turn-start","turn":2},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":3},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":4},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":5},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":6},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":7},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":8},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":9},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":10},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":11},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":12},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":13},{"kind":"end","winner":null}],"winner":null,"playerTeam":[{"id":"sorceress","name":"sorceress","side":"player","level":40,"tier":"trash","stats":{"life":200,"lifeMax":200,"mana":200,"manaMax":200,"attack":1,"defense":0,"magicResist":0,"attackSpeed":100,"critChance":0,"critDamage":1.5,"physDodge":0,"magicDodge":0,"magicFind":0,"goldFind":0,"resistances":{"fire":0,"cold":0,"lightning":0,"poison":0,"arcane":0,"physical":0}},"life":200,"mana":0,"statuses":[{"id":"stun","sourceId":"fixture","stacks":1,"remaining":-1,"appliedAtMs":1701}],"cooldowns":{},"skillOrder":["skills-sorceress-fire-bolt"],"activeBuffIds":[],"enraged":false,"kind":"hero","skillLevels":{"skills-sorceress-fire-mastery":0,"skills-sorceress-warmth":1,"skills-sorceress-fire-bolt":20},"increasedDamagePct":{"fire":0.01},"gridPosition":{"row":1,"col":1}}],"enemyTeam":[{"id":"target","name":"target","side":"enemy","level":40,"tier":"trash","stats":{"life":500,"lifeMax":500,"mana":200,"manaMax":200,"attack":1,"defense":0,"magicResist":0,"attackSpeed":100,"critChance":0,"critDamage":1.5,"physDodge":0,"magicDodge":0,"magicFind":0,"goldFind":0,"resistances":{"fire":0,"cold":0,"lightning":0,"poison":0,"arcane":0,"physical":0}},"life":363,"mana":200,"statuses":[{"id":"stun","sourceId":"fixture","stacks":1,"remaining":-1,"appliedAtMs":0}],"cooldowns":{},"skillOrder":[],"activeBuffIds":[],"enraged":false,"gridPosition":{"row":1,"col":1}}],"rounds":13}};
    const actual = legacyRecording(runBattleRecorded(snapshot(0, 1)));
    // Only the exact hero's optional zero field may differ; all events and other fields stay exact.
    expect({ ...actual, result: { ...actual.result, playerTeam: actual.result.playerTeam.map(hero =>
      hero.id === 'sorceress' ? { ...hero, increasedDamagePct: fireDamageProjection(hero.increasedDamagePct) } : hero
    ) } }).toEqual(expected);
  });
});
