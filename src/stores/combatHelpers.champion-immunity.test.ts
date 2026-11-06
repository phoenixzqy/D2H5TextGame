import { expect, it } from 'vitest';
import { monsters, subAreas } from '../data';
import { loadGameData } from '../data/loader';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import { runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import type { CombatUnit } from '../engine/combat/types';
import { applyEventToTeams, type PlaybackStepResult } from './combatPlayback';
import { buildEnemiesForWave } from './combatHelpers';

const selected = new Map([
  ['monsters/act5.blood-lord', 'fire'], ['monsters/act5.frozen-terror', 'cold']
]);

it.each(['manual', 'idle'] as const)('native Act V %s plans attach immunity only to selected champions', async mode => {
  const data = await loadGameData(), championKinds = new Set<string>(), ordinaryKinds = new Set<string>();
  const fixtures = subAreas.filter(row => row.actId === 'acts/act5')
    .map(subArea => ({ subArea, challengeOrdinal: 450 }));
  if (mode === 'idle') {
    const subArea = subAreas.find(row => row.id === 'areas/act5-arreat-plateau');
    if (!subArea) throw new Error('Missing native Blood Lord idle source');
    // Native wave 2 promotes Blood Lords here; ordinal 450 does not. Manual
    // plans never promote this earlier wave, regardless of seed or count cycle.
    fixtures.push({ subArea, challengeOrdinal: 5 });
  }
  for (const { subArea: area, challengeOrdinal } of fixtures) {
    const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 775,
      challengeOrdinal, idleEliteMisses: 11,
      fallbackArchetypeId: 'monsters/act5.barbarian-savage', fallbackLevel: area.areaLevel });
    const before = structuredClone(plan);
    for (const wave of plan.waves) {
      const units = buildEnemiesForWave(wave, 775);
      expect(buildEnemiesForWave(wave, 775)).toEqual(units);
      for (const unit of units) {
        const type = selected.get(unit.monsterArchetypeId ?? '');
        expect(data.monsters.get(unit.monsterArchetypeId ?? '')).toEqual(monsters.find(row => row.id === unit.monsterArchetypeId));
        if (type !== undefined && unit.tier === 'champion') {
          expect(unit.damageImmunities).toEqual([type]);
          expect(Object.isFrozen(unit.damageImmunities)).toBe(true);
          championKinds.add(unit.monsterArchetypeId ?? '');
        } else {
          expect(unit.damageImmunities).toBeUndefined();
          if (type !== undefined && unit.tier === 'trash') ordinaryKinds.add(unit.monsterArchetypeId ?? '');
        }
      }
    }
    expect(plan).toEqual(before);
  }
  expect([...championKinds].sort()).toEqual(mode === 'idle'
    ? [...selected.keys()].sort() : ['monsters/act5.frozen-terror']);
  expect([...ordinaryKinds].sort()).toEqual([...selected.keys()].sort());
});

it('native champion immunity survives event playback while the physical fallback still damages the enemy', () => {
  const wave = { id: 'constructed-champion', waveTier: 'elite' as const,
    spawns: [{ archetypeId: 'monsters/act5.blood-lord', tier: 'champion' as const, level: 60, index: 0 }] };
  const enemy = buildEnemiesForWave(wave, 775)[0];
  if (!enemy) throw new Error('Missing native champion');
  const hero: CombatUnit = { id: 'hero', name: 'hero', side: 'player', kind: 'hero', tier: 'trash', level: 60,
    life: 100000, mana: 8, stats: { ...enemy.stats, life: 100000, lifeMax: 100000,
      mana: 8, manaMax: 8, attack: 1000, attackSpeed: 100, critChance: 0 },
    statuses: [], cooldowns: {}, activeBuffIds: [], enraged: false,
    skillOrder: ['skills-sorceress-fire-bolt'], skillLevels: { 'skills-sorceress-fire-bolt': 1 } };
  const snapshot: CombatSnapshot = { seed: 775, act: 5, maxRounds: 4, playerTeam: [hero], enemyTeam: [enemy] };
  const before = structuredClone(snapshot), recorded = runBattleRecorded(snapshot);
  let teams: PlaybackStepResult = { playerTeam: snapshot.playerTeam, enemyTeam: snapshot.enemyTeam };
  for (const event of recorded.events) teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event);
  const fire = recorded.events.filter(event => event.kind === 'damage' && event.target === enemy.id &&
    event.source === 'hero' && event.damageType === 'fire' && !event.dodged);
  expect(fire.length).toBeGreaterThan(0);
  expect(fire.every(event => event.kind === 'damage' && event.amount === 0)).toBe(true);
  expect(recorded.events.some(event => event.kind === 'damage' && event.target === enemy.id &&
    event.source === 'hero' && event.damageType === 'physical' && event.amount > 0)).toBe(true);
  expect(teams.enemyTeam[0]?.life).toBe(recorded.result.enemyTeam[0]?.life);
  expect(teams.enemyTeam[0]?.damageImmunities).toEqual(['fire']);
  expect(snapshot).toEqual(before);
});
