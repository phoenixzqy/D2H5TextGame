import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monsters } from '@/data/index';
import * as rngModule from '../rng';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { ActiveStatus, CombatUnit } from './types';

const specs = [
  { key: 'enrage', id: 'monsters/act1.treehead-woodfist', duration: 5000, cd: 6 },
  { key: 'shout', id: 'monsters/act5.ancient-barbarian', duration: 5000, cd: 5 },
  { key: 'teleport', id: 'monsters/act2.the-summoner', duration: 1000, cd: 3 },
  { key: 'thorns-aura', id: 'monsters/act3.thorned-hulk', duration: 60000, cd: 0 }
] as const;
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs });
function input(index: number, heroActive = false): CombatSnapshot {
  const spec = specs[index]; if (!spec) throw new Error('Missing fixture spec');
  const def = monsters.find(row => row.id === spec.id); if (!def) throw new Error('Missing native monster');
  const base = buildMonsterUnit({ def, level: 20, tier: 'trash', id: 'enemy', rng: rngModule.createRng(7) });
  const enemy: CombatUnit = { ...base, life: 100_000, mana: 0, attackRange: [100, 100], skillOrder: ['monster-' + spec.key],
    stats: { ...base.stats, life: 100_000, lifeMax: 100_000, mana: 0, manaMax: 0, attack: 100,
      attackSpeed: 100, critChance: 0, defense: 100, magicResist: 20, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player', skillOrder: [],
    statuses: heroActive ? [] : [hold()], attackRange: [300, 300],
    stats: { ...enemy.stats, attack: 300, defense: 0, magicResist: 0 } };
  return { seed: 13, act: 1, playerTeam: [hero], enemyTeam: [enemy] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(out); expect(runBattle(snapshot)).toEqual(out.result);
  return out;
}
function hits(out: ReturnType<typeof runBattleRecorded>, source: string) {
  return out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === source);
}
beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  const create = rngModule.createRng;
  vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = create(seed); vi.spyOn(rng, 'nextInt').mockImplementation(min => min);
    vi.spyOn(rng, 'chance').mockImplementation(p => p > .5); return rng;
  });
});
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe.each(specs)('native monster $key', spec => {
  const index = specs.indexOf(spec);
  it('uses the real rank-one self buff with explicit finite duration', () => {
    const skill = getSkill('monster-' + spec.key);
    expect(skill).toMatchObject({ archetype: 'monster', target: 'self', cooldown: spec.cd, manaCost: 0,
      isBuff: true, effects: [{ kind: 'buff', id: 'monster-' + spec.key, duration: spec.duration / 1000 }] });
  });
  it('publishes a finite paid interval and removes it exactly at expiry', () => {
    const snapshot = input(index), out = record({ ...snapshot,
      enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, statuses: [hold(1701)] })) });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'buff', target: 'enemy', buffId: 'monster-' + spec.key, statusBacked: true }));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'enemy', simClockMs: 1700,
      statuses: expect.arrayContaining([expect.objectContaining({ id: 'monster-' + spec.key, sourceId: 'enemy',
        appliedAtMs: 1700, expiresAtMs: 1700 + spec.duration })]) as unknown }));
    if (spec.duration < 60000) expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'enemy', simClockMs: 1700 + spec.duration,
      statuses: expect.not.arrayContaining([expect.objectContaining({ id: 'monster-' + spec.key })]) as unknown }));
    expect(out.result.enemyTeam[0]?.activeBuffIds).not.toContain('monster-' + spec.key);
  });
  it('retains the actual native bar and never recasts inside an active interval', () => {
    const snapshot = input(index), bar = monsters.find(row => row.id === spec.id)?.skills;
    if (!bar) throw new Error('Missing native bar');
    const out = record({ ...snapshot, enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, skillOrder: bar })) });
    const casts = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'enemy' && e.skillId === 'monster.' + spec.key.replaceAll('-', '_'));
    // Native Summoner cooldowns now leave a real opportunity for Teleport.
    expect(casts.length).toBeGreaterThan(0);
    for (let i = 1; i < casts.length; i++) expect((casts[i]?.simClockMs ?? 0) - (casts[i - 1]?.simClockMs ?? 0)).toBeGreaterThanOrEqual(Math.max(spec.duration, spec.cd * 1000));
  });
  it('rejects a replaced source and a foreign hero instead of granting free effects', () => {
    const snapshot = input(index), skill = getSkill('monster-' + spec.key);
    if (!skill) throw new Error('Missing native buff');
    registerSkill(structuredClone(skill));
    const replaced = record(snapshot);
    expect(replaced.events.some(e => e.kind === 'action' && e.skillId === skill.id)).toBe(false);
    loadDefaultSkills();
    const enemy = snapshot.enemyTeam[0], hero = snapshot.playerTeam[0]; if (!enemy || !hero) throw new Error('Missing fixture');
    const foreign = record({ ...snapshot, playerTeam: [{ ...hero, statuses: [], skillOrder: enemy.skillOrder }],
      enemyTeam: [{ ...enemy, statuses: [hold()], skillOrder: [] }] });
    expect(foreign.events.some(e => e.kind === 'action' && e.skillId === skill.id)).toBe(false);
  });
});

it('Enrage increases ordinary direct damage for five seconds without changing cadence', () => {
  const out = record(input(0)), attacks = hits(out, 'enemy');
  expect(attacks.slice(0, 3).map(e => [e.simClockMs, e.amount])).toEqual([[3400, 150], [5100, 150], [6800, 100]]);
  expect(out.result.enemyTeam[0]?.stats.attackSpeed).toBe(100);
});

it.each(['physical', 'fire', 'poison', 'lightning'] as const)('Shout modifies ordinary Defense for %s without changing magic resist', damageType => {
  registerSkill({ id: 'fixture.hit', archetype: 'fixture', minLevel: 1, target: 'single-enemy', cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType, base: [300, 300] }] });
  const snapshot = input(1, true), out = record({ ...snapshot,
    playerTeam: snapshot.playerTeam.map(h => ({ ...h, skillOrder: ['fixture.hit'] })),
    enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, statuses: [hold(1701)] })) });
  const attack = hits(out, 'hero').find(e => e.simClockMs === 3400);
  expect(attack?.amount).toBe(damageType === 'lightning' ? 280 : 170);
  expect(out.result.enemyTeam[0]?.stats.defense).toBe(100);
  expect(out.result.enemyTeam[0]?.stats.magicResist).toBe(20);
});

it.each(['physical', 'lightning'] as const)('Teleport changes only the magical dodge pool for %s', damageType => {
  registerSkill({ id: 'fixture.hit', archetype: 'fixture', minLevel: 1, target: 'single-enemy', cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType, base: [300, 300] }] });
  const snapshot = input(2, true), out = record({ ...snapshot,
    playerTeam: snapshot.playerTeam.map(h => ({ ...h, skillOrder: ['fixture.hit'], stats: { ...h.stats, attackSpeed: 187 } })),
    enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, statuses: [hold(1701)] })) });
  expect(hits(out, 'hero').filter(e => e.simClockMs === 2008).map(e => e.dodged)).toEqual([damageType === 'lightning']);
  expect(hits(out, 'hero').find(e => e.simClockMs === 3012)?.dodged).toBe(false);
});

it.each(['melee', 'ranged'] as const)('Thorns reflects physical %s HP loss once, with no recursive reflection', basicAttackDelivery => {
  const snapshot = input(3, true), out = record({ ...snapshot,
    playerTeam: snapshot.playerTeam.map(h => ({ ...h, basicAttackDelivery, physicalReflectionPct: 1,
      stats: { ...h.stats, attackSpeed: 187 } })),
    enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, statuses: [hold(1701)] })) });
  const reflected = hits(out, 'enemy').filter(e => e.damageType === 'thorns');
  expect(reflected[0]).toMatchObject({ simClockMs: 2008, amount: 100, target: 'hero', crit: false, dodged: false });
  expect(hits(out, 'hero').some(e => e.damageType === 'thorns')).toBe(false);
});

it('Thorns does not reflect a lethal physical hit or elemental/periodic damage', () => {
  const snapshot = input(3, true), lethal = record({ ...snapshot,
    playerTeam: snapshot.playerTeam.map(h => ({ ...h, stats: { ...h.stats, attackSpeed: 0 } })),
    enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, life: 200, statuses: [hold(1701)] })) });
  expect(lethal.events.some(e => e.kind === 'death' && e.target === 'enemy')).toBe(true);
  expect(hits(lethal, 'enemy').some(e => e.damageType === 'thorns')).toBe(false);
  registerSkill({ id: 'fixture.fire', archetype: 'fixture', minLevel: 1, target: 'single-enemy', cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'fire', base: [300, 300] }] });
  const elemental = record({ ...snapshot, playerTeam: snapshot.playerTeam.map(h => ({ ...h, skillOrder: ['fixture.fire'] })),
    enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, statuses: [hold(1701), { id: 'poison', sourceId: 'hero', stacks: 1, remaining: 3, expiresAtMs: 3000, dotPerStack: 10 }] })) });
  expect(hits(elemental, 'enemy').some(e => e.damageType === 'thorns')).toBe(false);
  expect(elemental.events.some(e => e.kind === 'dot' && e.target === 'enemy' && e.amount > 0)).toBe(true);
});


it('imports no potency from bare markers and does not let them block a real new payment', () => {
  const snapshot = input(0), out = record({ ...snapshot, enemyTeam: snapshot.enemyTeam.map(e => ({ ...e,
    activeBuffIds: ['monster-enrage'], statuses: [{ id: 'monster-enrage', sourceId: e.id, stacks: 1,
      remaining: 5, appliedAtMs: 0, expiresAtMs: 5000 }, hold(1701)] })) });
  const initial = out.events.find(e => e.kind === 'status-state' && e.target === 'enemy' && e.initial);
  expect(initial).toMatchObject({ statuses: [] });
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'enemy', skillId: 'monster.enrage', simClockMs: 1700 }));
  const noCast = record({ ...snapshot, enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, skillOrder: [],
    statuses: [{ id: 'monster-enrage', sourceId: e.id, stacks: 1, remaining: -1 }] })) });
  expect(hits(noCast, 'enemy')[0]?.amount).toBe(100);
});

it('does not recalculate already installed periodic potency during Enrage', () => {
  const snapshot = input(0), out = record({ ...snapshot, playerTeam: snapshot.playerTeam.map(h => ({ ...h,
    statuses: [...h.statuses, { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: 6, expiresAtMs: 6000, dotPerStack: 10 }] })) });
  const dots = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'dot' }> => e.kind === 'dot' && e.target === 'hero');
  expect(dots.reduce((sum, e) => sum + e.amount, 0)).toBe(60);
  expect(hits(out, 'enemy').some(e => e.amount === 150)).toBe(true);
});

it('respects ManaBurn skill lock without granting a private window', () => {
  const snapshot = input(0), out = record({ ...snapshot, enemyTeam: snapshot.enemyTeam.map(e => ({ ...e,
    statuses: [{ id: 'mana-burn', sourceId: 'fixture', remaining: -1, stacks: 1 }] })) });
  expect(out.events.some(e => e.kind === 'buff' && e.buffId === 'monster-enrage')).toBe(false);
  expect(hits(out, 'enemy').every(e => e.amount === 100)).toBe(true);
});
