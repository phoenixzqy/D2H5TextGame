import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { statusActiveAt } from '@/engine/combat/status';
import { loadDefaultSkills, resetRegistry, getSkill, registerSkill } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const id = 'skills-assassin-psychic-hammer', canonical = 'assassin.psychic_hammer';
const hold: ActiveStatus = { id: 'stun', sourceId: 'synthetic-one-cast', stacks: 1, remaining: -1, appliedAtMs: 1701 };
function fixture(rank = 1, seed = 7): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Hammer', 'assassin'),
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
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  const statusPlayback = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(statusPlayback ? { statusPlayback } : {}) };
  for (const e of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, e, teams.statusPlayback);
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
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each([1, 2, 20])('rank%i really interrupts landed targets with finite ordinary/boss Stun', rank => {
  const original = getSkill(id); if (!original) throw new Error('Missing native Hammer');
  const plain = { ...original, effects: original.effects.map(e => {
    if (e.kind !== 'damage') return e;
    const { applyStatus, ...damage } = e; void applyStatus; return damage;
  }) };
  let landed = 0, misses = 0;
  for (const tier of ['trash', 'boss', 'chapter-boss'] as const) for (const seed of [7, 19, 41, 97]) {
    const base = fixture(rank, seed), input = { ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, tier })) };
    registerSkill(original); const actual = record(input);
    registerSkill(plain); const control = record(input);
    const first = actual.events.find(e => e.kind === 'damage' && e.source === 'hero');
    if (first?.kind !== 'damage') throw new Error('Missing actual Hammer attempt');
    expect(control.events.find(e => e.kind === 'damage' && e.source === 'hero')).toEqual(first);
    expect(actual.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 94 })
    ]);
    expect(actual.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
      expect.objectContaining({ skillId: canonical, simClockMs: 1700 })
    ]);
    const clocks = (out: typeof actual) => out.events.filter(e => e.kind === 'action' && e.actor === 'target').map(e => e.simClockMs);
    const applied = actual.events.find(e => e.kind === 'status-state' && e.target === 'target' &&
      e.statuses.some(s => s.id === 'stun' && s.sourceId === 'hero'));
    if (!first.dodged) {
      landed++;
      expect.soft(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'stun') : undefined)
        .toMatchObject({ appliedAtMs: 1700, expiresAtMs: tier === 'trash' ? 2700 : 2200 });
      expect.soft(clocks(actual)).toEqual(clocks(control).slice(1));
      expect.soft(clocks(actual)[0]).toBe(4000);
    } else {
      misses++; expect(applied).toBeUndefined(); expect(clocks(actual)).toEqual(clocks(control));
    }
    expect(actual.result.enemyTeam[0]?.life).toBe(100000 - first.amount);
    expect(actual.result.enemyTeam[0]?.gridPosition).toEqual({ row: 1, col: 1 });
    expect(actual.result.enemyTeam[0]?.statuses).toEqual([]);
  }
  expect(landed).toBeGreaterThan(0); expect(misses).toBeGreaterThan(0);
});

it('affects only the selected enemy and retains ordinary on-hit-before-death settlement', () => {
  const base = fixture(), target = base.enemyTeam[0]; if (!target) throw new Error('Missing target');
  const out = record({ ...base, enemyTeam: [target, { ...target, id: 'other' }] });
  expect(out.events.flatMap(e => e.kind === 'status' && e.statusId === 'stun' ? [e.target] : [])).toEqual(['target']);
  const killed = record({ ...base, enemyTeam: [{ ...target, life: 1 }] });
  expect(killed.result.enemyTeam[0]?.life).toBe(0);
  const status = killed.events.findIndex(e => e.kind === 'status' && e.target === 'target');
  const death = killed.events.findIndex(e => e.kind === 'death' && e.target === 'target');
  expect(status).toBeGreaterThan(-1); expect(death).toBeGreaterThan(status);
  expect(killed.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(1);
  expect(killed.events.filter(e => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
  expect(killed.events.some(e => e.kind === 'action' && e.actor === 'target')).toBe(false);
});

it('extends an active canonical Stun without adding another marker or moving the enemy', () => {
  const base = fixture(), out = record({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u,
    statuses: [{ id: 'stun', sourceId: 'prior-ally', stacks: 1, remaining: 2,
      appliedAtMs: 0, expiresAtMs: 2000 }] })) });
  const state = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 1700);
  expect(state?.kind === 'status-state' ? state.statuses : undefined).toEqual([
    expect.objectContaining({ id: 'stun', stacks: 1, appliedAtMs: 0, expiresAtMs: 2700 })
  ]);
  expect(out.result.enemyTeam[0]?.gridPosition).toEqual({ row: 1, col: 1 });
});

it.each([{ mana: 5 }, { cooldowns: { [canonical]: 100000 } }])('refuses unavailable Hammer %j', patch => {
  const base = fixture(), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, ...patch })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
});
it('uses native alias/class/level/allocation authority', () => {
  const fresh = { ...createMockPlayer('Synthetic Hammer authority', 'assassin'), level: 30 };
  for (const alias of [id, canonical]) {
    const unit = playerToCombatUnit({ ...fresh, comboOrder: [alias], skillLevels: { [alias]: 20 } });
    expect(unit.skillOrder).toEqual([alias]); expect(unit.skillLevels?.[canonical]).toBe(20);
  }
  for (const patch of [{ class: 'sorceress' as const }, { level: 0 },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { [id]: rank } }))]) {
    expect(playerToCombatUnit({ ...fresh, comboOrder: [id], skillLevels: { [id]: 1 }, ...patch }).skillOrder).toEqual([]);
  }
});
