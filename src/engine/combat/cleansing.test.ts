import { beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { applyStatus, rebaseStatusClock, spreadPlague } from './status';
import { createRng } from '../rng';

function unit(id: string, side: CombatUnit['side'], kind: CombatUnit['kind'] = side === 'player' ? 'hero' : 'monster'): CombatUnit {
  return { id, name: id, side, kind, level: 30, tier: 'trash', life: 50000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 1, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }],
    skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function aura(rank = 1) {
  return { selectedAuraId: 'paladin.cleansing' as const, sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank, maxRank: 20,
    bonuses: { lifeRegenPct: rank * .015, magicDodgePct: rank * .005 },
    cleansingDurationMultiplier: .5, healing: { intervalMs: 5000, amount: 20 } };
}
function poison(expiresAtMs = 4000): ActiveStatus {
  return { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: 4, appliedAtMs: 0, expiresAtMs,
    dotPerStack: 10, damageType: 'poison' };
}
function indefinitePoison(): ActiveStatus {
  const { expiresAtMs: _expiry, ...status } = poison(); return status;
}
function curse(id: string): ActiveStatus {
  const { dotPerStack: _rate, ...status } = poison(); return { ...status, id };
}
function input(): CombatSnapshot {
  return { seed: 7, playerTeam: [unit('hero', 'player'), unit('merc', 'player', 'merc')],
    enemyTeam: [unit('enemy', 'enemy')], statAura: aura() };
}
function record(snapshot: CombatSnapshot) {
  const original = structuredClone(snapshot), result = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(original); expect(runBattleRecorded(snapshot)).toEqual(result);
  return result;
}
function observedStatuses(result: ReturnType<typeof record>, target: string, at?: number): readonly ActiveStatus[] {
  const event = result.events.find(e => e.kind === 'status-state' && e.target === target && (at === undefined || e.simClockMs === at));
  if (event?.kind !== 'status-state') throw new Error('Missing observed statuses'); return event.statuses;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Cleansing actual duration and recovery', () => {
  it('halves carried finite poison damage once for hero/original merc, preserves potency/source and heals on the shared timeline', () => {
    const snapshot = input();
    const playerTeam = snapshot.playerTeam.map(u => ({ ...u, statuses: [...u.statuses, poison()] }));
    const result = record({ ...snapshot, playerTeam });
    for (const target of ['hero', 'merc']) {
      const dots = result.events.filter(e => e.kind === 'dot' && e.target === target);
      expect(dots.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(20);
      expect(dots.every(e => e.simClockMs <= 2000)).toBe(true);
    }
    expect(observedStatuses(result, 'hero')).toContainEqual({ ...poison(2000), cleansingShortened: true });
    expect(result.events.filter(e => e.kind === 'heal' && e.target === 'hero').map(e => [e.simClockMs, e.kind === 'heal' ? e.amount : 0]))
      .toEqual(Array.from({ length: 12 }, (_, i) => [(i + 1) * 5000, 20]));
    expect(result.result.playerTeam.map(u => u.life)).toEqual([50220, 50220]);
  });
  it.each(['poison', 'plague', 'amplify', 'amplify-damage', 'decrepify', 'dim-vision', 'weaken',
    'iron-maiden', 'terror', 'confuse', 'life-tap', 'attract', 'lower-resist'])('shortens finite %s without changing its identity or original payload', id => {
    const hero = unit('hero', 'player'), status = curse(id);
    const result = record({ ...input(), playerTeam: [{ ...hero, statuses: [...hero.statuses, status] }] });
    expect(observedStatuses(result, 'hero')).toContainEqual(expect.objectContaining({ id, expiresAtMs: 2000, sourceId: 'enemy', stacks: 1 }));
  });
  it('never shortens unrelated statuses, legacy indefinite poison, or finite status records a second time across waves', () => {
    const hero = unit('hero', 'player');
    const statuses: ActiveStatus[] = [...hero.statuses, { ...poison(), id: 'bleed' },
      { ...indefinitePoison(), id: 'plague' },
      { ...poison(), expiresAtMs: 4000, cleansingShortened: true }];
    const result = record({ ...input(), playerTeam: [{ ...hero, statuses }] });
    expect(result.events.find(e => e.kind === 'status-state' && e.target === 'hero')).toMatchObject({ statuses });
  });
  it('shortens remaining duration for a carried status and full duration for a future status', () => {
    const hero = unit('hero', 'player');
    const result = record({ ...input(), playerTeam: [{ ...hero, statuses: [...hero.statuses,
      { ...poison(3000), appliedAtMs: -1000 }, { ...poison(6000), id: 'plague', appliedAtMs: 2000 }] }] });
    expect(observedStatuses(result, 'hero')).toContainEqual(expect.objectContaining({ id: 'poison', expiresAtMs: 1500 }));
    expect(observedStatuses(result, 'hero', 2000)).toContainEqual(expect.objectContaining({ id: 'plague', expiresAtMs: 4000 }));
  });
  it('rejects dead/forged sources and excludes summons, bench and ownership-forged recipients', () => {
    for (const patch of [{ life: 0 }, { ownerId: 'other' }, { summonOwnerId: 'other' }, { summon: true }, { kind: 'merc' as const }]) {
      const hero = { ...unit('hero', 'player'), ...patch }, merc = unit('merc', 'player', 'merc');
      const result = record({ ...input(), playerTeam: [hero, { ...merc, statuses: [...merc.statuses, poison()] }] });
      expect(result.events.filter(e => e.kind === 'heal')).toEqual([]);
      expect(observedStatuses(result, 'merc')).toContainEqual(expect.objectContaining({ id: 'poison', expiresAtMs: 4000 }));
    }
    for (const patch of [{ id: 'bench' }, { ownerId: 'hero' }, { summonOwnerId: 'hero' }, { summon: true }, { kind: 'summon' as const }]) {
      const merc = unit('merc', 'player', 'merc'), recipient = { ...merc, ...patch, statuses: [...merc.statuses, poison()] };
      const result = record({ ...input(), playerTeam: [unit('hero', 'player'), recipient] });
      expect(observedStatuses(result, recipient.id)).toContainEqual(expect.objectContaining({ id: 'poison', expiresAtMs: 4000 }));
      expect(result.events.filter(e => e.kind === 'heal').every(e => e.target === 'hero')).toBe(true);
    }
  });
  it.each([[1, 20], [2, 20], [20, 26]])('uses authored recovery rank %i for %i actual HP without action/mana/RNG cost', (rank, amount) => {
    const snapshot = { ...input(), statAura: aura(rank) }, result = record(snapshot);
    expect(result.events.filter(e => e.kind === 'heal' && e.target === 'hero').map(e => e.kind === 'heal' ? e.amount : 0))
      .toEqual(Array.from({ length: 12 }, () => amount));
    expect(result.events.some(e => e.kind === 'action' || e.kind === 'mana')).toBe(false);
    expect(result.events.at(-1)).toMatchObject({ kind: 'end', simClockMs: 60000 });
  });
  it('shortens actual incoming poison/default duration and respects fresh reapplications after expiry', () => {
    registerSkill({ id: 'fixture.poison', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      manaCost: 0, cooldown: 10, effects: [{ kind: 'damage', damageType: 'poison', base: [10, 10],
        applyStatus: { id: 'poison', chance: 1, dotPctOfDamage: 1 } }] });
    const enemy = { ...unit('enemy', 'enemy'), statuses: [], skillOrder: ['fixture.poison'] };
    const result = record({ ...input(), playerTeam: [unit('hero', 'player')], enemyTeam: [enemy] });
    const applied = result.events.filter(e => e.kind === 'status-state' && e.target === 'hero')
      .flatMap(e => e.kind === 'status-state' ? e.statuses.filter(s => s.id === 'poison') : []);
    expect(applied.length).toBeGreaterThan(1);
    for (const status of applied) {
      expect((status.expiresAtMs ?? 0) - (status.appliedAtMs ?? 0)).toBe(2500);
      expect(status).toMatchObject({ stacks: 1, sourceId: 'enemy', dotPerStack: 10 });
    }
    expect(new Set(applied.map(s => s.appliedAtMs)).size).toBeGreaterThan(1);
  });
  it('ends actual Amplify mitigation at the shortened boundary and leaves later physical hits unamplified', () => {
    const hero = unit('hero', 'player'), enemy = { ...unit('enemy', 'enemy'), statuses: [],
      basicAttack: { damageType: 'physical' as const, damage: [100, 100] as const },
      stats: { ...unit('enemy', 'enemy').stats, attackSpeed: 100 } };
    const result = record({ ...input(), playerTeam: [{ ...hero, statuses: [...hero.statuses,
      { ...curse('amplify'), physicalResistReductionPct: 25 }] }], enemyTeam: [enemy] });
    const hits = result.events.filter(e => e.kind === 'damage' && e.source === 'enemy');
    expect(hits[0]).toMatchObject({ amount: 125, simClockMs: 1700 });
    const landedAfterExpiry = hits.filter(e => e.simClockMs >= 2000 && e.kind === 'damage' && e.amount > 0);
    expect(landedAfterExpiry.length).toBeGreaterThan(0);
    for (const hit of landedAfterExpiry) expect(hit).toMatchObject({ amount: 100, dodged: false });
  });
  it('shortens an incoming curse through the real debuff skill path, preserving canonical potency and source', () => {
    registerSkill({ id: 'fixture.curse', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'debuff', statusId: 'amplify', durationMs: 4000, physicalResistReductionPct: 25 }] });
    const enemy = { ...unit('enemy', 'enemy'), statuses: [], skillOrder: ['fixture.curse'] };
    const result = record({ ...input(), playerTeam: [unit('hero', 'player')], enemyTeam: [enemy] });
    expect(observedStatuses(result, 'hero', 1700)).toContainEqual(expect.objectContaining({
      id: 'amplify-damage', appliedAtMs: 1700, expiresAtMs: 3700,
      sourceId: 'enemy', physicalResistReductionPct: 25, cleansingShortened: true }));
  });
  it('applies magical dodge to real incoming magical hits without adding random rolls', () => {
    const hero = unit('hero', 'player'), enemy = { ...unit('enemy', 'enemy'), statuses: [],
      basicAttack: { damageType: 'arcane' as const, damage: [100, 100] as const } };
    const snapshot = { ...input(), playerTeam: [hero], enemyTeam: [enemy] };
    const withAura = record({ ...snapshot, statAura: aura(20) });
    const { statAura: _aura, ...without } = snapshot;
    const expected = runBattleRecorded({ ...without, playerTeam: [{ ...hero, stats: { ...hero.stats, magicDodge: .1 } }] });
    const hits = (r: typeof expected) => r.events.filter(e => e.kind === 'damage');
    expect(hits(withAura)).toEqual(hits(expected));
    expect(hits(withAura).some(e => e.dodged)).toBe(true);
  });
  it('stops future recovery on exact source death, retaining already shortened status expiry', () => {
    const hero = unit('hero', 'player'), merc = unit('merc', 'player', 'merc');
    const result = record({ ...input(), playerTeam: [{ ...hero, life: 15, statuses: [...hero.statuses,
      { ...poison(), id: 'bleed' }] }, { ...merc, statuses: [...merc.statuses, poison()] }] });
    expect(result.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'hero', simClockMs: 1500 }));
    expect(result.events.some(e => e.kind === 'heal')).toBe(false);
    expect(result.result.playerTeam[1]?.statuses).toContainEqual(expect.objectContaining({ id: 'poison', expiresAtMs: 2000 }));
  });
});

describe('Cleansing duration application and carry identity', () => {
  it('supports alternate tuning and boss scaling before one final millisecond floor without changing ordinary legacy behavior', () => {
    const rng = createRng(7), hero = { ...unit('hero', 'player'), tier: 'boss' as const, statuses: [] };
    const incoming = { id: 'poison', sourceId: 'enemy', simClockMs: 1000, durationMs: 3001,
      config: { duration: 5, maxStacks: 10, bossDurationMult: .5 }, cleansingDurationMultiplier: .25 };
    expect(applyStatus(hero, incoming, rng).statuses[0]).toMatchObject({ expiresAtMs: 1375, cleansingShortened: true });
    expect(applyStatus(hero, { ...incoming, durationMs: 1 }, rng).statuses[0]?.expiresAtMs).toBe(1001);
    const { cleansingDurationMultiplier: _multiplier, ...ordinary } = incoming;
    for (const invalid of [0, 1, -1, NaN, Infinity]) {
      expect(applyStatus(hero, { ...incoming, cleansingDurationMultiplier: invalid }, rng).statuses[0])
        .toEqual(applyStatus(hero, ordinary, createRng(7)).statuses[0]);
    }
    const { simClockMs: _clock, ...legacy } = ordinary;
    expect(applyStatus(hero, { ...legacy, cleansingDurationMultiplier: .25 }, rng).statuses[0])
      .toEqual(applyStatus(hero, legacy, createRng(7)).statuses[0]);
  });
  it('shortens each incoming duration once while refreshing stacks without replacing valid source/potency', () => {
    const hero = { ...unit('hero', 'player'), statuses: [] };
    const rng = createRng(7), incoming = { id: 'poison', sourceId: 'first', simClockMs: 0,
      durationMs: 4000, dotPerStack: 10, cleansingDurationMultiplier: .5 };
    const first = applyStatus(hero, incoming, rng);
    expect(first.statuses[0]).toMatchObject({ expiresAtMs: 2000, cleansingShortened: true });
    const refreshed = applyStatus(first, { ...incoming, simClockMs: 1000, sourceId: 'second', dotPerStack: 99 }, rng);
    expect(refreshed.statuses[0]).toMatchObject({ appliedAtMs: 0, expiresAtMs: 3000, stacks: 2, sourceId: 'first', dotPerStack: 10 });
    const third = applyStatus(refreshed, { ...incoming, simClockMs: 1000 }, rng);
    expect(third.statuses[0]).toMatchObject({ expiresAtMs: 3000, stacks: 3 });
    const fresh = applyStatus(third, { ...incoming, simClockMs: 3000, sourceId: 'new', dotPerStack: 5 }, rng);
    expect(fresh.statuses[0]).toMatchObject({ appliedAtMs: 3000, expiresAtMs: 5000, stacks: 1, sourceId: 'new', dotPerStack: 5 });
    const carried = rebaseStatusClock(refreshed, 1500);
    const next = record({ ...input(), playerTeam: [carried] });
    expect(next.events.find(e => e.kind === 'status-state' && e.target === 'hero'))
      .toMatchObject({ statuses: [expect.objectContaining({ expiresAtMs: 1500, cleansingShortened: true })] });
  });
  it('shortens existing unmarked timed status once before refresh but preserves indefinite identity', () => {
    const rng = createRng(7), hero = unit('hero', 'player');
    const incoming = { id: 'poison', sourceId: 'new', simClockMs: 1000,
      durationMs: 1000, dotPerStack: 99, cleansingDurationMultiplier: .5 };
    const refreshed = applyStatus({ ...hero, statuses: [poison(5000)] }, incoming, rng);
    expect(refreshed.statuses[0]).toMatchObject({ expiresAtMs: 3000, stacks: 2, sourceId: 'enemy', dotPerStack: 10 });
    const indefinite = applyStatus({ ...hero, statuses: [indefinitePoison()] }, incoming, rng);
    expect(indefinite.statuses[0]?.expiresAtMs).toBeUndefined();
    expect(indefinite.statuses[0]).not.toHaveProperty('cleansingShortened');
  });
  it('uses recipient duration authority for death spread, without inheriting a source reduction marker', () => {
    const source = { ...unit('dead', 'player', 'merc'), statuses: [{ ...poison(), cleansingShortened: true as const }] };
    const rng = createRng(7), result = spreadPlague(source, [unit('hero', 'player'), unit('bench', 'player', 'merc')], .5, rng, 1000,
      u => u.id === 'hero' ? .5 : undefined);
    expect(result[0]?.statuses.find(s => s.id === 'poison')).toMatchObject({ expiresAtMs: 3500, cleansingShortened: true });
    expect(result[1]?.statuses.find(s => s.id === 'poison')).toMatchObject({ expiresAtMs: 6000 });
  });
});
