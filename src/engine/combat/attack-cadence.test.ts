import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattleRecorded, runBattle, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import type { CombatUnit } from './types';
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return {
    id,
    side,
    name: id,
    kind: side === 'player' ? 'hero' : 'monster',
    level: 30,
    tier: 'trash',
    life: 100000,
    mana: 9,
    stats: {
      life: 100000,
      lifeMax: 100000,
      mana: 9,
      manaMax: 100,
      attack: 1,
      attackSpeed: 100,
      defense: 0,
      magicResist: 0,
      critChance: 0,
      critDamage: 2,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    },
    statuses: [],
    cooldowns: {},
    activeBuffIds: [],
    skillOrder: [],
    enraged: false
  };
}
function scene(): CombatSnapshot {
  return {
    seed: 7,
    playerTeam: [
      Object.assign(unit('hero', 'player'), {
        burstOfSpeedRank: 20,
        skillLevels: { 'assassin.burst_of_speed': 20 },
        skillOrder: ['assassin.burst_of_speed']
      })
    ],
    enemyTeam: [
      {
        ...unit('target', 'enemy'),
        statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }]
      }
    ]
  };
}
beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
it('records initial cadence after the complete status prefix and only records changed periods', () => {
  const input = scene();
  const before = structuredClone(input);
  const result = runBattleRecorded(input);
  const observations = result.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'cadence-state' }> => e.kind === 'cadence-state' && e.target === 'hero');
  expect(observations.map(e => [e.simClockMs, e.periodMs])).toEqual([
    [0, 1700], [1700, 1380], [11700, 1700]
  ]);
  expect(result.events.slice(0, 2).every(e => e.kind === 'status-state' && e.initial)).toBe(true);
  expect(result.events[2]).toMatchObject({ kind: 'cadence-state', target: 'hero' });
  expect(result.events.filter(e => e.kind === 'action' && e.actor === 'hero').slice(0, 2)
    .map(e => e.simClockMs)).toEqual([1700, 3080]);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(result);
  expect(runBattle(input)).toEqual(result.result);
});

it.each([[0, 2000], [100, 1700], [263, 400], [500, 400]])(
  'observes the scheduler clamp for speed %s without duplicate per-attack observations', (speed, expected) => {
    const hero = { ...unit('hero', 'player'), equipmentAttackSpeedPct: .11,
      stats: { ...unit('hero', 'player').stats, attackSpeed: speed } };
    const result = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy')] });
    const observations = result.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'cadence-state' }> => e.kind === 'cadence-state' && e.target === 'hero');
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({ simClockMs: 0, periodMs: expected, equipmentAttackSpeedPct: .11 });
    expect(result.events.find(e => e.kind === 'action' && e.actor === 'hero')?.simClockMs).toBe(expected);
  }
);

it('observes future Chill onset and expiry while preserving pending action phase', () => {
  const hero = { ...unit('hero', 'player'), statuses: [{ id: 'chill', sourceId: 'fixture', stacks: 1,
    remaining: 2, appliedAtMs: 1300, expiresAtMs: 3300 }] };
  const result = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [unit('enemy', 'enemy')] });
  expect(result.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'cadence-state' }> => e.kind === 'cadence-state' && e.target === 'hero')
    .map(e => [e.simClockMs, e.periodMs])).toEqual([[0, 1700], [1300, 2000], [3300, 1700]]);
  const times = result.events.filter(e => e.kind === 'action' && e.actor === 'hero').map(e => e.simClockMs);
  expect(times[0]).toBeCloseTo(30100 / 17, 8);
  expect(times[1]).toBeCloseTo(3700, 8);
});
