import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/barbarian.json';
import { BARBARIAN_WARCRY_DEFINITIONS as definitions, BARBARIAN_WARCRY_IDENTITIES as ids,
  composeBarbarianWarcries, resolveBarbarianWarcryDefinitions, resolveBarbarianWarcryRank } from './barbarian-warcries';
const neutral = { lifeBonus: 0, defenseBonus: 0, manaRegenBonus: 0 };
const all = { 'barbarian.shout': 20, 'barbarian.battle_orders': 20 };
describe('copied strict authored warcry definitions', () => {
  it('preserves shipped unlock, cap, coefficients and copies/freeze without retaining rows', () => {
    const rows = structuredClone(skills), before = structuredClone(rows);
    const copy = resolveBarbarianWarcryDefinitions(rows);
    expect(copy.shout).toEqual({ requiredLevel: 6, maxRank: 20, perRank: { lifePct: 0, defensePct: 0.03, manaRegenPct: 0 } });
    expect(copy.orders).toEqual({ requiredLevel: 24, maxRank: 20, perRank: { lifePct: 0.04, defensePct: 0, manaRegenPct: 0.01 } });
    expect(rows).toEqual(before); expect(Object.isFrozen(rows)).toBe(false);
    expect(Object.isFrozen(copy)).toBe(true);
    for (const d of Object.values(copy)) { expect(Object.isFrozen(d)).toBe(true); expect(Object.isFrozen(d.perRank)).toBe(true); }
    rows.splice(0, rows.length); expect(copy).toEqual(definitions);
  });
  for (const key of ['shout', 'orders'] as const) {
    it('rejects missing, duplicate and malformed ' + key + ' definitions', () => {
      const id = ids[key][0], row = skills.find(r => r.id === id);
      if (!row) throw new Error('Missing authored warcry');
      expect(() => resolveBarbarianWarcryDefinitions(skills.filter(r => r.id !== id))).toThrow(/exactly one/);
      expect(() => resolveBarbarianWarcryDefinitions([...skills, row])).toThrow(/exactly one/);
      const patches = [ { target: 'all-allies' }, { trigger: 'active' }, { cooldown: 1 }, { requiredLevel: undefined },
        { cost: { mana: 1 } }, { damageType: 'physical' }, { appliesStatus: 'shout' }, { appliesTags: ['buff'] },
        { requires: {} }, { heal: { amount: 1 } }, { summonId: 'fixture' }, { synergies: {} },
        { scaling: { passiveStatsPerLevel: {} } },
        { scaling: { passiveStatsPerLevel: { lifePct: 0.04, defensePct: 0.03, manaRegenPct: 0.01 } } },
        { scaling: { passiveStatsPerLevel: key === 'shout' ? { defensePct: -1 } : { lifePct: 0.04, manaRegenPct: -1 } } } ];
      for (const patch of patches) expect(() => resolveBarbarianWarcryDefinitions(
        skills.map(r => r.id === id ? { ...r, ...patch } : r))).toThrow(/Invalid/);
    });
  }
  it('uses alternate legal tuning/unlock/cap without hardcoded coefficients', () => {
    const copy = resolveBarbarianWarcryDefinitions(skills.map(r => r.id === ids.orders[0]
      ? { ...r, requiredLevel: 9, maxLevel: 31, scaling: { passiveStatsPerLevel: { lifePct: 0.125, manaRegenPct: 0 } } } : r));
    expect(composeBarbarianWarcries({ classId: 'barbarian', level: 8, skillLevels: { [ids.orders[1]]: 99 } }, copy)).toEqual(neutral);
    expect(composeBarbarianWarcries({ classId: 'barbarian', level: 9, skillLevels: { [ids.orders[1]]: 99 } }, copy))
      .toEqual({ ...neutral, lifeBonus: 3.875 });
  });
});
describe('allocated exact aliases and hero eligibility', () => {
  it('takes MAX once, caps and ignores lookalike, granted and skill-order identities', () => {
    for (const key of ['shout', 'orders'] as const) {
      const [authored, canonical] = ids[key];
      expect(resolveBarbarianWarcryRank(key, { [authored]: 2, [canonical]: 99 })).toBe(20);
      expect(resolveBarbarianWarcryRank(key, { [authored]: 20, [canonical]: 2 })).toBe(20);
      expect(resolveBarbarianWarcryRank(key, { ['mskill-' + canonical]: 20, [canonical + '-extra']: 20 })).toBe(0);
    }
    const before = structuredClone(all);
    expect(composeBarbarianWarcries({ classId: 'barbarian', level: 30, skillLevels: all }))
      .toEqual({ lifeBonus: 0.8, defenseBonus: 0.6, manaRegenBonus: 0.2 });
    expect(all).toEqual(before);
    expect(composeBarbarianWarcries({ classId: 'barbarian', level: 30 })).toEqual(neutral);
  });
  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, true])('rejects malformed rank %s while accepting valid companion alias', value => {
    for (const key of ['shout', 'orders'] as const) {
      const [authored, canonical] = ids[key];
      const levels = { [authored]: value } as unknown as Record<string, number>;
      expect(resolveBarbarianWarcryRank(key, levels)).toBe(0);
      expect(resolveBarbarianWarcryRank(key, { ...levels, [canonical]: 1 })).toBe(1);
    }
  });
  it.each(['sorceress', 'amazon', 'paladin', 'necromancer', 'druid', 'assassin', ''])(
    'rejects foreign class %s', classId => {
      expect(composeBarbarianWarcries({ classId, level: 90, skillLevels: all })).toEqual(neutral);
    });
  it.each([NaN, Infinity, -Infinity, 5, 24.5])('rejects invalid/locked level %s', level => {
    expect(composeBarbarianWarcries({ classId: 'barbarian', level, skillLevels: all })).toEqual(neutral);
  });
  it('uses independent unlocks at ranks1/20', () => {
    for (const rank of [1, 20]) {
      const skillLevels = { [ids.shout[1]]: rank, [ids.orders[1]]: rank };
      expect(composeBarbarianWarcries({ classId: 'barbarian', level: 6, skillLevels }))
        .toEqual({ ...neutral, defenseBonus: 0.03 * rank });
      expect(composeBarbarianWarcries({ classId: 'barbarian', level: 24, skillLevels }))
        .toEqual({ defenseBonus: 0.03 * rank, lifeBonus: 0.04 * rank, manaRegenBonus: 0.01 * rank });
    }
  });
});
