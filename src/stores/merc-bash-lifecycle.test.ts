import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { applyEventToTeams, type PlaybackStepResult } from './combatPlayback';
import { stageRecordedBattle } from './recordedBattlePublication';

const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
const emptyRewards = { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} };
beforeEach(() => { loadDefaultSkills(); });

it('publishes the real Battle Orders/Bash loadout and replays literal stun/resource state', () => {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-battle-orders');
  if (!definition) throw new Error('Missing authored Battle Orders barbarian');
  const owned = createMercFromDef(definition, 'bash-playback'), savedBefore = structuredClone(owned);
  const native = mercToCombatUnit(owned);
  // Constructed resources isolate the actual loadout; there is no earned recruitment claim.
  const merc = { ...native, life: 1000000, mana: 0, statuses: [{ ...hold, appliedAtMs: 1701 }],
    stats: { ...native.stats, lifeMax: 1000000, attack: 100, attackSpeed: 100, critChance: 0 } };
  const player = playerToCombatUnit(createMockPlayer('Bash playback', 'sorceress'));
  const hero = { ...player, statuses: [hold], skillOrder: [], manaRegenPerSecond: 0 };
  const enemy = { ...hero, id: 'target', side: 'enemy' as const, kind: 'monster' as const, statuses: [],
    life: 1000000, stats: { ...hero.stats, lifeMax: 1000000, attackSpeed: 0, defense: 0, physDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const input = { seed: 3, playerTeam: [hero, merc], enemyTeam: [enemy] }, before = structuredClone(input);
  const out = runBattleRecorded(input);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === merc.id && e.simClockMs === 1700))
    .toHaveLength(2);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', simClockMs: 1700,
    statuses: [expect.objectContaining({ id: 'stun', stacks: 1, sourceId: merc.id,
      appliedAtMs: 1700, expiresAtMs: 2700 })] }));
  const published = stageRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
    events: out.events, unitNameMap: new Map(), outcome: { winner: out.result.winner,
      finalPlayerTeam: out.result.playerTeam, finalEnemyTeam: out.result.enemyTeam } },
  { currentWave: 1, totalWaves: 1, subAreaRunId: null, runRewards: emptyRewards });
  let step: PlaybackStepResult = { playerTeam: published.playerTeam, enemyTeam: published.enemyTeam,
    ...(published.statusPlayback ? { statusPlayback: published.statusPlayback } : {}) };
  for (const event of out.events) step = applyEventToTeams(step.playerTeam, step.enemyTeam, event, step.statusPlayback);
  const observable = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    stats: u.stats, statuses: u.statuses, activeBuffIds: u.activeBuffIds, enraged: u.enraged }));
  expect(observable(step.playerTeam)).toEqual(observable(out.result.playerTeam));
  expect(observable(step.enemyTeam)).toEqual(observable(out.result.enemyTeam));
  expect(out.result.playerTeam.find(u => u.id === merc.id)?.mana).toBe(0);
  expect(owned).toEqual(savedBefore);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
});
