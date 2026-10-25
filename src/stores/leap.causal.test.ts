import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { rebaseStatusClock, statusActiveAt } from '@/engine/combat/status';
import { loadDefaultSkills, resetRegistry, getSkill, registerSkill } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const id = 'skills-barbarian-leap', canonical = 'barbarian.leap';
const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold', stacks: 1,
  remaining: -1, appliedAtMs: at });
function fixture(rank = 1, seed = 7): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Leap', 'barbarian'),
    id: 'hero', level: 30, skillLevels: { [id]: rank }, comboOrder: [id] });
  const hero: CombatUnit = { ...native, life: 100000, mana: 100, statuses: [hold(1701)],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 100000, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed, playerTeam: [hero], enemyTeam: Array.from({ length: 3 }, (_, i) => ({
    ...hero, id: 'enemy-' + String(i), side: 'enemy', kind: 'monster',
    skillOrder: [], skillLevels: {}, statuses: [], gridPosition: { row: 0, col: i },
    stats: { ...hero.stats, attackSpeed: 0 }, basicAttack: { damage: [1, 1], damageType: 'physical' }
  })) };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
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

it.each([1, 2, 20])('rank%i pays once, grants finite physical potency and interrupts all three enemies', rank => {
  for (const tier of ['trash', 'boss', 'chapter-boss'] as const) for (const seed of [7, 19, 41, 97]) {
    const base = fixture(rank, seed), input = { ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, tier })) };
    const out = record(input), cost = Math.round(8 - .1 * (rank - 1));
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 100 - cost })]);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
      expect.objectContaining({ skillId: canonical, simClockMs: 1700 })]);
    expect.soft(out.events.flatMap(e => e.kind === 'status' && e.statusId === 'stun' ? [e.target] : []))
      .toEqual(['enemy-0', 'enemy-1', 'enemy-2']);
    for (const enemy of input.enemyTeam) {
      const applied = out.events.find(e => e.kind === 'status-state' && e.target === enemy.id && e.simClockMs === 1700);
      expect.soft(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'stun') : undefined)
        .toMatchObject({ appliedAtMs: 1700, expiresAtMs: tier === 'trash' ? 2700 : 2200 });
      expect.soft(out.events.filter(e => e.kind === 'action' && e.actor === enemy.id).slice(0, 3).map(e => e.simClockMs))
        .toEqual([4000, 6000, 8000]);
    }
    const paid = out.events.find(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700);
    expect.soft(paid?.kind === 'status-state' ? paid.statuses.find(s => s.id === 'leap') : undefined)
      .toMatchObject({ sourceId: 'hero', appliedAtMs: 1700, expiresAtMs: 4700,
        leap: { rank, physicalDamagePct: .01 * rank } });
    expect(out.events.some(e => e.kind === 'damage' && e.source === 'hero')).toBe(false);
    expect(out.result.enemyTeam.map(u => u.gridPosition)).toEqual(input.enemyTeam.map(u => u.gridPosition));
    expect(out.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
  }
});

/** Capture the actual paid cast through playback, then rebase without extending it. */
function carried(rank = 20): CombatSnapshot {
  const input = fixture(rank), out = record(input);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const e of out.events.filter(e => e.simClockMs <= 1700))
    teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, e, teams.statusPlayback);
  const hero = teams.playerTeam[0];
  if (!hero?.statuses.some(s => s.id === 'leap')) throw new Error('Missing actual paid Leap');
  const rebased = rebaseStatusClock(hero, 1700);
  return { seed: 7, playerTeam: [{ ...rebased, leapRank: 0, skillOrder: [],
    statuses: rebased.statuses.filter(s => s.id !== 'stun') }],
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [hold()] })) };
}
it.each([1, 2, 20])('rank%i changes real Physical damage once additively, then expires', rank => {
  const base = carried(rank);
  let landed = 0;
  for (const seed of [7, 19, 41, 97]) {
    const input = { ...base, seed, playerTeam: base.playerTeam.map(u => ({ ...u,
      increasedDamagePct: { physical: .25 }, basicAttack: { damage: [100, 100] as const, damageType: 'physical' as const } })) };
    const actual = record(input), control = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      statuses: u.statuses.filter(s => s.id !== 'leap') })) });
    const hits = (out: typeof actual) => out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
    const paid = hits(actual), plain = hits(control);
    expect(paid.map(e => e.dodged)).toEqual(plain.map(e => e.dodged));
    for (const [i, e] of paid.entries()) if (!e.dodged) {
      if (i === 0) { expect(e.amount).toBe(125 + rank); expect(plain[i]?.amount).toBe(125); landed++; }
      else expect(e).toEqual(plain[i]);
    }
    expect(paid[0]?.simClockMs).toBe(1700); expect(paid[1]?.simClockMs).toBe(3400);
  }
  expect(landed).toBeGreaterThan(0);
});
it.each(['arcane', 'fire', 'thorns'] as const)('paid Leap leaves real %s damage unchanged', damageType => {
  const base = carried(), input = { ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
    basicAttack: { damage: [100, 100] as const, damageType } })) };
  const actual = record(input), control = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    statuses: u.statuses.filter(s => s.id !== 'leap') })) });
  expect(actual.events.filter(e => e.kind === 'damage')).toEqual(control.events.filter(e => e.kind === 'damage'));
});
it('applies the same personal bonus to an actual registered Physical skill hit', () => {
  const base = carried();
  let landed = 0;
  for (const seed of [7, 19, 41, 97]) {
    const input = { ...base, seed, playerTeam: base.playerTeam.map(u => ({ ...u,
      skillOrder: ['skills-barbarian-bash'], skillLevels: { 'barbarian.bash': 1 } })) };
    const actual = record(input), control = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      statuses: u.statuses.filter(s => s.id !== 'leap') })) });
    const hits = (out: typeof actual) => out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
    const hit = hits(actual)[0], plain = hits(control)[0];
    if (!hit || !plain) throw new Error('Missing actual registered Bash hit');
    expect(actual.events.find(e => e.kind === 'action' && e.actor === 'hero'))
      .toMatchObject({ skillId: 'barbarian.bash', simClockMs: 1700 });
    expect(hit.dodged).toBe(plain.dodged);
    if (!hit.dodged) { expect(hit.amount).toBe(Math.floor(plain.amount * 1.2)); landed++; }
  }
  expect(landed).toBeGreaterThan(0);
});
it('controls living enemies only, leaves an ally untouched and deals no direct damage', () => {
  const base = fixture(), hero = base.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const out = record({ ...base, playerTeam: [hero, { ...hero, id: 'ally', kind: 'merc',
    skillOrder: [], statuses: [hold()] }],
    enemyTeam: base.enemyTeam.map((u, i) => i === 0 ? { ...u, life: 0 } : u) });
  expect(out.events.flatMap(e => e.kind === 'status' ? [e.target] : [])).toEqual(['enemy-1', 'enemy-2']);
  expect(out.events.some(e => e.kind === 'buff' && e.target === 'ally')).toBe(false);
  expect(out.events.some(e => e.kind === 'damage' && e.source === 'hero')).toBe(false);
});
it('never refreshes an active paid buff and can pay again after expiry', () => {
  const base = fixture(20), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, statuses: [] })) });
  const casts = out.events.filter(e => e.kind === 'action' && e.skillId === canonical);
  expect(casts.slice(0, 3).map(e => e.simClockMs)).toEqual([1700, 5100, 8500]);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(casts.length);
});
it.each([{ mana: 7 }, { mana: NaN }, { cooldowns: { [canonical]: 100000 } },
  { leapRank: 0 }, { leapRank: 21 }, { leapRank: NaN },
  { kind: 'merc' as const }, { summon: true }, { ownerId: 'other' }, { summonOwnerId: 'other' },
  { level: 5 }])('refuses invalid native readiness before payment/effects %j', patch => {
  const base = fixture(), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, ...patch })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
});
it('refuses omitted native authority before payment or control', () => {
  const base = fixture(), out = record({ ...base, playerTeam: base.playerTeam.map(u => {
    const { leapRank: omitted, ...withoutRank } = u; void omitted; return withoutRank;
  }) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
  expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
});
it('rejects partial or contradictory registered effects before payment', () => {
  const skill = getSkill(canonical); if (!skill) throw new Error('Missing native Leap');
  for (const patch of [{ effects: skill.effects.slice(0, 1) }, { target: 'self' as const },
    { manaCost: 0 }, { cooldown: 0 }]) {
    registerSkill({ ...skill, ...patch });
    const out = record(fixture());
    expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
    expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
  }
});
