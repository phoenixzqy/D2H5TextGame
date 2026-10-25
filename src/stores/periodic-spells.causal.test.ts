import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { createRng } from '@/engine/rng';
import { statusActiveAt, rebaseStatusClock } from '@/engine/combat/status';
import { useCombatStore } from './combatStore';
import { payPeriodicSpell } from '@/engine/skills/periodic-spells';
import { projectGovernedActives } from '@/engine/skills/runeword-actives';

const spells = ['blaze', 'fire-wall', 'thunder-storm'] as const;
function marker(id: string, appliedAtMs = 0): ActiveStatus {
  return { id, sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs };
}
function fixture(spell: typeof spells[number], rank = 1, seed = 19): CombatSnapshot {
  const hero = playerToCombatUnit({ ...createMockPlayer('Synthetic periodic spell', 'sorceress'),
    id: 'hero', level: 30, comboOrder: ['skills-sorceress-' + spell], skillLevels: {
      'skills-sorceress-inferno': 1, 'skills-sorceress-blaze': 1,
      'skills-sorceress-fire-wall': 1, 'skills-sorceress-thunder-storm': 1,
      'skills-sorceress-charged-bolt': 1, 'skills-sorceress-lightning': 1,
      'skills-sorceress-chain-lightning': 1, 'skills-sorceress-nova': 1,
      'skills-sorceress-static-field': 1,
      ['skills-sorceress-' + spell]: rank
    } });
  const stats = { ...hero.stats, life: 1000, lifeMax: 1000, mana: 100, manaMax: 100,
    defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, attackSpeed: 200,
    critChance: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };
  const enemy: CombatUnit = { ...hero, id: 'target', name: 'target', kind: 'monster', side: 'enemy',
    stats: { ...stats, lifeMax: 10000 }, life: 10000, mana: 100,
    skillOrder: [], skillLevels: {}, statuses: [marker('stun')], activeBuffIds: [], cooldowns: {} };
  return { seed, playerTeam: [{ ...hero, stats, life: 1000, mana: 100, manaRegenPerSecond: 0,
    statuses: [marker('stun', 901), { ...marker('poison'), dotPerStack: 200, damageType: 'poison' }] }],
    enemyTeam: [enemy] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
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
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, r.events.at(-1)?.simClockMs ?? 0)) : [] }));
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  expect(view(useCombatStore.getState().playerTeam)).toEqual(view(r.result.playerTeam));
  expect(view(useCombatStore.getState().enemyTeam)).toEqual(view(r.result.enemyTeam));
  return r;
}
for (const spell of spells) {
  it(`${spell} continues paid pulses while its caster cannot take another action`, () => {
    const input = fixture(spell), r = record(input);
    expect(r.events.filter(e => e.kind === 'action' && e.actor === 'hero')).toEqual([
      expect.objectContaining({ skillId: 'sorceress.' + spell.replaceAll('-', '_'), simClockMs: 900 })
    ]);
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs))
      .toEqual([900, 1900, 2900]);
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  });

  for (const rank of [1, 2, 20]) it.each([7, 19, 41, 97])(`${spell} exact ordinary seeded pulses/payment at rank${String(rank)}, seed%i`, seed => {
    const random = createRng(seed), expected: { amount: number; crit: boolean; dodged: boolean; simClockMs: number }[] = [];
    const range = spell === 'blaze' ? [60, 85, 5] : spell === 'fire-wall' ? [70, 100, 6] : [70, 110, 7];
    let hasParalyzeCooldown = false;
    for (const simClockMs of [900, 1900, 2900]) {
      const hit = random.chance(.85);
      const amount = hit ? random.nextInt((range[0] ?? 0) + (range[2] ?? 0) * (rank - 1),
        (range[1] ?? 0) + (range[2] ?? 0) * (rank - 1)) : 0;
      if (hit) {
        random.chance(0); // ordinary critical roll
        random.chance(1); // ordinary status chance
        if (spell === 'thunder-storm') {
          if (hasParalyzeCooldown) random.chance(.5);
          hasParalyzeCooldown = true;
        }
      }
      expected.push({ amount, crit: false, dodged: !hit, simClockMs });
    }
    const r = record(fixture(spell, rank, seed));
    expect(r.events.flatMap(e => e.kind === 'damage' && e.source === 'hero'
      ? [{ amount: e.amount, crit: e.crit, dodged: e.dodged, simClockMs: e.simClockMs }] : [])).toEqual(expected);
    expect(r.result.playerTeam[0]?.mana).toBe(100 - (spell === 'blaze' ? 22 : spell === 'fire-wall' ? 25 : 30));
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  });

  it(`${spell} selects all live hostile cells independently on every pulse`, () => {
    const input = fixture(spell), enemy = input.enemyTeam[0];
    if (!enemy) throw new Error('Missing target');
    const r = record({ ...input, enemyTeam: Array.from({ length: 5 }, (_, i) => ({ ...enemy,
      id: 'target-' + String(i), gridPosition: { row: i * 4, col: i % 3 } })) });
    for (const at of [900, 1900, 2900]) expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero' &&
      e.simClockMs === at).map(e => e.kind === 'damage' ? e.target : '')).toEqual(
        Array.from({ length: 5 }, (_, i) => 'target-' + String(i)));
  });

  it(`${spell} continues through Freeze without another action or payment`, () => {
    const input = fixture(spell);
    const r = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      statuses: u.statuses.map(s => s.id === 'stun' ? { ...s, id: 'freeze' } : s) })) });
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs))
      .toEqual([900, 1900, 2900]);
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
  });

  it.each(['rank-zero', 'rank-over-cap', 'wrong-source', 'wrong-duration'] as const)(`${spell} rejects malformed paid %s state`, bad => {
    const input = fixture(spell);
    const r = record({ ...input, playerTeam: input.playerTeam.map(u => {
      const paid = payPeriodicSpell({ ...u, skillOrder: [], statuses: [marker('stun')] }, spell, 1, 0);
      return { ...paid, statuses: paid.statuses.map(s => s.id !== spell ? s : { ...s,
        ...(bad === 'rank-zero' ? { periodicSpell: { rank: 0 } } : {}),
        ...(bad === 'rank-over-cap' ? { periodicSpell: { rank: 21 } } : {}),
        ...(bad === 'wrong-source' ? { sourceId: 'other' } : {}),
        ...(bad === 'wrong-duration' ? { expiresAtMs: 4000 } : {}) }) };
    }) });
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toEqual([]);
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(r.result.playerTeam[0]?.statuses.some(s => s.id === spell)).toBe(false);
  });

  it.each([1000, 1900])(`${spell} stops when periodic source death settles at %ims`, at => {
    const input = fixture(spell), r = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, life: at / 5 })) });
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs)).toEqual([900]);
    expect(r.events.filter(e => e.kind === 'death' && e.target === 'hero')).toEqual([
      expect.objectContaining({ simClockMs: at })]);
    expect(r.result.winner).toBe('enemy');
  });

  it(`${spell} composes ordinary crit, resistance and type-specific flat mitigation`, () => {
    const input = fixture(spell), r = record({ ...input,
      playerTeam: input.playerTeam.map(u => ({ ...u, stats: { ...u.stats, critChance: 1, critDamage: 2 },
        increasedDamagePct: { fire: .5, lightning: .5 } })),
      enemyTeam: input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, defense: spell === 'thunder-storm' ? 99999 : 7, magicResist: 5,
        resistances: { ...u.stats.resistances, fire: 50, lightning: 50 } } })) });
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero' && !e.dodged).every(e => e.kind === 'damage' && e.crit)).toBe(true);
    const oracle = createRng(19);
    expect(oracle.chance(.85)).toBe(true);
    const raw = oracle.nextInt(spell === 'blaze' ? 60 : 70, spell === 'blaze' ? 85 : spell === 'fire-wall' ? 100 : 110);
    expect(r.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({
      amount: Math.floor(raw * 1.5 * 2 * .5 - (spell === 'thunder-storm' ? 5 : 7)), crit: true });
  });

  it(`${spell} never triggers paid cold-armor reactions`, () => {
    const input = fixture(spell), r = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u,
      frozenArmor: { rank: 1, defensePct: .1 }, coldArmors: { 'chilling-armor': { sourceId: u.id, rank: 1 } },
      activeBuffIds: ['chilling-armor'] })) });
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'target')).toEqual([]);
    expect(r.events.filter(e => e.kind === 'status' && e.target === 'hero' && ['chill', 'freeze'].includes(e.statusId))).toEqual([]);
  });

  it(`${spell} exports the paid cooldown when its immediate pulse ends a wave`, () => {
    const input = fixture(spell), r = record({ ...input, enemyTeam: input.enemyTeam.map(u => ({ ...u, life: 1 })) });
    expect(r.result.winner).toBe('player');
    expect(r.result.playerTeam[0]?.cooldowns['sorceress.' + spell.replaceAll('-', '_')])
      .toBe(spell === 'blaze' ? 3000 : 4000);
  });

  it(`${spell} refuses recast while carried paid state is active even with an empty cooldown`, () => {
    const input = fixture(spell), r = record({ ...input, playerTeam: input.playerTeam.map(u =>
      payPeriodicSpell({ ...u, statuses: u.statuses.filter(s => s.id !== 'stun') }, spell, 1, 0)) });
    expect(r.events.filter(e => e.kind === 'action' && e.skillId?.startsWith('sorceress.')).map(e => e.simClockMs))
      .toEqual([3600]);
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType !== 'physical')
      .map(e => e.simClockMs)).toEqual([1000, 2000, 3600, 4600]);
  });

  it(`${spell} carries paid rank and phase without replaying wave-zero`, () => {
    const input = fixture(spell), r = record({ ...input, playerTeam: input.playerTeam.map(u =>
      rebaseStatusClock(payPeriodicSpell({ ...u, skillOrder: [], statuses: [marker('stun'),
        { ...marker('poison'), dotPerStack: 200, damageType: 'poison' }] }, spell, 20, 0), 1000)) });
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs)).toEqual([1000]);
    const oracle = createRng(19);
    expect(oracle.chance(.85)).toBe(true);
    const growth = spell === 'blaze' ? 5 : spell === 'fire-wall' ? 6 : 7;
    const amount = oracle.nextInt((spell === 'blaze' ? 60 : 70) + growth * 19,
      (spell === 'blaze' ? 85 : spell === 'fire-wall' ? 100 : 110) + growth * 19);
    expect(r.events.find(e => e.kind === 'damage' && e.source === 'hero')).toMatchObject({ amount });
  });

  it.each(['no-mana', 'no-rank', 'below-unlock', 'summon', 'bare-marker'] as const)(`${spell} refuses %s authority`, bad => {
    const input = fixture(spell), r = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u,
      ...(bad === 'no-mana' ? { mana: 0 } : {}),
      ...(bad === 'no-rank' ? { skillLevels: {}, periodicSpellRanks: { 'fire-wall': 0, 'thunder-storm': 0 },
        governedActiveRanks: { 'sorceress.blaze': 0, 'sorceress.fire_bolt': 0, 'sorceress.chain_lightning': 0, 'item.redemption': 0 } } : {}),
      ...(bad === 'below-unlock' ? { level: 1 } : {}),
      ...(bad === 'summon' ? { summon: true, kind: 'summon' as const, ownerId: 'hero' } : {}),
      ...(bad === 'bare-marker' ? { skillOrder: [], statuses: [...u.statuses, marker(spell)] } : {})
    })) });
    expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.damageType !== 'physical')).toEqual([]);
  });
}

it('settles all three distinct paid spells together without another cast or payment', () => {
  const input = fixture('blaze');
  const r = record({ ...input, playerTeam: input.playerTeam.map(u => {
    let paid: CombatUnit = { ...u, skillOrder: [], statuses: [marker('stun'),
      { ...marker('poison'), dotPerStack: 200, damageType: 'poison' as const }] };
    for (const spell of spells) paid = { ...payPeriodicSpell(paid, spell, 1, 0), skillOrder: [] };
    return paid;
  }) });
  expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs))
    .toEqual([1000, 1000, 1000, 2000, 2000, 2000]);
  expect(r.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e.damageType] : []))
    .toEqual(['fire', 'fire', 'lightning', 'fire', 'fire', 'lightning']);
  expect(r.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  expect(r.result.playerTeam[0]?.mana).toBe(100);
});

it.each(['hero', 'merc'] as const)('retains governed equipped Blaze authority for a non-Sorceress %s', kind => {
  const input = fixture('blaze'), projection = projectGovernedActives({ owner: kind === 'hero'
    ? { kind, classId: 'amazon', level: 30, learnedRanks: {} } : { kind, level: 30 },
    grants: [{ id: 'skill-blaze', skillId: 'sorceress.blaze', rank: 2 }], storedOrder: [] });
  expect(projection.ranks['sorceress.blaze']).toBe(2);
  const r = record({ ...input, playerTeam: input.playerTeam.map(u => ({ ...u, kind,
    skillLevels: {}, skillOrder: projection.combatOrder, governedActiveRanks: projection.ranks })) });
  expect(r.events.filter(e => e.kind === 'damage' && e.source === 'hero').map(e => e.simClockMs)).toEqual([900, 1900, 2900]);
  expect(r.result.playerTeam[0]?.mana).toBe(78);
});
