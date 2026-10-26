import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';
import { activeLeap, composeLeapRank, copyLeapStatuses, paidLeap, resolveLeapDefinition, LEAP_DEFINITION } from './leap';
import type { ActiveStatus, CombatUnit } from '../combat/types';
import { rebaseStatusClock } from '../combat/status';
import barbarian from '../../data/skills/barbarian.json';

const row = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-leap');
if (!row) throw new Error('Missing authored Leap');
const validate = createSkillValidator();

it('authors paid all-enemy Stun and preserves the physical follow-up coefficient', () => {
  expect(row).toMatchObject({ trigger: 'active', target: 'all-enemies', requiredLevel: 6,
    maxLevel: 20, cooldown: 3, cost: { mana: 8 }, appliesStatus: ['leap', 'stun'],
    timedBuff: { durationMs: 3000 }, scaling: { cooldownPerLevel: -.05, costPerLevel: -.1,
      passiveStatsPerLevel: { physicalDamagePct: .01 } } });
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(registeredSkillFromJson(row)).toMatchObject({ id: 'barbarian.leap', isBuff: true,
    effects: [{ kind: 'buff', id: 'leap', timedStatBuff: 'leap', duration: 3 },
      { kind: 'debuff', statusId: 'stun' }] });
});
it.each([
  { appliesStatus: undefined }, { appliesStatus: ['knockback'] }, { appliesStatus: ['stun'] },
  { trigger: 'passive' }, { target: 'self' }, { requiredLevel: 1 }, { maxLevel: 21 },
  { timedBuff: undefined }, { timedBuff: { durationMs: 0 } }, { timedBuff: { durationMs: Infinity } },
  { damage: { min: 1, max: 2 } }, { aoeShape: 'cross' }, { statusEffect: { chance: .5 } },
  { scaling: { passiveStatsPerLevel: { physicalDamagePct: .01, fireDamagePct: .01 } } },
  { scaling: { passiveStatsPerLevel: { physicalDamagePct: -1 } } },
])('rejects contradictory Leap metadata %j', patch => {
  expect(validate({ ...row, ...patch })).toBe(false);
});
it.each([0, 1, 2, 19, 20])('previews actual control, finite physical bonus and costs at rank%i', rank => {
  const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
  for (const stats of [model.current, model.next].filter(s => s !== undefined)) {
    expect(stats).toMatchObject({ control: { durationSeconds: 1, bossDurationSeconds: .5 },
      leap: { durationSeconds: 3 }, manaCost: Math.round(8 - .1 * (stats.rank - 1)),
      // Existing combat and display both round cooldown seconds to one decimal.
      cooldown: Number((3 - .05 * (stats.rank - 1)).toFixed(1)) });
    expect(stats.damage).toEqual([]);
    expect(stats.utility).toEqual([expect.objectContaining({ id: 'physicalDamagePct', value: .01 * stats.rank })]);
  }
  if (rank === 0) expect(model.current).toBeUndefined();
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(row).toEqual(before);
});

const paid: ActiveStatus = { id: 'leap', sourceId: 'hero', stacks: 1, remaining: 3,
  appliedAtMs: .1, expiresAtMs: 3000.1, leap: paidLeap(20) };
const unit: CombatUnit = { id: 'hero', name: 'hero', side: 'player', kind: 'hero', level: 30,
  tier: 'trash', life: 100, mana: 0, statuses: [paid], skillOrder: [], cooldowns: {}, activeBuffIds: [], enraged: false,
  stats: { life: 100, lifeMax: 100, mana: 0, manaMax: 100, attack: 100, defense: 0, magicResist: 0,
    attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
it('copies immutable source tuning and rejects missing, duplicate or malformed rows', () => {
  const input = structuredClone(barbarian), definition = resolveLeapDefinition(input);
  expect(definition).toMatchObject({ requiredLevel: 6, maxRank: 20, physicalDamagePerRank: .01,
    durationMs: 3000, manaCost: 8, cooldown: 3, costPerRank: -.1, cooldownPerRank: -.05 });
  input.splice(0); expect(definition).toEqual(LEAP_DEFINITION); expect(Object.isFrozen(definition)).toBe(true);
  for (const rows of [[], [...barbarian, row], [{ ...row, timedBuff: { durationMs: 0 } }]])
    expect(() => resolveLeapDefinition(rows)).toThrow(/Invalid/);
});
it('projects exact legal class/level/aliases and refuses malformed or excessive allocation', () => {
  const owner = { class: 'barbarian' as const, level: 30, skillLevels: { 'barbarian.leap': 20 } };
  expect(composeLeapRank(owner)).toBe(20);
  expect(composeLeapRank({ ...owner, skillLevels: { ...owner.skillLevels, 'skills-barbarian-leap': 1 } })).toBe(20);
  for (const classId of ['sorceress', 'assassin'] as const) expect(composeLeapRank({ ...owner, class: classId })).toBe(0);
  expect(composeLeapRank({ ...owner, level: 5 })).toBe(0);
  for (const rank of [0, -1, 1.5, 21, NaN, Infinity])
    expect(composeLeapRank({ ...owner, skillLevels: { 'skills-barbarian-leap': rank } })).toBe(0);
});
it('retains copied paid potency across fractional rebase/respec with exact finite boundaries', () => {
  const input = structuredClone(unit), copy = copyLeapStatuses(input);
  expect(copy).toEqual(input); expect(copy.statuses[0]?.leap).not.toBe(input.statuses[0]?.leap);
  expect(Object.isFrozen(copy.statuses[0]?.leap)).toBe(true);
  expect(activeLeap(copy, .099)).toBeUndefined(); expect(activeLeap(copy, .1)).toEqual(paidLeap(20));
  expect(activeLeap(copy, 3000.1)).toBeUndefined();
  expect(activeLeap({ ...rebaseStatusClock(copy, 1700 / 3), leapRank: 0 }, 0)).toEqual(paidLeap(20));
  expect(activeLeap({ ...copy, statuses: [paid, paid] }, 100)).toEqual(paidLeap(20));
  expect(input).toEqual(unit);
});
it('strips malformed/foreign/extended paid payloads and rejects dead/nonpersonal/future power', () => {
  for (const payload of [null, [], '20', {}, { ...paid.leap, extra: 1 }, { ...paid.leap, rank: 21 },
    { ...paid.leap, physicalDamagePct: .9 }]) {
    const input = { ...unit, statuses: [{ ...paid, leap: payload as NonNullable<ActiveStatus['leap']> }] };
    expect(copyLeapStatuses(input).statuses[0]?.leap).toBeUndefined(); expect(activeLeap(input, 100)).toBeUndefined();
  }
  for (const patch of [{ sourceId: 'other' }, { id: 'other' }, { appliedAtMs: NaN }, { expiresAtMs: 4000.1 }])
    expect(activeLeap({ ...unit, statuses: [{ ...paid, ...patch }] }, 100)).toBeUndefined();
  for (const patch of [{ kind: 'merc' as const }, { side: 'enemy' as const }, { summon: true },
    { ownerId: 'other' }, { summonOwnerId: 'other' }, { life: 0 }, { level: 5 }])
    expect(activeLeap({ ...unit, ...patch }, 100)).toBeUndefined();
  expect(activeLeap(unit, NaN)).toBeUndefined(); expect(() => paidLeap(21)).toThrow(/Invalid/);
});
it('retains paid21 through copy/rebase without a live Command or learned allocation', () => {
  const captured = { ...paid, leap: paidLeap(21, 1) };
  const input = { ...unit, leapRank: 0, statuses: [captured] }, before = structuredClone(input);
  const copied = copyLeapStatuses(input), carried = rebaseStatusClock(copied, 1000.25);
  expect(activeLeap(carried, 0)).toEqual({ rank: 21, rankBonus: 1, physicalDamagePct: .21 });
  expect(activeLeap(carried, 1999.85)).toBeUndefined();
  expect(input).toEqual(before);
  expect(() => paidLeap(21)).toThrow(); expect(() => paidLeap(22, 1)).toThrow();
});
