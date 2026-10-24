import { expect, it } from 'vitest';
import skills from '../../data/skills/assassin.json';
import {
  activeBurstOfSpeed,
  composeBurstOfSpeedRank,
  copyBurstOfSpeedStatuses,
  paidBurstOfSpeed,
  resolveBurstOfSpeedDefinition,
  BURST_OF_SPEED_DEFINITION as definition
} from './burst-of-speed';
import type { CombatUnit, ActiveStatus } from '../combat/types';
import { rebaseStatusClock } from '../combat/status';
const owner = { class: 'assassin' as const, level: 30 };
const status: ActiveStatus = {
  id: 'burst-of-speed',
  sourceId: 'hero',
  stacks: 1,
  remaining: 10,
  appliedAtMs: 0.1,
  expiresAtMs: 10000.1,
  statBuff: paidBurstOfSpeed(20)
};
const unit: CombatUnit = {
  id: 'hero',
  side: 'player',
  kind: 'hero',
  level: 30,
  life: 100,
  statuses: [status],
  name: 'hero',
  tier: 'trash',
  mana: 0,
  stats: {
    life: 100,
    lifeMax: 100,
    mana: 0,
    manaMax: 100,
    attack: 1,
    attackSpeed: 100,
    defense: 0,
    magicResist: 0,
    critChance: 0,
    critDamage: 2,
    physDodge: 0,
    magicDodge: 0,
    magicFind: 0,
    goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
  },
  cooldowns: {},
  activeBuffIds: [],
  skillOrder: [],
  enraged: false
};
it('copies authored tuning independently and rejects missing or duplicate definitions', () => {
  const rows = structuredClone(skills),
    copy = resolveBurstOfSpeedDefinition(rows);
  expect(copy).toMatchObject({
    requiredLevel: 6,
    maxRank: 20,
    durationMs: 10000,
    attackSpeedPerRank: 0.02,
    physDodgePerRank: 0.005,
    manaCost: 11,
    cooldown: 4
  });
  expect(Object.isFrozen(copy)).toBe(true);
  rows.splice(0);
  expect(copy).toEqual(definition);
  expect(() => resolveBurstOfSpeedDefinition(rows)).toThrow(/Invalid/);
  const row = skills.find((s) => s.id === 'skills-assassin-burst-of-speed');
  expect(() => resolveBurstOfSpeedDefinition([...skills, row])).toThrow(/Invalid/);
  const alternate = skills.map((s) =>
    s === row
      ? {
          ...s,
          timedBuff: { durationMs: 7500 },
          scaling: {
            ...s.scaling,
            passiveStatsPerLevel: { attackSpeedPct: 0.03, physDodgePct: 0.01 }
          }
        }
      : s
  );
  expect(resolveBurstOfSpeedDefinition(alternate)).toMatchObject({
    durationMs: 7500,
    attackSpeedPerRank: 0.03,
    physDodgePerRank: 0.01
  });
});
it('resolves exact aliases once, clamps valid over-cap allocations and rejects malformed ranks/classes', () => {
  const learned = {
    ...owner,
    skillLevels: { 'assassin.burst_of_speed': 1, 'skills-assassin-burst-of-speed': 99 }
  };
  expect(composeBurstOfSpeedRank(learned)).toBe(20);
  expect(composeBurstOfSpeedRank({ ...learned, level: 5 })).toBe(0);
  expect(composeBurstOfSpeedRank({ ...learned, class: 'sorceress' })).toBe(0);
  for (const rank of [0, -1, 1.5, NaN, Infinity, '20', null]) {
    expect(
      composeBurstOfSpeedRank({
        ...owner,
        skillLevels: { 'assassin.burst_of_speed': rank as number }
      })
    ).toBe(0);
  }
  expect(
    composeBurstOfSpeedRank({ ...owner, skillLevels: { 'assassin.burst_of_speed-like': 20 } })
  ).toBe(0);
  for (const rank of [0, 21, NaN, 1.5]) expect(() => paidBurstOfSpeed(rank)).toThrow(/Invalid/);
});
it('independently freezes paid potency, tolerates fractional rebasing and respects exact active boundaries', () => {
  const incoming = structuredClone(unit),
    copy = copyBurstOfSpeedStatuses(incoming);
  expect(copy).toEqual(incoming);
  expect(copy.statuses[0]?.statBuff).not.toBe(incoming.statuses[0]?.statBuff);
  expect(Object.isFrozen(copy.statuses[0]?.statBuff)).toBe(true);
  expect(activeBurstOfSpeed(copy, 0.099)).toBeUndefined();
  expect(activeBurstOfSpeed(copy, 0.1)).toEqual(paidBurstOfSpeed(20));
  const rebased = rebaseStatusClock(copy, 1700 / 3);
  expect(activeBurstOfSpeed(rebased, 0)).toEqual(paidBurstOfSpeed(20));
  expect(activeBurstOfSpeed(rebased, rebased.statuses[0]?.expiresAtMs ?? 0)).toBeUndefined();
  expect(copyBurstOfSpeedStatuses({ ...unit, statuses: [] })).toEqual({ ...unit, statuses: [] });
  // Paid cast potency survives a later reset of allocation authority.
  expect(activeBurstOfSpeed({ ...rebased, burstOfSpeedRank: 0 }, 0)).toEqual(paidBurstOfSpeed(20));
});
it('ignores malformed external payloads and foreign/extended intervals without throwing or stacking', () => {
  const inherited: unknown = Object.assign(Object.create({ rank: 20 }), {
    attackSpeedPct: 0.4,
    physDodgePct: 0.1,
    other: 1
  });
  const bad: unknown[] = [
    null,
    false,
    '20',
    [],
    {},
    inherited,
    { ...paidBurstOfSpeed(20), extra: 1 },
    { ...paidBurstOfSpeed(20), rank: 21 },
    { ...paidBurstOfSpeed(20), attackSpeedPct: 0.5 }
  ];
  for (const payload of bad) {
    const input = {
      ...unit,
      statuses: [{ ...status, statBuff: payload as NonNullable<ActiveStatus['statBuff']> }]
    };
    expect(() => copyBurstOfSpeedStatuses(input)).not.toThrow();
    expect(copyBurstOfSpeedStatuses(input).statuses[0]?.statBuff).toBeUndefined();
    expect(activeBurstOfSpeed(input, 100)).toBeUndefined();
  }
  for (const patch of [{ sourceId: 'other' }, { expiresAtMs: 10001 }, { appliedAtMs: NaN }]) {
    expect(
      activeBurstOfSpeed({ ...unit, statuses: [{ ...status, ...patch }] }, 100)
    ).toBeUndefined();
  }
  for (const patch of [
    { kind: 'merc' as const },
    { side: 'enemy' as const },
    { summon: true },
    { ownerId: 'other' },
    { summonOwnerId: 'other' },
    { level: 5 },
    { level: Infinity },
    { life: 0 }
  ]) {
    expect(activeBurstOfSpeed({ ...unit, ...patch }, 100)).toBeUndefined();
  }
  expect(activeBurstOfSpeed({ ...unit, statuses: [status, status] }, 100)).toEqual(
    paidBurstOfSpeed(20)
  );
});
