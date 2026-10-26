import { afterEach, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { paidWeaken } from './weaken-definition';
import { paidDecrepify } from './decrepify-definition';
import { paidBattleCry, WARCRY_DEFINITIONS } from './warcry-definition';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from '../../stores/combatPlayback';
import { statusActiveAt } from './status';

const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs: start });
function curse(start = 0, end = start + 3000): ActiveStatus {
  return { id: 'weaken', sourceId: 'absent-paid-owner', stacks: 1, remaining: 3,
    appliedAtMs: start, expiresAtMs: end, weaken: paidWeaken() };
}
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100000, mana: 0, skillOrder: [], activeBuffIds: [], cooldowns: {}, statuses: [], enraged: false,
    stats: { life: 100000, lifeMax: 100000, mana: 0, manaMax: 0, attack: 100, attackSpeed: 250,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function fixture(statuses: ActiveStatus[] = [curse(400)]): CombatSnapshot {
  return { seed: 1, playerTeam: [{ ...unit('hero', 'player'), statuses: [hold()] }],
    enemyTeam: [{ ...unit('target', 'enemy'), statuses: [...statuses, hold(4501)] }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
function times(out: ReturnType<typeof record>) {
  return out.events.flatMap(e => e.kind === 'action' && e.actor === 'target' ? [e.simClockMs] : []);
}
const cry = (start: number): ActiveStatus => ({ id: 'battle-cry', sourceId: 'other', stacks: 1,
  remaining: WARCRY_DEFINITIONS.battleCry.durationMs / 1000,
  appliedAtMs: start, expiresAtMs: start + WARCRY_DEFINITIONS.battleCry.durationMs, battleCry: paidBattleCry(1) });
const decrepify: ActiveStatus = { id: 'decrepify', sourceId: 'other', stacks: 1, remaining: 3,
  appliedAtMs: 0, expiresAtMs: 3000, decrepify: paidDecrepify() };
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it('changes actual damage from onset through expiry while keeping ordinary attack times and base stats', () => {
  const input = fixture(), out = record(input);
  expect(times(out)).toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
  expect(out.result.playerTeam[0]?.life).toBe(99432);
  expect(out.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
});
it('activates exactly at onset and expires before the action due at the same clock', () => {
  const out = record(fixture([curse(500, 3500)]));
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'target' && e.simClockMs === 500)).toMatchObject({ amount: 67 });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'target' && e.simClockMs === 3500)).toMatchObject({ amount: 100 });
});
it('retains fractional onset and expiry without rounding to a neighboring action', () => {
  const out = record(fixture([curse(500.25, 3500.25)]));
  expect(out.events.flatMap(e => e.kind === 'damage' && e.source === 'target' ? [e.amount] : []))
    .toEqual([100, 67, 0, 67, 67, 0, 67, 100, 100]);
});
it.each(['physical', 'arcane', 'fire', 'cold', 'lightning', 'poison', 'thorns'] as const)(
  'reduces %s direct damage before resistance and the relevant flat mitigation', damageType => {
    registerSkill({ id: 'fixture.weaken-direct', archetype: 'monster', target: 'single-enemy', cooldown: 100, manaCost: 0,
      minLevel: 1, effects: [{ kind: 'damage', damageType, base: [100, 100] }] });
    const input = fixture([curse()]), out = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, stats: { ...u.stats, defense: 10, magicResist: 10,
        resistances: { ...u.stats.resistances, [damageType === 'thorns' ? 'physical' : damageType]: 50 } } })),
      enemyTeam: input.enemyTeam.map(u => ({ ...u, skillOrder: ['fixture.weaken-direct'] })) });
    expect(out.events.find(e => e.kind === 'damage' && e.source === 'target')).toMatchObject({ damageType, amount: 23, dodged: false });
  });
it.each([
  { label: 'Battle Cry', statuses: [cry(0)], first: 500, damage: 50 },
  { label: 'Decrepify', statuses: [decrepify], first: 1500, damage: 44 },
  { label: 'both paid reductions', statuses: [cry(1000), decrepify], first: 1500, damage: 33 }
])('multiplies with $label rather than adding reduction percentages', ({ statuses, first, damage }) => {
  const out = record(fixture([curse(), ...statuses]));
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'target')).toMatchObject({ simClockMs: first, amount: damage });
});
it('does not reduce an existing periodic rate a second time', () => {
  const input = fixture([curse()]), out = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [...u.statuses,
    { id: 'poison', sourceId: 'target', stacks: 1, remaining: 3, appliedAtMs: 0, expiresAtMs: 3000,
      dotPerStack: 100, damageType: 'poison' }] })) });
  expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === 'hero' ? e.amount : 0), 0)).toBe(300);
});
it('snapshots a new hit-derived DoT from the reduced landed damage exactly once', () => {
  registerSkill({ id: 'fixture.weaken-poison', archetype: 'monster', target: 'single-enemy', cooldown: 100, manaCost: 0,
    minLevel: 1, effects: [{ kind: 'damage', damageType: 'poison', base: [100, 100],
      applyStatus: { id: 'poison', chance: 1, dotPctOfDamage: .1 } }] });
  const input = fixture([curse()]), out = record({ ...input,
    enemyTeam: input.enemyTeam.map(u => ({ ...u, skillOrder: ['fixture.weaken-poison'] })) });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'target')).toMatchObject({ amount: 67, damageType: 'poison', dodged: false });
  const event = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' && e.statuses.some(s => s.id === 'poison'));
  expect(event?.kind === 'status-state' ? event.statuses.find(s => s.id === 'poison') : undefined)
    .toMatchObject({ dotPerStack: 6, sourceId: 'target' });
});
it('keeps reflected damage on its independent existing mitigation path', () => {
  const input = fixture([curse()]), out = record({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [], stats: { ...u.stats, attackSpeed: 526 } })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [curse(), hold()], physicalReflectionPct: 1 })) });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'hero' && !e.dodged)).toMatchObject({ amount: 100 });
  expect(out.events.find(e => e.kind === 'damage' && e.source === 'target' && e.damageType === 'thorns')).toMatchObject({ amount: 100 });
});
it('does not reduce a cursed actors healing output', () => {
  registerSkill({ id: 'fixture.weaken-heal', archetype: 'monster', minLevel: 1, target: 'self', manaCost: 0,
    cooldown: 100, effects: [{ kind: 'heal', target: 'self', amount: 100 }] });
  const input = fixture([curse()]), out = record({ ...input,
    enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 90000, skillOrder: ['fixture.weaken-heal'] })) });
  expect(out.events.filter(e => e.kind === 'heal')).toEqual([expect.objectContaining({ target: 'target', amount: 100, simClockMs: 500 })]);
  expect(out.result.enemyTeam[0]?.life).toBe(90100);
});
it('leaves actual damage and action times unchanged for bare, forged or nonfinite packets', () => {
  const plain = record(fixture([]));
  for (const invalid of [{ id: 'weaken', sourceId: 'marker', stacks: 1, remaining: -1 },
    { ...curse(), weaken: { damageReductionPct: 99 } }, { ...curse(), expiresAtMs: Infinity }]) {
    const out = record(fixture([invalid]));
    expect(times(out)).toEqual(times(plain));
    expect(out.events.filter(e => e.kind === 'damage')).toEqual(plain.events.filter(e => e.kind === 'damage'));
    expect(out.result.playerTeam[0]?.life).toBe(99300);
  }
});
