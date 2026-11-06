import { afterEach, beforeEach, expect, it } from 'vitest';
import { subAreas } from '../data';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { prepareEndgameAttempt } from '../engine/endgame/runtime';
import { emptyEndgameState } from '../engine/endgame/state';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { resolveChallengeWavePlan, resolveQuestEncounterPlan, type WaveSpec } from '../engine/combat/sub-area-run';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import type { CombatUnit, MonsterTier } from '../engine/combat/types';
import { buildEnemiesForWave } from './combatHelpers';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
function area(id: string) {
  const row = subAreas.find(row => row.id === id); if (!row) throw new Error('Missing native area'); return row;
}
function verify(wave: WaveSpec, act: 1 | 2 | 4 | 5,
  roster: readonly (readonly [string, number, MonsterTier])[], selected: string, attack: number, skills: readonly string[], source: unknown) {
  const before = structuredClone(wave);
  expect(wave.source).toEqual(source);
  expect(wave.spawns.map(s => [s.archetypeId, s.level, s.tier])).toEqual(roster);
  const enemies = buildEnemiesForWave(wave, 7);
  expect(enemies.map(e => [e.monsterArchetypeId, e.level, e.tier])).toEqual(roster);
  const subjects = enemies.filter(e => e.monsterArchetypeId === selected);
  expect(subjects.length).toBeGreaterThan(0);
  expect(subjects.every(e => e.stats.attack === attack && e.attackRange?.[0] === attack && e.attackRange[1] === attack)).toBe(true);
  expect(subjects.map(e => e.skillOrder)).toEqual(subjects.map(() => skills));
  expect(buildEnemiesForWave(wave, 7)).toEqual(enemies); expect(wave).toEqual(before);
  const template = subjects[0]; if (!template) throw new Error('Missing selected boss');
  const hero: CombatUnit = { ...template, id: 'hero', kind: 'hero', side: 'player',
    life: 10_000_000, mana: 0, skillOrder: [], attackRange: [0, 0],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...template.stats, attack: 0, life: 10_000_000, lifeMax: 10_000_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const snapshot: CombatSnapshot = { seed: 13, act, playerTeam: [hero], enemyTeam: enemies }, copy = structuredClone(snapshot);
  const out = runBattleRecorded(snapshot);
  for (const subject of subjects) expect(out.events.some(e => e.kind === 'action' && e.actor === subject.id &&
    e.skillId === (selected.endsWith('.radament') ? 'monster.summon_adds' : selected.endsWith('.izual') ? 'monster.frost_nova' :
      selected.endsWith('.ancient-barbarian') ? 'monster.whirlwind' : selected.endsWith('.the-countess') ? 'monster.fire_bolt' : 'monster.leap_attack'))).toBe(true);
  expect(snapshot).toEqual(copy); expect(runBattle(snapshot)).toEqual(out.result); expect(runBattleRecorded(snapshot)).toEqual(out);
}
it.each([
  ['areas/act2-far-oasis', 2, 'act2-far-oasis-radament', 22, 'monsters/act2.radament', 'monsters/act2.mummy', 4, 'trash', 219,
    ['monster-poison-cloud', 'monster-summon-adds', 'monster-fire-breath']],
  ['areas/act4-plains-of-despair', 4, 'act4-pod-izual', 49, 'monsters/act4.izual', 'monsters/act4.oblivion-knight', 2, 'boss', 544,
    ['monster-frost-nova', 'monster-charge']],
  ['areas/act5-ancients-way', 5, 'act5-aw-ancients', 75, 'monsters/act5.ancient-barbarian', 'monsters/act5.ancient-barbarian', 2, 'boss', 804,
    ['monster-whirlwind', 'monster-shout']]
] as const)('builds actual %s full boss roster and signature actions', (id, act, source, level, selected, guard, count, guardTier, attack, skills) => {
  const subArea = area(id), plan = resolveChallengeWavePlan({ subArea, seed: 7, challengeOrdinal: 0,
    fallbackArchetypeId: selected, fallbackLevel: subArea.areaLevel });
  const wave = plan.waves.find(w => w.source?.kind === 'bossEncounter'); if (!wave) throw new Error('Missing native boss wave');
  verify(wave, act, [[selected, level, 'boss'], ...Array.from({ length: count }, () => [guard, level, guardTier] as const)],
    selected, attack, skills, { kind: 'bossEncounter', encounterId: source });
  expect(wave.spawns.every(s => s.encounterId === source)).toBe(true);
});
it.each([
  ['act1-dw-countess', 'monsters/act1.the-countess', 0, 59, ['monster-fire-bolt', 'monster-fire-ball']],
  ['act1-dw-cow-king', 'monsters/act1.cow-king', 2, 184, ['monster-leap-attack', 'monster-enrage']]
] as const)('builds actual %s optional quest full roster, order and ordinary curve', (encounterId, selected, guards, attack, skills) => {
  const plan = resolveQuestEncounterPlan({ subArea: area('areas/act1-dark-wood'), encounterId, seed: 7 });
  expect(plan.waves).toHaveLength(1); const wave = plan.waves[0]; if (!wave) throw new Error('Missing native quest');
  verify(wave, 1, [[selected, 13, 'boss'], ...Array.from({ length: guards }, () => ['monsters/act1.hell-bovine', 13, 'trash'] as const)],
    selected, attack, skills, { kind: 'questEncounter', encounterId });
  expect(wave.spawns.every(s => s.encounterId === encounterId)).toBe(true);
});
it.each(['ashen', 'glacial'])('builds actual %s full endgameW4 with L90Ancient954 and native actions', modifierId => {
  const { progress } = prepareEndgameAttempt({ heroId: 'hero', modifierId, state: emptyEndgameState(), campaign: campaignEvidence() });
  const wave = progress.plan.waves.find(w => w.id === 'worldstone-remnant/w4'); if (!wave) throw new Error('Missing native W4');
  const guard = modifierId === 'ashen' ? 'monsters/act5.blood-lord' : 'monsters/act5.frozen-terror';
  verify(wave, 5, [['monsters/act5.ancient-barbarian', 90, 'boss'], [guard, 90, 'trash'], [guard, 90, 'trash']],
    'monsters/act5.ancient-barbarian', 954, ['monster-whirlwind', 'monster-shout'], undefined);
});
