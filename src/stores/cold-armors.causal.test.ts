import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { createRng } from '@/engine/rng';
import { statusActiveAt } from '@/engine/combat/status';
import { useCombatStore } from './combatStore';
import { payColdArmor } from '@/engine/skills/cold-armors';

const ids = ['shiver-armor', 'chilling-armor'] as const;
function marker(id: string, appliedAtMs = 0): ActiveStatus {
  return { id, sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs };
}
function fixture(slug: typeof ids[number], rank = 1, seed = 7): CombatSnapshot {
  const hero = playerToCombatUnit({ ...createMockPlayer('Synthetic cold armor', 'sorceress'),
    id: 'hero', level: 30, comboOrder: ['skills-sorceress-' + slug], skillLevels: {
      'skills-sorceress-frozen-armor': 1, 'skills-sorceress-shiver-armor': 1,
      ['skills-sorceress-' + slug]: rank
    } });
  const stats = { ...hero.stats, life: 1000, lifeMax: 1000, mana: 100, manaMax: 100,
    defense: 20, magicResist: 0, physDodge: 0, magicDodge: 0, attackSpeed: 200,
    critChance: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };
  const enemy: CombatUnit = { ...hero, id: 'attacker', name: 'attacker', kind: 'monster', side: 'enemy',
    tier: 'trash', stats: { ...stats, attackSpeed: 100 }, life: 1000, mana: 100,
    skillOrder: ['fixture.cold-armor-hit'], skillLevels: {}, statuses: [marker('stun', 1701), {
      ...marker('poison'), dotPerStack: 300, damageType: 'poison'
    }], activeBuffIds: [], cooldowns: {} };
  return { seed, playerTeam: [{ ...hero, stats, life: 1000, mana: 100,
    manaRegenPerSecond: 0, statuses: [marker('stun', 901)] }], enemyTeam: [enemy] };
}
beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  registerSkill({ id: 'fixture.cold-armor-hit', archetype: 'fixture', target: 'single-enemy',
    minLevel: 1, manaCost: 0, cooldown: 100,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100] }] });
});
afterEach(() => { useCombatStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });
function record(input: CombatSnapshot) {
  const before = structuredClone(input), r = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(r.result);
  expect(runBattleRecorded(input)).toEqual(r);
  useCombatStore.getState().setRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
    unitNameMap: new Map([...input.playerTeam, ...input.enemyTeam].map(u => [u.id, u.name])),
    events: r.events, outcome: { winner: r.result.winner, finalPlayerTeam: r.result.playerTeam,
      finalEnemyTeam: r.result.enemyTeam } });
  for (const _event of r.events) useCombatStore.getState().advanceEvent();
  const teams = useCombatStore.getState();
  expect(teams.playbackComplete).toBe(true);
  const clock = r.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(r.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(r.result.enemyTeam));
  return r;
}
for (const slug of ids) {
  it(`makes a legal native paid ${slug} protect and attempt a counter; seed7's counter misses`, () => {
    const input = fixture(slug), r = record(input);
    expect(r.events.filter(e => e.kind === 'action' && e.actor === input.playerTeam[0]?.id)).toEqual([
      expect.objectContaining({ skillId: 'sorceress.' + slug.replaceAll('-', '_'), simClockMs: 900 })
    ]);
    expect(r.events.find(e => e.kind === 'damage' && e.target === input.playerTeam[0]?.id))
      .toMatchObject({ amount: 79, simClockMs: 1700 });
    expect(r.events.filter(e => e.kind === 'damage' && e.target === 'attacker')).toEqual([
      expect.objectContaining({ source: 'hero', damageType: 'cold', amount: 0, dodged: true, simClockMs: 1700 })
    ]);
    expect(r.events.filter(e => e.kind === 'status' && e.statusId === 'freeze')).toEqual([]);
  });

  for (const rank of [1, 2, 20]) it.each([7, 19, 41, 97])(`${slug} rank${String(rank)} exact seeded damage/payment, seed%i`, seed => {
    const input = fixture(slug, rank, seed), random = createRng(seed);
    const landed = random.chance(.85);
    if (landed) random.chance(0);
    const retaliates = landed && random.chance(.85);
    const range = slug === 'shiver-armor' ? [12, 18, 3] : [24, 36, 4];
    const lo = (range[0] ?? 0) + (range[2] ?? 0) * (rank - 1), hi = (range[1] ?? 0) + (range[2] ?? 0) * (rank - 1);
    const raw = retaliates ? random.nextInt(lo, hi) : 0;
    const incoming = landed ? Math.floor(100 - 20 * (1 + rank * (slug === 'shiver-armor' ? .035 : .04))) : 0;
    const amount = retaliates ? Math.floor(raw * (1 + (slug === 'shiver-armor' ? rank * .01 : 0))) : 0;
    const r = record(input);
    expect(r.events.filter(e => e.kind === 'damage' && e.target === 'hero')).toEqual([
      expect.objectContaining({ amount: incoming, dodged: !landed, crit: false, simClockMs: 1700 })
    ]);
    expect(r.events.filter(e => e.kind === 'damage' && e.target === 'attacker')).toEqual(landed ? [
      expect.objectContaining({ amount, dodged: !retaliates, crit: false, simClockMs: 1700 })
    ] : []);
    expect(r.events.filter(e => e.kind === 'status' && e.statusId === 'freeze')).toHaveLength(retaliates ? 1 : 0);
    expect(r.result.playerTeam[0]?.mana).toBe(100 - Math.round((slug === 'shiver-armor' ? 11 : 15) - .1 * (rank - 1)));
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(r.result.playerTeam[0]?.coldArmors?.[slug]).toEqual({ sourceId: 'hero', rank });
    expect(r.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
    expect(r.result.playerTeam[0]?.life).toBe(1000 - incoming);
  });

  it.each(['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(`${slug} trigger for direct %s`, type => {
    registerSkill({ id: 'fixture.cold-armor-hit', archetype: 'fixture', target: 'single-enemy',
      minLevel: 1, manaCost: 0, cooldown: 100,
      effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
    const r = record(fixture(slug, 1, 19));
    const qualifies = slug === 'chilling-armor' || type === 'physical';
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(qualifies ? 1 : 0);
    expect(r.events.filter(e => e.kind === 'status' && e.statusId === 'freeze')).toHaveLength(qualifies ? 1 : 0);
  });

  it.each(['trash', 'boss', 'chapter-boss'] as const)(`${slug} canonical Freeze duration for %s`, tier => {
    const input = fixture(slug, 1, 19);
    const r = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, tier,
      stats: { ...u.stats, lifeMax: 610 }, life: 610 })) });
    // Poison closes the recording while Freeze remains active, including boss orb settlement.
    const status = r.result.enemyTeam[0]?.statuses.find(s => s.id === 'freeze');
    expect(status).toMatchObject({ sourceId: 'hero', appliedAtMs: 1700,
      expiresAtMs: tier === 'trash' ? 2700 : 2200 });
  });

  it(`${slug} mitigates its counter with Cold resistance and MR, preserving Defense independence`, () => {
    const input = fixture(slug, 20, 19);
    const r = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats,
      defense: 9999, magicResist: 5, resistances: { ...u.stats.resistances, cold: 50 } } })) });
    // Seed19: incoming hit/crit, counter hit, inclusive base at .7569362374, noncrit.
    const raw = slug === 'shiver-armor' ? 74 : 109;
    const amount = Math.floor(raw * (slug === 'shiver-armor' ? 1.2 : 1) * .5 - 5);
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([
      expect.objectContaining({ amount, damageType: 'cold', crit: false, dodged: false })
    ]);
  });

  it(`${slug} retaliates on a fully absorbed incoming hit`, () => {
    const input = fixture(slug, 1, 19);
    const r = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [...u.statuses,
      { id: 'bone-armor', sourceId: u.id, stacks: 1, remaining: -1, boneArmor: { rank: 20, remaining: 100 } }
    ] })) });
    expect(r.events.filter(e => e.kind === 'damage' && e.target === 'hero')).toEqual([
      expect.objectContaining({ amount: 0, absorbed: 79 })
    ]);
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(1);
    expect(r.result.playerTeam[0]?.life).toBe(1000);
  });

  it(`${slug} settles a counter on a lethal wearer hit without resurrection or repeat death`, () => {
    const input = fixture(slug, 1, 19);
    const r = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, life: 1 })) });
    expect(r.result.winner).toBe('enemy');
    expect(r.result.playerTeam[0]?.life).toBe(0);
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(1);
    expect(r.events.filter(e => e.kind === 'death' && e.target === 'hero')).toHaveLength(1);
  });

  it(`${slug} kills the original attacker once and closes ordinary boss orbs/corpse supply`, () => {
    const input = fixture(slug, 20, 19);
    const r = record({ ...input, corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }],
      enemyTeam: input.enemyTeam.map(u => ({ ...u, tier: 'boss', life: 1,
        statuses: [marker('stun', 1701)] })) });
    expect(r.result.winner).toBe('player');
    expect(r.events.filter(e => e.kind === 'death')).toEqual([expect.objectContaining({ target: 'attacker', simClockMs: 1700 })]);
    expect(r.events.filter(e => e.kind === 'orb')).toHaveLength(2);
    expect(r.events.filter(e => e.kind === 'message' && e.messageKey === 'combat:corpses.available'))
      .toEqual([expect.objectContaining({ params: { count: 1 } })]);
  });

  it(`${slug} neither grants effects from a bare marker nor lets it block payment`, () => {
    const input = fixture(slug, 1, 19);
    const bare = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, skillOrder: [],
      statuses: [marker('stun')], activeBuffIds: [slug] })) });
    expect(bare.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([]);
    expect(bare.events.find(e => e.kind === 'damage' && e.target === 'hero')).toMatchObject({ amount: 80 });
    const paid = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, activeBuffIds: [slug] })) });
    expect(paid.result.playerTeam[0]?.coldArmors?.[slug]).toEqual({ sourceId: 'hero', rank: 1 });
    expect(paid.result.playerTeam[0]?.activeBuffIds).toEqual([slug]);
  });

  it(`${slug} refuses insufficient MP, cooldown and unallocated native authority without charging`, () => {
    const input = fixture(slug, 1, 19), canonical = 'sorceress.' + slug.replaceAll('-', '_');
    for (const patch of [{ mana: 0 }, { cooldowns: { [canonical]: 100_000 } },
      { coldArmorRanks: { 'shiver-armor': 0, 'chilling-armor': 0 } }]) {
      const r = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, ...patch })) });
      expect(r.events.filter(e => e.kind === 'buff' || e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
      expect(r.result.playerTeam[0]?.coldArmors).toBeUndefined();
    }
  });

  it(`${slug} ignores periodic damage and cannot trigger Frozen/Cold Armor reaction loops`, () => {
    const input = fixture(slug, 1, 19);
    const noHit = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, statuses: [marker('stun'),
      { ...marker('poison'), dotPerStack: 300, damageType: 'poison' }] })),
      playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [...u.statuses,
        { ...marker('poison'), dotPerStack: 10, damageType: 'poison' }] })) });
    expect(noHit.events.filter(e => e.kind === 'dot' && e.target === 'hero').length).toBeGreaterThan(0);
    expect(noHit.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([]);
    const guarded = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...payColdArmor(u, 'chilling-armor', 20),
      frozenArmor: { rank: 20, defensePct: .6 } })) });
    expect(guarded.events.filter(e => e.kind === 'damage')).toHaveLength(2);
    expect(guarded.events.filter(e => e.kind === 'status' && e.statusId === 'chill')).toEqual([]);
  });

  it(`${slug} casts once through multiple opportunities and an expired cooldown`, () => {
    const input = fixture(slug, 1, 19);
    const r = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, statuses: [] })),
      enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 10000, stats: { ...u.stats, lifeMax: 10000 },
        statuses: [marker('stun'), { ...marker('poison'), dotPerStack: 1000, damageType: 'poison' }] })) });
    expect(r.events.filter(e => e.kind === 'action' && e.actor === 'hero').length).toBeGreaterThan(5);
    expect(r.events.filter(e => e.kind === 'buff' && e.buffId === slug)).toHaveLength(1);
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(r.result.playerTeam[0]?.cooldowns).not.toHaveProperty('sorceress.' + slug.replaceAll('-', '_'));
  });
}
it('composes all three paid ice armors without switching/recasting and keeps distinct ordered counters', () => {
  const input = fixture('chilling-armor', 20, 19);
  const r = record({ ...input, playerTeam: input.playerTeam.map(u => ({
    ...payColdArmor(payColdArmor(u, 'shiver-armor', 20), 'chilling-armor', 20), skillOrder: [],
    frozenArmor: { rank: 20, defensePct: .6 }, activeBuffIds: ['shiver-armor', 'chilling-armor', 'frozen-armor'],
    statuses: [marker('stun')]
  })) });
  expect(r.events.filter(e => e.kind === 'damage' && e.target === 'hero')).toEqual([
    expect.objectContaining({ amount: 38, simClockMs: 1700 })
  ]);
  expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(2);
  expect(r.events.filter(e => e.kind === 'buff' || e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(r.result.playerTeam[0]?.coldArmors).toEqual({ 'shiver-armor': { sourceId: 'hero', rank: 20 },
    'chilling-armor': { sourceId: 'hero', rank: 20 } });
});
it('projects Chilling magic dodge into the existing hit pool without changing physical dodge', () => {
  const input = fixture('chilling-armor', 20, 97);
  registerSkill({ id: 'fixture.cold-armor-hit', archetype: 'fixture', target: 'single-enemy',
    minLevel: 1, manaCost: 0, cooldown: 100,
    effects: [{ kind: 'damage', damageType: 'arcane', base: [100, 100] }] });
  // Seed97's first draw .56558 lands at .65 but misses at .55.
  const r = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
    stats: { ...u.stats, magicDodge: .1 } })) });
  expect(r.events.filter(e => e.kind === 'damage')).toEqual([
    expect.objectContaining({ target: 'hero', dodged: true, amount: 0 })
  ]);
});
