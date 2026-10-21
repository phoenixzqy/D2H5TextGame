import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type BattleEvent } from './combat';
import type { CombatUnit } from './types';

interface ProjectedSnapshot extends CombatSnapshot {
  readonly skeletonMastery?: { readonly sourceHeroId: string; readonly rank: number; readonly maxRank: number;
    readonly summonLifePct: number; readonly summonAttackPct: number; readonly summonDefensePct: number };
}
const projection = (rank: number): NonNullable<ProjectedSnapshot['skeletonMastery']> =>
  ({ sourceHeroId: 'hero', rank, maxRank: 20, summonLifePct: rank * .04,
    summonAttackPct: rank * .02, summonDefensePct: rank * .01 });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 10000, mana: 60, stats: { life: 10000, lifeMax: 10000, mana: 60, manaMax: 60,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function snapshot(rank = 0, template = 'skeleton'): ProjectedSnapshot {
  const skill = template === 'skeletal_mage' ? 'necromancer.raise_skeletal_mage' : 'necromancer.raise_skeleton';
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'), skillOrder: [skill], skillLevels: { [skill]: 6 },
    gridPosition: { row: 0, col: 0 }, summonGridPositions: [{ row: 1, col: 0 }, { row: 1, col: 1 }] }],
    enemyTeam: [{ ...unit('target', 'enemy'), life: 1000000,
      stats: { ...unit('target', 'enemy').stats, life: 1000000, lifeMax: 1000000 },
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }],
    ...(rank > 0 ? { skeletonMastery: projection(rank) } : {}) };
}
function record(input: ProjectedSnapshot) {
  const before = structuredClone(input);
  const result = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(result.result);
  expect(runBattleRecorded(input)).toEqual(result);
  for (const out of [...result.result.playerTeam, ...result.result.enemyTeam]) {
    expect(out).not.toHaveProperty('skeletonMastery');
  }
  return result;
}
function summons(result: ReturnType<typeof record>) {
  return result.events.filter((event): event is Extract<BattleEvent, { kind: 'summon' }> &
    { readonly simClockMs: number; readonly uiDelayMs: number } => event.kind === 'summon');
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

// Real canonical preparation cases relocated unchanged before the D06 v1c switch.
describe('D06 canonical Necromancer preparation and Mastery', () => {
  it.each([0, 1, 20])('sustains rank6 cap two, IDs, positions and cost under Mastery%i', rank => {
    // Stunned durable target keeps both skeletons alive for the full battle budget.
    const actual = record(snapshot(rank));
    const spawned = summons(actual);
    expect(spawned.map(e => e.unit.id)).toEqual(['hero-summon-skeleton-1', 'hero-summon-skeleton-2']);
    expect(spawned.map(e => e.unit.gridPosition)).toEqual([{ row: 1, col: 0 }, { row: 1, col: 1 }]);
    expect(spawned.map(e => e.simClockMs)).toEqual([0, 1700]);
    expect(actual.events.filter(e => e.kind === 'mana')).toEqual([
      { kind: 'mana', target: 'hero', mana: 45, reason: 'cast', simClockMs: 0, uiDelayMs: 50 },
      { kind: 'mana', target: 'hero', mana: 30, reason: 'cast', simClockMs: 1700, uiDelayMs: 50 }
    ]);
    expect(actual.result.winner).toBeNull();
    expect(actual.events.at(-1)).toMatchObject({ kind: 'end', winner: null, simClockMs: 60000 });
    expect(actual.result.playerTeam.filter(u => u.summonOwnerId === 'hero' && u.life > 0)).toHaveLength(2);
  });

});
