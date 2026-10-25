import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { legacyRecording } from '@/test/combat-oracle';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import type { DamageType, DerivedStats } from '../types/attributes';
import { composeHeroRecovery } from '../progression/warmth';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

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

import * as rngModule from '../rng';
import * as statusModule from './status';

const MASTERY = 'skills-sorceress-lightning-mastery';
const SPELL = 'skills-sorceress-thunder-storm';
function snapshot(rank = 20): CombatSnapshot {
  const skillLevels = { [MASTERY]: rank, [SPELL]: 20 };
  const { increasedDamagePct } = composeHeroRecovery({ classId: 'sorceress', level: 40,
    effectiveEnergy: 20, skillLevels });
  return { seed: 7,
    playerTeam: [unit('sorceress', 'player', { kind: 'hero', mana: 30, skillLevels,
      increasedDamagePct, skillOrder: [SPELL], statuses: [hold(1701)] })],
    enemyTeam: [unit('target', 'enemy', { life: 500,
      stats: { ...stats, life: 500, lifeMax: 500 }, statuses: [hold()] })] };
}
const withHero = (input: CombatSnapshot, fields: Partial<CombatUnit>): CombatSnapshot =>
  ({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, ...fields })) });
const withTarget = (input: CombatSnapshot, fields: Partial<CombatUnit>): CombatSnapshot =>
  ({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, ...fields })) });
function fixed(type: DamageType, rank = 20) {
  registerSkill({ id: 'fixture.lightning-probe', archetype: 'fixture', target: 'single-enemy',
    manaCost: 0, cooldown: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
  return withHero(snapshot(rank), { skillOrder: ['fixture.lightning-probe'] });
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('P07a03B allocated Lightning Mastery direct damage', () => {
  it.each([{ rank: 0, hit: 205 }, { rank: 1, hit: 213 }, { rank: 10, hit: 287 },
    { rank: 20, hit: 369 }])('real Thunder Storm rank$rank hits$hit with unchanged Paralyze/resources', ({ rank, hit }) => {
    expect(getSkill(SPELL)).toMatchObject({ id: 'sorceress.thunder_storm', manaCost: 30,
      cooldown: 4, effects: [{ kind: 'damage', damageType: 'lightning', base: [70, 110],
        perRank: [7, 7], applyStatus: { id: 'paralyze' } }] });
    const input = snapshot(rank), before = structuredClone(input);
    const spell = structuredClone(getSkill(SPELL)), passive = structuredClone(getSkill(MASTERY));
    const result = runBattleRecorded(input);
    // Seed7 consumes hit then range:203+floor(.06195825757458806*41)=205.
    expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'sorceress', target: 'target', damageType: 'lightning',
        amount: hit, crit: false, dodged: false, simClockMs: 1700 })]);
    expect.soft(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'sorceress', skillId: 'sorceress.thunder_storm', simClockMs: 1700 })]);
    expect.soft(result.events.filter(e => e.kind === 'status')).toEqual([
      expect.objectContaining({ target: 'target', statusId: 'paralyze', simClockMs: 1700 })]);
    expect(result.events.filter(e => e.kind === 'dot' || e.kind === 'buff')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(500 - hit);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
    expect(result.result.playerTeam[0]?.life).toBe(200);
    expect(result.result.playerTeam[0]?.stats).toEqual(stats);
    expect(runBattle(input)).toEqual(result.result);
    expect(runBattleRecorded(input)).toEqual(result);
    expect(input).toEqual(before);
    expect(getSkill(SPELL)).toEqual(spell); expect(getSkill(MASTERY)).toEqual(passive);
  });

  it.each([{ rank: 1, hit: 104 }, { rank: 20, hit: 180 }])(
    'neutral fixed lightning100 at rank$rank gives$hit', ({ rank, hit }) => {
      const result = runBattleRecorded(fixed('lightning', rank));
      expect(result.events.filter(e => e.kind === 'damage')).toEqual([
        expect.objectContaining({ damageType: 'lightning', amount: hit, crit: false, dodged: false })]);
      expect(result.result.playerTeam[0]?.stats).toEqual(stats);
      expect(result.result.playerTeam[0]?.mana).toBe(30);
    });

  it.each(['fire', 'cold', 'arcane', 'poison', 'physical', 'thorns'] as const)(
    'leaves neutral fixed100 %s and authoritative Attack unchanged', type => {
      const result = runBattleRecorded(fixed(type));
      expect(result.events.filter(e => e.kind === 'damage')).toEqual([
        expect.objectContaining({ damageType: type, amount: 100, crit: false, dodged: false })]);
      expect(result.result.playerTeam[0]?.stats).toEqual(stats);
      expect(result.result.playerTeam[0]?.mana).toBe(30);
    });

  it('leaves the basic Attack100 hit and resources unchanged', () => {
    const result = runBattleRecorded(withHero(snapshot(), { skillOrder: [], stats: { ...stats, attack: 100 } }));
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 100 })]);
    expect(result.result.playerTeam[0]?.stats.attack).toBe(100);
    expect(result.result.playerTeam[0]?.mana).toBe(30);
  });

  it('applies Lightning increase before chill combo, crit, resistance, magic mitigation and floor', () => {
    const input = withTarget(withHero(fixed('lightning'), { stats: { ...stats, critChance: 1, critDamage: 2 } }), {
      stats: { ...stats, life: 500, lifeMax: 500, defense: 999, magicResist: 7,
        resistances: { ...stats.resistances, lightning: 25 } },
      statuses: [hold(), { id: 'chill', sourceId: 'fixture', stacks: 1, remaining: -1 }] });
    // floor(100*1.8*1.3*2*.75-7)=344; ordinary defense999 must not affect lightning.
    expect(runBattleRecorded(input).events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 344, damageType: 'lightning', crit: true, dodged: false })]);
  });

  it.each([MASTERY, 'sorceress.lightning_mastery'])(
    'never executes passive%s or pays an action/resource/CD/marker', id => {
      expect(getSkill(id)).toMatchObject({ trigger: 'passive', manaCost: 0, cooldown: 0 });
      const result = runBattleRecorded(withHero(snapshot(), { skillOrder: [id, SPELL] }));
      expect.soft(result.events.filter(e => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: 'sorceress.thunder_storm', simClockMs: 1700 })]);
      expect.soft(result.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 369 })]);
      expect(result.events.filter(e => e.kind === 'buff')).toEqual([]);
      expect(result.result.playerTeam[0]?.activeBuffIds).toEqual([]);
      expect(result.result.playerTeam[0]?.cooldowns).toEqual({});
      expect(result.result.playerTeam[0]?.mana).toBe(0);
      expect(result.result.playerTeam[0]?.statuses).toEqual([hold(1701)]);
    });

  it.each([0, 20])('preserves exact hit/range/crit/status RNG stream at allocated%s', rank => {
    const random = rngModule.createRng(7);
    const range = vi.spyOn(random, 'nextInt'), chance = vi.spyOn(random, 'chance');
    vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
    runBattleRecorded(snapshot(rank));
    expect(range.mock.calls).toEqual([[203, 243]]);
    expect(chance.mock.calls).toEqual([[0.85], [0], [1]]);
    expect(random.next()).toBe(0.5214452685322613);
  });

  it.each([0, 20])('preserves Paralyze initial timing, stacks and cooldown at allocated%s', rank => {
    const apply = vi.spyOn(statusModule, 'applyStatusWithResult');
    runBattleRecorded(snapshot(rank));
    const application = apply.mock.results[0]?.value as statusModule.StatusApplicationResult | undefined;
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply.mock.calls[0]?.[1]).toEqual({ id: 'paralyze', sourceId: 'sorceress', simClockMs: 1700, damageType: 'lightning' });
    expect(application?.applied).toBe(true);
    expect(application?.unit).toHaveProperty('statuses', [hold(),
      { id: 'paralyze', stacks: 1, remaining: 1, sourceId: 'sorceress', appliedAtMs: 1700,
        expiresAtMs: 2700, damageType: 'lightning' },
      { id: 'paralyze-cd', stacks: 1, remaining: 5, sourceId: 'sorceress', appliedAtMs: 1700, expiresAtMs: 6700 }]);
  });

  it.each([0, 20])('preserves Paralyze reapplication failure and RNG at allocated%s', rank => {
    const cd: ActiveStatus = { id: 'paralyze-cd', stacks: 1, remaining: 100, sourceId: 'old', appliedAtMs: 0, expiresAtMs: 100000 };
    const apply = vi.spyOn(statusModule, 'applyStatusWithResult');
    const random = rngModule.createRng(7), chance = vi.spyOn(random, 'chance');
    vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
    runBattleRecorded(withTarget(snapshot(rank), { statuses: [hold(), cd] }));
    const application = apply.mock.results[0]?.value as statusModule.StatusApplicationResult | undefined;
    expect(chance.mock.calls).toEqual([[0.85], [0], [1], [0.5]]);
    // Fifth seed7 draw .5214452685 fails the existing 50% reapplication check.
    expect(apply).toHaveBeenCalledTimes(1);
    expect(application?.applied).toBe(false);
    expect(application?.unit).toBe(apply.mock.calls[0]?.[0]);
    expect(application?.unit).toHaveProperty('statuses', [hold(), cd]);
  });

  it('does not inherit the hero modifier on an allied real Thunder Storm', () => {
    const input = snapshot();
    const result = runBattleRecorded({ ...input, playerTeam: [...input.playerTeam,
      unit('ally', 'player', { kind: 'merc', mana: 30, stats: { ...stats, attackSpeed: 87 },
        skillOrder: [SPELL], skillLevels: { [SPELL]: 20 }, statuses: [hold(1805)] })],
      enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 1000, stats: { ...u.stats, life: 1000, lifeMax: 1000 } })) });
    // Fifth seed draw hits; sixth .405521688 gives203+floor(.405521688*41)=219.
    expect(result.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'sorceress', amount: 369, simClockMs: 1700 }),
      expect.objectContaining({ source: 'ally', amount: 219, simClockMs: 1804 })]);
    expect(result.result.playerTeam[1]?.increasedDamagePct).toBeUndefined();
    expect(result.result.playerTeam.map(u => u.mana)).toEqual([0, 0]);
  });
});

// Complete actual prepatch recording at2002326; fixed neutral consumer map, not current-composer output.
describe('P07a03B unchanged full neutral Thunder Storm recording', () => {
  it('preserves every event/delay/final field for the fixed explicit-zero control', () => {
    const expected = {"events":[{"kind":"turn-start","turn":1,"simClockMs":0,"uiDelayMs":200},{"kind":"stunned","target":"target","simClockMs":1700,"uiDelayMs":1700},{"kind":"action","actor":"sorceress","skillId":"sorceress.thunder_storm","simClockMs":1700,"uiDelayMs":50},{"kind":"mana","target":"sorceress","mana":0,"reason":"cast","simClockMs":1700,"uiDelayMs":50},{"kind":"damage","source":"sorceress","target":"target","damageType":"lightning","amount":205,"crit":false,"dodged":false,"simClockMs":1700,"uiDelayMs":50},{"kind":"status","target":"target","statusId":"paralyze","simClockMs":1700,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":3400,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":3400,"uiDelayMs":50},{"kind":"turn-start","turn":2,"simClockMs":5100,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":5100,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":5100,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":6800,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":6800,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":8500,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":8500,"uiDelayMs":50},{"kind":"turn-start","turn":3,"simClockMs":10200,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":10200,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":10200,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":11900,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":11900,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":13600,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":13600,"uiDelayMs":50},{"kind":"turn-start","turn":4,"simClockMs":15300,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":15300,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":15300,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":17000,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":17000,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":18700,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":18700,"uiDelayMs":50},{"kind":"turn-start","turn":5,"simClockMs":20400,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":20400,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":20400,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":22100,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":22100,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":23800,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":23800,"uiDelayMs":50},{"kind":"turn-start","turn":6,"simClockMs":25500,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":25500,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":25500,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":27200,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":27200,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":28900,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":28900,"uiDelayMs":50},{"kind":"turn-start","turn":7,"simClockMs":30600,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":30600,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":30600,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":32300,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":32300,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":34000,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":34000,"uiDelayMs":50},{"kind":"turn-start","turn":8,"simClockMs":35700,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":35700,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":35700,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":37400,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":37400,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":39100,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":39100,"uiDelayMs":50},{"kind":"turn-start","turn":9,"simClockMs":40800,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":40800,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":40800,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":42500,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":42500,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":44200,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":44200,"uiDelayMs":50},{"kind":"turn-start","turn":10,"simClockMs":45900,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":45900,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":45900,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":47600,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":47600,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":49300,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":49300,"uiDelayMs":50},{"kind":"turn-start","turn":11,"simClockMs":51000,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":51000,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":51000,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":52700,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":52700,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":54400,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":54400,"uiDelayMs":50},{"kind":"turn-start","turn":12,"simClockMs":56100,"uiDelayMs":1700},{"kind":"stunned","target":"target","simClockMs":56100,"uiDelayMs":50},{"kind":"stunned","target":"sorceress","simClockMs":56100,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":57800,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":57800,"uiDelayMs":50},{"kind":"stunned","target":"target","simClockMs":59500,"uiDelayMs":1700},{"kind":"stunned","target":"sorceress","simClockMs":59500,"uiDelayMs":50},{"kind":"turn-start","turn":13,"simClockMs":60000,"uiDelayMs":500},{"kind":"end","winner":null,"simClockMs":60000,"uiDelayMs":50}],"result":{"events":[{"kind":"turn-start","turn":1},{"kind":"stunned","target":"target"},{"kind":"action","actor":"sorceress","skillId":"sorceress.thunder_storm"},{"kind":"mana","target":"sorceress","mana":0,"reason":"cast"},{"kind":"damage","source":"sorceress","target":"target","damageType":"lightning","amount":205,"crit":false,"dodged":false},{"kind":"status","target":"target","statusId":"paralyze"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":2},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":3},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":4},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":5},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":6},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":7},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":8},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":9},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":10},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":11},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":12},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"stunned","target":"target"},{"kind":"stunned","target":"sorceress"},{"kind":"turn-start","turn":13},{"kind":"end","winner":null}],"winner":null,"playerTeam":[{"id":"sorceress","name":"sorceress","side":"player","level":40,"tier":"trash","stats":{"life":200,"lifeMax":200,"mana":200,"manaMax":200,"attack":1,"defense":0,"magicResist":0,"attackSpeed":100,"critChance":0,"critDamage":1.5,"physDodge":0,"magicDodge":0,"magicFind":0,"goldFind":0,"resistances":{"fire":0,"cold":0,"lightning":0,"poison":0,"arcane":0,"physical":0}},"life":200,"mana":0,"statuses":[{"id":"stun","sourceId":"fixture","stacks":1,"remaining":-1,"appliedAtMs":1701}],"cooldowns":{},"skillOrder":["skills-sorceress-thunder-storm"],"activeBuffIds":[],"enraged":false,"kind":"hero","skillLevels":{"skills-sorceress-thunder-storm":20},"increasedDamagePct":{"fire":0,"lightning":0},"gridPosition":{"row":1,"col":1}}],"enemyTeam":[{"id":"target","name":"target","side":"enemy","level":40,"tier":"trash","stats":{"life":500,"lifeMax":500,"mana":200,"manaMax":200,"attack":1,"defense":0,"magicResist":0,"attackSpeed":100,"critChance":0,"critDamage":1.5,"physDodge":0,"magicDodge":0,"magicFind":0,"goldFind":0,"resistances":{"fire":0,"cold":0,"lightning":0,"poison":0,"arcane":0,"physical":0}},"life":295,"mana":200,"statuses":[{"id":"stun","sourceId":"fixture","stacks":1,"remaining":-1,"appliedAtMs":0}],"cooldowns":{},"skillOrder":[],"activeBuffIds":[],"enraged":false,"gridPosition":{"row":1,"col":1}}],"rounds":13}};
    const input: CombatSnapshot = {"seed":7,"playerTeam":[{"id":"sorceress","name":"sorceress","side":"player","level":40,"tier":"trash","stats":{"life":200,"lifeMax":200,"mana":200,"manaMax":200,"attack":1,"defense":0,"magicResist":0,"attackSpeed":100,"critChance":0,"critDamage":1.5,"physDodge":0,"magicDodge":0,"magicFind":0,"goldFind":0,"resistances":{"fire":0,"cold":0,"lightning":0,"poison":0,"arcane":0,"physical":0}},"life":200,"mana":30,"statuses":[{"id":"stun","sourceId":"fixture","stacks":1,"remaining":-1,"appliedAtMs":1701}],"cooldowns":{},"skillOrder":["skills-sorceress-thunder-storm"],"activeBuffIds":[],"enraged":false,"kind":"hero","skillLevels":{"skills-sorceress-thunder-storm":20},"increasedDamagePct":{"fire":0,"lightning":0}}],"enemyTeam":[{"id":"target","name":"target","side":"enemy","level":40,"tier":"trash","stats":{"life":500,"lifeMax":500,"mana":200,"manaMax":200,"attack":1,"defense":0,"magicResist":0,"attackSpeed":100,"critChance":0,"critDamage":1.5,"physDodge":0,"magicDodge":0,"magicFind":0,"goldFind":0,"resistances":{"fire":0,"cold":0,"lightning":0,"poison":0,"arcane":0,"physical":0}},"life":500,"mana":200,"statuses":[{"id":"stun","sourceId":"fixture","stacks":1,"remaining":-1,"appliedAtMs":0}],"cooldowns":{},"skillOrder":[],"activeBuffIds":[],"enraged":false}]};
    const before = structuredClone(input);
    expect(legacyRecording(runBattleRecorded(input))).toEqual(expected);
    expect(input).toEqual(before);
  });
});
