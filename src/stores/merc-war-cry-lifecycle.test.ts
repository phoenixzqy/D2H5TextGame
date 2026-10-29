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

it.each([
  { tier: 'trash' as const, expiry: 7700, dies: false },
  { tier: 'boss' as const, expiry: 4700, dies: false },
  { tier: 'trash' as const, expiry: 7700, dies: true }
])('publishes real War Cry, preserves secondary selection and replays $tier control/source death=$dies', row => {
  const definition = loadMercPool().pool.find(candidate => candidate.id === 'mercs/act5-barbarian-war-cry');
  if (!definition) throw new Error('Missing authored War Cry mercenary');
  const owned = createMercFromDef(definition, 'war-cry-playback'), savedBefore = structuredClone(owned);
  const native = mercToCombatUnit(owned);
  // Constructed surviving resources isolate loadout mechanics; this is not earned recruitment.
  const merc: CombatUnit = { ...native, life: row.dies ? 2 : 1000000, mana: 0,
    statuses: [{ ...hold, appliedAtMs: 5101 }, ...(row.dies
      ? [{ id: 'ignite', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }] : [])],
    stats: { ...native.stats, lifeMax: 1000000, attack: 100, attackSpeed: 100, critChance: 0 } };
  const player = playerToCombatUnit(createMockPlayer('War Cry playback', 'sorceress'));
  const hero: CombatUnit = { ...player, statuses: [hold], skillOrder: [], manaRegenPerSecond: 0 };
  const enemy: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier: row.tier,
    life: 1000000, statuses: [], stats: { ...hero.stats, lifeMax: 1000000, attackSpeed: 0, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const input = { seed: 5, playerTeam: [hero, merc], enemyTeam: [enemy] }, before = structuredClone(input);
  expect(merc.skillOrder).toEqual(['mskill-war-cry', 'mskill-bash', 'mskill-chop']);
  const out = runBattleRecorded(input);
  const actions = out.events.filter(event => event.kind === 'action').filter(event => event.actor === merc.id);
  expect(actions.map(event => [event.simClockMs, event.skillId])).toEqual(row.dies
    ? [[1700, 'mskill-war-cry']] : [[1700, 'mskill-war-cry'], [3400, 'mskill-bash'], [5100, 'mskill-chop']]);
  expect(out.events.filter(event => event.kind === 'damage').filter(event => event.source === merc.id)
    .map(event => [event.simClockMs, event.amount])).toEqual(row.dies ? [] : [[3400, 37], [3400, 34], [5100, 0]]);
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', simClockMs: 1700,
    statuses: [expect.objectContaining({ id: 'stun', sourceId: merc.id, stacks: 1, appliedAtMs: 1700, expiresAtMs: row.expiry })] }));
  expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'target', simClockMs: row.expiry, statuses: [] }));
  if (row.dies) expect(out.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id, simClockMs: 2000 }));
  const recordedBefore = structuredClone(out);
  const published = stageRecordedBattle({ initialPlayerTeam: input.playerTeam, initialEnemyTeam: input.enemyTeam,
    events: out.events, unitNameMap: new Map(), outcome: { winner: out.result.winner,
      finalPlayerTeam: out.result.playerTeam, finalEnemyTeam: out.result.enemyTeam } },
  { currentWave: 1, totalWaves: 1, subAreaRunId: null, runRewards: emptyRewards });
  let step: PlaybackStepResult = { playerTeam: published.playerTeam, enemyTeam: published.enemyTeam,
    ...(published.statusPlayback ? { statusPlayback: published.statusPlayback } : {}) };
  for (const event of out.events) step = applyEventToTeams(step.playerTeam, step.enemyTeam, event, step.statusPlayback);
  if (row.dies) {
    expect(out.result.playerTeam.find(unit => unit.id === merc.id)?.statuses).toEqual([
      { ...hold, appliedAtMs: 5101 },
      { id: 'ignite', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }
    ]);
    expect(step.playerTeam.find(unit => unit.id === merc.id)).toMatchObject({ life: 0, statuses: [] });
    expect(step.statusPlayback?.deadIds).toContain(merc.id);
    expect(step.statusPlayback?.byId.get(merc.id)).toEqual([]);
  }
  const observable = (units: readonly CombatUnit[]) => units.map(unit => ({ id: unit.id, life: unit.life,
    mana: unit.mana, stats: unit.stats, statuses: unit.statuses, activeBuffIds: unit.activeBuffIds, enraged: unit.enraged }));
  // Expected presentation hides corpse statuses; never normalize actual playback or living statuses.
  const expectedPresentation = (units: readonly CombatUnit[]) => units.map(unit =>
    unit.life > 0 ? unit : { ...unit, statuses: [] });
  expect(observable(step.playerTeam)).toEqual(observable(expectedPresentation(out.result.playerTeam)));
  expect(observable(step.enemyTeam)).toEqual(observable(expectedPresentation(out.result.enemyTeam)));
  expect(out.result.playerTeam.find(unit => unit.id === merc.id)?.mana).toBe(0);
  expect(owned).toEqual(savedBefore);
  expect(input).toEqual(before);
  expect(out).toEqual(recordedBefore);
  expect(runBattleRecorded(input)).toEqual(out);
});
