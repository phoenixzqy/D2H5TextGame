import { beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

interface PrayerSnapshot extends CombatSnapshot {
  readonly statAura: {
    readonly selectedAuraId: 'paladin.prayer'; readonly sourceHeroId: string;
    readonly fieldedMercCombatId?: string; readonly rank: number; readonly maxRank: number;
    readonly bonuses: { readonly lifeRegenPct: number };
    readonly healing: { readonly intervalMs: number; readonly amount: number };
  };
}
function unit(id: string, side: CombatUnit['side'], kind: CombatUnit['kind'] = side === 'player' ? 'hero' : 'monster'): CombatUnit {
  return { id, name: id, side, kind, level: 30, tier: 'trash', life: 50000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 1, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
    skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function input(rank = 1): PrayerSnapshot {
  return { seed: 7, playerTeam: [unit('hero', 'player'), unit('merc', 'player', 'merc')],
    enemyTeam: [unit('enemy', 'enemy')],
    statAura: { selectedAuraId: 'paladin.prayer', sourceHeroId: 'hero', fieldedMercCombatId: 'merc',
      rank, maxRank: 20, bonuses: { lifeRegenPct: rank * .03 }, healing: { intervalMs: 5000, amount: 20 } } };
}
function hero(snapshot: PrayerSnapshot): CombatUnit {
  const value = snapshot.playerTeam[0]; if (!value) throw new Error('Missing hero'); return value;
}
function record(snapshot: PrayerSnapshot) {
  const before = structuredClone(snapshot), result = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(result);
  for (const out of [...result.result.playerTeam, ...result.result.enemyTeam]) {
    expect(out.stats).toEqual([...snapshot.playerTeam, ...snapshot.enemyTeam].find(u => u.id === out.id)?.stats);
    expect(out).not.toHaveProperty('statAura');
  }
  return result;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Prayer actual healing', () => {
  it.each([[1, 20], [2, 21], [20, 32]])('heals rank %i by %i HP per recipient on exact five-second pulses through the inclusive deadline', (rank, amount) => {
    const r = record(input(rank));
    const heals = r.events.filter(e => e.kind === 'heal');
    expect(heals.map(e => [e.target, e.amount, e.simClockMs]))
      .toEqual(Array.from({ length: 12 }, (_, i) => [['hero', amount, (i + 1) * 5000], ['merc', amount, (i + 1) * 5000]]).flat());
    expect(r.result.playerTeam.map(u => u.life)).toEqual([50000 + 12 * amount, 50000 + 12 * amount]);
    expect(r.events.some(e => e.kind === 'action' || e.kind === 'mana')).toBe(false);
    expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: null, simClockMs: 60000 });
  });
  it('caps actual restoration, skips full/dead/bench/summoned/enemy recipients and never banks unused healing', () => {
    const snapshot = input(), merc = unit('merc', 'player', 'merc');
    const r = record({ ...snapshot, playerTeam: [{ ...hero(snapshot), life: 99995 }, { ...merc, life: 0 },
      unit('bench', 'player', 'merc'), { ...unit('summon', 'player', 'summon'), summon: true, ownerId: 'hero' }] });
    expect(r.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ target: 'hero', amount: 5, simClockMs: 5000 })]);
    expect(r.result.playerTeam.map(u => u.life)).toEqual([100000, 0, 50000, 50000]);
    expect(r.result.enemyTeam[0]?.life).toBe(50000);
  });
  it('settles periodic source death before the due pulse and never revives its dead source', () => {
    const snapshot = input();
    const r = record({ ...snapshot, playerTeam: [{ ...hero(snapshot), life: 5, statuses: [
      ...hero(snapshot).statuses, { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: -1, dotPerStack: 1 }] }, unit('merc', 'player', 'merc')] });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'hero', simClockMs: 5000 }));
    expect(r.events.some(e => e.kind === 'heal')).toBe(false);
    expect(r.result.playerTeam.map(u => u.life)).toEqual([0, 50000]);
  });
  it.each(['stun', 'freeze'])('continues all due healing through source %s', id => {
    const snapshot = input();
    const r = record({ ...snapshot, playerTeam: [{ ...hero(snapshot),
      statuses: [{ id, sourceId: 'fixture', stacks: 1, remaining: -1 }] }] });
    expect(r.events.filter(e => e.kind === 'heal')).toHaveLength(12);
    expect(r.result.playerTeam[0]?.life).toBe(50240);
  });
  it('heals before a surviving tied enemy action', () => {
    const snapshot = input();
    const enemy = { ...unit('enemy', 'enemy'), statuses: [], stats: { ...unit('enemy', 'enemy').stats, attackSpeed: -60, attack: 1 } };
    const r = record({ ...snapshot, statAura: { ...snapshot.statAura, healing: { intervalMs: 2000, amount: 20 } },
      playerTeam: [{ ...hero(snapshot), life: 1,
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }], enemyTeam: [enemy] });
    const healed = r.events.findIndex(e => e.kind === 'heal' && e.simClockMs === 2000);
    const action = r.events.findIndex(e => e.kind === 'action' && e.actor === 'enemy' && e.simClockMs === 2000);
    expect(healed).toBeGreaterThan(-1); expect(action).toBeGreaterThan(healed);
    expect(r.result.playerTeam[0]?.life).toBeGreaterThan(0);
  });
  it('excludes an original merc killed by periodic damage at the same boundary without suppressing hero healing', () => {
    const snapshot = input();
    const r = record({ ...snapshot, playerTeam: [hero(snapshot), { ...unit('merc', 'player', 'merc'), life: 5,
      statuses: [...unit('merc', 'player', 'merc').statuses,
        { id: 'bleed', sourceId: 'enemy', stacks: 1, remaining: -1, dotPerStack: 1 }] }] });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'merc', simClockMs: 5000 }));
    expect(r.events.filter(e => e.kind === 'heal').every(e => e.target === 'hero')).toBe(true);
    expect(r.result.playerTeam.map(u => u.life)).toEqual([50240, 0]);
  });
  it('rejects source and recipient ownership forgeries, wrong kinds and invalid HP maxima', () => {
    const snapshot = input();
    for (const patch of [{ ownerId: 'other' }, { summonOwnerId: 'other' }, { summon: true },
      { kind: 'merc' as const }, { life: 0 }]) {
      expect(record({ ...snapshot, playerTeam: [{ ...hero(snapshot), ...patch }, unit('merc', 'player', 'merc')] })
        .events.some(e => e.kind === 'heal')).toBe(false);
    }
    for (const patch of [{ ownerId: 'hero' }, { summonOwnerId: 'hero' }, { summon: true },
      { kind: 'hero' as const }, { stats: { ...unit('merc', 'player', 'merc').stats, lifeMax: Infinity } }]) {
      const r = record({ ...snapshot, playerTeam: [hero(snapshot), { ...unit('merc', 'player', 'merc'), ...patch }] });
      expect(r.events.filter(e => e.kind === 'heal').every(e => e.target === 'hero')).toBe(true);
      expect(r.result.playerTeam[1]?.life).toBe(50000);
    }
  });
  it('uses alternate tuning, floors once per recipient and never grants a partial first interval', () => {
    const snapshot = input();
    const r = record({ ...snapshot, statAura: { ...snapshot.statAura, healing: { intervalMs: 1500, amount: 37.5 } } });
    expect(r.events.filter(e => e.kind === 'heal' && e.target === 'hero').map(e => [e.simClockMs, e.kind === 'heal' ? e.amount : 0]))
      .toEqual(Array.from({ length: 40 }, (_, i) => [(i + 1) * 1500, 38]));
    expect(r.result.playerTeam[0]?.life).toBe(51520);
  });
  it('does not bank full-life pulses or consume random rolls', () => {
    const snapshot = input(), enemy = { ...unit('enemy', 'enemy'), statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 0, expiresAtMs: 15000 }],
      stats: { ...unit('enemy', 'enemy').stats, attack: 1, attackSpeed: 0 } };
    const active = { ...snapshot, playerTeam: [{ ...hero(snapshot), life: 100000 }], enemyTeam: [enemy] };
    const { statAura: _projection, ...control } = active;
    const r = record(active), without = runBattleRecorded(control);
    expect(r.events.filter(e => e.kind === 'damage')).toEqual(without.events.filter(e => e.kind === 'damage'));
    const first = r.events.find(e => e.kind === 'heal');
    const earlyLoss = r.events.reduce((sum, e) => sum + (e.kind === 'damage' && e.simClockMs < 20000 ? e.amount : 0), 0);
    expect(earlyLoss).toBeGreaterThan(0); expect(earlyLoss).toBeLessThan(20);
    expect(first).toMatchObject({ target: 'hero', simClockMs: 20000, amount: earlyLoss });
    const lastLoss = r.events.reduce((sum, e) => sum + (e.kind === 'damage' && e.simClockMs === 60000 ? e.amount : 0), 0);
    expect(r.result.playerTeam[0]?.life).toBe(100000 - lastLoss);
  });
  it('stops on the actual action cap without healing at future boundaries', () => {
    const snapshot = input(), fast = (u: CombatUnit): CombatUnit => ({ ...u, statuses: [],
      stats: { ...u.stats, attackSpeed: 263 } });
    const r = record({ ...snapshot, playerTeam: [hero(snapshot), ...Array.from({ length: 7 }, (_, i) =>
      fast(unit(i === 0 ? 'merc' : 'bench-' + String(i), 'player', 'merc')))],
      enemyTeam: [fast(unit('enemy', 'enemy'))] });
    const end = r.events.at(-1)?.simClockMs;
    expect(end).toBeDefined(); expect(end).toBeLessThan(60000);
    expect(r.events.filter(e => e.kind === 'heal' && e.target === 'hero').map(e => e.simClockMs))
      .toEqual(Array.from({ length: Math.floor((end ?? 0) / 5000) }, (_, i) => (i + 1) * 5000));
  });
});
