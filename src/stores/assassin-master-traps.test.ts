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
for (const rank of [1, 20]) it(`paid Master rank${String(rank)} independently builds, places a real trap, then releases with a finisher`, () => {
  const skillLevels: Record<string, number> = {};
  function learn(id: string) {
    const row = rows.find(row => row.id === id);
    if (!row) throw new Error('Missing authored prerequisite');
    for (const prerequisite of row.prerequisites ?? []) learn(prerequisite);
    skillLevels[id] = 1;
  }
  learn('skills-assassin-shadow-master'); skillLevels['skills-assassin-shadow-master'] = rank;
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed independent Master', 'assassin'),
    id: 'hero', level: 30, skillLevels, comboOrder: ['skills-assassin-shadow-master'] });
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
  expect(native.assassinTrapRanks).toEqual({}); expect(native.assassinMartialRanks).toEqual({});
  expect(spawn.unit.mana).toBe(150);
  expect(out.events.filter(e => e.kind === 'mana' && e.target === 'hero' && e.reason === 'cast')).toHaveLength(1);
  expect(hits.some(e => e.amount > 0)).toBe(true);
  const charged = observations.find(e => e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 3));
  const placement = casts.find(e => e.skillId === 'assassin.wake_of_fire');
  expect.soft(charged).toBeDefined(); expect.soft(placement).toBeDefined();
  if (!charged || !placement) return;
  expect(placement.simClockMs).toBeGreaterThan(charged.simClockMs);
  const finish = casts.find(e => e.skillId === 'assassin.dragon_talon' && e.simClockMs > placement.simClockMs);
  expect(finish).toBeDefined(); if (!finish) throw new Error('No charged finisher');
  expect(hits.filter(e => e.damageType === 'fire' && e.simClockMs >= placement.simClockMs &&
    e.simClockMs < placement.simClockMs + 3000).map(e => e.simClockMs))
    .toEqual([placement.simClockMs, placement.simClockMs + 1000, placement.simClockMs + 2000]);
  expect(hits.filter(e => e.simClockMs === finish.simClockMs && e.damageType === 'physical')).toHaveLength(4);
  expect(observations.some(e => e.simClockMs === finish.simClockMs &&
    !e.statuses.some(s => s.id === 'charge-tiger-strike'))).toBe(true);
});
