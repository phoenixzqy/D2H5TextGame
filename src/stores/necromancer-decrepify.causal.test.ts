import { beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/necromancer.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { resetRegistry, loadDefaultSkills, registerSkill } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { paidDecrepify } from '@/engine/combat/decrepify-definition';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
const id = 'skills-necromancer-decrepify', canonical = 'necromancer.decrepify';
function owner(rank = 1) {
  const levels: Record<string, number> = {};
  function add(next: string) {
    const row = rows.find(s => s.id === next);
    if (!row) throw new Error('Missing authored Decrepify prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    levels[next] = 1;
  }
  add(id); levels[id] = rank;
  return { ...createMockPlayer('Synthetic native Decrepify causal fixture', 'necromancer'),
    level: 30, skillLevels: levels, comboOrder: [id] };
}
/** Unearned pools, fixed normal attack and exact scheduler; no mocked combat or registry effects. */
function fixture(rank = 1): CombatSnapshot {
  const native = playerToCombatUnit(owner(rank));
  const hero: CombatUnit = { ...native, id: 'hero', life: 100000, mana: rank === 20 ? 14 : 20,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1, appliedAtMs: 401 }],
    stats: { ...native.stats, life: 100000, lifeMax: 100000, mana: 100, manaMax: 100,
      attack: 0, attackSpeed: 263, defense: 0, magicResist: 0, critChance: 0,
      critDamage: 1.5, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier: 'trash',
    mana: 0, skillOrder: [], skillLevels: {}, activeBuffIds: [],
    statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1, appliedAtMs: 4501 }],
    stats: { ...hero.stats, attackSpeed: 250, attack: 100 } };
  return { seed: 1, playerTeam: [hero], enemyTeam: [target] };
}
function enemyDamage(e: RecordedBattleEvent): e is Extract<RecordedBattleEvent, { kind: 'damage' }> {
  return e.kind === 'damage' && e.source === 'target';
}
for (const rank of [1, 20]) {
  it(`actual native paid Decrepify rank${String(rank)} slows pending attack phase and reduces live outgoing damage`, () => {
    const input = fixture(rank), before = structuredClone(input), out = runBattleRecorded(input);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
      expect.objectContaining({ skillId: canonical, simClockMs: 400 })
    ]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })
    ]);
    expect.soft(out.events.filter(e => e.kind === 'action' && e.actor === 'target').map(e => e.simClockMs))
      .toEqual([700, 2200, 3500, 4000, 4500]);
    expect.soft(out.events.filter(enemyDamage).map(e => ({ time: e.simClockMs, amount: e.amount, dodged: e.dodged })))
      .toEqual([{ time: 700, amount: 67, dodged: false }, { time: 2200, amount: 67, dodged: false },
        { time: 3500, amount: 0, dodged: true }, { time: 4000, amount: 100, dodged: false },
        { time: 4500, amount: 100, dodged: false }]);
    expect.soft(out.result.playerTeam[0]?.life).toBe(99666);
    const applied = out.events.find(e => e.kind === 'status-state' && e.target === 'target' &&
      e.statuses.some(status => status.id === 'decrepify'));
    expect.soft(applied?.kind === 'status-state' ? applied.statuses.find(status => status.id === 'decrepify') : undefined)
      .toMatchObject({ stacks: 1, appliedAtMs: 400, expiresAtMs: 3400, sourceId: 'hero',
        decrepify: { attackSpeedReductionPct: 50, damageReductionPct: 33 } });
    expect(out.result.enemyTeam[0]?.stats.attackSpeed).toBe(250);
    expect(out.result.enemyTeam[0]?.stats.attack).toBe(100);
    expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result);
    expect(runBattleRecorded(input)).toEqual(out);
  });
  it(`uncursed matched native rank${String(rank)} control retains the exact ordinary scheduler and damage`, () => {
    const input = fixture(rank);
    const out = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => ({ ...unit,
      statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1 }] })) });
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'target').map(e => e.simClockMs))
      .toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
    expect(out.events.filter(enemyDamage).map(e => e.amount)).toEqual([100, 100, 0, 100, 100, 0, 100, 100, 100]);
    expect(out.result.playerTeam[0]?.life).toBe(99300);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });
  it(`native rank${String(rank)} Decrepify refuses insufficient mana and active cooldown without payment`, () => {
    const input = fixture(rank), cost = rank === 20 ? 14 : 20;
    for (const patch of [{ mana: cost - 1 }, { cooldowns: { [canonical]: 100000 } }]) {
      const out = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => ({ ...unit, ...patch })) });
      expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'decrepify')).toEqual([]);
    }
  });
}
it('native ownership/level/prerequisite/rank guards exclude unavailable Decrepify', () => {
  const original = owner();
  const noTerror = { ...original.skillLevels }; Reflect.deleteProperty(noTerror, 'skills-necromancer-terror');
  for (const patch of [{ class: 'barbarian' as const }, { level: 23 }, { skillLevels: {} }, { skillLevels: noTerror },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { ...original.skillLevels, [id]: rank } }))])
    expect(playerToCombatUnit({ ...original, ...patch }).skillOrder).toEqual([]);
  expect(playerToCombatUnit(original).skillOrder).toEqual([id]);
});
it.each(['trash', 'boss', 'chapter-boss'] as const)('the real paid curse affects every living %s hostile and excludes allies and dead bodies', tier => {
  const input = fixture(), target = input.enemyTeam[0], hero = input.playerTeam[0];
  if (!target || !hero) throw new Error('Missing native fixture bodies');
  const out = runBattleRecorded({ ...input,
    playerTeam: [hero, { ...hero, id: 'ally', kind: 'merc', skillOrder: [], statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }],
    enemyTeam: [{ ...target, tier }, { ...target, id: 'second', tier }, { ...target, id: 'dead', tier, life: 0 }] });
  expect(out.events.flatMap(e => e.kind === 'status' && e.statusId === 'decrepify' ? [e.target] : []))
    .toEqual(['target', 'second']);
  for (const targetId of ['target', 'second']) {
    const applied = out.events.find(e => e.kind === 'status-state' && e.target === targetId &&
      e.statuses.some(s => s.id === 'decrepify'));
    expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'decrepify') : undefined)
      .toMatchObject({ appliedAtMs: 400, expiresAtMs: 3400, decrepify: paidDecrepify() });
  }
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
});
it('a real paid refresh extends duration without resetting attack progress or stacking potency', () => {
  const input = fixture(), out = runBattleRecorded({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    statuses: [...u.statuses, { id: 'decrepify', sourceId: 'previous', stacks: 1, remaining: 3,
      appliedAtMs: 0, expiresAtMs: 3000, decrepify: paidDecrepify() }] })) });
  const times = out.events.flatMap(e => e.kind === 'action' && e.actor === 'target' ? [e.simClockMs] : []);
  expect(times).toHaveLength(4);
  [1500, 3000, 3400 + 1100 / 3, 3900 + 1100 / 3].forEach((at, i) => { expect(times[i]).toBeCloseTo(at, 8); });
  const refreshed = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 400);
  expect(refreshed?.kind === 'status-state' ? refreshed.statuses.filter(s => s.id === 'decrepify') : undefined)
    .toEqual([expect.objectContaining({ sourceId: 'hero', appliedAtMs: 400, expiresAtMs: 3400, stacks: 1 })]);
});
it('curse payment and application add no hit, damage or proc RNG draws', () => {
  const input = fixture(), paid = runBattleRecorded(input);
  const prior = runBattleRecorded({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: [], statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [...u.statuses,
      { id: 'decrepify', sourceId: 'hero', stacks: 1, remaining: 3, appliedAtMs: 400,
        expiresAtMs: 3400, decrepify: paidDecrepify() }] })) });
  expect(paid.events.filter(enemyDamage)).toEqual(prior.events.filter(enemyDamage));
  expect(paid.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([]);
});
it('does not reduce a cursed actors healing output', () => {
  registerSkill({ id: 'fixture.heal', archetype: 'monster', minLevel: 1, target: 'self', manaCost: 0,
    cooldown: 100, effects: [{ kind: 'heal', target: 'self', amount: 100 }] });
  const input = fixture();
  const out = runBattleRecorded({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 90000,
    skillOrder: ['fixture.heal'] })) });
  expect(out.events.filter(e => e.kind === 'heal')).toEqual([
    expect.objectContaining({ target: 'target', amount: 100, simClockMs: 700 })
  ]);
  expect(out.result.enemyTeam[0]?.life).toBe(90100);
});
it('pays no MP or cooldown when no hostile is alive', () => {
  const input = fixture(), out = runBattleRecorded({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 0 })) });
  expect(out.result.winner).toBe('player');
  expect(out.events.filter(e => e.kind === 'action' || e.kind === 'mana' || e.kind === 'status')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(20);
  expect(out.result.playerTeam[0]?.cooldowns).toEqual(input.playerTeam[0]?.cooldowns);
});
