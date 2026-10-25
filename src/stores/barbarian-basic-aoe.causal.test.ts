import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/barbarian.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { statusActiveAt } from '@/engine/combat/status';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const attacks = [
  { slug: 'bash', min: 50, max: 70, growth: 5, cost: 5 },
  { slug: 'whirlwind', min: 60, max: 90, growth: 6, cost: 25 },
  { slug: 'leap-attack', min: 70, max: 100, growth: 7, cost: 20 },
  { slug: 'war-cry', min: 30, max: 50, growth: 3, cost: 30 }
] as const;
type Attack = typeof attacks[number];
const hold = (at = 0): ActiveStatus => ({ id: 'stun', sourceId: 'synthetic-hold', stacks: 1, remaining: -1, appliedAtMs: at });
function allocations(slug: Attack['slug'], rank: number) {
  const levels: Record<string, number> = {};
  function add(id: string) {
    const row = rows.find(s => s.id === id);
    if (!row) throw new Error('Missing native attack prerequisite');
    levels[id] = 1;
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
  }
  add('skills-barbarian-' + slug); levels['skills-barbarian-' + slug] = rank;
  return levels;
}
/** Legal native configuration with explicitly synthetic pools/stats and a one-cast hold. */
function fixture(skill: Attack, rank = 1, seed = 7, count = 3): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Synthetic Barbarian AOE', 'barbarian'),
    id: 'hero', level: 30, skillLevels: allocations(skill.slug, rank), comboOrder: ['skills-barbarian-' + skill.slug] });
  const hero: CombatUnit = { ...native, life: 1000000, mana: 100, statuses: [hold(1701)],
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 1000000, manaMax: 100, attack: 100, attackSpeed: 100,
      defense: 0, magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed, playerTeam: [hero], enemyTeam: Array.from({ length: count }, (_, n) => ({ ...hero,
    id: 'enemy-' + String(n), side: 'enemy', kind: 'monster', skillOrder: [], skillLevels: {}, statuses: [],
    stats: { ...hero.stats, attackSpeed: 50 } })) };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out); expect(runBattle(input)).toEqual(out.result);
  const authority = stageStatusPlayback(input.playerTeam, input.enemyTeam, out.events);
  let teams: PlaybackStepResult = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam,
    ...(authority ? { statusPlayback: authority } : {}) };
  for (const event of out.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event, teams.statusPlayback);
  const clock = out.events.at(-1)?.simClockMs ?? 0;
  const view = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    statuses: u.life > 0 ? u.statuses.filter(s => statusActiveAt(s, clock)) : [] }));
  expect(view(teams.playerTeam)).toEqual(view(out.result.playerTeam));
  expect(view(teams.enemyTeam)).toEqual(view(out.result.enemyTeam));
  return out;
}
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useFormationStore.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

for (const skill of attacks) {
  it.each([1, 2, 20])(`${skill.slug} rank%i pays once and damages each selected living hostile at most once`, rank => {
    for (const count of [1, 3, 9]) for (const seed of [7, 19, 41, 97]) {
      const input = fixture(skill, rank, seed, count), out = record(input);
      const hits = out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
      expect(hits).toHaveLength(skill.slug === 'bash' ? 1 : count);
      expect(new Set(hits.map(e => e.target)).size).toBe(hits.length);
      expect(hits.every(e => e.simClockMs === 1700 && e.damageType === 'physical')).toBe(true);
      for (const hit of hits) {
        if (hit.dodged) expect(hit.amount).toBe(0);
        else {
          expect(hit.amount).toBeGreaterThanOrEqual(skill.min + skill.growth * (rank - 1));
          expect(hit.amount).toBeLessThanOrEqual(skill.max + skill.growth * (rank - 1));
        }
      }
      for (const enemy of out.result.enemyTeam)
        expect(enemy.life).toBe(1000000 - hits.filter(h => h.target === enemy.id).reduce((sum, h) => sum + h.amount, 0));
      expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
      expect(out.result.playerTeam[0]?.mana).toBe(100 - skill.cost);
    }
  });

  it(`${skill.slug} refuses insufficient MP and an active cooldown before payment`, () => {
    for (const patch of [{ mana: skill.cost - 1 }, { cooldowns: { ['barbarian.' + skill.slug.replaceAll('-', '_')]: 100000 } }]) {
      const base = fixture(skill), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u, ...patch })) });
      expect(out.events.some(e => e.kind === 'action' && e.skillId === 'barbarian.' + skill.slug.replaceAll('-', '_'))).toBe(false);
      expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
    }
  });
  it(`${skill.slug} applies Physical increases, criticals, flat Defense and resistance to actual HP loss`, () => {
    const base = fixture(skill, 2, 7, 1), plain = record(base);
    const hits = (out: typeof plain) => out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
    expect(hits(plain)[0]?.dodged).toBe(false);
    const defended = record({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, defense: 10 } })) });
    expect(hits(defended).map(h => h.amount)).toEqual(hits(plain).map(h => h.amount - 10));
    const resistant = record({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u,
      stats: { ...u.stats, resistances: { ...u.stats.resistances, physical: 50 } } })) });
    expect(hits(resistant).map(h => h.amount)).toEqual(hits(plain).map(h => Math.floor(h.amount / 2)));
    const critical = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
      increasedDamagePct: { physical: .5 }, stats: { ...u.stats, critChance: 1 } })) });
    expect(hits(critical)[0]?.crit).toBe(true);
    expect(hits(critical).map(h => h.amount)).toEqual(hits(plain).map(h => h.amount * 3));
  });
  it(`${skill.slug} excludes dead bodies and friendly mercs from its target pool`, () => {
    const base = fixture(skill), hero = base.playerTeam[0];
    if (!hero) throw new Error('Missing native hero');
    const out = record({ ...base, playerTeam: [hero, { ...hero, id: 'friend', kind: 'merc',
      skillOrder: [], skillLevels: {}, statuses: [hold()] }],
    enemyTeam: base.enemyTeam.map((u, i) => i === 0 ? { ...u, life: 0 } : u) });
    const hits = out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
    expect(hits).toHaveLength(skill.slug === 'bash' ? 1 : 2);
    expect(hits.every(e => e.target !== 'friend' && e.target !== 'enemy-0')).toBe(true);
    const incoming = out.events.flatMap(e => e.kind === 'damage' && e.target === 'friend' ? [e] : []);
    expect(incoming.every(e => e.source.startsWith('enemy-'))).toBe(true);
    expect(out.result.playerTeam.find(u => u.id === 'friend')?.life)
      .toBe(1000000 - incoming.reduce((sum, e) => sum + e.amount, 0));
  });
  it(`${skill.slug} stops all remaining resolution when lethal reflection kills the caster`, () => {
    const base = fixture(skill), out = record({ ...base,
      playerTeam: base.playerTeam.map(u => ({ ...u, life: 20 })),
      enemyTeam: base.enemyTeam.map(u => ({ ...u, physicalReflectionPct: 1 })) });
    expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.life).toBe(0);
    expect(out.result.enemyTeam.filter(u => u.life === 1000000)).toHaveLength(2);
  });
  it(`${skill.slug} requires native class/unlock/prerequisite/capped-rank authority and accepts a legal alias`, () => {
    const id = 'skills-barbarian-' + skill.slug, canonical = 'barbarian.' + skill.slug.replaceAll('-', '_');
    const row = rows.find(s => s.id === id);
    if (!row) throw new Error('Missing native attack');
    const owner = { ...createMockPlayer('Synthetic native refusal', 'barbarian'),
      level: 30, skillLevels: allocations(skill.slug, 1), comboOrder: [id] };
    const patches = [{ class: 'sorceress' as const }, { level: row.requiredLevel - 1 },
      { skillLevels: {} }, { skillLevels: { ...owner.skillLevels, [id]: 21 } },
      ...(row.prerequisites?.length ? [{ skillLevels: { [id]: 1 } }] : [])];
    for (const patch of patches) {
      const native = playerToCombatUnit({ ...owner, ...patch }), base = fixture(skill);
      expect(native.skillOrder).toEqual([]);
      if (!native.skillLevels) throw new Error('Missing native allocation projection');
      const skillLevels = native.skillLevels;
      const out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
        skillOrder: native.skillOrder, skillLevels })) });
      expect(out.events.some(e => e.kind === 'action' && e.skillId === canonical)).toBe(false);
      expect(out.events.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(false);
    }
    const alias = playerToCombatUnit({ ...owner, skillLevels: { ...owner.skillLevels, [id]: 0, [canonical]: 20 }, comboOrder: [canonical] });
    expect(alias.skillOrder).toEqual([canonical]); expect(alias.skillLevels?.[canonical]).toBe(20);
  });
}

for (const skill of attacks.filter(s => s.slug === 'leap-attack' || s.slug === 'war-cry')) {
  for (const tier of ['trash', 'boss'] as const) {
    it.each([1, 2, 20])(`${skill.slug} rank%i actually interrupts ${tier} actions with exact on-hit Stun`, rank => {
      let landed = 0, misses = 0;
      for (const seed of [7, 19, 41, 97]) {
        const base = fixture(skill, rank, seed), expiry = tier === 'boss' ? 2200 : 2700;
        const out = record({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, tier,
          stats: { ...u.stats, attackSpeed: 250 } })) });
        const hits = out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
        expect(hits).toHaveLength(3);
        for (const hit of hits) {
          if (hit.dodged) {
            misses++;
            expect(out.events.some(e => e.kind === 'status' && e.statusId === 'stun' && e.target === hit.target)).toBe(false);
          } else {
            landed++;
            const applied = out.events.find(e => e.kind === 'status-state' && e.target === hit.target && e.simClockMs === 1700);
            expect(applied?.kind === 'status-state' ? applied.statuses.find(s => s.id === 'stun') : undefined)
              .toMatchObject({ appliedAtMs: 1700, expiresAtMs: expiry });
            expect(out.events.some(e => e.kind === 'stunned' && e.target === hit.target && e.simClockMs > 1700 && e.simClockMs < expiry)).toBe(true);
            const removed = out.events.find(e => e.kind === 'status-state' && e.target === hit.target && e.simClockMs === expiry);
            expect(removed?.kind).toBe('status-state');
            if (removed?.kind === 'status-state') expect(removed.statuses.some(s => s.id === 'stun')).toBe(false);
            expect(out.events.some(e => e.kind === 'action' && e.actor === hit.target && e.simClockMs >= expiry)).toBe(true);
          }
        }
      }
      expect(landed).toBeGreaterThan(0); expect(misses).toBeGreaterThan(0);
    });
  }
}

for (const status of ['chill', 'ignite'] as const) for (const tier of ['trash', 'boss'] as const) {
  it(`Whirlwind uses the shared Physical ${status} combo and ${tier} scaling`, () => {
    const base = fixture(attacks[1], 1, 7, 1), typed = { ...base,
      enemyTeam: base.enemyTeam.map(u => ({ ...u, tier })) }, plain = record(typed);
    const enhanced = record({ ...typed, enemyTeam: typed.enemyTeam.map(u => ({ ...u,
      statuses: [{ id: status, sourceId: 'synthetic-prior-status', stacks: 1, remaining: 3,
        appliedAtMs: 0, expiresAtMs: 3000 }] })) });
    const hits = (out: typeof plain) => out.events.flatMap(e => e.kind === 'damage' && e.source === 'hero' ? [e] : []);
    expect(hits(plain)[0]?.dodged).toBe(false);
    const ordinary = status === 'chill' ? 1.1 : 1.25, factor = tier === 'boss' ? 1 + (ordinary - 1) / 2 : ordinary;
    expect(hits(enhanced).map(e => e.amount)).toEqual(hits(plain).map(e => Math.floor(e.amount * factor)));
  });
}
