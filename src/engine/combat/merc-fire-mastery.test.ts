import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { composeStatAura } from '../skills/stat-auras';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import type { DamageEffect } from '../skills/effects';
import { getSummon, registerSummon } from '../skills/summons';
import { paySorceressBuff } from '../skills/sorceress-buffs';
import { payPeriodicSpell } from '../skills/periodic-spells';
import { composeHeroRecovery } from '../progression/warmth';
import * as rngModule from '../rng';

const stun = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
function unit(id: string, side: CombatUnit['side'] = 'player'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 100, defense: 0,
      magicResist: 0, attackSpeed: 200, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    basicAttack: { damageType: 'fire', damage: [100, 100] },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function source(): CombatUnit {
  return { ...unit('merc-source'), kind: 'merc', mercFireMastery: true, statuses: [stun] };
}
function snapshot(merc = source(), actor = unit('hero')): CombatSnapshot {
  return { seed: 7, playerTeam: [actor, merc], enemyTeam: [{ ...unit('target', 'enemy'), statuses: [stun] }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  for (const original of [...input.playerTeam, ...input.enemyTeam]) {
    const result = [...out.result.playerTeam, ...out.result.enemyTeam].find(row => row.id === original.id);
    expect(result?.stats).toEqual(original.stats);
  }
  return out;
}
function firstDamage(input: CombatSnapshot, sourceId = 'hero') {
  const hit = record(input).events.find(event => event.kind === 'damage' && event.source === sourceId);
  if (hit?.kind !== 'damage') throw new Error('Missing actual damage from ' + sourceId);
  return hit;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

function fixed(effect: DamageEffect): string {
  const id = 'fixture.fire-mastery-fixed';
  registerSkill({ id, archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 0, cooldown: 100000, effects: [effect] });
  return id;
}
function withoutSource(input: CombatSnapshot): CombatSnapshot {
  return { ...input, playerTeam: input.playerTeam.map(({ mercFireMastery: _marker, ...actor }) => actor) };
}

describe('native mercenary Fire Mastery presence', () => {
  it.each(['hero', 'merc', 'summon'] as const)('increases direct Fire damage for a living allied %s', kind => {
    const actor = { ...unit('hero'), kind, ...(kind === 'summon' ? { summon: true, ownerId: 'owner' } : {}) };
    expect(firstDamage(snapshot(source(), actor))).toMatchObject({ amount: 125 });
  });
  it('includes the source itself without writing an ordinary aura buff or consuming an action', () => {
    const merc = { ...source(), statuses: [], skillOrder: ['passive-fire-mastery'] };
    const result = record(snapshot(merc, { ...unit('hero'), statuses: [stun] }));
    expect(result.events.find(e => e.kind === 'damage' && e.source === merc.id)).toMatchObject({ amount: 125 });
    expect(result.events.some(e => e.kind === 'action' && e.skillId === 'passive-fire-mastery')).toBe(false);
    expect(result.result.playerTeam.find(row => row.id === merc.id)?.activeBuffIds).toEqual([]);
  });
  it('adds to existing increases before criticals, Fire resistance and ordinary Defense', () => {
    const input = snapshot(source(), { ...unit('hero'), increasedDamagePct: { fire: .25 },
      stats: { ...unit('hero').stats, critChance: 1 } });
    const target = { ...unit('target', 'enemy'), statuses: [stun],
      stats: { ...unit('target', 'enemy').stats, defense: 7,
        resistances: { ...unit('target', 'enemy').stats.resistances, fire: 25 } } };
    // floor(100 * (1 + .25 + .25) * 2 * .75 - 7) = 218.
    expect(firstDamage({ ...input, enemyTeam: [target] })).toMatchObject({ amount: 218, crit: true });
  });
  it('stacks additively with selected Holy Fire and ignores duplicate native sources or ranks', () => {
    const input = snapshot();
    const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
      skillLevels: { 'paladin.holy-fire': 20 }, selectedAuraId: 'paladin.holy-fire' }, 'merc-source');
    if (!statAura) throw new Error('Missing real selected Holy Fire');
    const result = record({ ...input, statAura, playerTeam: [...input.playerTeam,
      { ...source(), id: 'duplicate', level: 99, skillLevels: { 'passive-fire-mastery': 20 } }] });
    expect(result.events.find(e => e.kind === 'damage' && e.source === 'hero' && e.simClockMs === 900))
      .toMatchObject({ amount: 185 });
  });
  it('withdraws at actual source death, and starts the next wave without a retained bonus', () => {
    registerSkill({ id: 'fixture.might-fixed-hit', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      manaCost: 0, cooldown: 1, effects: [{ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true }] });
    const merc = { ...source(), life: 2, statuses: [stun, { id: 'poison', stacks: 1, sourceId: 'fixture',
      remaining: -1, dotPerStack: 1 }] };
    const hero = { ...unit('hero'), skillOrder: ['fixture.might-fixed-hit'], stats: { ...unit('hero').stats, attackSpeed: 100 } };
    const result = record(snapshot(merc, hero));
    expect(result.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id, simClockMs: 2000 }));
    const hits = result.events.filter(e => e.kind === 'damage' && e.source === 'hero');
    expect(hits.slice(0, 2)).toEqual([
      expect.objectContaining({ amount: 125, simClockMs: 1700 }),
      expect.objectContaining({ amount: 100, simClockMs: 3400 })
    ]);
    const carried = result.result.playerTeam.find(row => row.id === 'hero');
    if (!carried) throw new Error('Missing carried hero');
    expect(firstDamage({ ...snapshot(), playerTeam: [carried] })).toMatchObject({ amount: 100 });
  });
  it.each(['stun', 'freeze'])('keeps the presence while the living source is %s', id => {
    expect(firstDamage(snapshot({ ...source(), statuses: [{ ...stun, id }] }))).toMatchObject({ amount: 125 });
  });
  it.each([
    { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
    { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
    { side: 'enemy' as const }, { life: 0 }, { life: NaN }, { level: 0 }, { level: 1.5 }
  ])('refuses an ineligible source %j', patch => {
    expect(firstDamage(snapshot({ ...source(), ...patch }))).toMatchObject({ amount: 100 });
  });
  it('does not infer native authority from a skill order or buff marker', () => {
    const { mercFireMastery: _marker, ...merc } = source();
    expect(firstDamage(snapshot({ ...merc, skillOrder: ['passive-fire-mastery'], activeBuffIds: ['might', 'passive-fire-mastery'] })))
      .toMatchObject({ amount: 100 });
  });
  it.each(['physical', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)('does not increase %s damage', damageType => {
    expect(firstDamage(snapshot(source(), { ...unit('hero'), basicAttack: { damageType, damage: [100, 100] } })))
      .toMatchObject({ amount: 100, damageType });
  });
  it('never grants the party increase to enemies', () => {
    const input = snapshot(source(), { ...unit('hero'), statuses: [stun] });
    expect(firstDamage({ ...input, enemyTeam: [unit('target', 'enemy')] }, 'target')).toMatchObject({ amount: 100 });
  });

  it('adds to real player Fire Mastery and Warmth rather than multiplying their bonus', () => {
    const recovery = composeHeroRecovery({ classId: 'sorceress', level: 40, effectiveEnergy: 20,
      skillLevels: { 'skills-sorceress-fire-mastery': 20, 'skills-sorceress-warmth': 20 } });
    // Player +.80 Mastery +.20 Warmth, native +.25: 100 * 2.25 = 225.
    expect(firstDamage(snapshot(source(), { ...unit('hero'), ...recovery }))).toMatchObject({ amount: 225 });
  });
  it('rebuilds one native Fire addition for the Fire share of a weighted hit', () => {
    const skill = fixed({ kind: 'damage', damageType: 'physical', base: [100, 100], alwaysHits: true,
      components: [{ damageType: 'physical', weight: 1 }, { damageType: 'fire', weight: 1 }] });
    const out = record(snapshot(source(), { ...unit('hero'), skillOrder: [skill] }));
    expect(out.events.filter(e => e.kind === 'damage').slice(0, 2)).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 50 }),
      expect.objectContaining({ damageType: 'fire', amount: 62 })
    ]);
  });
  it('adds native Fire to the paid Enchant share without changing its physical carrier', () => {
    const enchant = { id: 'enchant', sourceId: 'hero', stacks: 1, remaining: 10,
      appliedAtMs: 0, expiresAtMs: 10000, sorceressBuff: paySorceressBuff('enchant', 20, 100) };
    const out = record(snapshot(source(), { ...unit('hero'), statuses: [enchant],
      basicAttack: { damageType: 'physical', damage: [100, 100] } }));
    expect(out.events.filter(e => e.kind === 'damage').slice(0, 2)).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 100 }),
      expect.objectContaining({ damageType: 'fire', amount: 50 })
    ]);
  });
  it('includes an actual late Fire summon, restoring its template after the control', () => {
    const original = getSummon('minion');
    if (!original) throw new Error('Missing real minion factory');
    registerSummon('minion', owner => ({ ...original(owner), basicAttack: { damageType: 'fire', damage: [10, 10] } }));
    try {
      registerSkill({ id: 'fixture.fire-minion', archetype: 'fixture', target: 'self', minLevel: 1,
        manaCost: 0, cooldown: 100000, effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
      const input = snapshot(source(), { ...unit('hero'), skillOrder: ['fixture.fire-minion'] });
      const enabled = record(input), control = record(withoutSource(input));
      const summon = enabled.events.find(e => e.kind === 'summon');
      if (summon?.kind !== 'summon') throw new Error('Missing actual late summon');
      expect(enabled.events.find(e => e.kind === 'damage' && e.source === summon.unit.id))
        .toMatchObject({ damageType: 'fire', amount: 12 });
      expect(control.events.find(e => e.kind === 'damage' && e.source === summon.unit.id))
        .toMatchObject({ damageType: 'fire', amount: 10 });
    } finally { registerSummon('minion', original); }
  });
  it.each(['source', 'attacker', 'neither'] as const)('checks current living support/attacker at impact after %s death', death => {
    const skill = fixed({ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true, projectileFlightMs: 500 });
    const poison = { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 1 };
    const merc = { ...source(), ...(death === 'source' ? { life: 2, statuses: [stun, poison] } : {}) };
    const hero = { ...unit('hero'), skillOrder: [skill], stats: { ...unit('hero').stats, attackSpeed: 100 },
      statuses: [{ ...stun, appliedAtMs: 1701 }, ...(death === 'attacker' ? [poison] : [])],
      ...(death === 'attacker' ? { life: 2, kind: 'merc' as const } : {}) };
    const scene = snapshot(merc, hero);
    const out = record(death === 'attacker' ? { ...scene, playerTeam: [...scene.playerTeam,
      { ...unit('surviving-hero'), statuses: [stun] }] } : scene);
    if (death !== 'neither') expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death',
      target: death === 'source' ? merc.id : hero.id, simClockMs: 2000 }));
    expect(out.events.find(e => e.kind === 'damage' && e.source === hero.id))
      .toMatchObject({ amount: death === 'neither' ? 125 : 100, simClockMs: 2200 });
  });
  it('withdraws before an action tied with the source periodic death', () => {
    const skill = fixed({ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true });
    const merc = { ...source(), life: 2, statuses: [stun,
      { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 1 }] };
    const hero = { ...unit('hero'), skillOrder: [skill], stats: { ...unit('hero').stats, attackSpeed: 62.5 } };
    const out = record(snapshot(merc, hero));
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id, simClockMs: 2000 }));
    expect(out.events.find(e => e.kind === 'damage' && e.source === hero.id)).toMatchObject({ amount: 100, simClockMs: 2000 });
  });
  it.each([1701, 3401])('snapshots enhanced fresh Burn once and preserves its refresh after source death (%i)', stop => {
    registerSkill({ id: 'fixture.fire-burn', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      manaCost: 0, cooldown: 1, effects: [{ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true,
        applyStatus: { id: 'burn', durationMs: 3000, dotPctOfDamage: .1 } }] });
    const merc = { ...source(), life: 2, statuses: [stun,
      { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 1 }] };
    const hero = { ...unit('hero'), skillOrder: ['fixture.fire-burn'], statuses: [{ ...stun, appliedAtMs: stop }],
      stats: { ...unit('hero').stats, attackSpeed: 100 } };
    const out = record(snapshot(merc, hero));
    expect(out.events.filter(e => e.kind === 'damage').map(e => e.amount)).toEqual(stop === 1701 ? [125] : [125, 100]);
    expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'burn')).toHaveLength(stop === 1701 ? 1 : 2);
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id, simClockMs: 2000 }));
    // Initial12/s: single3s=36. Refresh retains12, then doubles stacks: floor(12*1.7+24*3)=92.
    expect(out.events.filter((e): e is Extract<typeof e, { kind: 'dot' }> => e.kind === 'dot' && e.target === 'target').reduce((n, e) => n + e.amount, 0))
      .toBe(stop === 1701 ? 36 : 92);
  });
  it('preserves stored Burn potency through actual Fire Wall refreshes while enhancing pulses once', () => {
    const hero = payPeriodicSpell({ ...unit('hero'), statuses: [stun],
      periodicSpellRanks: { 'fire-wall': 1, 'thunder-storm': 0 } }, 'fire-wall', 1, 0);
    const input = snapshot(source(), hero);
    const target = { ...unit('target', 'enemy'), statuses: [stun,
      { id: 'burn', sourceId: 'old', stacks: 1, remaining: 3, appliedAtMs: 0, expiresAtMs: 3000, dotPerStack: 10 }] };
    const scene = { ...input, enemyTeam: [target] };
    const enabled = record(scene), control = record(withoutSource(scene));
    const ordinary = control.events.find(e => e.kind === 'damage' && e.source === hero.id);
    const enhanced = enabled.events.find(e => e.kind === 'damage' && e.source === hero.id);
    if (ordinary?.kind !== 'damage' || enhanced?.kind !== 'damage') throw new Error('Missing real Fire Wall pulse');
    expect(ordinary.amount).toBeGreaterThan(0);
    expect(enhanced.amount).toBe(Math.floor(ordinary.amount * 1.25));
    const dots = (out: typeof enabled) => out.events.filter((e): e is Extract<typeof e, { kind: 'dot' }> => e.kind === 'dot' && e.target === target.id);
    expect(dots(enabled)).toEqual(dots(control));
    // Existing10/s, stacks1to2to3 after pulses1000/2000, expiry5000: 10+20+90=120.
    expect(dots(enabled).reduce((n, e) => n + e.amount, 0)).toBe(120);
  });
  it('enhances real selected Holy Fire pulses without taking selected aura ownership', () => {
    const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
      selectedAuraId: 'paladin.holy-fire', skillLevels: { 'paladin.holy-fire': 1 } });
    if (!statAura) throw new Error('Missing selected Holy Fire');
    const out = record({ ...snapshot(source(), { ...unit('hero'), statuses: [stun] }), statAura });
    expect(out.events.find(e => e.kind === 'damage')).toMatchObject({ source: 'hero', amount: 25, simClockMs: 1000 });
    expect(out.events.some(e => e.kind === 'action' && e.skillId === 'passive-fire-mastery')).toBe(false);
  });
  it('preserves actual RNG calls/tails, actions, resources and base stats with unchanged survival', () => {
    const create = rngModule.createRng;
    const track = (rng: rngModule.Rng) => ({ rng, calls: { next: vi.spyOn(rng, 'next'),
      nextInt: vi.spyOn(rng, 'nextInt'), chance: vi.spyOn(rng, 'chance'), pick: vi.spyOn(rng, 'pick') } });
    const streams: ReturnType<typeof track>[] = [];
    vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
      const rng = create(seed);
      streams.push(track(rng));
      return rng;
    });
    const observe = (input: CombatSnapshot) => {
      streams.length = 0;
      const result = runBattleRecorded(input);
      const observations = streams.map(({ rng, calls }) => ({
        methods: Object.fromEntries(Object.entries(calls).map(([method, spy]) => [method,
          { calls: structuredClone(spy.mock.calls), results: spy.mock.results.map((row): unknown => row.value) }])),
        tail: [rng.next(), rng.next(), rng.next()] }));
      return { result, observations };
    };
    const input = snapshot(), enabled = observe(input), control = observe(withoutSource(input));
    expect(enabled.observations).toEqual(control.observations);
    expect(enabled.observations.length).toBeGreaterThan(0);
    expect(enabled.result.events.filter(e => e.kind === 'action')).toEqual(control.result.events.filter(e => e.kind === 'action'));
    expect(enabled.result.result.playerTeam.map(u => ({ id: u.id, mana: u.mana, stats: u.stats, cooldowns: u.cooldowns })))
      .toEqual(control.result.result.playerTeam.map(u => ({ id: u.id, mana: u.mana, stats: u.stats, cooldowns: u.cooldowns })));
  });
});
