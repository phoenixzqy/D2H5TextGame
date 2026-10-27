import { afterEach, beforeEach, expect, it } from 'vitest';
import type { DamageType } from '../types/attributes';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { paidAmazonInnerSight } from './amazon-inner-sight-definition';
import { paidBattleCry } from './warcry-definition';
import { applyStatus, rebaseStatusClock } from './status';
import { createRng } from '../rng';
import { runBattle, runBattleRecorded } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const marker = (id: string, appliedAtMs = 0, expiresAtMs?: number): ActiveStatus => ({ id,
  sourceId: 'absent-source', stacks: 1, remaining: -1, appliedAtMs,
  ...(expiresAtMs === undefined ? {} : { expiresAtMs }) });
const paid = (): ActiveStatus => ({ ...marker('inner-sight', 0, 8000), remaining: 8, innerSight: paidAmazonInnerSight() });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash', life: 100, mana: 0,
    stats: { life: 100, lifeMax: 100, mana: 0, manaMax: 0, attack: 100, defense: 50, magicResist: 20,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [marker('stun')], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function direct(type: DamageType = 'physical', statuses: readonly ActiveStatus[] = [paid()], defense = 50,
  seed = 7, ignoresDefense = false) {
  registerSkill({ id: 'fixture.amazon-inner-sight-hit', archetype: 'fixture', target: 'single-enemy', cooldown: 100,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: type, base: [100, 100], ...(ignoresDefense ? { ignoresDefense: true as const } : {}) }] });
  const hero = { ...unit('hero', 'player'), skillOrder: ['fixture.amazon-inner-sight-hit'],
    statuses: [marker('stun', 1701), { ...marker('poison'), dotPerStack: 50, damageType: 'poison' as const }] };
  const enemy = { ...unit('enemy', 'enemy'), life: 1000, statuses: [marker('stun'), ...statuses],
    stats: { ...unit('enemy', 'enemy').stats, life: 1000, lifeMax: 1000, defense } };
  const input = { seed, playerTeam: [hero], enemyTeam: [enemy] }, before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattle(input)).toEqual(out.result); expect(runBattleRecorded(input)).toEqual(out);
  expect(out.result.enemyTeam[0]?.stats).toEqual(enemy.stats);
  return out;
}
function amount(out: ReturnType<typeof direct>) {
  return out.events.find(e => e.kind === 'damage' && e.source === 'hero');
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
it.each(['physical', 'fire', 'poison', 'thorns'] as const)('reduces actual ordinary Defense for %s without changing stored stats', type => {
  expect(amount(direct(type))).toMatchObject({ amount: 62, damageType: type, simClockMs: 1700 });
  expect(amount(direct(type, []))).toMatchObject({ amount: 50, damageType: type, simClockMs: 1700 });
});
it.each(['cold', 'lightning', 'arcane'] as const)('keeps the existing %s Magic Resist pipeline', type => {
  expect(amount(direct(type))).toMatchObject({ amount: 80 });
  expect(amount(direct(type, []))).toMatchObject({ amount: 80 });
});
it('combines Amazon and Rogue Inner Sight by maximum once, without rewriting either status', () => {
  const merc = marker('merc-inner-sight');
  expect(amount(direct('physical', [merc]))).toMatchObject({ amount: 62 });
  for (const statuses of [[paid(), merc], [merc, paid()], [paid(), paid(), merc, merc]]) {
    const out = direct('physical', statuses);
    expect(amount(out)).toMatchObject({ amount: 62 });
    // The test ends at2000ms; active paid and legacy Rogue records retain their original identities.
    expect(out.result.enemyTeam[0]?.statuses.filter(s => s.id !== 'stun')).toEqual(statuses);
  }
});
it.each([[21, 84], [0, 100], [200, 1]] as const)('preserves fractional Defense/minimum damage at Defense%s', (defense, expected) => {
  expect(amount(direct('physical', [paid()], defense))).toMatchObject({ amount: expected });
});
it('preserves explicit Defense bypass and the natural seed4 miss', () => {
  expect(amount(direct('physical', [paid()], 50, 7, true))).toMatchObject({ amount: 100 });
  expect(amount(direct('physical', [paid()], 50, 4))).toEqual(amount(direct('physical', [], 50, 4)));
  expect(amount(direct('physical', [paid()], 50, 4))).toMatchObject({ amount: 0, dodged: true });
});
it.each([
  { label: 'exact onset', status: { ...paid(), appliedAtMs: 1700, expiresAtMs: 9700 }, expected: 62 },
  { label: 'exact expiry', status: { ...paid(), appliedAtMs: -6300, expiresAtMs: 1700 }, expected: 50 },
  { label: 'future', status: { ...paid(), appliedAtMs: 1700.125, expiresAtMs: 9700.125 }, expected: 50 },
  { label: 'bare legacy Amazon', status: marker('inner-sight'), expected: 50 },
  { label: 'forged potency', status: { ...paid(), innerSight: { defenseReductionPct: 90 } }, expected: 50 }
])('honors $label in the shared pre-hit path', ({ status, expected }) => {
  expect(amount(direct('physical', [status]))).toMatchObject({ amount: expected });
});
it('refresh replaces the paid source and interval without stacking and rebases ordinary clocks', () => {
  const target = { ...unit('target', 'enemy'), statuses: [paid(), marker('merc-inner-sight')] }, before = structuredClone(target);
  const next = applyStatus(target, { id: 'inner-sight', sourceId: 'second', simClockMs: 4000, durationMs: 8000,
    innerSight: paidAmazonInnerSight() }, createRng(7));
  expect(next.statuses.filter(s => s.id === 'inner-sight')).toEqual([{ id: 'inner-sight', sourceId: 'second', stacks: 1,
    remaining: 8, appliedAtMs: 4000, expiresAtMs: 12000, innerSight: { defenseReductionPct: 25 } }]);
  expect(next.statuses.find(s => s.id === 'merc-inner-sight')).toEqual(target.statuses[1]);
  const carried = rebaseStatusClock(next, 5000);
  expect(carried.statuses.find(s => s.id === 'inner-sight')).toMatchObject({ appliedAtMs: -1000, expiresAtMs: 7000 });
  expect(target).toEqual(before);
});
it('leaves existing periodic rates unchanged', () => {
  const poison = { ...marker('poison', 0, 2000), dotPerStack: 3, damageType: 'poison' as const };
  const out = direct('physical', [paid(), poison]), control = direct('physical', [poison]);
  expect(out.events.filter(e => e.kind === 'dot')).toEqual(control.events.filter(e => e.kind === 'dot'));
  expect(out.events.reduce((sum, e) => sum + (e.kind === 'dot' && e.target === 'enemy' ? e.amount : 0), 0)).toBe(6);
});
it('rejects a forged permanent Amazon packet', () => {
  const status = { ...paid() }; delete status.expiresAtMs;
  expect(amount(direct('physical', [status]))).toMatchObject({ amount: 50 });
});
it('multiplies independent Armor Melt and Battle Cry after combining Inner Sight once', () => {
  const cry: ActiveStatus = { ...marker('battle-cry', 1000, 2000), remaining: 1, battleCry: paidBattleCry(1) };
  const melt = marker('armor-melt', 0, 3000), merc = marker('merc-inner-sight');
  //Existing Melt Physical combo raises raw100 to125. Defense50*.7*.75*.5=13.125; final111.
  for (const statuses of [[paid(), melt, cry], [paid(), merc, melt, cry], [merc, melt, cry]])
    expect(amount(direct('physical', statuses))).toMatchObject({ amount: 111 });
  expect(amount(direct('physical', [melt, cry]))).toMatchObject({ amount: 107 });
});
