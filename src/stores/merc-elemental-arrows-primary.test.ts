import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import * as rngModule from '@/engine/rng';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const realCreateRng = rngModule.createRng;
const hold = { id: 'stun', stacks: 1, sourceId: 'constructed-arrow-hold', remaining: -1 };
function fixture(element: 'fire' | 'cold', rank: number): CombatSnapshot {
  const def = loadMercPool().pool.find(row => row.id === `mercs/act1-rogue-${element}`);
  if (!def) throw new Error('Missing actual elemental Rogue');
  const native = mercToCombatUnit(createMercFromDef(def, 'elemental-primary'));
  // Imported survivors isolate native factory/registration/combat wiring; not earned play.
  const merc: CombatUnit = { ...native, life: 1000000, mana: 0,
    skillLevels: { ...native.skillLevels, [`mskill-${element}-arrow`]: rank },
    stats: { ...native.stats, life: 1000000, lifeMax: 1000000, attack: 10,
      mana: 0, manaMax: 0, attackSpeed: 263, critChance: 0 } };
  const target = (id: string, row: number, col: number): CombatUnit => ({
    ...merc, id, name: 'constructed target', side: 'enemy', kind: 'monster',
    skillOrder: [], skillLevels: {}, statuses: [hold], gridPosition: { row, col },
    stats: { ...merc.stats, defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } }
  });
  return { seed: element === 'fire' ? 7 : 3, playerTeam: [merc], enemyTeam: [
    target('primary', 1, 1), target('left', 1, 0), target('right', 1, 2),
    target('up', 0, 1), target('diagonal', 0, 0)
  ] };
}
function observe(input: CombatSnapshot) {
  const probabilities: number[] = [];
  const spy = vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const inner = realCreateRng(seed);
    return { ...inner, chance: probability => {
      probabilities.push(probability); return inner.chance(probability);
    } };
  });
  try { return { out: runBattleRecorded(input), probabilities }; }
  finally { spy.mockRestore(); }
}
function firstShot(input: CombatSnapshot) {
  const observed = observe(input), merc = input.playerTeam[0];
  if (!merc) throw new Error('Missing projected merc');
  const action = observed.out.events.find(event => event.kind === 'action' &&
    event.actor === merc.id && event.skillId === merc.skillOrder[0]);
  if (!action) throw new Error('Native elemental arrow never acts');
  const events = observed.out.events.filter(event => event.simClockMs === action.simClockMs);
  const damage = events.flatMap(event => event.kind === 'damage' && event.source === merc.id
    ? [{ target: event.target, type: event.damageType, amount: event.amount,
      crit: event.crit, dodged: event.dodged }] : []);
  return { ...observed, events, damage, at: action.simClockMs };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

it.each([1, 20])('actual Fire Rogue rank%i preserves full physical, adds half Fire and two adjacent splashes', rank => {
  const input = fixture('fire', rank), before = structuredClone(input), shot = firstShot(input);
  // Seed7: ordinary hit succeeds, first base22 + Attack10 =32. No crit.
  expect(shot.damage).toEqual([
    { target: 'primary', type: 'physical', amount: 32, crit: false, dodged: false },
    { target: 'primary', type: 'fire', amount: 16, crit: false, dodged: false },
    { target: 'left', type: 'fire', amount: 16, crit: false, dodged: false },
    { target: 'right', type: 'fire', amount: 16, crit: false, dodged: false }
  ]);
  for (const id of ['primary', 'left', 'right']) {
    const status = shot.events.flatMap(event => event.kind === 'status-state' && event.target === id
      ? event.statuses.filter(s => s.id === 'ignite') : []).at(-1);
    expect(status).toMatchObject({ sourceId: input.playerTeam[0]?.id, stacks: 1,
      dotPerStack: 1, appliedAtMs: shot.at, expiresAtMs: shot.at + 3000 });
  }
  expect(input).toEqual(before);
  expect(observe(input).out).toEqual(shot.out);
  expect(shot.out.result.playerTeam[0]?.mana).toBe(0);
});

it.each([1, 20])('actual Cold Rogue rank%i splits the budget and rolls exactly one30% Chill proc on the first shot', rank => {
  const input = fixture('cold', rank), before = structuredClone(input), shot = firstShot(input);
  // Seed3: ordinary hit succeeds, base22 + Attack10 =32; fourth draw .0749 procs Chill.
  expect(shot.damage).toEqual([
    { target: 'primary', type: 'physical', amount: 16, crit: false, dodged: false },
    { target: 'primary', type: 'cold', amount: 16, crit: false, dodged: false }
  ]);
  expect(shot.probabilities.slice(0, 4)).toEqual([0.85, 0, 0.30, 0.85]);
  const status = shot.events.flatMap(event => event.kind === 'status-state' && event.target === 'primary'
    ? event.statuses.filter(s => s.id === 'chill') : []).at(-1);
  expect(status).toMatchObject({ sourceId: input.playerTeam[0]?.id, stacks: 1,
    appliedAtMs: shot.at, expiresAtMs: shot.at + 2000 });
  expect(shot.events.filter(event => event.kind === 'status' && event.statusId === 'chill')).toHaveLength(1);
  expect(input).toEqual(before);
  expect(observe(input).out).toEqual(shot.out);
  expect(shot.out.result.playerTeam[0]?.mana).toBe(0);
});
