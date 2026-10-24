import { expect, it } from 'vitest';
import skills from '../../data/skills/assassin.json';
import {
  composeAssassinShadowPassives as compose,
  composeAssassinVenom,
  resolveAssassinShadowDefinitions as resolve,
  copyAssassinVenomProjection as copy,
  ASSASSIN_SHADOW_DEFINITIONS as definitions
} from './assassin-shadow';
const owner = { id: 'actual-source', class: 'assassin' as const, level: 30 };
const neutral = {
  fadeRank: 0,
  venomRank: 0,
  resistAllBonus: 0,
  magicDodgeBonus: 0,
  poisonDamagePct: 0
};
it('copies strict immutable JSON tuning without retaining mutable rows', () => {
  const rows = structuredClone(skills),
    before = structuredClone(rows),
    d = resolve(rows);
  expect(rows).toEqual(before);
  expect(d.fade).toMatchObject({
    requiredLevel: 18,
    maxRank: 20,
    resistPerRank: 0.02,
    magicDodgePerRank: 0.005
  });
  expect(d.venom).toMatchObject({
    requiredLevel: 30,
    maxRank: 20,
    poisonPerRank: 0.03,
    coatingAttackPct: 0.05,
    coatingDurationMs: 5000
  });
  expect(Object.isFrozen(d)).toBe(true);
  expect(Object.isFrozen(d.venom)).toBe(true);
  rows.splice(0);
  expect(d).toEqual(definitions);
});
it.each([1, 20, 99])(
  'resolves allocated rank %s maximum once across aliases and caps',
  (allocated) => {
    const rank = Math.min(20, allocated),
      skillLevels = {
        'assassin.fade': allocated,
        'skills-assassin-fade': 1,
        'assassin.venom': 1,
        'skills-assassin-venom': allocated
      };
    expect(compose({ ...owner, skillLevels })).toEqual({
      fadeRank: rank,
      venomRank: rank,
      resistAllBonus: rank * 2,
      magicDodgeBonus: rank * 0.005,
      poisonDamagePct: rank * 0.03
    });
    expect(composeAssassinVenom({ ...owner, skillLevels })).toEqual({
      sourceHeroId: owner.id,
      rank
    });
  }
);
it.each([0, -1, 1.5, NaN, Infinity, null, true, '20'])(
  'ignores malformed allocation %s without implicit ranks',
  (value) => {
    const skillLevels = { 'assassin.fade': value, 'assassin.venom': value } as unknown as Record<
      string,
      number
    >;
    expect(compose({ ...owner, skillLevels })).toEqual(neutral);
    expect(composeAssassinVenom({ ...owner, skillLevels })).toBeUndefined();
  }
);
it('guards class and separate unlocks while keeping prerequisites at the learning boundary', () => {
  const learned = { ...owner, skillLevels: { 'assassin.fade': 1, 'assassin.venom': 1 } };
  expect(compose({ ...learned, class: 'barbarian' })).toEqual(neutral);
  for (const level of [0, NaN, Infinity, 17])
    expect(compose({ ...learned, level })).toEqual(neutral);
  expect(compose({ ...learned, level: 18 })).toEqual({
    ...neutral,
    fadeRank: 1,
    resistAllBonus: 2,
    magicDodgeBonus: 0.005
  });
  expect(compose({ ...learned, level: 29 }).venomRank).toBe(0);
  expect(compose(learned).venomRank).toBe(1);
  expect(compose({ ...owner, skillLevels: { 'assassin.fade-lookalike': 20 } })).toEqual(neutral);
  expect(composeAssassinVenom({ ...learned, id: '' })).toBeUndefined();
});
it('reads alternate coefficients, coating, cap and unlock from copied authored definitions', () => {
  const rows = skills.map((row) =>
    row.id === 'skills-assassin-fade'
      ? {
          ...row,
          requiredLevel: 9,
          maxLevel: 4,
          scaling: { passiveStatsPerLevel: { resistAllPct: 0.125, magicDodgePct: 0.01 } }
        }
      : row.id === 'skills-assassin-venom'
        ? {
            ...row,
            requiredLevel: 10,
            maxLevel: 3,
            scaling: { passiveStatsPerLevel: { poisonDamagePct: 0.1 } },
            venomOnBasicHit: { attackPct: 0.2, durationMs: 1000 }
          }
        : row
  );
  const d = resolve(rows),
    learned = { ...owner, skillLevels: { 'assassin.fade': 99, 'assassin.venom': 99 } };
  expect(compose({ ...learned, level: 8 }, d)).toEqual(neutral);
  expect(compose({ ...learned, level: 10 }, d)).toEqual({
    fadeRank: 4,
    venomRank: 3,
    resistAllBonus: 50,
    magicDodgeBonus: 0.04,
    poisonDamagePct: 0.1 * 3
  });
  expect(d.venom).toMatchObject({ coatingAttackPct: 0.2, coatingDurationMs: 1000 });
});
it.each(['fade', 'venom'])('rejects missing/duplicate/contradictory %s source rows', (key) => {
  const id = 'skills-assassin-' + key,
    row = skills.find((s) => s.id === id);
  if (!row) throw new Error('Missing shadow source');
  expect(() => resolve(skills.filter((s) => s.id !== id))).toThrow(/Invalid/);
  expect(() => resolve([...skills, row])).toThrow(/Invalid/);
  expect(() => resolve(skills.map((s) => (s.id === id ? { ...s, cooldown: 1 } : s)))).toThrow(
    /Invalid/
  );
});
it('copies bounded explicit wave authority and rejects malformed external projections', () => {
  const incoming = { sourceHeroId: 'hero', rank: 20 },
    frozen = copy(incoming);
  expect(frozen).toEqual(incoming);
  expect(frozen).not.toBe(incoming);
  expect(Object.isFrozen(frozen)).toBe(true);
  incoming.rank = 0;
  expect(frozen?.rank).toBe(20);
  for (const bad of [
    undefined,
    null,
    [],
    {},
    { rank: 1 },
    { sourceHeroId: '', rank: 1 },
    ...[0, -1, 1.5, 21, Infinity, NaN, '1'].map((rank) => ({ sourceHeroId: 'hero', rank })),
    { sourceHeroId: 'hero', rank: 1, arbitrary: true },
    Object.assign(Object.create({ sourceHeroId: 'hero' }), { rank: 1, arbitrary: true })
  ])
    expect(copy(bad)).toBeUndefined();
});
