import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { applyStatus, activeStatusView, tickStatuses } from './status';
import { createRng } from '../rng';
import { registerSummon } from '../skills/summons';
import { expireStatuses, rebaseStatusClock } from './status';

const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic', stacks: 1,
  remaining: -1, appliedAtMs: at });
const marker: ActiveStatus = { id: 'mana-burn', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, side: CombatUnit['side'], patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30,
    tier: 'trash', life: 1000, mana: 100, statuses: [hold()], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false, manaRegenPerSecond: 0,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 1,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } }, ...patch };
}
type MutableSnapshot = { -readonly [K in keyof CombatSnapshot]: CombatSnapshot[K] };
function fixture(target: Partial<CombatUnit> = {}, damage = 50, burn = true): MutableSnapshot {
  registerSkill({ id: 'fixture.mana-burn', archetype: 'fixture', target: 'single-enemy',
    cooldown: 1, manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'arcane',
      base: [damage, damage], ...(burn ? { applyStatus: { id: 'mana-burn' } } : {}) }] });
  return { seed: 7, playerTeam: [unit('caster', 'player', {
    statuses: [hold(1701)], skillOrder: ['fixture.mana-burn'] })],
    enemyTeam: [unit('target', 'enemy', target)] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(out); expect(input).toEqual(before); return out;
}
const hits = (out: ReturnType<typeof record>) => out.events.filter(e => e.kind === 'damage');
const debits = (out: ReturnType<typeof record>) => out.events.filter(e => e.kind === 'mana')
  .filter(e => e.reason === 'mana-burn');
beforeEach(loadDefaultSkills);
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([[50, 100, 90], [4, 100, 100], [50, 3, 0]] as const)(
  'drains floor20%% of %i actual HP, capped at%i MP', (damage, mana, expected) => {
    const out = record(fixture({ mana }, damage));
    expect(out.result.enemyTeam[0]?.mana).toBe(expected);
    expect(debits(out)).toHaveLength(mana === expected ? 0 : 1);
    if (mana !== expected) expect(debits(out)[0]).toMatchObject({ mana: expected });
  });
it('uses actual HP removed rather than lethal overkill', () => {
  const out = record(fixture({ life: 10 }, 500));
  expect(out.result.enemyTeam[0]?.mana).toBe(98);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
});
it.each([
  { mana: 0, statuses: [hold()], expected: 50 },
  { mana: 10, statuses: [hold(), marker], expected: 60 },
  { mana: 0, statuses: [hold(), marker], expected: 90 },
  { mana: 0, statuses: [hold(), marker], tier: 'boss' as const, expected: 82 },
  { mana: 0, statuses: [hold(), { ...marker, appliedAtMs: 1701 }], expected: 50 },
  { mana: 0, statuses: [hold(), { ...marker, expiresAtMs: 1700 }], expected: 50 }
])('checks pre-hit active marker/MP and keeps boss combo rules %j', ({ expected, ...target }) => {
  expect(hits(record(fixture(target, 50, false)))[0]?.amount).toBe(expected);
});
it('does not amplify the same strike that first empties mana', () => {
  const input = fixture({ mana: 5 });
  input.playerTeam = input.playerTeam.map(u => ({ ...u, statuses: [hold(3401)] }));
  expect(hits(record(input)).map(e => e.amount)).toEqual([50, 90]);
});
it('retains Mana Burn beyond three seconds and legacy ticks until actual restoration', () => {
  const target = unit('target', 'enemy');
  const applied = applyStatus(target, { id: 'mana-burn', sourceId: 'caster', simClockMs: 1700 }, createRng(7));
  expect(applied.statuses.find(s => s.id === 'mana-burn')).toMatchObject({ remaining: -1 });
  expect(activeStatusView(applied, 60_000).statuses.some(s => s.id === 'mana-burn')).toBe(true);
  expect(tickStatuses(applied).statuses.some(s => s.id === 'mana-burn')).toBe(true);
});
it('clears the marker on actual regeneration, preserving fractional carry before a whole MP', () => {
  const out = record(fixture({ mana: 0, statuses: [hold(), marker], manaRegenPerSecond: 1 }));
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'target' &&
    e.simClockMs === 1700 && !e.statuses.some(s => s.id === 'mana-burn'))).toBe(true);
  expect(hits(out)[0]?.amount).toBe(50);
  const slow = record(fixture({ mana: 0, statuses: [hold(), marker], manaRegenPerSecond: .1 }));
  expect(hits(slow)[0]?.amount).toBe(90);
});
it.each([false, true])('locks only affected zero-MP monster skills; marker=%s', marked => {
  const target = unit('monster', 'enemy', { mana: 0, statuses: marked ? [marker] : [],
    skillOrder: ['monster.mana_rift'] });
  const input = fixture({}, 1, false);
  input.playerTeam = input.playerTeam.map(u => ({ ...u, statuses: [hold()], skillOrder: [] }));
  input.enemyTeam = [target];
  const first = record(input).events.find(e => e.kind === 'action' && e.actor === 'monster');
  expect(first).toMatchObject({ skillId: marked ? null : 'monster.mana_rift' });
});
it('spends Energy Shield before the HP-based debit', () => {
  const input = fixture();
  const hero = unit('target', 'player', { energyShieldRank: 20 });
  input.playerTeam = [hero];
  input.enemyTeam = [unit('caster', 'enemy', { statuses: [hold(1701)], skillOrder: ['fixture.mana-burn'] })];
  const out = record(input);
  expect(hits(out)[0]).toMatchObject({ amount: 20 });
  expect(out.events.filter(e => e.kind === 'mana').filter(e => e.target === 'target'))
    .toEqual([expect.objectContaining({ reason: 'energy-shield', mana: 70 }),
      expect.objectContaining({ reason: 'mana-burn', mana: 66 })]);
});
it('does not drain mana through full personal absorption', () => {
  const input = fixture();
  input.playerTeam = [unit('target', 'player', { statuses: [hold(), {
    id: 'bone-armor', sourceId: 'target', remaining: -1, stacks: 1,
    boneArmor: { rank: 20, remaining: 100 } }] })];
  input.enemyTeam = [unit('caster', 'enemy', { statuses: [hold(1701)], skillOrder: ['fixture.mana-burn'] })];
  const out = record(input);
  expect(hits(out)[0]).toMatchObject({ amount: 0, absorbed: 50 });
  expect(debits(out)).toEqual([]); expect(out.result.playerTeam[0]?.mana).toBe(100);
});

it('uses the same actual-HP debit for the registered monster Mana Rift', () => {
  const input: CombatSnapshot = { seed: 7, playerTeam: [unit('target', 'player')],
    enemyTeam: [unit('caster', 'enemy', { statuses: [hold(1701)], skillOrder: ['monster.mana_rift'] })] };
  const out = record(input), hit = hits(out)[0];
  expect(out.events.find(e => e.kind === 'action')).toMatchObject({ skillId: 'monster.mana_rift' });
  expect(hit?.amount).toBeGreaterThan(0);
  expect(out.result.playerTeam[0]?.mana).toBe(100 - Math.floor((hit?.amount ?? 0) * .2));
  expect(debits(out)).toHaveLength(1);
});
it('uses post-resistance and MR HP loss, retaining ordinary Defense behavior', () => {
  const input = fixture(), target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  input.enemyTeam = [{ ...target, stats: { ...target.stats, defense: 9999, magicResist: 10,
    resistances: { ...target.stats.resistances, arcane: 50 } } }];
  const out = record(input);
  expect(hits(out)[0]?.amount).toBe(15);
  expect(out.result.enemyTeam[0]?.mana).toBe(97);
});
it('does not apply mana debit to periodic payloads', () => {
  const input = fixture({}, 50);
  input.playerTeam = input.playerTeam.map(u => ({ ...u, statuses: [hold(), marker,
    { id: 'poison', sourceId: 'target', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 20 }] }));
  const out = record(input);
  expect(out.events.filter(e => e.kind === 'dot')).toHaveLength(1);
  expect(debits(out)).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(100);
});
it('does not inherit the mana debit on ordinary reflection', () => {
  const input = fixture({ physicalReflectionPct: 1 });
  registerSkill({ id: 'fixture.mana-burn', archetype: 'fixture', target: 'single-enemy',
    cooldown: 1, manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical',
      base: [50, 50], applyStatus: { id: 'mana-burn' } }] });
  input.playerTeam = input.playerTeam.map(u => ({ ...u, statuses: [...u.statuses, marker] }));
  const out = record(input);
  expect(hits(out).map(e => e.amount)).toEqual([50, 50]);
  expect(debits(out)).toEqual([expect.objectContaining({ target: 'target', mana: 90 })]);
  expect(out.result.playerTeam[0]?.mana).toBe(100);
});
it('actual restoration releases the monster skill lockout', () => {
  const input = fixture();
  input.playerTeam = [unit('owner', 'player')];
  input.enemyTeam = [unit('monster', 'enemy', { mana: 0, manaRegenPerSecond: 1,
    statuses: [marker], skillOrder: ['monster.mana_rift'] })];
  const out = record(input);
  expect(out.events.find(e => e.kind === 'action' && e.actor === 'monster'))
    .toMatchObject({ skillId: 'monster.mana_rift' });
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'monster' &&
    e.simClockMs === 1700 && !e.statuses.some(s => s.id === 'mana-burn'))).toBe(true);
});
it('preserves explicit finite overrides and promotes a refreshed timed marker to indefinite', () => {
  const first = applyStatus(unit('target', 'enemy'), { id: 'mana-burn', sourceId: 'caster',
    simClockMs: 1000, durationMs: 2000 }, createRng(7));
  expect(first.statuses.find(s => s.id === 'mana-burn')).toMatchObject({ remaining: 2, expiresAtMs: 3000 });
  expect(expireStatuses(first, 3000).statuses.some(s => s.id === 'mana-burn')).toBe(false);
  const refreshed = applyStatus(first, { id: 'mana-burn', sourceId: 'caster', simClockMs: 2000 }, createRng(7));
  const status = refreshed.statuses.find(s => s.id === 'mana-burn');
  expect(status?.remaining).toBe(-1); expect(status?.expiresAtMs).toBeUndefined();
  const next = rebaseStatusClock(refreshed, 60_000).statuses;
  expect(next.find(s => s.id === 'mana-burn')).toMatchObject({ remaining: -1 });
});
it.each([0, 100])('clears only a real MP increase from a guaranteed boss orb, initial MP%i', mana => {
  const input = fixture();
  input.playerTeam = [unit('owner', 'player', { mana, statuses: [hold(), marker] })];
  input.enemyTeam = [unit('body', 'enemy', { life: 1, tier: 'boss', statuses: [hold(),
    { id: 'burn', sourceId: 'owner', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1 }] }), unit('held', 'enemy')];
  const out = record(input);
  expect(out.result.playerTeam[0]?.mana).toBe(mana === 0 ? 5 : 100);
  expect(out.result.playerTeam[0]?.statuses.some(s => s.id === 'mana-burn')).toBe(mana === 100);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'orb')).toHaveLength(mana === 0 ? 1 : 0);
});
it('retains a future marker when an earlier orb restores MP', () => {
  const input = fixture();
  input.playerTeam = [unit('owner', 'player', { mana: 0, statuses: [hold(), { ...marker, appliedAtMs: 2000 }] })];
  input.enemyTeam = [unit('body', 'enemy', { life: 1, tier: 'boss', statuses: [hold(),
    { id: 'burn', sourceId: 'owner', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1 }] }), unit('held', 'enemy')];
  expect(record(input).result.playerTeam[0]?.statuses.some(s => s.id === 'mana-burn')).toBe(true);
});
it('spending summon MP retains the marker, while an actual death refund clears it', () => {
  registerSummon('fixture.burn-refund', () => {
    const child = unit('child', 'player');
    return { ...child, life: 750, stats: { ...child.stats, lifeMax: 750 },
      statuses: [hold(), { id: 'burn', sourceId: 'enemy', stacks: 1, remaining: 1, expiresAtMs: 750, dotPerStack: 1000 }] };
  });
  registerSkill({ id: 'fixture.burn-summon', archetype: 'fixture', target: 'self', summonOnStart: true,
    minLevel: 1, manaCost: 50, cooldown: 100,
    effects: [{ kind: 'summon', summonId: 'fixture.burn-refund', maxCount: 1 }] });
  const input = fixture();
  input.playerTeam = [unit('owner', 'player', { statuses: [hold(), marker], skillOrder: ['fixture.burn-summon'] })];
  const out = record(input);
  expect(out.events.find(e => e.kind === 'mana' && e.reason === 'cast')).toMatchObject({ mana: 50 });
  expect(out.events.find(e => e.kind === 'mana' && e.reason === 'summon-refund')).toMatchObject({ mana: 100, simClockMs: 750 });
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'owner' &&
    e.simClockMs === 750 && !e.statuses.some(s => s.id === 'mana-burn'))).toBe(true);
});
it('clears Mana Burn on actual selected Redemption recovery', () => {
  const input = fixture();
  input.seed = 42;
  input.playerTeam = [unit('owner', 'player', { mana: 0, statuses: [hold(), marker] })];
  input.enemyTeam = [unit('body', 'enemy', { life: 1, statuses: [hold(),
    { id: 'burn', sourceId: 'owner', stacks: 1, remaining: 1, expiresAtMs: 1000, dotPerStack: 1 }] }), unit('held', 'enemy')];
  input.statAura = { selectedAuraId: 'paladin.redemption', sourceHeroId: 'owner', fieldedMercCombatId: 'merc', rank: 1,
    maxRank: 20, bonuses: { lifeRegenPct: .02, manaRegenPct: .02 }, redemption: { intervalMs: 5000, life: 20, mana: 10 } };
  const out = record(input);
  expect(out.events.find(e => e.kind === 'mana' && e.reason === 'redemption')).toMatchObject({ mana: 10, simClockMs: 5000 });
  expect(out.result.playerTeam[0]?.statuses.some(s => s.id === 'mana-burn')).toBe(false);
});
