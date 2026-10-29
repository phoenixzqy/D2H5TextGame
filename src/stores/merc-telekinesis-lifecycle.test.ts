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
  { fire: false, tier: 'trash' as const, expiry: 2700, dies: false },
  { fire: false, tier: 'boss' as const, expiry: 2200, dies: false },
  { fire: false, tier: 'trash' as const, expiry: 2700, dies: true },
  { fire: true, tier: 'trash' as const, expiry: 4400, dies: false },
  { fire: true, tier: 'boss' as const, expiry: 3900, dies: false }
])('publishes actual loadout fire=$fire, $tier Stun/source death=$dies and replays unchanged', row => {
  const definition = loadMercPool().pool.find(candidate => candidate.id ===
    (row.fire ? 'mercs/act3-iron-wolf-fire' : 'mercs/act3-iron-wolf-telekinesis'));
  if (!definition) throw new Error('Missing authored Iron Wolf');
  const owned = createMercFromDef(definition, 'telekinesis-playback'), savedBefore = structuredClone(owned);
  const native = mercToCombatUnit(owned), holdAt = row.fire ? 3401 : 1701;
  // Constructed surviving resources isolate actual factory mechanics, not earned recruitment.
  const merc: CombatUnit = { ...native, life: row.dies ? 2 : 1000000, mana: 0,
    statuses: [{ ...hold, appliedAtMs: holdAt }, ...(row.dies
      ? [{ id: 'ignite', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }] : [])],
    stats: { ...native.stats, lifeMax: 1000000, attack: 100, attackSpeed: 100, critChance: 0 } };
  const player = playerToCombatUnit(createMockPlayer('Telekinesis playback', 'sorceress'));
  const hero: CombatUnit = { ...player, statuses: [hold], skillOrder: [], manaRegenPerSecond: 0 };
  const enemy: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier: row.tier,
    life: 1000000, statuses: row.fire ? [{ ...hold, id: 'freeze' }] : [],
    stats: { ...hero.stats, lifeMax: 1000000, attackSpeed: 0, defense: 0,
      magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const input = { seed: 3, playerTeam: [hero, merc], enemyTeam: [enemy] }, before = structuredClone(input);
  expect(merc.skillOrder).toEqual(row.fire
    ? ['mskill-fire-ball', 'mskill-telekinesis', 'passive-fire-mastery'] : ['mskill-telekinesis']);
  const out = runBattleRecorded(input);
  expect(out.events.filter(event => event.kind === 'action').filter(event => event.actor === merc.id)
    .map(event => [event.simClockMs, event.skillId])).toEqual(row.fire
    ? [[1700, 'mskill-fire-ball'], [3400, 'mskill-telekinesis']] : [[1700, 'mskill-telekinesis']]);
  // Independent seed3 draws: Fire51 *1.25 =>63, then native TK26 with landed proc.
  expect(out.events.filter(event => event.kind === 'damage').filter(event => event.source === merc.id)
    .map(event => [event.simClockMs, event.amount, event.damageType])).toEqual(row.fire
    ? [[1700, 63, 'fire'], [3400, 26, 'arcane']] : [[1700, 20, 'arcane']]);
  const application = out.events.filter(event => event.kind === 'status-state').find(event =>
    event.target === 'target' && event.simClockMs === (row.fire ? 3400 : 1700));
  expect(application).toBeDefined();
  expect(application?.statuses).toContainEqual(expect.objectContaining({ id: 'stun', sourceId: merc.id, stacks: 1,
    appliedAtMs: row.fire ? 3400 : 1700, expiresAtMs: row.expiry }));
  const expiry = out.events.filter(event => event.kind === 'status-state').find(event =>
    event.target === 'target' && event.simClockMs === row.expiry);
  expect(expiry).toBeDefined();
  expect(expiry?.statuses.some(status => status.id === 'stun')).toBe(false);
  if (row.fire) {
    expect(merc.mercFireMastery).toBe(true);
    expect(expiry?.statuses.some(status => status.id === 'freeze' && status.sourceId === 'fixture')).toBe(true);
  }
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
      { ...hold, appliedAtMs: holdAt },
      { id: 'ignite', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }
    ]);
    expect(step.playerTeam.find(unit => unit.id === merc.id)).toMatchObject({ life: 0, statuses: [] });
    expect(step.statusPlayback?.deadIds).toContain(merc.id);
    expect(step.statusPlayback?.byId.get(merc.id)).toEqual([]);
  }
  const observable = (units: readonly CombatUnit[]) => units.map(unit => ({ id: unit.id, life: unit.life,
    mana: unit.mana, stats: unit.stats, statuses: unit.statuses, activeBuffIds: unit.activeBuffIds, enraged: unit.enraged }));
  // Expected presentation hides corpse statuses; preserve actual playback and all living statuses.
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
