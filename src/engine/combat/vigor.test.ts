import { beforeEach, describe, expect, it } from 'vitest';
import { actionPeriodMs, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';

const stun = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side'], kind: CombatUnit['kind'] = side === 'player' ? 'hero' : 'monster'): CombatUnit {
  return { id, name: id, side, kind, level: 30, tier: 'trash', life: 75, mana: 100,
    stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 1, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [stun], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function aura(rank = 1) {
  return { selectedAuraId: 'paladin.vigor', sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank, maxRank: 20,
    bonuses: { lifePct: .02 * rank, attackSpeedPct: .005 * rank } };
}
type Input = Omit<CombatSnapshot, 'statAura'> & { readonly statAura?: unknown };
function input(rank = 1): Input {
  return { seed: 42, playerTeam: [unit('hero', 'player'), unit('merc', 'player', 'merc')],
    enemyTeam: [unit('target', 'enemy')], statAura: aura(rank) };
}
function record(snapshot: Input) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot as CombatSnapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot as CombatSnapshot)).toEqual(out);
  return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Vigor temporary life capacity and cadence', () => {
  it.each([[1, 101, 103], [2, 101, 105], [20, 101, 141], [1, 101.5, 103.5]])('adds floored rank%i capacity over base%s without granting HP', (rank, base, cap) => {
    const hero = { ...unit('hero', 'player'), stats: { ...unit('hero', 'player').stats, lifeMax: base } };
    const out = record({ ...input(rank), playerTeam: [hero, unit('merc', 'player', 'merc')] });
    expect(out.result.playerTeam[0]).toMatchObject({ life: 75, stats: { ...hero.stats, lifeMax: cap },
      vigorLife: { baseLifeMax: base, appliedLifeMax: cap } });
    expect(out.result.playerTeam[1]).toMatchObject({ life: 75, stats: { lifeMax: 100 + Math.floor(100 * .02 * rank) } });
    expect(out.events.some(e => e.kind === 'heal')).toBe(false);
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'life-capacity', target: 'hero', life: 75, lifeMax: cap, simClockMs: 0 }));
    for (const [index, target] of ['hero', 'merc', 'target'].entries()) {
      expect(out.events[index]).toMatchObject({ kind: 'status-state', initial: true, target, simClockMs: 0 });
    }
  });
  it('uses the increased maximum for actual percentage healing and independent missing-HP caps', () => {
    registerSkill({ id: 'fixture.vigor-heal', archetype: 'fixture', target: 'self', minLevel: 1,
      cooldown: 60, manaCost: 8, effects: [{ kind: 'heal', target: 'self', pctOfMaxLife: .5 }] });
    for (const [life, expected, healed] of [[10, 80, 70], [130, 140, 10]] as const) {
      const hero = { ...unit('hero', 'player'), life, statuses: [], skillOrder: ['fixture.vigor-heal'] };
      const out = record({ ...input(20), playerTeam: [hero, unit('merc', 'player', 'merc')] });
      expect(out.result.playerTeam[0]?.life).toBe(expected);
      expect(out.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ target: 'hero', amount: healed })]);
    }
  });
  it('uses actual increased orb healing without extra orb RNG', () => {
    const dead = { ...unit('body', 'enemy'), tier: 'elite' as const, life: 1, statuses: [stun,
      { id: 'ignite', sourceId: 'hero', stacks: 1, remaining: -1, expiresAtMs: 1000, dotPerStack: 1 }] };
    const snapshot = { ...input(20), playerTeam: [{ ...unit('hero', 'player'), life: 15 }], enemyTeam: [dead, unit('target', 'enemy')] };
    const { statAura: _aura, ...control } = snapshot;
    const out = record(snapshot), without = record(control);
    expect(out.result.playerTeam[0]?.life).toBe(22);
    expect(without.result.playerTeam[0]?.life).toBe(20);
    expect(out.events.filter(e => e.kind === 'orb')).toEqual(without.events.filter(e => e.kind === 'orb'));
  });
  it('retains one base across carried waves, recomposes rank changes and removes capacity without a refill', () => {
    const first = record({ ...input(20), playerTeam: [{ ...unit('hero', 'player'), life: 130 }, unit('merc', 'player', 'merc')] });
    const second = record({ ...input(20), playerTeam: first.result.playerTeam });
    expect(second.result.playerTeam).toEqual(first.result.playerTeam);
    const lower = record({ ...input(1), playerTeam: second.result.playerTeam });
    expect(lower.result.playerTeam[0]).toMatchObject({ life: 102, stats: { lifeMax: 102 }, vigorLife: { baseLifeMax: 100, appliedLifeMax: 102 } });
    const { statAura: _aura, ...none } = input();
    const removed = record({ ...none, playerTeam: second.result.playerTeam });
    expect(removed.result.playerTeam[0]).toMatchObject({ life: 100, stats: { lifeMax: 100 } });
    expect(removed.result.playerTeam[0]).not.toHaveProperty('vigorLife');
    expect(removed.events.some(e => e.kind === 'heal' || e.kind === 'damage')).toBe(false);
  });
  it('removes capacity after tied source death and clamps living merc HP before any later recovery', () => {
    const hero = { ...unit('hero', 'player'), life: 5, statuses: [stun,
      { id: 'ignite', sourceId: 'target', stacks: 1, remaining: -1, expiresAtMs: 5000, dotPerStack: 1 }] };
    const out = record({ ...input(20), playerTeam: [hero, { ...unit('merc', 'player', 'merc'), life: 130 }] });
    expect(out.result.playerTeam[0]).toMatchObject({ life: 0, stats: { lifeMax: 100 } });
    expect(out.result.playerTeam[1]).toMatchObject({ life: 100, stats: { lifeMax: 100 } });
    expect(out.result.playerTeam.every(u => !('vigorLife' in u))).toBe(true);
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'life-capacity', target: 'merc', life: 100, lifeMax: 100, simClockMs: 5000 }));
    expect(out.events.some(e => e.kind === 'heal')).toBe(false);
  });
  it('removes source capacity before the HP orb of an exact simultaneous primary enemy death', () => {
    const dot = { id: 'ignite', sourceId: 'fixture', stacks: 1, remaining: -1, expiresAtMs: 1000, dotPerStack: 1 };
    const hero = { ...unit('hero', 'player'), life: 1, statuses: [stun, dot] };
    const body = { ...unit('body', 'enemy'), tier: 'elite' as const, life: 1, statuses: [stun, dot] };
    const out = record({ ...input(20), playerTeam: [hero, { ...unit('merc', 'player', 'merc'), life: 90 }], enemyTeam: [body, unit('target', 'enemy')] });
    expect(out.result.playerTeam[1]).toMatchObject({ life: 95, stats: { lifeMax: 100 } });
    const capIndex = out.events.findIndex(e => e.kind === 'life-capacity' && e.target === 'merc' && e.lifeMax === 100);
    const orbIndex = out.events.findIndex(e => e.kind === 'orb' && e.target === 'merc' && e.orb.kind === 'hp');
    expect(capIndex).toBeGreaterThanOrEqual(0); expect(orbIndex).toBeGreaterThan(capIndex);
  });
  it('excludes bench, summons, forged sources and dead recipients while crowd control alone leaves the aura active', () => {
    const out = record({ ...input(20), playerTeam: [unit('hero', 'player'), unit('merc', 'player', 'merc'),
      unit('bench', 'player', 'merc'), { ...unit('summon', 'player', 'summon'), summon: true },
      { ...unit('dead', 'player', 'merc'), life: 0 }] });
    expect(out.result.playerTeam.map(u => u.stats.lifeMax)).toEqual([140, 140, 100, 100, 100]);
    for (const patch of [{ kind: 'merc' as const }, { summon: true }, { ownerId: 'enemy' }]) {
      const bad = record({ ...input(20), playerTeam: [{ ...unit('hero', 'player'), ...patch }, unit('merc', 'player', 'merc')] });
      expect(bad.result.playerTeam.map(u => u.stats.lifeMax)).toEqual([100, 100]);
    }
  });
  it('uses the authored cadence through the existing scheduler without changing stored speed', () => {
    const hero = { ...unit('hero', 'player'), statuses: [] };
    const out = record({ ...input(20), playerTeam: [hero] });
    const action = out.events.find(e => e.kind === 'action' && e.actor === 'hero');
    expect(action?.simClockMs).toBe(actionPeriodMs(hero.stats.attackSpeed * 1.1));
    expect(out.result.playerTeam[0]?.stats.attackSpeed).toBe(hero.stats.attackSpeed);
  });
  it('rejects foreign or invalid direct coefficients and preserves the ordinary no-aura control', () => {
    for (const bonuses of [{ lifePct: NaN, attackSpeedPct: .1 }, { lifePct: -.1, attackSpeedPct: .1 }, { lifePct: .4 }]) {
      const out = record({ ...input(), statAura: { ...aura(), bonuses } });
      expect(out.result.playerTeam.map(u => u.stats.lifeMax)).toEqual([100, 100]);
    }
    const { statAura: _aura, ...none } = input();
    expect(record(none).result.playerTeam.map(u => u.stats.lifeMax)).toEqual([100, 100]);
  });
});
