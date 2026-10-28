import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { composeStatAura } from '../skills/stat-auras';
import { composeAmazonPassives } from '../skills/amazon-passives';
import { composeBarbarianWeaponMasteries } from '../skills/barbarian-weapon-masteries';
import { getSummon, registerSummon } from '../skills/summons';
import { paySorceressBuff } from '../skills/sorceress-buffs';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import type { DamageEffect } from '../skills/effects';
import * as rngModule from '../rng';

// Native createRng.chance closes over its generator and needs no receiver.
interface ObservedRng extends rngModule.Rng {
  chance: (p: number) => boolean;
}

const stun = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
function unit(id: string, side: CombatUnit['side'] = 'player'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 100, defense: 0,
      magicResist: 0, attackSpeed: 200, critChance: .95, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    basicAttack: { damageType: 'fire', damage: [100, 100] },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function source(): CombatUnit {
  return { ...unit('merc-source'), kind: 'merc', mercCritical: true, statuses: [stun] };
}
function snapshot(merc = source(), actor = unit('hero')): CombatSnapshot & { readonly enemyTeam: readonly [CombatUnit] } {
  return { seed: 7, playerTeam: [actor, merc], enemyTeam: [{ ...unit('target', 'enemy'), statuses: [stun] }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  for (const original of [...input.playerTeam, ...input.enemyTeam]) {
    expect([...out.result.playerTeam, ...out.result.enemyTeam].find(row => row.id === original.id)?.stats).toEqual(original.stats);
  }
  return out;
}
function firstDamage(input: CombatSnapshot, sourceId = 'hero') {
  const hit = record(input).events.find(e => e.kind === 'damage' && e.source === sourceId);
  if (hit?.kind !== 'damage') throw new Error('Missing actual damage from ' + sourceId);
  return hit;
}
function fixed(effect: DamageEffect, target: 'single-enemy' | 'all-enemies' = 'single-enemy'): string {
  const id = 'fixture.critical-fixed';
  registerSkill({ id, archetype: 'fixture', target, minLevel: 1, manaCost: 0, cooldown: 100000, effects: [effect] });
  return id;
}
function withoutSource(input: CombatSnapshot): CombatSnapshot {
  return { ...input, playerTeam: input.playerTeam.map(({ mercCritical: _marker, ...actor }) => actor) };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('native Rogue Pierce critical support', () => {
  it.each(['hero', 'merc', 'summon'] as const)('supports a living allied %s', kind => {
    const actor = { ...unit('hero'), kind, ...(kind === 'summon' ? { summon: true, ownerId: 'owner' } : {}) };
    expect(firstDamage(snapshot(source(), actor))).toMatchObject({ amount: 220, crit: true });
  });
  it('includes the source itself without a cast or ordinary aura buff', () => {
    const merc = { ...source(), statuses: [], skillOrder: ['passive-critical'] };
    const out = record(snapshot(merc, { ...unit('hero'), statuses: [stun] }));
    expect(out.events.find(e => e.kind === 'damage' && e.source === merc.id)).toMatchObject({ amount: 220, crit: true });
    expect(out.events.some(e => e.kind === 'action' && e.skillId === 'passive-critical')).toBe(false);
    expect(out.result.playerTeam.find(u => u.id === merc.id)?.activeBuffIds).toEqual([]);
  });
  it.each(['stun', 'freeze'])('retains living presence during %s', id => {
    expect(firstDamage(snapshot({ ...source(), statuses: [{ ...stun, id }] }))).toMatchObject({ amount: 220 });
  });
  it.each([
    { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
    { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
    { side: 'enemy' as const }, { life: 0 }, { life: NaN }, { level: 0 }, { level: 1.5 }
  ])('refuses an ineligible source %j', patch => {
    expect(firstDamage(snapshot({ ...source(), ...patch }))).toMatchObject({ amount: 200 });
  });
  it('never infers authority from skill or buff strings', () => {
    const { mercCritical: _marker, ...merc } = source();
    expect(firstDamage(snapshot({ ...merc, skillOrder: ['passive-critical'], activeBuffIds: ['passive-critical'] })))
      .toMatchObject({ amount: 200 });
  });
  it('does not stack duplicate sources or scale with level and skill rank', () => {
    const input = snapshot();
    expect(firstDamage({ ...input, playerTeam: [...input.playerTeam,
      { ...source(), id: 'duplicate', level: 99, skillLevels: { 'passive-critical': 20 } }] })).toMatchObject({ amount: 220 });
  });
  it.each(['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
    'uses ordinary critical resolution for direct %s', damageType => {
      expect(firstDamage(snapshot(source(), { ...unit('hero'), basicAttack: { damageType, damage: [100, 100] } })))
        .toMatchObject({ amount: 220, damageType, crit: true });
    });
  it('adds before ordinary increases, resistance and flat mitigation', () => {
    const input = snapshot(source(), { ...unit('hero'), increasedDamagePct: { fire: .25 } });
    const target = { ...input.enemyTeam[0], stats: { ...unit('target').stats, defense: 7,
      resistances: { ...unit('target').stats.resistances, fire: 25 } } };
    // floor(100 * 1.25 * 2.2 * .75 - 7) = 199.
    expect(firstDamage({ ...input, enemyTeam: [target] })).toMatchObject({ amount: 199 });
  });
  it('retains existing excess-chance conversion after the two additive increments', () => {
    expect(firstDamage(snapshot(source(), { ...unit('hero'), stats: { ...unit('hero').stats, critChance: 1 } })))
      .toMatchObject({ amount: 222, crit: true });
  });
  it('adds independently to existing player passive stats and a local strike bonus', () => {
    const amazon = composeAmazonPassives({ classId: 'amazon', level: 40, skillLevels: { 'amazon.critical_strike': 20 } });
    const barbarian = composeBarbarianWeaponMasteries({ classId: 'barbarian', level: 40,
      weaponType: 'sword', skillLevels: { 'barbarian.sword_mastery': 20 } });
    expect(amazon.critChanceBonus).toBeGreaterThan(0);
    expect(barbarian.critChanceBonus).toBeGreaterThan(0);
    for (const bonus of [amazon.critChanceBonus, barbarian.critChanceBonus]) {
      const skill = fixed({ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true, critChanceBonus: .1 });
      const actor = { ...unit('hero'), skillOrder: [skill], stats: { ...unit('hero').stats, critChance: bonus } };
      expect(firstDamage(snapshot(source(), actor))).toMatchObject({ amount: 220 });
      expect(firstDamage(withoutSource(snapshot(source(), actor)))).toMatchObject({ amount: 200 });
    }
  });
  it('coexists with Heart of Wolverine and selected Holy Fire without granting criticals to pulses', () => {
    const input = snapshot(source(), { ...unit('hero'), stats: { ...unit('hero').stats, critChance: .93 } });
    const heartScene = { ...input, druidAllyAuras: { sourceHeroId: 'hero', oakRank: 1, heartRank: 1 } };
    const before = structuredClone(heartScene), out = runBattleRecorded(heartScene);
    const control = runBattleRecorded(withoutSource(heartScene));
    expect(out.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({ amount: 220 });
    // Oak's legitimate temporary capacity is present with and without native critical support.
    expect(out.result.playerTeam[0]?.stats.lifeMax).toBe(103000);
    expect(out.result.playerTeam.map(u => u.stats)).toEqual(control.result.playerTeam.map(u => u.stats));
    expect(heartScene).toEqual(before);
    expect(runBattle(heartScene)).toEqual(out.result);
    expect(runBattleRecorded(heartScene)).toEqual(out);
    const statAura = composeStatAura({ id: 'hero', class: 'paladin', level: 30,
      selectedAuraId: 'paladin.holy-fire', skillLevels: { 'paladin.holy-fire': 1 } });
    if (!statAura) throw new Error('Missing selected Holy Fire');
    const scene = { ...snapshot(source(), { ...unit('hero'), statuses: [stun] }), statAura };
    expect(record(scene).events).toEqual(record(withoutSource(scene)).events);
    expect(record(scene).events.find(e => e.kind === 'damage')).toMatchObject({ amount: 20, crit: false });
  });
  it('rolls one critical for weighted and paid Enchant shares', () => {
    const skill = fixed({ kind: 'damage', damageType: 'physical', base: [100, 100], alwaysHits: true,
      components: [{ damageType: 'physical', weight: 1 }, { damageType: 'fire', weight: 1 }] });
    const enchant = { id: 'enchant', sourceId: 'hero', stacks: 1, remaining: 10,
      appliedAtMs: 0, expiresAtMs: 10000, sorceressBuff: paySorceressBuff('enchant', 20, 100) };
    const out = record(snapshot(source(), { ...unit('hero'), skillOrder: [skill], statuses: [enchant] }));
    expect(out.events.filter(e => e.kind === 'damage').slice(0, 3)).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 110, crit: true }),
      expect.objectContaining({ damageType: 'fire', amount: 110, crit: true }),
      expect.objectContaining({ damageType: 'fire', amount: 88, crit: true })
    ]);
  });
  it('preserves independent ordinary target rolls', () => {
    const skill = fixed({ kind: 'damage', damageType: 'fire', base: [100, 100] }, 'all-enemies');
    const input = snapshot(source(), { ...unit('hero'), skillOrder: [skill], stats: { ...unit('hero').stats, critChance: 0 } });
    const target = input.enemyTeam[0];
    const out = record({ ...input, seed: 0, enemyTeam: [target, { ...target, id: 'other-target' }] });
    expect(out.events.filter(e => e.kind === 'damage').slice(0, 2)).toEqual([
      expect.objectContaining({ amount: 220, crit: true }), expect.objectContaining({ amount: 100, crit: false })
    ]);
  });
  it('includes an actual late summon and restores its original factory', () => {
    const original = getSummon('minion');
    if (!original) throw new Error('Missing original minion');
    registerSummon('minion', owner => { const native = original(owner); return { ...native,
      basicAttack: { damageType: 'fire', damage: [10, 10] }, stats: { ...native.stats, critChance: .95, critDamage: 2 } }; });
    try {
      registerSkill({ id: 'fixture.critical-minion', archetype: 'fixture', target: 'self', minLevel: 1,
        manaCost: 0, cooldown: 100000, effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
      const scene = snapshot(source(), { ...unit('hero'), skillOrder: ['fixture.critical-minion'] });
      const out = record(scene), control = record(withoutSource(scene));
      const summon = out.events.find(e => e.kind === 'summon');
      if (summon?.kind !== 'summon') throw new Error('Missing actual late summon');
      expect(out.events.find(e => e.kind === 'damage' && e.source === summon.unit.id)).toMatchObject({ amount: 22 });
      expect(control.events.find(e => e.kind === 'damage' && e.source === summon.unit.id)).toMatchObject({ amount: 20 });
    } finally { registerSummon('minion', original); }
  });
  it('excludes original enemies even while actually converted to fight alongside the party', () => {
    const hero = { ...unit('hero'), conversionRank: 1, skillOrder: ['paladin.conversion'],
      skillLevels: { 'paladin.conversion': 1 }, statuses: [{ ...stun, appliedAtMs: 501 }],
      stats: { ...unit('hero').stats, attackSpeed: 250 } };
    const enemy = { ...unit('convert', 'enemy'), statuses: [{ ...stun, appliedAtMs: 10001 }],
      stats: { ...unit('convert').stats, attackSpeed: 100, critChance: 1 } };
    const out = record({ ...snapshot(source(), hero), enemyTeam: [enemy,
      { ...unit('former-ally', 'enemy'), statuses: [stun] }] });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', statusId: 'converted', target: enemy.id }));
    expect(out.events.find(e => e.kind === 'damage' && e.source === enemy.id))
      .toMatchObject({ target: 'former-ally', amount: 200, crit: true });
  });
  it('adds alongside a separate native Fire Mastery source', () => {
    const input = snapshot();
    const { mercCritical: _marker, ...merc } = source();
    expect(firstDamage({ ...input, playerTeam: [...input.playerTeam,
      { ...merc, id: 'native-fire', mercFireMastery: true }] })).toMatchObject({ amount: 275 });
  });
  it.each(['source', 'attacker', 'neither'] as const)('checks current support/attacker life at impact after %s death', death => {
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
      .toMatchObject({ amount: death === 'neither' ? 220 : 200, simClockMs: 2200 });
    expect(firstDamage({ ...snapshot(), playerTeam: [unit('hero')] })).toMatchObject({ amount: 200 });
  });
  it('snapshots fresh critical Burn once and preserves stored potency after source withdrawal', () => {
    const skill = fixed({ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true,
      applyStatus: { id: 'burn', durationMs: 3000, dotPctOfDamage: .1 } });
    const merc = { ...source(), life: 2, statuses: [stun,
      { id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 1 }] };
    const hero = { ...unit('hero'), skillOrder: [skill], statuses: [{ ...stun, appliedAtMs: 1701 }],
      stats: { ...unit('hero').stats, attackSpeed: 100 } };
    const out = record(snapshot(merc, hero));
    expect(out.events.find(e => e.kind === 'damage')).toMatchObject({ amount: 220, crit: true });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id, simClockMs: 2000 }));
    expect(out.events.filter((e): e is Extract<typeof e, { kind: 'dot' }> => e.kind === 'dot' && e.target === 'target')
      .reduce((n, e) => n + e.amount, 0)).toBe(66);
  });
  it('preserves actual RNG progression, actions, resources and base stats with the same survival', () => {
    const create = rngModule.createRng;
    const streams: rngModule.Rng[] = [];
    vi.spyOn(rngModule, 'createRng').mockImplementation(seed => { const rng = create(seed); streams.push(rng); return rng; });
    const observe = (input: CombatSnapshot) => {
      streams.length = 0;
      const chanceCalls: number[] = [];
      const originalCreate = create;
      vi.mocked(rngModule.createRng).mockImplementation(seed => {
        const rng: ObservedRng = originalCreate(seed), chance = rng.chance;
        vi.spyOn(rng, 'chance').mockImplementation(p => { chanceCalls.push(p); return chance(p); });
        streams.push(rng); return rng;
      });
      const out = runBattleRecorded(input);
      return { out, chanceCalls, tails: streams.map(rng => [rng.next(), rng.next(), rng.next()]) };
    };
    const scene = snapshot(), enabled = observe(scene), control = observe(withoutSource(scene));
    expect(enabled.chanceCalls.length).toBeGreaterThan(0);
    expect(enabled.chanceCalls.length).toBe(control.chanceCalls.length);
    expect(enabled.chanceCalls).toEqual(control.chanceCalls.map(p => p === .95 ? 1 : p));
    expect(enabled.tails).toEqual(control.tails);
    expect(enabled.out.events.filter(e => e.kind === 'action')).toEqual(control.out.events.filter(e => e.kind === 'action'));
    expect(enabled.out.result.playerTeam.map(u => ({ id: u.id, mana: u.mana, stats: u.stats, cooldowns: u.cooldowns })))
      .toEqual(control.out.result.playerTeam.map(u => ({ id: u.id, mana: u.mana, stats: u.stats, cooldowns: u.cooldowns })));
  });
});
