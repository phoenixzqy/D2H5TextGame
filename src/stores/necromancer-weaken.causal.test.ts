import { beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/necromancer.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { paidWeaken } from '@/engine/combat/weaken-definition';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
const id = 'skills-necromancer-weaken', canonical = 'necromancer.weaken';
function owner(rank = 1) {
  return { ...createMockPlayer('Synthetic native Weaken fixture', 'necromancer'), level: 30,
    skillLevels: { 'skills-necromancer-amplify-damage': 1, [id]: rank }, comboOrder: [id] };
}
/** Explicit unearned pools and fixed ordinary attack; native skill adapter and combat remain real. */
function fixture(rank = 1): CombatSnapshot {
  const native = playerToCombatUnit(owner(rank));
  const hero: CombatUnit = { ...native, id: 'hero', life: 100000, mana: rank === 20 ? 2 : 6,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1, appliedAtMs: 401 }],
    stats: { ...native.stats, life: 100000, lifeMax: 100000, mana: 100, manaMax: 100,
      attack: 0, attackSpeed: 263, defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0,
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
  it(`actual native paid Weaken rank${String(rank)} reduces live direct damage without changing cadence`, () => {
    const input = fixture(rank), before = structuredClone(input), out = runBattleRecorded(input);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'hero'))
      .toEqual([expect.objectContaining({ skillId: canonical, simClockMs: 400 })]);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
      .toEqual([expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })]);
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'target').map(e => e.simClockMs))
      .toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
    expect.soft(out.events.filter(enemyDamage).map(e => e.amount)).toEqual([67, 67, 0, 67, 67, 0, 100, 100, 100]);
    expect.soft(out.result.playerTeam[0]?.life).toBe(99432);
    const applied = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.statuses.some(s => s.id === 'weaken'));
    expect.soft(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'weaken') : undefined)
      .toMatchObject({ stacks: 1, appliedAtMs: 400, expiresAtMs: 3400, sourceId: 'hero', weaken: { damageReductionPct: 33 } });
    expect(out.result.enemyTeam[0]?.stats).toEqual(input.enemyTeam[0]?.stats);
    expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  });
  it(`uncursed matched native rank${String(rank)} control retains ordinary damage and cadence`, () => {
    const input = fixture(rank), out = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1 }] })) });
    expect(out.events.filter(e => e.kind === 'action' && e.actor === 'target').map(e => e.simClockMs))
      .toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
    expect(out.events.filter(enemyDamage).map(e => e.amount)).toEqual([100, 100, 0, 100, 100, 0, 100, 100, 100]);
    expect(out.result.playerTeam[0]?.life).toBe(99300);
    expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });
  it(`native rank${String(rank)} Weaken refuses insufficient MP and active cooldown without payment`, () => {
    const input = fixture(rank), cost = rank === 20 ? 2 : 6;
    for (const patch of [{ mana: cost - 1 }, { cooldowns: { [canonical]: 100000 } }]) {
      const out = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, ...patch })) });
      expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'weaken')).toEqual([]);
    }
  });
}
it('native ownership/level/prerequisite/rank guards exclude unavailable Weaken', () => {
  const original = owner();
  expect(rows.find(r => r.id === id)?.prerequisites).toEqual(['skills-necromancer-amplify-damage']);
  for (const patch of [{ class: 'barbarian' as const }, { level: 5 }, { skillLevels: {} }, { skillLevels: { [id]: 1 } },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { ...original.skillLevels, [id]: rank } }))])
    expect(playerToCombatUnit({ ...original, ...patch }).skillOrder).toEqual([]);
  expect(playerToCombatUnit(original).skillOrder).toEqual([id]);
});
it('pays no MP or cooldown without a living hostile', () => {
  const input = fixture(), out = runBattleRecorded({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 0 })) });
  expect(out.result.winner).toBe('player');
  expect(out.events.filter(e => e.kind === 'action' || e.kind === 'mana' || e.kind === 'status')).toEqual([]);
  expect(out.result.playerTeam[0]?.mana).toBe(6);
  expect(out.result.playerTeam[0]?.cooldowns).toEqual(input.playerTeam[0]?.cooldowns);
});
it.each(['trash', 'boss', 'chapter-boss'] as const)('affects every living %s hostile while excluding dead bodies and allies', tier => {
  const input = fixture(), target = input.enemyTeam[0], hero = input.playerTeam[0];
  if (!target || !hero) throw new Error('Missing native fixture bodies');
  const out = runBattleRecorded({ ...input,
    playerTeam: [hero, { ...hero, id: 'ally', kind: 'merc', skillOrder: [], statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }],
    enemyTeam: [{ ...target, tier }, { ...target, id: 'second', tier }, { ...target, id: 'dead', tier, life: 0 }] });
  expect(out.events.flatMap(e => e.kind === 'status' && e.statusId === 'weaken' ? [e.target] : []))
    .toEqual(['target', 'second']);
  for (const targetId of ['target', 'second']) {
    const applied = out.events.find(e => e.kind === 'status-state' && e.target === targetId && e.statuses.some(s => s.id === 'weaken'));
    expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'weaken') : undefined)
      .toMatchObject({ appliedAtMs: 400, expiresAtMs: 3400, weaken: paidWeaken() });
  }
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
});
it('a real paid refresh replaces source and interval without stacking or altering cadence', () => {
  const input = fixture(), out = runBattleRecorded({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
    statuses: [...u.statuses, { id: 'weaken', sourceId: 'previous', stacks: 1, remaining: 3,
      appliedAtMs: 0, expiresAtMs: 3000, weaken: paidWeaken() }] })) });
  expect(out.events.flatMap(e => e.kind === 'action' && e.actor === 'target' ? [e.simClockMs] : []))
    .toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
  expect(out.events.filter(enemyDamage).map(e => e.amount)).toEqual([67, 67, 0, 67, 67, 0, 100, 100, 100]);
  const refreshed = out.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 400);
  expect(refreshed?.kind === 'status-state' ? refreshed.statuses.filter(s => s.id === 'weaken') : undefined)
    .toEqual([expect.objectContaining({ sourceId: 'hero', appliedAtMs: 400, expiresAtMs: 3400, stacks: 1 })]);
});
it('curse payment/application adds no hit, damage or proc RNG draws', () => {
  const input = fixture(), paid = runBattleRecorded(input), prior = runBattleRecorded({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: [], statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] })),
    enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [...u.statuses,
      { id: 'weaken', sourceId: 'hero', stacks: 1, remaining: 3, appliedAtMs: 400, expiresAtMs: 3400, weaken: paidWeaken() }] })) });
  expect(paid.events.filter(enemyDamage)).toEqual(prior.events.filter(enemyDamage));
  expect(paid.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([]);
});
