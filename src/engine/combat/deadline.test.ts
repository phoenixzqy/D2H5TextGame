import { legacyRecordedEvents } from '@/test/combat-oracle';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';

function unit(id: string, side: CombatUnit['side'], attackSpeed: number): CombatUnit {
  return {
    id,
    name: id,
    side,
    kind: side === 'player' ? 'hero' : 'monster',
    level: 1,
    tier: 'trash',
    stats: {
      life: 100_000,
      lifeMax: 100_000,
      mana: 0,
      manaMax: 0,
      attack: 1,
      defense: 0, magicResist: 0,
      attackSpeed,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    },
    life: 100_000,
    mana: 0,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false
  };
}

function snapshot(attackSpeed: number): CombatSnapshot {
  return {
    seed: 7,
    playerTeam: [unit('hero', 'player', attackSpeed)],
    enemyTeam: [unit('enemy', 'enemy', attackSpeed)]
  };
}

describe('combat simulation deadline', () => {
  it('ends at 60 seconds when the next AS100 action would overshoot', () => {
    const recorded = runBattleRecorded(snapshot(100));
    const actions = recorded.events.filter((event) => event.kind === 'action');

    for (const actor of ['hero', 'enemy']) {
      expect(actions.filter((event) => event.actor === actor).map((event) => event.simClockMs))
        .toEqual(Array.from({ length: 35 }, (_, index) => (index + 1) * 1700));
    }
    expect(recorded.events[recorded.events.length - 1]).toMatchObject({
      kind: 'end', winner: null, simClockMs: 60_000
    });
    expect(recorded.events.every((event) => event.simClockMs <= 60_000)).toBe(true);
    expect(recorded.result.winner).toBeNull();
  });

  it('allows every tied AS263 actor at the inclusive deadline', () => {
    const recorded = runBattleRecorded(snapshot(263));
    const actions = recorded.events.filter((event) => event.kind === 'action');

    expect(actions.filter((event) => event.simClockMs === 60_000).map((event) => event.actor))
      .toEqual(['enemy', 'hero']);
    for (const actor of ['hero', 'enemy']) {
      expect(actions.filter((event) => event.actor === actor)).toHaveLength(150);
    }
    expect(recorded.events[recorded.events.length - 1]).toMatchObject({
      kind: 'end', winner: null, simClockMs: 60_000
    });
    expect(recorded.events.every((event) => event.simClockMs <= 60_000)).toBe(true);
  });

  it.each([[3, 'hero', 'enemy', 'player'], [7, 'enemy', 'hero', 'enemy']] as const)(
    'preserves seed%s lethal deadline action and stops the remaining tied action', (seed, first, victim, winner) => {
    const holdUntilDeadline = {
      id: 'stun', stacks: 1, remaining: 60, sourceId: 'fixture', expiresAtMs: 60_000
    };
    const player = unit('hero', 'player', 263);
    const enemy = unit('enemy', 'enemy', 263);
    const recorded = runBattleRecorded({
      seed,
      playerTeam: [{ ...player, life: victim === 'hero' ? 1 : player.life, statuses: [holdUntilDeadline] }],
      enemyTeam: [{ ...enemy, life: victim === 'enemy' ? 1 : enemy.life, statuses: [holdUntilDeadline] }]
    });

    expect(recorded.events.filter((event) => event.kind === 'action')).toEqual([
      expect.objectContaining({ actor: first, simClockMs: 60_000 })
    ]);
    expect(recorded.events).toContainEqual(expect.objectContaining({
      kind: 'death', target: victim, simClockMs: 60_000
    }));
    expect(recorded.events[recorded.events.length - 1]).toMatchObject({
      kind: 'end', winner, simClockMs: 60_000
    });
  });

  it('keeps the actual end time for victory before the deadline', () => {
    const player = unit('hero', 'player', 100);
    const enemy = unit('enemy', 'enemy', 100);
    const recorded = runBattleRecorded({
      seed: 3, playerTeam: [player], enemyTeam: [{ ...enemy, life: 1 }]
    });

    expect(recorded.events[recorded.events.length - 1]).toMatchObject({
      kind: 'end', winner: 'player', simClockMs: 1700
    });
    expect(recorded.events.filter((event) => event.kind === 'action')).toHaveLength(1);
  });

  it('repeats complete states and timestamps without mutating the snapshot', () => {
    const input = snapshot(100);
    const original = structuredClone(input);
    const first = runBattleRecorded(input);

    expect(runBattleRecorded(input)).toEqual(first);
    expect(runBattle(input)).toEqual(first.result);
    expect(input).toEqual(original);
  });
});

describe('seeded scheduler ties', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetRegistry();
    loadDefaultSkills();
  });

  it('allows either side to act first across a fixed seed set', () => {
    const firstActors = new Set(Array.from({ length: 32 }, (_, i) =>
      runBattleRecorded({ ...snapshot(100), seed: i + 1 }).events.find(e => e.kind === 'action')?.actor));
    expect([...firstActors].sort()).toEqual(['enemy', 'hero']);
  });

  it('lets seeded enemy freeze suppress the hero at the same actual action time', () => {
    registerSkill({ id: 'fixture.tie-freeze', archetype: 'fixture', target: 'single-enemy',
      cooldown: 1, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'debuff', statusId: 'freeze', duration: 1 }] });
    const input = snapshot(100);
    const r = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u =>
      ({ ...u, skillOrder: ['fixture.tie-freeze'] })), enemyTeam: input.enemyTeam.map(u =>
      ({ ...u, skillOrder: ['fixture.tie-freeze'] })) });
    // Frozen D04v1e seed7 ranks: hero .6984279857, enemy .9727973754.
    expect(r.events.filter(e => e.simClockMs === 1700 && e.kind === 'action'))
      .toEqual([expect.objectContaining({ actor: 'enemy', skillId: 'fixture.tie-freeze' })]);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'stunned', target: 'hero', simClockMs: 1700 }));
    expect(r.events.some(e => e.kind === 'stunned' && e.target === 'enemy' && e.simClockMs === 1700)).toBe(false);
  });

  it('preserves the exact untied prepatch recording and combat RNG outcomes', () => {
    const input = { seed: 7, playerTeam: [unit('hero', 'player', 150)],
      enemyTeam: [{ ...unit('enemy', 'enemy', 100), life: 1 }] };
    const r = runBattleRecorded(input);
    expect(JSON.stringify(legacyRecordedEvents(r.events))).toMatchInlineSnapshot(`"[{"kind":"turn-start","turn":1,"simClockMs":0,"uiDelayMs":200},{"kind":"action","actor":"hero","skillId":null,"simClockMs":1300,"uiDelayMs":1300},{"kind":"damage","source":"hero","target":"enemy","damageType":"physical","amount":1,"crit":false,"dodged":false,"simClockMs":1300,"uiDelayMs":50},{"kind":"death","target":"enemy","simClockMs":1300,"uiDelayMs":50},{"kind":"end","winner":"player","simClockMs":1300,"uiDelayMs":50}]"`);
    expect(r.result.winner).toBe('player');
    expect(r.result.playerTeam[0]?.life).toBe(100_000);
    expect(r.result.enemyTeam[0]?.life).toBe(0);
    expect(runBattle(input)).toEqual(r.result);
  });

  it('preserves the original untied stochastic damage and critical-hit recording', () => {
    const hero = unit('hero', 'player', 150);
    const enemy = unit('enemy', 'enemy', 100);
    const input = { seed: 7,
      playerTeam: [{ ...hero, stats: { ...hero.stats, attack: 100, critChance: 0.5, critDamage: 2 } }],
      enemyTeam: [{ ...enemy, life: 240, stats: { ...enemy.stats, attack: 50, critChance: 0.5, critDamage: 2 } }] };
    const r = runBattleRecorded(input);
    expect(JSON.stringify(legacyRecordedEvents(r.events))).toMatchInlineSnapshot(`"[{"kind":"turn-start","turn":1,"simClockMs":0,"uiDelayMs":200},{"kind":"action","actor":"hero","skillId":null,"simClockMs":1300,"uiDelayMs":1300},{"kind":"damage","source":"hero","target":"enemy","damageType":"physical","amount":200,"crit":true,"dodged":false,"simClockMs":1300,"uiDelayMs":50},{"kind":"action","actor":"enemy","skillId":null,"simClockMs":1700,"uiDelayMs":400},{"kind":"damage","source":"enemy","target":"hero","damageType":"physical","amount":0,"crit":false,"dodged":true,"simClockMs":1700,"uiDelayMs":50},{"kind":"action","actor":"hero","skillId":null,"simClockMs":2600,"uiDelayMs":900},{"kind":"damage","source":"hero","target":"enemy","damageType":"physical","amount":100,"crit":false,"dodged":false,"simClockMs":2600,"uiDelayMs":50},{"kind":"death","target":"enemy","simClockMs":2600,"uiDelayMs":50},{"kind":"end","winner":"player","simClockMs":2600,"uiDelayMs":50}]"`);
    expect(r.result.winner).toBe('player');
    expect(runBattle(input)).toEqual(r.result);
  });

  it.each([[7, ['enemy', 'hero']], [3, ['hero', 'enemy']]] as const)(
    'keeps seed%s priorities for every repeated tie without starving either actor', (seed, order) => {
      const input = { ...snapshot(100), seed };
      const before = structuredClone(input);
      const r = runBattleRecorded(input);
      for (let at = 1700; at <= 59_500; at += 1700) {
        expect(r.events.flatMap(e => e.kind === 'action' && e.simClockMs === at ? [e.actor] : [])).toEqual(order);
      }
      expect(runBattleRecorded(input)).toEqual(r);
      expect(runBattle(input)).toEqual(r.result);
      expect(input).toEqual(before);
    });

  it('does not use raw attack speed as a secondary sort when periods clamp equally', () => {
    const r = runBattleRecorded({ seed: 3, playerTeam: [unit('hero', 'player', 263)],
      enemyTeam: [unit('enemy', 'enemy', 1000)] });
    for (const at of [400, 800, 60_000]) {
      expect(r.events.flatMap(e => e.kind === 'action' && e.simClockMs === at ? [e.actor] : []))
        .toEqual(['hero', 'enemy']);
    }
  });

  it('uses timestamp first, then seed for coincident distinct periods', () => {
    const r = runBattleRecorded({ seed: 7, playerTeam: [unit('hero', 'player', 263)],
      enemyTeam: [unit('enemy', 'enemy', 0)] });
    expect(r.events.flatMap(e => e.kind === 'action' && e.simClockMs < 2000 ? [e.actor] : []))
      .toEqual(['hero', 'hero', 'hero', 'hero']);
    expect(r.events.flatMap(e => e.kind === 'action' && e.simClockMs === 2000 ? [e.actor] : []))
      .toEqual(['enemy', 'hero']);
  });

  it('keeps the recording and RNG identical through inert status boundaries and repeated scheduler queries', () => {
    const input = snapshot(100);
    const r = runBattleRecorded(input);
    const bounded = { ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      statuses: [{ id: 'fixture.inert', sourceId: 'fixture', stacks: 1, remaining: 1,
        appliedAtMs: 500, expiresAtMs: 1000 }] })) };
    expect(runBattleRecorded(bounded)).toEqual(r);
  });

  it('falls back to insertion order on exact seeded priority collisions', () => {
    const create = rngModule.createRng;
    vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
      const r = create(seed);
      return { ...r, fork: label => label === 'scheduler-ties'
        ? { ...r.fork(label), next: () => 0.5 }
        : r.fork(label) };
    });
    const r = runBattleRecorded(snapshot(100));
    expect(r.events.flatMap(e => e.kind === 'action' && e.simClockMs === 1700 ? [e.actor] : []))
      .toEqual(['hero', 'enemy']);
  });

  it('gives a real startup summon its seeded rank and repeats complete identity/state without resets', () => {
    registerSkill({ id: 'fixture.tie-skeleton', archetype: 'fixture', target: 'self',
      cooldown: 100, manaCost: 0, minLevel: 1, summonOnStart: true,
      effects: [{ kind: 'summon', summonId: 'skeleton', maxCount: 1 }] });
    const input = { seed: 8, playerTeam: [{ ...unit('hero', 'player', 70), skillOrder: ['fixture.tie-skeleton'] }],
      enemyTeam: [unit('enemy', 'enemy', 70)] };
    const before = structuredClone(input);
    const r = runBattleRecorded(input);
    const summon = r.events.find(e => e.kind === 'summon');
    if (summon?.kind !== 'summon') throw new Error('Missing actual summon');
    expect(summon.unit.id).toBe('hero-summon-skeleton-1');
    expect(r.events.flatMap(e => e.kind === 'action' && e.simClockMs === 1940 ? [e.actor] : []))
      .toEqual([summon.unit.id, 'hero', 'enemy']);
    expect(runBattleRecorded(input)).toEqual(r);
    runBattleRecorded({ ...input, seed: 7 });
    expect(runBattleRecorded(input)).toEqual(r);
    expect(runBattle(input)).toEqual(r.result);
    expect(input).toEqual(before);
    expect(r.result.playerTeam.map(u => u.id)).toEqual(['hero', summon.unit.id]);
  });
});
