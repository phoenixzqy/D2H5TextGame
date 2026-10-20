import { describe, expect, it } from 'vitest';
import { runBattle, runBattleRecorded } from './combat';
import { rebaseStatusClock, statusActiveAt } from './status';
import type { ActiveStatus, CombatUnit } from './types';

function status(overrides: Partial<ActiveStatus> = {}): ActiveStatus {
  return { id: 'poison', sourceId: 'original', stacks: 3, remaining: 7,
    dotPerStack: 10, damageType: 'poison', tags: ['poison'], ...overrides };
}
function unit(id: string, side: CombatUnit['side'], statuses: readonly ActiveStatus[] = []): CombatUnit {
  return {
    id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', tier: 'trash', level: 30,
    life: 100_000, mana: 7,
    stats: {
      life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100,
      attack: 10, defense: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    },
    statuses, cooldowns: { fixture: 800 }, skillOrder: [], activeBuffIds: ['fixture-buff'], enraged: false
  };
}

describe('status clock translation between battles', () => {
  it('keeps active interval age, residual expiry and metadata without mutating input', () => {
    const original = unit('hero', 'player', [status({ appliedAtMs: 500, expiresAtMs: 3000 })]);
    const before = structuredClone(original);
    const next = rebaseStatusClock(original, 1000);
    expect(next).toEqual({ ...before, statuses: [status({ appliedAtMs: -500, expiresAtMs: 2000 })] });
    const s = next.statuses[0];
    if (!s) throw new Error('Missing status');
    expect(statusActiveAt(s, 0)).toBe(true);
    expect(statusActiveAt(s, 1999)).toBe(true);
    expect(statusActiveAt(s, 2000)).toBe(false);
    expect(original).toEqual(before);
  });

  it('preserves a pending future interval instead of applying it at the transition', () => {
    const next = rebaseStatusClock(unit('hero', 'player', [status({ appliedAtMs: 3000, expiresAtMs: 4000 })]), 1000);
    expect(next.statuses).toEqual([status({ appliedAtMs: 2000, expiresAtMs: 3000 })]);
    const s = next.statuses[0];
    if (!s) throw new Error('Missing status');
    expect(statusActiveAt(s, 1999)).toBe(false);
    expect(statusActiveAt(s, 2000)).toBe(true);
  });

  it.each([-10, 0, 999.5, 1000])('drops already expired or exact-boundary expiry %sms', expiresAtMs => {
    expect(rebaseStatusClock(unit('hero', 'player', [status({ expiresAtMs })]), 1000).statuses).toEqual([]);
  });

  it('keeps legacy counters and absent clocks without inventing a finite lifecycle', () => {
    const legacy = status({ remaining: -1 });
    const finite = status({ id: 'freeze', expiresAtMs: 3000 });
    const indefinite = status({ id: 'stun', appliedAtMs: 500 });
    expect(rebaseStatusClock(unit('hero', 'player', [legacy, finite, indefinite]), 1000).statuses)
      .toEqual([legacy, { ...finite, expiresAtMs: 2000 }, { ...indefinite, appliedAtMs: -500 }]);
  });

  it('preserves fractional timestamps without quantization or boss rescaling', () => {
    const boss = { ...unit('hero', 'player', [status({ appliedAtMs: 100.5, expiresAtMs: 500.75 })]), tier: 'boss' as const };
    expect(rebaseStatusClock(boss, 200.25).statuses).toEqual([status({ appliedAtMs: -99.75, expiresAtMs: 300.5 })]);
  });

  it('translates repeated transitions by their total elapsed simulation time', () => {
    const original = unit('hero', 'player', [status({ appliedAtMs: 500, expiresAtMs: 3000 }),
      status({ id: 'freeze', appliedAtMs: 2000, expiresAtMs: 4000 })]);
    expect(rebaseStatusClock(rebaseStatusClock(original, 1000), 500)).toEqual(rebaseStatusClock(original, 1500));
    expect(rebaseStatusClock(rebaseStatusClock(original, 1000), 2000)).toEqual(rebaseStatusClock(original, 3000));
  });

  it('supports a genuine immediate terminal clock of zero', () => {
    const hero = unit('hero', 'player', [status({ appliedAtMs: 100, expiresAtMs: 3000 })]);
    const result = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [] });
    expect(result.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 0 });
    expect(rebaseStatusClock(result.result.playerTeam[0] ?? hero, 0).statuses).toEqual(hero.statuses);
  });
});

describe('two actual engine battles with a periodic-only terminal boundary', () => {
  const hold: ActiveStatus = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
  function firstBattle(player: CombatUnit) {
    const enemy = { ...unit('enemy', 'enemy', [status({ id: 'bleed', stacks: 1,
      dotPerStack: 2, expiresAtMs: 1000 })]), life: 1 };
    const result = runBattleRecorded({ seed: 7, playerTeam: [player], enemyTeam: [enemy] });
    expect(result.events.some(e => e.kind === 'action')).toBe(false);
    expect(result.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 500 });
    return result.result.playerTeam[0] ?? player;
  }

  it('integrates only residual poison time, with recorded/ordinary replay equality', () => {
    const player = unit('hero', 'player', [hold, status({ stacks: 1, appliedAtMs: 100, expiresAtMs: 2500 })]);
    const before = structuredClone(player);
    const carried = rebaseStatusClock(firstBattle(player), 500);
    const snapshot = { seed: 7, playerTeam: [carried], enemyTeam: [unit('next-enemy', 'enemy', [hold])] };
    const input = structuredClone(snapshot);
    const result = runBattleRecorded(snapshot);
    expect(carried.statuses.find(s => s.id === 'poison')).toMatchObject({ appliedAtMs: -400, expiresAtMs: 2000 });
    expect(result.events.filter(e => e.kind === 'dot' && e.target === 'hero')
      .reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(20);
    expect(runBattle(snapshot)).toEqual(result.result);
    expect(runBattleRecorded(snapshot)).toEqual(result);
    expect(snapshot).toEqual(input);
    expect(player).toEqual(before);
  });

  it.each([[900, false], [1000, true]] as const)(
    'uses residual control from old expiry %sms at the next 400ms action', (expiresAtMs, stunned) => {
      const player = unit('hero', 'player', [{ ...hold, id: 'freeze', appliedAtMs: 0, expiresAtMs }]);
      const carried = rebaseStatusClock(firstBattle(player), 500);
      const result = runBattleRecorded({ seed: 7,
        playerTeam: [{ ...carried, stats: { ...carried.stats, attackSpeed: 263 } }],
        enemyTeam: [unit('next-enemy', 'enemy', [hold])] });
      expect(result.events.some(e => e.kind === 'stunned' && e.target === 'hero' && e.simClockMs === 400)).toBe(stunned);
      expect(result.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs === 400)).toBe(!stunned);
      expect(result.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'hero', simClockMs: 800 }));
    });
});
