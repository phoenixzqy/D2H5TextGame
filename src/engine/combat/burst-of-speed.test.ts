import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattleRecorded, runBattle, type CombatSnapshot } from './combat';
import { loadDefaultSkills, resetRegistry, registerSkill, getSkill } from '../skills/registry';
import type { CombatUnit } from './types';
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return {
    id,
    side,
    name: id,
    kind: side === 'player' ? 'hero' : 'monster',
    level: 30,
    tier: 'trash',
    life: 100000,
    mana: 9,
    stats: {
      life: 100000,
      lifeMax: 100000,
      mana: 9,
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
    statuses: [],
    cooldowns: {},
    activeBuffIds: [],
    skillOrder: [],
    enraged: false
  };
}
function scene(): CombatSnapshot {
  return {
    seed: 7,
    playerTeam: [
      Object.assign(unit('hero', 'player'), {
        burstOfSpeedRank: 20,
        skillLevels: { 'assassin.burst_of_speed': 20 },
        skillOrder: ['assassin.burst_of_speed']
      })
    ],
    enemyTeam: [
      {
        ...unit('target', 'enemy'),
        statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }]
      }
    ]
  };
}
beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
it('actual paid rank20 Burst changes the next attack time without changing base stats or refilling resources', () => {
  const input = scene(),
    before = structuredClone(input),
    result = runBattleRecorded(input);
  const actions = result.events.filter((e) => e.kind === 'action' && e.actor === 'hero');
  expect(actions.slice(0, 2).map((e) => e.simClockMs)).toEqual([1700, 3080]);
  expect(result.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
  expect(result.result.playerTeam[0]?.mana).toBe(0);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(result);
  expect(runBattle(input)).toEqual(result.result);
});
it('observes a finite ten-second paid effect and its expiry rather than a permanent marker', () => {
  const result = runBattleRecorded(scene());
  expect(
    result.events.some(
      (e) =>
        e.kind === 'status-state' &&
        e.target === 'hero' &&
        e.simClockMs === 1700 &&
        e.statuses.some((s) => s.id === 'burst-of-speed' && s.expiresAtMs === 11700)
    )
  ).toBe(true);
  expect(
    result.events.some(
      (e) =>
        e.kind === 'status-state' &&
        e.target === 'hero' &&
        e.simClockMs === 11700 &&
        e.statuses.every((s) => s.id !== 'burst-of-speed')
    )
  ).toBe(true);
  expect(result.result.playerTeam[0]?.activeBuffIds).not.toContain('burst-of-speed');
});
it('can pay for a later recast after expiry, but never refreshes an active effect', () => {
  const input = scene();
  const result = runBattleRecorded({
    ...input,
    playerTeam: input.playerTeam.map((u) => ({ ...u, mana: 100 }))
  });
  const casts = result.events.filter(
    (e) => e.kind === 'action' && e.actor === 'hero' && e.skillId === 'assassin.burst_of_speed'
  );
  expect(casts.length).toBeGreaterThan(1);
  for (let i = 1; i < casts.length; i++)
    expect((casts[i]?.simClockMs ?? 0) - (casts[i - 1]?.simClockMs ?? 0)).toBeGreaterThanOrEqual(
      10000
    );
});

it.each([1, 20])(
  'charges the actual authored rank%s cost once, with no refresh while active',
  (rank) => {
    const input = scene(),
      hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing hero');
    const cost = rank === 1 ? 11 : 9;
    const result = runBattleRecorded({
      ...input,
      playerTeam: [
        {
          ...hero,
          burstOfSpeedRank: rank,
          skillLevels: { 'assassin.burst_of_speed': rank },
          mana: cost
        }
      ]
    });
    expect(
      result.events.filter((e) => e.kind === 'action' && e.skillId === 'assassin.burst_of_speed')
    ).toHaveLength(1);
    expect(result.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
    expect(
      result.events
        .filter((e) => e.kind === 'action' && e.actor === 'hero')
        .slice(0, 2)
        .map((e) => e.simClockMs)
    ).toEqual([1700, rank === 1 ? 3384 : 3080]);
  }
);
it('refuses insufficient/nonfinite mana, absent or invalid authority and nonhero sources before payment', () => {
  const input = scene(),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const { burstOfSpeedRank: omitted, ...withoutRank } = hero;
  void omitted;
  const bad = [
    withoutRank,
    ...[0, -1, 1.5, 21, NaN, Infinity].map((burstOfSpeedRank) => ({ ...hero, burstOfSpeedRank })),
    { ...hero, kind: 'merc' as const },
    { ...hero, kind: 'summon' as const, ownerId: 'other' },
    { ...hero, summon: true },
    { ...hero, summonOwnerId: 'other' },
    { ...hero, level: 5 },
    { ...hero, mana: 8 },
    { ...hero, mana: NaN },
    { ...hero, life: 0 }
  ];
  for (const candidate of bad) {
    const result = runBattleRecorded({ ...input, playerTeam: [candidate] });
    expect(
      result.events.some((e) => e.kind === 'action' && e.skillId === 'assassin.burst_of_speed')
    ).toBe(false);
    expect(result.events.some((e) => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
  }
  const hostile = { ...hero, id: 'hostile', side: 'enemy' as const, kind: 'monster' as const };
  expect(
    runBattleRecorded({ ...input, enemyTeam: [hostile] }).events.some(
      (e) => e.kind === 'action' && e.actor === 'hostile' && e.skillId === 'assassin.burst_of_speed'
    )
  ).toBe(false);
});
it('ignores stale legacy markers and replaces duplicate bare statuses with one paid effect', () => {
  const input = scene(),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const result = runBattleRecorded({
    ...input,
    playerTeam: [
      {
        ...hero,
        activeBuffIds: [
          'burst-of-speed',
          'assassin.burst_of_speed',
          'skills-assassin-burst-of-speed'
        ],
        statuses: [{ id: 'burst-of-speed', sourceId: 'legacy', stacks: 5, remaining: -1 }]
      }
    ]
  });
  const onset = result.events.find(
    (e) => e.kind === 'status-state' && e.simClockMs === 1700 && e.target === hero.id
  );
  expect(onset).toMatchObject({
    statuses: [{ id: 'burst-of-speed', stacks: 1, statBuff: { rank: 20 } }]
  });
  expect(result.result.playerTeam[0]?.activeBuffIds).toEqual([]);
});
it.each(['physical', 'thorns', 'fire'] as const)(
  'paid dodge uses the existing %s damage/RNG path exactly once',
  (damageType) => {
    const input = scene(),
      hero = input.playerTeam[0],
      enemy = input.enemyTeam[0];
    if (!hero || !enemy) throw new Error('Missing fixture');
    const stun = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
    const paid = {
      id: 'burst-of-speed',
      sourceId: hero.id,
      stacks: 1,
      remaining: 10,
      appliedAtMs: 0,
      expiresAtMs: 10000,
      statBuff: { rank: 20, attackSpeedPct: 0.4, physDodgePct: 0.1 }
    };
    const source = {
      ...enemy,
      statuses: [],
      stats: { ...enemy.stats, attackSpeed: 300 },
      basicAttack: { damage: [10, 30] as const, damageType }
    };
    const defender = {
      ...hero,
      skillOrder: [],
      statuses: [stun],
      stats: { ...hero.stats, attackSpeed: 0 }
    };
    const run = (target: CombatUnit) =>
      runBattleRecorded({ seed: 7, playerTeam: [target], enemyTeam: [source] });
    const actual = run({ ...defender, statuses: [stun, paid] });
    const equivalent = run({ ...defender, stats: { ...defender.stats, physDodge: 0.1 } });
    const hits = (r: ReturnType<typeof run>) =>
      r.events.filter((e) => e.kind === 'damage' && e.target === hero.id && e.simClockMs < 10000);
    expect(hits(actual)).toEqual(hits(equivalent));
    if (damageType === 'fire') expect(hits(actual)).toEqual(hits(run(defender)));
    else {
      expect(hits(actual).some((e) => e.kind === 'damage' && e.dodged)).toBe(true);
      expect(hits(actual)).not.toEqual(hits(run(defender)));
    }
  }
);
it('preserves pending action phase at future onset and expiry, composing before Chill', () => {
  const input = scene(),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const paid = {
    id: 'burst-of-speed',
    sourceId: hero.id,
    stacks: 1,
    remaining: 10,
    appliedAtMs: 1300,
    expiresAtMs: 11300,
    statBuff: { rank: 20, attackSpeedPct: 0.4, physDodgePct: 0.1 }
  };
  const result = runBattleRecorded({
    ...input,
    playerTeam: [{ ...hero, skillOrder: [], statuses: [paid] }]
  });
  const times = result.events
    .filter((e) => e.kind === 'action' && e.actor === hero.id)
    .map((e) => e.simClockMs);
  expect(times[0]).toBeCloseTo(1300 + (400 * 1380) / 1700, 9);
  expect((times[1] ?? 0) - (times[0] ?? 0)).toBeCloseTo(1380, 9);
  const before = times.filter((t) => t < 11300).at(-1);
  if (before === undefined) throw new Error('Missing active attack');
  expect(times.find((t) => t > 11300)).toBeCloseTo(
    11300 + ((before + 1380 - 11300) * 1700) / 1380,
    9
  );
  const chilled = runBattleRecorded({
    ...input,
    playerTeam: [
      {
        ...hero,
        skillOrder: [],
        statuses: [
          { ...paid, appliedAtMs: 0, expiresAtMs: 10000 },
          { id: 'chill', sourceId: 'fixture', stacks: 1, remaining: -1 }
        ]
      }
    ]
  });
  expect(chilled.events.find((e) => e.kind === 'action' && e.actor === hero.id)?.simClockMs).toBe(
    1940
  );
  const enraged = runBattleRecorded({
    ...input,
    playerTeam: [
      {
        ...hero,
        skillOrder: [],
        enraged: true,
        enrage: { lifeFraction: 0.5, attackSpeedMultiplier: 2 },
        statuses: [
          { ...paid, appliedAtMs: 0, expiresAtMs: 10000 },
          { id: 'chill', sourceId: 'fixture', stacks: 1, remaining: -1 }
        ]
      }
    ]
  });
  expect(enraged.events.find((e) => e.kind === 'action' && e.actor === hero.id)?.simClockMs).toBe(
    1380
  );
  expect(enraged.result.playerTeam[0]?.stats.attackSpeed).toBe(100);
});
it('settles an expiry/lethal instant before a due cast and never revives or pays a dead hero', () => {
  const input = scene(),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing hero');
  const result = runBattleRecorded({
    ...input,
    playerTeam: [
      {
        ...hero,
        life: 1,
        stats: { ...hero.stats, attackSpeed: 0 },
        statuses: [
          {
            id: 'burst-of-speed',
            sourceId: hero.id,
            stacks: 1,
            remaining: 2,
            appliedAtMs: -8000,
            expiresAtMs: 2000,
            statBuff: { rank: 20, attackSpeedPct: 0.4, physDodgePct: 0.1 }
          },
          {
            id: 'bleed',
            sourceId: 'target',
            stacks: 1,
            remaining: 2,
            appliedAtMs: 0,
            expiresAtMs: 2000,
            dotPerStack: 0.5
          }
        ]
      }
    ]
  });
  expect(result.events.at(-1)).toMatchObject({ kind: 'end', winner: 'enemy', simClockMs: 2000 });
  expect(result.events.some((e) => e.kind === 'action' && e.actor === hero.id)).toBe(false);
  expect(result.result.playerTeam[0]?.mana).toBe(9);
});

it('rejects contradictory startup registry metadata before any free or paid action', () => {
  const actual = getSkill('assassin.burst_of_speed');
  if (!actual) throw new Error('Missing real Burst registry row');
  registerSkill({ ...actual, summonOnStart: true });
  const result = runBattleRecorded(scene());
  expect(result.events.some((e) => e.kind === 'action' && e.skillId === actual.id)).toBe(false);
  expect(result.result.playerTeam[0]?.mana).toBe(9);
});
