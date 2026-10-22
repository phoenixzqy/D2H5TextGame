import { afterEach, describe, expect, it } from 'vitest';
import { legacyRecordedEvents } from '@/test/combat-oracle';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { getSummon, registerSummon } from '../skills/summons';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent, type RecordedBattleResult } from './combat';
import { rebaseStatusClock } from './status';
import type { ActiveStatus, CombatUnit } from './types';

function status(id: string, appliedAtMs = 0, expiresAtMs?: number): ActiveStatus {
  return { id, sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs,
    ...(expiresAtMs === undefined ? {} : { expiresAtMs }) };
}
function unit(id: string, side: CombatUnit['side'], speed = 100, statuses: ActiveStatus[] = []): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100_000, mana: 0,
    stats: { life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100, attack: 10,
      defense: 0, magicResist: 0, attackSpeed: speed, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses, skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function snapshot(target = unit('target', 'enemy'), hero = unit('hero', 'player', 100, [status('stun')])): CombatSnapshot {
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
function times(r: RecordedBattleResult, id = 'target', kind: 'action' | 'stunned' = 'action'): number[] {
  return r.events.filter(e => kind === 'action'
    ? e.kind === 'action' && e.actor === id : e.kind === 'stunned' && e.target === id)
    .map(e => e.simClockMs);
}
function expectTimes(actual: number[], expected: number[]): void {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((at, i) => { expect(actual[i]).toBeCloseTo(at, 8); });
}
function replay(input: CombatSnapshot): RecordedBattleResult {
  const before = structuredClone(input);
  const r = runBattleRecorded(input);
  expect(runBattle(input)).toEqual(r.result);
  expect(runBattleRecorded(input)).toEqual(r);
  expect(input).toEqual(before);
  return r;
}
function debuff(id = 'fixture.chill', durationMs = 2000): string {
  registerSkill({ id, archetype: 'fixture', target: 'all-enemies', minLevel: 1, manaCost: 0,
    cooldown: 100, effects: [{ kind: 'debuff', statusId: 'chill', durationMs }] });
  return id;
}
const skeleton = getSummon('skeleton');
afterEach(() => {
  resetRegistry(); loadDefaultSkills();
  if (skeleton) registerSummon('skeleton', skeleton);
});

describe('Chill phase-preserving action cadence', () => {
  it.each(['skills-sorceress-ice-bolt', 'skills-sorceress-frost-nova'])(
    'slows actual authored %s targets from onset through expiry', id => {
      loadDefaultSkills();
      const hero = { ...unit('hero', 'player', 150, [status('stun', 1301)]),
        mana: 20, skillOrder: [id], skillLevels: { [id]: 1 } };
      const r = replay({ ...snapshot(unit('target', 'enemy'), hero), seed: 1 });
      expect(r.events).toContainEqual(expect.objectContaining({ kind: 'status', target: 'target',
        statusId: 'chill', simClockMs: 1300 }));
      expect(r.events.some(e => e.kind === 'status' && e.statusId === 'freeze')).toBe(false);
      expectTimes(times(r).slice(0, 3), [30100 / 17, 3700, 5400]);
      expect(r.result.enemyTeam[0]?.stats.attackSpeed).toBe(100);
    }
  );

  it('matches real application and stored future onset, and reselects the next actor', () => {
    const target = unit('target', 'enemy', 100, [status('chill', 1300, 3300)]);
    const r = replay({ ...snapshot(target), enemyTeam: [target, unit('other', 'enemy', 94)] });
    expectTimes(times(r).slice(0, 3), [30100 / 17, 3700, 5400]);
    expect(r.events.filter(e => e.kind === 'action').slice(0, 2).map(e => [e.actor, e.simClockMs]))
      .toEqual([['other', 1748], ['target', 30100 / 17]]);
  });

  it('extends active Chill without stacking, restarting progress or rescaling unchanged periods', () => {
    const hero = { ...unit('hero', 'player', 125, [status('stun', 0, 3000), status('stun', 3001)]),
      skillOrder: [debuff()] };
    const r = replay(snapshot(unit('target', 'enemy', 100, [status('chill', 1300, 3300)]), hero));
    expect(r.events.filter(e => e.kind === 'status').map(e => [e.statusId, e.simClockMs]))
      .toEqual([['chill', 3000]]);
    expectTimes(times(r).slice(0, 3), [30100 / 17, 64100 / 17, 5655]);
  });

  it.each([[50, 2000], [263, 1452], [526, 400], [101.9, 2000]] as const)(
    'uses floor and clamps after multiplying base AS%s, with period%s', (speed, period) => {
      const r = replay(snapshot(unit('target', 'enemy', speed, [status('chill')])));
      expectTimes(times(r).slice(0, 3), [period, period * 2, period * 3]);
    }
  );

  it('applies one multiplier to legacy Chill, ignoring aggregate stacks', () => {
    const chill = { id: 'chill', sourceId: 'legacy', remaining: 2, stacks: 9 };
    const r = replay(snapshot(unit('target', 'enemy', 100, [chill])));
    expectTimes(times(r).slice(0, 3), [2000, 4000, 6000]);
  });

  it.each(['hero', 'merc'] as const)('initializes chilled player-side %s with its effective period', kind => {
    const player = { ...unit(kind, 'player', 100, [status('chill')]), kind };
    const r = replay({ seed: 7, playerTeam: kind === 'hero' ? [player]
      : [unit('hero', 'player', 100, [status('stun')]), player],
      enemyTeam: [unit('target', 'enemy', 100, [status('stun')])] });
    expectTimes(times(r, kind).slice(0, 3), [2000, 4000, 6000]);
  });

  it('retains fractional onset/expiry and phase without rounding', () => {
    const r = replay(snapshot(unit('target', 'enemy', 100, [status('chill', 1300.25, 3300.5)])));
    expectTimes(times(r).slice(0, 3), [1300.25 + 399.75 * 20 / 17, 3700.0375, 5400.0375]);
    expect(r.events.every((e, i) => i === 0 || e.simClockMs >= (r.events[i - 1]?.simClockMs ?? 0))).toBe(true);
  });

  it('suppresses a chilled scheduled attempt during Freeze and does not catch up at thaw', () => {
    const r = replay(snapshot(unit('target', 'enemy', 100,
      [status('chill', 1300, 3300), status('freeze', 1300, 2300)])));
    expectTimes(times(r, 'target', 'stunned'), [30100 / 17]);
    expectTimes(times(r).slice(0, 2), [3700, 5400]);
  });

  it('expires Chill and Freeze before their exactly due action', () => {
    const r = replay(snapshot(unit('target', 'enemy', 100,
      [status('chill', 0, 2000), status('freeze', 1000, 2000)])));
    expectTimes(times(r).slice(0, 2), [2000, 3700]);
    expect(times(r, 'target', 'stunned')).toEqual([]);
  });

  it.each([[3, ['hero', 'target']], [7, ['target', 'hero']]] as const)(
    'preserves exact-due action and fixed seed%s ties when Chill is applied', (seed, order) => {
      const hero = { ...unit('hero', 'player', 100, [status('stun', 1701)]), skillOrder: [debuff()] };
      const r = replay({ ...snapshot(unit('target', 'enemy'), hero), seed });
      expect(r.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'action' }> => e.kind === 'action' && e.simClockMs === 1700).map(e => e.actor)).toEqual(order);
      expectTimes(times(r).slice(0, 2), [1700, 3700]);
    }
  );

  it('starts fresh next-wave action progress using genuinely rebased residual Chill', () => {
    const hero = unit('hero', 'player', 100, [status('chill', 1300, 3300), status('stun')]);
    const enemy = { ...unit('old-enemy', 'enemy'),
      life: 5, statuses: [status('stun'), { ...status('bleed', 0, 2500), dotPerStack: 2 }] };
    const first = replay({ seed: 7, playerTeam: [hero], enemyTeam: [enemy] });
    expect(first.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 2500 });
    const carried = rebaseStatusClock(first.result.playerTeam[0] ?? hero, 2500);
    expect(carried.statuses).toContainEqual(status('chill', -1200, 800));
    const second = replay({ seed: 7, playerTeam: [{ ...carried, statuses: carried.statuses.filter(s => s.id !== 'stun') }],
      enemyTeam: [unit('next-enemy', 'enemy', 100, [status('stun')])] });
    expectTimes(times(second, 'hero').slice(0, 2), [1820, 3520]);
  });

  it.each([false, true])('schedules a native summon born at1000 with initially active Chill=%s', active => {
    if (!skeleton) throw new Error('Missing native skeleton template');
    registerSummon('skeleton', owner => {
      const child = skeleton(owner);
      return { ...child, stats: { ...child.stats, attackSpeed: 100 },
        statuses: [status('chill', active ? 1000 : 1300, active ? 5000 : 3300)] };
    });
    registerSkill({ id: 'fixture.summon', archetype: 'fixture', target: 'self', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'summon', summonId: 'skeleton', maxCount: 1 }] });
    const hero = { ...unit('hero', 'player', 250, [status('stun', 0, 1000), status('stun', 1001)]),
      skillOrder: ['fixture.summon'] };
    const r = replay(snapshot(unit('target', 'enemy', 100, [status('stun')]), hero));
    const summon = r.events.find(e => e.kind === 'summon');
    expect(summon).toMatchObject({ kind: 'summon', simClockMs: 1000 });
    if (summon?.kind !== 'summon') throw new Error('Expected real summon event');
    expectTimes(times(r, summon.unit.id).slice(0, 2), active ? [3000, 5000] : [50100 / 17, 4700]);
  });

  it('keeps a chilled startup owner from passing Chill or its period to the native child', () => {
    registerSkill({ id: 'fixture.startup', archetype: 'fixture', target: 'self', minLevel: 1,
      summonOnStart: true, manaCost: 0, cooldown: 100,
      effects: [{ kind: 'summon', summonId: 'skeleton', maxCount: 1 }] });
    const hero = { ...unit('hero', 'player', 100, [status('chill')]), skillOrder: ['fixture.startup'] };
    const r = replay(snapshot(unit('target', 'enemy', 100, [status('stun')]), hero));
    const summon = r.events.find(e => e.kind === 'summon');
    expect(summon).toMatchObject({ kind: 'summon', simClockMs: 0 });
    if (summon?.kind !== 'summon') throw new Error('Expected native startup summon');
    expect(summon.unit.statuses).toEqual([]);
    expect(summon.unit.stats.attackSpeed).toBe(70);
    expectTimes(times(r, summon.unit.id).slice(0, 2), [1940, 3880]);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'action', actor: 'hero',
      skillId: 'fixture.startup', simClockMs: 0 }));
    expectTimes(times(r, 'hero').filter(at => at > 0).slice(0, 2), [2000, 4000]);
  });

  it('settles a shared Chill expiry/lethal boundary and orphan deaths before recovery or due actions', () => {
    const chill = status('chill', 0, 2000);
    const bleed = { ...status('bleed', 0, 2000), dotPerStack: 0.5 };
    const hero = { ...unit('hero', 'player', 100, [chill, bleed]), life: 1, manaRegenPerSecond: 10 };
    const child = { ...unit('child', 'player', 100, [chill]), kind: 'summon' as const,
      summonOwnerId: 'hero', manaRegenPerSecond: 10 };
    const boss = { ...unit('boss', 'enemy', 100, [chill, bleed]), tier: 'boss' as const, life: 1 };
    const r = replay({ seed: 7, playerTeam: [hero, child], enemyTeam: [boss] });
    expect(r.events.filter(e => e.kind === 'dot' || e.kind === 'death').map(e => [e.kind, e.target, e.simClockMs]))
      .toEqual([['dot', 'hero', 2000], ['dot', 'boss', 2000],
        ['death', 'hero', 2000], ['death', 'child', 2000], ['death', 'boss', 2000]]);
    expect(r.events.filter(e => e.kind === 'mana' || e.kind === 'action' || e.kind === 'stunned')).toEqual([]);
    expect(r.result.playerTeam.map(u => u.life)).toEqual([0, 0]);
    expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: 'enemy', simClockMs: 2000 });
  });

  it('restores normal cadence at expiry and executes the inclusive deadline action', () => {
    const r = replay(snapshot(unit('target', 'enemy', 100, [status('chill', 0, 26000)])));
    expectTimes(times(r), [...Array.from({ length: 13 }, (_, i) => 2000 * (i + 1)),
      ...Array.from({ length: 20 }, (_, i) => 26000 + 1700 * (i + 1))]);
    expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: null, simClockMs: 60000 });
    expect(r.events.every(e => e.simClockMs <= 60000)).toBe(true);
  });

  it('leaves a no-Chill recording and downstream combat RNG unchanged across inert boundaries', () => {
    const input = snapshot(unit('target', 'enemy'), unit('hero', 'player'));
    const base = replay(input);
    // Preserve the complete unaffected oracle in each pre/post patch JSON report.
    console.log('CHILL_NO_STATUS_CONTROL', JSON.stringify(base));
    const boundary = replay({ ...input, enemyTeam: [{ ...unit('target', 'enemy'),
      statuses: [status('marker', 1300, 3300)] }] });
    expect(legacyRecordedEvents(boundary.events)).toEqual(legacyRecordedEvents(base.events));
    expectTimes(times(base).slice(0, 3), [1700, 3400, 5100]);
    expect(runBattleRecorded(input)).toEqual(base);
  });
});
