import { describe, expect, it } from 'vitest';
import mercenarySkills from '../../data/skills/mercenary.json';
import {
  MERC_INNER_SIGHT_DEFINITION, MERC_INNER_SIGHT_SKILL, resolveMercInnerSight
} from './inner-sight';

describe('P08a07 authored Rogue Inner Sight boundary', () => {
  const id = 'mskill-inner-sight';
  const fixture = () => ({
    id, name: 'fixture.name', description: 'fixture.desc', trigger: 'active',
    target: 'all-enemies', cooldown: 5, minLevel: 1, maxLevel: 20, cost: { mana: 0 },
    appliesStatus: ['merc-inner-sight'], statusEffect: { defenseReductionPct: 25, durationMs: 8000 }
  });

  it('maps actual authored tuning into immutable definition and a nondamaging all-enemy skill', () => {
    const before = structuredClone(mercenarySkills);
    expect(MERC_INNER_SIGHT_DEFINITION).toEqual({
      statusId: 'merc-inner-sight', defenseReductionPct: 25, durationMs: 8000
    });
    expect(MERC_INNER_SIGHT_SKILL).toEqual({
      id, archetype: 'mercenary', target: 'all-enemies', cooldown: 5, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'debuff', statusId: 'merc-inner-sight', duration: 8, durationMs: 8000 }]
    });
    expect(resolveMercInnerSight(mercenarySkills)).toEqual({
      definition: MERC_INNER_SIGHT_DEFINITION, skill: MERC_INNER_SIGHT_SKILL
    });
    expect(mercenarySkills).toEqual(before);
    expect(mercenarySkills.find(row => row.id === id)).not.toHaveProperty('appliesTags');
  });

  it('copies each result without retaining or freezing caller data', () => {
    const row = fixture();
    const before = structuredClone(row);
    const first = resolveMercInnerSight([row]);
    const second = resolveMercInnerSight([row]);
    expect(first).toEqual(second);
    for (const value of [first, first.definition, first.skill, first.skill.effects, first.skill.effects[0]]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(first).not.toBe(second);
    expect(first.definition).not.toBe(second.definition);
    expect(first.skill).not.toBe(second.skill);
    expect(first.skill.effects).not.toBe(second.skill.effects);
    expect(first.skill.effects[0]).not.toBe(second.skill.effects[0]);
    expect(row).toEqual(before);
    for (const value of [row, row.cost, row.statusEffect, row.appliesStatus]) {
      expect(Object.isFrozen(value)).toBe(false);
    }
    row.statusEffect.durationMs = 1;
    row.statusEffect.defenseReductionPct = 99;
    row.cooldown = 99;
    row.appliesStatus[0] = 'freeze';
    expect(first.skill).toEqual(MERC_INNER_SIGHT_SKILL);
    expect(first.definition).toEqual(MERC_INNER_SIGHT_DEFINITION);
    expect(Reflect.set(first.definition, 'defenseReductionPct', 99)).toBe(false);
    expect(Reflect.set(first.skill, 'cooldown', 99)).toBe(false);
    expect(Reflect.set(first.skill.effects, '0', {})).toBe(false);
    expect(Reflect.set(first.skill.effects[0] ?? {}, 'durationMs', 1)).toBe(false);
  });

  it.each([0, 12.5, 100])('consumes authored potency %s and unrounded fractional duration', percent => {
    const row = { ...fixture(), cooldown: 9, minLevel: 6, cost: { mana: 7 },
      statusEffect: { defenseReductionPct: percent, durationMs: 0.5 } };
    const result = resolveMercInnerSight([row]);
    expect(result.definition).toEqual({ statusId: 'merc-inner-sight', defenseReductionPct: percent, durationMs: 0.5 });
    expect(result.skill).toMatchObject({ cooldown: 9, minLevel: 6, manaCost: 7,
      effects: [{ kind: 'debuff', statusId: 'merc-inner-sight', duration: 0.0005, durationMs: 0.5 }] });
  });

  it('selects exactly one exact identity and ignores unrelated unknown rows', () => {
    for (const rows of [[], [null, 42, {}], [{ ...fixture(), id: 'inner-sight' }], [fixture(), fixture()]]) {
      expect(() => resolveMercInnerSight(rows)).toThrow(/exactly one/);
    }
    expect(resolveMercInnerSight([null, 42, { id: 'amazon-inner-sight' }, fixture()]).skill)
      .toEqual(MERC_INNER_SIGHT_SKILL);
  });

  it.each([
    { statusEffect: undefined }, { statusEffect: {} },
    { statusEffect: { durationMs: 8000 } }, { statusEffect: { defenseReductionPct: 25 } },
    ...[-1, 100.1, NaN, Infinity, -Infinity, '25', null].map(defenseReductionPct => ({
      statusEffect: { defenseReductionPct, durationMs: 8000 }
    })),
    ...[0, -1, NaN, Infinity, -Infinity, '8000', null].map(durationMs => ({
      statusEffect: { defenseReductionPct: 25, durationMs }
    })),
    { trigger: 'passive' }, { target: 'self' }, { target: 'single-enemy' },
    { appliesStatus: [] }, { appliesStatus: ['inner-sight'] },
    { appliesStatus: ['merc-inner-sight', 'freeze'] }, { cost: {} }, { cost: undefined },
    { cost: { mana: -1 } }, { cooldown: 0 }, { cooldown: NaN }, { minLevel: 0 },
    { statusEffect: { defenseReductionPct: 25, durationMs: 8000, defenseReducitonPct: 90 } },
    { appliesTags: ['amp-damage'] }, { damage: { min: 1, max: 2 }, damageType: 'physical' }
  ])('rejects malformed or unsupported selected row %j', fields => {
    expect(() => resolveMercInnerSight([{ ...fixture(), ...fields }])).toThrow(/Inner Sight/);
  });
});
