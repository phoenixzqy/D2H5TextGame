import { describe, expect, it } from 'vitest';
import amazonSkills from '../../data/skills/amazon.json';
import { AMAZON_PASSIVE_DEFINITIONS, composeAmazonPassives,
  resolveAmazonPassiveDefinitions } from './amazon-passives';

const neutral = { critChanceBonus: 0, attackMultiplier: 1, physDodgeBonus: 0 };
describe('immutable authored Amazon passive definitions', () => {
  it('copies JSON unlocks, caps and coefficients without retaining mutable rows', () => {
    expect(AMAZON_PASSIVE_DEFINITIONS).toEqual({
      criticalStrike: { requiredLevel: 1, maxRank: 20, perRank: 0.01 },
      penetrate: { requiredLevel: 18, maxRank: 20, perRank: 0.03 },
      dodge: { requiredLevel: 6, maxRank: 20, perRank: 0.01 },
    });
    const original = structuredClone(amazonSkills);
    const copied = resolveAmazonPassiveDefinitions(original);
    expect(Object.isFrozen(copied)).toBe(true);
    for (const definition of Object.values(copied)) expect(Object.isFrozen(definition)).toBe(true);
    expect(original).toEqual(amazonSkills);
    expect(Object.isFrozen(original)).toBe(false);
    const index = original.findIndex(row => row.id === 'skills-amazon-critical-strike');
    original.splice(index, 1);
    expect(copied).toEqual(AMAZON_PASSIVE_DEFINITIONS);
    expect(() => resolveAmazonPassiveDefinitions(original)).toThrow(/exactly one/);
  });

  it('rejects duplicate exact identities and canonical aliases masquerading as definitions', () => {
    const row = amazonSkills.find(row => row.id === 'skills-amazon-dodge');
    if (!row) throw new Error('Missing authored Dodge');
    expect(() => resolveAmazonPassiveDefinitions([...amazonSkills, row])).toThrow(/exactly one/);
    expect(() => resolveAmazonPassiveDefinitions(amazonSkills.map(candidate => candidate === row
      ? { ...candidate, id: 'amazon.dodge' } : candidate))).toThrow(/exactly one/);
  });

  it('reads alternative valid tuning without hardcoded runtime unlocks or potency', () => {
    const rows = amazonSkills.map(row => row.id === 'skills-amazon-dodge'
      ? { ...row, requiredLevel: 9, maxLevel: 31,
          scaling: { passiveStatsPerLevel: { physDodgePct: 0.125 } } } : row);
    const definitions = resolveAmazonPassiveDefinitions(rows);
    expect(composeAmazonPassives({ classId: 'amazon', level: 8,
      skillLevels: { 'amazon.dodge': 2 } }, definitions)).toEqual(neutral);
    expect(composeAmazonPassives({ classId: 'amazon', level: 9,
      skillLevels: { 'amazon.dodge': 2 } }, definitions)).toEqual({ ...neutral, physDodgeBonus: 0.25 });
  });
});

describe('allocated and eligible Amazon passive composition', () => {
  it('takes the maximum exact alias once, caps each rank and combines distinct fields', () => {
    const skillLevels = { 'skills-amazon-critical-strike': 2, 'amazon.critical_strike': 20,
      'amazon.penetrate': 99, 'skills-amazon-penetrate': 1,
      'skills-amazon-dodge': 20, 'amazon.dodge': 1 };
    const before = structuredClone(skillLevels);
    expect(composeAmazonPassives({ classId: 'amazon', level: 30, skillLevels }))
      .toEqual({ critChanceBonus: 0.2, attackMultiplier: 1.6, physDodgeBonus: 0.2 });
    expect(skillLevels).toEqual(before);
    expect(composeAmazonPassives({ classId: 'amazon', level: 30 })).toEqual(neutral);
  });

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, true])('ignores malformed allocation %s', value => {
    const skillLevels = { 'amazon.dodge': value } as unknown as Record<string, number>;
    expect(composeAmazonPassives({ classId: 'amazon', level: 30, skillLevels })).toEqual(neutral);
    expect(composeAmazonPassives({ classId: 'amazon', level: 30,
      skillLevels: { ...skillLevels, 'skills-amazon-dodge': 1 } }))
      .toEqual({ ...neutral, physDodgeBonus: 0.01 });
  });

  it('uses each authored unlock independently', () => {
    const skillLevels = { 'amazon.critical_strike': 1, 'amazon.penetrate': 1, 'amazon.dodge': 1 };
    expect(composeAmazonPassives({ classId: 'amazon', level: 1, skillLevels }))
      .toEqual({ ...neutral, critChanceBonus: 0.01 });
    expect(composeAmazonPassives({ classId: 'amazon', level: 6, skillLevels }))
      .toEqual({ ...neutral, critChanceBonus: 0.01, physDodgeBonus: 0.01 });
    expect(composeAmazonPassives({ classId: 'amazon', level: 18, skillLevels }))
      .toEqual({ critChanceBonus: 0.01, attackMultiplier: 1.03, physDodgeBonus: 0.01 });
  });

  it.each(['sorceress', 'paladin', 'barbarian', 'necromancer', 'druid', 'assassin', ''])('does not grant passives to class %s', classId => {
    expect(composeAmazonPassives({ classId, level: 90,
      skillLevels: { 'amazon.critical_strike': 20, 'amazon.penetrate': 20, 'amazon.dodge': 20 } })).toEqual(neutral);
  });

  it.each([NaN, Infinity, -Infinity, 0])('suppresses passives at invalid/below-unlock level %s', level => {
    expect(composeAmazonPassives({ classId: 'amazon', level,
      skillLevels: { 'amazon.critical_strike': 20, 'amazon.penetrate': 20, 'amazon.dodge': 20 } })).toEqual(neutral);
  });
});
