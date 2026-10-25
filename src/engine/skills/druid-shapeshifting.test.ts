import { expect, it } from 'vitest';
import skills from '../../data/skills/druid.json';
import { createSkillValidator } from './skill-validator';
import {
  composeDruidShapeshifting,
  DRUID_SHAPE_DEFINITIONS,
  DRUID_SHAPE_IDS,
  resolveDruidShapeDefinitions,
  resolveDruidShapeRank
} from './druid-shapeshifting';

it('copies all three exact schema-validated definitions independently of mutable source rows', () => {
  const rows = structuredClone(skills),
    definitions = resolveDruidShapeDefinitions(rows);
  const row = rows.find((s) => s.id === 'skills-druid-lycanthropy');
  if (!row?.scaling.passiveStatsPerLevel) throw new Error('Missing authored Lycanthropy');
  row.scaling.passiveStatsPerLevel.lifePct = 1;
  expect(definitions.lycanthropy.perRank.lifePct).toBe(0.03);
  expect(Object.isFrozen(definitions.werebear.perRank)).toBe(true);
  expect(Object.isFrozen(definitions.werebear.prerequisites)).toBe(true);
  expect(() =>
    resolveDruidShapeDefinitions([...skills, skills.find((s) => s.id === 'skills-druid-werewolf')])
  ).toThrow();
  expect(() =>
    resolveDruidShapeDefinitions(skills.filter((s) => s.id !== 'skills-druid-werebear'))
  ).toThrow();
});

it.each(['werewolf', 'werebear', 'lycanthropy'] as const)(
  '%s rejects contradictory authored semantics and invalid tuning',
  (key) => {
    const row = skills.find((s) => s.id === DRUID_SHAPE_IDS[key][0]);
    if (!row) throw new Error('Missing authored shape');
    const validate = createSkillValidator();
    expect(validate(row)).toBe(true);
    const active = key !== 'lycanthropy';
    const patches = [
      { trigger: active ? 'passive' : 'active' },
      { target: 'all-allies' },
      { requiredLevel: undefined },
      { maxLevel: 0 },
      { timedBuff: { durationMs: 10000 } },
      { damage: { min: 1, max: 2 } },
      { scaling: { passiveStatsPerLevel: {} } },
      { scaling: { passiveStatsPerLevel: { lifePct: NaN } } },
      { prerequisites: ['skills-druid-werebear'] },
      ...(active
        ? [{ cooldown: 0 }, { cost: undefined }, { appliesStatus: ['stun'] }]
        : [{ cost: { mana: 0 } }, { appliesStatus: ['lycanthropy'] }])
    ];
    for (const patch of patches)
      expect.soft(validate({ ...row, ...patch }), JSON.stringify(patch)).toBe(false);
  }
);

it.each(['werewolf', 'werebear', 'lycanthropy'] as const)(
  '%s resolves exact MAX aliases and never sums, guesses or accepts fractions',
  (key) => {
    const [data, runtime] = DRUID_SHAPE_IDS[key];
    expect(resolveDruidShapeRank(key, { [data]: 1, [runtime]: 20 })).toBe(20);
    expect(resolveDruidShapeRank(key, { [runtime]: 99 })).toBe(20);
    for (const value of [0, -1, 0.5, NaN, Infinity])
      expect(resolveDruidShapeRank(key, { [data]: value })).toBe(0);
    expect(resolveDruidShapeRank(key, { ['other.' + key]: 20 })).toBe(0);
  }
);

it('governs actual class, integral level, unlock and bear prerequisite without leaking Lycanthropy into base stats', () => {
  const player = {
    class: 'druid',
    level: 30,
    skillLevels: { 'druid.werewolf': 20, 'druid.werebear': 20, 'druid.lycanthropy': 1 }
  };
  expect(composeDruidShapeshifting(player)).toEqual({ werewolf: 20, werebear: 20, lycanthropy: 1 });
  expect(composeDruidShapeshifting({ ...player, level: 5 })).toEqual({
    werewolf: 20,
    werebear: 0,
    lycanthropy: 1
  });
  expect(
    composeDruidShapeshifting({ ...player, skillLevels: { 'druid.werebear': 20 } }).werebear
  ).toBe(0);
  for (const patch of [
    { class: 'sorceress' },
    { level: 5.5 },
    { level: NaN },
    { level: Infinity }
  ]) {
    expect(composeDruidShapeshifting({ ...player, ...patch })).toEqual({
      werewolf: 0,
      werebear: 0,
      lycanthropy: 0
    });
  }
  expect(DRUID_SHAPE_DEFINITIONS.werebear.perRank).toEqual({
    lifePct: 0.025,
    attackSpeedPct: 0,
    physDodgePct: 0,
    defensePct: 0.02
  });
});
