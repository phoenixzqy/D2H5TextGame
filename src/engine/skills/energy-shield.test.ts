import { expect, it } from 'vitest';
import skills from '../../data/skills/sorceress.json';
import type { CombatUnit } from '../combat/types';
import { ENERGY_SHIELD_DEFINITION, composeEnergyShield, divertEnergyShield,
  resolveEnergyShieldDefinition, resolveEnergyShieldRank } from './energy-shield';
import { createSkillValidator } from './skill-validator';

const row = skills.find(s => s.id === 'skills-sorceress-energy-shield');
if (!row) throw new Error('Missing authored Energy Shield');
const learned = { 'sorceress.telekinesis': 1, 'sorceress.teleport': 1, 'sorceress.energy_shield': 20 };
const hero: CombatUnit = { id: 'hero', name: 'hero', side: 'player', kind: 'hero', level: 30, tier: 'trash',
  energyShieldRank: 20, life: 100, mana: 100, statuses: [], skillOrder: [], cooldowns: {}, activeBuffIds: [], enraged: false,
  stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 1, defense: 0, magicResist: 0,
    attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };

it('captures frozen authored coefficients and prerequisite metadata without sharing source objects', () => {
  const rows = structuredClone(skills), d = resolveEnergyShieldDefinition(rows);
  const source = rows.find(s => s.id === row.id);
  if (!source?.scaling.passiveStatsPerLevel) throw new Error('Missing tuning');
  source.scaling.passiveStatsPerLevel.shieldAbsorbPct = .01;
  expect(d.absorbPerRank).toBe(.03); expect(d.manaRegenPerRank).toBe(.02);
  expect(d.requiredLevel).toBe(24); expect(d.maxRank).toBe(20);
  expect(d.prerequisites.map(p => p.ids[1])).toEqual(['sorceress.teleport', 'sorceress.telekinesis']);
  expect(Object.isFrozen(d)).toBe(true); expect(Object.isFrozen(d.prerequisites[0]?.ids)).toBe(true);
  expect(d).toEqual(ENERGY_SHIELD_DEFINITION);
});

it('rejects duplicate/missing rows, cycles, missing prerequisite metadata and contradictory passive tuning', () => {
  expect(() => resolveEnergyShieldDefinition([])).toThrow();
  expect(() => resolveEnergyShieldDefinition([...skills, row])).toThrow();
  expect(() => resolveEnergyShieldDefinition(skills.filter(s => s.id !== 'skills-sorceress-telekinesis'))).toThrow();
  const cyclic = skills.map(s => s.id === 'skills-sorceress-telekinesis' ? { ...s, prerequisites: [row.id] } : s);
  expect(() => resolveEnergyShieldDefinition(cyclic)).toThrow();
  const validate = createSkillValidator();
  for (const patch of [{ trigger: 'active' }, { target: 'all-allies' }, { cooldown: 1 },
    { requiredLevel: undefined }, { prerequisites: [] }, { cost: { mana: 1 } },
    { scaling: { passiveStatsPerLevel: { shieldAbsorbPct: .03 } } },
    { scaling: { passiveStatsPerLevel: { shieldAbsorbPct: .03, manaRegenPct: .02, lifePct: 1 } } },
    ...[-1, Infinity, NaN, '0.03'].map(shieldAbsorbPct => ({ scaling: { passiveStatsPerLevel: { shieldAbsorbPct, manaRegenPct: .02 } } }))]) {
    expect(validate({ ...row, ...patch })).toBe(false);
    expect(() => resolveEnergyShieldDefinition(skills.map(s => s.id === row.id ? { ...s, ...patch } : s))).toThrow();
  }
  expect(() => resolveEnergyShieldDefinition(skills.map(s => s.id === row.id ?
    { ...s, scaling: { passiveStatsPerLevel: { shieldAbsorbPct: .06, manaRegenPct: .02 } } } : s))).toThrow();
});

it('uses MAX exact aliases once with integral allocation and the complete native prerequisite chain', () => {
  expect(resolveEnergyShieldRank({ ...learned, 'skills-sorceress-energy-shield': 1 })).toBe(20);
  expect(resolveEnergyShieldRank({ 'skills-sorceress-energy-shield': 99 })).toBe(20);
  expect(resolveEnergyShieldRank({ 'sorceress.energy_shield': NaN, 'skills-sorceress-energy-shield': 2 })).toBe(2);
  expect(resolveEnergyShieldRank({ energy_shield: 20, 'sorceress.energy_shield': 1.5 })).toBe(0);
  expect(composeEnergyShield({ class: 'sorceress', level: 24, skillLevels: learned })).toEqual({ rank: 20, manaRegenBonus: .4 });
  for (const fields of [{ class: 'barbarian' as const }, { level: 23 }, { level: 24.5 }, { level: Infinity },
    { skillLevels: { 'sorceress.energy_shield': 20, 'sorceress.teleport': 1 } },
    { skillLevels: { ...learned, 'sorceress.teleport': 0 } }]) {
    expect(composeEnergyShield({ class: 'sorceress', level: 30, skillLevels: learned, ...fields }).rank).toBe(0);
  }
});

it.each([{ rank: 1, damage: 100, prevented: 3 }, { rank: 20, damage: 100, prevented: 60 },
  { rank: 19, damage: 100, prevented: 57 }, { rank: 20, damage: 5, prevented: 3 },
  { rank: 1, damage: 33, prevented: 0 }, { rank: 1, damage: 34, prevented: 1 }])(
  'floors exact decimal products at rank $rank for $damage damage', ({ rank, damage, prevented }) => {
    const result = divertEnergyShield({ ...hero, energyShieldRank: rank }, damage);
    expect(result.damage).toBe(damage - prevented); expect(result.manaSpent).toBe(prevented);
    expect(result.unit.mana).toBe(100 - prevented); expect(hero.mana).toBe(100);
  });

it('keeps cumulative periodic rounding across partitions and discards unfunded quota instead of creating debt', () => {
  let current = hero, prior = 0, spent = 0;
  for (const amount of [1, 2, 1, 3, 1, 2]) {
    const next = divertEnergyShield(current, amount, prior);
    spent += next.manaSpent; current = next.unit; prior += amount;
  }
  expect(spent).toBe(6); expect(divertEnergyShield(hero, 10).manaSpent).toBe(6);
  const empty = divertEnergyShield({ ...hero, mana: 0 }, 100, 0);
  expect(empty.manaSpent).toBe(0);
  expect(divertEnergyShield({ ...empty.unit, mana: 100 }, 1, 100).manaSpent).toBe(0);
  expect(divertEnergyShield({ ...hero, mana: 10.75, manaRegenExactCarry: '0.4' }, 100))
    .toMatchObject({ damage: 90, manaSpent: 10, unit: { mana: .75, manaRegenExactCarry: '0.4' } });
});

it('rejects inherited enemy/summon power, invalid ranks/resources and unsupported owner metadata', () => {
  for (const patch of [{ side: 'enemy' as const }, { kind: 'merc' as const }, { summon: true },
    { ownerId: 'other' }, { summonOwnerId: 'other' }, { level: 23 }, { level: 24.5 }, { life: 0 },
    { energyShieldRank: 0 }, { energyShieldRank: 21 }, { energyShieldRank: 1.5 },
    { energyShieldRank: NaN }, { mana: Infinity }, { mana: -1 }, { mana: .9 }]) {
    const input = { ...hero, ...patch };
    expect(divertEnergyShield(input, 100)).toEqual({ unit: input, damage: 100, manaSpent: 0 });
  }
});
