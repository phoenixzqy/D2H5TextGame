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
const cases = [
  { merc: 'act3-iron-wolf-fire', seed: 5, amounts: [91], status: 'ignite', expiry: 4700 },
  { merc: 'act3-iron-wolf-cold', seed: 3, amounts: [40], status: 'chill', expiry: 3700 },
  { merc: 'act3-iron-wolf-lightning', seed: 5, amounts: [12, 12, 12, 12, 12], status: 'paralyze', expiry: 2700 },
  { merc: 'act4-paladin-initiate', seed: 3, amounts: [22], status: 'stun', expiry: 2700 },
  { merc: 'act3-militia-swordsman', seed: 5, amounts: [48] },
  { merc: 'act3-militia-pikeman', seed: 5, amounts: [30] },
  { merc: 'act5-barbarian-recruit', seed: 5, amounts: [28] }
];

it.each(cases)('publishes the actual $merc loadout and replays its native effect/state', row => {
  const definition = loadMercPool().pool.find(candidate => candidate.id === `mercs/${row.merc}`);
  if (!definition) throw new Error('Missing authored mercenary');
  const owned = createMercFromDef(definition, 'direct-playback'), savedBefore = structuredClone(owned);
  const native = mercToCombatUnit(owned);
  // Constructed surviving resources isolate loadout mechanics; this is not earned recruitment.
  const merc = { ...native, life: 1000000, mana: 0, statuses: [{ ...hold, appliedAtMs: 1701 }],
    stats: { ...native.stats, lifeMax: 1000000, attack: 100, attackSpeed: 100, critChance: 0, critDamage: 2 } };
  const player = playerToCombatUnit(createMockPlayer('Direct playback', 'sorceress'));
  const hero = { ...player, statuses: [hold], skillOrder: [], manaRegenPerSecond: 0 };
  const enemy = { ...hero, id: 'target', side: 'enemy' as const, kind: 'monster' as const, statuses: [],
    life: 1000000, stats: { ...hero.stats, lifeMax: 1000000, attackSpeed: 0, defense: 0, magicResist: 0,
      physDodge: 0, magicDodge: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const input = { seed: row.seed, playerTeam: [hero, merc], enemyTeam: [enemy] }, before = structuredClone(input);
  const out = runBattleRecorded(input);
  expect(out.events.filter(event => event.kind === 'damage').filter(event => event.source === merc.id)
    .map(event => event.amount)).toEqual(row.amounts);
  if (row.status) {
    const applied = out.events.filter(event => event.kind === 'status-state').find(event =>
      event.target === 'target' && event.simClockMs === 1700 && event.statuses.some(status => status.id === row.status));
    if (!applied) throw new Error('Missing native first-cast status state');
    expect(applied.statuses.find(status => status.id === row.status)).toMatchObject({
      id: row.status, sourceId: merc.id, stacks: 1, appliedAtMs: 1700, expiresAtMs: row.expiry });
  }
  const recordedBefore = structuredClone(out);
  const published = stageRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
    events: out.events, unitNameMap: new Map(), outcome: { winner: out.result.winner,
      finalPlayerTeam: out.result.playerTeam, finalEnemyTeam: out.result.enemyTeam } },
  { currentWave: 1, totalWaves: 1, subAreaRunId: null, runRewards: emptyRewards });
  let step: PlaybackStepResult = { playerTeam: published.playerTeam, enemyTeam: published.enemyTeam,
    ...(published.statusPlayback ? { statusPlayback: published.statusPlayback } : {}) };
  for (const event of out.events) step = applyEventToTeams(step.playerTeam, step.enemyTeam, event, step.statusPlayback);
  const observable = (units: readonly CombatUnit[]) => units.map(unit => ({ id: unit.id, life: unit.life,
    mana: unit.mana, stats: unit.stats, statuses: unit.statuses, activeBuffIds: unit.activeBuffIds, enraged: unit.enraged }));
  expect(observable(step.playerTeam)).toEqual(observable(out.result.playerTeam));
  expect(observable(step.enemyTeam)).toEqual(observable(out.result.enemyTeam));
  expect(out.result.playerTeam.find(unit => unit.id === merc.id)?.mana).toBe(0);
  expect(owned).toEqual(savedBefore);
  expect(input).toEqual(before);
  expect(out).toEqual(recordedBefore);
  expect(runBattleRecorded(input)).toEqual(out);
});
