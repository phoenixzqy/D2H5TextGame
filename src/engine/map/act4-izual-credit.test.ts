import {describe, expect, it} from 'vitest';
import {monsters, subAreas} from '@/data/index';
import {createRng} from '../rng';
import {buildMonsterUnit} from '../combat/monster-factory';
import {withDefaultGridPositions} from '../combat/grid';
import {resolveChallengeWavePlan, type WaveSpec} from '../combat/sub-area-run';
import type {CombatSnapshot} from '../combat/combat';
import type {CombatUnit} from '../combat/types';
import retained from '../combat/fixtures/act4-izual-quest-credit.json';
import {ACT4_ENCOUNTERS, captureAct4Encounter, hasOriginalAct4Victory} from './act4-admission';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing earned Izual fixture');
  return value;
}
const snapshot = retained.snapshot as unknown as CombatSnapshot;
const area = required(subAreas.find(row => row.id === 'areas/act4-plains-of-despair'));
const wave = required(resolveChallengeWavePlan({subArea: area, fallbackArchetypeId: 'monsters/act4.damned',
  fallbackLevel: area.areaLevel, seed: retained.runSeed, challengeOrdinal: retained.ordinal, mode: 'manual'})
  .waves.find(row => row.source?.kind === 'bossEncounter'));
const hero = required(snapshot.playerTeam.find(unit => unit.kind === 'hero'));
const outcome = retained.outcome as unknown as {
  winner: string | null; finalPlayerTeam: CombatUnit[]; finalEnemyTeam: CombatUnit[];
};

describe('BUG509 earned Izual victory credits its ordinary original escorts', () => {
  it('reconstructs the exact current authored enemies and retains the actual living hero victory', () => {
    const rng = createRng(snapshot.seed);
    const enemies = withDefaultGridPositions(wave.spawns.map(spawn => buildMonsterUnit({
      def: required(monsters.find(row => row.id === spawn.archetypeId)), level: spawn.level,
      tier: spawn.tier, rng, index: spawn.index
    })));
    expect(enemies).toEqual(snapshot.enemyTeam);
    expect(enemies.map(unit => unit.tier)).toEqual(['boss', 'trash', 'trash']);
    expect(outcome.winner).toBe('player');
    expect(outcome.finalPlayerTeam.find(unit => unit.id === hero.id)?.life).toBeGreaterThan(0);
    expect(outcome.finalEnemyTeam.every(unit => unit.life <= 0)).toBe(true);
  });

  it('captures and accepts the exact earned boss and two ordinary guards without replaying combat', () => {
    const encounter = required(captureAct4Encounter(4, area.id, wave, snapshot.enemyTeam));
    expect(encounter.originalMemberIds).toEqual(snapshot.enemyTeam.map(unit => unit.id));
    expect(hasOriginalAct4Victory(encounter, hero.id, outcome)).toBe(true);
  });

  it('rejects a boss-role substitution in an ordinary guard spawn or input actor', () => {
    const valid = required(captureAct4Encounter(4, area.id, wave, snapshot.enemyTeam));
    expect(hasOriginalAct4Victory(valid, hero.id, outcome)).toBe(true);
    for (const index of [1, 2]) {
      const badWave: WaveSpec = {...wave, spawns: wave.spawns.map((spawn, position) =>
        position === index ? {...spawn, tier: 'boss'} : spawn)};
      const badEnemies = snapshot.enemyTeam.map((unit, position) => position === index ? {...unit, tier: 'boss' as const} : unit);
      expect(captureAct4Encounter(4, area.id, badWave, snapshot.enemyTeam)).toBeUndefined();
      expect(captureAct4Encounter(4, area.id, wave, badEnemies)).toBeUndefined();
      expect(captureAct4Encounter(4, area.id, badWave, badEnemies)).toBeUndefined();
    }
  });

  it('checks original escort identity, role, mortality and multiplicity again at settlement', () => {
    const encounter = required(captureAct4Encounter(4, area.id, wave, snapshot.enemyTeam));
    for (const index of [1, 2]) {
      for (const patch of [{id: 'replacement'}, {tier: 'boss' as const}, {life: 1}, {life: NaN},
        {monsterArchetypeId: 'monsters/act4.izual'}]) {
        const finalEnemyTeam = outcome.finalEnemyTeam.map((unit, position) => position === index ? {...unit, ...patch} : unit);
        expect(hasOriginalAct4Victory(encounter, hero.id, {...outcome, finalEnemyTeam})).toBe(false);
      }
    }
    expect(hasOriginalAct4Victory(encounter, hero.id, {...outcome,
      finalEnemyTeam: outcome.finalEnemyTeam.slice(0, 2)})).toBe(false);
    expect(hasOriginalAct4Victory(encounter, hero.id, {...outcome,
      finalEnemyTeam: [...outcome.finalEnemyTeam, required(outcome.finalEnemyTeam[1])]})).toBe(false);
    const wrongBoss = snapshot.enemyTeam.map((unit, index) => index === 0 ? {...unit, tier: 'trash' as const} : unit);
    expect(captureAct4Encounter(4, area.id, wave, wrongBoss)).toBeUndefined();
    expect(ACT4_ENCOUNTERS[1].members).toHaveLength(4);
    expect(ACT4_ENCOUNTERS[2].members).toEqual(['monsters/act4.diablo']);
  });
});
