import { afterEach, describe, expect, it } from 'vitest';
import monsters from '../../data/monsters/act1.json';
import areas from '../../data/maps/sub-areas/act1.json';
import type { MonsterDef } from '../types/monsters';
import type { SubAreaDef } from '../types/maps';
import { createRng } from '../rng';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { buildMonsterUnit } from './monster-factory';
import { encountersToSpawns, resolveChallengeWavePlan } from './sub-area-run';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import type { RecordedBattleEvent } from './combat';
import Ajv2020 from 'ajv/dist/2020';
import monsterSchema from '../../data/schema/monster.schema.json';

const validateMonster = new Ajv2020({ strict: true }).compile<MonsterDef>(monsterSchema);
function definition(id: string): MonsterDef {
  const row: unknown = monsters.find(m => m.id === id);
  if (!validateMonster(row)) throw new Error('Invalid production monster fixture');
  return row;
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing test fixture');
  return value;
}
function raven(): CombatUnit {
  return buildMonsterUnit({ def: definition('monsters/act1.blood-raven'),
    level: 12, tier: 'boss', rng: createRng(7), id: 'raven' });
}
function hero(): CombatUnit {
  const boss = raven();
  return { id: 'hero', name: 'hero', kind: 'hero', side: 'player', tier: 'trash', level: 12, mana: 0,
    life: 100_000, stats: { ...boss.stats, life: 100_000, lifeMax: 100_000, attack: 0,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }], skillOrder: [],
    cooldowns: {}, activeBuffIds: [], enraged: false };
}
function record(enemy = raven(), player = hero(), adds: CombatUnit[] = []) {
  const input: CombatSnapshot = { seed: 13, act: 1, playerTeam: [player], enemyTeam: [enemy, ...adds] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
  return out;
}
const actions = (out: ReturnType<typeof record>) => out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.actor === 'raven');
const summons = (out: ReturnType<typeof record>) => out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'summon' }> => e.kind === 'summon');
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('Blood Raven production encounter', () => {
  it('keeps exactly three ordinary guards in the real challenge boss wave', () => {
    const subArea = required(areas.find(a => a.id === 'areas/act1-burial-grounds')) as SubAreaDef;
    const plan = resolveChallengeWavePlan({ subArea, seed: 2223645302,
      challengeOrdinal: 104, fallbackArchetypeId: 'monsters/act1.zombie', fallbackLevel: 12 });
    expect(required(plan.waves.at(-1)).spawns.map(s => [s.archetypeId, s.tier, s.level])).toEqual([
      ['monsters/act1.blood-raven', 'boss', 12],
      ['monsters/act1.bone-warrior', 'trash', 12],
      ['monsters/act1.bone-warrior', 'trash', 12],
      ['monsters/act1.bone-warrior', 'trash', 12]
    ]);
  });
  it('honors explicit ordinary guards after elite precedence and preserves omitted legacy flags', () => {
    const spawns = encountersToSpawns([{ id: 'test', level: 12, monsters: [
      { archetypeId: 'x', count: 1, boss: false },
      { archetypeId: 'x', count: 1, boss: false, elite: true },
      { archetypeId: 'x', count: 1 }, { archetypeId: 'x', count: 1, boss: true, elite: true }
    ] }], 'boss');
    expect(spawns.map(s => s.tier)).toEqual(['trash', 'elite', 'boss', 'boss']);
  });
  it('builds the deliberately calibrated miniboss with unchanged attack/MR/resistances', () => {
    for (let seed = 0; seed < 10; seed++) {
      const boss = buildMonsterUnit({ def: definition('monsters/act1.blood-raven'),
        level: 12, tier: 'boss', rng: createRng(seed) });
      expect(boss.life).toBeGreaterThanOrEqual(630); expect(boss.life).toBeLessThanOrEqual(882);
      expect(boss.stats).toMatchObject({ attack: 139, defense: 40, magicResist: 33,
        attackSpeed: 130, resistances: { fire: 50, cold: -25 } });
    }
  });
  it('spends ordinary actions on Raise/Fire/base in authored order, with no startup summon', () => {
    const out = record();
    expect(actions(out).slice(0, 3).map(e => [e.skillId, e.simClockMs])).toEqual([
      ['monster-blood-raven-raise-dead', 1460], ['monster-blood-raven-fire-arrow', 2920], [null, 4380]
    ]);
    expect(summons(out).map(e => e.simClockMs)).toEqual([1460, 1460, 1460, 27740, 27740, 27740]);
    for (const event of summons(out)) {
      expect(event.unit).toMatchObject({ kind: 'summon', summon: true, tier: 'trash', level: 12,
        summonOwnerId: 'raven', summonTemplateId: 'blood_raven_zombie', stats: {
          attack: 68, defense: 29, magicResist: 11 } });
      expect(event.unit.life).toBeGreaterThanOrEqual(105); expect(event.unit.life).toBeLessThanOrEqual(147);
    }
  });
  it('uses authored Fire Arrow and the physical fallback instead of raw Attack139', () => {
    const out = record();
    // Dodge has a shared floor even for a zero-dodge fixture; inspect the first landed hit.
    const fire = out.events.find(e => e.kind === 'damage' && e.source === 'raven' && e.damageType === 'fire' && !e.dodged);
    const base = out.events.find(e => e.kind === 'damage' && e.source === 'raven' && e.damageType === 'physical' && !e.dodged);
    expect(fire).toMatchObject({ damageType: 'fire', dodged: false });
    expect(fire?.kind === 'damage' && fire.amount).toBeGreaterThanOrEqual(35);
    expect(fire?.kind === 'damage' && fire.amount).toBeLessThanOrEqual(96); // 55*1.75 crit
    expect(base).toMatchObject({ damageType: 'physical', dodged: false });
    expect(base?.kind === 'damage' && base.amount).toBeGreaterThanOrEqual(30);
    expect(base?.kind === 'damage' && base.amount).toBeLessThanOrEqual(87); // 50*1.75 crit
    const view = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' &&
      e.simClockMs === fire?.simClockMs && e.statuses.some(s => s.id === 'ignite'));
    if (view?.kind !== 'status-state' || fire?.kind !== 'damage') throw new Error('Missing actual Burn/hit');
    expect(view.statuses.find(s => s.id === 'ignite')).toMatchObject({ stacks: 2,
      dotPerStack: Math.max(1, Math.floor(fire.amount * .1)), appliedAtMs: fire.simClockMs, expiresAtMs: fire.simClockMs + 3000 });
    expect(out.events.some(e => e.kind === 'dot' && e.target === 'hero' && e.amount > 0)).toBe(true);
  });
  it('keeps the 25s summon cooldown when Zombies die', () => {
    registerSkill({ id: 'fixture.kill-zombies', archetype: 'fixture', target: 'all-enemies',
      minLevel: 1, manaCost: 0, cooldown: 10, effects: [{ kind: 'damage', damageType: 'physical', base: [200, 200] }] });
    const player = hero(), boss = raven();
    const out = record({ ...boss, life: 10_000, stats: { ...boss.stats, life: 10_000, lifeMax: 10_000,
      physDodge: 0, defense: 1000 } }, { ...player, statuses: [], skillOrder: ['fixture.kill-zombies'],
      stats: { ...player.stats, attack: 0, attackSpeed: 50, critChance: 0 } });
    const raised = summons(out);
    expect(raised.length).toBeGreaterThanOrEqual(6);
    expect(raised.slice(0, 6).map(e => e.simClockMs)).toEqual([1460, 1460, 1460, 27740, 27740, 27740]);
    expect(out.events.some(e => e.kind === 'death' && raised.some(s => s.unit.id === e.target))).toBe(true);
  });
  it('closes living Zombies with their owner without summon orb drops', () => {
    const boss = raven();
    const out = record({ ...boss, statuses: [{ id: 'ignite', sourceId: 'hero', stacks: 1, remaining: 5,
      appliedAtMs: 1500, expiresAtMs: 5000, dotPerStack: 1000, damageType: 'fire' }] });
    const raised = summons(out);
    expect(raised).toHaveLength(3);
    const deaths = out.events.filter(e => e.kind === 'death');
    expect(deaths).toHaveLength(4);
    expect(new Set(deaths.map(e => e.simClockMs)).size).toBe(1);
    expect(out.result.winner).toBe('player');
    expect(out.result.enemyTeam.every(u => u.life === 0)).toBe(true);
  });
  it.each([5, 6])('clips a batch against %s living owned Zombies and falls through at cap', count => {
    const def = definition('monsters/act1.zombie');
    const adds = Array.from({ length: count }, (_, i) => ({
      ...buildMonsterUnit({ def, level: 12, tier: 'trash', rng: createRng(i), id: `preload-${String(i)}` }),
      kind: 'summon' as const, summon: true, summonOwnerId: 'raven', summonTemplateId: 'blood_raven_zombie'
    }));
    const out = record(raven(), hero(), adds);
    expect(summons(out)).toHaveLength(6 - count);
    expect(out.result.enemyTeam.filter(u => u.summonOwnerId === 'raven' && u.life > 0)).toHaveLength(6);
    if (count === 6) expect(actions(out)[0]).toMatchObject({ skillId: 'monster-blood-raven-fire-arrow', simClockMs: 1460 });
  });
  it('skips unavailable summons without spending an action or drawing RNG', () => {
    registerSkill({ id: 'fixture.unavailable', archetype: 'fixture', target: 'summon', cooldown: 25,
      manaCost: 0, minLevel: 1, effects: [{ kind: 'summon', summonId: 'absent-template', maxCount: 6, count: 3 }] });
    const boss = raven();
    expect(record({ ...boss, skillOrder: ['fixture.unavailable'] }).events)
      .toEqual(record({ ...boss, skillOrder: [] }).events);
  });
  it('doubles cadence at 10%HP without changing base stats, and remains sticky', () => {
    const boss = raven();
    const out = record({ ...boss, life: boss.stats.lifeMax * .1, skillOrder: [] });
    expect(out.events.filter(e => e.kind === 'enrage')).toHaveLength(1);
    const times = actions(out).map(e => e.simClockMs);
    expect(required(times[1]) - required(times[0])).toBe(420);
    expect(out.result.enemyTeam[0]?.stats.attackSpeed).toBe(130);
    expect(out.result.enemyTeam[0]?.enraged).toBe(true);
  });
  it('preserves pending phase when periodic damage crosses the enrage threshold', () => {
    const boss = raven(), player = hero();
    const out = record({ ...boss, life: 111, stats: { ...boss.stats, lifeMax: 1000 }, skillOrder: [],
      statuses: [{ id: 'ignite', stacks: 1, remaining: -1, sourceId: 'hero', dotPerStack: 10 }] },
    { ...player, stats: { ...player.stats, attackSpeed: 150 } });
    expect(actions(out)[0]?.simClockMs).toBeCloseTo(1300 + 160 * 420 / 1460, 8);
  });
  it('keeps enrage after healing and combines its speed with Chill before scheduling', () => {
    registerSkill({ id: 'fixture.heal', archetype: 'fixture', target: 'self', minLevel: 1,
      cooldown: 100, manaCost: 0, effects: [{ kind: 'heal', target: 'self', pctOfMaxLife: 1 }] });
    const boss = raven();
    const out = record({ ...boss, life: 1, skillOrder: ['fixture.heal'],
      statuses: [{ id: 'chill', sourceId: 'hero', remaining: -1, stacks: 1 }] });
    const times = actions(out).map(e => e.simClockMs);
    expect(required(times[1]) - required(times[0])).toBe(1460);
    expect(out.result.enemyTeam[0]?.life).toBe(boss.stats.lifeMax);
    expect(out.events.filter(e => e.kind === 'enrage')).toHaveLength(1);
  });
  it('leaves shared monster attacks and startup summon definitions unchanged', () => {
    expect(getSkill('monster-fire-arrow')).toMatchObject({ cooldown: 1,
      effects: [{ kind: 'damage', base: [20, 35] }] });
    expect(getSkill('monster-summon-adds')).toMatchObject({ cooldown: 5, summonOnStart: true });
  });
});
