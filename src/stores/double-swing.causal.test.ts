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

const id = 'skills-barbarian-double-swing', canonical = 'barbarian.double_swing';
const hold = (at = 0, end?: number): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold',
  stacks: 1, remaining: -1, appliedAtMs: at, ...(end === undefined ? {} : { expiresAtMs: end }) });
function fixture(rank = 1, seed = 7, count = 1): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Double Swing', 'barbarian'),
    id: 'hero', level: 30, skillLevels: { 'skills-barbarian-bash': 1, [id]: rank }, comboOrder: [id] });
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

it('consumes an independent missed attempt and rolls criticals separately', () => {
  const misses = record(fixture(1, 41)).events.flatMap(e => e.kind === 'damage' ? [e] : []);
  expect(misses).toHaveLength(2); expect(misses[0]).toMatchObject({ dodged: true, amount: 0 });
  expect(misses[1]?.amount).toBeGreaterThan(0);
  const input = fixture(), critical = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    stats: { ...u.stats, critChance: .5 } })) });
  expect(critical.events.flatMap(e => e.kind === 'damage' ? [e.crit] : [])).toEqual([false, true]);
});
it('skips a dead original in the second pass without replacing it or moving its attempt', () => {
  const base = fixture(1, 7, 9), out = record({ ...base,
    corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }],
    enemyTeam: base.enemyTeam.map((u, i) => i === 1 ? { ...u, life: 1, tier: 'boss' } : u) });
  expect(out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e.target] : []))
    .toEqual(['enemy-1', 'enemy-3', 'enemy-4', 'enemy-3', 'enemy-4']);
  expect(out.events.filter(e => e.kind === 'death')).toEqual([expect.objectContaining({ target: 'enemy-1' })]);
  expect(out.events.filter(e => e.kind === 'orb')).toHaveLength(2);
  expect(out.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available'))
    .toEqual([expect.objectContaining({ params: { count: 1 } })]);
  expect(out.result.enemyTeam.find(u => u.id === 'enemy-0')?.life).toBe(100000);
});
it('stops both passes immediately after lethal reflection kills the caster', () => {
  const base = fixture(1, 7, 3), out = record({ ...base,
    playerTeam: base.playerTeam.map(u => ({ ...u, life: 20 })),
    enemyTeam: base.enemyTeam.map((u, i) => i === 0 ? { ...u, physicalReflectionPct: 1 } : u) });
  expect(out.events.flatMap(e => e.kind === 'damage' ? [[e.source, e.target, e.amount]] : []))
    .toEqual([['hero', 'enemy-0', 41], ['enemy-0', 'hero', 41]]);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.result.enemyTeam.slice(1).map(u => u.life)).toEqual([100000, 100000]);
});
it('depletes personal absorption across independently reflected attempts', () => {
  const base = fixture(), out = record({ ...base,
    playerTeam: base.playerTeam.map(u => ({ ...u, statuses: [...u.statuses, {
      id: 'bone-armor', sourceId: u.id, stacks: 1, remaining: -1,
      boneArmor: { rank: 20, remaining: 50 } }] })),
    enemyTeam: base.enemyTeam.map(u => ({ ...u, physicalReflectionPct: 1 })) });
  expect(out.events.flatMap(e => e.kind === 'damage' && e.source === 'enemy-0' ? [[e.amount, e.absorbed ?? 0]] : []))
    .toEqual([[0, 41], [41, 9]]);
  expect(out.result.playerTeam[0]?.life).toBe(99959);
});
it('applies ordinary Defense and Physical resistance separately to both attempts', () => {
  const base = fixture(), plain = record(base);
  const resistant = record({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u,
    stats: { ...u.stats, resistances: { ...u.stats.resistances, physical: 50 } } })) });
  expect(resistant.events.flatMap(e => e.kind === 'damage' ? [e.amount] : [])).toEqual([20, 25]);
  const defended = record({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u,
    stats: { ...u.stats, defense: 100 } })) });
  const amounts = (out: typeof plain) => out.events.flatMap(e => e.kind === 'damage' ? [e.amount] : []);
  expect(amounts(defended).length).toBe(2);
  for (const [i, amount] of amounts(defended).entries()) expect(amount).toBeLessThan(amounts(plain)[i] ?? 0);
});
it.each(['mana', 'cooldown'] as const)('refuses the entire paid sequence for insufficient %s', failure => {
  const base = fixture(), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
    mana: failure === 'mana' ? 9 : 10, cooldowns: failure === 'cooldown' ? { [canonical]: 100000 } : {} })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
  expect(out.result.playerTeam[0]?.mana).toBe(failure === 'mana' ? 9 : 10);
});
it('pays once at the exact one-second boundary without multiplying cooldowns by attempts', () => {
  const base = fixture(), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
    mana: 20, stats: { ...u.stats, attackSpeed: 250 },
    statuses: [hold(501, 1500), hold(1501)] })) });
  expect(out.events.flatMap(e => e.kind === 'action' && e.skillId === canonical ? [e.simClockMs] : []))
    .toEqual([500, 1500]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(2);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(4);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});
it('uses an ordinary attack before cooldown expiry and resumes the full sequence at expiry', () => {
  const base = fixture(), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
    mana: 20, stats: { ...u.stats, attackSpeed: 250 }, statuses: [hold(1501)] })) });
  expect(out.events.flatMap(e => e.kind === 'action' ? [[e.simClockMs, e.skillId]] : []))
    .toEqual([[500, canonical], [1000, null], [1500, canonical]]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(2);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});
it.each([0, 1.5, 21, NaN, Infinity])('rejects malformed learned rank %s through native composition', rank => {
  const native = playerToCombatUnit({ ...createMockPlayer('Invalid Double Swing', 'barbarian'),
    level: 30, skillLevels: { [id]: rank, 'skills-barbarian-bash': 1 }, comboOrder: [id] });
  expect(native.skillOrder).toEqual([]);
});
it('requires actual class, unlock level and Bash allocation without summing aliases', () => {
  const fresh = createMockPlayer('Double Swing authority', 'barbarian');
  const learned = { [id]: 20, 'barbarian.double_swing': 1, 'skills-barbarian-bash': 1 };
  expect(playerToCombatUnit({ ...fresh, level: 30, skillLevels: learned, comboOrder: [id] }).skillLevels?.[canonical]).toBe(20);
  for (const patch of [{ class: 'sorceress' as const }, { level: 5 },
    { skillLevels: { [id]: 1 } }, { skillLevels: {} }]) {
    const native = playerToCombatUnit({ ...fresh, level: 30, skillLevels: learned, comboOrder: [id], ...patch });
    expect(native.skillOrder).toEqual([]);
  }
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 2, 20])('rank%i resolves two real passes over the capped original cross', rank => {
  const pools = [[0], [0, 1], [0, 1, 2], [0, 1, 3], [1, 3, 4]];
  for (const [i, count] of [1, 2, 3, 4, 9].entries()) for (const seed of [7, 19, 41, 97]) {
    const input = fixture(rank, seed, count), out = record(input);
    const pool = pools[i]; if (!pool) throw new Error('Missing literal target expectation');
    const targets = [...pool, ...pool].map(n => 'enemy-' + String(n));
    const hits = out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
    expect(hits.map(e => e.target)).toEqual(targets);
    expect(hits.every(e => e.simClockMs === 1700 && e.damageType === 'physical')).toBe(true);
    for (const hit of hits) {
      if (hit.dodged) expect(hit.amount).toBe(0);
      else { expect(hit.amount).toBeGreaterThanOrEqual(40 + 4 * (rank - 1));
        expect(hit.amount).toBeLessThanOrEqual(60 + 4 * (rank - 1)); }
    }
    for (const enemy of out.result.enemyTeam)
      expect(enemy.life).toBe(100000 - hits.filter(h => h.target === enemy.id).reduce((n, h) => n + h.amount, 0));
    expect(out.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: canonical, simClockMs: 1700 })]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(90);
  }
});
