import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import type { SpiritOfBarbsProjection } from '../skills/spirit-of-barbs';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { getSummon, registerSummon } from '../skills/summons';

const hold = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, kind: CombatUnit['kind'] = 'hero'): CombatUnit {
  return {
    id,
    name: id,
    side: kind === 'monster' ? 'enemy' : 'player',
    kind,
    level: 30,
    tier: 'trash',
    life: 1000,
    mana: 100,
    stats: {
      life: 1000,
      lifeMax: 1000,
      mana: 100,
      manaMax: 100,
      attack: 100,
      defense: 100,
      magicResist: 0,
      attackSpeed: 100,
      critChance: 0,
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    },
    statuses: [hold],
    skillOrder: [],
    activeBuffIds: [],
    cooldowns: {},
    enraged: false
  };
}
function input(rank = 20): CombatSnapshot & { readonly spiritOfBarbs: SpiritOfBarbsProjection } {
  const enemy = unit('enemy', 'monster');
  return {
    seed: 7,
    playerTeam: [
      unit('hero'),
      unit('merc', 'merc'),
      { ...unit('owned', 'summon'), summon: true, summonOwnerId: 'hero', ownerId: 'hero' }
    ],
    enemyTeam: [
      {
        ...enemy,
        life: 1000000,
        stats: { ...enemy.stats, lifeMax: 1000000, defense: 0 },
        statuses: [],
        skillOrder: ['fixture.sweep']
      }
    ],
    spiritOfBarbs: { sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank }
  };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot),
    out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  return out;
}
function damage(out: ReturnType<typeof record>, source: string, target: string, type = 'physical') {
  const event = out.events.find(
    (e) =>
      e.kind === 'damage' && e.source === source && e.target === target && e.damageType === type
  );
  if (event?.kind !== 'damage')
    throw new Error(`Missing actual ${type} damage from ${source} to ${target}`);
  return event.amount;
}
beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
  registerSkill({
    id: 'fixture.sweep',
    archetype: 'fixture',
    trigger: 'active',
    target: 'all-enemies',
    minLevel: 1,
    cooldown: 60,
    manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [300, 300] }]
  });
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

it.each([1, 20])(
  'rank%s real spirit supplies reflection and owned-summon Defense with no ordinary action',
  (rank) => {
    const out = record(input(rank));
    const spawns = out.events.filter(
      (e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs'
    );
    expect(spawns).toHaveLength(1);
    const spawn = spawns[0];
    if (spawn?.kind !== 'summon') throw new Error('Missing real passive spirit');
    expect(spawn).toMatchObject({
      owner: 'hero',
      simClockMs: 0,
      unit: {
        kind: 'summon',
        summon: true,
        summonOwnerId: 'hero',
        summonTemplateId: 'spirit_of_barbs',
        life: 80,
        stats: { lifeMax: 80, attack: 0, defense: 10 }
      }
    });
    expect(out.events.slice(0, 4).every((e) => e.kind === 'status-state' && e.initial)).toBe(true);
    expect(damage(out, 'enemy', 'hero')).toBe(200);
    expect(damage(out, 'enemy', 'merc')).toBe(200);
    expect(damage(out, 'enemy', 'owned')).toBe(rank === 1 ? 198 : 160);
    expect(damage(out, 'hero', 'enemy', 'thorns')).toBe(rank === 1 ? 8 : 160);
    expect(damage(out, 'merc', 'enemy', 'thorns')).toBe(rank === 1 ? 8 : 160);
    expect(out.events.some((e) => e.kind === 'action' && e.actor === spawn.unit.id)).toBe(false);
    expect(
      out.events.some((e) => e.kind === 'action' && e.skillId === 'druid.spirit_of_barbs')
    ).toBe(false);
    expect(out.result.playerTeam.find((u) => u.id === 'owned')?.stats.defense).toBe(100);
    const death = out.events.findIndex((e) => e.kind === 'death' && e.target === spawn.unit.id);
    expect(death).toBeGreaterThan(0);
    expect(
      out.events
        .slice(death + 1)
        .some((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs')
    ).toBe(false);
    const views = out.events.filter((e) => e.kind === 'status-state' && e.target === 'hero');
    expect(
      views.some(
        (e) => e.kind === 'status-state' && e.statuses.some((s) => s.id === 'spirit-of-barbs')
      )
    ).toBe(true);
    // The source survives: spirit death must remove only its aura and preserve independent Stun.
    const deathEvent = out.events[death];
    if (deathEvent?.kind !== 'death') throw new Error('Missing committed spirit death');
    expect(views.at(-1)).toMatchObject({ simClockMs: deathEvent.simClockMs, statuses: [hold] });
    const removal = out.events.findIndex((e) => e === views.at(-1));
    expect(removal).toBeGreaterThan(death);
    expect(
      out.events
        .slice(death + 1, removal)
        .some((e) => e.kind === 'damage' || e.kind === 'orb' || e.kind === 'heal')
    ).toBe(false);
    expect(out.result.playerTeam.find((u) => u.id === 'hero')?.life).toBeGreaterThan(0);
  }
);

it('adds to independent reflection without recursion and never refunds a passive spirit as another summon spell', () => {
  const snapshot = input();
  const hero = snapshot.playerTeam[0];
  if (!hero) throw new Error('Missing owner');
  const out = record({
    ...snapshot,
    playerTeam: [
      {
        ...hero,
        physicalReflectionPct: 0.5,
        skillOrder: ['druid.raven'],
        skillLevels: { 'druid.raven': 1 }
      },
      ...snapshot.playerTeam.slice(1)
    ],
    enemyTeam: snapshot.enemyTeam.map((u) => ({ ...u, physicalReflectionPct: 1 }))
  });
  expect(damage(out, 'hero', 'enemy', 'thorns')).toBe(260);
  expect(out.events.some((e) => e.kind === 'mana' && e.reason === 'summon-refund')).toBe(false);
  expect(out.result.playerTeam.find((u) => u.id === 'hero')?.mana).toBe(94);
  expect(
    out.events.some((e) => e.kind === 'damage' && e.source === 'enemy' && e.damageType === 'thorns')
  ).toBe(false);
  expect(
    out.events.filter((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs')
  ).toHaveLength(1);
});

it('does not create a spirit for an initially terminal wave or dead/foreign source', () => {
  const snapshot = input();
  for (const altered of [
    { ...snapshot, enemyTeam: [] },
    {
      ...snapshot,
      playerTeam: snapshot.playerTeam.map((u) => (u.id === 'hero' ? { ...u, life: 0 } : u))
    },
    { ...snapshot, spiritOfBarbs: { sourceHeroId: 'missing', rank: 20 } },
    { ...snapshot, spiritOfBarbs: { sourceHeroId: 'merc', rank: 20 } }
  ])
    expect(
      record(altered).events.some((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs')
    ).toBe(false);
});

it('preloaded matching bodies and passive markers do not authenticate a spirit aura', () => {
  const { spiritOfBarbs: _p, ...snapshot } = input();
  const out = record({
    ...snapshot,
    playerTeam: [
      ...snapshot.playerTeam.map((u) => ({
        ...u,
        statuses: [...u.statuses, { ...hold, id: 'spirit-of-barbs' }]
      })),
      {
        ...unit('preloaded', 'summon'),
        summon: true,
        summonOwnerId: 'hero',
        summonTemplateId: 'spirit_of_barbs'
      }
    ]
  });
  expect(out.events.some((e) => e.kind === 'damage' && e.damageType === 'thorns')).toBe(false);
  expect(damage(out, 'enemy', 'owned')).toBe(200);
});

it('leaves bench/foreign summons outside the benefits and gives the real spirit Oak capacity without healing', () => {
  // Keep the all-target fixed-damage attack ready so every recipient has an actual surviving hit.
  registerSkill({
    id: 'fixture.sweep',
    archetype: 'fixture',
    trigger: 'active',
    target: 'all-enemies',
    minLevel: 1,
    cooldown: 1,
    manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [300, 300] }]
  });
  const snapshot = input();
  const out = record({
    ...snapshot,
    playerTeam: [
      ...snapshot.playerTeam,
      unit('bench', 'merc'),
      {
        ...unit('foreign', 'summon'),
        summon: true,
        summonOwnerId: 'bench',
        ownerId: 'bench'
      }
    ],
    druidAllyAuras: {
      sourceHeroId: 'hero',
      fieldedMercCombatId: 'merc',
      oakRank: 20,
      heartRank: 20
    }
  });
  const spawn = out.events.find((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs');
  if (spawn?.kind !== 'summon') throw new Error('Missing real spirit');
  expect(spawn.unit).toMatchObject({ life: 80, stats: { lifeMax: 128, attack: 0, defense: 10 } });
  expect(damage(out, 'enemy', 'bench')).toBe(200);
  const foreignHits = out.events.filter(
    (e) => e.kind === 'damage' && e.source === 'enemy' && e.target === 'foreign' && !e.dodged
  );
  expect(foreignHits.length).toBeGreaterThan(0);
  expect(foreignHits.every((e) => e.kind === 'damage' && e.amount === 200)).toBe(true);
  for (const id of ['bench', 'foreign']) {
    expect(
      out.events.some((e) => e.kind === 'damage' && e.source === id && e.damageType === 'thorns')
    ).toBe(false);
    expect(
      out.events.some(
        (e) =>
          e.kind === 'status-state' &&
          e.target === id &&
          e.statuses.some((s) => s.id === 'spirit-of-barbs')
      )
    ).toBe(false);
  }
});

it('owner death orphans the real spirit and removes surviving ally chips before recovery', () => {
  const snapshot = input();
  const out = record({
    ...snapshot,
    playerTeam: snapshot.playerTeam.map((u) =>
      u.id === 'hero'
        ? {
            ...u,
            life: 1,
            statuses: [
              ...u.statuses,
              {
                id: 'ignite',
                sourceId: 'enemy',
                stacks: 1,
                remaining: -1,
                expiresAtMs: 1000,
                dotPerStack: 1
              }
            ]
          }
        : u
    )
  });
  const spawn = out.events.find((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs');
  if (spawn?.kind !== 'summon') throw new Error('Missing real spirit');
  expect(out.events).toContainEqual(
    expect.objectContaining({ kind: 'death', target: spawn.unit.id, simClockMs: 1000 })
  );
  expect(out.result.playerTeam.find((u) => u.id === spawn.unit.id)?.life).toBe(0);
  const removal = out.events.findIndex(
    (e) =>
      e.kind === 'status-state' &&
      e.target === 'merc' &&
      e.simClockMs === 1000 &&
      !e.statuses.some((s) => s.id === 'spirit-of-barbs')
  );
  const death = out.events.findIndex((e) => e.kind === 'death' && e.target === 'hero');
  expect(removal).toBeGreaterThan(death);
  expect(
    out.events
      .slice(death + 1, removal)
      .some((e) => e.kind === 'orb' || e.kind === 'heal' || e.kind === 'damage')
  ).toBe(false);
  expect(out.events.some((e) => e.kind === 'damage' && e.damageType === 'thorns')).toBe(false);
});

it('reflects neither magical hits nor lethal physical loss', () => {
  registerSkill({
    id: 'fixture.magic',
    archetype: 'fixture',
    trigger: 'active',
    target: 'all-enemies',
    minLevel: 1,
    cooldown: 60,
    manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'fire', base: [300, 300] }]
  });
  const snapshot = input();
  const magical = record({
    ...snapshot,
    enemyTeam: snapshot.enemyTeam.map((u) => ({ ...u, skillOrder: ['fixture.magic'] }))
  });
  expect(damage(magical, 'enemy', 'hero', 'fire')).toBeGreaterThan(0);
  const magicalTimes = new Set(
    magical.events
      .filter((e) => e.kind === 'damage' && e.damageType === 'fire')
      .map((e) => e.simClockMs)
  );
  // Between magical casts the enemy makes ordinary physical attacks, which may correctly reflect.
  expect(
    magical.events.some(
      (e) => e.kind === 'damage' && e.damageType === 'thorns' && magicalTimes.has(e.simClockMs)
    )
  ).toBe(false);
  const owner = snapshot.playerTeam[0];
  if (!owner) throw new Error('Missing owner');
  const lethal = record({ ...snapshot, playerTeam: [{ ...owner, life: 1 }] });
  expect(lethal.result.playerTeam.find((u) => u.id === 'hero')?.life).toBe(0);
  expect(
    lethal.events.some(
      (e) => e.kind === 'damage' && e.source === 'hero' && e.damageType === 'thorns'
    )
  ).toBe(false);
});

it('refuses an overridden template with a different baseline or an ordinary skill', () => {
  const original = getSummon('spirit_of_barbs');
  if (!original) throw new Error('Missing authored template');
  try {
    for (const invalid of ['stats', 'skill']) {
      registerSummon('spirit_of_barbs', (owner) => {
        const real = original(owner);
        return invalid === 'stats'
          ? { ...real, stats: { ...real.stats, lifeMax: 800 } }
          : { ...real, skillOrder: ['fixture.sweep'] };
      });
      const out = record(input());
      expect(out.events.some((e) => e.kind === 'summon' && e.summonId === 'spirit_of_barbs')).toBe(
        false
      );
      expect(out.events.some((e) => e.kind === 'damage' && e.damageType === 'thorns')).toBe(false);
      expect(damage(out, 'enemy', 'owned')).toBe(200);
    }
  } finally {
    registerSummon('spirit_of_barbs', original);
  }
});
