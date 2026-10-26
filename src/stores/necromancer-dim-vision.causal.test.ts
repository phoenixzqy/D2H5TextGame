import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';

const ID = 'skills-necromancer-dim-vision', CANONICAL = 'necromancer.dim_vision';
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
function owner(rank = 1) {
  return { ...createMockPlayer('Synthetic native Dim Vision', 'necromancer'), level: 30,
    skillLevels: { [ID]: rank }, comboOrder: [ID] };
}
/** Unearned pools isolate one actual native paid curse and nine ordinary hostile attacks. */
function fixture(rank = 1): CombatSnapshot {
  const native = playerToCombatUnit(owner(rank));
  const hero: CombatUnit = { ...native, id: 'hero', life: 100000, mana: rank === 20 ? 5 : 9,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1, appliedAtMs: 401 }],
    stats: { ...native.stats, life: 100000, lifeMax: 100000, mana: 100, manaMax: 100,
      attack: 0, attackSpeed: 263, defense: 0, magicResist: 0, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const target: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', mana: 0,
    skillOrder: [], skillLevels: {}, activeBuffIds: [],
    statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1, appliedAtMs: 4501 }],
    stats: { ...hero.stats, attackSpeed: 250, attack: 100 } };
  return { seed: 1, playerTeam: [hero], enemyTeam: [target] };
}
function enemyDamage(e: RecordedBattleEvent): e is Extract<RecordedBattleEvent, { kind: 'damage' }> {
  return e.kind === 'damage' && e.source === 'target';
}
it.each([1, 20])('native paid rank%i Dim Vision actually prevents otherwise successful Physical hits', rank => {
  const input = fixture(rank), before = structuredClone(input), paid = runBattleRecorded(input);
  const control = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    statuses: [{ id: 'stun', sourceId: 'fixture-hold', stacks: 1, remaining: -1 }] })) });
  expect(paid.events.filter(e => e.kind === 'action' && e.actor === 'hero'))
    .toEqual([expect.objectContaining({ skillId: CANONICAL, simClockMs: 400 })]);
  expect(paid.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 400 })]);
  expect(paid.events.filter(e => e.kind === 'status' && e.statusId === 'dim-vision'))
    .toEqual([expect.objectContaining({ target: 'target', simClockMs: 400 })]);
  expect(control.events.filter(enemyDamage).map(e => e.amount)).toEqual([100, 100, 0, 100, 100, 0, 100, 100, 100]);
  const cadence = (out: typeof paid) => out.events.flatMap(e => e.kind === 'action' && e.actor === 'target' ? [e.simClockMs] : []);
  expect(cadence(paid)).toEqual([500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500]);
  expect(cadence(paid)).toEqual(cadence(control));
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(paid.result);
  expect(runBattleRecorded(input)).toEqual(paid);
  expect.soft(paid.events.filter(enemyDamage).reduce((sum, e) => sum + e.amount, 0)).toBeLessThan(700);
  expect.soft(paid.result.playerTeam[0]?.life).toBeGreaterThan(99300);
});
it('refuses unavailable native ownership, level and allocation', () => {
  const native = owner();
  expect(playerToCombatUnit(native).skillOrder).toEqual([ID]);
  for (const patch of [{ class: 'barbarian' as const }, { level: 5 }, { skillLevels: {} },
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ skillLevels: { [ID]: rank } }))])
    expect(playerToCombatUnit({ ...native, ...patch }).skillOrder).toEqual([]);
});
it('insufficient MP never pays or applies Dim Vision', () => {
  const input = fixture(), out = runBattleRecorded({ ...input,
    playerTeam: input.playerTeam.map(u => ({ ...u, mana: 8 })) });
  expect(out.events.some(e => e.kind === 'action' && e.skillId === CANONICAL)).toBe(false);
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(out.events.filter(e => e.kind === 'status' && e.statusId === 'dim-vision')).toEqual([]);
});
