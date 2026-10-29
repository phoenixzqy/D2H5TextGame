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
function ownedMerc() {
  const definition = loadMercPool().pool.find(row => row.id === 'mercs/act4-paladin-holy-fire');
  if (!definition) throw new Error('Missing authored Holy Fire mercenary');
  return createMercFromDef(definition, 'holy-fire-playback');
}
beforeEach(() => { loadDefaultSkills(); });

it.each([0, NaN, Infinity, 1.5])('does not project source authority from invalid owned level%s', level => {
  expect(mercToCombatUnit({ ...ownedMerc(), level })).not.toHaveProperty('mercHolyFireAura');
});

it('qualifies only the actual identity and loadout without mutating saved ownership', () => {
  const owned = ownedMerc(), before = structuredClone(owned);
  expect(mercToCombatUnit(owned)).toMatchObject({ mercHolyFireAura: true, skillOrder: ['mskill-holy-fire'] });
  for (const id of ['mercs/act4-paladin-holy-fire-forged#1', 'mercs/act3-iron-wolf-fire#1']) {
    expect(mercToCombatUnit({ ...owned, id })).not.toHaveProperty('mercHolyFireAura');
  }
  expect(mercToCombatUnit({ ...owned, signatureSkillId: 'mskill-basic-arrow', comboOrder: [] }))
    .not.toHaveProperty('mercHolyFireAura');
  expect(owned).toEqual(before);
});

it.each([
  { tier: 'trash' as const, dies: false }, { tier: 'boss' as const, dies: false },
  { tier: 'chapter-boss' as const, dies: false }, { tier: 'trash' as const, dies: true }
])('publishes the actual sole Holy Fire bar against $tier; source death=$dies and immutable playback', row => {
  const owned = ownedMerc(), savedBefore = structuredClone(owned), native = mercToCombatUnit(owned);
  // Surviving constructed resources isolate native mechanics, not earned recruitment.
  const merc: CombatUnit = { ...native, life: row.dies ? 2 : 1000000, mana: 0,
    statuses: [hold, ...(row.dies
      ? [{ id: 'poison', sourceId: 'target', stacks: 1, remaining: -1, dotPerStack: 1 }] : [])],
    stats: { ...native.stats, lifeMax: 1000000, critChance: 0 } };
  const player = playerToCombatUnit(createMockPlayer('Holy Fire playback', 'sorceress'));
  const hero: CombatUnit = { ...player, statuses: [hold], skillOrder: [], manaRegenPerSecond: 0 };
  const enemy: CombatUnit = { ...hero, id: 'target', side: 'enemy', kind: 'monster', tier: row.tier,
    life: 1000000, statuses: [hold],
    stats: { ...hero.stats, lifeMax: 1000000, defense: 0, magicResist: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const input = { seed: 7, playerTeam: [hero, merc], enemyTeam: [enemy] }, before = structuredClone(input);
  expect(merc.skillOrder).toEqual(['mskill-holy-fire']);
  const out = runBattleRecorded(input);
  expect(out.events.some(event => event.kind === 'action' && event.actor === merc.id)).toBe(false);
  expect(out.events.filter(event => event.kind === 'damage').filter(event => event.source === merc.id)
    .map(event => [event.simClockMs, event.amount, event.damageType, event.crit, event.dodged]))
    .toEqual(row.dies ? [[1000, 8, 'fire', false, false]]
      : Array.from({ length: 60 }, (_, i) => [(i + 1) * 1000, 8, 'fire', false, false]));
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
    expect(out.result.playerTeam.find(actor => actor.id === merc.id)?.statuses).toEqual(merc.statuses);
    expect(step.playerTeam.find(actor => actor.id === merc.id)).toMatchObject({ life: 0, statuses: [] });
    expect(step.statusPlayback?.deadIds).toContain(merc.id);
    expect(step.statusPlayback?.byId.get(merc.id)).toEqual([]);
  }
  const observable = (units: readonly CombatUnit[]) => units.map(actor => ({ id: actor.id, life: actor.life,
    mana: actor.mana, stats: actor.stats, statuses: actor.statuses, activeBuffIds: actor.activeBuffIds, enraged: actor.enraged }));
  // Playback hides corpse statuses; keep actual playback and all living state explicit.
  const expectedPresentation = (units: readonly CombatUnit[]) => units.map(actor =>
    actor.life > 0 ? actor : { ...actor, statuses: [] });
  expect(observable(step.playerTeam)).toEqual(observable(expectedPresentation(out.result.playerTeam)));
  expect(observable(step.enemyTeam)).toEqual(observable(expectedPresentation(out.result.enemyTeam)));
  expect(out.result.playerTeam.find(actor => actor.id === merc.id)?.mana).toBe(0);
  expect(owned).toEqual(savedBefore); expect(input).toEqual(before); expect(out).toEqual(recordedBefore);
  expect(runBattleRecorded(input)).toEqual(out);
});
