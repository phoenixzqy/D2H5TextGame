import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'constructed-hold',
  stacks: 1, remaining: -1, appliedAtMs });
function fixture(rank: number): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed Flight', 'assassin'),
    id: 'hero', level: 30, comboOrder: ['skills-assassin-dragon-flight'], skillLevels: {
      'assassin.dragon_talon': 1, 'assassin.dragon_claw': 1,
      'assassin.dragon_tail': 1, 'assassin.dragon_flight': rank } });
  const hero: CombatUnit = { ...native, life: 1000, mana: 15,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 1000, manaMax: 100, attackSpeed: 100,
      attack: 100, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      critChance: 0, critDamage: 2,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [hold(1701), { id: 'poison', sourceId: 'constructed-clock', stacks: 1,
      remaining: -1, dotPerStack: 200, damageType: 'poison' }] };
  const target: CombatUnit = { id: 'target', name: 'Constructed target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 30, life: 99999, mana: 0, stats: { ...hero.stats, lifeMax: 99999, manaMax: 0 },
    skillOrder: [], cooldowns: {}, activeBuffIds: [], statuses: [hold()], enraged: false };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it.each([1, 2, 20])('native Flight rank%i publishes its actual paid finite blink', rank => {
  const input = fixture(rank), before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
    expect.objectContaining({ skillId: 'assassin.dragon_flight', simClockMs: 1700 })]);
  expect(out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700 ? e.statuses : []))
    .toContainEqual({ id: 'dragon-flight', sourceId: 'hero', stacks: 1,
      appliedAtMs: 1700, expiresAtMs: 2700, remaining: 1 });
});
it('ordinary Flight control already pays once and makes one positive Physical kick', () => {
  const input = fixture(1), out = runBattleRecorded(input);
  const hits = out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
    e.kind === 'damage' && e.source === 'hero');
  expect(hits).toHaveLength(1);
  expect(hits[0]).toMatchObject({ damageType: 'physical', simClockMs: 1700, target: 'target', dodged: false });
  expect(hits[0]?.amount).toBeGreaterThanOrEqual(80);
  expect(hits[0]?.amount).toBeLessThanOrEqual(115);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
});

function incomingFixture(rank = 20, damageType: 'fire' | 'physical' | 'thorns' = 'fire', speed = 0): CombatSnapshot {
  const input = fixture(rank), hero = input.playerTeam[0], enemy = input.enemyTeam[0];
  if (!hero || !enemy) throw new Error('Missing fixture');
  return { ...input, enemyTeam: [{ ...enemy, stats: { ...enemy.stats, attackSpeed: speed },
    basicAttack: { damageType, damage: [100, 100] }, statuses: [hold(2001)] }] };
}
function scalarControl(input: CombatSnapshot): CombatSnapshot {
  const skill = getSkill('assassin.dragon_flight');
  if (!skill) throw new Error('Missing real Flight');
  // Engine-only same-roll scalar control; never a player allocation or acceptance fixture.
  registerSkill({ ...skill, id: 'probe.scalar_flight', archetype: 'probe' });
  return { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
    skillOrder: ['probe.scalar_flight'], skillLevels: { 'probe.scalar_flight':
      hero.skillLevels?.['assassin.dragon_flight'] ?? 0 } })) };
}

it.each([7, 8, 9, 10])('seed%i blink changes actual magical hit HP loss without changing its paid kick', seed => {
  const input = { ...incomingFixture(), seed }, before = structuredClone(input),
    out = runBattleRecorded(input), control = runBattleRecorded(scalarControl(input));
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  const actual = out.events.find(e => e.kind === 'damage' && e.source === 'target'),
    ordinary = control.events.find(e => e.kind === 'damage' && e.source === 'target');
  expect(ordinary).toMatchObject({ amount: 100, dodged: false, simClockMs: 2000, damageType: 'fire' });
  expect(actual).toMatchObject({ amount: 0, dodged: true, simClockMs: 2000, damageType: 'fire' });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero'))
    .toEqual(control.events.filter(e => e.kind === 'damage' && e.source === 'hero'));
});
it.each(['physical', 'thorns'] as const)('blink does not change ordinary %s damage', damageType => {
  const input = incomingFixture(20, damageType), out = runBattleRecorded(input),
    control = runBattleRecorded(scalarControl(input));
  expect(out.events.filter(e => e.kind === 'damage')).toEqual(control.events.filter(e => e.kind === 'damage'));
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'target'))
    .toMatchObject({ amount: 100, dodged: false, simClockMs: 2000 });
});
it('removes its observation exactly at2700ms while leaving existing DoT settlement unchanged', () => {
  const input = fixture(20), out = runBattleRecorded(input), control = runBattleRecorded(scalarControl(input));
  const expired = out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 2700 ? [e] : []);
  expect(expired).toHaveLength(1);
  expect(expired.flatMap(e => e.statuses).some(status => status.id === 'dragon-flight')).toBe(false);
  expect(out.result.playerTeam[0]?.life).toBe(control.result.playerTeam[0]?.life);
  expect(out.events.find(e => e.kind === 'death' && e.target === 'hero')?.simClockMs).toBe(5000);
});

it.each([
  ['no native authority', (hero: CombatUnit): CombatUnit => ({ ...hero, assassinMartialRanks: {} })],
  ['missing transitive prerequisite', (hero: CombatUnit): CombatUnit => ({ ...hero,
    skillLevels: { ...hero.skillLevels, 'assassin.dragon_tail': 0 } })],
  ['wrong role', (hero: CombatUnit): CombatUnit => ({ ...hero, kind: 'merc' })],
  ['unpaid summon', (hero: CombatUnit): CombatUnit => ({ ...hero, kind: 'summon', summon: true, summonOwnerId: 'other' })],
  ['enemy source', (hero: CombatUnit): CombatUnit => ({ ...hero, side: 'enemy' })],
  ['under unlock', (hero: CombatUnit): CombatUnit => ({ ...hero, level: 23 })],
  ['zero MP', (hero: CombatUnit): CombatUnit => ({ ...hero, mana: 0 })],
  ['insufficient MP', (hero: CombatUnit): CombatUnit => ({ ...hero, mana: 14 })],
  ['nonfinite MP', (hero: CombatUnit): CombatUnit => ({ ...hero, mana: Infinity })],
  ['NaN MP', (hero: CombatUnit): CombatUnit => ({ ...hero, mana: NaN })],
  ['over-cap MP', (hero: CombatUnit): CombatUnit => ({ ...hero, mana: 101 })],
  ['invalid maximum', (hero: CombatUnit): CombatUnit => ({ ...hero, stats: { ...hero.stats, manaMax: NaN } })],
  ['alias cooldown', (hero: CombatUnit): CombatUnit => ({ ...hero, cooldowns: { 'skills-assassin-dragon-flight': 10000 } })],
  ['canonical cooldown', (hero: CombatUnit): CombatUnit => ({ ...hero, cooldowns: { 'assassin.dragon_flight': 10000 } })]
] as const)('refuses %s before Flight payment or fallback kick', (_name, change) => {
  const input = fixture(20), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing fixture');
  const changed = change(hero);
  const out = runBattleRecorded({ ...input, playerTeam: [changed, ...(changed.side === 'enemy'
    ? [{ ...hero, id: 'survivor', skillOrder: [], statuses: [hold()] }] : [])] });
  expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === 'assassin.dragon_flight')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast')).toEqual([]);
  expect(out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' ? e.statuses : []).some(status => status.id === 'dragon-flight')).toBe(false);
});
it.each([{ manaCost: 0 }, { cooldown: 0 }, { effects: [] }, { archetype: 'amazon' }])(
  'refuses altered full Flight registration %j', patch => {
    const skill = getSkill('assassin.dragon_flight');
    if (!skill) throw new Error('Missing Flight');
    registerSkill({ ...skill, ...patch });
    const out = runBattleRecorded(fixture(20));
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === 'assassin.dragon_flight')).toEqual([]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  }
);
it('strips forged marker aliases without granting or blocking an actually paid blink', () => {
  const input = fixture(20), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing fixture');
  const markers = ['dragon-flight', 'assassin.dragon_flight', 'skills-assassin-dragon-flight'];
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero,
    activeBuffIds: markers, statuses: [...hero.statuses, ...markers.map(id => ({
      id, sourceId: 'hero', stacks: 20, remaining: -1 }))] }] });
  const initial = out.events.find(e => e.kind === 'status-state' && e.target === 'hero');
  expect(initial?.kind === 'status-state' && initial.statuses.some(status => markers.includes(status.id))).toBe(false);
  expect(out.result.playerTeam[0]?.activeBuffIds.some(id => markers.includes(id))).toBe(false);
  expect(out.result.playerTeam[0]?.statuses.some(status => markers.includes(status.id))).toBe(false);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  expect(out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700 ? e.statuses : []))
    .toContainEqual({ id: 'dragon-flight', sourceId: 'hero', stacks: 1,
      appliedAtMs: 1700, expiresAtMs: 2700, remaining: 1 });
});

it('dodges before expiry and uses ordinary magical hit checks at the exact endpoint', () => {
  const input = incomingFixture(20, 'fire', 200), enemy = input.enemyTeam[0];
  if (!enemy) throw new Error('Missing target');
  const out = runBattleRecorded({ ...input, enemyTeam: [{ ...enemy,
    statuses: [{ ...hold(), expiresAtMs: 1701 }, hold(2701)] }] });
  expect(out.events.flatMap(e => e.kind === 'damage' && e.source === 'target' ?
    [{ at: e.simClockMs, amount: e.amount, dodged: e.dodged }] : []))
    .toEqual([{ at: 1800, amount: 0, dodged: true }, { at: 2700, amount: 100, dodged: false }]);
});
it('a missed paid kick still creates its blink without a second payment or position change', () => {
  const input = fixture(20), hero = input.playerTeam[0], enemy = input.enemyTeam[0];
  if (!hero || !enemy) throw new Error('Missing units');
  const heroPosition = { row: 1, col: 1 }, enemyPosition = { row: 0, col: 2 };
  const out = runBattleRecorded({ ...input, seed: 41,
    playerTeam: [{ ...hero, gridPosition: heroPosition }], enemyTeam: [{ ...enemy, gridPosition: enemyPosition }] });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({ amount: 0, dodged: true });
  expect(out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700 ? e.statuses : []))
    .toContainEqual({ id: 'dragon-flight', sourceId: 'hero', stacks: 1, appliedAtMs: 1700, expiresAtMs: 2700, remaining: 1 });
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(out.result.playerTeam[0]?.gridPosition).toEqual(heroPosition);
  expect(out.result.enemyTeam[0]?.gridPosition).toEqual(enemyPosition);
});
it('actually releases three paid Tiger charges through one paid native Flight kick', () => {
  const input = fixture(1), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed Flight finisher', 'assassin'),
    id: 'hero', level: 30, comboOrder: ['skills-assassin-tiger-strike', 'skills-assassin-dragon-flight'],
    skillLevels: { 'assassin.tiger_strike': 1, 'assassin.dragon_talon': 1,
      'assassin.dragon_claw': 1, 'assassin.dragon_tail': 1, 'assassin.dragon_flight': 1 } });
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, ...native,
    stats: hero.stats, life: 1000, mana: 24, manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0, statuses: [hold(6801)] }] });
  expect(out.events.flatMap(e => e.kind === 'action' && e.actor === 'hero' ? [e.skillId] : []))
    .toEqual(['assassin.tiger_strike', 'assassin.tiger_strike', 'assassin.tiger_strike', 'assassin.dragon_flight']);
  const hits = out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' && e.simClockMs === 6800 ? [e] : []);
  expect(hits).toHaveLength(2);
  expect(hits.every(e => e.amount > 0 && e.damageType === 'physical')).toBe(true);
  const statuses = out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 6800 ? e.statuses : []);
  expect(statuses.some(s => s.id === 'dragon-flight' && s.expiresAtMs === 7800)).toBe(true);
  const last = out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 6800 ? [e.statuses] : []).at(-1);
  expect(last?.some(s => s.id === 'charge-tiger-strike')).toBe(false);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(4);
});
