import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';
import { composeStatAura } from '../skills/stat-auras';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1,
  remaining: -1, appliedAtMs: start });
function unit(id: string, side: CombatUnit['side'] = 'player', patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 50000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 1, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold()], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false, ...patch };
}
function source(patch: Partial<CombatUnit> = {}): CombatUnit {
  return unit('source', 'player', { kind: 'merc', mercPrayerAura: true, ...patch });
}
function input(merc = source()): CombatSnapshot {
  return { seed: 7, playerTeam: [unit('hero'), merc], enemyTeam: [unit('enemy', 'enemy')] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattle(snapshot)).toEqual(out.result);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  for (const original of [...snapshot.playerTeam, ...snapshot.enemyTeam]) {
    expect([...out.result.playerTeam, ...out.result.enemyTeam].find(u => u.id === original.id)?.stats)
      .toEqual(original.stats);
  }
  return out;
}
const heals = (out: ReturnType<typeof record>, target = 'hero') =>
  out.events.flatMap(e => e.kind === 'heal' && e.target === target ? [[e.simClockMs, e.amount]] : []);
function hit(base = 20) {
  registerSkill({ id: 'fixture.prayer-hit', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: 'physical',
      base: [base, base], alwaysHits: true }] });
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('native mercenary Prayer cadence', () => {
  it('heals the living party and source in registration order on full seconds through the inclusive deadline', () => {
    const out = record({ ...input(), playerTeam: [unit('hero'), source(), unit('merc', 'player', { kind: 'merc' }),
      unit('summon', 'player', { kind: 'summon', summon: true, ownerId: 'hero' })] });
    expect(out.events.filter(e => e.kind === 'heal').map(e => [e.target, e.amount, e.simClockMs]))
      .toEqual(Array.from({ length: 60 }, (_, i) => ['hero', 'source', 'merc', 'summon']
        .map(id => [id, 5, (i + 1) * 1000])).flat());
    expect(out.result.playerTeam.map(u => u.life)).toEqual([50300, 50300, 50300, 50300]);
    expect(out.events.some(e => e.kind === 'mana' || e.kind === 'action')).toBe(false);
    expect(out.events.at(-1)).toMatchObject({ kind: 'end', winner: null, simClockMs: 60000 });
  });
  it('counts duplicate sources once and never scales with native merc level', () => {
    const out = record({ ...input(source({ level: 99 })), playerTeam: [unit('hero'), source({ level: 99 }), source({ id: 'duplicate' })] });
    expect(heals(out)).toEqual(Array.from({ length: 60 }, (_, i) => [(i + 1) * 1000, 5]));
  });
  it('caps actual restoration and excludes full/dead/enemy recipients without resurrection', () => {
    const out = record({ ...input(source({ life: 100000 })), playerTeam: [unit('hero', 'player', { life: 99998 }),
      source({ life: 100000 }), unit('dead', 'player', { kind: 'merc', life: 0 })] });
    expect(out.events.filter(e => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 2, simClockMs: 1000 })]);
    expect(out.result.playerTeam.map(u => u.life)).toEqual([100000, 100000, 0]);
    expect(out.result.enemyTeam[0]?.life).toBe(50000);
  });
  it.each(['stun', 'freeze'])('keeps native cadence while the living source is %s', id => {
    expect(heals(record(input(source({ statuses: [{ ...hold(), id }] }))))).toHaveLength(60);
  });
  it.each([
    { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
    { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
    { side: 'enemy' as const }, { life: 0 }, { life: NaN }, { life: Infinity },
    { level: 0 }, { level: NaN }, { level: Infinity }, { level: 1.5 }
  ])('refuses an ineligible marked source %j', patch => {
    expect(record(input(source(patch))).events.some(e => e.kind === 'heal')).toBe(false);
  });
  it('does not infer native authority from skill orders, buff IDs or self-only equipment identifiers', () => {
    const { mercPrayerAura: _marker, ...merc } = source();
    const out = record(input({ ...merc, skillOrder: ['aura-prayer'], activeBuffIds: ['prayer', 'aura-prayer', 'aura-redemption'] }));
    expect(out.events.some(e => e.kind === 'heal')).toBe(false);
  });
  it.each([500, 1000])('settles actual source death at %ims before native healing', at => {
    const out = record(input(source({ life: 1, statuses: [hold(), { id: 'poison', sourceId: 'enemy',
      stacks: 1, remaining: -1, dotPerStack: 1000 / at }] })));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'source', simClockMs: at }));
    expect(out.events.some(e => e.kind === 'heal')).toBe(false);
  });
  it('withdraws after a later actual source death and never fabricates another pulse', () => {
    const out = record(input(source({ life: 150, statuses: [hold(), { id: 'poison', sourceId: 'enemy',
      stacks: 1, remaining: -1, dotPerStack: 100 }] })));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'source', simClockMs: 1550 }));
    expect(heals(out)).toEqual([[1000, 5]]);
  });
  it('retains one presence when a duplicate dies and rebuilds fresh wave deadlines without carrying time', () => {
    const out = record({ ...input(), playerTeam: [unit('hero'), source(), source({ id: 'dying', life: 1,
      statuses: [hold(), { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: -1, dotPerStack: 1 }] })] });
    expect(heals(out)).toHaveLength(60);
    const hero = out.result.playerTeam.find(u => u.id === 'hero');
    if (!hero) throw new Error('Missing carried hero');
    expect(heals(record({ ...input(), playerTeam: [hero] }))).toEqual([]);
    expect(heals(record({ ...input(), playerTeam: [hero, source()] }))[0]).toEqual([1000, 5]);
  });
  it('settles a non-source recipient death before healing without suppressing the living party', () => {
    const out = record({ ...input(), playerTeam: [unit('hero'), source(), unit('doomed', 'player', { kind: 'merc', life: 1,
      statuses: [hold(), { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: -1, dotPerStack: 1 }] })] });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'doomed', simClockMs: 1000 }));
    expect(heals(out, 'doomed')).toEqual([]);
    expect(heals(out)).toHaveLength(60);
  });
  it('never banks full-life pulses and continues through ordinary healing playback', () => {
    hit();
    const out = record({ ...input(), playerTeam: [unit('hero', 'player', { life: 100000 }), source({ life: 100000 })],
      enemyTeam: [unit('enemy', 'enemy', { statuses: [hold(1701)], skillOrder: ['fixture.prayer-hit'] })] });
    expect(heals(out)).toEqual([[2000, 5], [3000, 5], [4000, 5], [5000, 5]]);
  });
  it('preserves ordinary paid active healing beside native regeneration', () => {
    registerSkill({ id: 'fixture.prayer-active-heal', archetype: 'fixture', target: 'self', minLevel: 1,
      manaCost: 2, cooldown: 100, effects: [{ kind: 'heal', amount: 3, target: 'self' }] });
    const out = record({ ...input(), playerTeam: [unit('hero', 'player', { statuses: [hold(1701)],
      skillOrder: ['fixture.prayer-active-heal'] }), source()] });
    expect(heals(out).slice(0, 3)).toEqual([[1000, 5], [1700, 3], [2000, 5]]);
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.mana).toBe(98);
  });
  it('preserves cumulative periodic damage and exact selected Meditation mana integration across extra native boundaries', () => {
    const hero = unit('hero', 'player', { mana: 0, manaRegenPerSecond: .37,
      manaRegenBaselinePerSecond: .37, statuses: [hold(), { id: 'poison', sourceId: 'enemy',
        stacks: 1, remaining: -1, dotPerStack: 10 }] });
    const { mercPrayerAura: _marker, ...merc } = source({ mana: 0 });
    const enabled = { ...input(), playerTeam: [hero, source({ mana: 0 })],
      meditationAura: { selectedAuraId: 'paladin.meditation' as const, sourceHeroId: 'hero',
        fieldedMercCombatId: 'source', rank: 20, maxRank: 20,
        sourceBaselinePerSecond: .37, manaRegenPctPerRank: .03 } };
    const out = record(enabled), control = record({ ...enabled, playerTeam: [hero, merc] });
    for (const id of ['hero', 'source']) {
      const active = out.result.playerTeam.find(u => u.id === id), inactive = control.result.playerTeam.find(u => u.id === id);
      expect(active?.mana).toBeGreaterThan(0);
      expect(active?.mana).toBe(inactive?.mana);
      expect(active?.manaRegenExactCarry).toBe(inactive?.manaRegenExactCarry);
    }
    for (const result of [out, control]) {
      expect(result.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === 'hero' ? e.amount : 0), 0)).toBe(600);
    }
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.life).toBe(49700);
    expect(control.result.playerTeam.find(u => u.id === 'hero')?.life).toBe(49400);
  });
  it.each(['paladin.prayer', 'paladin.cleansing'] as const)('adds flat native healing beside selected %s scaling, ownership and independent timing', id => {
    const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
      selectedAuraId: id, skillLevels: { [id]: 20 } }, 'source');
    if (!statAura) throw new Error('Missing selected healing aura');
    const out = record({ ...input(), statAura, playerTeam: [unit('hero'), source(),
      unit('summon', 'player', { kind: 'summon', summon: true, ownerId: 'hero' })] });
    const amount = id === 'paladin.prayer' ? 32 : 26;
    expect(heals(out).filter(([at]) => at === 5000)).toEqual([[5000, amount], [5000, 5]]);
    expect(heals(out, 'source')).toEqual(heals(out));
    expect(heals(out, 'summon')).toEqual(Array.from({ length: 60 }, (_, i) => [(i + 1) * 1000, 5]));
    expect(out.result.playerTeam.find(u => u.id === 'hero')?.life).toBe(50000 + 300 + 12 * amount);
  });
  it('keeps another selected pulse timer and stops before native healing if that pulse ends battle', () => {
    const statAura = { selectedAuraId: 'paladin.holy-shock' as const, sourceHeroId: 'hero', rank: 1, maxRank: 20,
      bonuses: { lightningDamagePct: .03 }, pulse: { intervalMs: 1000, damage: 20, damageType: 'lightning' as const } };
    const ended = record({ ...input(), statAura, enemyTeam: [unit('enemy', 'enemy', { life: 20 })] });
    expect(ended.events.some(e => e.kind === 'heal')).toBe(false);
    expect(ended.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player', simClockMs: 1000 });
    const active = record({ ...input(), statAura });
    expect(active.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(60);
    expect(heals(active)).toHaveLength(60);
  });
  it('heals before a later tied action kills the source and withdraws at subsequent deadlines', () => {
    hit(100);
    const out = record({ ...input(source({ life: 1 })), enemyTeam: [unit('enemy', 'enemy', { statuses: [],
      skillOrder: ['fixture.prayer-hit'], stats: { ...unit('enemy', 'enemy').stats, attackSpeed: 0 } })] });
    const heal = out.events.findIndex(e => e.kind === 'heal' && e.target === 'source' && e.simClockMs === 2000);
    const death = out.events.findIndex(e => e.kind === 'death' && e.target === 'source' && e.simClockMs === 2000);
    expect(heal).toBeGreaterThan(-1); expect(death).toBeGreaterThan(heal);
    expect(heals(out)).toEqual([[1000, 5], [2000, 5]]);
  });
  it('stops at the actual action cap without healing future boundaries', () => {
    const fast = (u: CombatUnit): CombatUnit => ({ ...u, statuses: [], stats: { ...u.stats, attackSpeed: 263 } });
    const out = record({ ...input(), playerTeam: [unit('hero'), source(), ...Array.from({ length: 7 }, (_, i) =>
      fast(unit('bench-' + String(i), 'player', { kind: 'merc' })))], enemyTeam: [fast(unit('enemy', 'enemy'))] });
    const end = out.events.at(-1)?.simClockMs;
    expect(end).toBeDefined(); expect(end).toBeLessThan(60000);
    expect(heals(out).map(([at]) => at)).toEqual(Array.from({ length: Math.floor((end ?? 0) / 1000) }, (_, i) => (i + 1) * 1000));
  });
  it('heals an actual late summon without adding actions or RNG draws in the same survival topology', () => {
    hit();
    registerSkill({ id: 'fixture.prayer-minion', archetype: 'fixture', target: 'self', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
    const hero = unit('hero', 'player', { statuses: [hold(901)], skillOrder: ['fixture.prayer-minion'],
      stats: { ...unit('hero').stats, attackSpeed: 200 } });
    const { mercPrayerAura: _marker, ...merc } = source();
    const enabled = { ...input(), playerTeam: [hero, source()], enemyTeam: [unit('enemy', 'enemy', {
      statuses: [hold(1701)], skillOrder: ['fixture.prayer-hit'] })] };
    const disabled = { ...enabled, playerTeam: [hero, merc] };
    const tails: number[] = [], calls: unknown[][] = [], results: ReturnType<typeof runBattleRecorded>[] = [];
    for (const snapshot of [enabled, disabled]) {
      const random = rngModule.createRng(7), chance = vi.spyOn(random, 'chance');
      vi.spyOn(rngModule, 'createRng').mockReturnValueOnce(random);
      results.push(runBattleRecorded(snapshot)); calls.push(chance.mock.calls); tails.push(random.next());
      vi.restoreAllMocks();
    }
    const [out, control] = results;
    if (!out || !control) throw new Error('Missing paired output');
    const spawn = out.events.find(e => e.kind === 'summon');
    if (spawn?.kind !== 'summon') throw new Error('Missing actual late summon');
    expect(spawn.simClockMs).toBe(900);
    expect(out.events.find(e => e.kind === 'damage' && e.target === spawn.unit.id)).toMatchObject({ simClockMs: 1700, amount: 10 });
    expect(heals(out, spawn.unit.id)).toEqual([[2000, 5], [3000, 5]]);
    expect(heals(control, spawn.unit.id)).toEqual([]);
    // Playback delays depend on adjacent events; native heals add observations.
    const actions = (result: typeof out) => result.events.filter(e => e.kind === 'action')
      .map(({ uiDelayMs: _delay, ...action }) => action);
    expect(actions(out)).toEqual(actions(control));
    expect(calls[0]).toEqual(calls[1]); expect(tails[0]).toBe(tails[1]);
    expect(record(enabled)).toEqual(out);
  });
});
