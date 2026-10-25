import { afterEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import { refreshDruidFormState } from '../skills/druid-shapeshifting';

// Actual registered spells; all stats/ranks/holds here are synthetic isolation fixtures.
const spells = [
  {
    slug: 'werewolf-maul',
    mana: 15,
    cooldown: 1,
    seedHit: 82,
    growth: 8,
    fraction: 0.1,
    duration: 3,
    status: 'bleed',
    cap: 1,
    type: 'physical'
  },
  {
    slug: 'rabies',
    mana: 12,
    cooldown: 2,
    seedHit: 51,
    growth: 5,
    fraction: 0.05,
    duration: 5,
    status: 'poison',
    cap: 10,
    type: 'poison'
  },
  {
    slug: 'fire-claws',
    mana: 9,
    cooldown: 1,
    seedHit: 71,
    growth: 6,
    fraction: 0.1,
    duration: 3,
    status: 'ignite',
    cap: 5,
    type: 'fire'
  }
] as const;
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  stacks: 1,
  remaining: -1,
  sourceId: 'fixture',
  appliedAtMs: at
});
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return {
    id,
    name: id,
    side,
    kind: side === 'player' ? 'hero' : 'monster',
    level: 30,
    tier: 'trash',
    life: 1000,
    mana: 0,
    stats: {
      life: 1000,
      lifeMax: 1000,
      mana: 100,
      manaMax: 100,
      attack: 1,
      defense: 0,
      magicResist: 0,
      attackSpeed: 100,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
    },
    statuses: [hold()],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false
  };
}
function fixture(spell: (typeof spells)[number], rank: number): CombatSnapshot {
  const id = 'skills-druid-' + spell.slug;
  return {
    seed: 7,
    playerTeam: [
      {
        ...unit('hero', 'player'),
        mana: spell.mana,
        statuses: [hold(1701)],
        skillOrder: [id],
        skillLevels: { [id]: rank }
      }
    ],
    enemyTeam: [unit('target', 'enemy')]
  };
}
function first<T>(values: readonly T[]): T {
  const value = values[0];
  if (value === undefined) throw new Error('Missing Druid attack combat fixture');
  return value;
}
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

describe.each(spells)('BUG192 registered Druid $slug', (spell) => {
  it.each([1, 2, 20])(
    'deals its own rank %i hit plus the full authored periodic duration',
    (rank) => {
      const input = fixture(spell, rank),
        before = structuredClone(input);
      const r = runBattleRecorded(input);
      const hits = r.events.filter((e) => e.kind === 'damage');
      expect(hits).toHaveLength(1);
      const hit = hits[0];
      if (hit?.kind !== 'damage') throw new Error('Missing actual Druid hit');
      expect(hit).toMatchObject({
        source: 'hero',
        target: 'target',
        damageType: spell.type,
        dodged: false,
        crit: false,
        simClockMs: 1700,
        amount: spell.seedHit + spell.growth * (rank - 1)
      });
      // Independent seed-7 range draw is 0.06195825757458806; literals preserve each identity.
      const rate = Math.floor((spell.seedHit + spell.growth * (rank - 1)) * spell.fraction);
      const totalDot = r.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0);
      expect(totalDot).toBe(rate * spell.duration);
      expect(r.result.enemyTeam[0]?.life).toBe(1000 - hit.amount - rate * spell.duration);
      expect(r.events.filter((e) => e.kind === 'dot').at(-1)).toMatchObject({
        simClockMs: 1700 + spell.duration * 1000
      });
      expect(r.result.enemyTeam[0]?.statuses).toEqual([hold()]);
      expect(r.result.playerTeam[0]?.mana).toBe(0);
      expect(runBattleRecorded(input)).toEqual(r);
      expect(runBattle(input)).toEqual(r.result);
      expect(input).toEqual(before);
    }
  );

  it('captures mitigation and elemental increases once; weapon Attack does not alter the spell', () => {
    const input = fixture(spell, 1),
      hero = first(input.playerTeam),
      target = first(input.enemyTeam);
    const r = runBattleRecorded({
      ...input,
      playerTeam: [
        {
          ...hero,
          increasedDamagePct: { [spell.type]: 1 },
          stats: { ...hero.stats, attack: 10000 }
        }
      ],
      enemyTeam: [
        {
          ...target,
          stats: { ...target.stats, resistances: { ...target.stats.resistances, [spell.type]: 50 } }
        }
      ]
    });
    expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: spell.seedHit, dodged: false })
    ]);
    const rate = Math.floor(spell.seedHit * spell.fraction);
    expect(r.result.enemyTeam[0]?.life).toBe(1000 - spell.seedHit - rate * spell.duration);
    const highAttack = runBattleRecorded({
      ...input,
      playerTeam: [{ ...hero, stats: { ...hero.stats, attack: 10000 } }]
    });
    expect(highAttack.events).toEqual(runBattleRecorded(input).events);
  });

  it('uses a one-DPS floor for an actually mitigated one-point hit', () => {
    const input = fixture(spell, 1),
      target = first(input.enemyTeam);
    const r = runBattleRecorded({
      ...input,
      enemyTeam: [{ ...target, stats: { ...target.stats, defense: 10000 } }]
    });
    expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 1 })
    ]);
    expect(r.result.enemyTeam[0]?.life).toBe(999 - spell.duration);
  });

  it('hits the authored target set and gives each landed target its own periodic damage', () => {
    const input = fixture(spell, 1);
    const r = runBattleRecorded({
      ...input,
      enemyTeam: [unit('one', 'enemy'), unit('two', 'enemy'), unit('three', 'enemy')]
    });
    expect(r.events.flatMap((e) => (e.kind === 'damage' ? [e.target] : []))).toEqual(['one']);
    for (const target of r.result.enemyTeam) {
      const damage = r.events.reduce(
        (sum, e) => sum + (e.kind === 'damage' && e.target === target.id ? e.amount : 0),
        0
      );
      const dot = r.events.reduce(
        (sum, e) => sum + (e.kind === 'dot' && e.target === target.id ? e.amount : 0),
        0
      );
      expect(dot).toBe(damage > 0 ? Math.floor(damage * spell.fraction) * spell.duration : 0);
      expect(target.life).toBe(1000 - damage - dot);
    }
  });

  it('honors basic fallback inside cooldown and casts at its exact boundary', () => {
    const input = fixture(spell, 1),
      hero = first(input.playerTeam);
    const at = 500 + spell.cooldown * 1000;
    const r = runBattleRecorded({
      ...input,
      playerTeam: [
        {
          ...hero,
          mana: spell.mana * 2,
          stats: { ...hero.stats, attackSpeed: 250 },
          statuses: [hold(at + 1)]
        }
      ]
    });
    const id = 'druid.' + spell.slug.replaceAll('-', '_');
    expect(
      r.events.flatMap((e) =>
        e.kind === 'action' && e.actor === 'hero' ? [[e.simClockMs, e.skillId]] : []
      )
    ).toEqual(
      Array.from({ length: at / 500 }, (_, index) => [
        (index + 1) * 500,
        index === 0 || (index + 1) * 500 === at ? id : null
      ])
    );
    expect(r.result.playerTeam[0]?.mana).toBe(0);
  });

  it.each([undefined, 2])(
    'refreshes a legacy status with prior rate %s using shared aggregate policy',
    (priorRate) => {
      const input = fixture(spell, 1),
        target = first(input.enemyTeam);
      const marker: ActiveStatus = {
        id: spell.status,
        stacks: spell.cap,
        remaining: spell.duration,
        sourceId: 'old-source',
        appliedAtMs: 0,
        expiresAtMs: 3000,
        ...(priorRate ? { dotPerStack: priorRate, damageType: spell.type } : {})
      };
      const r = runBattleRecorded({
        ...input,
        enemyTeam: [{ ...target, statuses: [hold(), marker] }]
      });
      // Existing Bleed/10-stack Poison supply the authored combo multipliers once.
      const direct = spell.status === 'bleed' ? 90 : spell.status === 'poison' ? 127 : 71;
      expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
        expect.objectContaining({ amount: direct })
      ]);
      const observed = r.events.find(
        (e) => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 1700
      );
      expect(
        observed?.kind === 'status-state'
          ? observed.statuses.filter((s) => s.id === spell.status)
          : []
      ).toEqual([
        expect.objectContaining({
          id: spell.status,
          stacks: spell.cap,
          appliedAtMs: 0,
          expiresAtMs: 1700 + spell.duration * 1000,
          sourceId: priorRate ? 'old-source' : 'hero',
          dotPerStack: priorRate ?? Math.floor(direct * spell.fraction)
        })
      ]);
      const dot = priorRate
        ? Math.floor(priorRate * spell.cap * (1.7 + spell.duration))
        : Math.floor(direct * spell.fraction) * spell.cap * spell.duration;
      expect(r.result.enemyTeam[0]?.life).toBe(1000 - direct - dot);
    }
  );

  it('does not apply a status or spend spell mana when one MP short', () => {
    const input = fixture(spell, 1),
      hero = first(input.playerTeam);
    const r = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: spell.mana - 1 }] });
    expect(r.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: null, simClockMs: 1700 })
    ]);
    expect(r.events.filter((e) => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(r.result.playerTeam[0]?.mana).toBe(spell.mana - 1);
    expect(r.result.enemyTeam[0]?.life).toBe(999);
  });

  it('pays for a missed cast without applying a status or periodic HP loss', () => {
    const input = fixture(spell, 20),
      target = first(input.enemyTeam);
    const r = runBattleRecorded({
      ...input,
      seed: 1,
      enemyTeam: [{ ...target, stats: { ...target.stats, magicDodge: 1, physDodge: 1 } }]
    });
    expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 0, dodged: true })
    ]);
    expect(r.events.filter((e) => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(r.result.enemyTeam[0]?.life).toBe(1000);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
  });
});

it.each([undefined, 'werewolf', 'werebear'] as const)(
  'Maul attacks while %s without creating or replacing a paid form',
  (form) => {
    const spell = first(spells),
      input = fixture(spell, 1),
      hero = first(input.playerTeam);
    const shaped: CombatUnit = {
      ...hero,
      druidShapeRanks: { werewolf: 1, werebear: 1, lycanthropy: 1 },
      skillOrder: [...hero.skillOrder, ...(form ? ['druid.' + form] : [])]
    };
    // Trusted already-paid carry; native paid form casting has its own regression suite.
    const paid = form ? refreshDruidFormState(shaped, form) : shaped;
    const before = structuredClone(paid),
      r = runBattleRecorded({ ...input, playerTeam: [paid] });
    expect(r.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: 'druid.werewolf_maul' })
    ]);
    expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 82, damageType: 'physical' })
    ]);
    expect(r.result.enemyTeam[0]?.life).toBe(894);
    expect(r.result.playerTeam[0]?.druidForm).toEqual(paid.druidForm);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
    expect(paid).toEqual(before);
  }
);

it.each([0, 9])('Rabies chains through two real deaths with %i prior stacks', (priorStacks) => {
  const spell = spells[1],
    input = fixture(spell, 1),
    hero = first(input.playerTeam);
  const stacks = priorStacks + 1,
    spread = Math.max(1, Math.floor(stacks / 2));
  const marker: ActiveStatus = {
    id: 'poison',
    sourceId: 'old-source',
    stacks: priorStacks,
    remaining: 5,
    appliedAtMs: 1700,
    expiresAtMs: 6700,
    dotPerStack: 2,
    damageType: 'poison'
  };
  const one = {
    ...unit('one', 'enemy'),
    life: (priorStacks ? 119 : 51) + stacks * 2,
    statuses: [hold(), ...(priorStacks ? [marker] : [])]
  };
  const two = { ...unit('two', 'enemy'), life: spread * 2 };
  const ally = { ...unit('ally', 'player'), kind: 'merc' as const };
  const r = runBattleRecorded({
    ...input,
    playerTeam: [hero, ally],
    enemyTeam: [one, two, unit('three', 'enemy'), { ...unit('already-dead', 'enemy'), life: 0 }]
  });
  expect(r.events.filter((e) => e.kind === 'death')).toEqual([
    expect.objectContaining({ target: 'one', simClockMs: 2700 }),
    expect.objectContaining({ target: 'two', simClockMs: 3700 })
  ]);
  const states = r.events.filter((e) => e.kind === 'status-state');
  const poisons = (target: string, at: number) =>
    states.flatMap((e) =>
      e.target === target && e.simClockMs === at ? e.statuses.filter((s) => s.id === 'poison') : []
    );
  expect(poisons('two', 1700)).toEqual([]);
  expect(poisons('three', 1700)).toEqual([]);
  expect(poisons('two', 2700)).toContainEqual(
    expect.objectContaining({
      stacks: spread,
      sourceId: 'one',
      dotPerStack: 2,
      appliedAtMs: 2700,
      expiresAtMs: 7700
    })
  );
  const nextSpread = Math.max(1, Math.floor(spread / 2));
  expect(poisons('three', 3700)).toContainEqual(
    expect.objectContaining({
      stacks: spread + nextSpread,
      sourceId: 'one',
      dotPerStack: 2,
      appliedAtMs: 2700,
      expiresAtMs: 8700
    })
  );
  const third = r.result.enemyTeam.find((u) => u.id === 'three');
  expect(third?.life).toBe(1000 - spread * 2 - (spread + nextSpread) * 2 * 5);
  expect(third?.statuses).toEqual([hold()]);
  expect(
    r.result.playerTeam.every((u) => u.life === 1000 && !u.statuses.some((s) => s.id === 'poison'))
  ).toBe(true);
  expect(
    states.flatMap((e) =>
      e.target === 'already-dead' ? e.statuses.filter((s) => s.id === 'poison') : []
    )
  ).toEqual([]);
});

it('Rabies expires before a later lethal basic hit and cannot spread from the expired marker', () => {
  const input = fixture(spells[1], 1),
    hero = first(input.playerTeam);
  // One ally acts at 6800ms, after the 6700ms Poison expiry; no genuine campaign state is used.
  const ally = {
    ...unit('ally', 'player'),
    kind: 'merc' as const,
    statuses: [{ ...hold(), expiresAtMs: 6700 }, hold(6801)],
    stats: { ...hero.stats, attackSpeed: 100, attack: 1 }
  };
  const r = runBattleRecorded({
    ...input,
    playerTeam: [hero, ally],
    enemyTeam: [{ ...unit('one', 'enemy'), life: 62 }, unit('two', 'enemy')]
  });
  expect(r.events.filter((e) => e.kind === 'death')).toEqual([
    expect.objectContaining({ target: 'one', simClockMs: 6800 })
  ]);
  expect(r.events.filter((e) => e.kind === 'dot').at(-1)).toMatchObject({
    target: 'one',
    simClockMs: 6700
  });
  expect(r.result.enemyTeam.find((u) => u.id === 'two')?.life).toBe(1000);
  expect(r.result.enemyTeam.find((u) => u.id === 'two')?.statuses).toEqual([hold()]);
});
