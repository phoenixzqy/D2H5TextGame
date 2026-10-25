import { afterEach, beforeEach, expect, it } from 'vitest';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { buildSummon } from '../skills/summons';
import {
  activeDruidForm,
  druidFormBonuses,
  druidFormLifeBonus,
  refreshDruidForm
} from '../skills/druid-shapeshifting';

const stun = { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 };
function unit(id: string, kind: CombatUnit['kind'] = 'hero'): CombatUnit {
  return {
    id,
    name: id,
    side: kind === 'monster' ? 'enemy' : 'player',
    kind,
    level: 30,
    tier: 'trash',
    life: 700,
    mana: 100,
    stats: {
      life: 1000,
      lifeMax: 1000,
      mana: 100,
      manaMax: 100,
      attack: 100,
      defense: 0,
      magicResist: 0,
      attackSpeed: 100,
      critChance: 0,
      critDamage: 1,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    },
    statuses: [stun],
    skillOrder: [],
    activeBuffIds: [],
    cooldowns: {},
    enraged: false
  };
}
function input(oakRank = 20, heartRank = 20): CombatSnapshot {
  const target = unit('target', 'monster');
  return {
    seed: 7,
    playerTeam: [unit('hero'), unit('merc', 'merc')],
    enemyTeam: [{ ...target, life: 1000000, stats: { ...target.stats, lifeMax: 1000000 } }],
    druidAllyAuras: { sourceHeroId: 'hero', fieldedMercCombatId: 'merc', oakRank, heartRank }
  };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot),
    out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  return out;
}
function firstDamage(out: ReturnType<typeof record>, source: string) {
  const hit = out.events.find((e) => e.kind === 'damage' && e.source === source && !e.dodged);
  if (hit?.kind !== 'damage') throw new Error('Missing actual damage from ' + source);
  return hit;
}
beforeEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

it.each([1, 20])(
  'Oak rank%s gives only the original living party capacity without healing, including controlled owners',
  (rank) => {
    const owned = {
      ...unit('owned', 'summon'),
      summon: true,
      summonOwnerId: 'hero',
      ownerId: 'hero'
    };
    const out = record({
      ...input(rank),
      playerTeam: [
        unit('hero'),
        unit('merc', 'merc'),
        owned,
        unit('bench', 'merc'),
        { ...owned, id: 'foreign', summonOwnerId: 'other', ownerId: 'other' },
        { ...owned, id: 'forged', ownerId: 'other' },
        { ...unit('dead', 'merc'), life: 0 }
      ]
    });
    const max = 1000 + 30 * rank;
    expect(out.result.playerTeam.map((u) => u.stats.lifeMax)).toEqual([
      max,
      max,
      max,
      1000,
      1000,
      1000,
      1000
    ]);
    expect(out.result.playerTeam.map((u) => u.life)).toEqual([700, 700, 700, 700, 700, 700, 0]);
    expect(out.events.some((e) => e.kind === 'heal' || e.kind === 'action')).toBe(false);
    expect(out.events.slice(0, 8).every((e) => e.kind === 'status-state' && e.initial)).toBe(true);
  }
);

it('real healing and HP orbs use Oak capacity without new orb RNG', () => {
  registerSkill({
    id: 'fixture.heal',
    archetype: 'fixture',
    target: 'self',
    minLevel: 1,
    cooldown: 60,
    manaCost: 0,
    effects: [{ kind: 'heal', target: 'self', pctOfMaxLife: 0.5 }]
  });
  const hero = { ...unit('hero'), life: 700, statuses: [], skillOrder: ['fixture.heal'] };
  const healed = record({ ...input(), playerTeam: [hero] });
  expect(healed.result.playerTeam[0]?.life).toBe(1500);
  expect(healed.events.filter((e) => e.kind === 'heal')).toEqual([
    expect.objectContaining({ target: 'hero', amount: 800 })
  ]);
  const dot = {
    id: 'ignite',
    sourceId: 'hero',
    stacks: 1,
    remaining: -1,
    expiresAtMs: 1000,
    dotPerStack: 1
  };
  const snapshot = {
    ...input(),
    playerTeam: [{ ...unit('hero'), life: 100 }],
    enemyTeam: [
      { ...unit('body', 'monster'), tier: 'elite' as const, life: 1, statuses: [stun, dot] },
      ...input().enemyTeam
    ]
  };
  const { druidAllyAuras: _aura, ...none } = snapshot;
  const enabled = record(snapshot),
    control = record(none);
  expect(enabled.result.playerTeam[0]?.life).toBe(180);
  expect(control.result.playerTeam[0]?.life).toBe(150);
  expect(enabled.events.filter((e) => e.kind === 'orb')).toEqual(
    control.events.filter((e) => e.kind === 'orb')
  );
});

it('removes Oak before simultaneous source/enemy-death orb recovery and clears surviving merc chips', () => {
  const dot = {
    id: 'ignite',
    sourceId: 'fixture',
    stacks: 1,
    remaining: -1,
    expiresAtMs: 1000,
    dotPerStack: 1
  };
  const out = record({
    ...input(),
    playerTeam: [
      { ...unit('hero'), life: 1, statuses: [stun, dot] },
      { ...unit('merc', 'merc'), life: 900 }
    ],
    enemyTeam: [
      { ...unit('body', 'monster'), tier: 'elite', life: 1, statuses: [stun, dot] },
      ...input().enemyTeam
    ]
  });
  expect(out.result.playerTeam[1]).toMatchObject({ life: 950, stats: { lifeMax: 1000 } });
  const cap = out.events.findIndex(
    (e) => e.kind === 'life-capacity' && e.target === 'merc' && e.lifeMax === 1000
  );
  const orb = out.events.findIndex(
    (e) => e.kind === 'orb' && e.target === 'merc' && e.orb.kind === 'hp'
  );
  expect(cap).toBeGreaterThanOrEqual(0);
  expect(orb).toBeGreaterThan(cap);
  const views = out.events.filter((e) => e.kind === 'status-state' && e.target === 'merc');
  const initial = views[0];
  if (initial?.kind !== 'status-state') throw new Error('Missing initial allied status view');
  for (const id of ['oak-sage', 'heart-of-wolverine'])
    expect(initial.statuses).toContainEqual(
      expect.objectContaining({ id, sourceId: 'hero', remaining: -1 })
    );
  expect(views.at(-1)).toMatchObject({ simClockMs: 1000, statuses: [stun] });
  expect(out.result.playerTeam[1]?.statuses).toEqual([stun]); // presentation never grants runtime authority
});

it('adds form and Oak over one base, preserves HP above either partial cap and never compounds carry', () => {
  const hero = refreshDruidForm(
    {
      ...unit('hero'),
      druidShapeRanks: { werewolf: 20, werebear: 20, lycanthropy: 20 },
      skillOrder: ['druid.werewolf']
    },
    'werewolf'
  );
  const first = record({ ...input(), playerTeam: [{ ...hero, life: 1700 }] });
  expect(first.result.playerTeam[0]).toMatchObject({
    life: 1700,
    stats: { lifeMax: 2200 },
    druidFormLife: { baseLifeMax: 1000, appliedLifeMax: 1600 },
    vigorLife: { baseLifeMax: 1600, appliedLifeMax: 2200 }
  });
  const second = record({ ...input(), playerTeam: first.result.playerTeam });
  expect(second.result.playerTeam).toEqual(first.result.playerTeam);
  const lower = record({ ...input(1), playerTeam: first.result.playerTeam });
  expect(lower.result.playerTeam[0]).toMatchObject({ life: 1630, stats: { lifeMax: 1630 } });
  const { druidAllyAuras: _aura, ...none } = input();
  expect(
    record({ ...none, playerTeam: first.result.playerTeam }).result.playerTeam[0]
  ).toMatchObject({ life: 1600, stats: { lifeMax: 1600 } });
});

it('retains only authenticated paid capacity after death, with no active form bonuses', () => {
  const bear = refreshDruidForm(
    {
      ...unit('hero'),
      druidShapeRanks: { werewolf: 0, werebear: 20, lycanthropy: 1 },
      skillOrder: ['druid.werebear']
    },
    'werebear'
  );
  const dead = { ...bear, life: 0 };
  expect(activeDruidForm(dead)).toBeUndefined();
  expect(druidFormBonuses(dead)).toEqual({
    lifePct: 0,
    attackSpeedPct: 0,
    physDodgePct: 0,
    defensePct: 0
  });
  expect(druidFormLifeBonus(dead)).toEqual({ coefficient: 0.025, rank: 20 });
  expect(druidFormLifeBonus({ ...dead, id: 'forged' })).toBeUndefined();
  expect(druidFormLifeBonus({ ...dead, kind: 'merc' })).toBeUndefined();
});

it.each([1, 20])(
  'Heart rank%s changes hero/merc/owned-summon actual Attack, preserving base stats and draw order',
  (rank) => {
    const owned = { ...unit('owned', 'summon'), summon: true, summonOwnerId: 'hero' };
    const team = [unit('hero'), unit('merc', 'merc'), owned, unit('bench', 'merc')].map((u) => ({
      ...u,
      statuses: []
    }));
    const out = record({ ...input(1, rank), playerTeam: team });
    const control = record({ ...input(1, 0), playerTeam: team });
    for (const id of ['hero', 'merc', 'owned']) {
      expect(firstDamage(out, id).amount).toBe(100 + rank * 3);
      expect(firstDamage(control, id).amount).toBe(100);
    }
    expect(firstDamage(out, 'bench').amount).toBe(100);
    if (rank === 20) {
      expect(out.events.some((e) => e.kind === 'damage' && e.crit)).toBe(true);
      expect(control.events.some((e) => e.kind === 'damage' && e.crit)).toBe(false);
    }
    expect(out.result.playerTeam.map((u) => u.stats.attack)).toEqual([100, 100, 100, 100]);
    const draws = (r: typeof out) =>
      r.events
        .filter((e) => e.kind === 'damage')
        .map((e) => [e.source, e.target, e.dodged, e.simClockMs]);
    expect(draws(out)).toEqual(draws(control));
    expect(out.events.some((e) => e.kind === 'action' && e.skillId?.includes('wolverine'))).toBe(
      false
    );
  }
);

it('Heart uses the existing critical roll/overflow but leaves fixed authored damage independent of Attack', () => {
  registerSkill({
    id: 'fixture.fixed',
    archetype: 'fixture',
    target: 'single-enemy',
    minLevel: 1,
    cooldown: 1,
    manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100] }]
  });
  const hero = {
    ...unit('hero'),
    statuses: [],
    skillOrder: ['fixture.fixed'],
    stats: { ...unit('hero').stats, critChance: 1, critDamage: 2 }
  };
  const control = record({ ...input(1, 0), playerTeam: [hero] }),
    out = record({ ...input(1, 20), playerTeam: [hero] });
  expect(firstDamage(control, 'hero')).toMatchObject({ amount: 200, crit: true });
  expect(firstDamage(out, 'hero')).toMatchObject({ amount: 204, crit: true }); // floor(100 * (2 + .1/2)), IEEE pipeline retained
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.dodged)).toEqual(
    control.events.filter((e) => e.kind === 'damage').map((e) => e.dodged)
  );
});

it('Heart applies Attack scaling to real ranged skills without scaling their fixed base', () => {
  const merc = { ...unit('merc', 'merc'), statuses: [], skillOrder: ['mskill-basic-arrow'] };
  const control = record({ ...input(1, 0), playerTeam: [unit('hero'), merc] });
  const enabled = record({ ...input(1, 20), playerTeam: [unit('hero'), merc] });
  expect(firstDamage(control, 'merc').amount).toBe(116);
  expect(firstDamage(enabled, 'merc').amount).toBe(176);
});

it('new real prepared summons expose committed Oak capacity in spawn events without HP refill', () => {
  const hero = { ...unit('hero'), skillOrder: ['druid.raven'], skillLevels: { 'druid.raven': 1 } };
  const bare = buildSummon(hero, 'raven');
  if (!bare) throw new Error('Missing actual Raven template');
  const out = record({ ...input(), playerTeam: [hero] });
  const spawn = out.events.find((e) => e.kind === 'summon');
  if (spawn?.kind !== 'summon') throw new Error('Missing paid Raven spawn');
  const expected = bare.stats.lifeMax + Math.floor((bare.stats.lifeMax * 60) / 100);
  expect(spawn.unit).toMatchObject({ life: bare.life, stats: { lifeMax: expected } });
  expect(out.result.playerTeam.find((u) => u.id === spawn.unit.id)?.stats.lifeMax).toBe(expected);
  const observed = out.events.find((e) => e.kind === 'status-state' && e.target === spawn.unit.id);
  if (observed?.kind !== 'status-state') throw new Error('Missing spawned allied aura observation');
  expect(observed.statuses).toContainEqual(
    expect.objectContaining({ id: 'oak-sage', sourceId: 'hero' })
  );
});

it('settles form, Oak and selected Vigor as independently floored bonuses over one base', () => {
  const hero = refreshDruidForm(
    {
      ...unit('hero'),
      druidShapeRanks: { werewolf: 20, werebear: 0, lycanthropy: 20 },
      skillOrder: ['druid.werewolf']
    },
    'werewolf'
  );
  const out = record({
    ...input(),
    playerTeam: [{ ...hero, life: 2300 }],
    statAura: {
      selectedAuraId: 'paladin.vigor',
      sourceHeroId: 'hero',
      rank: 20,
      maxRank: 20,
      bonuses: { lifePct: 0.4, attackSpeedPct: 0.1 }
    }
  });
  expect(out.result.playerTeam[0]).toMatchObject({
    life: 2300,
    stats: { lifeMax: 2600 },
    druidFormLife: { baseLifeMax: 1000, appliedLifeMax: 1600 },
    vigorLife: { baseLifeMax: 1600, appliedLifeMax: 2600 }
  });
});
