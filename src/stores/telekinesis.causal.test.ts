import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { statusActiveAt } from '@/engine/combat/status';

const id = 'skills-sorceress-telekinesis', canonical = 'sorceress.telekinesis';
const hold: ActiveStatus = { id: 'stun', sourceId: 'synthetic-one-cast', stacks: 1,
  remaining: -1, appliedAtMs: 1701 };
/** Native class/rank/priority, synthetic durable pools and a one-cast observation window. */
function fixture(rank = 1, seed = 7): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Telekinesis', 'sorceress'),
    id: 'hero', level: 30, skillLevels: { [id]: rank }, comboOrder: [id] });
  const hero: CombatUnit = { ...native, life: 100000, mana: 100, statuses: [hold],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 100000, manaMax: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed, playerTeam: [hero], enemyTeam: [{ ...hero, id: 'target', side: 'enemy',
    kind: 'monster', skillOrder: [], skillLevels: {}, statuses: [], gridPosition: { row: 1, col: 1 },
    stats: { ...hero.stats, attackSpeed: 0 }, basicAttack: { damage: [1, 1], damageType: 'physical' } }] };
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});

it('controls exactly one living hostile, without moving or damaging any enemy', () => {
  const base = fixture(), target = base.enemyTeam[0]; if (!target) throw new Error('Missing target');
  const out = runBattleRecorded({ ...base, enemyTeam: [target, { ...target, id: 'other' }, { ...target, id: 'dead', life: 0 }] });
  const recipients = out.events.flatMap(e => e.kind === 'status' && e.statusId === 'stun' && e.simClockMs === 1700 ? [e.target] : []);
  expect(recipients).toHaveLength(1); expect(['target', 'other']).toContain(recipients[0]);
  expect(out.events.some(e => e.kind === 'damage' && e.source === 'hero')).toBe(false);
  expect(out.result.enemyTeam.map(u => [u.id, u.life, u.gridPosition])).toEqual([
    ['target', 100000, { row: 1, col: 1 }], ['other', 100000, { row: 1, col: 1 }], ['dead', 0, { row: 1, col: 1 }]
  ]);
});
it('refreshes canonical Stun and expires it at the half-open boundary', () => {
  const base = fixture(), out = runBattleRecorded({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u,
    statuses: [{ id: 'stun', sourceId: 'prior-ally', stacks: 1, remaining: 2, appliedAtMs: 0, expiresAtMs: 2000 }] })) });
  const applied = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 1700);
  expect(applied?.kind === 'status-state' ? applied.statuses : undefined).toEqual([
    expect.objectContaining({ id: 'stun', stacks: 1, appliedAtMs: 0, expiresAtMs: 2700 })
  ]);
  const expired = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 2700);
  expect(expired?.kind === 'status-state' ? expired.statuses : undefined).toEqual([]);
});
it.each([{ mana: 6 }, { cooldowns: { [canonical]: 100000 } }])('refuses unavailable Telekinesis without payment %j', patch => {
  const base = fixture(), out = runBattleRecorded({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, ...patch })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
});
it('uses native class, unlock and exact learned allocation authority', () => {
  const fresh = { ...createMockPlayer('Telekinesis authority', 'sorceress'), level: 30 };
  for (const alias of [id, canonical]) {
    const unit = playerToCombatUnit({ ...fresh, comboOrder: [alias], skillLevels: { [alias]: 20 } });
    expect(unit.skillOrder).toEqual([alias]); expect(unit.skillLevels?.[canonical]).toBe(20);
  }
  for (const patch of [{ class: 'assassin' as const }, { level: 5 }, { skillLevels: {} },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { [id]: rank } }))])
    expect(playerToCombatUnit({ ...fresh, comboOrder: [id], skillLevels: { [id]: 1 }, ...patch }).skillOrder).toEqual([]);
});
it('replays actual resource and finite status state to the terminal engine result', () => {
  const input = fixture(), out = runBattleRecorded(input);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const e of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, e, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
});
it.each([1, 2, 20])('rank%i respects actual cooldown cadence and pays exactly once per cast', rank => {
  const base = fixture(rank), out = runBattleRecorded({ ...base,
    playerTeam: base.playerTeam.map(u => ({ ...u, mana: 20, statuses: [] })) });
  const casts = out.events.filter(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === canonical);
  expect(casts.map(e => e.simClockMs)).toEqual(rank === 20 ? [1700, 3400, 5100, 6800] : [1700, 5100]);
  const payments = out.events.filter(e => e.kind === 'mana' && e.reason === 'cast');
  expect(payments.map(e => e.kind === 'mana' ? e.mana : undefined)).toEqual(rank === 20 ? [15, 10, 5, 0] : [13, 6]);
  expect(payments.map(e => e.simClockMs)).toEqual(casts.map(e => e.simClockMs));
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 2, 20])('rank%i interrupts one enemy with finite ordinary/boss Stun and no damage', rank => {
  const original = getSkill(id); if (!original) throw new Error('Missing native Telekinesis');
  for (const tier of ['trash', 'boss', 'chapter-boss'] as const) for (const seed of [7, 19, 41, 97]) {
    const base = fixture(rank, seed), input = { ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, tier })) };
    const before = structuredClone(input);
    registerSkill(original); const actual = runBattleRecorded(input);
    expect(runBattleRecorded(input)).toEqual(actual); expect(input).toEqual(before);
    // Keep the old inert marker: an empty effect list is unavailable and falls back to Attack.
    registerSkill({ ...original, effects: [{ kind: 'debuff', statusId: 'knockback' }] });
    const control = runBattleRecorded(input);
    const clocks = (out: typeof actual) => out.events.flatMap(e => e.kind === 'action' && e.actor === 'target' ? [e.simClockMs] : []);
    const heroActions = (out: typeof actual) => out.events.filter(e => e.kind === 'action' && e.actor === 'hero');
    const payments = (out: typeof actual) => out.events.filter(e => e.kind === 'mana' && e.reason === 'cast');
    expect(heroActions(control)).toEqual(heroActions(actual));
    expect(payments(control)).toEqual(payments(actual));
    expect(control.events.some(e => e.kind === 'damage' && e.source === 'hero')).toBe(false);
    expect(control.result.enemyTeam[0]).toMatchObject({ life: 100000, gridPosition: { row: 1, col: 1 } });
    expect(clocks(control)[0]).toBe(2000);
    expect.soft(clocks(actual)).toEqual(clocks(control).slice(1));
    expect.soft(clocks(actual)[0]).toBe(4000);
    const applied = actual.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 1700);
    expect.soft(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'stun') : undefined)
      .toMatchObject({ appliedAtMs: 1700, expiresAtMs: tier === 'trash' ? 2700 : 2200 });
    expect(heroActions(actual)).toEqual([
      expect.objectContaining({ skillId: canonical, simClockMs: 1700 })
    ]);
    expect(payments(actual)).toEqual([
      expect.objectContaining({ target: 'hero', mana: 100 - Math.round(7 - .1 * (rank - 1)) })
    ]);
    expect(actual.events.some(e => e.kind === 'damage' && e.source === 'hero')).toBe(false);
    expect(actual.result.enemyTeam[0]).toMatchObject({ life: 100000, gridPosition: { row: 1, col: 1 }, statuses: [] });
  }
});
