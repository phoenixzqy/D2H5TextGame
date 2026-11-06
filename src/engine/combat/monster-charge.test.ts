import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { resolveMonsterPhysicalSkills } from '../skills/monster-physical';
import { createSkillValidator } from '../skills/skill-validator';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

function snapshot(attack: number, defense = 0, resistance = 0, dodge = 0): CombatSnapshot {
  const enemy: CombatUnit = { id: 'enemy', name: 'enemy', side: 'enemy', kind: 'monster', tier: 'boss',
    level: 32, life: 100000, mana: 0, stats: { life: 100000, lifeMax: 100000,
      mana: 0, manaMax: 0, attack, defense: 0, magicResist: 0, attackSpeed: 100,
      critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    attackRange: [attack, attack], statuses: [], cooldowns: {}, activeBuffIds: [],
    enraged: false, skillOrder: ['monster-charge'] };
  const hero: CombatUnit = { ...enemy, id: 'hero', side: 'player', kind: 'hero', skillOrder: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...enemy.stats, attack: 0, defense, physDodge: dodge,
      resistances: { ...enemy.stats.resistances, physical: resistance } } };
  return { seed: 13, maxRounds: 3, playerTeam: [hero], enemyTeam: [enemy] };
}
function first(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  const hit = out.events.find(event => event.kind === 'damage' && event.source === 'enemy');
  if (hit?.kind !== 'damage') throw new Error('Missing native Charge');
  expect(out.events.find(event => event.kind === 'action' && event.actor === 'enemy'))
    .toMatchObject({ skillId: 'monster.charge' });
  return { hit, out };
}

it('adds current Attack before mitigation and preserves the action and hit sequence', () => {
  const base = first(snapshot(0)), scaled = first(snapshot(220));
  expect(base.hit.amount).toBeGreaterThanOrEqual(60);
  expect(base.hit.amount).toBeLessThanOrEqual(90);
  expect(scaled.hit.amount).toBe(base.hit.amount + 220);
  expect(first(snapshot(220, 30, 50)).hit.amount).toBe(Math.floor((base.hit.amount + 220) * .5 - 30));
  expect(first(snapshot(220, 1000)).hit.amount).toBe(1);
  expect(first(snapshot(220, 0, 0, 1)).hit).toMatchObject({ amount: 0, dodged: true });
  expect(scaled.out.events.flatMap(event => event.kind === 'action' && event.actor === 'enemy'
    ? [event.skillId] : []).slice(0, 3)).toEqual(['monster.charge', null, null]);
  const sequence = (out: typeof base.out) => out.events
    .filter(event => event.kind === 'action' || event.kind === 'damage')
    .map(event => event.kind === 'damage' ? { ...event, amount: 0 } : event);
  expect(sequence(scaled.out)).toEqual(sequence(base.out));
});

it('authors and projects Charge scaling, including permitted zero and fractional tuning', () => {
  expect(rows.find(row => row.id === 'monster-charge')).toMatchObject({ attackDamagePct: 100 });
  expect(getSkill('monster-charge')?.effects[0]).toMatchObject({ attackDamagePct: 100 });
  for (const coefficient of [0, 25.5, 200]) {
    const tuned = rows.map(row => row.id === 'monster-charge' ? { ...row, attackDamagePct: coefficient } : row);
    expect(resolveMonsterPhysicalSkills(tuned)[0]?.effects[0]).toMatchObject({ attackDamagePct: coefficient });
  }
});

it.each([undefined, -1, NaN, Infinity, '100', null])('rejects invalid Charge Attack coefficient %s', value => {
  const charge = rows.find(row => row.id === 'monster-charge');
  if (!charge) throw new Error('Missing Charge row');
  const changed: Record<string, unknown> = { ...charge, attackDamagePct: value };
  if (value === undefined) delete changed.attackDamagePct;
  expect(createSkillValidator()(changed)).toBe(false);
  expect(() => resolveMonsterPhysicalSkills(rows.map(row => row.id === 'monster-charge' ? changed : row))).toThrow();
});
