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

const definitions = loadMercPool().pool.filter(row => row.id.startsWith('mercs/act2-'));
const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
const emptyRewards = { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} };
beforeEach(() => { loadDefaultSkills(); });

it('covers exactly the six authored Act II mercenary configurations', () => {
  expect(definitions.map(row => row.id).sort()).toEqual([
    'mercs/act2-blessed-aim', 'mercs/act2-defiance', 'mercs/act2-holy-freeze',
    'mercs/act2-might', 'mercs/act2-prayer', 'mercs/act2-thorns'
  ]);
});

it.each(definitions)('casts native Jab and converges through public playback for $id', definition => {
  const owned = createMercFromDef(definition, 'jab-playback'), savedBefore = structuredClone(owned);
  const native = mercToCombatUnit(owned);
  // Surviving constructed resources isolate authored loadouts; no earned recruitment claim.
  const merc = { ...native, life: 1000000, mana: 0,
    stats: { ...native.stats, lifeMax: 1000000, attack: 100, attackSpeed: 100, critChance: 0 } };
  const player = playerToCombatUnit(createMockPlayer('Jab playback', 'sorceress'));
  const hero = { ...player, statuses: [hold], skillOrder: [], manaRegenPerSecond: 0 };
  const enemy = { ...hero, id: 'target', side: 'enemy' as const, kind: 'monster' as const,
    life: 1000000, stats: { ...hero.stats, lifeMax: 1000000, defense: 0, physDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const input = { seed: 7, playerTeam: [hero, merc], enemyTeam: [enemy] }, before = structuredClone(input);
  const out = runBattleRecorded(input);
  const action = out.events.find(e => e.kind === 'action' && e.skillId === 'mskill-jab');
  if (action?.kind !== 'action') throw new Error('Missing native Jab');
  expect(out.events.filter(e => e.kind === 'damage' && e.source === merc.id &&
    e.simClockMs === action.simClockMs)).toHaveLength(3);
  const published = stageRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
    events: out.events, unitNameMap: new Map(), outcome: { winner: out.result.winner,
      finalPlayerTeam: out.result.playerTeam, finalEnemyTeam: out.result.enemyTeam } },
  { currentWave: 1, totalWaves: 1, subAreaRunId: null, runRewards: emptyRewards });
  let step: PlaybackStepResult = { playerTeam: published.playerTeam,
    enemyTeam: published.enemyTeam, ...(published.statusPlayback ? { statusPlayback: published.statusPlayback } : {}) };
  for (const event of out.events) step = applyEventToTeams(step.playerTeam, step.enemyTeam, event, step.statusPlayback);
  const observable = (units: readonly CombatUnit[]) => units.map(u => ({ id: u.id, life: u.life, mana: u.mana,
    stats: u.stats, statuses: u.statuses, activeBuffIds: u.activeBuffIds, enraged: u.enraged }));
  expect(observable(step.playerTeam)).toEqual(observable(out.result.playerTeam));
  // Ambient Chill is presented while the source lives, but never carried in raw wave state.
  const expectedEnemies = definition.id === 'mercs/act2-holy-freeze'
    ? out.result.enemyTeam.map(u => ({ ...u, statuses: [hold,
      { id: 'chill', sourceId: merc.id, stacks: 1, remaining: -1, tags: ['cold', 'chill'] as const }] }))
    : out.result.enemyTeam;
  if (definition.id === 'mercs/act2-holy-freeze') expect(out.result.enemyTeam[0]?.statuses).toEqual([hold]);
  expect(observable(step.enemyTeam)).toEqual(observable(expectedEnemies));
  expect(owned).toEqual(savedBefore);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
});
