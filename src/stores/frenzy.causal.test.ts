import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { statusActiveAt } from '@/engine/combat/status';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const id = 'skills-barbarian-frenzy', canonical = 'barbarian.frenzy';
const hold = (at = 0, end?: number): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold',
  stacks: 1, remaining: -1, appliedAtMs: at, ...(end === undefined ? {} : { expiresAtMs: end }) });
function fixture(rank = 1, seed = 7, count = 1): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Frenzy', 'barbarian'),
    id: 'hero', level: 30, skillLevels: { 'skills-barbarian-bash': 1, 'skills-barbarian-double-swing': 1, 'skills-barbarian-double-throw': 1, [id]: rank }, comboOrder: [id] });
  const hero: CombatUnit = { ...native, life: 100000, mana: 100, statuses: [hold(1701)],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 100000, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed, playerTeam: [hero], enemyTeam: Array.from({ length: count }, (_, i) => ({
    ...hero, id: 'enemy-' + String(i), kind: 'monster', side: 'enemy', skillOrder: [],
    skillLevels: {}, statuses: [hold()], gridPosition: { row: Math.floor(i / 3), col: i % 3 }
  })) };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events)
    teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});

it.each([1, 2, 20])('rank%i resolves two native attempts and one payment with real HP loss', rank => {
  for (const seed of [7, 19, 41, 97]) {
    const input = fixture(rank, seed), out = record(input);
    const hits = out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
    expect(hits).toHaveLength(2); expect(hits.map(e => e.target)).toEqual(['enemy-0', 'enemy-0']);
    for (const hit of hits) if (!hit.dodged) {
      expect(hit.amount).toBeGreaterThanOrEqual(85 + 8 * (rank - 1));
      expect(hit.amount).toBeLessThanOrEqual(120 + 8 * (rank - 1));
    }
    expect(out.result.enemyTeam[0]?.life).toBe(100000 - hits.reduce((sum, e) => sum + e.amount, 0));
    const landed = hits.filter(e => !e.dodged && e.amount > 0).length;
    expect(out.events.filter(e => e.kind === 'buff' && e.buffId === 'frenzy')).toHaveLength(landed);
    const states = out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700 ? e.statuses : []);
    if (landed > 0) expect(states).toContainEqual(expect.objectContaining({ id: 'frenzy', stacks: landed,
      appliedAtMs: 1700, expiresAtMs: 7700, frenzy: true }));
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(88);
  }
});
it('consumes a missed attempt without granting a stack and rolls criticals independently', () => {
  const missed = record(fixture(1, 41)), hits = missed.events.flatMap(e => e.kind === 'damage' ? [e] : []);
  expect(hits).toHaveLength(2); expect(hits[0]).toMatchObject({ dodged: true, amount: 0 });
  expect(hits[1]?.amount).toBeGreaterThan(0);
  expect(missed.events.filter(e => e.kind === 'buff' && e.buffId === 'frenzy')).toHaveLength(1);
  const input = fixture(), crit = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    stats: { ...u.stats, critChance: .5 } })) });
  expect(crit.events.flatMap(e => e.kind === 'damage' ? [e.crit] : [])).toEqual([false, true]);
});
it('changes real action timing, caps stacks and leaves base stats unchanged', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [], mana: 10000 })) });
  const actions = out.events.flatMap(e => e.kind === 'action' && e.actor === 'hero' ? [e.simClockMs] : []);
  expect(actions.slice(0, 2)).toEqual([1700, 3320]);
  const paid = out.events.flatMap(e => e.kind === 'status-state' && e.target === 'hero' ? e.statuses.filter(s => s.id === 'frenzy') : []);
  expect(paid.some(s => s.stacks === 5)).toBe(true); expect(paid.every(s => s.stacks <= 5)).toBe(true);
  expect(new Set(paid.filter(s => s.stacks === 5).map(s => s.expiresAtMs)).size).toBeGreaterThan(1);
  expect(out.result.playerTeam[0]?.stats.attackSpeed).toBe(100);
});
it('keeps basic attacks from refreshing paid speed and reverses it at exact expiry', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [], mana: 12 })) });
  const actions = out.events.flatMap(e => e.kind === 'action' && e.actor === 'hero' ? [e] : []);
  expect(actions.slice(0, 2)).toEqual([expect.objectContaining({ simClockMs: 1700, skillId: canonical }),
    expect.objectContaining({ simClockMs: 3320, skillId: null })]);
  expect(out.events.filter(e => e.kind === 'buff' && e.buffId === 'frenzy')).toHaveLength(2);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 7700 && !e.statuses.some(s => s.id === 'frenzy'))).toBe(true);
  const later = actions.filter(e => e.simClockMs > 10000).map(e => e.simClockMs);
  expect(later.length).toBeGreaterThan(2);
  for (const [i, time] of later.slice(1).entries()) expect(time - (later[i] ?? 0)).toBeCloseTo(1700, 8);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});
it('ends on original-target death without acquiring other living enemies', () => {
  const input = fixture(1, 7, 4), out = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 1 })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'death')).toHaveLength(1);
  expect(out.events.filter(e => e.kind === 'buff' && e.buffId === 'frenzy')).toHaveLength(1);
  expect(out.result.enemyTeam.filter(u => u.life > 0)).toHaveLength(3);
});
it('stops on lethal reflection without granting posthumous stacks or a second hit', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 1 })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, physicalReflectionPct: 1 })) });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(1);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.events.some(e => e.kind === 'buff' && e.buffId === 'frenzy')).toBe(false);
});
it.each(['mana', 'cooldown'] as const)('rejects the complete pair without sufficient %s', failure => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    mana: failure === 'mana' ? 11 : 12, cooldowns: failure === 'cooldown' ? { [canonical]: 100000 } : {} })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
  expect(out.events.some(e => e.kind === 'buff' && e.buffId === 'frenzy')).toBe(false);
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('applies Defense and50%Physical resistance to both independent attempts', () => {
  const input = fixture(), plain = record(input);
  const resistant = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    stats: { ...u.stats, resistances: { ...u.stats.resistances, physical: 50 } } })) });
  const defended = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, defense: 100 } })) });
  const amounts = (o: typeof plain) => o.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e.amount] : []);
  expect(amounts(resistant)).toEqual(amounts(plain).map(n => Math.floor(n / 2)));
  expect(amounts(defended)).toHaveLength(2);
  for (const [i, amount] of amounts(defended).entries()) expect(amount).toBeLessThan(amounts(plain)[i] ?? 0);
});
it('honors the one-second cooldown while haste creates intervening basic actions', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    mana: 24, stats: { ...u.stats, attackSpeed: 250 } })) });
  expect(out.events.flatMap(e => e.kind === 'action' && e.actor === 'hero' ? [[e.simClockMs, e.skillId]] : []))
    .toEqual([[500, canonical], [900, null], [1300, null], [1700, canonical]]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(2);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});
it('expires paid speed while stunned and never takes an action during the hold', () => {
  const input = fixture(), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    statuses: [hold(1701, 10000)] })) });
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs >= 1701 && e.simClockMs < 10000)).toBe(false);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 7700 && !e.statuses.some(s => s.id === 'frenzy'))).toBe(true);
  expect(out.events.some(e => e.kind === 'action' && e.actor === 'hero' && e.simClockMs >= 10000)).toBe(true);
});
it('composes Chill with finite speed and becomes faster after Chill expires', () => {
  const input = fixture(), chilled = { ...input, playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [{
    id: 'chill', sourceId: 'synthetic-chill', stacks: 1, remaining: 5, appliedAtMs: 0, expiresAtMs: 5000 }], mana: 10000 })) };
  const actual = record(chilled), control = record({ ...chilled, playerTeam: chilled.playerTeam.map(u => ({ ...u, frenzyRank: 0 })) });
  const times = (o: typeof actual) => o.events.flatMap(e => e.kind === 'action' && e.actor === 'hero' ? [e.simClockMs] : []);
  expect(times(actual).slice(0, 2)).toEqual(times(control).slice(0, 2));
  expect(times(actual).length).toBeGreaterThan(times(control).length);
  expect(actual.result.playerTeam[0]?.stats.attackSpeed).toBe(100);
});
it.each([0, 1.5, 21, NaN, Infinity])('rejects malformed native learned rank %s', rank => {
  const native = playerToCombatUnit({ ...createMockPlayer('Invalid Frenzy', 'barbarian'), level: 30,
    skillLevels: { 'skills-barbarian-bash': 1, 'skills-barbarian-double-swing': 1, 'skills-barbarian-double-throw': 1, [id]: rank }, comboOrder: [id] });
  expect(native.skillOrder).toEqual([]); expect(native.frenzyRank).toBe(0);
});
it('requires native class, unlock and Double Throw allocation without summing aliases', () => {
  const fresh = createMockPlayer('Frenzy authority', 'barbarian'), skillLevels = {
    'skills-barbarian-bash': 1, 'skills-barbarian-double-swing': 1, 'skills-barbarian-double-throw': 1,
    [id]: 20, 'barbarian.frenzy': 1 };
  expect(playerToCombatUnit({ ...fresh, level: 30, skillLevels, comboOrder: [id] }).frenzyRank).toBe(20);
  for (const patch of [{ class: 'sorceress' as const }, { level: 23 }, { skillLevels: { [id]: 1 } }, { comboOrder: [] }]) {
    const native = playerToCombatUnit({ ...fresh, level: 30, skillLevels, comboOrder: [id], ...patch });
    expect(native.skillOrder).toEqual([]); expect(native.frenzyRank ?? 0).toBe(0);
  }
});
