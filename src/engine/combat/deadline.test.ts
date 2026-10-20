import { describe, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

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
      defense: 0,
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
      .toEqual(['hero', 'enemy']);
    for (const actor of ['hero', 'enemy']) {
      expect(actions.filter((event) => event.actor === actor)).toHaveLength(150);
    }
    expect(recorded.events[recorded.events.length - 1]).toMatchObject({
      kind: 'end', winner: null, simClockMs: 60_000
    });
    expect(recorded.events.every((event) => event.simClockMs <= 60_000)).toBe(true);
  });

  it('preserves a lethal deadline action and stops the remaining tied action', () => {
    const holdUntilDeadline = {
      id: 'stun', stacks: 1, remaining: 60, sourceId: 'fixture', expiresAtMs: 60_000
    };
    const player = unit('hero', 'player', 263);
    const enemy = unit('enemy', 'enemy', 263);
    const recorded = runBattleRecorded({
      seed: 7,
      playerTeam: [{ ...player, statuses: [holdUntilDeadline] }],
      enemyTeam: [{ ...enemy, life: 1, statuses: [holdUntilDeadline] }]
    });

    expect(recorded.events.filter((event) => event.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', simClockMs: 60_000 })
    ]);
    expect(recorded.events).toContainEqual(expect.objectContaining({
      kind: 'death', target: 'enemy', simClockMs: 60_000
    }));
    expect(recorded.events[recorded.events.length - 1]).toMatchObject({
      kind: 'end', winner: 'player', simClockMs: 60_000
    });
  });

  it('keeps the actual end time for victory before the deadline', () => {
    const player = unit('hero', 'player', 100);
    const enemy = unit('enemy', 'enemy', 100);
    const recorded = runBattleRecorded({
      seed: 7, playerTeam: [player], enemyTeam: [{ ...enemy, life: 1 }]
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
