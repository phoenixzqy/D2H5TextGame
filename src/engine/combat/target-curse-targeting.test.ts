import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { DamageEffect, RegisteredSkill } from '../skills/effects';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { paidDamageCurse } from './damage-curse-definition';
import { statusActiveAt } from './status';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from '../../stores/combatPlayback';

const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: start });
const curse = (id: 'confuse' | 'attract', start = 500, end = start + 3000): ActiveStatus => ({
  id, targetCurse: id, sourceId: 'absent-paid-caster', stacks: 1, remaining: 3, appliedAtMs: start, expiresAtMs: end });
function unit(id: string, side: CombatUnit['side'], statuses: ActiveStatus[] = [hold()]): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', tier: 'trash', level: 30,
    life: 10000, mana: 100, cooldowns: {}, skillOrder: [], activeBuffIds: [], statuses, enraged: false,
    stats: { life: 10000, lifeMax: 10000, mana: 100, manaMax: 100, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 250, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function fixture(statuses: ActiveStatus[] = [curse('confuse')]): CombatSnapshot {
  return { seed: 1, playerTeam: [unit('hero', 'player')],
    enemyTeam: [unit('actor', 'enemy', [...statuses, hold(4501)]), unit('comrade-a', 'enemy'), unit('comrade-b', 'enemy')] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  return out;
}
function attacks(out: ReturnType<typeof record>, source = 'actor') {
  return out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === source);
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 7, 19, 42, 991])('Confuse seed%i redirects actual basic hits only on the exact paid interval', seed => {
  const input = { ...fixture(), seed }, out = record(input), hits = attacks(out);
  expect(hits.map(e => e.simClockMs)).toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
  expect(hits.filter(e => e.simClockMs < 3500).every(e => e.target.startsWith('comrade-'))).toBe(true);
  expect(hits.filter(e => e.simClockMs >= 3500).map(e => e.target)).toEqual(['hero', 'hero', 'hero']);
  const friendlyDamage = hits.filter(e => e.target.startsWith('comrade-')).reduce((sum, e) => sum + e.amount, 0);
  expect(friendlyDamage).toBeGreaterThan(0);
  expect(out.result.enemyTeam.filter(u => u.id.startsWith('comrade-')).reduce((sum, u) => sum + 10000 - u.life, 0)).toBe(friendlyDamage);
  expect(out.result.enemyTeam.map(u => [u.id, u.side])).toEqual(input.enemyTeam.map(u => [u.id, u.side]));
});
it('a future Confuse interval leaves ordinary targeting intact until exact onset', () => {
  const out = record(fixture([curse('confuse', 1000)])), hits = attacks(out);
  expect(hits[0]).toMatchObject({ simClockMs: 500, target: 'hero' });
  expect(hits.find(e => e.simClockMs === 1000)?.target).toMatch(/^comrade-/);
  expect(hits.find(e => e.simClockMs === 4000)?.target).toBe('hero');
});
it('Attract wins over Confuse and outside-set Taunt, choosing the first other bait in registration order', () => {
  const input = fixture([curse('confuse'), { id: 'taunt', sourceId: 'hero', stacks: 1, remaining: 3,
    appliedAtMs: 500, expiresAtMs: 3500 }]);
  const out = record({ ...input, enemyTeam: input.enemyTeam.map(u => u.id.startsWith('comrade-')
    ? { ...u, statuses: [...u.statuses, curse('attract')] } : u) });
  expect(attacks(out).filter(e => e.simClockMs < 3500).map(e => e.target)).toEqual(Array(6).fill('comrade-a'));
  expect(attacks(out).filter(e => e.simClockMs >= 3500).map(e => e.target)).toEqual(Array(3).fill('hero'));
});
it('an Attract bait never attacks itself and singleton Confuse falls back to ordinary hostiles', () => {
  for (const id of ['confuse', 'attract'] as const) {
    const input = fixture([curse(id)]), out = record({ ...input, enemyTeam: input.enemyTeam.slice(0, 1) });
    expect(attacks(out)).toHaveLength(9);
    expect(attacks(out).every(e => e.target === 'hero')).toBe(true);
  }
});
it('dead Attract bait falls back to Confuse comrades, then ordinary opponents if none remain', () => {
  const input = fixture(), dead = input.enemyTeam.map(u => u.id === 'comrade-a'
    ? { ...u, life: 0, statuses: [curse('attract')] } : u);
  expect(attacks(record({ ...input, enemyTeam: dead })).filter(e => e.simClockMs < 3500).map(e => e.target))
    .toEqual(Array(6).fill('comrade-b'));
  expect(attacks(record({ ...input, enemyTeam: dead.filter(u => u.id !== 'comrade-b') })).every(e => e.target === 'hero')).toBe(true);
});

it.each(['single', 'area', 'all', 'round-robin', 'each-original'] as const)(
  'uses redirected candidates for real %s skill actions with ordinary payment and damage', mode => {
    const effect: DamageEffect = { kind: 'damage', damageType: 'fire', base: [100, 100],
      ...(mode === 'round-robin' ? { hitSequence: { strikes: 5 } } : {}),
      ...(mode === 'each-original' ? { hitSequence: { strikes: 3, targetMode: 'each-original' as const } } : {}) };
    const skill: RegisteredSkill = { id: 'fixture.redirected', archetype: 'fixture', minLevel: 1, manaCost: 7, cooldown: 100,
      target: mode === 'single' ? 'single-enemy' : mode === 'area' || mode === 'round-robin' ? 'area-enemies' : 'all-enemies',
      aoeShape: 'all-enemies', effects: [effect] };
    registerSkill(skill);
    const input = fixture(), out = record({ ...input, enemyTeam: input.enemyTeam.map(u => u.id === 'actor'
      ? { ...u, skillOrder: [skill.id] } : u) });
    const hits = attacks(out).filter(e => e.simClockMs === 500);
    expect(hits).toHaveLength(mode === 'single' ? 1 : mode === 'round-robin' ? 5 : mode === 'each-original' ? 6 : 2);
    expect(hits.every(e => e.target.startsWith('comrade-') && e.damageType === 'fire' && (e.dodged ? e.amount === 0 : e.amount === 100))).toBe(true);
    expect(hits.reduce((sum, e) => sum + e.amount, 0)).toBeGreaterThan(0);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'actor', mana: 93, simClockMs: 500 })]);
  });
it('a killed bait closes one original enemy death and the next action falls back to Confuse', () => {
  const input = fixture(), out = record({ ...input, corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }],
    enemyTeam: input.enemyTeam.map(u => u.id === 'comrade-a'
    ? { ...u, life: 1, statuses: [hold(), curse('attract')] } : u) });
  expect(attacks(out)[0]).toMatchObject({ target: 'comrade-a', amount: 100, simClockMs: 500 });
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'comrade-a')).toEqual([
    expect.objectContaining({ simClockMs: 500 })]);
  expect(attacks(out).find(e => e.simClockMs === 1000)?.target).toBe('comrade-b');
  expect(out.result.enemyTeam.find(u => u.id === 'comrade-a')).toMatchObject({ side: 'enemy', life: 0 });
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available')).toEqual([
    expect.objectContaining({ simClockMs: 500, params: { count: 1 } })]);
  expect(out.result.winner).toBeNull();
});
it('bare markers leave actual attacks identical to the uncast control', () => {
  for (const id of ['confuse', 'attract'] as const) {
    const marker = { ...curse(id) }; Reflect.deleteProperty(marker, 'targetCurse');
    const input = fixture(id === 'confuse' ? [marker] : []);
    const out = record({ ...input, enemyTeam: input.enemyTeam.map(u => u.id === 'comrade-a' && id === 'attract'
      ? { ...u, statuses: [...u.statuses, marker] } : u) });
    expect(attacks(out)).toEqual(attacks(record(fixture([]))));
  }
});
it('support heals retain effective allies while hostile ambient pulses retain all actual enemies', () => {
  registerSkill({ id: 'fixture.support', archetype: 'fixture', target: 'all-allies', minLevel: 1,
    manaCost: 7, cooldown: 100, effects: [{ kind: 'heal', target: 'all-allies', amount: 100 }] });
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 9000 })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 9000, ...(u.id === 'actor' ? { skillOrder: ['fixture.support'] } : {}) })) });
  expect(out.events.filter(e => e.kind === 'heal' && e.simClockMs === 500).map(e => e.kind === 'heal' ? e.target : ''))
    .toEqual(['actor', 'comrade-a', 'comrade-b']);
  expect(out.events.some(e => e.kind === 'heal' && e.target === 'hero')).toBe(false);
  const pulsed = record({ ...input, statAura: { selectedAuraId: 'paladin.holy-shock', sourceHeroId: 'hero',
    rank: 1, maxRank: 20, bonuses: { lightningDamagePct: .03 }, pulse: { intervalMs: 1000, damage: 20, damageType: 'lightning' } } });
  expect(attacks(pulsed, 'hero').filter(e => e.simClockMs === 1000).map(e => e.target))
    .toEqual(['actor', 'comrade-a', 'comrade-b']);
});

it.each([1, 7, 19, 42, 991])('seed%i adds no proc roll when one Confuse comrade replaces one ordinary defender', seed => {
  const paid = fixture(), ordinary = fixture([]);
  const run = (input: CombatSnapshot) => record({ ...input, seed, enemyTeam: input.enemyTeam.slice(0, 2) });
  const hits = attacks(run(paid)), controls = attacks(run(ordinary));
  expect(hits.map(e => [e.simClockMs, e.amount, e.dodged, e.crit])).toEqual(
    controls.map(e => [e.simClockMs, e.amount, e.dodged, e.crit]));
  expect(hits.filter(e => e.simClockMs < 3500).every(e => e.target === 'comrade-a')).toBe(true);
});
it('hard control prevents a redirected action rather than granting free attacks', () => {
  const out = record(fixture([curse('confuse'), { id: 'freeze', sourceId: 'fixture', stacks: 1,
    remaining: 1, appliedAtMs: 500, expiresAtMs: 1000 }]));
  expect(attacks(out).some(e => e.simClockMs === 500)).toBe(false);
  expect(attacks(out).find(e => e.simClockMs === 1000)?.target).toMatch(/^comrade-/);
});
it('same-side damage cannot grant hostile Life Tap, reflection, mana drain or skill recovery', () => {
  registerSkill({ id: 'fixture.drain', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 7, cooldown: 100, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100],
      applyStatus: { id: 'mana-burn' }, onHitRecovery: { lifeFraction: .5 } }] });
  const input = fixture(), snapshot = { ...input, enemyTeam: input.enemyTeam.slice(0, 2).map(u => u.id === 'actor'
    ? { ...u, life: 9000, skillOrder: ['fixture.drain'], statuses: [...u.statuses,
      { id: 'iron-maiden', sourceId: 'caster', stacks: 1, remaining: 3, appliedAtMs: 0,
        expiresAtMs: 3000, damageCurse: paidDamageCurse('iron-maiden') }] }
    : { ...u, physicalReflectionPct: 1, statuses: [...u.statuses,
      { id: 'life-tap', sourceId: 'caster', stacks: 1, remaining: 3, appliedAtMs: 0,
        expiresAtMs: 3000, damageCurse: paidDamageCurse('life-tap') }] }) };
  const out = record(snapshot);
  expect(attacks(out).find(e => e.simClockMs === 500)).toMatchObject({ target: 'comrade-a', amount: 100 });
  expect(out.events.some(e => e.kind === 'damage' && e.damageType === 'thorns' && e.simClockMs < 3500)).toBe(false);
  expect(out.events.some(e => e.kind === 'heal' && e.target === 'actor')).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'mana-burn')).toBe(false);
  expect(out.result.enemyTeam.find(u => u.id === 'actor')?.mana).toBe(93);
  expect(out.result.enemyTeam.find(u => u.id === 'comrade-a')?.mana).toBe(100);
  const hostile = record({ ...snapshot, enemyTeam: snapshot.enemyTeam.map(u => u.id === 'actor'
    ? { ...u, statuses: u.statuses.filter(s => s.id !== 'confuse') } : u) });
  expect(hostile.events).toContainEqual(expect.objectContaining({ kind: 'heal', target: 'actor', amount: 50, simClockMs: 500 }));
  expect(hostile.events).toContainEqual(expect.objectContaining({ kind: 'mana', target: 'hero', reason: 'mana-burn', simClockMs: 500 }));
  expect(hostile.events.some(e => e.kind === 'damage' && e.damageType === 'thorns' && e.target === 'actor' && e.simClockMs === 500 && e.amount > 0)).toBe(true);
});

it('recorded playback preserves same-side HP, mana, statuses and original team identity', () => {
  const input = fixture(), out = record(input), staged = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(staged ? { statusPlayback: staged } : {}) };
  for (const event of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, side: u.side, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
});
