import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '@/data/skills/assassin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { runBattle, runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit, ActiveStatus } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
const hold: ActiveStatus = { id: 'stun', sourceId: 'constructed-hold', stacks: 1, remaining: -1 };
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
for (const slug of ['shadow-warrior', 'shadow-master']) for (const rank of [1, 20])
 it(`paid ${slug} rank${String(rank)} builds, places a real trap, then releases using only its own resources`, () => {
  const skillLevels: Record<string, number> = {};
  function learn(id: string) {
    const row = rows.find(row => row.id === id);
    if (!row) throw new Error('Missing authored prerequisite');
    for (const prerequisite of row.prerequisites ?? []) learn(prerequisite);
    skillLevels[id] = 1;
  }
  const summonId = 'skills-assassin-' + slug;
  learn(summonId); skillLevels[summonId] = rank;
  const copied = slug === 'shadow-warrior' ? ['tiger-strike', 'wake-of-fire', 'dragon-talon'] : [];
  for (const attack of copied) { learn('skills-assassin-' + attack); skillLevels['skills-assassin-' + attack] = rank; }
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed combined shadow', 'assassin'),
    id: 'hero', level: 30, skillLevels, comboOrder: [summonId, ...copied.map(id => 'skills-assassin-' + id)] });
  const hero: CombatUnit = { ...native, life: 4000, mana: 1000,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0,
    stats: { ...native.stats, lifeMax: 4000, manaMax: 1000, attack: 0, critChance: 0 },
    statuses: [hold, { id: 'poison', sourceId: 'clock', stacks: 1, remaining: -1, dotPerStack: 200, damageType: 'poison' }] };
  const target: CombatUnit = { id: 'target', name: 'Constructed target', side: 'enemy', kind: 'monster', tier: 'trash',
    level: 30, life: 99999, mana: 0, stats: { ...hero.stats, lifeMax: 99999, manaMax: 0, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    skillOrder: [], skillLevels: {}, cooldowns: {}, activeBuffIds: [], statuses: [hold], enraged: false };
  const input = { seed: 19, playerTeam: [hero], enemyTeam: [target] }, before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out); expect(runBattle(input)).toEqual(out.result);
  const spawn = out.events.find(e => e.kind === 'summon' && e.owner === 'hero');
  if (!spawn || spawn.kind !== 'summon') throw new Error('No paid Master body');
  const casts = out.events.filter(e => e.kind === 'action').filter(e => e.actor === spawn.unit.id);
  const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.source === spawn.unit.id);
  const observations = out.events.filter(e => e.kind === 'status-state').filter(e => e.target === spawn.unit.id);
  if (slug === 'shadow-master') {
    expect(native.assassinTrapRanks).toEqual({}); expect(native.assassinMartialRanks).toEqual({});
    expect(native.skillOrder).toEqual([summonId]);
  }
  const pool = slug === 'shadow-warrior' ? 100 : 150;
  expect(spawn.unit.mana).toBe(pool);
  expect(spawn.unit.stats.manaMax).toBe(pool);
  expect(spawn.unit.skillLevels).toMatchObject({ 'assassin.tiger_strike': rank,
    'assassin.wake_of_fire': rank, 'assassin.dragon_talon': rank });
  const ownerCost = slug === 'shadow-warrior' ? (rank === 1 ? 22 : 18) : (rank === 1 ? 35 : 30);
  expect(out.events.filter(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ mana: 1000 - ownerCost, simClockMs: 0 })]);
  expect(hits.some(e => e.amount > 0)).toBe(true);
  const charged = observations.find(e => e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 3));
  const placement = casts.find(e => e.skillId === 'assassin.wake_of_fire');
  expect.soft(charged).toBeDefined(); expect.soft(placement).toBeDefined();
  if (!charged || !placement) return;
  expect(placement.simClockMs).toBeGreaterThan(charged.simClockMs);
  expect(casts.slice(0, 5).map(e => e.skillId)).toEqual([
    'assassin.tiger_strike', 'assassin.tiger_strike', 'assassin.tiger_strike',
    'assassin.wake_of_fire', 'assassin.dragon_talon'
  ]);
  const payments = out.events.flatMap(e => e.kind === 'mana' && e.reason === 'cast' && e.target === spawn.unit.id ? [e] : []);
  expect(payments.slice(0, 5).map(e => e.mana)).toEqual([pool - 3, pool - 6, pool - 9, pool - 26, pool - 30]);
  const finish = casts.find(e => e.skillId === 'assassin.dragon_talon' && e.simClockMs > placement.simClockMs);
  expect(finish).toBeDefined(); if (!finish) throw new Error('No charged finisher');
  expect(hits.filter(e => e.damageType === 'fire' && e.simClockMs >= placement.simClockMs &&
    e.simClockMs < placement.simClockMs + 3000).map(e => e.simClockMs))
    .toEqual([placement.simClockMs, placement.simClockMs + 1000, placement.simClockMs + 2000]);
  expect(hits.filter(e => e.simClockMs === finish.simClockMs && e.damageType === 'physical')).toHaveLength(4);
  const release = hits.filter(e => e.simClockMs === finish.simClockMs && e.damageType === 'physical').at(-1);
  expect(release?.amount).toBeGreaterThanOrEqual(Math.floor((35 + 4 * (rank - 1)) * 1.5));
  expect(hits.some(e => e.damageType === 'fire' && !casts.some(a => a.simClockMs === e.simClockMs))).toBe(true);
  expect(observations.some(e => e.simClockMs === finish.simClockMs &&
    !e.statuses.some(s => s.id === 'charge-tiger-strike'))).toBe(true);
});
