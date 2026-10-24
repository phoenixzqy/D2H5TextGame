import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { runBattle, runBattleRecorded } from './combat';
import type { CombatUnit, ActiveStatus } from './types';
import type { DerivedStats } from '../types/attributes';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as rngModule from '../rng';
import { assassinVenomRawDps, type AssassinVenomProjection } from '../skills/assassin-shadow';
const stats: DerivedStats = {
  life: 1000000,
  lifeMax: 1000000,
  mana: 100,
  manaMax: 100,
  attack: 1000,
  defense: 0,
  magicResist: 0,
  attackSpeed: 100,
  critChance: 0,
  critDamage: 2,
  physDodge: 0,
  magicDodge: 0,
  magicFind: 0,
  goldFind: 0,
  resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
};
const hold = (appliedAtMs = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'fixture',
  stacks: 1,
  remaining: -1,
  appliedAtMs
});
function unit(id: string, side: CombatUnit['side'], patch: Partial<CombatUnit> = {}): CombatUnit {
  return {
    id,
    name: id,
    side,
    kind: side === 'player' ? 'hero' : 'monster',
    level: 30,
    tier: 'trash',
    stats,
    life: stats.lifeMax,
    mana: 100,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    ...patch
  };
}
function scene(hero: Partial<CombatUnit> = {}, enemy: Partial<CombatUnit> = {}, rank = 1) {
  return {
    seed: 7,
    maxRounds: 2,
    playerTeam: [
      unit('venom-owner', 'player', { increasedDamagePct: { poison: 0.03 * rank }, ...hero })
    ],
    enemyTeam: [unit('target', 'enemy', { statuses: [hold()], ...enemy })],
    assassinVenom: { sourceHeroId: 'venom-owner', rank }
  };
}
function firstPoison(result: ReturnType<typeof runBattleRecorded>) {
  for (const e of result.events)
    if (e.kind === 'status-state' && e.target === 'target') {
      const poison = e.statuses.find((s) => s.id === 'poison');
      if (poison) return { poison, time: e.simClockMs };
    }
  return undefined;
}
beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  vi.restoreAllMocks();
  resetRegistry();
  loadDefaultSkills();
});
it.each([
  [1, 51],
  [20, 80]
] as const)(
  'applies real rank%s poison DPS %s and deterministic immutable replay',
  (rank, rate) => {
    const input = scene({}, {}, rank),
      before = structuredClone(input),
      result = runBattleRecorded(input);
    expect(firstPoison(result)).toMatchObject({
      time: 1700,
      poison: {
        stacks: 1,
        sourceId: 'venom-owner',
        dotPerStack: rate,
        damageType: 'poison',
        appliedAtMs: 1700,
        expiresAtMs: 6700
      }
    });
    expect(
      result.events.some((e) => e.kind === 'dot' && e.target === 'target' && e.amount > 0)
    ).toBe(true);
    expect(runBattleRecorded(input)).toEqual(result);
    expect(runBattle(input)).toEqual(result.result);
    expect(input).toEqual(before);
  }
);
it('integrates one coating for exactly five seconds, expires, and never reapplies its damage bonus', () => {
  const result = runBattleRecorded(scene({ statuses: [hold(1701)] }));
  const dot = result.events.reduce(
    (sum, e) => sum + (e.kind === 'dot' && e.target === 'target' ? e.amount : 0),
    0
  );
  expect(dot).toBe(255); // floor(1000×.05×1.03)=51 DPS, exactly 5s.
  expect(result.result.enemyTeam[0]?.life).toBe(1000000 - 1000 - 255);
  expect(result.result.enemyTeam[0]?.statuses.some((s) => s.id === 'poison')).toBe(false);
  expect(
    result.events.some(
      (e) =>
        e.kind === 'status-state' &&
        e.target === 'target' &&
        e.simClockMs === 6700 &&
        e.statuses.every((s) => s.id !== 'poison')
    )
  ).toBe(true);
});
it.each([0, 75])(
  'uses poison resistance and ordinary armor independently of physical resistance%s and crit',
  (physical) => {
    for (const critChance of [0, 1]) {
      const result = runBattleRecorded(
        scene(
          { stats: { ...stats, critChance } },
          {
            stats: {
              ...stats,
              defense: 3,
              magicResist: 999,
              resistances: { ...stats.resistances, physical, poison: 50 }
            }
          }
        )
      );
      expect(firstPoison(result)?.poison.dotPerStack).toBe(22); // floor(51.5×.5−3)
    }
  }
);
it('uses the existing act penalty, resistance cap and minimum-one pipeline', () => {
  for (const [poison, penalty, defense, expected] of [
    [50, 20, 3, 33],
    [100, 0, 3, 9],
    [0, 0, 999, 1]
  ] as const) {
    const result = runBattleRecorded(
      scene(
        {},
        {
          resistPenalty: penalty,
          stats: {
            ...stats,
            defense,
            resistances: { ...stats.resistances, poison }
          }
        }
      )
    );
    expect(firstPoison(result)?.poison.dotPerStack).toBe(expected);
  }
});
it('does not proc on a missed basic hit', () => {
  const result = runBattleRecorded({
    ...scene({}, { stats: { ...stats, physDodge: 1 } }),
    seed: 8
  });
  const first = result.events.find((e) => e.kind === 'damage' && e.source === 'venom-owner');
  expect(first).toMatchObject({ kind: 'damage', dodged: true, amount: 0, simClockMs: 1700 });
  expect(
    result.events.some(
      (e) => e.kind === 'status' && e.statusId === 'poison' && e.simClockMs === 1700
    )
  ).toBe(false);
});
it('never procs from active skill damage or passive marker casts', () => {
  registerSkill({
    id: 'fixture.venom-physical',
    archetype: 'fixture',
    minLevel: 1,
    target: 'single-enemy',
    manaCost: 0,
    cooldown: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [1000, 1000] }]
  });
  const result = runBattleRecorded(
    scene({ skillOrder: ['fixture.venom-physical', 'assassin.venom', 'assassin.fade'] })
  );
  expect(result.events.some((e) => e.kind === 'status' && e.statusId === 'poison')).toBe(false);
  expect(
    result.events
      .filter((e) => e.kind === 'action')
      .every((e) => e.skillId === 'fixture.venom-physical')
  ).toBe(true);
});
it('does not introduce an additional probability draw for guaranteed coating', () => {
  const real = rngModule.createRng,
    probabilities: number[] = [];
  vi.spyOn(rngModule, 'createRng').mockImplementation((seed) => {
    const rng = real(seed);
    return {
      ...rng,
      chance: (p) => {
        probabilities.push(p);
        return rng.chance(p);
      }
    };
  });
  const input = scene();
  const { assassinVenom: _unused, ...bare } = input;
  void _unused;
  runBattleRecorded(bare);
  const expected = [...probabilities];
  probabilities.splice(0);
  runBattleRecorded(input);
  expect(probabilities).toEqual(expected);
});
it('caps actual stacks at ten and keeps the first valid poison payload/source', () => {
  const stacked = runBattleRecorded({ ...scene(), maxRounds: 12 });
  const stacks = stacked.events.flatMap((e) =>
    e.kind === 'status-state' && e.target === 'target'
      ? e.statuses.filter((s) => s.id === 'poison').map((s) => s.stacks)
      : []
  );
  expect(Math.max(...stacks)).toBe(10);
  expect(stacks.every((n) => n <= 10)).toBe(true);
  const result = runBattleRecorded(
    scene(
      {},
      {
        statuses: [
          hold(),
          {
            id: 'poison',
            sourceId: 'old-owner',
            stacks: 1,
            remaining: 60,
            appliedAtMs: 0,
            expiresAtMs: 60000,
            dotPerStack: 7,
            damageType: 'poison'
          }
        ]
      }
    )
  );
  const refreshed = result.events.find(
    (e) =>
      e.kind === 'status-state' &&
      e.target === 'target' &&
      e.statuses.some((s) => s.id === 'poison' && s.stacks === 2)
  );
  if (refreshed?.kind !== 'status-state') throw new Error('Missing real refreshed poison');
  expect(refreshed.statuses.find((status) => status.id === 'poison')).toMatchObject({
    id: 'poison',
    sourceId: 'old-owner',
    dotPerStack: 7,
    stacks: 2,
    damageType: 'poison'
  });
});
it('applies coating before lethal-hit finalization so canonical poison death spread remains real', () => {
  const input = scene({}, { life: 1 });
  input.enemyTeam.push(unit('survivor', 'enemy', { statuses: [hold()] }));
  const result = runBattleRecorded(input);
  expect(
    result.events.some(
      (e) =>
        e.kind === 'status-state' &&
        e.target === 'survivor' &&
        e.statuses.some(
          (s) => s.id === 'poison' && s.damageType === 'poison' && s.dotPerStack === 51
        )
    )
  ).toBe(true);
});
it.each([
  { kind: 'merc' as const },
  { kind: 'summon' as const },
  { summon: true },
  { ownerId: 'other' },
  { summonOwnerId: 'other' },
  { level: 29 },
  { life: 0 },
  { kind: undefined }
])('does not grant coating to ineligible source %s', (patch) => {
  const input = scene(patch as unknown as Partial<CombatUnit>),
    { assassinVenom: _unused, ...bare } = input;
  void _unused;
  expect(runBattleRecorded(input)).toEqual(runBattleRecorded(bare));
});
it('rejects missing, foreign, malformed and overflow authority without changing ordinary recordings', () => {
  const input = scene(),
    { assassinVenom: _unused, ...bare } = input;
  void _unused;
  const baseline = runBattleRecorded(bare);
  for (const value of [
    undefined,
    null,
    {},
    { sourceHeroId: 'foreign', rank: 1 },
    ...[0, -1, 1.5, 21, Infinity, NaN, '1'].map((rank) => ({ sourceHeroId: 'venom-owner', rank }))
  ]) {
    expect(
      runBattleRecorded({ ...input, assassinVenom: value as unknown as AssassinVenomProjection })
    ).toEqual(baseline);
  }
  const overflow = scene({ increasedDamagePct: { poison: Number.MAX_VALUE } });
  expect(firstPoison(runBattleRecorded(overflow))).toBeUndefined();
});

it('refuses nonnumeric or unsafe coating inputs rather than coercing them', () => {
  for (const bad of ['1000', NaN, Infinity, -1, 0]) {
    const attack = bad as unknown as number;
    expect(
      assassinVenomRawDps(
        unit('venom-owner', 'player', { stats: { ...stats, attack } }),
        scene().assassinVenom
      )
    ).toBeUndefined();
  }
  expect(
    assassinVenomRawDps(
      unit('venom-owner', 'player', {
        increasedDamagePct: { poison: '0.03' as unknown as number }
      }),
      scene().assassinVenom
    )
  ).toBeUndefined();
});
